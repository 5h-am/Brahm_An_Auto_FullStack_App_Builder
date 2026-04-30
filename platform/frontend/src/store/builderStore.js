import { create } from 'zustand';

const useBuilderStore = create((set) => ({
  rawConfig: '',
  normalizedConfig: null,
  validationErrors: [],
  monacoMarkers: [],
  engineWarnings: [],
  activeTab: 'preview',
  isDarkMode: false,
  isPreviewLoading: false,
  generatedFrontendCode: null,
  generatedBackendCode: null,
  pendingConfig: null,

  setRawConfig: (rawConfig) => set({ rawConfig }),
  setNormalizedConfig: (normalizedConfig) => set({
    normalizedConfig,
    generatedFrontendCode: null,
    generatedBackendCode: null
  }),
  setValidationErrors: (validationErrors) => set({ validationErrors }),
  setMonacoMarkers: (monacoMarkers) => set({ monacoMarkers }),
  setEngineWarnings: (engineWarnings) => set({ engineWarnings }),
  setActiveTab: (activeTab) => set({ activeTab }),
  toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
  setPreviewLoading: (isPreviewLoading) => set({ isPreviewLoading }),
  setGeneratedFrontendCode: (generatedFrontendCode) => set({ generatedFrontendCode }),
  setGeneratedBackendCode: (generatedBackendCode) => set({ generatedBackendCode }),
  setPendingConfig: (pendingConfig) => set({ pendingConfig }),
  resetBuilderState: () => set({
    rawConfig: '',
    normalizedConfig: null,
    validationErrors: [],
    monacoMarkers: [],
    engineWarnings: [],
    activeTab: 'preview',
    isPreviewLoading: false,
    generatedFrontendCode: null,
    generatedBackendCode: null,
    pendingConfig: null
  })
}));

export default useBuilderStore;
