const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

interface GaapTag {
  tag: string;
  label: string;
}

interface XsdElement {
  name: string;
  id?: string;
  abstract?: string;
  type?: string;
  substitutionGroup?: string;
}

/**
 * Simple XML parser for extracting xs:element definitions
 */
function parseXsdElements(xsdContent: string): XsdElement[] {
  const elements: XsdElement[] = [];
  
  // Regular expression to match xs:element definitions
  const elementRegex = /<xs:element\s+([^>]+)>/g;
  let match;
  
  while ((match = elementRegex.exec(xsdContent)) !== null) {
    const attributesStr = match[1];
    const element: XsdElement = { name: '' };
    
    // Extract attributes
    const nameMatch = attributesStr.match(/name="([^"]+)"/);
    if (nameMatch) {
      element.name = nameMatch[1];
    }
    
    const idMatch = attributesStr.match(/id="([^"]+)"/);
    if (idMatch) {
      element.id = idMatch[1];
    }
    
    const abstractMatch = attributesStr.match(/abstract="([^"]+)"/);
    if (abstractMatch) {
      element.abstract = abstractMatch[1];
    }
    
    const typeMatch = attributesStr.match(/type="([^"]+)"/);
    if (typeMatch) {
      element.type = typeMatch[1];
    }
    
    const substitutionGroupMatch = attributesStr.match(/substitutionGroup="([^"]+)"/);
    if (substitutionGroupMatch) {
      element.substitutionGroup = substitutionGroupMatch[1];
    }
    
    elements.push(element);
  }
  
  return elements;
}

/**
 * Parse label files to get German labels for elements
 */
function parseLabels(labelContent: string): Map<string, string> {
  const labels = new Map<string, string>();
  
  // Regular expression to match label definitions including multiline content
  const labelRegex = /<label[^>]+xlink:label="([^"]+)"[^>]*>([^<]+)<\/label>/g;
  let match;
  
  while ((match = labelRegex.exec(labelContent)) !== null) {
    const labelId = match[1];
    const labelText = match[2].trim();
    labels.set(labelId, labelText);
  }
  
  return labels;
}

/**
 * Parse locator to connect elements with their labels
 */
function parseLocators(labelContent: string): Map<string, string> {
  const locators = new Map<string, string>();
  
  // Regular expression to match locator definitions
  const locatorRegex = /<loc[^>]+xlink:href="[^#]*#([^"]+)"[^>]+xlink:label="([^"]+)"/g;
  let match;
  
  while ((match = locatorRegex.exec(labelContent)) !== null) {
    const elementId = match[1];
    const labelId = match[2];
    locators.set(elementId, labelId);
  }
  
  return locators;
}

/**
 * Parse labelArc to connect locators with labels
 */
function parseLabelArcs(labelContent: string): Map<string, string> {
  const labelArcs = new Map<string, string>();
  
  // Regular expression to match labelArc definitions
  const labelArcRegex = /<labelArc[^>]+xlink:from="([^"]+)"[^>]+xlink:to="([^"]+)"/g;
  let match;
  
  while ((match = labelArcRegex.exec(labelContent)) !== null) {
    const fromLabel = match[1];
    const toLabel = match[2];
    labelArcs.set(fromLabel, toLabel);
  }
  
  return labelArcs;
}

/**
 * Build GAAP tags from XSD file
 */
function buildGaapTags(): GaapTag[] {
  const xsdPath = join(process.cwd(), 'taxonomies', 'de-gaap-ci-2024-04-01', 'de-gaap-ci-2024-04-01.xsd');
  const labelPath = join(process.cwd(), 'taxonomies', 'de-gaap-ci-2024-04-01', 'de-gaap-ci-2024-04-01-label-de.xml');
  
  console.log('Reading XSD file:', xsdPath);
  const xsdContent = readFileSync(xsdPath, 'utf-8');
  
  console.log('Reading label file:', labelPath);
  const labelContent = readFileSync(labelPath, 'utf-8');
  
  // Parse elements from XSD
  const elements = parseXsdElements(xsdContent);
  console.log(`Found ${elements.length} elements`);
  
  // Filter out elements without names or that are abstract
  const concreteElements = elements.filter(el => el.name && el.abstract !== 'true');
  console.log(`Found ${concreteElements.length} concrete elements`);
  
  // Parse labels from label file
  const labels = parseLabels(labelContent);
  const locators = parseLocators(labelContent);
  const labelArcs = parseLabelArcs(labelContent);
  
  console.log(`Found ${labels.size} labels`);
  console.log(`Found ${locators.size} locators`);
  console.log(`Found ${labelArcs.size} label arcs`);
  
  // Build GAAP tags
  const gaapTags: GaapTag[] = [];
  
  concreteElements.forEach(element => {
    const tag = `de-gaap-ci:${element.name}`;
    
    // Try to find a label for this element
    let label = element.name; // Default to element name
    
    if (element.id) {
      const labelId = locators.get(element.id);
      if (labelId) {
        const labelText = labels.get(labelId);
        if (labelText) {
          label = labelText;
        } else {
          // Try to find through labelArcs
          const targetLabelId = labelArcs.get(labelId);
          if (targetLabelId) {
            const targetLabelText = labels.get(targetLabelId);
            if (targetLabelText) {
              label = targetLabelText;
            }
          }
        }
      }
    }
    
    gaapTags.push({
      tag,
      label
    });
  });
  
  // Sort by tag name for consistency
  gaapTags.sort((a, b) => a.tag.localeCompare(b.tag));
  
  console.log(`Built ${gaapTags.length} GAAP tags`);
  
  return gaapTags;
}

/**
 * Main function
 */
function main() {
  try {
    console.log('Building GAAP tags from local taxonomy...');
    
    const gaapTags = buildGaapTags();
    
    // Ensure src/data directory exists
    const outputDir = join(process.cwd(), 'src', 'data');
    const fs = require('fs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write to output file
    const outputPath = join(outputDir, 'gaap_tags_2024.json');
    writeFileSync(outputPath, JSON.stringify(gaapTags, null, 2), 'utf-8');
    
    console.log(`Successfully wrote ${gaapTags.length} GAAP tags to ${outputPath}`);
    
    // Log first few tags for verification
    console.log('\nFirst few tags:');
    gaapTags.slice(0, 5).forEach(tag => {
      console.log(`  ${tag.tag}: ${tag.label}`);
    });
    
  } catch (error) {
    console.error('Error building GAAP tags:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}