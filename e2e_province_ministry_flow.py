#!/usr/bin/env python3
"""
E2E script: Province -> Ministry request approval -> Shipment creation -> Province verification

Usage: edit credentials below or provide env vars. Requires the API running at http://localhost:8000/api
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

# --- Credentials (edit as needed) ---
PROVINCE_USERNAME = "province_admin"
PROVINCE_PASSWORD = "test123"
MINISTRY_USERNAME = "ministry_admin"
MINISTRY_PASSWORD = "Admin@123"
# ------------------------------------

HEADERS_JSON = {"Content-Type": "application/json"}


def login(username, password):
    url = f"{BASE_URL}/users/login/"
    resp = requests.post(url, json={"username": username, "password": password})
    print(f"Login {username}: {resp.status_code}")
    if resp.status_code != 200:
        print(resp.text)
        return None
    data = resp.json()
    token = data.get('access') or data.get('token') or data.get('access_token')
    # fallback: some endpoints return {'user':..., 'access':...}
    if not token and isinstance(data, dict) and 'user' in data and 'access' in data:
        token = data['access']
    return token


def create_province_request(token, items, notes="اختبار طلب من المحافظة"):
    url = f"{BASE_URL}/book-requests/province/"
    headers = {"Authorization": f"Bearer {token}", **HEADERS_JSON}
    payload = {
        "items": items,
        "notes": notes
    }
    resp = requests.post(url, headers=headers, json=payload)
    print(f"Create province request: {resp.status_code}")
    if resp.status_code not in (200, 201):
        print(resp.text)
        return None
    return resp.json()


def get_province_request(token, request_id):
    url = f"{BASE_URL}/book-requests/province/{request_id}/"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(url, headers=headers)
    print(f"Get province request {request_id}: {resp.status_code}")
    if resp.status_code != 200:
        print(resp.text)
        return None
    return resp.json()


def approve_province_request(token, request_id, items_approval=None):
    url = f"{BASE_URL}/book-requests/province/{request_id}/approve-reject/"
    headers = {"Authorization": f"Bearer {token}", **HEADERS_JSON}
    payload = {"action": "approve"}
    if items_approval is not None:
        payload['items_approval'] = items_approval
    resp = requests.post(url, headers=headers, json=payload)
    print(f"Approve request {request_id}: {resp.status_code}")
    if resp.status_code != 200:
        print(resp.text)
        return None
    return resp.json()


def choose_warehouses(ministry_token, target_province_name=None):
    # pick first ministry warehouse and a province warehouse matching province name
    headers = {"Authorization": f"Bearer {ministry_token}"}
    mres = requests.get(f"{BASE_URL}/warehouses/ministry/", headers=headers)
    pres = requests.get(f"{BASE_URL}/warehouses/province/", headers=headers, params={"page_size": 200})
    if mres.status_code != 200 or pres.status_code != 200:
        print('Failed to fetch warehouses')
        return None, None
    mwhs = mres.json().get('results', mres.json())
    pwhs = pres.json().get('results', pres.json())
    from_ministry = mwhs[0]['id'] if mwhs else None
    to_province = None
    if target_province_name:
        for w in pwhs:
            if str(w.get('province')).lower() == str(target_province_name).lower():
                to_province = w['id']
                break
    if not to_province and pwhs:
        to_province = pwhs[0]['id']
    return from_ministry, to_province


def create_shipment_from_request(ministry_token, request, approved_items, from_ministry, to_province):
    url = f"{BASE_URL}/warehouses/shipments/"
    headers = {"Authorization": f"Bearer {ministry_token}", **HEADERS_JSON}

    # Build books array: try to use book id from request items
    books_payload = []
    items_map = {it['id']: it for it in (request.get('items') or [])}
    for ai in approved_items:
        item_id = ai.get('id')
        qty = ai.get('approved_quantity') or ai.get('quantity') or 0
        item = items_map.get(item_id)
        book_id = None
        if item:
            # item.book may be an id or object
            if isinstance(item.get('book'), dict):
                book_id = item['book'].get('id')
            else:
                book_id = item.get('book')
        if not book_id:
            # try to skip or fail - shipment requires a valid book id
            print(f"Warning: item {item_id} has no book id, skipping")
            continue
        books_payload.append({"book_id": book_id, "quantity": int(qty), "term": 'first'})

    payload = {
        "from_ministry": int(from_ministry) if from_ministry else None,
        "to_province": int(to_province) if to_province else None,
        "books": books_payload,
        "courier_role": "ministry_courier",
        "notes": f"شحنة بناءً على طلب رقم {request.get('request_number') or request.get('id')}",
        "related_request_id": request.get('id')
    }
    print('Create shipment payload:', json.dumps(payload, ensure_ascii=False, indent=2))
    resp = requests.post(url, headers=headers, json=payload)
    print(f"Create shipment status: {resp.status_code}")
    if resp.status_code not in (200,201):
        print(resp.text)
        try:
            print(json.dumps(resp.json(), ensure_ascii=False, indent=2))
        except Exception:
            pass
        return None
    return resp.json()


def find_incoming_shipment_for_request(province_token, to_province_id, related_request_id):
    headers = {"Authorization": f"Bearer {province_token}"}
    params = {"to_province": to_province_id, "page_size": 200}
    resp = requests.get(f"{BASE_URL}/warehouses/shipments/", headers=headers, params=params)
    print(f"Province list incoming shipments: {resp.status_code}")
    if resp.status_code != 200:
        print(resp.text)
        return None
    data = resp.json()
    items = data.get('results', data)
    for s in items:
        if s.get('related_request_id') == related_request_id or s.get('id') == related_request_id:
            return s
        # some implementations may not set related_request_id; try to match by books or created_at
    # fallback: find shipments with related_request_id present
    for s in items:
        if s.get('related_request_id') == related_request_id:
            return s
    return None


def main():
    print('\n==== KETABI E2E: Province -> Ministry -> Shipment ====' )
    print(datetime.now().isoformat())

    # 1) Province login
    province_token = login(PROVINCE_USERNAME, PROVINCE_PASSWORD)
    if not province_token:
        print('Province login failed')
        return

    # 2) Create a sample province book request
    # Item: use subject/grade/quantity so backend maps to a Book if possible
    items = [
        {"subject": "رياضيات", "grade": "الصف السادس", "quantity": 10},
        {"subject": "علوم", "grade": "الصف الخامس", "quantity": 5}
    ]
    req = create_province_request(province_token, items, notes="اختبار E2E: طلب من المحافظة")
    if not req:
        print('Failed to create province request')
        return
    print('Province request created:', req.get('id'))

    # wait briefly for DB consistency
    time.sleep(0.8)

    # 3) Ministry login
    ministry_token = login(MINISTRY_USERNAME, MINISTRY_PASSWORD)
    if not ministry_token:
        print('Ministry login failed')
        return

    # 4) Fetch the created request as ministry (to get item IDs and details)
    request_id = req.get('id')
    req_min = get_province_request(ministry_token, request_id)
    if not req_min:
        print('Ministry could not fetch request')
        return
    print('Request fetched by ministry. Items:')
    for it in req_min.get('items', []):
        print(' -', it.get('id'), 'book=', it.get('book'), 'qty=', it.get('quantity'))

    # 5) Prepare items_approval (approve same quantities)
    items_approval = []
    for it in req_min.get('items', []):
        items_approval.append({"id": it['id'], "approved_quantity": it.get('quantity', 0)})

    # 6) Approve the request
    approved = approve_province_request(ministry_token, request_id, items_approval=items_approval)
    if not approved:
        print('Failed to approve')
        return
    print('Request approved. Status:', approved.get('status'))

    # 7) Choose warehouses
    target_province = req_min.get('province_name') or req_min.get('created_by', {}).get('province')
    from_ministry, to_province = choose_warehouses(ministry_token, target_province)
    print('Selected warehouses -> ministry:', from_ministry, 'province:', to_province)
    if not from_ministry or not to_province:
        print('Could not select warehouses')
        return

    # 8) Create shipment from request
    shipment = create_shipment_from_request(ministry_token, req_min, items_approval, from_ministry, to_province)
    if not shipment:
        print('Failed to create shipment')
        return
    print('Shipment created:', shipment.get('id'))

    # 9) Province verifies incoming shipments
    # Login as province again to check incoming
    province_token = login(PROVINCE_USERNAME, PROVINCE_PASSWORD)
    incoming = find_incoming_shipment_for_request(province_token, to_province, request_id)
    if incoming:
        print('Province incoming shipment found:', incoming.get('id'))
        print(json.dumps(incoming, ensure_ascii=False, indent=2))
    else:
        print('Incoming shipment not found in province list. Try listing shipments without filter to inspect.')
        # fallback: list shipments and search
        headers = {"Authorization": f"Bearer {province_token}"}
        resp = requests.get(f"{BASE_URL}/warehouses/shipments/", headers=headers, params={"page_size":200})
        if resp.status_code == 200:
            items = resp.json().get('results', resp.json())
            for s in items:
                if s.get('related_request_id') == request_id:
                    print('Found by related_request_id:', s.get('id'))
                    print(json.dumps(s, ensure_ascii=False, indent=2))
                    return
            print('No matching shipments found. Response sample:')
            print(json.dumps(items[:5], ensure_ascii=False, indent=2))
        else:
            print('Failed to list shipments:', resp.status_code, resp.text)

    print('\n==== END ====' )


if __name__ == '__main__':
    main()
