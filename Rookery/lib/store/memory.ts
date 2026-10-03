import { Office, Service, Visit } from '../types';
import seedData from '../../data/seed.json';

// Global declaration to avoid wiping data on hot reload
declare global {
  var _tayarMemoryStore: {
    offices: Office[];
    services: Service[];
    visits: Visit[];
  } | undefined;
}

if (!globalThis._tayarMemoryStore) {
  globalThis._tayarMemoryStore = {
    offices: seedData.offices,
    services: seedData.services,
    visits: [],
  };
}

const store = globalThis._tayarMemoryStore;

export const memoryStore = {
  getOffices: async (): Promise<Office[]> => {
    return store.offices;
  },
  getServices: async (office_id: string): Promise<Service[]> => {
    return store.services.filter((s) => s.office_id === office_id);
  },
  getService: async (service_id: string): Promise<Service | null> => {
    return store.services.find((s) => s.id === service_id) || null;
  },
  getVisits: async (): Promise<Visit[]> => {
    return store.visits;
  },
  getVisit: async (id: string): Promise<Visit | null> => {
    return store.visits.find((v) => v.id === id) || null;
  },
  createVisit: async (visit: Visit): Promise<void> => {
    store.visits.push(visit);
  },
  updateVisit: async (id: string, updates: Partial<Visit>): Promise<Visit | null> => {
    const idx = store.visits.findIndex((v) => v.id === id);
    if (idx === -1) return null;
    store.visits[idx] = { ...store.visits[idx], ...updates };
    return store.visits[idx];
  },
  clearVisits: async (): Promise<void> => {
    store.visits = [];
  },
  getNextTokenNo: async (office_id: string): Promise<number> => {
    const officeVisits = store.visits.filter(v => v.office_id === office_id && v.token_no !== null);
    if (officeVisits.length === 0) return 1;
    const max = Math.max(...officeVisits.map(v => v.token_no as number));
    return max + 1;
  }
};
