import * as XLSX from 'xlsx';
import OpenAI from 'openai';
import {
  ExcelColumn,
  XBRLMapping,
  OpenAIMappingResponse,
  PromptConfig,
  FormData,
  ProcessingError,
  DataTypeAnalysis
} from '@/types';

// File validation utilities
export const validateExcelFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    '.xlsx',
    '.xls'
  ];

  if (file.size > maxSize) {
    return { isValid: false, error: 'Datei ist zu groß. Maximum: 10MB.' };
  }

  const isValidType = allowedTypes.some(type =>
    file.type === type || file.name.toLowerCase().endsWith(type.replace('application/vnd.', '').replace('officedocument.', '').replace('spreadsheetml.', ''))
  );

  if (!isValidType) {
    return { isValid: false, error: 'Ungültiger Dateityp. Nur Excel-Dateien (.xlsx, .xls) sind erlaubt.' };
  }

  return { isValid: true };
};

// Excel parsing functions
export const parseExcelFile = async (file: File): Promise<ExcelColumn[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Get the first worksheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    if (!worksheet) {
      throw new Error('Keine Arbeitsblätter in der Excel-Datei gefunden.');
    }

    // Convert to JSON to analyze structure
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!jsonData || jsonData.length === 0) {
      throw new Error('Die Excel-Datei enthält keine Daten.');
    }

    // Get headers from first row
    const headers = jsonData[0] as string[];

    if (!headers || headers.length === 0) {
      throw new Error('Keine Spaltenüberschriften gefunden.');
    }

    // Analyze columns and their data types
    const columns: ExcelColumn[] = headers.map((header, index) => {
      const columnData = jsonData.slice(1).map(row => (row as any[])[index]).filter(val => val != null);
      const sampleValues = columnData.slice(0, 5); // First 5 non-null values

      // Determine data type based on sample values
      let type: ExcelColumn['type'] = 'string';
      if (sampleValues.length > 0) {
        const firstValue = sampleValues[0];
        if (typeof firstValue === 'number') {
          type = 'number';
        } else if (firstValue instanceof Date) {
          type = 'date';
        } else if (typeof firstValue === 'boolean') {
          type = 'boolean';
        }
      }

      return {
        name: header?.toString() || `Spalte_${index + 1}`,
        index,
        type,
        sampleValues
      };
    });

    return columns.filter(col => col.name.trim() !== '');
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error(`Fehler beim Lesen der Excel-Datei: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
};

// Load GAAP tags for HGB regulation
async function loadGaapTags(): Promise<{tag: string; label: string}[]> {
  try {
    const gaapTags = await import("../src/data/gaap_tags_2024.json").then(m => m.default);
    return gaapTags;
  } catch (error) {
    console.warn('Could not load GAAP tags, falling back to defaults:', error);
    return [];
  }
}

// OpenAI prompt generation
const generateMappingPrompt = async (config: PromptConfig): Promise<string> => {
  const { recipient, regulation, perspective, columns } = config;

  let availableTagsSection = '';
  
  // For HGB/E-Bilanz, load and include the GAAP tags
  if (regulation === 'HGB') {
    const gaapTags = await loadGaapTags();
    if (gaapTags.length > 0) {
      // Filter for relevant balance sheet tags based on perspective
      let relevantTags = gaapTags;
      
      if (perspective === 'Bilanz') {
        // For balance sheet, focus on bs.ass (assets) and bs.eqLiab (equity & liabilities)
        relevantTags = gaapTags.filter(tag => 
          tag.tag.includes('bs.ass') || 
          tag.tag.includes('bs.eqLiab') ||
          tag.tag.includes('bs.equity') ||
          tag.tag === 'de-gaap-ci:bs.ass' ||
          tag.tag === 'de-gaap-ci:bs.eqLiab'
        ).slice(0, 150); // Increased limit for balance sheet
      }
      
      availableTagsSection = `
**Verfügbare DE-GAAP Tags für E-Bilanz (${perspective}):**
${relevantTags.map(tag => `- ${tag.tag}: ${tag.label}`).join('\n')}

**Wichtig:** Verwenden Sie ausschließlich Tags aus der DE-GAAP Taxonomie (de-gaap-ci:*) für HGB-Meldungen.
**Bilanz-Struktur:** 
- Aktiva: de-gaap-ci:bs.ass.* (Anlagevermögen: bs.ass.fixAss.*, Umlaufvermögen: bs.ass.currAss.*)
- Passiva: de-gaap-ci:bs.eqLiab.* (Eigenkapital: bs.eqLiab.equity.*, Verbindlichkeiten: bs.eqLiab.liab.*)`;
    }
  }

  return `Sie sind ein Experte für XBRL-Taxonomien und Finanzberichterstattung. Ihre Aufgabe ist es, Excel-Spalten den entsprechenden XBRL-Tags zuzuordnen.

**Kontext:**
- Empfänger: ${recipient}
- Vorschrift: ${regulation}
- Perspektive: ${perspective}

**Excel-Spalten die gemappt werden sollen:**
${columns.map((col, index) => `${index + 1}. "${col}"`).join('\n')}
${availableTagsSection}

**Anweisungen:**
1. Ordnen Sie JEDE EINZELNE Excel-Spalte dem passendsten XBRL-Tag zu - keine Spalte auslassen!
2. Berücksichtigen Sie den spezifischen Kontext (${recipient}, ${regulation}, ${perspective})
3. Geben Sie für jede Zuordnung eine Konfidenz zwischen 0 und 1 an
4. Fügen Sie kurze Beschreibungen hinzu, warum diese Zuordnung sinnvoll ist
5. ${regulation === 'HGB' ? 'Verwenden Sie ausschließlich DE-GAAP Tags (de-gaap-ci:*) für die E-Bilanz' : 'Verwenden Sie etablierte XBRL-Taxonomien (z.B. IFRS, GAAP, lokale Standards)'}
6. Verwenden Sie spezifische Tags für jeden Bilanzposten - NICHT nur generische Tags wie "bs.ass"
7. Für Bilanzposten verwenden Sie die Hierarchie: Summen → Hauptgruppen → Untergruppen → Einzelposten
8. Alle Werte müssen dataType "monetary" haben für Bilanzposten
9. WICHTIG: Erstellen Sie für ALLE Excel-Spalten ein Mapping - keine Spalte überspringen!

**Mapping-Beispiele für deutsche Bilanz:**
${regulation === 'HGB' ? `
- "Summe Aktiva" → "de-gaap-ci:bs.ass"
- "Anlagevermögen" → "de-gaap-ci:bs.ass.fixAss"  
- "Sachanlagen" → "de-gaap-ci:bs.ass.fixAss.tan"
- "Umlaufvermögen" → "de-gaap-ci:bs.ass.currAss"
- "Kassenbestand" → "de-gaap-ci:bs.ass.currAss.cashEquiv.cash"
- "Bankguthaben" → "de-gaap-ci:bs.ass.currAss.cashEquiv.bank"
- "Forderungen aus Lieferungen und Leistungen" → "de-gaap-ci:bs.ass.currAss.receiv.trade"
- "Vorräte" → "de-gaap-ci:bs.ass.currAss.inventory"
- "Summe Passiva" → "de-gaap-ci:bs.eqLiab"
- "Eigenkapital" → "de-gaap-ci:bs.eqLiab.equity"
- "Gezeichnetes Kapital" → "de-gaap-ci:bs.eqLiab.equity.subscribed"
- "Gewinnrücklagen" → "de-gaap-ci:bs.eqLiab.equity.retainedEarnings"
- "Verbindlichkeiten" → "de-gaap-ci:bs.eqLiab.liab"
- "Verbindlichkeiten gegenüber Kreditinstituten" → "de-gaap-ci:bs.eqLiab.liab.bank"
- "Rückstellungen" → "de-gaap-ci:bs.eqLiab.provisions"
` : ''}

**Antwortformat (JSON):**
{
  "mappings": [
    {
      "excelColumn": "Spaltenname",
      "xbrlTag": "${regulation === 'HGB' ? 'de-gaap-ci:bs.ass' : 'ifrs-full:Assets'}",
      "confidence": 0.95,
      "description": "Kurze Erklärung der Zuordnung",
      "dataType": "monetary",
      "namespace": "${regulation === 'HGB' ? 'de-gaap-ci' : 'ifrs-full'}"
    }
  ],
  "reasoning": "Allgemeine Erklärung der Mapping-Strategie",
  "warnings": ["Eventuelle Warnungen oder Unsicherheiten"],
  "confidence_score": 0.85
}

**Wichtige Hinweise:**
- Verwenden Sie nur existierende XBRL-Tags aus der entsprechenden Taxonomie
- ${regulation === 'HGB' ? 'Für E-Bilanz: Nutzen Sie die deutsche GAAP-Taxonomie (de-gaap-ci-2024-04-01)' : 'Berücksichtigen Sie die deutsche Finanzberichterstattung'}
- Bei Unsicherheiten geben Sie niedrigere Konfidenzwerte an
- Unterscheiden Sie zwischen monetären, dezimalen und Text-Werten

Antworten Sie ausschließlich mit validen JSON.`;
};

// OpenAI API call for mapping generation
export const generateXBRLMapping = async (
  formData: FormData,
  columns: ExcelColumn[]
): Promise<OpenAIMappingResponse> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API Key ist nicht konfiguriert.');
    }

    // Initialize OpenAI client (only on server side)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANISATION
    });
    const prompt = await generateMappingPrompt({
      recipient: formData.recipient as any,
      regulation: formData.regulation as any,
      perspective: formData.perspective as any,
      columns: columns.map(col => col.name)
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Sie sind ein Experte für XBRL-Taxonomien und deutsche E-Bilanz. Antworten Sie immer mit validen JSON und erstellen Sie für JEDE Excel-Spalte ein Mapping.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('Keine Antwort von OpenAI erhalten.');
    }

    const mappingResponse: OpenAIMappingResponse = JSON.parse(responseContent);

    // Validate response structure
    if (!mappingResponse.mappings || !Array.isArray(mappingResponse.mappings)) {
      throw new Error('Ungültige Antwortstruktur von OpenAI.');
    }

    // Ensure all required fields are present
    mappingResponse.mappings = mappingResponse.mappings.map(mapping => ({
      excelColumn: mapping.excelColumn || '',
      xbrlTag: mapping.xbrlTag || '',
      confidence: Math.max(0, Math.min(1, mapping.confidence || 0)),
      description: mapping.description || '',
      dataType: mapping.dataType || 'string',
      namespace: mapping.namespace || 'unknown'
    }));

    return mappingResponse;
  } catch (error) {
    console.error('Error generating XBRL mapping:', error);

    if (error instanceof Error && error.message.includes('JSON')) {
      throw new Error('Fehler beim Verarbeiten der OpenAI-Antwort. Bitte versuchen Sie es erneut.');
    }

    if (error instanceof Error && error.message.includes('API')) {
      throw new Error('OpenAI API Fehler. Überprüfen Sie die API-Konfiguration.');
    }

    throw new Error(`Fehler beim Generieren des XBRL-Mappings: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
};

/**
 * Analyzes Excel column data types using OpenAI for language-independent detection
 */
export const analyzeColumnDataTypes = async (
  columns: ExcelColumn[],
  formData: FormData
): Promise<ExcelColumn[]> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API Key ist nicht konfiguriert.');
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANISATION
    });

    // Create analysis prompt for data type detection
    const analysisPrompt = `
Analyze these Excel column headers for financial reporting (${formData.regulation}, ${formData.perspective}) and determine their data types.

**Context:**
- Regulation: ${formData.regulation}
- Report Type: ${formData.perspective}
- Institution: ${formData.recipient}

**Columns to analyze:**
${columns.map((col, idx) => `${idx + 1}. "${col.name}" (sample values: ${col.sampleValues?.slice(0, 3).join(', ') || 'N/A'})`).join('\n')}

**Data Types to classify:**
- "monetary": Currency amounts (€, $, etc.) - requires unitRef="u1", decimals="0"
- "decimal": Percentages, ratios, factors - requires unitRef="pure", decimals="2" 
- "shares": Number of shares, units, counts - requires unitRef="shares", decimals="0"
- "boolean": True/false, yes/no values - no unitRef needed
- "date": Date values - no unitRef needed
- "string": Text values - no unitRef needed

For each column, provide:
1. Most likely dataType
2. hasNumericIndicator (true if represents numeric value for XBRL)
3. confidence (0.0-1.0)
4. reasoning (brief explanation)
5. suggestedUnit (u1/pure/shares if numeric)
6. suggestedDecimals (string: "0", "2", etc. if numeric)

**Response format (JSON only):**
{
  "analyses": [
    {
      "columnName": "Column Name",
      "dataType": "monetary|decimal|shares|boolean|date|string",
      "hasNumericIndicator": true|false,
      "confidence": 0.95,
      "reasoning": "Brief explanation",
      "suggestedUnit": "u1|pure|shares",
      "suggestedDecimals": "0|2"
    }
  ]
}

Respond with valid JSON only.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in financial data analysis and XBRL standards. Analyze column headers to determine appropriate data types for financial reporting. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('Keine Antwort von OpenAI für Datentyp-Analyse erhalten.');
    }

    const analysisResponse: { analyses: DataTypeAnalysis[] } = JSON.parse(responseContent);

    if (!analysisResponse.analyses || !Array.isArray(analysisResponse.analyses)) {
      throw new Error('Ungültige Antwortstruktur für Datentyp-Analyse.');
    }

    // Map the analysis results back to the columns
    const analyzedColumns = columns.map(column => {
      const analysis = analysisResponse.analyses.find(
        a => a.columnName === column.name || 
             (a.columnName && column.name.toLowerCase().includes(a.columnName.toLowerCase())) ||
             (a.columnName && a.columnName.toLowerCase().includes(column.name.toLowerCase()))
      );

      if (analysis) {
        const dataTypeAnalysis: DataTypeAnalysis = {
          dataType: analysis.dataType,
          hasNumericIndicator: analysis.hasNumericIndicator,
          confidence: Math.max(0, Math.min(1, analysis.confidence)),
          reasoning: analysis.reasoning,
          suggestedUnit: analysis.suggestedUnit,
          suggestedDecimals: analysis.suggestedDecimals
        };

        return {
          ...column,
          dataTypeAnalysis
        };
      }

      // Fallback if no analysis found
      return {
        ...column,
        dataTypeAnalysis: {
          dataType: 'monetary' as const, // Default for financial reporting
          hasNumericIndicator: true,
          confidence: 0.5,
          reasoning: 'Default classification due to missing analysis',
          suggestedUnit: 'u1' as const,
          suggestedDecimals: '0'
        }
      };
    });

    return analyzedColumns;

  } catch (error) {
    console.error('Error analyzing column data types:', error);
    
    // Return columns with default analysis if OpenAI fails
    return columns.map(column => ({
      ...column,
      dataTypeAnalysis: {
        dataType: 'monetary' as const,
        hasNumericIndicator: true,
        confidence: 0.3,
        reasoning: 'Fallback due to analysis error',
        suggestedUnit: 'u1' as const,
        suggestedDecimals: '0'
      }
    }));
  }
};

// Data transformation utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatConfidence = (confidence: number): string => {
  return `${Math.round(confidence * 100)}%`;
};

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'text-green-600 bg-green-50';
  if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

// Form validation utilities
export const validateFormData = (formData: FormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!formData.recipient) {
    errors.push('Bitte wählen Sie einen Empfänger aus.');
  }

  if (!formData.regulation) {
    errors.push('Bitte wählen Sie eine Vorschrift aus.');
  }

  if (!formData.perspective) {
    errors.push('Bitte wählen Sie eine Perspektive aus.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Error handling utilities
export const createProcessingError = (
  code: string,
  message: string,
  details?: string
): ProcessingError => ({
  code,
  message,
  details,
  timestamp: new Date()
});

export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

// Session storage utilities (for client-side state management)
export const saveToSessionStorage = (key: string, data: any): void => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to session storage:', error);
    }
  }
};

export const loadFromSessionStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window !== 'undefined') {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Failed to load from session storage:', error);
    }
  }
  return defaultValue;
};

export const removeFromSessionStorage = (key: string): void => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from session storage:', error);
    }
  }
};

// Debounce utility for user input
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Generate unique IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// URL and navigation utilities
export const createSearchParams = (params: Record<string, string>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  return searchParams.toString();
};
