// Test data representing the German balance sheet
const testExcelData = [
  {
    "Summe Aktiva": "1.500.000,00 €",
    "Anlagevermögen": "600.000,00 €",
    "Umlaufvermögen": "850.000,00 €",
    "Kassenbestand": "50.000,00 €",
    "Forderungen aus L&L": "200.000,00 €",
    "Roh-, Hilfs- und Betriebsstoffe": "100.000,00 €",
    "Summe Passiva": "1.500.000,00 €",
    "Eigenkapital": "600.000,00 €",
    "Gewinnrücklagen": "150.000,00 €",
    "Verbindlichkeiten ggü. Kreditinstituten": "400.000,00 €",
    "Verbindlichkeiten aus Lieferungen u. Leistungen": "350.000,00 €"
  }
];

const expectedValues = {
  "Summe Aktiva": 1500000,
  "Anlagevermögen": 600000,
  "Umlaufvermögen": 850000,
  "Kassenbestand": 50000,
  "Forderungen aus L&L": 200000,
  "Roh-, Hilfs- und Betriebsstoffe": 100000,
  "Summe Passiva": 1500000,
  "Eigenkapital": 600000,
  "Gewinnrücklagen": 150000,
  "Verbindlichkeiten ggü. Kreditinstituten": 400000,
  "Verbindlichkeiten aus Lieferungen u. Leistungen": 350000
};

console.log('Test data prepared successfully');
console.log('Total columns:', Object.keys(testExcelData[0]).length);
console.log('Expected values validation:', JSON.stringify(expectedValues, null, 2));