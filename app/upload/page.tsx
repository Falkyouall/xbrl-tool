'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormData, ExcelColumn, MappingResult } from '@/types';
import { 
  Card, 
  ProgressIndicator, 
  FileUpload, 
  Navigation, 
  Alert, 
  Loading, 
  Button 
} from '@/components/ui';
import { 
  loadFromSessionStorage, 
  saveToSessionStorage, 
  validateExcelFile, 
  formatFileSize 
} from '@/lib/utils';
import { useXBRLStore, useFormData, useFileState, useProcessingState } from '@/lib/store';
import { processFileAndGenerateMapping } from '@/app/actions/mapping';

export default function UploadPage() {
  const router = useRouter();
  
  // Zustand store hooks
  const { formData, setFormData } = useFormData();
  const { setOriginalColumns, setFileInfo } = useFileState();
  const { isProcessing, setIsProcessing, processingStep, setProcessingStep } = useProcessingState();
  const { setMappingResult } = useXBRLStore();
  
  // Local state for upload-specific UI
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Load form data from previous step
  useEffect(() => {
    const savedData = loadFromSessionStorage<FormData>('xbrl-form-data', {
      recipient: '',
      regulation: '',
      perspective: ''
    });
    
    if (!savedData.recipient || !savedData.regulation || !savedData.perspective) {
      // Redirect back to first step if form data is incomplete
      router.push('/');
      return;
    }
    
    // Only set if not already set
    if (!formData.recipient) {
      setFormData(savedData);
    }
  }, [router]); // Remove formData from dependencies

  const handleFileSelect = (file: File) => {
    setUploadError('');
    setUploadSuccess(false);
    
    const validation = validateExcelFile(file);
    if (!validation.isValid) {
      setUploadError(validation.error || 'Datei-Validierung fehlgeschlagen');
      return;
    }
    
    setSelectedFile(file);
    setUploadSuccess(true);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setUploadError('');
    setUploadSuccess(false);
  };

  const handleStartMapping = async () => {
    if (!selectedFile) {
      setUploadError('Bitte wählen Sie eine Datei aus.');
      return;
    }

    setIsProcessing(true);
    setUploadError('');

    try {
      setProcessingStep('Datei wird gelesen...');
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await selectedFile.arrayBuffer();
      
      setProcessingStep('Excel-Struktur wird analysiert...');
      
      // Call server action
      const result: MappingResult = await processFileAndGenerateMapping(
        formData,
        arrayBuffer,
        selectedFile.name,
        selectedFile.size
      );

      if (!result.success) {
        setUploadError(result.error || 'Unbekannter Fehler beim Verarbeiten der Datei');
        return;
      }

      setProcessingStep('XBRL-Mapping wird generiert...');
      
      // Save to Zustand store
      if (result.data) {
        setMappingResult(result.data);
      }
      
      setFileInfo({
        name: selectedFile.name,
        size: selectedFile.size,
        processingTime: result.processingTime,
        columnsProcessed: result.columnsProcessed
      });
      
      // Save original columns for regeneration
      if (result.originalColumns) {
        setOriginalColumns(result.originalColumns);
      }
      
      // Also save to session storage as backup for page refresh
      saveToSessionStorage('xbrl-mapping-result', result.data);
      saveToSessionStorage('xbrl-file-info', {
        name: selectedFile.name,
        size: selectedFile.size,
        processingTime: result.processingTime,
        columnsProcessed: result.columnsProcessed
      });

      // Navigate to results page
      router.push('/result');

    } catch (error) {
      console.error('Error processing file:', error);
      setUploadError(`Fehler beim Verarbeiten der Datei: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  const steps = [
    { title: 'Fragen', completed: true },
    { title: 'Upload', completed: false },
    { title: 'Mapping', completed: false }
  ];

  // Show loading state during processing
  if (isProcessing) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <ProgressIndicator
          currentStep={2}
          totalSteps={3}
          steps={steps}
        />
        
        <Card>
          <Loading 
            message={processingStep || 'Datei wird verarbeitet...'}
            steps={[
              { 
                id: '1', 
                label: 'Excel-Datei lesen', 
                status: 'completed',
                message: 'Datei erfolgreich gelesen'
              },
              { 
                id: '2', 
                label: 'Spalten analysieren', 
                status: processingStep.includes('analysiert') ? 'processing' : 'pending',
                message: processingStep.includes('analysiert') ? 'Struktur wird analysiert...' : undefined
              },
              { 
                id: '3', 
                label: 'KI-Mapping generieren', 
                status: processingStep.includes('generiert') ? 'processing' : 'pending',
                message: processingStep.includes('generiert') ? 'OpenAI generiert Mappings...' : undefined
              }
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Indicator */}
      <ProgressIndicator
        currentStep={2}
        totalSteps={3}
        steps={steps}
      />

      {/* Error Alert */}
      {uploadError && (
        <Alert
          type="error"
          title="Fehler beim Verarbeiten der Datei"
          onClose={() => setUploadError('')}
        >
          {uploadError}
        </Alert>
      )}

      {/* Success Alert */}
      {uploadSuccess && selectedFile && !uploadError && (
        <Alert type="success" title="Datei erfolgreich hochgeladen">
          <p>
            <strong>{selectedFile.name}</strong> ({formatFileSize(selectedFile.size)}) 
            ist bereit für die Verarbeitung. Das Mapping kann nun gestartet werden.
          </p>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Context & Instructions */}
        <div className="lg:col-span-1">
          <Card>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Schritt 2: Excel-Upload
              </h2>
              <p className="text-gray-600">
                Laden Sie Ihre Excel-Datei hoch, die zu XBRL-Tags gemappt werden soll.
              </p>
              
              {/* Show current form context */}
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">Ihre Auswahl:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Empfänger:</span>
                    <span className="font-medium text-blue-900">{formData.recipient}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Vorschrift:</span>
                    <span className="font-medium text-blue-900">{formData.regulation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Perspektive:</span>
                    <span className="font-medium text-blue-900">{formData.perspective}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">📋 Anforderungen</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    Excel-Format (.xlsx oder .xls)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    Maximale Dateigröße: 10MB
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    Erste Zeile enthält Spaltenüberschriften
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    Maximal 50 Spalten
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Hinweis</h4>
                <p className="text-sm text-yellow-800">
                  Stellen Sie sicher, dass Ihre Excel-Datei aussagekräftige 
                  Spaltenüberschriften enthält. Diese werden für das KI-basierte 
                  Mapping verwendet.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - File Upload */}
        <div className="lg:col-span-2">
          <Card>
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Excel-Datei hochladen
              </h2>
              
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                selectedFile={selectedFile || undefined}
                error={uploadError || undefined}
                accept=".xlsx,.xls"
              />

              {/* File Information */}
              {selectedFile && !uploadError && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">
                    📊 Datei-Informationen
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Dateiname:</span>
                      <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Dateigröße:</span>
                      <p className="font-medium text-gray-900">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Typ:</span>
                      <p className="font-medium text-gray-900">
                        {selectedFile.name.endsWith('.xlsx') ? 'Excel 2007+' : 'Excel 97-2003'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Zuletzt geändert:</span>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedFile.lastModified).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Start Mapping Button */}
              {selectedFile && uploadSuccess && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleStartMapping}
                    disabled={isProcessing}
                    loading={isProcessing}
                  >
                    🚀 Mapping starten
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <Navigation
        currentStep={2}
        onBack={handleBack}
        onNext={selectedFile && uploadSuccess ? handleStartMapping : undefined}
        nextLabel="Mapping starten"
        nextDisabled={!selectedFile || !uploadSuccess || isProcessing}
        loading={isProcessing}
      />

      {/* Help Section */}
      <Card className="bg-gray-50">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            🤖 Was passiert beim Mapping?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-xl">📖</span>
              </div>
              <h4 className="font-medium text-gray-900">1. Excel lesen</h4>
              <p className="text-sm text-gray-600">
                Ihre Excel-Datei wird eingelesen und die Spaltenstruktur analysiert.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-xl">🧠</span>
              </div>
              <h4 className="font-medium text-gray-900">2. KI-Analyse</h4>
              <p className="text-sm text-gray-600">
                GPT-4 analysiert Ihre Spalten im Kontext der gewählten Vorschrift.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-xl">🎯</span>
              </div>
              <h4 className="font-medium text-gray-900">3. XBRL-Mapping</h4>
              <p className="text-sm text-gray-600">
                Passende XBRL-Tags werden vorgeschlagen mit Konfidenzwerten.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}