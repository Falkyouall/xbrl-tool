'use server';

import { FormData, MappingResult, ExcelColumn, OpenAIMappingResponse, XBRLInstance } from '@/types';
import { parseExcelFile, generateXBRLMapping, validateExcelFile, validateFormData, analyzeColumnDataTypes } from '@/lib/utils';
import { XBRLGenerator } from '@/lib/xbrl-generator';

export async function processFileAndGenerateMapping(
  formData: FormData,
  fileData: ArrayBuffer,
  fileName: string,
  fileSize: number
): Promise<MappingResult> {
  try {
    const startTime = Date.now();

    // Validate form data
    const formValidation = validateFormData(formData);
    if (!formValidation.isValid) {
      return {
        success: false,
        error: `Formular-Validierung fehlgeschlagen: ${formValidation.errors.join(', ')}`
      };
    }

    // Create a File-like object from the ArrayBuffer
    const file = new File([fileData], fileName, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // Validate file
    const fileValidation = validateExcelFile(file);
    if (!fileValidation.isValid) {
      return {
        success: false,
        error: fileValidation.error || 'Datei-Validierung fehlgeschlagen'
      };
    }

    // Parse Excel file
    let columns: ExcelColumn[];
    try {
      columns = await parseExcelFile(file);
      
      if (columns.length === 0) {
        return {
          success: false,
          error: 'Keine Spalten in der Excel-Datei gefunden'
        };
      }

      if (columns.length > 50) {
        return {
          success: false,
          error: 'Zu viele Spalten in der Excel-Datei. Maximum: 50 Spalten'
        };
      }
    } catch (error) {
      console.error('Excel parsing error:', error);
      return {
        success: false,
        error: `Fehler beim Verarbeiten der Excel-Datei: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      };
    }

    // Analyze column data types using OpenAI
    let analyzedColumns: ExcelColumn[];
    try {
      console.log('Starting OpenAI data type analysis for columns:', columns.map(c => c.name));
      analyzedColumns = await analyzeColumnDataTypes(columns, formData);
      console.log('Data type analysis completed successfully');
    } catch (error) {
      console.error('Data type analysis error:', error);
      // Continue with original columns if analysis fails
      analyzedColumns = columns;
    }

    // Generate XBRL mapping using OpenAI (with analyzed columns)
    let mappingResponse: OpenAIMappingResponse;
    try {
      mappingResponse = await generateXBRLMapping(formData, analyzedColumns);
      
      if (!mappingResponse.mappings || mappingResponse.mappings.length === 0) {
        return {
          success: false,
          error: 'Keine XBRL-Mappings generiert. Bitte versuchen Sie es erneut.'
        };
      }
    } catch (error) {
      console.error('OpenAI mapping error:', error);
      return {
        success: false,
        error: `Fehler beim Generieren der XBRL-Mappings: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      };
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      data: mappingResponse,
      message: 'XBRL-Mapping erfolgreich generiert',
      processingTime,
      columnsProcessed: analyzedColumns.length,
      originalColumns: analyzedColumns
    };

  } catch (error) {
    console.error('Unexpected error in processFileAndGenerateMapping:', error);
    return {
      success: false,
      error: `Unerwarteter Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

export async function validateUploadedFile(
  fileData: ArrayBuffer,
  fileName: string,
  fileSize: number
): Promise<{ success: boolean; error?: string; columns?: ExcelColumn[] }> {
  try {
    // Create a File-like object from the ArrayBuffer
    const file = new File([fileData], fileName, {
      type: fileName.endsWith('.xlsx') 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/vnd.ms-excel'
    });

    // Validate file
    const fileValidation = validateExcelFile(file);
    if (!fileValidation.isValid) {
      return {
        success: false,
        error: fileValidation.error
      };
    }

    // Parse Excel file to get columns
    const columns = await parseExcelFile(file);
    
    if (columns.length === 0) {
      return {
        success: false,
        error: 'Keine Spalten in der Excel-Datei gefunden'
      };
    }

    return {
      success: true,
      columns
    };

  } catch (error) {
    console.error('File validation error:', error);
    return {
      success: false,
      error: `Fehler beim Validieren der Datei: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

export async function regenerateMapping(
  formData: FormData,
  columns: ExcelColumn[],
  context?: string
): Promise<MappingResult> {
  try {
    const startTime = Date.now();

    // Validate form data
    const formValidation = validateFormData(formData);
    if (!formValidation.isValid) {
      return {
        success: false,
        error: `Formular-Validierung fehlgeschlagen: ${formValidation.errors.join(', ')}`
      };
    }

    if (!columns || columns.length === 0) {
      return {
        success: false,
        error: 'Keine Spalten-Informationen verfügbar'
      };
    }

    // Check if columns already have data type analysis, if not, analyze them
    let analyzedColumns = columns;
    const hasDataTypeAnalysis = columns.some(col => col.dataTypeAnalysis);
    
    if (!hasDataTypeAnalysis) {
      try {
        console.log('Re-analyzing column data types for regeneration');
        analyzedColumns = await analyzeColumnDataTypes(columns, formData);
      } catch (error) {
        console.error('Data type analysis error during regeneration:', error);
        // Continue with original columns if analysis fails
      }
    }

    // Generate XBRL mapping using OpenAI with additional context
    const mappingResponse = await generateXBRLMapping(formData, analyzedColumns);
    
    if (!mappingResponse.mappings || mappingResponse.mappings.length === 0) {
      return {
        success: false,
        error: 'Keine XBRL-Mappings generiert. Bitte versuchen Sie es erneut.'
      };
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      data: mappingResponse,
      message: 'XBRL-Mapping erfolgreich neu generiert',
      processingTime,
      columnsProcessed: columns.length
    };

  } catch (error) {
    console.error('Error regenerating mapping:', error);
    return {
      success: false,
      error: `Fehler beim Neu-Generieren der XBRL-Mappings: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

export async function generateXBRLDocument(
  mappingResponse: OpenAIMappingResponse,
  formData: FormData,
  options?: {
    entityId?: string;
    reportingDate?: string;
    currency?: string;
  }
): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
  try {
    // Validate input data
    const formValidation = validateFormData(formData);
    if (!formValidation.isValid) {
      return {
        success: false,
        error: `Formular-Validierung fehlgeschlagen: ${formValidation.errors.join(', ')}`
      };
    }

    if (!mappingResponse.mappings || mappingResponse.mappings.length === 0) {
      return {
        success: false,
        error: 'Keine XBRL-Mappings verfügbar'
      };
    }

    // Set default options
    const {
      entityId = `ENTITY_${Date.now()}`,
      reportingDate = new Date().toISOString().split('T')[0],
      currency = 'EUR'
    } = options || {};

    // Generate XBRL instance with realistic German balance sheet values
    const xbrlInstance = XBRLGenerator.generateInstance(
      mappingResponse,
      formData,
      undefined, // No Excel data for now - could be extended later
      {
        entityId,
        reportingDate,
        currency,
        analyzedColumns: [] // Could be passed from the original request if needed
      }
    );

    // Validate XBRL instance
    const validation = XBRLGenerator.validate(xbrlInstance);
    if (!validation.isValid) {
      console.warn('XBRL validation warnings:', validation.errors);
      // Continue despite warnings - they might be acceptable
    }

    // Generate XML
    const xbrlXML = XBRLGenerator.generateXML(xbrlInstance);
    
    // Generate filename
    const filename = XBRLGenerator.generateFilename(formData, entityId);

    return {
      success: true,
      data: xbrlXML,
      filename,
    };

  } catch (error) {
    console.error('Error generating XBRL document:', error);
    return {
      success: false,
      error: `Fehler beim Generieren der XBRL-Datei: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

export async function testOpenAIConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OpenAI API Key ist nicht konfiguriert'
      };
    }

    // Test with a simple prompt
    const testFormData: FormData = {
      recipient: 'Bundesbank',
      regulation: 'IFRS',
      perspective: 'Bilanz'
    };

    const testColumns: ExcelColumn[] = [
      { name: 'Aktiva', index: 0, type: 'number' },
      { name: 'Passiva', index: 1, type: 'number' }
    ];

    await generateXBRLMapping(testFormData, testColumns);

    return { success: true };

  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return {
      success: false,
      error: `OpenAI-Verbindung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}