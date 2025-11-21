import { API_CONFIG } from '../../config/api.js';

class HttpClient {
  constructor(baseURL, config = {}) {
    this.baseURL = baseURL;
    this.config = {
      timeout: 10000,
      retryAttempts: 3,
      ...config,
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    // Prepare headers - don't auto-set Content-Type for FormData
    const headers = new Headers();
    
    // Only set Content-Type if not FormData and not already provided
    if (!(options.body instanceof FormData) && !options.headers?.['Content-Type']) {
      headers.set('Content-Type', 'application/json');
    }

    // Add custom headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    const config = {
      signal: controller.signal,
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new HttpError(response.status, errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await this.parseResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleError(error);
    }
  }

  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    
    if (contentType?.includes('text/')) {
      return await response.text();
    }
    
    // For file downloads, return blob
    if (contentType?.includes('application/octet-stream') || 
        contentType?.includes('application/pdf') ||
        response.headers.get('content-disposition')?.includes('attachment')) {
      return await response.blob();
    }
    
    // Fallback for empty responses
    return await response.text();
  }

  async parseErrorResponse(response) {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }
      return { message: await response.text() };
    } catch {
      return { message: `HTTP error! status: ${response.status}` };
    }
  }

  handleError(error) {
    if (error.name === 'AbortError') {
      return new HttpError(408, 'Request timeout');
    }
    if (error instanceof HttpError) {
      return error;
    }
    return new HttpError(0, error.message || 'Network error occurred');
  }

  // GET request
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  // POST request with smart body handling
  post(endpoint, data, options = {}) {
    let body = data;
    
    // Handle FormData (file uploads)
    if (data instanceof FormData) {
      // Don't set Content-Type - let browser set it with boundary
      if (options.headers?.['Content-Type']) {
        const { ['Content-Type']: _, ...restHeaders } = options.headers;
        options.headers = restHeaders;
      }
    } 
    // Handle JSON data
    else if (data && typeof data === 'object') {
      body = JSON.stringify(data);
    }
    // Other data types (string, Blob, etc.) pass through as-is

    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body,
    });
  }

  // PATCH request
  patch(endpoint, data, options = {}) {
    let body = data;
    
    if (data && typeof data === 'object' && !(data instanceof FormData)) {
      body = JSON.stringify(data);
    }

    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body,
    });
  }

  // PUT request
  put(endpoint, data, options = {}) {
    let body = data;
    
    if (data && typeof data === 'object' && !(data instanceof FormData)) {
      body = JSON.stringify(data);
    }

    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body,
    });
  }

  // DELETE request
  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // File upload with progress tracking
  async upload(endpoint, file, onProgress, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    // Add additional fields if provided
    if (options.fields) {
      Object.entries(options.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.post(endpoint, formData, {
      ...options,
      onUploadProgress: onProgress,
    });
  }

  // File download helper
  async download(endpoint, options = {}) {
    const blob = await this.get(endpoint, {
      ...options,
      headers: {
        'Accept': 'application/octet-stream',
        ...options.headers,
      },
    });

    return blob;
  }
}

// Custom HTTP error class
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export { HttpError };
export const httpClient = new HttpClient(API_CONFIG.baseURL, {
  timeout: API_CONFIG.timeout,
});


























/** how they would translate into API endpoints and S3 actions, including pre-signed URLs, private cloud, trash, and tags. I’ll organize it clearly.

1. File Operations & API Endpoints
Operation	Purpose	Endpoint	HTTP Method	Notes
Get recent files	Show last accessed files for a user	/files/recent	GET	Backend filters by user ID
Get file info	Fetch metadata for a file	/files/:id	GET	Includes name, type, size, folder, tags
Upload file	Upload a single file	/files/upload	POST	Usually returns a pre-signed URL if using S3 directly; file can also be uploaded via backend
Upload multiple files	Upload several files at once	/files/upload-multiple	POST	Sends FormData with multiple files
Download file	Get file content	/files/download/:id	GET	Uses pre-signed URL for S3 or backend proxy
Rename file	Change a file’s name	/files/:id	PATCH	Partial update of metadata
Move file	Change folder location	/files/:id/move	PATCH	Payload: { folderId: 'newFolderId' }
Copy file	Duplicate a file	/files/:id/copy	POST	Payload: { folderId: 'destinationFolderId' }
Delete file (soft)	Move file to trash	/files/:id	DELETE	Backend sets deletedAt timestamp; 7-day soft delete policy
Restore file from trash	Recover file before permanent deletion	/files/:id/restore	POST or PATCH	Sets deletedAt back to null
Get file preview	Thumbnail/preview	/files/:id/preview	GET	Returns image/pdf preview for UI
Share file	Give access to other users	/files/:id/share	POST	Payload: { shareWith: [...], permissions: [...] }
Get files by folder	List files in a folder	/files/folder/:id	GET	Optional: private, tagged sections
Get files by tag	List files with a tag	/files/tag/:tagName	GET	Supports multiple tags
2. S3 Integration Considerations

Pre-signed URL: For uploads, downloads, or sharing, backend generates a temporary URL allowing the client to interact with S3 directly.
Example:

Upload: /files/upload → backend returns { url: '...', fields: {...} }

Download: /files/download/:id → backend returns pre-signed GET URL

Private cloud / tagged files:

Backend filters files by userId and private flag or tags array.

Endpoints:

/files/private → GET user’s private files

/files/tag/:tagName → GET files with a specific tag

Trash / soft delete:

Soft delete sets deletedAt timestamp in DB.

/files/:id DELETE → moves to trash.

/files/trash GET → list of trashed files.

/files/:id/restore POST → restores file.

Cron job or S3 lifecycle rule deletes permanently after 7 days.

Progress tracking on uploads:

Use FormData for files, attach progress listener.

Backend can return uploaded file ID and metadata. */