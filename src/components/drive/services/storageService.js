import { httpClient } from './api/httpClient';
import { API_ENDPOINTS } from '../config/api';

class StorageService {
  async getStorageStats() {
    return httpClient.get(API_ENDPOINTS.STORAGE.STATS);
  }

  async getStorageQuota() {
    return httpClient.get(API_ENDPOINTS.STORAGE.QUOTA);
  }

  async cleanupStorage() {
    return httpClient.post(`${API_ENDPOINTS.STORAGE.BASE}/cleanup`);
  }
}

export const storageService = new StorageService();
