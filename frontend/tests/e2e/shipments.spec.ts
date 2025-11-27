import { test, expect } from '@playwright/test';

// Credentials are taken from the repo's e2e script. Edit if needed.
const PROVINCE_USERNAME = process.env.E2E_PROVINCE_USERNAME || 'province_admin';
const PROVINCE_PASSWORD = process.env.E2E_PROVINCE_PASSWORD || 'test123';
const MINISTRY_USERNAME = process.env.E2E_MINISTRY_USERNAME || 'ministry_admin';
const MINISTRY_PASSWORD = process.env.E2E_MINISTRY_PASSWORD || 'Admin@123';

const API_BASE = process.env.API_BASE || 'http://localhost:8000/api';
const APP_BASE = process.env.BASE_URL || 'http://localhost:3000';

test('create request → approve → create shipment → open shipment details → follow related request link', async ({ page, request }) => {
  // 1) Province login via API
  const provinceLogin = await request.post(`${API_BASE}/users/login/`, { data: { username: PROVINCE_USERNAME, password: PROVINCE_PASSWORD } });
  console.log('[E2E DEBUG] province login status', provinceLogin.status());
  const provinceData = await provinceLogin.json().catch(() => null);
  console.log('[E2E DEBUG] province login body', provinceData && JSON.stringify(provinceData).slice(0, 500));
  expect(provinceLogin.ok()).toBeTruthy();
  const provinceToken = provinceData.access || provinceData.token || provinceData.access_token || provinceData.access;
  expect(provinceToken).toBeTruthy();

  // 2) Create a province request
  const items = [
    { subject: 'رياضيات', grade: 'الصف السادس', quantity: 2 },
    { subject: 'علوم', grade: 'الصف الخامس', quantity: 1 },
  ];

  const createReq = await request.post(`${API_BASE}/book-requests/province/`, {
    headers: { Authorization: `Bearer ${provinceToken}` },
    data: { items, notes: 'Playwright E2E: إنشاء طلب' },
  });
  console.log('[E2E DEBUG] create request status', createReq.status());
  const reqJson = await createReq.json().catch(() => null);
  console.log('[E2E DEBUG] create request body', reqJson && JSON.stringify(reqJson).slice(0, 800));
  expect(createReq.ok()).toBeTruthy();
  const requestId = reqJson.id;
  const requestNumber = reqJson.request_number;
  expect(requestId).toBeTruthy();

  // 3) Ministry login
  const ministryLogin = await request.post(`${API_BASE}/users/login/`, { data: { username: MINISTRY_USERNAME, password: MINISTRY_PASSWORD } });
  console.log('[E2E DEBUG] ministry login status', ministryLogin.status());
  const ministryData = await ministryLogin.json().catch(() => null);
  console.log('[E2E DEBUG] ministry login body', ministryData && JSON.stringify(ministryData).slice(0, 500));
  expect(ministryLogin.ok()).toBeTruthy();
  const ministryToken = ministryData.access || ministryData.token || ministryData.access_token;
  expect(ministryToken).toBeTruthy();

  // 4) Fetch the created request as ministry to obtain item IDs
  const fetchReq = await request.get(`${API_BASE}/book-requests/province/${requestId}/`, { headers: { Authorization: `Bearer ${ministryToken}` } });
  console.log('[E2E DEBUG] fetch created request status', fetchReq.status());
  const reqMin = await fetchReq.json().catch(() => null);
  console.log('[E2E DEBUG] fetch created request body keys', reqMin && Object.keys(reqMin).slice(0,20));
  expect(fetchReq.ok()).toBeTruthy();

  // 5) Prepare approvals
  const itemsApproval = (reqMin.items || []).map((it: any) => ({ id: it.id, approved_quantity: it.quantity || 0 }));

  // 6) Approve request
  const approve = await request.post(`${API_BASE}/book-requests/province/${requestId}/approve-reject/`, {
    headers: { Authorization: `Bearer ${ministryToken}` },
    data: { action: 'approve', items_approval: itemsApproval },
  });
  console.log('[E2E DEBUG] approve status', approve.status());
  const approveBody = await approve.json().catch(() => null);
  console.log('[E2E DEBUG] approve body', approveBody && JSON.stringify(approveBody).slice(0,400));
  expect(approve.ok()).toBeTruthy();

  // 7) Choose warehouses (first ministry and first province)
  const mwh = await request.get(`${API_BASE}/warehouses/ministry/`, { headers: { Authorization: `Bearer ${ministryToken}` } });
  const pwh = await request.get(`${API_BASE}/warehouses/province/`, { headers: { Authorization: `Bearer ${ministryToken}` }, params: { page_size: 200 } });
  const mwhJson = await (mwh.json()).catch(() => ({}));
  const pwhJson = await (pwh.json()).catch(() => ({}));
  console.log('[E2E DEBUG] ministry warehouses sample', Array.isArray(mwhJson.results) ? mwhJson.results.slice(0,2) : (mwhJson && mwhJson.slice ? mwhJson.slice(0,2) : mwhJson));
  console.log('[E2E DEBUG] province warehouses sample', Array.isArray(pwhJson.results) ? pwhJson.results.slice(0,2) : (pwhJson && pwhJson.slice ? pwhJson.slice(0,2) : pwhJson));
  const from_ministry = (mwhJson.results || mwhJson)[0]?.id;
  const to_province = (pwhJson.results || pwhJson)[0]?.id;
  expect(from_ministry).toBeTruthy();
  expect(to_province).toBeTruthy();

  // 8) Create shipment from request
  const booksPayload: any[] = [];
  const itemsMap: any = {};
  (reqMin.items || []).forEach((it: any) => { itemsMap[it.id] = it; });
  itemsApproval.forEach((ai: any) => {
    const it = itemsMap[ai.id];
    let bookId = null;
    if (it) {
      bookId = typeof it.book === 'object' ? it.book?.id : it.book;
    }
    if (bookId) booksPayload.push({ book_id: bookId, quantity: ai.approved_quantity || 0, term: 'first' });
  });

  const shipmentResp = await request.post(`${API_BASE}/warehouses/shipments/`, {
    headers: { Authorization: `Bearer ${ministryToken}` },
    data: {
      from_ministry: from_ministry,
      to_province: to_province,
      books: booksPayload,
      courier_role: 'ministry_courier',
      notes: `Playwright E2E shipment for request ${requestNumber || requestId}`,
      related_request_id: requestId,
    },
  });

  console.log('[E2E DEBUG] create shipment status', shipmentResp.status());
  const shipmentJson = await shipmentResp.json().catch(() => null);
  console.log('[E2E DEBUG] create shipment body', shipmentJson && JSON.stringify(shipmentJson).slice(0,800));
  const shipmentNumber = shipmentJson && (shipmentJson.shipment_number || shipmentJson.id);
  expect(shipmentJson && shipmentJson.id).toBeTruthy();

  // 9) Visit the app as province user and verify the shipment appears
  // Set tokens in localStorage so the frontend's axios uses them
  await page.goto(APP_BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ token, authKey }) => {
    localStorage.setItem('access_token', token);
    // Persist minimal auth-store state so ProtectedRoute sees isAuthenticated=true
    try {
      localStorage.setItem(authKey, JSON.stringify({ user: null, token: token, refreshToken: null, isAuthenticated: true }));
    } catch (e) {}
  }, { token: provinceToken, authKey: 'auth-storage' });

  // Navigate to province incoming shipments
  await page.goto(`${APP_BASE}/province/incoming-shipments`);
  await page.waitForLoadState('networkidle');

  // Find the shipment row by shipment number and click its details button
  const row = page.locator(`tr:has-text("${shipmentNumber}")`);
  await expect(row).toHaveCount(1);
  await row.locator('button', { hasText: 'تفاصيل' }).click();

  // Wait for dialog and ensure related request link is visible
  const relatedLink = page.locator('text=' + (requestNumber || `#${requestId}`));
  await expect(relatedLink).toBeVisible({ timeout: 5000 });

  // Click the link and verify navigation to requests page with ?id=
  await Promise.all([
    page.waitForNavigation(),
    relatedLink.click()
  ]);

  const url = page.url();
  expect(url).toContain(`book-requests?id=${requestId}`);

  // Verify request number appears on destination page
  await expect(page.locator(`text=${requestNumber}`)).toBeVisible({ timeout: 5000 });
});
