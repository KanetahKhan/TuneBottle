/**
 * storage.js
 * Local adapter that mirrors the Claude artifact window.storage API.
 * Uses localStorage so bottles persist between browser sessions.
 *
 * For a real multi-user backend, swap these functions with API calls
 * (e.g. Supabase, Firebase, or your own Express/PostgreSQL server).
 */

const PREFIX = 'tunebottle:';

export const storage = {
  async get(key) {
    try {
      const value = localStorage.getItem(PREFIX + key);
      if (value === null) throw new Error('Key not found');
      return { key, value };
    } catch (e) {
      throw e;
    }
  },

  async set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, value);
      return { key, value };
    } catch (e) {
      console.error('Storage set failed:', e);
      return null;
    }
  },

  async delete(key) {
    localStorage.removeItem(PREFIX + key);
    return { key, deleted: true };
  },

  async list(prefix = '') {
    const keys = Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX + prefix))
      .map(k => k.slice(PREFIX.length));
    return { keys };
  },
};
