import { useApi } from './useApi';
import { useCallback } from 'react';
import { storageService } from '../services/storageService';

export const useStorage = () => {
  const storageStatsApi = useApi(storageService.getStorageStats);
  const storageQuotaApi = useApi(storageService.getStorageQuota);

  const fetchStorageStats = useCallback(async () => {
    return await storageStatsApi.execute();
  }, [storageStatsApi]);

  const fetchStorageQuota = useCallback(async () => {
    return await storageQuotaApi.execute();
  }, [storageQuotaApi]);

  return {
    stats: storageStatsApi.data,
    quota: storageQuotaApi.data,
    loading: storageStatsApi.loading || storageQuotaApi.loading,
    error: storageStatsApi.error || storageQuotaApi.error,
    fetchStorageStats,
    fetchStorageQuota,
    refetch: () => {
      storageStatsApi.execute();
      storageQuotaApi.execute();
    },
  };
};