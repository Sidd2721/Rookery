import assert from 'node:assert';

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const pin = process.env.CLERK_PIN || '000000';
const officeId = 'demo-ward';

async function fetchApi(path, method = 'GET', body = null, headers = {}) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(\`\${baseUrl}\${path}\`, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function run() {
  console.log('Smoke test starting...');
  
  // 1. 4 services
  let res = await fetchApi(\`/api/services?office_id=\${officeId}\`);
  assert.equal(res.status, 200, 'GET /api/services failed');
  assert.equal(res.data.length, 4, 'Should return 4 services');
  
  const service = res.data[0];
  
  // 2. Create visit
  res = await fetchApi('/api/visits', 'POST', { office_id: officeId, service_id: service.id });
  assert.equal(res.status, 200, 'POST /api/visits failed');
  const visitId1 = res.data.visit_id;
  assert.ok(visitId1, 'Missing visit_id');
  
  // 3. Ready before ticking -> 400
  res = await fetchApi(\`/api/visits/\${visitId1}/ready\`, 'POST');
  assert.equal(res.status, 400, 'Should reject ready before ticking all');
  assert.equal(res.data.error, 'not_all_ready');
  
  // 4. Tick all then ready -> token 1
  const allItemIds = service.checklist.map(i => i.id);
  res = await fetchApi(\`/api/visits/\${visitId1}\`, 'PATCH', { items_checked: allItemIds });
  assert.equal(res.status, 200, 'PATCH /api/visits failed');
  
  res = await fetchApi(\`/api/visits/\${visitId1}/ready\`, 'POST');
  assert.equal(res.status, 200, 'POST /api/visits/ready failed');
  assert.equal(res.data.token_no, 1, 'Token should be 1');
  
  // 5. A second visit -> token 2
  res = await fetchApi('/api/visits', 'POST', { office_id: officeId, service_id: service.id });
  const visitId2 = res.data.visit_id;
  await fetchApi(\`/api/visits/\${visitId2}\`, 'PATCH', { items_checked: allItemIds });
  res = await fetchApi(\`/api/visits/\${visitId2}/ready\`, 'POST');
  assert.equal(res.data.token_no, 2, 'Token should be 2');
  
  // 6. call-next -> serving token 1
  const clerkHeaders = { 'x-clerk-pin': pin };
  res = await fetchApi('/api/clerk/call-next', 'POST', { office_id: officeId }, clerkHeaders);
  assert.equal(res.status, 200, 'POST /api/clerk/call-next failed');
  assert.equal(res.data.token_no, 1, 'Should serve token 1');
  assert.equal(res.data.status, 'serving');
  
  // 7. done -> counters.served_ready 1
  res = await fetchApi('/api/clerk/done', 'POST', { visit_id: visitId1 }, clerkHeaders);
  assert.equal(res.status, 200, 'POST /api/clerk/done failed');
  
  res = await fetchApi(\`/api/queue?office_id=\${officeId}\`);
  assert.equal(res.data.counters.served_ready, 1, 'served_ready should be 1');
  
  // 8. call-next again to get token 2 serving
  res = await fetchApi('/api/clerk/call-next', 'POST', { office_id: officeId }, clerkHeaders);
  assert.equal(res.data.token_no, 2, 'Should serve token 2');
  
  // 9. send-back without reason -> 400
  res = await fetchApi('/api/clerk/send-back', 'POST', { visit_id: visitId2 }, clerkHeaders);
  assert.equal(res.status, 400, 'Should reject send-back without reason');
  
  // 10. wrong PIN -> 401
  res = await fetchApi('/api/clerk/call-next', 'POST', { office_id: officeId }, { 'x-clerk-pin': 'wrong' });
  assert.equal(res.status, 401, 'Should reject wrong PIN');
  
  console.log('Smoke test passed successfully.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
