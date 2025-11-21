// API configuration for different services


export const API_ENDPOINTS = {
   FILES: {
    BASE: '/drive',
    UPLOAD: '/drive/upload',           // uses presigned URL
    DOWNLOAD: '/drive/download',       // uses presigned URL
    COPY: '/drive/copy',
    MOVE: '/drive/move',
    RENAME: '/drive/rename',
    DELETE: '/files/delete',           // soft delete
    RESTORE: '/drive/restore',         // restore from trash
    RECENT: '/drive/recent',           // files last accessed by user
    INFO: '/drive/info',               // metadata/details about file
    PRESIGNED: '/drive/presigned',     // get presigned URL for upload/download/share
    TRASH: '/drive/trash',             // list all soft-deleted files
    TAGGED: '/drive/tagged',           // show user’s tagged files
    PRIVATE: '/drive/private',         // show user’s private cloud
  },

  STORAGE: {
    STATS: '/storage/stats',
    QUOTA: '/storage/quota',
  },
  USERS: {
    PROFILE: '/users/profile',
    PREFERENCES: '/users/preferences',
  },
};

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.yourdriveapp.com/v1',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  retryAttempts: 3,
};
