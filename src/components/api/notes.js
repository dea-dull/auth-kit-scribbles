// src/api/notes.js

// This should be your deployed API Gateway URL
// For development, you might use something like:
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-api-id.execute-api.region.amazonaws.com/dev';

export const notesAPI = {
  /**
   * Sync a single note to AWS
   * @param {Object} note - The note object to sync
   */
  async syncNote(note) {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(note),
      });
      
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API sync error:', error);
      throw error; // Re-throw so components can handle it
    }
  },

  /**
   * Get all notes from AWS (with optional filtering)
   * @param {Object} filters - Optional filters {tag, pinned}
   */
  async getNotes(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.tag) queryParams.append('tag', filters.tag);
      if (filters.pinned !== undefined) queryParams.append('pinned', filters.pinned.toString());
      
      const url = `${API_BASE_URL}/notes${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notes: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API get notes error:', error);
      throw error;
    }
  },

  /**
   * Soft delete a note (marks it for deletion in 7 days)
   * @param {string} noteId - The ID of the note to delete
   */
  async deleteNote(noteId) {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API delete error:', error);
      throw error;
    }
  },

  /**
   * Restore a soft-deleted note
   * @param {string} noteId - The ID of the note to restore
   */
  async restoreNote(noteId) {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}/restore`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Restore failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API restore error:', error);
      throw error;
    }
  },
};

// Optional: Add a utility to check if we're online
export const isOnline = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'HEAD',
      timeout: 5000
    });
    return response.ok;
  } catch {
    return false;
  }
};