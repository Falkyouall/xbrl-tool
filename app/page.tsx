'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormData } from '@/types';
import { Card, ProgressIndicator, QuestionForm, Navigation, Alert } from '@/components/ui';
import { validateFormData, saveToSessionStorage, loadFromSessionStorage } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    recipient: '',
    regulation: '',
    perspective: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showAlert, setShowAlert] = useState(false);

  // Load form data from session storage on component mount
  useEffect(() => {
    const savedData = loadFromSessionStorage<FormData>('xbrl-form-data', {
      recipient: '',
      regulation: '',
      perspective: ''
    });
    if (savedData) {
      setFormData(savedData);
    }
  }, []);

  // Save form data to session storage whenever it changes
  useEffect(() => {
    saveToSessionStorage('xbrl-form-data', formData);
  }, [formData]);

  const handleFormChange = (newFormData: FormData) => {
    setFormData(newFormData);
    // Clear errors when user makes changes
    if (errors.recipient && newFormData.recipient) {
      setErrors(prev => ({ ...prev, recipient: '' }));
    }
    if (errors.regulation && newFormData.regulation) {
      setErrors(prev => ({ ...prev, regulation: '' }));
    }
    if (errors.perspective && newFormData.perspective) {
      setErrors(prev => ({ ...prev, perspective: '' }));
    }
  };

  const handleNext = () => {
    const validation = validateFormData(formData);
    
    if (!validation.isValid) {
      const newErrors: { [key: string]: string } = {};
      validation.errors.forEach(error => {
        if (error.includes('Empfänger')) {
          newErrors.recipient = 'Bitte wählen Sie einen Empfänger aus.';
        }
        if (error.includes('Vorschrift')) {
          newErrors.regulation = 'Bitte wählen Sie eine Vorschrift aus.';
        }
        if (error.includes('Perspektive')) {
          newErrors.perspective = 'Bitte wählen Sie eine Perspektive aus.';
        }
      });
      setErrors(newErrors);
      setShowAlert(true);
      return;
    }

    // Save completed form data and navigate to upload page
    saveToSessionStorage('xbrl-form-data', formData);
    router.push('/upload');
  };

  const isFormComplete = formData.recipient && formData.regulation && formData.perspective;
  const hasErrors = Object.values(errors).some(error => error !== '');

  const steps = [
    { title: 'Fragen', completed: false },
    { title: 'Upload', completed: false },
    { title: 'Mapping', completed: false }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Indicator */}
      <ProgressIndicator
        currentStep={1}
        totalSteps={3}
        steps={steps}
      />

      {/* Alert for validation errors */}
      {showAlert && hasErrors && (
        <Alert
          type="error"
          title="Bitte vervollständigen Sie das Formular"
          onClose={() => setShowAlert(false)}
        >
          Alle drei Fragen müssen beantwortet werden, bevor Sie fortfahren können.
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Instructions */}
        <div className="lg:col-span-1">
          <Card>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Schritt 1: Grundeinstellungen
              </h2>
              <p className="text-gray-600">
                Bevor wir Ihre Excel-Datei verarbeiten können, benötigen wir einige Informationen 
                über den Kontext Ihrer Daten.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Empfänger wählen</h4>
                    <p className="text-sm text-gray-600">
                      Für welche Institution erstellen Sie die Meldung?
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Vorschrift bestimmen</h4>
                    <p className="text-sm text-gray-600">
                      Nach welchem Standard soll gemappt werden?
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Perspektive festlegen</h4>
                    <p className="text-sm text-gray-600">
                      Welcher Berichtstyp liegt vor?
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Tipp</h4>
                <p className="text-sm text-blue-800">
                  Diese Angaben helfen unserer KI dabei, die passendsten XBRL-Tags 
                  für Ihre Excel-Spalten zu finden. Je präziser Ihre Angaben, 
                  desto besser das Mapping-Ergebnis.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-2">
          <Card>
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Bitte beantworten Sie die folgenden Fragen
              </h2>
              
              <QuestionForm
                formData={formData}
                onChange={handleFormChange}
                errors={errors}
              />

              {/* Form Preview */}
              {isFormComplete && (
                <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-3">
                    ✓ Ihre Auswahl im Überblick
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-green-700 font-medium">Empfänger:</span>
                      <p className="text-green-800">{formData.recipient}</p>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Vorschrift:</span>
                      <p className="text-green-800">{formData.regulation}</p>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Perspektive:</span>
                      <p className="text-green-800">{formData.perspective}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <Navigation
        currentStep={1}
        onNext={handleNext}
        nextLabel="Zur Datei-Upload"
        nextDisabled={!isFormComplete}
      />

      {/* Help Section */}
      <Card className="bg-gray-50">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Benötigen Sie Hilfe bei der Auswahl?
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Falls Sie unsicher sind, welche Optionen für Ihren Use Case am besten geeignet sind, 
            können Sie mit den häufigsten Kombinationen beginnen:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900">Bundesbank Meldung</h4>
              <p className="text-sm text-gray-600 mt-1">
                Bundesbank → FINREP → Bilanz
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900">BaFin Reporting</h4>
              <p className="text-sm text-gray-600 mt-1">
                BaFin → COREP → Bilanz
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900">IFRS Abschluss</h4>
              <p className="text-sm text-gray-600 mt-1">
                Interne Meldung → IFRS → GuV
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}