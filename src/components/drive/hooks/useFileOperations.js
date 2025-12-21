import { useCallback } from 'react';
import { useApi } from './useApi';
import { fileService } from '../services/FileServices';

// Specialized hook for file operations that uses the generic useApi hook
export const useFileOperations = () => {
  const recentFilesApi = useApi(fileService.getRecentFiles);
  const deleteFileApi = useApi(fileService.deleteFile);
  const renameFileApi = useApi(fileService.renameFile);

  const deleteFile = useCallback(async (fileId) => {
    try {
      await deleteFileApi.execute(fileId);
      return true;
    } catch (error) {
      console.error('Delete file error:', error);
      return false;
    }
  }, [deleteFileApi]);

  const renameFile = useCallback(async (fileId, newName) => {
    try {
      await renameFileApi.execute(fileId, newName);
      return true;
    } catch (error) {
      console.error('Rename file error:', error);
      return false;
    }
  }, [renameFileApi]);

  const fetchRecentFiles = useCallback(async () => {
    try {
      return await recentFilesApi.execute();
    } catch (error) {
      console.error('Fetch files error:', error);
      return [];
    }
  }, [recentFilesApi]);

  return {
    // Individual states
    loading: recentFilesApi.loading || deleteFileApi.loading || renameFileApi.loading,
    error: recentFilesApi.error || deleteFileApi.error || renameFileApi.error,
    
    // Individual API states (if needed by components)
    recentFilesState: recentFilesApi,
    deleteFileState: deleteFileApi,
    renameFileState: renameFileApi,
    
    // Operations
    deleteFile,
    renameFile,
    fetchRecentFiles,
    
    // Reset functions
    clearError: recentFilesApi.reset,
  };
};

