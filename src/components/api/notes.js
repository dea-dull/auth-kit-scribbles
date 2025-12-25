// src/api/notes.js
import { fetchWithAuth } from './fetchWithAuth';
import { notify } from '../ui/Notify.jsx'; // optional: for user feedback

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://your-api-id.execute-api.region.amazonaws.com/dev';

/**
 * Cached last online check to avoid redundant /ping calls
 */
let lastOnlineCheck = 0;
const ONLINE_CHECK_INTERVAL = 30000; // 30 seconds

export const isOnline = async () => {
  const now = Date.now();
  if (now - lastOnlineCheck < ONLINE_CHECK_INTERVAL) {
    return true; // assume online if checked recently
  }

  lastOnlineCheck = now;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${API_BASE_URL}/ping`, {
      method: 'GET',
      credentials: 'include', // send cookies if needed
      signal: controller.signal,
    });
    return res.ok;
  } catch (err) {
    console.error('Network error or timeout:', err);
    return false; // offline or network error
  } finally {
    clearTimeout(timeout);
  }
};

export const notesAPI = {
  async getNotes(filters = {}) {
    const params = new URLSearchParams();
    if (filters.tag) params.append('tag', filters.tag);
    if (filters.pinned !== undefined)
      params.append('pinned', String(filters.pinned));

    const query = params.toString();
    const url = `/notes${query ? `?${query}` : ''}`;

    try {
      const data = await fetchWithAuth(url);
      return data;
    } catch (err) {
      if (err.message.includes('404')) {
        console.warn('No notes found.');
        notify?.warn('No notes found.');
        return [];
      }
      if (err.message.includes('500')) {
        console.error('Server error while fetching notes.', err);
        notify?.error('Server error. Please try again later.');
      }
      throw err; // rethrow for higher-level handling if needed
    }
  },

  async syncNote(note) {
    try {
      const data = await fetchWithAuth('/notes/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
      notify?.success('Note synchronized successfully!');
      return data;
    } catch (err) {
      console.error('Failed to sync note', err);
      notify?.error('Failed to synchronize note.');
      throw err;
    }
  },

  async deleteNote(noteId) {
    try {
      const data = await fetchWithAuth(`/notes/${noteId}`, {
        method: 'DELETE',
      });
      notify?.success('Note deleted.');
      return data;
    } catch (err) {
      console.error('Failed to delete note', err);
      notify?.error('Failed to delete note.');
      throw err;
    }
  },

  async restoreNote(noteId) {
    try {
      const data = await fetchWithAuth(`/notes/${noteId}/restore`, {
        method: 'POST',
      });
      notify?.success('Note restored successfully!');
      return data;
    } catch (err) {
      console.error('Failed to restore note', err);
      notify?.error('Failed to restore note.');
      throw err;
    }
  },
};
