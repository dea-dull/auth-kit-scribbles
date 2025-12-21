import { httpClient, HttpError } from './api/httpClient';
import { API_ENDPOINTS } from '../config/api';

class FileService {
  async getRecentFiles() {
    return httpClient.get(API_ENDPOINTS.FILES.RECENT);
  }

  async getFileById(id) {
    return httpClient.get(`${API_ENDPOINTS.FILES.BASE}/${id}`);
  }

  async deleteFile(id) {
    return httpClient.delete(`${API_ENDPOINTS.FILES.BASE}/${id}`);
  }

  async renameFile(id, newName) {
    return httpClient.patch(`${API_ENDPOINTS.FILES.BASE}/${id}`, { name: newName });
  }

  async uploadFile(file, onProgress, additionalFields = {}) {
    try {
      return await httpClient.upload(
        API_ENDPOINTS.FILES.UPLOAD,
        file,
        onProgress,
        { fields: additionalFields }
      );
    } catch (error) {
      if (error.status === 413) {
        throw new HttpError(413, 'File too large');
      }
      throw error;
    }
  }

  async uploadMultipleFiles(files, onProgress, additionalFields = {}) {
    const formData = new FormData();
    
    // Append all files
    files.forEach((file, index) => {
      formData.append('files', file);
    });

    // Add additional fields
    Object.entries(additionalFields).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return httpClient.post(API_ENDPOINTS.FILES.UPLOAD, formData, {
      onUploadProgress: onProgress,
    });
  }

  async downloadFile(id, filename) {
    const blob = await httpClient.download(`${API_ENDPOINTS.FILES.DOWNLOAD}/${id}`);
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `download-${id}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return blob;
  }

  async getFilePreview(id) {
    return httpClient.get(`${API_ENDPOINTS.FILES.BASE}/${id}/preview`, {
      headers: {
        'Accept': 'image/*, application/pdf',
      },
    });
  }

  async shareFile(id, shareWith, permissions = ['read']) {
    return httpClient.post(`${API_ENDPOINTS.FILES.BASE}/${id}/share`, {
      shareWith,
      permissions,
    });
  }
}

export const fileService = new FileService();