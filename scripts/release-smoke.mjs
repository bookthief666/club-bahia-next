const baseUrl = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function request(path) {
  return fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    headers: { 'User-Agent': 'club-bahia-release-smoke/1.0' },
    signal: AbortSignal.timeout(10_000),
  });
}

async function waitForServer() {
  let lastError;
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await request('/');
      if (response.status === 200) return;
      lastError = new Error(`Homepage returned ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
    await sleep(1_000);
  }
  throw lastError || new Error('Application server did not become ready.');
}

async function expectStatus(path, expectedStatuses) {
  const response = await request(path);
  if (!expectedStatuses.includes(response.status)) {
    throw new Error(
      `${path} returned ${response.status}; expected ${expectedStatuses.join(' or ')}.`,
    );
  }
  console.log(`PASS ${path} → ${response.status}`);
  return response;
}

async function expectLoginRedirect(path) {
  const response = await expectStatus(path, [307, 308]);
  const location = response.headers.get('location') || '';
  if (!location.includes('/login')) {
    throw new Error(`${path} redirected to ${location || '(missing location)'} instead of login.`);
  }
  console.log(`PASS ${path} protects staff access → ${location}`);
}

await waitForServer();
await expectStatus('/', [200]);
await expectStatus('/events', [200]);
await expectStatus('/reservations', [200]);
await expectLoginRedirect('/staff');
await expectLoginRedirect('/admin');
await expectLoginRedirect('/admin/overview');
await expectLoginRedirect('/admin/media');
await expectLoginRedirect('/admin/review');
await expectLoginRedirect('/admin/reservations/follow-up');
await expectStatus('/api/admin/activation/readiness', [401]);

console.log('Club Bahia release smoke checks passed.');
