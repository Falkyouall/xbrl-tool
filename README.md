# XBRL Mapping Tool

Ein KI-gestütztes Tool zur automatischen Zuordnung von Excel-Spalten zu XBRL-Taxonomie-Tags. Diese Next.js 15 Anwendung nutzt OpenAI GPT-4, um intelligente Mappings basierend auf Finanzberichterstattungsstandards zu generieren.

## 🌟 Features

- **KI-gestütztes Mapping**: Automatische Zuordnung von Excel-Spalten zu XBRL-Tags mit OpenAI GPT-4
- **Multi-Standard-Unterstützung**: IFRS, FINREP, COREP, HGB
- **Verschiedene Empfänger**: Bundesbank, BaFin, Interne Meldungen
- **Perspektiven-spezifisch**: Bilanz, GuV, Segmentbericht
- **Benutzerfreundliche UI**: Moderne, responsive Oberfläche mit Tailwind CSS
- **Fortschrittsanzeige**: Schritt-für-Schritt Prozess mit visueller Rückmeldung
- **Konfidenz-Bewertung**: Qualitätsbewertung für jedes Mapping
- **Export-Funktionalität**: JSON-Export der Mapping-Ergebnisse und XBRL 2.1 XML-Generierung
- **Validierung**: Umfassende Datei- und Eingabevalidierung

## 🚀 Schnellstart

### Voraussetzungen

- Node.js 18.17 oder höher
- npm oder yarn
- OpenAI API Key (GPT-4 Zugang erforderlich)

### Installation

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd xbrl-tool
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen einrichten**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Bearbeiten Sie `.env.local` und fügen Sie Ihren OpenAI API Key hinzu:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

4. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```

5. **Anwendung öffnen**
   Öffnen Sie [http://localhost:3000](http://localhost:3000) in Ihrem Browser.

## ⚙️ Konfiguration

### OpenAI API Setup

1. Besuchen Sie [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Erstellen Sie einen neuen API Key
3. Stellen Sie sicher, dass Sie Zugang zu GPT-4 haben
4. Fügen Sie den Key in `.env.local` hinzu

### Umgebungsvariablen

| Variable | Beschreibung | Standard | Erforderlich |
|----------|--------------|----------|--------------|
| `OPENAI_API_KEY` | OpenAI API Schlüssel | - | ✅ |
| `OPENAI_MODEL` | OpenAI Modell | `gpt-4o` | ❌ |
| `OPENAI_MAX_TOKENS` | Max. Tokens pro Anfrage | `2000` | ❌ |
| `OPENAI_TEMPERATURE` | Kreativität (0.0-1.0) | `0.3` | ❌ |
| `MAX_FILE_SIZE` | Max. Dateigröße (Bytes) | `10485760` | ❌ |
| `MAX_COLUMNS` | Max. Excel-Spalten | `50` | ❌ |

## 📖 Verwendung

### 1. Fragen beantworten
- **Empfänger**: Wählen Sie zwischen Bundesbank, BaFin oder Interne Meldung
- **Vorschrift**: Bestimmen Sie den Standard (IFRS, FINREP, COREP, HGB)
- **Perspektive**: Legen Sie den Berichtstyp fest (Bilanz, GuV, Segmentbericht)

### 2. Excel-Datei hochladen
- Unterstützte Formate: `.xlsx`, `.xls`
- Maximale Dateigröße: 10MB
- Erste Zeile muss Spaltenüberschriften enthalten
- Maximum 50 Spalten

### 3. Mapping generieren & XBRL erstellen
- KI analysiert Ihre Datei im gewählten Kontext
- Automatische Zuordnung zu XBRL-Tags
- Konfidenz-Bewertung für jedes Mapping
- XBRL 2.1 konforme XML-Generierung
- Ergebnisse überprüfen und exportieren (JSON + XBRL)

## 🏗️ Projektstruktur

```
xbrl-tool/
├── app/                    # Next.js App Router
│   ├── actions/           # Server Actions
│   │   └── mapping.ts     # OpenAI Integration
│   ├── upload/           # Upload-Seite
│   ├── result/           # Ergebnis-Seite
│   ├── globals.css       # Globale Styles
│   ├── layout.tsx        # Root Layout
│   └── page.tsx          # Hauptseite
├── components/           # UI Komponenten
│   └── ui.tsx           # Wiederverwendbare UI-Elemente
├── lib/                 # Utility-Funktionen
│   ├── utils.ts        # Excel-Parser, OpenAI-Utils
│   └── xbrl-generator.ts # XBRL 2.1 XML-Generierung
├── types/              # TypeScript-Definitionen
│   └── index.ts        # Typen und Interfaces
├── public/             # Statische Assets
├── .env.local.example  # Umgebungsvariablen-Template
└── README.md          # Diese Datei
```

## 🔧 API Dokumentation

### Server Actions

#### `processFileAndGenerateMapping`
Verarbeitet Excel-Datei und generiert XBRL-Mappings.

**Parameter:**
- `formData`: Formular-Konfiguration
- `fileData`: Excel-Datei als ArrayBuffer
- `fileName`: Dateiname
- `fileSize`: Dateigröße

**Rückgabe:**
```typescript
{
  success: boolean;
  data?: OpenAIMappingResponse;
  error?: string;
  processingTime?: number;
  columnsProcessed?: number;
}
```

#### `generateXBRLDocument`
Generiert XBRL 2.1 konforme XML-Datei aus Mapping-Ergebnissen.

**Parameter:**
- `mappingResponse`: OpenAI Mapping-Ergebnisse
- `formData`: Formular-Konfiguration
- `options`: Entity ID, Reporting Date, Currency

**Rückgabe:**
```typescript
{
  success: boolean;
  data?: string; // XBRL XML
  filename?: string;
  error?: string;
}
```
</text>

<old_text>
#### `XBRLMapping`
```typescript
{
  excelColumn: string;    // Excel-Spaltenname
  xbrlTag: string;        // XBRL-Tag
  confidence: number;     // Konfidenz (0-1)
  description?: string;   // Beschreibung
  dataType?: string;      // Datentyp
  namespace?: string;     // XBRL-Namespace
}
```

#### `validateUploadedFile`
Validiert hochgeladene Excel-Datei.

### Datenstrukturen

#### `XBRLMapping`
```typescript
{
  excelColumn: string;    // Excel-Spaltenname
  xbrlTag: string;        // XBRL-Tag
  confidence: number;     // Konfidenz (0-1)
  description?: string;   // Beschreibung
  dataType?: string;      // Datentyp
  namespace?: string;     // XBRL-Namespace
}
```

## 🛠️ Entwicklung

### Lokale Entwicklung

```bash
# Entwicklungsserver starten
npm run dev

# TypeScript-Typen prüfen
npm run type-check

# Linting
npm run lint

# Build für Produktion
npm run build
```

### Testing

```bash
# Unit Tests (wenn implementiert)
npm run test

# E2E Tests (wenn implementiert)
npm run test:e2e
```

## 🚨 Troubleshooting

### Häufige Probleme

#### OpenAI API Fehler
```
Fehler: OpenAI API Key ist nicht konfiguriert
```
**Lösung:** Überprüfen Sie, ob `OPENAI_API_KEY` in `.env.local` gesetzt ist.

#### Excel-Parser Fehler
```
Fehler beim Lesen der Excel-Datei
```
**Lösungen:**
- Überprüfen Sie das Dateiformat (.xlsx oder .xls)
- Stellen Sie sicher, dass die erste Zeile Spaltenüberschriften enthält
- Reduzieren Sie die Anzahl der Spalten (max. 50)

#### Große Dateien
```
Datei ist zu groß. Maximum: 10MB
```
**Lösung:** Reduzieren Sie die Dateigröße oder erhöhen Sie `MAX_FILE_SIZE` in der Konfiguration.

### Debug-Modus

Aktivieren Sie den Debug-Modus für detaillierte Logs:
```env
DEBUG_MODE=true
LOG_LEVEL=debug
```

## 🔐 Sicherheit

- API-Keys niemals in Code committen
- Verwenden Sie `.env.local` für lokale Entwicklung
- Für Produktion: Umgebungsvariablen über Hosting-Plattform setzen
- File-Upload-Validierung ist aktiviert
- Session-basierte Datenspeicherung (keine Persistierung)

## 🚀 Deployment

### Vercel (Empfohlen)

1. Repository zu Vercel verknüpfen
2. Umgebungsvariablen in Vercel-Dashboard setzen
3. Automatisches Deployment bei Git-Push

### Andere Plattformen

Für andere Hosting-Plattformen stellen Sie sicher:
- Node.js 18+ Unterstützung
- Umgebungsvariablen konfiguriert
- Build-Command: `npm run build`
- Start-Command: `npm start`

## 🗺️ Roadmap

### Version 1.1 (Geplant)
- [x] XBRL 2.1 XML-Generierung aus Mappings
- [ ] Mapping-Editor für manuelle Anpassungen
- [ ] Excel-Daten-Integration in XBRL-Facts
- [ ] Batch-Verarbeitung mehrerer Dateien
- [ ] Mapping-Templates speichern/laden

### Version 1.2 (Geplant)
- [ ] XBRL-Validierung gegen offizielle Taxonomien
- [ ] Datenbankintegration für Mapping-Historie
- [ ] User-Management und Authentifizierung
- [ ] API-Endpunkte für externe Integration
- [ ] Erweiterte XBRL-Taxonomie-Unterstützung

### Version 2.0 (Vision)
- [ ] Machine Learning für verbesserte Mappings
- [ ] Multi-Sprach-Unterstützung
- [ ] Dashboard für Mapping-Analytics
- [ ] Integration mit Buchhaltungssoftware

## 📊 **XBRL 2.1 Unterstützung**

### **Implementierte Standards:**
- ✅ **XBRL 2.1 Instance Documents** mit korrekten Namespaces
- ✅ **Schema-Referenzen** für IFRS, FINREP, COREP, HGB
- ✅ **Contexts & Units** gemäß XBRL-Spezifikation
- ✅ **Entity Identifier** mit Schema-Support
- ✅ **Period-Support** für Instant und Duration
- ✅ **Monetary & Non-Monetary Facts**

### **Unterstützte Taxonomien:**
- **IFRS**: International Financial Reporting Standards
- **FINREP**: Financial Reporting (EBA)
- **COREP**: Common Reporting (EBA)
- **HGB**: Handelsgesetzbuch (Deutsche GAAP)

### **XBRL-Ausgabe-Features:**
- 📁 **Standard-konforme XML-Struktur**
- 🏷️ **Korrekte Namespace-Deklarationen**
- 📋 **Automatische Context-Generierung**
- 💰 **Währungseinheiten (ISO 4217)**
- ✅ **Basic XBRL-Validierung**

## 🤝 Contributing

1. Fork des Repositories
2. Feature-Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Änderungen committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request erstellen

### Entwicklungsrichtlinien

- TypeScript für alle neuen Dateien
- ESLint-Regeln befolgen
- Kommentare auf Deutsch
- UI-Texte auf Deutsch
- Responsive Design beachten

## 📄 Lizenz

Dieses Projekt ist für interne Nutzung entwickelt. Alle Rechte vorbehalten.

## 🆘 Support

Bei Fragen oder Problemen:

1. Überprüfen Sie die Troubleshooting-Sektion
2. Schauen Sie in die GitHub Issues
3. Erstellen Sie ein neues Issue mit detaillierter Beschreibung

## 🙏 Danksagungen

- **OpenAI** für GPT-4 API
- **Next.js Team** für das großartige Framework
- **Vercel** für Hosting und Deployment
- **Tailwind CSS** für das Design-System

---

**Version:** 1.0.0  
**Letztes Update:** Dezember 2024  
**Maintainer:** XBRL Tool Team