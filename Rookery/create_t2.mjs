import fs from 'fs';
import path from 'path';

const files = {
  'lib/types.ts': `
export interface Office {
  id: string;
  name_mr: string;
  name_en: string;
}

export interface Item {
  id: string;
  label_mr: string;
  label_en: string;
  how_mr: string;
  how_en: string;
}

export interface Service {
  id: string;
  office_id: string;
  name_mr: string;
  name_en: string;
  duration_min: number;
  checklist: Item[];
}

export type VisitStatus = 'gathering' | 'ready' | 'serving' | 'done' | 'sent_back';

export interface Visit {
  id: string;
  office_id: string;
  service_id: string;
  items_checked: string[];
  status: VisitStatus;
  token_no: number | null;
  sent_back_reason: string | null;
  created_at: string;
  ready_at: string | null;
}
`,
  'data/seed.json': `
{
  "_comment": "DEMO DATA. Marathi text needs native-speaker review. Replace with items copied from the office's published list.",
  "offices": [
    {
      "id": "demo-ward",
      "name_mr": "डेमो प्रभाग कार्यालय",
      "name_en": "Demo Ward Office"
    }
  ],
  "services": [
    {
      "id": "income-cert",
      "office_id": "demo-ward",
      "name_mr": "उत्पन्नाचा दाखला",
      "name_en": "Income certificate",
      "duration_min": 10,
      "checklist": [
        {
          "id": "aadhaar-copy",
          "label_mr": "आधार कार्ड (झेरॉक्स)",
          "label_en": "Aadhaar card (photocopy)",
          "how_mr": "कार्यालयाजवळील झेरॉक्स दुकानात",
          "how_en": "Photocopy shop near the office"
        },
        {
          "id": "photo",
          "label_mr": "पासपोर्ट साईज फोटो",
          "label_en": "Passport-size photo",
          "how_mr": "तुमच्या जवळील फोटो स्टुडिओमध्ये",
          "how_en": "At a photo studio near you"
        },
        {
          "id": "declaration",
          "label_mr": "स्वाक्षरी केलेले स्वयंघोषणापत्र",
          "label_en": "Signed self-declaration form",
          "how_mr": "मदत कक्षात विचारा",
          "how_en": "Ask at the help desk"
        },
        {
          "id": "address-proof",
          "label_mr": "पत्त्याचा पुरावा",
          "label_en": "Address proof",
          "how_mr": "वीज बिल किंवा रेशन कार्ड",
          "how_en": "Electricity bill or Ration card"
        }
      ]
    },
    {
      "id": "birth-cert",
      "office_id": "demo-ward",
      "name_mr": "जन्म दाखला",
      "name_en": "Birth certificate",
      "duration_min": 8,
      "checklist": [
        {
          "id": "aadhaar-copy",
          "label_mr": "आधार कार्ड (झेरॉक्स)",
          "label_en": "Aadhaar card (photocopy)",
          "how_mr": "कार्यालयाजवळील झेरॉक्स दुकानात",
          "how_en": "Photocopy shop near the office"
        },
        {
          "id": "hospital-record",
          "label_mr": "रुग्णालयातील जन्माची नोंद",
          "label_en": "Hospital birth record",
          "how_mr": "संबंधित रुग्णालयातून मिळवा",
          "how_en": "Get from the respective hospital"
        },
        {
          "id": "declaration",
          "label_mr": "स्वाक्षरी केलेले स्वयंघोषणापत्र",
          "label_en": "Signed self-declaration form",
          "how_mr": "मदत कक्षात विचारा",
          "how_en": "Ask at the help desk"
        },
        {
          "id": "address-proof",
          "label_mr": "पत्त्याचा पुरावा",
          "label_en": "Address proof",
          "how_mr": "वीज बिल किंवा रेशन कार्ड",
          "how_en": "Electricity bill or Ration card"
        }
      ]
    },
    {
      "id": "ration-update",
      "office_id": "demo-ward",
      "name_mr": "रेशन कार्ड अद्ययावत",
      "name_en": "Ration card update",
      "duration_min": 12,
      "checklist": [
        {
          "id": "old-ration",
          "label_mr": "जुने रेशन कार्ड",
          "label_en": "Old Ration card",
          "how_mr": "तुमच्या घरातील जुनी प्रत",
          "how_en": "Old copy from your house"
        },
        {
          "id": "aadhaar-copy",
          "label_mr": "आधार कार्ड (झेरॉक्स)",
          "label_en": "Aadhaar card (photocopy)",
          "how_mr": "कार्यालयाजवळील झेरॉक्स दुकानात",
          "how_en": "Photocopy shop near the office"
        },
        {
          "id": "address-proof",
          "label_mr": "पत्त्याचा पुरावा",
          "label_en": "Address proof",
          "how_mr": "नवीन घर असल्यास त्याचा पुरावा",
          "how_en": "Proof if new house"
        },
        {
          "id": "declaration",
          "label_mr": "स्वाक्षरी केलेले स्वयंघोषणापत्र",
          "label_en": "Signed self-declaration form",
          "how_mr": "मदत कक्षात विचारा",
          "how_en": "Ask at the help desk"
        }
      ]
    },
    {
      "id": "tax-copy",
      "office_id": "demo-ward",
      "name_mr": "मालमत्ता कर पावतीची प्रत",
      "name_en": "Property tax receipt copy",
      "duration_min": 6,
      "checklist": [
        {
          "id": "property-no",
          "label_mr": "मालमत्ता क्रमांक (इंडेक्स २)",
          "label_en": "Property number (Index 2)",
          "how_mr": "तुमच्या जुन्या पावतीवर असेल",
          "how_en": "Available on your old receipt"
        },
        {
          "id": "aadhaar-copy",
          "label_mr": "आधार कार्ड (झेरॉक्स)",
          "label_en": "Aadhaar card (photocopy)",
          "how_mr": "कार्यालयाजवळील झेरॉक्स दुकानात",
          "how_en": "Photocopy shop near the office"
        },
        {
          "id": "declaration",
          "label_mr": "स्वाक्षरी केलेले स्वयंघोषणापत्र",
          "label_en": "Signed self-declaration form",
          "how_mr": "मदत कक्षात विचारा",
          "how_en": "Ask at the help desk"
        }
      ]
    }
  ]
}
`,
  'lib/store/memory.ts': `
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
`,
  'lib/store/index.ts': `
import { memoryStore } from './memory';

// For now, always use memory store. Will add supabase switch in T8.
export const store = memoryStore;
`,
  'lib/i18n.ts': `
export function t(obj: any, key: string, lang: 'mr' | 'en' = 'en'): string {
  if (!obj) return '';
  const val = obj[\`\${key}_\${lang}\`];
  if (val) return val;
  // Fallback to English
  return obj[\`\${key}_en\`] || '';
}
`,
  'lib/wait.ts': `
import { Visit, Service } from './types';
import { store } from './store';

export async function calculateWaitTime(visit: Visit): Promise<number | null> {
  if (visit.status !== 'ready' && visit.status !== 'serving') return null;
  if (visit.token_no === null) return null;

  const visits = await store.getVisits();
  const aheadVisits = visits.filter(
    (v) =>
      v.office_id === visit.office_id &&
      (v.status === 'ready' || v.status === 'serving') &&
      v.token_no !== null &&
      v.token_no < (visit.token_no as number)
  );

  let waitMin = 0;
  for (const v of aheadVisits) {
    const service = await store.getService(v.service_id);
    if (service) {
      waitMin += service.duration_min;
    }
  }

  return waitMin;
}

export async function getAheadCount(visit: Visit): Promise<number> {
  if (visit.token_no === null) return 0;
  
  const visits = await store.getVisits();
  return visits.filter(
    (v) =>
      v.office_id === visit.office_id &&
      (v.status === 'ready' || v.status === 'serving') &&
      v.token_no !== null &&
      v.token_no < (visit.token_no as number)
  ).length;
}
`,
  'lib/security.ts': `
// In-memory rate limiter for PIN attempts
const attempts: Record<string, { count: number; firstAttempt: number }> = {};

export function checkPinRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = attempts[ip];
  
  if (!record) {
    attempts[ip] = { count: 1, firstAttempt: now };
    return true;
  }
  
  if (now - record.firstAttempt > 5 * 60 * 1000) {
    // Reset after 5 minutes
    attempts[ip] = { count: 1, firstAttempt: now };
    return true;
  }
  
  if (record.count >= 5) {
    return false; // Rate limited
  }
  
  record.count += 1;
  return true;
}

export function verifyPin(pin: string): boolean {
  const expected = process.env.CLERK_PIN || '';
  if (!pin || !expected) return false;
  
  // Constant time comparison (simple version)
  let diff = expected.length ^ pin.length;
  for (let i = 0; i < expected.length && i < pin.length; i++) {
    diff |= expected.charCodeAt(i) ^ pin.charCodeAt(i);
  }
  
  return diff === 0;
}
`,
  'app/api/services/route.ts': `
import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const office_id = searchParams.get('office_id');
  
  if (!office_id) {
    return NextResponse.json({ error: 'Missing office_id' }, { status: 400 });
  }

  const services = await store.getServices(office_id);
  return NextResponse.json(services);
}
`,
  'app/api/health/route.ts': `
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    store: process.env.STORE_DRIVER || 'memory',
    mock: process.env.MOCK_MODE === 'true'
  });
}
`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\\n');
  console.log(\`Created \${filePath}\`);
}
