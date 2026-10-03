import assert from 'node:assert';

const { KIMI_API_BASE, KIMI_API_KEY, KIMI_MODEL } = process.env;

async function run() {
  console.log('AI setup check starting...');
  assert.ok(KIMI_API_BASE, 'Missing KIMI_API_BASE in .env');
  assert.ok(KIMI_API_KEY, 'Missing KIMI_API_KEY in .env');
  assert.ok(KIMI_MODEL, 'Missing KIMI_MODEL in .env');

  console.log('Testing connectivity to', KIMI_API_BASE, 'with model', KIMI_MODEL);

  try {
    const res = await fetch(KIMI_API_BASE + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + KIMI_API_KEY
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [{ role: 'user', content: 'Say "hello" and nothing else.' }],
        max_tokens: 10,
        temperature: 0
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error('API Error ' + res.status + ': ' + text);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content;
    console.log('✓ Success! The model responded:', JSON.stringify(reply));

  } catch (err) {
    console.error('❌ AI Check failed:', err.message);
    process.exit(1);
  }
}

run();
