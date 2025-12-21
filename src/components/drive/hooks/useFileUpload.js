import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { fileService } from '../services/FileServices';

export const useFileUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const uploadApi = useApi(fileService.uploadFile);

  const uploadFile = useCallback(async (file, additionalFields = {}) => {
    setIsUploading(true);
    setUploadProgress(0);

    const onProgress = (progressEvent) => {
      if (progressEvent.lengthComputable) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      }
    };

    try {
      const result = await uploadApi.execute(file, onProgress, additionalFields);
      setUploadProgress(100);
      return result;
    } finally {
      setIsUploading(false);
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [uploadApi]);

  const uploadMultipleFiles = useCallback(async (files, additionalFields = {}) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const onProgress = (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      };

      const result = await fileService.uploadMultipleFiles(
        files, 
        onProgress, 
        additionalFields
      );
      setUploadProgress(100);
      return result;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  const cancelUpload = useCallback(() => {
    uploadApi.reset();
    setIsUploading(false);
    setUploadProgress(0);
  }, [uploadApi]);

  return {
    uploadFile,
    uploadMultipleFiles,
    cancelUpload,
    uploadProgress,
    isUploading,
    loading: uploadApi.loading,
    error: uploadApi.error,
    reset: uploadApi.reset,
  };
};
