// Form question types
export type Recipient = 'Bundesbank' | 'BaFin' | 'Interne Meldung';
export type Regulation = 'IFRS' | 'FINREP' | 'COREP' | 'HGB';
export type Perspective = 'Bilanz' | 'GuV' | 'Segmentbericht';

// Form data interface
export interface FormData {
  recipient: Recipient | '';
  regulation: Regulation | '';
  perspective: Perspective | '';
}

// File upload types
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  arrayBuffer: ArrayBuffer;
}

// Excel column information
export interface ExcelColumn {
  name: string;
  index: number;
  type?: 'string' | 'number' | 'date' | 'boolean';
  sampleValues?: (string | number | boolean | null)[];
}

// XBRL mapping types
export interface XBRLMapping {
  excelColumn: string;
  xbrlTag: string;
  confidence: number;
  description?: string;
  dataType?: 'monetary' | 'decimal' | 'string' | 'date' | 'boolean' | 'shares';
  namespace?: string;
}

// XBRL 2.1 Standard types
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

// OpenAI response structure
export interface OpenAIMappingResponse {
  mappings: XBRLMapping[];
  reasoning?: string;
  warnings?: string[];
  confidence_score: number;
}

// Server action response types
export interface ServerActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MappingResult extends ServerActionResult<OpenAIMappingResponse> {
  processingTime?: number;
  columnsProcessed?: number;
}

// Progress and loading states
export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
  steps?: ProcessingStep[];
}

// Navigation and routing
export interface NavigationStep {
  step: number;
  title: string;
  path: string;
  completed: boolean;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ProcessingError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
}

// OpenAI prompt configuration
export interface PromptConfig {
  recipient: Recipient;
  regulation: Regulation;
  perspective: Perspective;
  columns: string[];
  context?: string;
}

// Session data for maintaining state across pages
export interface SessionData {
  formData: FormData;
  uploadedFile?: {
    name: string;
    size: number;
    columns: ExcelColumn[];
  };
  mappingResult?: OpenAIMappingResponse;
  timestamp: number;
}

// Component prop types
export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: { title: string; completed: boolean }[];
}

export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile?: File;
  isUploading?: boolean;
  error?: string;
}

export interface MappingTableProps {
  mappings: XBRLMapping[];
  onEdit?: (mapping: XBRLMapping, index: number) => void;
  readonly?: boolean;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

// Constants for form options
export const RECIPIENTS: { value: Recipient; label: string }[] = [
  { value: 'Bundesbank', label: 'Bundesbank' },
  { value: 'BaFin', label: 'BaFin' },
  { value: 'Interne Meldung', label: 'Interne Meldung' }
];

export const REGULATIONS: { value: Regulation; label: string }[] = [
  { value: 'IFRS', label: 'IFRS' },
  { value: 'FINREP', label: 'FINREP' },
  { value: 'COREP', label: 'COREP' },
  { value: 'HGB', label: 'HGB' }
];

export const PERSPECTIVES: { value: Perspective; label: string }[] = [
  { value: 'Bilanz', label: 'Bilanz' },
  { value: 'GuV', label: 'Gewinn- und Verlustrechnung' },
  { value: 'Segmentbericht', label: 'Segmentbericht' }
];

// API endpoint types
export interface APIEndpoints {
  processMapping: '/api/process-mapping';
  uploadFile: '/api/upload';
  validateMapping: '/api/validate-mapping';
}

// Feature flags and configuration
export interface AppConfig {
  maxFileSize: number;
  allowedFileTypes: string[];
  openAI: {
    model: string;
    maxTokens: number;
    temperature: number;
  };
  ui: {
    stepsTotal: number;
    enableDebugMode: boolean;
  };
}
