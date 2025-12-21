// db.js
import Dexie from 'dexie';

export const db = new Dexie('NotesDatabase');
db.version(1).stores({
  notes: 'id, title, content, createdAt, updatedAt, pinned, favorite, tags, synced'
});

export const localNotesAPI = {
  async getAllNotes() {
    return await db.notes.toArray();
  },
  
  async getNote(id) {
    return await db.notes.get(id);
  },
  
  async saveNote(note) {
    const noteWithTimestamp = {
      ...note,
      updatedAt: new Date().toISOString(),
      synced: false
    };
    return await db.notes.put(noteWithTimestamp);
  },
  
  async deleteNote(id) {
    return await db.notes.delete(id);
  },
  
  async markAsSynced(id) {
    return await db.notes.update(id, { synced: true });
  },
  
  async getUnsyncedNotes() {
    return await db.notes.where('synced').equals(false).toArray();
  }
};