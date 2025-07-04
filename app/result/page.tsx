'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormData, OpenAIMappingResponse, XBRLMapping } from '@/types';
import {
  Card,
  ProgressIndicator,
  MappingTable,
  Navigation,
  Alert,
  Button
} from '@/components/ui';
import {
  loadFromSessionStorage,
  saveToSessionStorage,
  removeFromSessionStorage,
  formatFileSize
} from '@/lib/utils';
import { useXBRLStore, useFormData, useFileState, useMappingState } from '@/lib/store';
import { regenerateMapping, generateXBRLDocument } from '@/app/actions/mapping';
import { Download, RefreshCw, CheckCircle, AlertTriangle, Info, FileText } from 'lucide-react';

interface FileInfo {
  name: string;
  size: number;
  processingTime?: number;
  columnsProcessed?: number;
}

export default function ResultPage() {
  const router = useRouter();
  
  // Zustand store hooks
  const { formData, setFormData } = useFormData();
  const { originalColumns, fileInfo, setFileInfo } = useFileState();
  const { mappingResult, setMappingResult, canRegenerate } = useMappingState();
  const { clearAll } = useXBRLStore();
  
  // Local state for UI
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(true);
  const [showRegenerateSuccess, setShowRegenerateSuccess] = useState(false);

  // Load data from session storage as fallback
  useEffect(() => {
    const savedFormData = loadFromSessionStorage<FormData>('xbrl-form-data', {
      recipient: '',
      regulation: '',
      perspective: ''
    });

    const savedMappingResult = loadFromSessionStorage<OpenAIMappingResponse | null>('xbrl-mapping-result', null);
    const savedFileInfo = loadFromSessionStorage<FileInfo | null>('xbrl-file-info', null);

    // Redirect if essential data is missing
    if (!savedFormData.recipient || !savedMappingResult) {
      router.push('/');
      return;
    }

    // Only set data if Zustand store is empty (fallback to session storage)
    if (!formData.recipient && !mappingResult && !fileInfo) {
      setFormData(savedFormData);
      if (savedMappingResult) {
        setMappingResult(savedMappingResult);
      }
      if (savedFileInfo) {
        setFileInfo(savedFileInfo);
      }
    }
  }, [router]); // Remove circular dependencies

  const handleRegenerate = async () => {
    if (!mappingResult || !fileInfo) return;

    setIsRegenerating(true);
    setError('');

    try {
      // Check if we can regenerate using Zustand store
      if (!canRegenerate() || !originalColumns) {
        setError('Ursprüngliche Spaltendaten nicht verfügbar. Bitte laden Sie die Datei erneut hoch.');
        return;
      }

      // Call regenerate mapping API
      const result = await regenerateMapping(formData, originalColumns);
      
      if (!result.success) {
        setError(result.error || 'Fehler beim Neu-Generieren der Mappings');
        return;
      }

      // Update mapping result in Zustand store
      if (result.data) {
        setMappingResult(result.data);
        saveToSessionStorage('xbrl-mapping-result', result.data);
      }
      
      // Update file info with new processing time
      if (fileInfo) {
        const updatedFileInfo = {
          ...fileInfo,
          processingTime: result.processingTime,
          columnsProcessed: result.columnsProcessed
        };
        setFileInfo(updatedFileInfo);
        saveToSessionStorage('xbrl-file-info', updatedFileInfo);
      }
      
      // Show success message
      setShowRegenerateSuccess(true);
      setTimeout(() => setShowRegenerateSuccess(false), 5000);

    } catch (err) {
      setError(`Fehler beim Neu-Generieren: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownload = () => {
    if (!mappingResult || !fileInfo) return;

    const exportData = {
      metadata: {
        fileName: fileInfo.name,
        fileSize: fileInfo.size,
        processingTime: fileInfo.processingTime,
        columnsProcessed: fileInfo.columnsProcessed,
        generatedAt: new Date().toISOString(),
        configuration: formData
      },
      mappings: mappingResult.mappings,
      summary: {
        totalMappings: mappingResult.mappings.length,
        averageConfidence: mappingResult.mappings.reduce((acc, m) => acc + m.confidence, 0) / mappingResult.mappings.length,
        highConfidenceMappings: mappingResult.mappings.filter(m => m.confidence >= 0.8).length,
        reasoning: mappingResult.reasoning,
        warnings: mappingResult.warnings
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xbrl-mapping-${fileInfo.name.replace(/\.[^/.]+$/, '')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadXBRL = async () => {
    if (!mappingResult || !fileInfo) return;

    setIsRegenerating(true);
    setError('');

    try {
      // Call server action to generate XBRL
      const result = await generateXBRLDocument(
        mappingResult,
        formData,
        {
          entityId: `ENTITY_${Date.now()}`,
          reportingDate: new Date().toISOString().split('T')[0],
          currency: 'EUR'
        }
      );

      if (!result.success) {
        setError(result.error || 'Fehler beim Generieren der XBRL-Datei');
        return;
      }

      if (!result.data || !result.filename) {
        setError('Keine XBRL-Daten erhalten');
        return;
      }

      // Create and download file
      const blob = new Blob([result.data], {
        type: 'application/xml'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating XBRL:', error);
      setError(`Fehler beim Generieren der XBRL-Datei: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleStartOver = () => {
    // Clear Zustand store
    clearAll();
    
    // Clear session storage as backup
    removeFromSessionStorage('xbrl-form-data');
    removeFromSessionStorage('xbrl-mapping-result');
    removeFromSessionStorage('xbrl-file-info');
    removeFromSessionStorage('xbrl-original-columns');
    
    router.push('/');
  };

  const handleBack = () => {
    router.push('/upload');
  };

  if (!mappingResult || !fileInfo) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Keine Mapping-Ergebnisse gefunden
            </h2>
            <p className="text-gray-600 mb-6">
              Es scheint, als ob keine Mapping-Daten verfügbar sind.
              Bitte beginnen Sie den Prozess von vorne.
            </p>
            <Button onClick={() => router.push('/')}>
              Zum Start zurückkehren
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const steps = [
    { title: 'Fragen', completed: true },
    { title: 'Upload', completed: true },
    { title: 'Mapping', completed: true }
  ];

  const highConfidenceMappings = mappingResult.mappings.filter(m => m.confidence >= 0.8);
  const mediumConfidenceMappings = mappingResult.mappings.filter(m => m.confidence >= 0.6 && m.confidence < 0.8);
  const lowConfidenceMappings = mappingResult.mappings.filter(m => m.confidence < 0.6);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Progress Indicator */}
      <ProgressIndicator
        currentStep={3}
        totalSteps={3}
        steps={steps}
      />

      {/* Success Alert */}
      {showSuccess && (
        <Alert
          type="success"
          title="XBRL-Mapping erfolgreich generiert!"
          onClose={() => setShowSuccess(false)}
        >
          <p>
            Ihre Excel-Datei wurde erfolgreich analysiert und {mappingResult.mappings.length}
            XBRL-Mappings wurden generiert. Überprüfen Sie die Ergebnisse unten.
          </p>
        </Alert>
      )}

      {/* Regenerate Success Alert */}
      {showRegenerateSuccess && (
        <Alert
          type="success"
          title="Mapping erfolgreich neu generiert!"
          onClose={() => setShowRegenerateSuccess(false)}
        >
          <p>
            Die XBRL-Mappings wurden mit neuen KI-Parametern regeneriert. 
            Überprüfen Sie die aktualisierten Ergebnisse unten.
          </p>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          title="Fehler"
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {mappingResult.mappings.length}
            </div>
            <div className="text-sm text-gray-600">Mappings generiert</div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {highConfidenceMappings.length}
            </div>
            <div className="text-sm text-gray-600">Hohe Konfidenz (≥80%)</div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {mediumConfidenceMappings.length}
            </div>
            <div className="text-sm text-gray-600">Mittlere Konfidenz (60-79%)</div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {lowConfidenceMappings.length}
            </div>
            <div className="text-sm text-gray-600">Niedrige Konfidenz (&lt;60%)</div>
          </div>
        </Card>
      </div>

      {/* File and Processing Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📄 Datei-Informationen
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Dateiname:</span>
              <span className="font-medium text-gray-900">{fileInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dateigröße:</span>
              <span className="font-medium text-gray-900">{formatFileSize(fileInfo.size)}</span>
            </div>
            {fileInfo.columnsProcessed && (
              <div className="flex justify-between">
                <span className="text-gray-600">Spalten verarbeitet:</span>
                <span className="font-medium text-gray-900">{fileInfo.columnsProcessed}</span>
              </div>
            )}
            {fileInfo.processingTime && (
              <div className="flex justify-between">
                <span className="text-gray-600">Verarbeitungszeit:</span>
                <span className="font-medium text-gray-900">{(fileInfo.processingTime / 1000).toFixed(1)}s</span>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ⚙️ Konfiguration
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Empfänger:</span>
              <span className="font-medium text-gray-900">{formData.recipient}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vorschrift:</span>
              <span className="font-medium text-gray-900">{formData.regulation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Perspektive:</span>
              <span className="font-medium text-gray-900">{formData.perspective}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gesamtkonfidenz:</span>
              <span className="font-medium text-gray-900">
                {Math.round(mappingResult.confidence_score * 100)}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Reasoning */}
      {mappingResult.reasoning && (
        <Card>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🤖 KI-Begründung
              </h3>
              <p className="text-gray-700">{mappingResult.reasoning}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Warnings */}
      {mappingResult.warnings && mappingResult.warnings.length > 0 && (
        <Alert type="warning" title="Hinweise und Warnungen">
          <ul className="list-disc list-inside space-y-1">
            {mappingResult.warnings.map((warning, index) => (
              <li key={index} className="text-sm">{warning}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          variant="outline"
          onClick={handleRegenerate}
          loading={isRegenerating}
          disabled={isRegenerating}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Mapping neu generieren
        </Button>

        <Button
          variant="primary"
          onClick={handleDownloadXBRL}
          loading={isRegenerating}
          disabled={isRegenerating}
        >
          <FileText className="w-4 h-4 mr-2" />
          XBRL-Datei herunterladen
        </Button>

        <Button
          variant="outline"
          onClick={handleDownload}
        >
          <Download className="w-4 h-4 mr-2" />
          JSON-Mapping herunterladen
        </Button>

        <Button
          variant="secondary"
          onClick={handleStartOver}
        >
          Neues Mapping starten
        </Button>
      </div>

      {/* Mapping Results Table */}
      <Card>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              📊 XBRL-Mapping Ergebnisse
            </h2>
            <div className="text-sm text-gray-500">
              {mappingResult.mappings.length} Mappings gefunden
            </div>
          </div>

          <MappingTable
            mappings={mappingResult.mappings}
            readonly={true}
          />
        </div>
      </Card>

      {/* Quality Analysis */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Qualitätsanalyse
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highConfidenceMappings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h4 className="font-medium text-green-900">Hohe Konfidenz</h4>
              </div>
              <p className="text-sm text-gray-600">
                {highConfidenceMappings.length} Mappings mit über 80% Konfidenz.
                Diese können direkt verwendet werden.
              </p>
            </div>
          )}

          {mediumConfidenceMappings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <h4 className="font-medium text-yellow-900">Mittlere Konfidenz</h4>
              </div>
              <p className="text-sm text-gray-600">
                {mediumConfidenceMappings.length} Mappings sollten überprüft werden,
                bevor sie verwendet werden.
              </p>
            </div>
          )}

          {lowConfidenceMappings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h4 className="font-medium text-red-900">Niedrige Konfidenz</h4>
              </div>
              <p className="text-sm text-gray-600">
                {lowConfidenceMappings.length} Mappings benötigen manuelle Überprüfung
                und möglicherweise Anpassung.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation */}
      <Navigation
        currentStep={3}
        onBack={handleBack}
        backLabel="Zurück zum Upload"
      />

      {/* Next Steps Information */}
      <Card className="bg-blue-50">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium text-blue-900">
            🚀 Nächste Schritte
          </h3>
          <p className="text-blue-800 max-w-3xl mx-auto">
            Mit den generierten XBRL-Mappings können Sie nun Ihre Excel-Daten in
            das XBRL-Format konvertieren. Laden Sie die Ergebnisse herunter und
            überprüfen Sie Mappings mit niedriger Konfidenz vor der finalen Verwendung.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">1. Überprüfung</h4>
              <p className="text-sm text-blue-800">
                Kontrollieren Sie alle Mappings, besonders die mit niedriger Konfidenz.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">2. Export</h4>
              <p className="text-sm text-blue-800">
                Laden Sie die XBRL-Datei oder das JSON-Mapping herunter.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">3. XBRL-Verwendung</h4>
              <p className="text-sm text-blue-800">
                Die generierte XBRL-Datei entspricht dem XBRL 2.1 Standard und kann direkt verwendet werden.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
