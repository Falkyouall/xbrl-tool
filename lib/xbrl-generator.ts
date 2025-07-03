import { FormData, XBRLMapping, OpenAIMappingResponse } from '@/types';

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
  'de-gaap': 'http://www.xbrl.de/taxonomies/de-gaap'
};

// Get primary namespace based on regulation
function getPrimaryNamespace(regulation: string): string {
  switch (regulation) {
    case 'FINREP':
      return 'finrep';
    case 'COREP':
      return 'corep';
    case 'HGB':
      return 'de-gaap';
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
    'CashAndCashEquivalents': 'de-gaap:LiquideMittel',
    'LoansAndReceivables': 'de-gaap:Forderungen',
    'Assets': 'de-gaap:Aktiva',
    'Equity': 'de-gaap:Eigenkapital',
    'Liabilities': 'de-gaap:Verbindlichkeiten',
    'Revenue': 'de-gaap:Umsatzerlöse'
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
  'HGB': 'http://www.xbrl.de/taxonomies/de-gaap/2023-12-31/de-gaap-ci-2023-12-31.xsd'
};

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
  }
): XBRLInstance {
  const {
    entityId = 'ENTITY_001',
    reportingDate = new Date().toISOString().split('T')[0],
    currency = 'EUR'
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

  // Generate facts from mappings
  const facts: XBRLFact[] = mappingResponse.mappings.map((mapping, index) => {
    // Convert to regulation-specific tag
    const regulationTag = convertToRegulationTag(mapping.xbrlTag, formData.regulation);
    const namespace = getNamespaceFromTag(regulationTag);
    const elementName = getElementNameFromTag(regulationTag);

    // Determine unit based on data type
    let unitRef: string | undefined;
    switch (mapping.dataType) {
      case 'monetary':
        unitRef = 'u1';
        break;
      case 'shares':
        unitRef = 'shares';
        break;
      case 'decimal':
      case 'string':
      default:
        unitRef = mapping.dataType === 'decimal' ? 'pure' : undefined;
        break;
    }

    // Generate sample value or use from Excel data if available
    let value: string | number = '0';
    if (excelData && excelData.length > 0) {
      const rowData = excelData[0]; // Use first row as example
      if (rowData[mapping.excelColumn]) {
        value = rowData[mapping.excelColumn];
      }
    } else {
      // Generate sample values based on data type
      value = generateSampleValue(mapping.dataType, mapping.excelColumn);
    }

    return {
      name: elementName,
      contextRef: 'c1',
      unitRef,
      decimals: mapping.dataType === 'monetary' ? '0' : undefined,
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
    if (regulation === 'HGB' && namespace === 'de-gaap') return xbrlTag;
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
    'ifrs-full:Assets': 'de-gaap:Assets',
    'ifrs-full:Equity': 'de-gaap:Equity',
    'ifrs-full:CashAndCashEquivalents': 'de-gaap:CashAndCashEquivalents',
    'ifrs-full:PropertyPlantAndEquipment': 'de-gaap:PropertyPlantAndEquipment'
  };

  switch (regulation) {
    case 'FINREP':
      return FINREP_TAG_MAPPING[xbrlTag] || xbrlTag.replace('ifrs-full:', 'finrep:');
    case 'COREP':
      return COREP_TAG_MAPPING[xbrlTag] || xbrlTag.replace('ifrs-full:', 'corep:');
    case 'HGB':
      return HGB_TAG_MAPPING[xbrlTag] || xbrlTag.replace('ifrs-full:', 'de-gaap:');
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
      // Try to infer from column name
      if (columnName?.toLowerCase().includes('amount') ||
        columnName?.toLowerCase().includes('value') ||
        columnName?.toLowerCase().includes('betrag')) {
        return Math.floor(Math.random() * 1000000);
      }
      return 'Sample Value';
  }
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
