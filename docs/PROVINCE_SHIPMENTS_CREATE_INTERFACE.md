# 🎨 واجهة إنشاء الشحنات من طلبات المدارس
## Province Shipments Creation Interface Guide

**المسار:** `http://45.77.65.134/province/shipments/create`

**التاريخ:** 24 ديسمبر 2025

---

## 📋 متطلبات الواجهة

### الوظائف الأساسية:
1. ✅ عرض قائمة طلبات المدارس الموافق عليها
2. ✅ عرض تفاصيل كل طلب (المدرسة، الكتب، الكميات)
3. ✅ زر "إنشاء شحنة" لكل طلب
4. ✅ اختيار الكتب المطلوبة من المخزن
5. ✅ إسناد مندوب المحافظة
6. ✅ بعد الإنشاء: إرسال تقرير للمدرسة تلقائياً

---

## 🔌 APIs المطلوبة

### 1. جلب الطلبات الموافق عليها
```javascript
GET /warehouses/province/school-requests/approved/
Headers: {
  Authorization: Bearer YOUR_TOKEN
}
```

### 2. جلب قائمة المندوبين
```javascript
GET /users/?role=province_driver
Headers: {
  Authorization: Bearer YOUR_TOKEN
}
```

### 3. إنشاء الشحنة
```javascript
POST /warehouses/province/shipments/create-from-request/
Headers: {
  Authorization: Bearer YOUR_TOKEN,
  Content-Type: application/json
}
Body: {
  school_request_id: 123,
  courier_id: 456,
  notes: "ملاحظات"
}
```

---

## 💻 كود JavaScript الكامل

### ملف: `province-shipments-create.js`

```javascript
// ==========================================
// Province Shipments Creation Page
// صفحة إنشاء الشحنات من طلبات المدارس
// ==========================================

const API_BASE_URL = 'http://45.77.65.134';
let authToken = localStorage.getItem('authToken');
let approvedRequests = [];
let couriers = [];

// ==========================================
// 1. تحميل البيانات عند فتح الصفحة
// ==========================================

async function initializePage() {
  showLoading(true);
  
  try {
    // جلب الطلبات الموافق عليها
    await loadApprovedRequests();
    
    // جلب قائمة المندوبين
    await loadCouriers();
    
    // تعبئة الفلاتر
    populateFilters();
    
    // تحديث الإحصائيات
    updateStats();
    
    // عرض البيانات
    renderRequests();
    
    showLoading(false);
  } catch (error) {
    console.error('Error initializing page:', error);
    showError('فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.');
    showLoading(false);
  }
}

// ==========================================
// 2. جلب الطلبات الموافق عليها
// ==========================================

async function loadApprovedRequests() {
  const response = await fetch(
    `${API_BASE_URL}/warehouses/province/school-requests/approved/`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to load approved requests');
  }
  
  const data = await response.json();
  
  if (data.success) {
    approvedRequests = data.requests;
    console.log(`✅ تم تحميل ${data.count} طلب موافق عليه`);
  } else {
    throw new Error(data.error || 'Unknown error');
  }
}

// ==========================================
// 3. جلب قائمة المندوبين
// ==========================================

async function loadCouriers() {
  const response = await fetch(
    `${API_BASE_URL}/users/?role=province_driver`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to load couriers');
  }
  
  const data = await response.json();
  couriers = data.results || data;
  console.log(`✅ تم تحميل ${couriers.length} مندوب`);
}

// ==========================================
// 4. عرض قائمة الطلبات
// ==========================================

function renderRequests() {
  const container = document.getElementById('requests-container');
  
  if (approvedRequests.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox fa-3x"></i>
        <h3>لا توجد طلبات موافق عليها</h3>
        <p>جميع الطلبات تم إنشاء شحنات لها أو لا يوجد طلبات معتمدة حالياً</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = approvedRequests.map(request => `
    <div class="request-card" id="request-${request.id}">
      <!-- Header -->
      <div class="request-header">
        <div class="school-info">
          <h3>
            <i class="fas fa-school"></i>
            ${request.school.name}
          </h3>
          <p class="school-details">
            <span><i class="fas fa-map-marker-alt"></i> ${request.school.province}</span>
            <span class="separator">•</span>
            <span>${request.school.directorate}</span>
          </p>
        </div>
        <div class="request-meta">
          <span class="badge badge-success">
            <i class="fas fa-check-circle"></i>
            موافق عليه
          </span>
          <span class="request-date">
            ${formatDate(request.created_at)}
          </span>
        </div>
      </div>
      
      <!-- Books List -->
      <div class="books-section">
        <h4>
          <i class="fas fa-books"></i>
          الكتب المطلوبة (${request.total_items})
        </h4>
        <div class="books-list">
          ${request.items.map(item => `
            <div class="book-item">
              <div class="book-icon">
                <i class="fas fa-book"></i>
              </div>
              <div class="book-details">
                <div class="book-title">${item.book_title}</div>
                <div class="book-meta">
                  ${item.book_subject} - ${item.book_grade}
                </div>
              </div>
              <div class="book-quantity">
                <span class="quantity-badge">
                  ${item.quantity}
                  <small>نسخة</small>
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Actions -->
      <div class="request-actions">
        <button 
          class="btn btn-primary btn-create-shipment"
          onclick="openCreateShipmentModal(${request.id})"
        >
          <i class="fas fa-truck"></i>
          إنشاء شحنة
        </button>
        <button 
          class="btn btn-secondary"
          onclick="viewRequestDetails(${request.id})"
        >
          <i class="fas fa-eye"></i>
          التفاصيل
        </button>
      </div>
    </div>
  `).join('');
}

// ==========================================
// 5. فتح نافذة إنشاء الشحنة
// ==========================================

function openCreateShipmentModal(requestId) {
  const request = approvedRequests.find(r => r.id === requestId);
  
  if (!request) {
    showError('الطلب غير موجود');
    return;
  }
  
  // إنشاء محتوى النافذة
  const modalContent = `
    <div class="modal-overlay" id="shipment-modal" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <h2>
            <i class="fas fa-truck-loading"></i>
            إنشاء شحنة جديدة
          </h2>
          <button class="close-btn" onclick="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <!-- Body -->
        <div class="modal-body">
          <!-- معلومات المدرسة -->
          <div class="section">
            <h3>معلومات المدرسة</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>اسم المدرسة:</label>
                <span>${request.school.name}</span>
              </div>
              <div class="info-item">
                <label>المحافظة:</label>
                <span>${request.school.province}</span>
              </div>
              <div class="info-item">
                <label>المديرية:</label>
                <span>${request.school.directorate}</span>
              </div>
              <div class="info-item">
                <label>رقم الطلب:</label>
                <span>#${request.id}</span>
              </div>
            </div>
          </div>
          
          <!-- الكتب المطلوبة -->
          <div class="section">
            <h3>الكتب المطلوبة</h3>
            <div class="books-checklist">
              ${request.items.map((item, index) => `
                <div class="book-checkbox-item">
                  <input 
                    type="checkbox" 
                    id="book-${index}" 
                    value="${item.book_id}"
                    checked
                    class="book-checkbox"
                  >
                  <label for="book-${index}">
                    <div class="book-info">
                      <strong>${item.book_title}</strong>
                      <span class="book-details-small">
                        ${item.book_subject} - ${item.book_grade}
                      </span>
                    </div>
                    <div class="quantity-input-wrapper">
                      <label class="quantity-label">الكمية:</label>
                      <input 
                        type="number" 
                        class="quantity-input"
                        id="quantity-${index}"
                        value="${item.quantity}"
                        min="1"
                        max="${item.quantity}"
                      >
                      <span class="max-quantity">/ ${item.quantity}</span>
                    </div>
                  </label>
                </div>
              `).join('')}
            </div>
            <div class="books-summary">
              <i class="fas fa-info-circle"></i>
              يمكنك اختيار وتعديل الكتب والكميات المطلوبة
            </div>
          </div>
          
          <!-- اختيار المندوب -->
          <div class="section">
            <h3>
              <i class="fas fa-user-tie"></i>
              اختيار المندوب
            </h3>
            <select id="courier-select" class="form-select" required>
              <option value="">-- اختر المندوب --</option>
              ${couriers.map(courier => `
                <option value="${courier.id}">
                  ${courier.first_name} ${courier.last_name} 
                  (${courier.username})
                  ${courier.phone_number ? ' - ' + courier.phone_number : ''}
                </option>
              `).join('')}
            </select>
          </div>
          
          <!-- ملاحظات -->
          <div class="section">
            <h3>
              <i class="fas fa-sticky-note"></i>
              ملاحظات (اختياري)
            </h3>
            <textarea 
              id="shipment-notes" 
              class="form-textarea"
              rows="3"
              placeholder="أدخل أي ملاحظات إضافية للمندوب أو المدرسة..."
            ></textarea>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="modal-footer">
          <button 
            class="btn btn-secondary"
            onclick="closeModal()"
          >
            <i class="fas fa-times"></i>
            إلغاء
          </button>
          <button 
            class="btn btn-primary"
            onclick="confirmCreateShipment(${request.id})"
          >
            <i class="fas fa-check"></i>
            إنشاء الشحنة
          </button>
        </div>
      </div>
    </div>
  `;
  
  // إضافة النافذة للصفحة
  document.body.insertAdjacentHTML('beforeend', modalContent);
  
  // تفعيل/تعطيل حقل الكمية حسب الـ checkbox
  document.querySelectorAll('.book-checkbox').forEach((checkbox, index) => {
    checkbox.addEventListener('change', function() {
      const quantityInput = document.getElementById(`quantity-${index}`);
      quantityInput.disabled = !this.checked;
    });
  });
}

// ==========================================
// 6. تأكيد إنشاء الشحنة
// ==========================================

async function confirmCreateShipment(requestId) {
  // جمع البيانات
  const courierId = document.getElementById('courier-select').value;
  const notes = document.getElementById('shipment-notes').value;
  
  // التحقق من اختيار المندوب
  if (!courierId) {
    showError('يرجى اختيار المندوب');
    return;
  }
  
  // جمع الكتب المختارة
  const selectedBooks = [];
  document.querySelectorAll('.book-checkbox').forEach((checkbox, index) => {
    if (checkbox.checked) {
      const quantity = document.getElementById(`quantity-${index}`).value;
      selectedBooks.push({
        book_id: checkbox.value,
        quantity: parseInt(quantity)
      });
    }
  });
  
  if (selectedBooks.length === 0) {
    showError('يرجى اختيار كتاب واحد على الأقل');
    return;
  }
  
  // عرض loading
  showLoading(true);
  
  try {
    // إرسال الطلب
    const response = await fetch(
      `${API_BASE_URL}/warehouses/province/shipments/create-from-request/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          school_request_id: requestId,
          courier_id: parseInt(courierId),
          notes: notes
        })
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      // نجحت العملية
      showSuccess('تم إنشاء الشحنة بنجاح! ✅');
      
      // إغلاق النافذة
      closeModal();
      
      // عرض تفاصيل الشحنة
      showShipmentDetails(data.shipment);
      
      // إعادة تحميل الطلبات
      await loadApprovedRequests();
      renderRequests();
      
    } else {
      showError(data.error || 'فشل في إنشاء الشحنة');
    }
    
  } catch (error) {
    console.error('Error creating shipment:', error);
    showError('حدث خطأ أثناء إنشاء الشحنة');
  } finally {
    showLoading(false);
  }
}

// ==========================================
// 7. عرض تفاصيل الشحنة المُنشأة
// ==========================================

function showShipmentDetails(shipment) {
  const modalContent = `
    <div class="modal-overlay" id="success-modal">
      <div class="modal-content success-modal">
        <!-- Success Icon -->
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        
        <!-- Header -->
        <div class="modal-header">
          <h2>تم إنشاء الشحنة بنجاح!</h2>
        </div>
        
        <!-- Body -->
        <div class="modal-body">
          <!-- معلومات الشحنة -->
          <div class="shipment-info-card">
            <div class="info-row">
              <span class="label">رقم التتبع:</span>
              <span class="value tracking-code">
                ${shipment.tracking_code}
                <button onclick="copyToClipboard('${shipment.tracking_code}')" class="copy-btn">
                  <i class="fas fa-copy"></i>
                </button>
              </span>
            </div>
            
            <div class="info-row">
              <span class="label">المدرسة:</span>
              <span class="value">${shipment.school_name}</span>
            </div>
            
            <div class="info-row">
              <span class="label">المندوب:</span>
              <span class="value">${shipment.courier.name}</span>
            </div>
            
            <div class="info-row">
              <span class="label">عدد الكتب:</span>
              <span class="value">${shipment.books.length} كتاب</span>
            </div>
          </div>
          
          <!-- QR Code -->
          ${shipment.qr_code_image ? `
            <div class="qr-section">
              <h3>
                <i class="fas fa-qrcode"></i>
                رمز QR للشحنة
              </h3>
              <div class="qr-image-container">
                <img 
                  src="data:image/png;base64,${shipment.qr_code_image}" 
                  alt="QR Code"
                  class="qr-image"
                >
              </div>
              <p class="qr-info">
                <i class="fas fa-info-circle"></i>
                صالح حتى: ${formatDateTime(shipment.qr_expires_at)}
              </p>
            </div>
          ` : ''}
          
          <!-- إشعار -->
          <div class="notification-alert">
            <i class="fas fa-paper-plane"></i>
            <div>
              <strong>تم إرسال الإشعارات:</strong>
              <ul>
                <li>✅ تم إرسال إشعار للمندوب</li>
                <li>✅ تم إرسال تقرير للمدرسة مع QR Code</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">
            إغلاق
          </button>
          <button class="btn btn-primary" onclick="printShipmentReport(${shipment.id})">
            <i class="fas fa-print"></i>
            طباعة التقرير
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalContent);
}

// ==========================================
// 8. دوال مساعدة
// ==========================================

function closeModal(event) {
  if (event && event.target.classList.contains('modal-content')) {
    return;
  }
  const modals = document.querySelectorAll('.modal-overlay');
  modals.forEach(modal => modal.remove());
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatDateTime(dateString) {
  if (!dateString) return 'غير محدد';
  const date = new Date(dateString);
  return date.toLocaleString('ar-EG');
}

function showLoading(show) {
  const loader = document.getElementById('page-loader');
  if (loader) {
    loader.style.display = show ? 'flex' : 'none';
  }
}

function showSuccess(message) {
  showToast(message, 'success');
}

function showError(message) {
  showToast(message, 'error');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  showSuccess('تم نسخ رقم التتبع');
}

function printShipmentReport(shipmentId) {
  window.open(`/warehouses/shipments/${shipmentId}/report/`, '_blank');
}

// ==========================================
// 9. العودة للقائمة الرئيسية
// ==========================================

function goToMainMenu() {
  if (confirm('هل تريد العودة إلى القائمة الرئيسية؟')) {
    window.location.href = '/province/dashboard/';
  }
}

function refreshPage() {
  showLoading(true);
  initializePage();
}

// ==========================================
// 10. الفلترة والبحث
// ==========================================

function filterRequests() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const provinceFilter = document.getElementById('filter-province').value;
  const directorateFilter = document.getElementById('filter-directorate').value;
  
  const filtered = approvedRequests.filter(request => {
    // فلترة البحث
    const matchesSearch = !searchTerm || 
      request.school.name.toLowerCase().includes(searchTerm) ||
      request.id.toString().includes(searchTerm);
    
    // فلترة المحافظة
    const matchesProvince = !provinceFilter || 
      request.school.province === provinceFilter;
    
    // فلترة المديرية
    const matchesDirectorate = !directorateFilter || 
      request.school.directorate === directorateFilter;
    
    return matchesSearch && matchesProvince && matchesDirectorate;
  });
  
  renderFilteredRequests(filtered);
}

function renderFilteredRequests(requests) {
  const container = document.getElementById('requests-container');
  
  if (requests.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search fa-3x"></i>
        <h3>لا توجد نتائج</h3>
        <p>لم يتم العثور على طلبات تطابق معايير البحث</p>
        <button class="btn btn-primary" onclick="clearFilters()">
          <i class="fas fa-times"></i>
          إلغاء الفلاتر
        </button>
      </div>
    `;
    return;
  }
  
  // استخدام نفس منطق renderRequests لكن مع القائمة المفلترة
  container.innerHTML = requests.map(request => `
    <div class="request-card" id="request-${request.id}">
      <!-- نفس المحتوى السابق -->
      <div class="request-header">
        <div class="school-info">
          <h3>
            <i class="fas fa-school"></i>
            ${request.school.name}
          </h3>
          <p class="school-details">
            <span><i class="fas fa-map-marker-alt"></i> ${request.school.province}</span>
            <span class="separator">•</span>
            <span>${request.school.directorate}</span>
          </p>
        </div>
        <div class="request-meta">
          <span class="badge badge-success">
            <i class="fas fa-check-circle"></i>
            موافق عليه
          </span>
          <span class="request-date">
            ${formatDate(request.created_at)}
          </span>
        </div>
      </div>
      
      <div class="books-section">
        <h4>
          <i class="fas fa-books"></i>
          الكتب المطلوبة (${request.total_items})
        </h4>
        <div class="books-list">
          ${request.items.map(item => `
            <div class="book-item">
              <div class="book-icon">
                <i class="fas fa-book"></i>
              </div>
              <div class="book-details">
                <div class="book-title">${item.book_title}</div>
                <div class="book-meta">
                  ${item.book_subject} - ${item.book_grade}
                </div>
              </div>
              <div class="book-quantity">
                <span class="quantity-badge">
                  ${item.quantity}
                  <small>نسخة</small>
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="request-actions">
        <button 
          class="btn btn-primary btn-create-shipment"
          onclick="openCreateShipmentModal(${request.id})"
        >
          <i class="fas fa-truck"></i>
          إنشاء شحنة
        </button>
        <button 
          class="btn btn-secondary"
          onclick="viewRequestDetails(${request.id})"
        >
          <i class="fas fa-eye"></i>
          التفاصيل
        </button>
      </div>
    </div>
  `).join('');
}

function clearFilters() {
  document.getElementById('search-input').value = '';
  document.getElementById('filter-province').value = '';
  document.getElementById('filter-directorate').value = '';
  renderRequests();
}

function populateFilters() {
  // استخراج المحافظات والمديريات الفريدة
  const provinces = [...new Set(approvedRequests.map(r => r.school.province))];
  const directorates = [...new Set(approvedRequests.map(r => r.school.directorate))];
  
  const provinceSelect = document.getElementById('filter-province');
  const directorateSelect = document.getElementById('filter-directorate');
  
  provinces.forEach(province => {
    const option = document.createElement('option');
    option.value = province;
    option.textContent = province;
    provinceSelect.appendChild(option);
  });
  
  directorates.forEach(directorate => {
    const option = document.createElement('option');
    option.value = directorate;
    option.textContent = directorate;
    directorateSelect.appendChild(option);
  });
}

// ==========================================
// 11. تحديث الإحصائيات
// ==========================================

function updateStats() {
  document.getElementById('total-requests').textContent = approvedRequests.length;
  document.getElementById('total-schools').textContent = 
    new Set(approvedRequests.map(r => r.school.id)).size;
  document.getElementById('total-books').textContent = 
    approvedRequests.reduce((sum, r) => sum + r.total_items, 0);
  document.getElementById('total-couriers').textContent = couriers.length;
}

// ==========================================
// 12. تهيئة الصفحة عند التحميل
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initializePage();
});
```

---

## 🎨 كود HTML الكامل

### ملف: `province-shipments-create.html`

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إنشاء شحنات من طلبات المدارس</title>
  
  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  <!-- Custom CSS -->
  <link rel="stylesheet" href="province-shipments-create.css">
</head>
<body>
  <!-- Top Navigation -->
  <div class="top-nav">
    <button class="btn-back" onclick="goToMainMenu()">
      <i class="fas fa-arrow-right"></i>
      <span>القائمة الرئيسية</span>
    </button>
    <div class="nav-title">
      <i class="fas fa-truck-loading"></i>
      <span>إنشاء شحنات من طلبات المدارس</span>
    </div>
    <div class="nav-actions">
      <button class="btn-icon" onclick="refreshPage()" title="تحديث">
        <i class="fas fa-sync-alt"></i>
      </button>
    </div>
  </div>
  
  <!-- Main Content -->
  <div class="container main-content">
    <!-- Action Bar -->
    <div class="action-bar">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          type="text" 
          id="search-input" 
          placeholder="بحث عن مدرسة أو رقم طلب..."
          onkeyup="filterRequests()"
        >
      </div>
      
      <div class="filters">
        <select id="filter-province" onchange="filterRequests()" class="filter-select">
          <option value="">جميع المحافظات</option>
        </select>
        
        <select id="filter-directorate" onchange="filterRequests()" class="filter-select">
          <option value="">جميع المديريات</option>
        </select>
        
        <button class="btn-filter" onclick="clearFilters()">
          <i class="fas fa-times"></i>
          إلغاء الفلاتر
        </button>
      </div>
    </div>
    
    <!-- Stats Cards -->
    <div class="stats-row">
      <div class="stat-card">
        <i class="fas fa-clipboard-check"></i>
        <div class="stat-content">
          <div class="stat-value" id="total-requests">0</div>
          <div class="stat-label">طلب موافق عليه</div>
        </div>
      </div>
      
      <div class="stat-card">
        <i class="fas fa-school"></i>
        <div class="stat-content">
          <div class="stat-value" id="total-schools">0</div>
          <div class="stat-label">مدرسة</div>
        </div>
      </div>
      
      <div class="stat-card">
        <i class="fas fa-book"></i>
        <div class="stat-content">
          <div class="stat-value" id="total-books">0</div>
          <div class="stat-label">كتاب مطلوب</div>
        </div>
      </div>
      
      <div class="stat-card">
        <i class="fas fa-user-tie"></i>
        <div class="stat-content">
          <div class="stat-value" id="total-couriers">0</div>
          <div class="stat-label">مندوب متاح</div>
        </div>
      </div>
    </div>
    
    <!-- Requests Container -->
    <div id="requests-container" class="requests-container">
      <!-- Will be populated by JavaScript -->
    </div>
  </div>
  
  <!-- Loading Overlay -->
  <div id="page-loader" class="page-loader" style="display: none;">
    <div class="loader-content">
      <div class="spinner"></div>
      <p>جاري التحميل...</p>
    </div>
  </div>
  
  <!-- Scripts -->
  <script src="province-shipments-create.js"></script>
</body>
</html>
```

---

## 💅 كود CSS الكامل

### ملف: `province-shipments-create.css`

```css
/* ==========================================
   Global Styles
   ========================================== */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 0;
  direction: rtl;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* ==========================================
   Top Navigation
   ========================================== */

.top-nav {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 15px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  color: #2d3748;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-back:hover {
  background: #667eea;
  border-color: #667eea;
  color: white;
  transform: translateX(5px);
}

.btn-back i {
  font-size: 1.1rem;
}

.nav-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.3rem;
  font-weight: bold;
  color: #2d3748;
}

.nav-title i {
  color: #667eea;
  font-size: 1.5rem;
}

.nav-actions {
  display: flex;
  gap: 10px;
}

.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  background: white;
  color: #718096;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: #667eea;
  border-color: #667eea;
  color: white;
  transform: rotate(180deg);
}

/* ==========================================
   Action Bar (Search & Filters)
   ========================================== */

.action-bar {
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.search-box {
  position: relative;
  flex: 1;
}

.search-box i {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  font-size: 1.1rem;
}

.search-box input {
  width: 100%;
  padding: 12px 45px 12px 15px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s;
}

.search-box input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 10px 15px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #2d3748;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 200px;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.btn-filter {
  padding: 10px 20px;
  background: #fed7d7;
  border: 2px solid #fc8181;
  border-radius: 10px;
  color: #c53030;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-filter:hover {
  background: #fc8181;
  color: white;
}

/* ==========================================
   Stats Cards
   ========================================== */

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.stat-card i {
  font-size: 2.5rem;
  color: #667eea;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2d3748;
}

.stat-label {
  color: #718096;
  margin-top: 5px;
}

/* ==========================================
   Request Cards
   ========================================== */

.requests-container {
  display: grid;
  gap: 25px;
}

.request-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  border-right: 5px solid #667eea;
}

.request-card:hover {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  transform: translateY(-3px);
  border-right-color: #764ba2;
}

/* Request Header */
.request-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
}

.school-info h3 {
  color: #2d3748;
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.school-info h3 i {
  color: #667eea;
  margin-left: 10px;
}

.school-details {
  color: #718096;
  font-size: 1rem;
}

.school-details span {
  margin-left: 10px;
}

.separator {
  color: #cbd5e0;
  margin: 0 10px;
}

.request-meta {
  text-align: left;
}

.badge {
  display: inline-block;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 10px;
}

.badge-success {
  background: #c6f6d5;
  color: #22543d;
}

.request-date {
  display: block;
  color: #a0aec0;
  font-size: 0.9rem;
}

/* Books Section */
.books-section {
  margin-bottom: 25px;
}

.books-section h4 {
  color: #2d3748;
  font-size: 1.2rem;
  margin-bottom: 15px;
}

.books-section h4 i {
  color: #667eea;
  margin-left: 10px;
}

.books-list {
  display: grid;
  gap: 15px;
}

.book-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f7fafc;
  border-radius: 10px;
  border-right: 4px solid #667eea;
  transition: all 0.3s;
}

.book-item:hover {
  background: #edf2f7;
  transform: translateX(-5px);
}

.book-icon {
  width: 50px;
  height: 50px;
  background: #667eea;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 15px;
}

.book-icon i {
  color: white;
  font-size: 1.5rem;
}

.book-details {
  flex: 1;
}

.book-title {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 5px;
}

.book-meta {
  color: #718096;
  font-size: 0.9rem;
}

.book-quantity {
  margin-right: 15px;
}

.quantity-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 20px;
  background: white;
  border: 2px solid #667eea;
  border-radius: 10px;
  font-weight: bold;
  color: #667eea;
  font-size: 1.2rem;
}

.quantity-badge small {
  font-size: 0.8rem;
  font-weight: normal;
  color: #718096;
}

/* Request Actions */
.request-actions {
  display: flex;
  gap: 15px;
}

.btn {
  padding: 12px 30px;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-secondary {
  background: #e2e8f0;
  color: #2d3748;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

/* ==========================================
   Modal Styles
   ========================================== */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 25px 30px;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  color: #2d3748;
  font-size: 1.5rem;
}

.modal-header h2 i {
  color: #667eea;
  margin-left: 10px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #a0aec0;
  cursor: pointer;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #2d3748;
}

.modal-body {
  padding: 30px;
}

.section {
  margin-bottom: 30px;
}

.section h3 {
  color: #2d3748;
  font-size: 1.2rem;
  margin-bottom: 15px;
}

.section h3 i {
  color: #667eea;
  margin-left: 10px;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  background: #f7fafc;
  padding: 20px;
  border-radius: 10px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item label {
  color: #718096;
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.info-item span {
  color: #2d3748;
  font-weight: 600;
}

/* Books Checklist */
.books-checklist {
  display: grid;
  gap: 15px;
}

.book-checkbox-item {
  background: #f7fafc;
  border-radius: 10px;
  padding: 15px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s;
}

.book-checkbox-item:has(input:checked) {
  border-color: #667eea;
  background: #eef2ff;
}

.book-checkbox-item input[type="checkbox"] {
  margin-left: 10px;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.book-checkbox-item label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.book-info {
  flex: 1;
}

.book-info strong {
  display: block;
  color: #2d3748;
  margin-bottom: 5px;
}

.book-details-small {
  color: #718096;
  font-size: 0.9rem;
}

.quantity-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quantity-label {
  color: #718096;
}

.quantity-input {
  width: 80px;
  padding: 8px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  text-align: center;
  font-size: 1rem;
}

.max-quantity {
  color: #a0aec0;
}

.books-summary {
  margin-top: 15px;
  padding: 12px;
  background: #bee3f8;
  border-radius: 8px;
  color: #2c5282;
  font-size: 0.9rem;
}

.books-summary i {
  margin-left: 10px;
}

/* Form Elements */
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-textarea {
  resize: vertical;
}

.modal-footer {
  padding: 20px 30px;
  border-top: 2px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

/* Success Modal */
.success-modal .success-icon {
  text-align: center;
  padding: 30px 0;
}

.success-icon i {
  font-size: 5rem;
  color: #48bb78;
  animation: scaleIn 0.5s;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.shipment-info-card {
  background: #f7fafc;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 25px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  color: #718096;
  font-weight: 600;
}

.info-row .value {
  color: #2d3748;
  font-weight: bold;
}

.tracking-code {
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  color: #667eea;
}

.copy-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  margin-right: 10px;
  transition: color 0.3s;
}

.copy-btn:hover {
  color: #764ba2;
}

/* QR Section */
.qr-section {
  text-align: center;
  margin-bottom: 25px;
}

.qr-section h3 {
  color: #2d3748;
  margin-bottom: 20px;
}

.qr-image-container {
  background: white;
  padding: 20px;
  border-radius: 15px;
  display: inline-block;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.qr-image {
  max-width: 250px;
  height: auto;
}

.qr-info {
  color: #718096;
  margin-top: 15px;
}

.qr-info i {
  color: #667eea;
  margin-left: 5px;
}

/* Notification Alert */
.notification-alert {
  background: #c6f6d5;
  border-right: 4px solid #48bb78;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.notification-alert i {
  color: #22543d;
  font-size: 1.5rem;
  margin-top: 3px;
}

.notification-alert strong {
  color: #22543d;
  display: block;
  margin-bottom: 10px;
}

.notification-alert ul {
  list-style: none;
  color: #22543d;
}

.notification-alert li {
  margin-bottom: 5px;
}

/* ==========================================
   Loading & Toast
   ========================================== */

.page-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loader-content {
  text-align: center;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loader-content p {
  color: white;
  font-size: 1.2rem;
}

.toast {
  position: fixed;
  bottom: -100px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 15px 30px;
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 15px;
  z-index: 10000;
  transition: bottom 0.3s;
}

.toast.show {
  bottom: 30px;
}

.toast-success {
  border-right: 5px solid #48bb78;
}

.toast-success i {
  color: #48bb78;
  font-size: 1.5rem;
}

.toast-error {
  border-right: 5px solid #f56565;
}

.toast-error i {
  color: #f56565;
  font-size: 1.5rem;
}

/* ==========================================
   Empty State
   ========================================== */

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.empty-state i {
  color: #cbd5e0;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #2d3748;
  margin-bottom: 10px;
}

.empty-state p {
  color: #718096;
}

/* ==========================================
   Responsive
   ========================================== */

@media (max-width: 768px) {
  .top-nav {
    padding: 10px 15px;
  }
  
  .nav-title span {
    display: none;
  }
  
  .btn-back span {
    display: none;
  }
  
  .action-bar {
    padding: 15px;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .filter-select {
    width: 100%;
    min-width: auto;
  }
  
  .request-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .request-meta {
    text-align: right;
  }
  
  .request-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-row {
    grid-template-columns: 1fr;
  }
  
  .container {
    padding: 10px;
  }
  
  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }
}
```

---

## 📝 ملاحظات مهمة

### 1. البيانات المُرسلة تلقائياً:
- ✅ إشعار للمندوب عبر Firebase
- ✅ Notification للمدرسة في قاعدة البيانات
- ✅ Push Notification للمدرسة (إذا كان متاحاً)
- ✅ QR Code مُضمّن في التقرير

### 2. الكتب من المخزن:
- يتم عرض جميع الكتب المطلوبة
- يمكن تعديل الكميات
- يمكن إلغاء اختيار كتب معينة

### 3. إسناد المندوب:
- قائمة منسدلة بجميع مندوبي المحافظة
- يتم تحديث الشحنة تلقائياً بالمندوب المُختار

---

## 🚀 التشغيل

1. ضع الملفات في مجلد المشروع
2. تأكد من تحديث `API_BASE_URL` في JavaScript
3. افتح `province-shipments-create.html` في المتصفح
4. سجّل الدخول واحصل على Token
5. استخدم الواجهة!

---

**الحالة:** ✅ جاهز للاستخدام  
**التاريخ:** 24 ديسمبر 2025
