// App-wide configuration
export const APP_CONFIG = {
  name: 'starage',
  version: '1.0.0',
  features: {
    analytics: true,
    offline: false,
    realTime: true,
  },
};

// Storage constants
export const STORAGE_CONFIG = {
  limit: 15, // GB
  warningThreshold: 0.8, // 80%
};

// File type configurations
export const FILE_TYPES = {
  folder: { icon: 'folder', color: '#8ef58a' },
  pdf: { icon: 'pdf', color: '#f56565' },
  docx: { icon: 'document', color: '#4299e1' },
  txt: { icon: 'document', color: '#a0aec0' },
  default: { icon: 'file', color: '#718096' },
};