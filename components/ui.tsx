'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Upload, X, Check, AlertCircle, FileText, Loader2 } from 'lucide-react';
import {
  FormData,
  XBRLMapping,
  ProcessingStep,
  RECIPIENTS,
  REGULATIONS,
  PERSPECTIVES
} from '@/types';
import { formatFileSize, formatConfidence, getConfidenceColor } from '@/lib/utils';

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100'
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={`form-input ${error ? 'border-red-500 focus-visible:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
      {helper && !error && (
        <p className="text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
};

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  placeholder = 'Bitte wählen...',
  className = '',
  value,
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        className={`form-select ${error ? 'border-red-500 focus-visible:ring-red-500' : ''} ${className}`}
        value={value || ''}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

// Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md'
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`card ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

// Progress Indicator Component
interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: { title: string; completed: boolean }[];
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  steps
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-gray-700">
          Schritt {currentStep} von {totalSteps}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round(progressPercentage)}% abgeschlossen
        </span>
      </div>

      <div className="progress-bar mb-6">
        <div
          className="progress-fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index + 1 < currentStep ? 'bg-green-600 text-white' :
              index + 1 === currentStep ? 'bg-blue-600 text-white' :
              'bg-gray-200 text-gray-600'
            }`}>
              {index + 1 < currentStep ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            <span className={`mt-2 text-xs text-center ${
              index + 1 <= currentStep ? 'text-gray-900' : 'text-gray-500'
            }`}>
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading Component
interface LoadingProps {
  message?: string;
  steps?: ProcessingStep[];
}

export const Loading: React.FC<LoadingProps> = ({ message, steps }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="loading-dots mb-6">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>

      {message && (
        <p className="text-lg text-gray-700 mb-4">{message}</p>
      )}

      {steps && (
        <div className="w-full max-w-md space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                step.status === 'completed' ? 'bg-green-600' :
                step.status === 'processing' ? 'bg-blue-600' :
                step.status === 'error' ? 'bg-red-600' :
                'bg-gray-300'
              }`}>
                {step.status === 'completed' ? (
                  <Check className="w-4 h-4 text-white" />
                ) : step.status === 'processing' ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : step.status === 'error' ? (
                  <X className="w-4 h-4 text-white" />
                ) : (
                  <div className="w-2 h-2 bg-gray-600 rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{step.label}</p>
                {step.message && (
                  <p className="text-xs text-gray-500">{step.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// File Upload Component
interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile?: File;
  isUploading?: boolean;
  error?: string;
  accept?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  isUploading = false,
  error,
  accept = '.xlsx,.xls'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (selectedFile) {
    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-medium text-green-900">{selectedFile.name}</p>
              <p className="text-sm text-green-700">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFileRemove}
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        <Upload className={`w-12 h-12 mx-auto mb-4 ${
          error ? 'text-red-400' : 'text-gray-400'
        }`} />

        <p className={`text-lg font-medium mb-2 ${
          error ? 'text-red-900' : 'text-gray-900'
        }`}>
          Excel-Datei hochladen
        </p>

        <p className={`text-sm mb-4 ${
          error ? 'text-red-700' : 'text-gray-600'
        }`}>
          Ziehen Sie eine Datei hierher oder klicken Sie zum Auswählen
        </p>

        <p className="text-xs text-gray-500">
          Unterstützte Formate: .xlsx, .xls (max. 10MB)
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

// Question Form Component
interface QuestionFormProps {
  formData: FormData;
  onChange: (data: FormData) => void;
  errors?: { [key: string]: string };
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  formData,
  onChange,
  errors = {}
}) => {
  const handleChange = (field: keyof FormData, value: string) => {
    console.log(field, value);
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Select
        label="Für wen?"
        options={RECIPIENTS}
        value={formData.recipient}
        onChange={(e) => handleChange('recipient', e.target.value)}
        error={errors.recipient}
        placeholder="Empfänger auswählen..."
      />

      <Select
        label="Welche Vorschrift?"
        options={REGULATIONS}
        value={formData.regulation}
        onChange={(e) => handleChange('regulation', e.target.value)}
        error={errors.regulation}
        placeholder="Vorschrift auswählen..."
      />

      <Select
        label="Welche Perspektive?"
        options={PERSPECTIVES}
        value={formData.perspective}
        onChange={(e) => handleChange('perspective', e.target.value)}
        error={errors.perspective}
        placeholder="Perspektive auswählen..."
      />
    </div>
  );
};

// Mapping Table Component
interface MappingTableProps {
  mappings: XBRLMapping[];
  onEdit?: (mapping: XBRLMapping, index: number) => void;
  readonly?: boolean;
}

export const MappingTable: React.FC<MappingTableProps> = ({
  mappings,
  onEdit,
  readonly = false
}) => {
  if (mappings.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-gray-500">Keine Mappings verfügbar</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Excel-Spalte
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                XBRL-Tag
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Konfidenz
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Datentyp
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                Beschreibung
              </th>
              {!readonly && (
                <th className="text-left py-3 px-4 font-medium text-gray-900">
                  Aktionen
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {mappings.map((mapping, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">
                  {mapping.excelColumn}
                </td>
                <td className="py-3 px-4 text-gray-700 font-mono text-xs">
                  {mapping.xbrlTag}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    getConfidenceColor(mapping.confidence)
                  }`}>
                    {formatConfidence(mapping.confidence)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {mapping.dataType}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600 max-w-xs">
                  {mapping.description}
                </td>
                {!readonly && (
                  <td className="py-3 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(mapping, index)}
                    >
                      Bearbeiten
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// Navigation Component
interface NavigationProps {
  currentStep: number;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  backDisabled?: boolean;
  loading?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentStep,
  onBack,
  onNext,
  nextLabel = 'Weiter',
  backLabel = 'Zurück',
  nextDisabled = false,
  backDisabled = false,
  loading = false
}) => {
  return (
    <div className="flex justify-between items-center pt-6 border-t border-gray-200">
      <div>
        {currentStep > 1 && onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={backDisabled || loading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {backLabel}
          </Button>
        )}
      </div>

      <div>
        {onNext && (
          <Button
            variant="primary"
            onClick={onNext}
            disabled={nextDisabled || loading}
            loading={loading}
          >
            {nextLabel}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Alert Component
interface AlertProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, title, children, onClose }) => {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    success: <Check className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    error: <X className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />
  };

  return (
    <div className={`border rounded-lg p-4 ${styles[type]}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="flex-1">
          {title && (
            <h4 className="font-medium mb-1">{title}</h4>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-current hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
