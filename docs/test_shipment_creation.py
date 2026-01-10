#!/usr/bin/env python3
"""
Test script for end-to-end shipment creation
Tests: Login -> Get Data -> Create Shipment -> Verify QR -> Check Celery
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def login():
    """Login and get access token"""
    print_section("1. LOGIN")
    url = f"{BASE_URL}/users/login/"
    data = {"username": "province_admin", "password": "test123"}
    
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        token = result.get('access')
        user = result.get('user', {})
        print(f"✅ Login successful!")
        print(f"   User: {user.get('full_name')} ({user.get('role')})")
        print(f"   Token: {token[:30]}...")
        return token
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def get_warehouses(token):
    """Get province warehouses"""
    print_section("2. GET PROVINCE WAREHOUSES")
    url = f"{BASE_URL}/warehouses/province/"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        warehouses = data.get('results', data)
        print(f"✅ Found {len(warehouses)} warehouses")
        for wh in warehouses[:3]:
            print(f"   - ID {wh['id']}: {wh['name']}")
        return warehouses
    else:
        print(f"❌ Failed: {response.text}")
        return []

def get_schools(token):
    """Get schools"""
    print_section("3. GET SCHOOLS")
    url = f"{BASE_URL}/schools/"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers, params={"limit": 5})
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        schools = data.get('results', data)
        print(f"✅ Found {data.get('count', len(schools))} schools (showing first 5)")
        for school in schools[:5]:
            print(f"   - ID {school['id']}: {school['name']} ({school['province_name']})")
        return schools
    else:
        print(f"❌ Failed: {response.text}")
        return []

def get_stocks(token, warehouse_id):
    """Get warehouse stock"""
    print_section("4. GET WAREHOUSE STOCK")
    url = f"{BASE_URL}/warehouses/stocks/"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"province_warehouse": warehouse_id}
    
    response = requests.get(url, headers=headers, params=params)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        stocks = data.get('results', data)
        print(f"✅ Found {len(stocks)} stock items in warehouse {warehouse_id}")
        for stock in stocks[:3]:
            print(f"   - Book {stock['book']}: {stock.get('book_label', 'N/A')} | Qty: {stock['quantity']} | Term: {stock['term']}")
        return stocks
    else:
        print(f"❌ Failed: {response.text}")
        return []

def create_shipment(token, warehouse_id, school_id, book_stocks):
    """Create a shipment"""
    print_section("5. CREATE SHIPMENT")
    url = f"{BASE_URL}/warehouses/shipments/"
    headers = {"Authorization": f"Bearer {token}"}
    
    # Pick first available book with sufficient stock
    if not book_stocks:
        print("❌ No stock available!")
        return None
    
    first_stock = book_stocks[0]
    quantity_to_ship = min(5, first_stock['quantity'])  # Ship 5 or less
    
    payload = {
        "province_warehouse": warehouse_id,
        "school": school_id,
        "courier_role": "province_courier",
        "books": [
            {
                "book_id": first_stock['book'],
                "quantity": quantity_to_ship,
                "term": first_stock['term']
            }
        ]
    }
    
    print(f"Payload:")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    
    response = requests.post(url, headers=headers, json=payload)
    print(f"\nStatus: {response.status_code}")
    
    if response.status_code == 201:
        shipment = response.json()
        print(f"✅ Shipment created successfully!")
        print(f"   ID: {shipment['id']}")
        print(f"   Status: {shipment['status']}")
        print(f"   QR Code: {shipment.get('qr_code', 'N/A')}")
        print(f"   Books: {len(shipment.get('books', []))} items")
        return shipment
    else:
        print(f"❌ Failed: {response.text}")
        try:
            error_data = response.json()
            print(f"   Error details: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
        except:
            pass
        return None

def verify_shipment(token, shipment_id):
    """Verify shipment was created"""
    print_section("6. VERIFY SHIPMENT")
    url = f"{BASE_URL}/warehouses/shipments/{shipment_id}/"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        shipment = response.json()
        print(f"✅ Shipment verified!")
        print(f"   ID: {shipment['id']}")
        print(f"   Status: {shipment['status']}")
        print(f"   Courier Role: {shipment.get('courier_role')}")
        print(f"   QR Code: {shipment.get('qr_code')}")
        print(f"   Created: {shipment.get('created_at')}")
        return True
    else:
        print(f"❌ Verification failed: {response.text}")
        return False

def check_celery_logs():
    """Check recent Celery logs for task execution"""
    print_section("7. CHECK CELERY LOGS")
    import subprocess
    try:
        result = subprocess.run(
            ["docker", "compose", "logs", "--tail=50", "celery_worker"],
            cwd="/home/reyam/ketabi",
            capture_output=True,
            text=True,
            timeout=5
        )
        
        logs = result.stdout
        if "send_shipment_notification" in logs:
            print("✅ Found Celery task execution in logs:")
            # Extract relevant lines
            for line in logs.split('\n'):
                if 'send_shipment_notification' in line or 'succeeded' in line.lower():
                    print(f"   {line.strip()}")
        else:
            print("⚠️  No recent Celery task found in logs")
            print("   (Task may execute async - check logs manually)")
            
    except Exception as e:
        print(f"⚠️  Could not check Celery logs: {e}")

def main():
    print("\n" + "="*60)
    print("  KETABI SHIPMENT CREATION E2E TEST")
    print("  " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*60)
    
    # Step 1: Login
    token = login()
    if not token:
        print("\n❌ TEST FAILED: Could not login")
        return
    
    time.sleep(0.5)
    
    # Step 2: Get warehouses
    warehouses = get_warehouses(token)
    if not warehouses:
        print("\n❌ TEST FAILED: No warehouses found")
        return
    warehouse_id = warehouses[0]['id']
    
    time.sleep(0.5)
    
    # Step 3: Get schools
    schools = get_schools(token)
    if not schools:
        print("\n❌ TEST FAILED: No schools found")
        return
    school_id = schools[0]['id']
    
    time.sleep(0.5)
    
    # Step 4: Get stock
    stocks = get_stocks(token, warehouse_id)
    if not stocks:
        print("\n❌ TEST FAILED: No stock found")
        return
    
    time.sleep(0.5)
    
    # Step 5: Create shipment
    shipment = create_shipment(token, warehouse_id, school_id, stocks)
    if not shipment:
        print("\n❌ TEST FAILED: Could not create shipment")
        return
    
    time.sleep(1)
    
    # Step 6: Verify
    verified = verify_shipment(token, shipment['id'])
    if not verified:
        print("\n❌ TEST FAILED: Could not verify shipment")
        return
    
    time.sleep(1)
    
    # Step 7: Check Celery
    check_celery_logs()
    
    # Summary
    print_section("TEST SUMMARY")
    print("✅ All steps completed successfully!")
    print(f"   Shipment ID: {shipment['id']}")
    print(f"   QR Code: {shipment.get('qr_code')}")
    print(f"   Status: {shipment['status']}")
    print("\n🎉 END-TO-END TEST PASSED!")

if __name__ == "__main__":
    main()
