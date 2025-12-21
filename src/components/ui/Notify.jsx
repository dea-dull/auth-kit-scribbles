// Notify.jsx
import { toast } from 'sonner';

const defaultOptions = {
  duration: 6000,
  style: {
    background: '#222',
    color: '#f0f0f0',
    borderRadius: '8px',
    fontWeight: '600',
  },
  success: {
    iconTheme: {
      primary: '#4caf50',
      secondary: '#d4edda',
    },
  },
  error: {
    iconTheme: {
      primary: '#f44336',
      secondary: '#f8d7da',
    },
  },
  // Add other types if you want
};

export const notify = {
  success: (msg, options = {}) => toast.success(msg, { ...defaultOptions, ...defaultOptions.success, ...options }),
  error: (msg, options = {}) => toast.error(msg, { ...defaultOptions, ...defaultOptions.error, ...options }),
  loading: (msg, options = {}) => toast.loading(msg, { ...defaultOptions, ...options }),
  custom: (msg, options = {}) => toast(msg, { ...defaultOptions, ...options }),
};
