# Ministry Province Requests - Integration Test Guide

## Overview
This guide walks through the complete end-to-end flow for province requests in the book management system.

## Prerequisites
- Backend API running on `http://localhost:8000/api`
- Frontend running on `http://localhost:3001`
- Database with test users:
  - Province Admin: `province_admin` / `test123`
  - Ministry Admin: `ministry_admin` / `Admin@123`
  - Books in database

## Test Flow

### Step 1: Login as Province Admin
1. Navigate to `http://localhost:3001`
2. Login with:
   - Username: `province_admin`
   - Password: `test123`
3. You should see the province dashboard

### Step 2: Create a Book Request
1. Navigate to `/province/create-request`
2. Fill in the request form:
   - Select date (today or past)
   - Enter request reason (e.g., "طلب كتب للدراسة")
   - Add books using one of these methods:
     
     **Method A: Select Concrete Book**
     - Click book dropdown and select a book
     - Enter quantity (e.g., 10)
     - Click "إضافة الكتاب"
     
     **Method B: Request by Subject/Grade/Term**
     - Select Subject (e.g., "رياضيات")
     - Select Grade (e.g., "الصف الأول")
     - Select Term (e.g., "الفصل الأول")
     - Enter quantity
     - Click "إضافة الطلب"

3. Review the summary showing total books and items count
4. Click "إرسال الطلب"
5. You should see success message: "تم إنشاء الطلب بنجاح"

### Step 3: Login as Ministry Admin
1. Logout from province account
2. Login with:
   - Username: `ministry_admin`
   - Password: `Admin@123`
3. You should see the ministry dashboard

### Step 4: View and Manage Requests
1. Navigate to `/ministry/province-requests`
2. You should see a list of incoming province requests on the left side
3. Click on a request to view its details
   - Request number
   - Province name
   - Status (pending/approved/rejected)
   - Books requested with quantities
   - Notes and other details

### Step 5: Approve Request
1. With a request selected, you should see the approval section at the bottom
2. For each book, you can:
   - See the requested quantity
   - See the current approved quantity
   - Adjust the approved quantity in the input field
3. Click "الموافقة على الطلب" (Approve Request)
4. You should see: "تم الموافقة على الطلب بنجاح"
5. Refresh or navigate back to see the request status changed to "موافق"

### Step 6: Reject Request (Alternative Flow)
1. Select a different pending request
2. Click "رفض الطلب" (Reject Request)
3. Enter rejection reason in the text area
4. Click "تأكيد الرفض" (Confirm Rejection)
5. You should see: "تم رفض الطلب بنجاح"
6. Request status should change to "مرفوض"

## Expected Data Display

### In Province Request List (Left Panel)
- Province Name
- Request Number (format: "# {id}")
- Item count and total quantity (e.g., "3 كتب • إجمالي: 25")
- Status badge (yellow for pending, green for approved, red for rejected)

### In Request Details (Right Panel)
- Request ID and status
- Province name
- Creation date
- Notes from province
- Items table with:
  - Book title (or "Subject - Grade" if no concrete book)
  - Requested quantity
  - Approved quantity
  - Input field for adjusting approved quantity
- Action buttons (Approve/Reject) - only available for pending requests

## Data Structure

### API Request Creation (POST /book-requests/province/)
```json
{
  "items": [
    {
      "book": 1,
      "quantity": 10
    },
    {
      "subject": "رياضيات",
      "grade": "الصف الأول",
      "term": "الفصل الأول",
      "quantity": 5
    }
  ],
  "notes": "طلب كتب للدراسة"
}
```

### API Response (GET /book-requests/province/)
```json
{
  "id": 1,
  "request_number": "REQ-001",
  "province_name": "محافظة بغداد",
  "status": "pending",
  "notes": "طلب كتب للدراسة",
  "items": [
    {
      "id": 1,
      "book": 1,
      "book_title": "رياضيات الصف الأول",
      "subject": null,
      "grade": null,
      "quantity": 10,
      "approved_quantity": 0,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total_quantity": 10,
  "items_count": 1,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### API Approval Request (POST /book-requests/province/{id}/approve-reject/)
```json
{
  "action": "approve",
  "items_approval": [
    {
      "id": 1,
      "approved_quantity": 8
    }
  ]
}
```

### API Rejection Request
```json
{
  "action": "reject",
  "rejection_reason": "الكمية المطلوبة كبيرة جداً"
}
```

## Frontend Changes Made

### MinistryProvinceRequestsPage.tsx
- Complete rewrite to match BookRequest API structure
- Two-panel layout: List (left) and Details (right)
- Search/filter by province name and request number
- Safe access to nested arrays with `(items || [])` pattern
- Status-aware UI (disabled inputs for non-pending requests)
- Proper error handling and loading states

### apiService.ts
- Updated `ProvinceRequest` interface to match API response
- Added fields: `request_number`, `total_quantity`, `items_count`, `rejection_reason`
- Updated item structure with `book_title`, `subject`, `grade`, `approved_quantity`
- Removed obsolete fields: `school_requests_count`, `total_schools`, `available_in_warehouse`, `quantity_requested`, `quantity_approved`

### Key Fields
- `province_name`: Province name (fallback from user's full_name or username)
- `total_quantity`: Sum of all item quantities
- `items_count`: Number of items in request
- `status`: "pending" | "approved" | "rejected"
- Item approval: Uses `approved_quantity` field

## Debugging Tips

### Check Browser Console
```javascript
// Look for these messages
console.log('Fetching province requests from API...');
console.log('Fetched data:', data);
```

### Verify API Responses
Open browser Developer Tools → Network tab:
1. Look for `/book-requests/province/` GET request
   - Should return 200 with array of requests
   - Each request should have: id, request_number, province_name, status, items array, total_quantity, items_count

2. Look for `/book-requests/province/{id}/approve-reject/` POST request
   - Request body should have: action, items_approval (for approve) or rejection_reason (for reject)
   - Response should return updated request with status changed

### Common Issues

**Issue: "Cannot read properties of null"**
- ✅ Fixed by using `(currentRequest.items || [])` safe access pattern

**Issue: province_name shows as null**
- ✅ Fixed by backend serializer fallback logic in `get_province_name()`

**Issue: Wrong field names in display**
- ✅ Fixed by updating interface to use: quantity, approved_quantity, book_title

**Issue: Approval not working**
- Check that payload includes both "action": "approve" and "items_approval" array
- Each item in items_approval must have id and approved_quantity

## Performance Notes
- Province requests list is paginated (max 100 items per page)
- List items have overflow scrolling (max-h-96)
- Network requests include proper error handling and user feedback

## Accessibility
- Arabic RTL layout (dir="rtl")
- Arabic labels for all form fields
- Clear status badges with colors and icons
- Keyboard navigation supported for all buttons

## Future Enhancements
1. Add pagination controls for large request lists
2. Add export to CSV/PDF for requests
3. Add batch approval/rejection for multiple requests
4. Add request modification timeline/history view
5. Add warehouse stock level display during approval
6. Add automatic shipment creation after approval
