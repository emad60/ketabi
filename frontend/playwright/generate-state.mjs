import { chromium } from 'playwright';

// Usage: node playwright/generate-state.mjs <username> <password> <outputPath>
// Example: node playwright/generate-state.mjs province_admin provincepass state.json

const [,, username, password, outPath='state.json'] = process.argv;
if (!username || !password) {
  console.error('Usage: node generate-state.mjs <username> <password> [outPath]');
  process.exit(2);
}

const API_BASE = process.env.API_BASE || 'http://localhost:8000/api';
const APP_BASE = process.env.BASE_URL || 'http://localhost:3000';

(async () => {
  try {
    console.log('Logging in via API to obtain access token...');
    const loginRes = await fetch(`${API_BASE}/users/login/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!loginRes.ok) {
      const body = await loginRes.text();
      throw new Error(`Login failed: ${loginRes.status} ${body}`);
    }

    const json = await loginRes.json();
    const access = json.access || json.token || json.access_token;
    if (!access) throw new Error('No access token returned from login API');

    console.log('Launching browser to create storage state...');
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Make sure the app is reachable so that storageState will be meaningful
    await page.goto(APP_BASE, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});

    // Set localStorage items needed by the frontend
    await context.addInitScript((token, authKey) => {
      try {
        localStorage.setItem('access_token', token || '');
        localStorage.setItem(authKey, JSON.stringify({ user: null, token: token || '', refreshToken: null, isAuthenticated: true }));
      } catch (e) {}
    }, access, 'auth-storage');

    // Also set cookie if needed (optional)

    // Save storage state
    await context.storageState({ path: outPath });
    await browser.close();
    console.log('Saved storage state to', outPath);
  } catch (err) {
    console.error('Error generating storage state:', err);
    process.exit(1);
  }
})();
