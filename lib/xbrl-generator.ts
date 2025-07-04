import { FormData, XBRLMapping, OpenAIMappingResponse, ExcelColumn } from '@/types';

// XBRL 2.1 Standard interfaces
export interface XBRLContext {
  id: string;
  entity: {
    identifier: {
      scheme: string;
      value: string;
    };
  };
  period: {
    instant?: string;
    startDate?: string;
    endDate?: string;
  };
  scenario?: {
    explicitMember?: {
      dimension: string;
      value: string;
    }[];
  };
}

export interface XBRLUnit {
  id: string;
  measure: string;
}

export interface XBRLFact {
  name: string;
  contextRef: string;
  unitRef?: string;
  decimals?: string;
  value: string | number;
  namespace: string;
}

export interface XBRLInstance {
  contexts: XBRLContext[];
  units: XBRLUnit[];
  facts: XBRLFact[];
  schemaRef: string;
  metadata: {
    entity: string;
    period: string;
    regulation: string;
    perspective: string;
  };
}

// XBRL 2.1 Namespace definitions
const XBRL_NAMESPACES = {
  xbrli: 'http://www.xbrl.org/2003/instance',
  link: 'http://www.xbrl.org/2003/linkbase',
  xlink: 'http://www.w3.org/1999/xlink',
  xsi: 'http://www.w3.org/2001/XMLSchema-instance',
  xbrldi: 'http://xbrl.org/2006/xbrldi',
  iso4217: 'http://www.xbrl.org/2003/iso4217',
  'ifrs-full': 'http://xbrl.ifrs.org/taxonomy/2023-03-23/ifrs-full',
  'finrep': 'http://www.eba.europa.eu/xbrl/crr/fws/finrep/its-005-2020',
  'corep': 'http://www.eba.europa.eu/xbrl/crr/fws/corep/its-005-2020',
  'de-gaap-ci': 'http://www.xbrl.de/taxonomies/de-gaap-ci-2024-04-01'
};

// Get primary namespace based on regulation
function getPrimaryNamespace(regulation: string): string {
  switch (regulation) {
    case 'FINREP':
      return 'finrep';
    case 'COREP':
      return 'corep';
    case 'HGB':
      return 'de-gaap-ci';
    case 'IFRS':
    default:
      return 'ifrs-full';
  }
}

// Tag mappings for different regulations
const TAG_MAPPINGS = {
  'FINREP': {
    'CashAndCashEquivalents': 'finrep:CashBalancesAtCentralBanks',
    'LoansAndReceivables': 'finrep:LoansAndAdvances',
    'EquityInstruments': 'finrep:EquityInstruments',
    'FinancialLiabilitiesMeasuredAtAmortisedCost': 'finrep:FinancialLiabilitiesAtAmortisedCost',
    'DerivativeFinancialInstruments': 'finrep:Derivatives',
    'DepositsByBanks': 'finrep:Deposits',
    'Assets': 'finrep:TotalAssets',
    'Equity': 'finrep:Equity',
    'Liabilities': 'finrep:TotalLiabilities',
    'Cash': 'finrep:CashBalancesAtCentralBanks',
    'Loans': 'finrep:LoansAndAdvances',
    'Securities': 'finrep:EquityInstruments',
    'Derivatives': 'finrep:Derivatives',
    'OtherAssets': 'finrep:OtherAssets',
    'Deposits': 'finrep:Deposits',
    'Debt': 'finrep:DebtSecuritiesIssued',
    'Provisions': 'finrep:Provisions'
  },
  'COREP': {
    'CashAndCashEquivalents': 'corep:CashAndCashEquivalents',
    'LoansAndReceivables': 'corep:LoansAndAdvances',
    'EquityInstruments': 'corep:EquityInstruments',
    'Assets': 'corep:TotalAssets',
    'Equity': 'corep:OwnFunds',
    'RiskWeightedAssets': 'corep:RiskWeightedExposureAmounts',
    'CapitalRatio': 'corep:CommonEquityTier1Ratio',
    'Tier1Capital': 'corep:Tier1Capital',
    'TotalCapital': 'corep:TotalCapital'
  },
  'IFRS': {
    'CashAndCashEquivalents': 'ifrs-full:CashAndCashEquivalents',
    'LoansAndReceivables': 'ifrs-full:LoansAndReceivables',
    'EquityInstruments': 'ifrs-full:EquityInstruments',
    'FinancialLiabilitiesMeasuredAtAmortisedCost': 'ifrs-full:FinancialLiabilitiesMeasuredAtAmortisedCost',
    'DerivativeFinancialInstruments': 'ifrs-full:DerivativeFinancialInstruments',
    'DepositsByBanks': 'ifrs-full:DepositsByBanks',
    'Assets': 'ifrs-full:Assets',
    'Equity': 'ifrs-full:Equity',
    'Liabilities': 'ifrs-full:Liabilities'
  },
  'HGB': {
    'CashAndCashEquivalents': 'de-gaap-ci:bs.ass.currAss.cashEquiv',
    'LoansAndReceivables': 'de-gaap-ci:bs.ass.currAss.receiv',
    'Assets': 'de-gaap-ci:bs.ass',
    'Equity': 'de-gaap-ci:bs.eqLiab.eq',
    'Liabilities': 'de-gaap-ci:bs.eqLiab.liab',
    'Revenue': 'de-gaap-ci:is.netIncome.revenue'
  }
};

// Schema reference mapping based on regulation
// const SCHEMA_REFERENCES = {
//   'IFRS': 'http://xbrl.ifrs.org/taxonomy/2023-03-23/full_ifrs/full_ifrs-cor_2023-03-23.xsd',
//   'FINREP': 'http://www.eba.europa.eu/eu/fr/xbrl/crr/fws/finrep/its-005-2020/2023-10-31/mod/finrep_cor.xsd',
//   'COREP': 'http://www.eba.europa.eu/eu/fr/xbrl/crr/fws/corep/its-005-2020/2023-10-31/mod/corep_cor.xsd',
//   'HGB': 'http://www.xbrl.de/taxonomies/de-gaap/2023-12-31/de-gaap-ci-2023-12-31.xsd'
// };
const SCHEMA_REFERENCES = {
  'IFRS': 'http://xbrl.ifrs.org/taxonomy/2023-03-23/full_ifrs/full_ifrs-cor_2023-03-23.xsd',
  'FINREP': './EBA_CRD_IV_XBRL_3.2_Dictionary_3.2.2.0/www.eba.europa.eu/eu/fr/xbrl/crr/fws/fws.xsd',
  'COREP': 'http://www.eba.europa.eu/eu/fr/xbrl/crr/fws/corep/its-005-2020/2023-10-31/mod/corep_cor.xsd',
  'HGB': './taxonomies/de-gaap-ci-2024-04-01/de-gaap-ci-2024-04-01.xsd'
};

// For local validation, we need absolute paths
function getSchemaReferenceForLocalValidation(regulation: string, workingDir?: string): string {
  if (regulation === 'HGB' && workingDir) {
    return `${workingDir}/taxonomies/de-gaap-ci-2024-04-01/de-gaap-ci-2024-04-01.xsd`;
  }
  return SCHEMA_REFERENCES[regulation as keyof typeof SCHEMA_REFERENCES] || SCHEMA_REFERENCES['IFRS'];
}

// Entity identifier schemes
const ENTITY_SCHEMES = {
  'Bundesbank': 'http://www.bundesbank.de',
  'BaFin': 'http://www.bafin.de',
  'Interne Meldung': 'http://internal.reporting'
};

/**
 * Generates XBRL 2.1 compliant XML from mapping results
 */
export function generateXBRLInstance(
  mappingResponse: OpenAIMappingResponse,
  formData: FormData,
  excelData?: any[],
  options?: {
    entityId?: string;
    reportingDate?: string;
    currency?: string;
    analyzedColumns?: ExcelColumn[];
  }
): XBRLInstance {
  const {
    entityId = 'ENTITY_001',
    reportingDate = new Date().toISOString().split('T')[0],
    currency = 'EUR',
    analyzedColumns = []
  } = options || {};

  // Generate contexts
  const contexts: XBRLContext[] = [
    {
      id: 'c1',
      entity: {
        identifier: {
          scheme: ENTITY_SCHEMES[formData.recipient as keyof typeof ENTITY_SCHEMES] || ENTITY_SCHEMES['Interne Meldung'],
          value: entityId
        }
      },
      period: formData.perspective === 'Bilanz'
        ? { instant: reportingDate }
        : {
          startDate: `${reportingDate.substring(0, 4)}-01-01`,
          endDate: reportingDate
        }
    }
  ];

  // Generate units
  const units: XBRLUnit[] = [
    {
      id: 'u1',
      measure: `iso4217:${currency}`
    },
    {
      id: 'pure',
      measure: 'pure'
    },
    {
      id: 'shares',
      measure: 'shares'
    }
  ];

  // Generate facts from mappings - avoid duplicates and use realistic values
  const usedTags = new Set<string>();
  const facts: XBRLFact[] = mappingResponse.mappings
    .filter(mapping => {
      // Skip mappings with very low confidence (lowered threshold)
      if (mapping.confidence < 0.2) return false;

      // Avoid duplicate tags
      const tagKey = `${mapping.xbrlTag}`;
      if (usedTags.has(tagKey)) return false;
      usedTags.add(tagKey);

      return true;
    })
    .map((mapping, index) => {
      // Convert to regulation-specific tag
      const regulationTag = convertToRegulationTag(mapping.xbrlTag, formData.regulation);
      const namespace = getNamespaceFromTag(regulationTag);
      const elementName = getElementNameFromTag(regulationTag);

      // Use OpenAI data type analysis if available, otherwise use mapping dataType
      let inferredDataType = mapping.dataType;
      let suggestedUnit: string | undefined;
      let suggestedDecimals: string | undefined;
      
      // Find the corresponding analyzed column
      const analyzedColumn = analyzedColumns.find(col => col.name === mapping.excelColumn);
      
      if (analyzedColumn?.dataTypeAnalysis) {
        // Use OpenAI analysis results
        inferredDataType = analyzedColumn.dataTypeAnalysis.dataType;
        suggestedUnit = analyzedColumn.dataTypeAnalysis.suggestedUnit;
        suggestedDecimals = analyzedColumn.dataTypeAnalysis.suggestedDecimals;
        
        console.log(`Using OpenAI analysis for "${mapping.excelColumn}": ${inferredDataType} (confidence: ${analyzedColumn.dataTypeAnalysis.confidence})`);
      } else {
        // Fallback to default for financial reporting
        inferredDataType = inferredDataType || 'monetary';
        console.log(`Using fallback dataType for "${mapping.excelColumn}": ${inferredDataType}`);
      }
      
      // Determine unit based on OpenAI suggestions or inferred data type
      let unitRef: string | undefined;
      if (suggestedUnit) {
        unitRef = suggestedUnit;
      } else {
        switch (inferredDataType) {
          case 'monetary':
            unitRef = 'u1';
            break;
          case 'shares':
            unitRef = 'shares';
            break;
          case 'decimal':
            unitRef = 'pure';
            break;
          default:
            // Default to monetary for financial reporting
            unitRef = 'u1';
            break;
        }
      }

      // Generate realistic sample values based on German balance sheet structure
      let value: string | number = 0;
      if (excelData && excelData.length > 0) {
        const rowData = excelData[0]; // Use first row as example
        if (rowData[mapping.excelColumn]) {
          value = rowData[mapping.excelColumn];
        }
      } else {
        // Generate realistic values based on German balance sheet context
        value = generateGermanBalanceSheetValue(mapping.excelColumn, inferredDataType);
      }

      // Ensure ALL values are numeric for XBRL (German balance sheet context)
      if (typeof value === 'string') {
        // Try to parse numeric value from string
        const cleanedValue = value.replace(/[^\d.-]/g, '');
        const numericValue = parseFloat(cleanedValue);
        
        if (isNaN(numericValue) || value.toLowerCase().includes('sample') || value.toLowerCase().includes('n/a')) {
          // Fallback to realistic German balance sheet value
          value = generateGermanBalanceSheetValue(mapping.excelColumn, inferredDataType);
        } else {
          value = numericValue;
        }
      }
      
      // Final safety check - ALWAYS ensure numeric value for XBRL
      if (typeof value !== 'number') {
        if (inferredDataType === 'monetary') {
          value = 100000;
        } else if (inferredDataType === 'shares') {
          value = 1000;
        } else {
          value = 0;
        }
      }

      // Use OpenAI suggestions or determine based on data type
      let finalUnitRef: string | undefined = suggestedUnit || unitRef;
      let finalDecimals: string | undefined = suggestedDecimals;
      
      // If no OpenAI suggestion for decimals, use defaults based on data type
      if (!finalDecimals) {
        if (inferredDataType === 'monetary') {
          finalDecimals = '0'; // No decimal places for currency amounts
        } else if (inferredDataType === 'decimal') {
          finalDecimals = '2'; // 2 decimal places for ratios/percentages
        } else if (inferredDataType === 'shares') {
          finalDecimals = '0'; // Whole shares
        } else if (typeof value === 'number') {
          finalDecimals = '0'; // Default for numeric values
        }
      }
      
      // For non-numeric types (string, boolean, date), no unitRef or decimals needed
      if (inferredDataType === 'string' || inferredDataType === 'boolean' || inferredDataType === 'date') {
        finalUnitRef = undefined;
        finalDecimals = undefined;
      }

      return {
        name: elementName,
        contextRef: 'c1',
        unitRef: finalUnitRef,
        decimals: finalDecimals,
        value,
        namespace
      };
    });

  return {
    contexts,
    units,
    facts,
    schemaRef: SCHEMA_REFERENCES[formData.regulation as keyof typeof SCHEMA_REFERENCES] || SCHEMA_REFERENCES['IFRS'],
    metadata: {
      entity: entityId,
      period: reportingDate,
      regulation: formData.regulation,
      perspective: formData.perspective
    }
  };
}

/**
 * Escapes special XML characters
 */
function escapeXML(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts XBRL instance to XML string (XBRL 2.1 compliant)
 */
export function generateXBRLXML(instance: XBRLInstance): string {
  const { contexts, units, facts, schemaRef, metadata } = instance;

  // Build namespace declarations (exclude xbrli since it's the default namespace)
  const namespaceDeclarations = Object.entries(XBRL_NAMESPACES)
    .filter(([prefix]) => prefix !== 'xbrli')
    .map(([prefix, uri]) => `xmlns:${prefix}="${uri}"`)
    .join('\n    ');

  // Build schema reference
  const schemaRefXML = `
  <link:schemaRef
    xlink:type="simple"
    xlink:href="${schemaRef}"
    xlink:arcrole="http://www.w3.org/1999/xlink/properties/linkbase"/>`;

  // Build contexts
  const contextsXML = contexts.map(context => {
    const periodXML = context.period.instant
      ? `<instant>${context.period.instant}</instant>`
      : `<startDate>${context.period.startDate}</startDate>
      <endDate>${context.period.endDate}</endDate>`;

    const scenarioXML = context.scenario?.explicitMember
      ? `<scenario>
           ${context.scenario.explicitMember.map(member =>
        `<xbrldi:explicitMember dimension="${member.dimension}">${member.value}</xbrldi:explicitMember>`
      ).join('\n           ')}
         </scenario>`
      : '';

    return `
  <context id="${escapeXML(context.id)}">
    <entity>
      <identifier scheme="${escapeXML(context.entity.identifier.scheme)}">${escapeXML(context.entity.identifier.value)}</identifier>
    </entity>
    <period>
      ${periodXML}
    </period>
    ${scenarioXML}
  </context>`;
  }).join('');

  // Build units
  const unitsXML = units.map(unit => `
  <unit id="${escapeXML(unit.id)}">
    <measure>${escapeXML(unit.measure)}</measure>
  </unit>`).join('');

  // Build facts
  const factsXML = facts.map(fact => {
    const unitAttr = fact.unitRef ? ` unitRef="${escapeXML(fact.unitRef)}"` : '';
    const decimalsAttr = fact.decimals ? ` decimals="${escapeXML(fact.decimals)}"` : '';

    return `  <${escapeXML(fact.namespace)}:${escapeXML(fact.name)} contextRef="${escapeXML(fact.contextRef)}"${unitAttr}${decimalsAttr}>${escapeXML(fact.value)}</${escapeXML(fact.namespace)}:${escapeXML(fact.name)}>`;
  }).join('\n');

  // Build complete XBRL XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<xbrl xmlns="http://www.xbrl.org/2003/instance"
    ${namespaceDeclarations}
    xsi:schemaLocation="http://www.xbrl.org/2003/instance http://www.xbrl.org/2003/xbrl-instance-2003-12-31.xsd">

  <!-- Schema Reference -->
  ${schemaRefXML}

  <!-- Metadata Comment -->
  <!--
    Generated XBRL Instance Document
    Entity: ${metadata.entity}
    Period: ${metadata.period}
    Regulation: ${metadata.regulation}
    Perspective: ${metadata.perspective}
    Generated: ${new Date().toISOString()}
  -->

  <!-- Contexts -->
  ${contextsXML}

  <!-- Units -->
  ${unitsXML}

  <!-- Facts -->
${factsXML}

</xbrl>`;

  return xml;
}

/**
 * Convert IFRS tags to regulation-specific tags
 */
function convertToRegulationTag(xbrlTag: string, regulation: string): string {
  // If already in correct format, return as-is
  if (xbrlTag.includes(':')) {
    const namespace = xbrlTag.split(':')[0];
    if (regulation === 'FINREP' && namespace === 'finrep') return xbrlTag;
    if (regulation === 'COREP' && namespace === 'corep') return xbrlTag;
    if (regulation === 'HGB' && namespace === 'de-gaap-ci') return xbrlTag;
    if (regulation === 'IFRS' && namespace === 'ifrs-full') return xbrlTag;
  }

  // Tag mapping for FINREP
  const FINREP_TAG_MAPPING: { [key: string]: string } = {
    'ifrs-full:CashAndCashEquivalents': 'finrep:CashBalancesAtCentralBanks',
    'ifrs-full:LoansAndReceivables': 'finrep:LoansAndAdvances',
    'ifrs-full:EquityInstruments': 'finrep:EquityInstruments',
    'ifrs-full:FinancialLiabilitiesMeasuredAtAmortisedCost': 'finrep:FinancialLiabilitiesAtAmortisedCost',
    'ifrs-full:DerivativeFinancialInstruments': 'finrep:Derivatives',
    'ifrs-full:DepositsByBanks': 'finrep:Deposits',
    'ifrs-full:Assets': 'finrep:TotalAssets',
    'ifrs-full:Equity': 'finrep:Equity',
    'ifrs-full:Liabilities': 'finrep:TotalLiabilities',
    'ifrs-full:PropertyPlantAndEquipment': 'finrep:PropertyPlantAndEquipment',
    'ifrs-full:IntangibleAssets': 'finrep:IntangibleAssets',
    'ifrs-full:DeferredTaxAssets': 'finrep:DeferredTaxAssets',
    'ifrs-full:OtherAssets': 'finrep:OtherAssets'
  };

  // Tag mapping for COREP
  const COREP_TAG_MAPPING: { [key: string]: string } = {
    'ifrs-full:Assets': 'corep:TotalAssets',
    'ifrs-full:Equity': 'corep:OwnFunds',
    'ifrs-full:CashAndCashEquivalents': 'corep:Cash',
    'ifrs-full:LoansAndReceivables': 'corep:LoansAndAdvances'
  };

  // Tag mapping for HGB (German GAAP)
  const HGB_TAG_MAPPING: { [key: string]: string } = {
    'ifrs-full:Assets': 'de-gaap-ci:bs.ass',
    'ifrs-full:Equity': 'de-gaap-ci:bs.eqLiab.eq',
    'ifrs-full:CashAndCashEquivalents': 'de-gaap-ci:bs.ass.currAss.cashEquiv',
    'ifrs-full:PropertyPlantAndEquipment': 'de-gaap-ci:bs.ass.fixAss.tan'
  };

  switch (regulation) {
    case 'FINREP':
      return FINREP_TAG_MAPPING[xbrlTag] || xbrlTag.replace('ifrs-full:', 'finrep:');
    case 'COREP':
      return COREP_TAG_MAPPING[xbrlTag] || xbrlTag.replace('ifrs-full:', 'corep:');
    case 'HGB':
      return HGB_TAG_MAPPING[xbrlTag] || xbrlTag.replace('ifrs-full:', 'de-gaap-ci:');
    case 'IFRS':
    default:
      // For IFRS, keep as-is or ensure ifrs-full namespace
      return xbrlTag.includes(':') ? xbrlTag : `ifrs-full:${xbrlTag}`;
  }
}

/**
 * Helper function to extract namespace from XBRL tag
 */
function getNamespaceFromTag(xbrlTag: string): string {
  const parts = xbrlTag.split(':');
  return parts.length > 1 ? parts[0] : 'ifrs-full';
}

/**
 * Helper function to extract element name from XBRL tag
 */
function getElementNameFromTag(xbrlTag: string): string {
  const parts = xbrlTag.split(':');
  return parts.length > 1 ? parts[1] : xbrlTag;
}

/**
 * Helper function to generate sample values based on data type
 */
function generateSampleValue(dataType?: string, columnName?: string): string | number {
  switch (dataType) {
    case 'monetary':
      return Math.floor(Math.random() * 1000000);
    case 'decimal':
      return Math.floor(Math.random() * 100);
    case 'shares':
      return Math.floor(Math.random() * 10000);
    case 'boolean':
      return Math.random() > 0.5 ? 'true' : 'false';
    case 'date':
      return new Date().toISOString().split('T')[0];
    default:
      // Try to infer from column name for numeric values
      if (columnName?.toLowerCase().includes('amount') ||
        columnName?.toLowerCase().includes('value') ||
        columnName?.toLowerCase().includes('betrag') ||
        columnName?.toLowerCase().includes('summe') ||
        columnName?.toLowerCase().includes('total')) {
        return Math.floor(Math.random() * 1000000);
      }
      // For numeric contexts, always return a number instead of "Sample Value"
      if (columnName) {
        const numericIndicators = ['aktiva', 'passiva', 'kapital', 'forderung', 'verbindlichkeit', 
                                  'rücklage', 'gewinn', 'verlust', 'umsatz', 'kosten', 'euro', 'eur'];
        const hasNumericIndicator = numericIndicators.some(indicator => 
          columnName.toLowerCase().includes(indicator));
        if (hasNumericIndicator) {
          return Math.floor(Math.random() * 500000);
        }
      }
      // For any unrecognized pattern, return a safe numeric value
      return 50000;
  }
}

/**
 * Generate realistic German balance sheet values based on typical German company structures
 */
function generateGermanBalanceSheetValue(columnName?: string, dataType?: string): string | number {
  if (!columnName) return generateSampleValue(dataType);

  const normalizedName = columnName.toLowerCase();

  // German balance sheet typical values (in EUR)
  const balanceSheetValues: Record<string, number> = {
    // Aktiva (Assets)
    'summe aktiva': 1500000,
    'bilanzsumme': 1500000,
    'anlagevermögen': 600000,
    'umlaufvermögen': 850000,
    'kassenbestand': 50000,
    'bank': 150000,
    'forderungen': 200000,
    'forderungen aus l&l': 200000,
    'forderungen aus lieferungen und leistungen': 200000,
    'vorräte': 300000,
    'roh-, hilfs- und betriebsstoffe': 100000,
    'fertige erzeugnisse': 200000,
    'waren': 150000,

    // Passiva (Equity & Liabilities)
    'summe passiva': 1500000,
    'eigenkapital': 600000,
    'gezeichnetes kapital': 250000,
    'gewinnrücklagen': 150000,
    'jahresüberschuss': 75000,
    'verbindlichkeiten': 750000,
    'verbindlichkeiten ggü. kreditinstituten': 400000,
    'verbindlichkeiten aus lieferungen u. leistungen': 350000,
    'verbindlichkeiten aus ll': 350000,
    'rückstellungen': 150000,
    'steuerrückstellungen': 50000
  };

  // Try exact match first
  for (const [key, value] of Object.entries(balanceSheetValues)) {
    if (normalizedName.includes(key)) {
      return value;
    }
  }

  // Fuzzy matching for common terms
  if (normalizedName.includes('aktiva') || normalizedName.includes('bilanzsumme')) {
    return 1500000;
  }
  if (normalizedName.includes('passiva')) {
    return 1500000;
  }
  if (normalizedName.includes('eigenkapital')) {
    return 600000;
  }
  if (normalizedName.includes('anlage')) {
    return 600000;
  }
  if (normalizedName.includes('umlauf')) {
    return 850000;
  }
  if (normalizedName.includes('kasse') || normalizedName.includes('cash')) {
    return 50000;
  }
  if (normalizedName.includes('forderung')) {
    return 200000;
  }
  if (normalizedName.includes('verbindlichkeit')) {
    return 400000;
  }
  if (normalizedName.includes('kredit')) {
    return 400000;
  }
  if (normalizedName.includes('rücklag')) {
    return 150000;
  }

  // Default to sample value generation
  return generateSampleValue(dataType, columnName);
}

/**
 * Creates a filename for the XBRL document
 */
export function generateXBRLFilename(formData: FormData, entityId?: string): string {
  const date = new Date().toISOString().split('T')[0];
  const entity = entityId || 'ENTITY';
  const regulation = formData.regulation.toLowerCase();
  const perspective = formData.perspective.toLowerCase().replace(/[^a-z0-9]/g, '');

  return `${entity}_${regulation}_${perspective}_${date}.xbrl`;
}

/**
 * Validates XBRL instance for basic compliance
 */
export function validateXBRLInstance(instance: XBRLInstance): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required contexts
  if (instance.contexts.length === 0) {
    errors.push('At least one context is required');
  }

  // Check context references in facts
  const contextIds = new Set(instance.contexts.map(c => c.id));
  instance.facts.forEach(fact => {
    if (!contextIds.has(fact.contextRef)) {
      errors.push(`Fact ${fact.name} references non-existent context ${fact.contextRef}`);
    }
  });

  // Check unit references in facts
  const unitIds = new Set(instance.units.map(u => u.id));
  instance.facts.forEach(fact => {
    if (fact.unitRef && !unitIds.has(fact.unitRef)) {
      errors.push(`Fact ${fact.name} references non-existent unit ${fact.unitRef}`);
    }
  });

  // Check for duplicate context IDs
  const contextIdCounts = instance.contexts.reduce((acc, context) => {
    acc[context.id] = (acc[context.id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(contextIdCounts).forEach(([id, count]) => {
    if (count > 1) {
      errors.push(`Duplicate context ID: ${id}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Export functions for use in components
 */
export const XBRLGenerator = {
  generateInstance: generateXBRLInstance,
  generateXML: generateXBRLXML,
  generateFilename: generateXBRLFilename,
  validate: validateXBRLInstance,
  NAMESPACES: XBRL_NAMESPACES,
  SCHEMA_REFERENCES
};
