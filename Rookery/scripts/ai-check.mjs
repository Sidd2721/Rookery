const KIMI_API_BASE = process.env.KIMI_API_BASE;
const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_MODEL = process.env.KIMI_MODEL || 'kimi-k3';

async function run() {
  if (!KIMI_API_BASE || !KIMI_API_KEY) {
    console.error('Missing KIMI_API_BASE or KIMI_API_KEY');
    process.exit(1);
  }

  const start = Date.now();
  try {
    const res = await fetch(\`\${KIMI_API_BASE}/chat/completions\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${KIMI_API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say hello' }]
      })
    });

    const latency = Date.now() - start;
    console.log(\`Status: \${res.status} \${res.statusText}\`);
    console.log(\`Latency: \${latency}ms\`);

    const data = await res.text();
    console.log('Reply:', data.substring(0, 200));
  } catch (error) {
    console.error('Error fetching:', error.message);
  }
}

run();
