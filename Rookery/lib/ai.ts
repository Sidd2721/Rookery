import { Service } from './types';

// In-memory AI call counter
let aiCallCount = 0;

// Cache: lowercase text -> result
const cache = new Map<string, { service_id: string | null; confidence: number; source: string }>();

function mockMatch(text: string, services: Service[]): { service_id: string | null; confidence: number } {
  const lower = text.toLowerCase();
  for (const s of services) {
    const nameEn = s.name_en.toLowerCase();
    const nameMr = s.name_mr;
    const id = s.id.toLowerCase();
    if (
      lower.includes(nameEn) ||
      lower.includes(id.replace(/-/g, ' ')) ||
      lower.includes(id.replace('-cert', '')) ||
      lower.includes(id.replace('-', '')) ||
      (nameMr && lower.includes(nameMr))
    ) {
      return { service_id: s.id, confidence: 0.85 };
    }
    // Keyword fragments
    const words = nameEn.split(' ');
    for (const w of words) {
      if (w.length > 4 && lower.includes(w)) {
        return { service_id: s.id, confidence: 0.65 };
      }
    }
  }
  return { service_id: null, confidence: 0 };
}

async function liveCall(
  text: string,
  services: Service[]
): Promise<{ service_id: string | null; confidence: number; source: 'ai' | 'fallback' }> {
  const apiBase = process.env.KIMI_API_BASE;
  const apiKey = process.env.KIMI_API_KEY;
  const model = process.env.KIMI_MODEL || 'kimi-k3';
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || '8000', 10);
  const maxTokens = parseInt(process.env.AI_MAX_TOKENS || '800', 10);

  const serviceList = services
    .map(s => `- ${s.id}: ${s.name_en} / ${s.name_mr}`)
    .join('\n');

  const systemPrompt = `You are a service mapper. The allowed service IDs are:\n${serviceList}\n\nReply with JSON only: {"service_id": "<one allowed id or null>", "confidence": <0 to 1>}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return { service_id: null, confidence: 0, source: 'fallback' };

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content || '';

    // Parse first {...}
    const match = content.match(/\{[^}]+\}/);
    if (!match) return { service_id: null, confidence: 0, source: 'fallback' };

    const parsed = JSON.parse(match[0]);
    const allowedIds = services.map(s => s.id);
    const serviceId = allowedIds.includes(parsed.service_id) ? parsed.service_id : null;

    return { service_id: serviceId, confidence: Number(parsed.confidence) || 0, source: 'ai' };
  } catch {
    clearTimeout(timer);
    return { service_id: null, confidence: 0, source: 'fallback' };
  }
}

export async function mapNeed(
  text: string,
  services: Service[]
): Promise<{ service_id: string | null; confidence: number; source: string }> {
  const key = text.trim().toLowerCase();

  if (cache.has(key)) return cache.get(key)!;

  const mockMode = process.env.MOCK_MODE !== 'false';
  const maxCalls = parseInt(process.env.AI_MAX_CALLS || '30', 10);

  let result: { service_id: string | null; confidence: number; source: string };

  if (!mockMode && aiCallCount < maxCalls) {
    aiCallCount++;
    result = await liveCall(text, services);
  } else {
    const m = mockMatch(text, services);
    result = { ...m, source: 'mock' };
  }

  cache.set(key, result);
  return result;
}
