import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { FormData, ExcelColumn, OpenAIMappingResponse } from '@/types';

interface FileInfo {
  name: string;
  size: number;
  processingTime?: number;
  columnsProcessed?: number;
}

interface XBRLStore {
  // Form data state
  formData: FormData;
  setFormData: (data: FormData) => void;
  updateFormData: (data: Partial<FormData>) => void;
  
  // Excel file state
  originalColumns: ExcelColumn[] | null;
  setOriginalColumns: (columns: ExcelColumn[]) => void;
  
  // File info state
  fileInfo: FileInfo | null;
  setFileInfo: (info: FileInfo) => void;
  
  // Mapping results state
  mappingResult: OpenAIMappingResponse | null;
  setMappingResult: (result: OpenAIMappingResponse) => void;
  
  // UI state
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  
  processingStep: string;
  setProcessingStep: (step: string) => void;
  
  // Actions
  clearAll: () => void;
  canRegenerate: () => boolean;
}

export const useXBRLStore = create<XBRLStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    formData: {
      recipient: '',
      regulation: '',
      perspective: ''
    },
    originalColumns: null,
    fileInfo: null,
    mappingResult: null,
    isProcessing: false,
    processingStep: '',

    // Form data actions
    setFormData: (data) => set({ formData: data }),
    updateFormData: (data) => set((state) => ({ 
      formData: { ...state.formData, ...data } 
    })),

    // Excel columns actions
    setOriginalColumns: (columns) => set({ originalColumns: columns }),

    // File info actions
    setFileInfo: (info) => set({ fileInfo: info }),

    // Mapping result actions
    setMappingResult: (result) => set({ mappingResult: result }),

    // UI state actions
    setIsProcessing: (processing) => set({ isProcessing: processing }),
    setProcessingStep: (step) => set({ processingStep: step }),

    // Utility actions
    clearAll: () => set({
      formData: {
        recipient: '',
        regulation: '',
        perspective: ''
      },
      originalColumns: null,
      fileInfo: null,
      mappingResult: null,
      isProcessing: false,
      processingStep: ''
    }),

    canRegenerate: () => {
      const { originalColumns, formData } = get();
      return !!(
        originalColumns && 
        originalColumns.length > 0 &&
        formData.recipient &&
        formData.regulation &&
        formData.perspective
      );
    }
  }))
);

// Persistence middleware for critical data (optional)
export const usePersistentXBRLStore = create<{
  formData: FormData;
  setFormData: (data: FormData) => void;
}>()(
  subscribeWithSelector((set) => ({
    formData: {
      recipient: '',
      regulation: '',
      perspective: ''
    },
    setFormData: (data) => {
      set({ formData: data });
      // Still persist form data to session storage for navigation reliability
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('xbrl-form-data', JSON.stringify(data));
      }
    }
  }))
);

// Utility hooks for specific store slices
export const useFormData = () => {
  const formData = useXBRLStore((state) => state.formData);
  const setFormData = useXBRLStore((state) => state.setFormData);
  const updateFormData = useXBRLStore((state) => state.updateFormData);
  
  return { formData, setFormData, updateFormData };
};

export const useFileState = () => {
  const originalColumns = useXBRLStore((state) => state.originalColumns);
  const setOriginalColumns = useXBRLStore((state) => state.setOriginalColumns);
  const fileInfo = useXBRLStore((state) => state.fileInfo);
  const setFileInfo = useXBRLStore((state) => state.setFileInfo);
  
  return { originalColumns, setOriginalColumns, fileInfo, setFileInfo };
};

export const useMappingState = () => {
  const mappingResult = useXBRLStore((state) => state.mappingResult);
  const setMappingResult = useXBRLStore((state) => state.setMappingResult);
  const canRegenerate = useXBRLStore((state) => state.canRegenerate);
  
  return { mappingResult, setMappingResult, canRegenerate };
};

export const useProcessingState = () => {
  const isProcessing = useXBRLStore((state) => state.isProcessing);
  const setIsProcessing = useXBRLStore((state) => state.setIsProcessing);
  const processingStep = useXBRLStore((state) => state.processingStep);
  const setProcessingStep = useXBRLStore((state) => state.setProcessingStep);
  
  return { isProcessing, setIsProcessing, processingStep, setProcessingStep };
};