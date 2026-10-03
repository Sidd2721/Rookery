import { memoryStore } from './memory';

// For now, always use memory store. Will add supabase switch in T8.
export const store = memoryStore;
