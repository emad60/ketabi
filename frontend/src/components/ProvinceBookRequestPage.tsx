import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Plus, Trash2, Send, Package, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface Book {
  id: number;
  title: string;
  subject: string;
  grade: string;
  isbn?: string;
  total_quantity?: number;
  available_quantity?: number;
}

interface RequestItem {
  book?: number;
  subject: string;
  grade: string;
  quantity: number;
}

interface BookRequest {
  id: number;
  request_number: string;
  created_at: string;
  status: string;
  notes?: string;
  items: Array<{
    id: number;
    book: number;
    book_title?: string;
    grade: string;
    subject: string;
    quantity: number;
  }>;
}

// قائمة المواد الدراسية
const SUBJECTS = [
  'رياضيات',
  'لغة عربية',
  'لغة إنجليزية',
  'علوم',
  'دراسات اجتماعية',
  'تربية إسلامية',
  'حاسوب',
  'تربية فنية',
  'تربية رياضية',
];

// قائمة الصفوف الدراسية
const GRADES = [
  'الصف الأول',
  'الصف الثاني',
  'الصف الثالث',
  'الصف الرابع',
  'الصف الخامس',
  'الصف السادس',
  'الصف السابع',
  'الصف الثامن',
  'الصف التاسع',
];

export function ProvinceBookRequestPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
  const [searchParams] = useSearchParams();
  const [selectedRequest, setSelectedRequest] = useState<BookRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // حقول منفصلة
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    // If an id query param is present, try to fetch and open that request's details
    const paramId = searchParams.get('id');
    if (paramId) {
      (async () => {
        try {
          const resp = await api.get(`/book-requests/province/${paramId}/`);
          setSelectedRequest(resp.data);
          setShowDetails(true);
        } catch (err) {
          console.error('Failed to load province request from query param:', err);
        }
      })();
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch books
      const booksResponse = await api.get('/books/');
      console.log('Books API Response:', booksResponse.data);
      const booksData = booksResponse.data.results || booksResponse.data;
      setBooks(Array.isArray(booksData) ? booksData : []);
      
      // Fetch province requests
      const requestsResponse = await api.get('/book-requests/province/');
      console.log('Province Requests API Response:', requestsResponse.data);
      const requestsData = requestsResponse.data.results || requestsResponse.data;
      console.log('Number of requests:', Array.isArray(requestsData) ? requestsData.length : 0);
      setRequests(Array.isArray(requestsData) ? requestsData : []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const addItemToRequest = () => {
    if (!selectedSubject || !selectedGrade || !quantity || parseInt(quantity) <= 0) {
      alert('الرجاء إدخال جميع الحقول المطلوبة');
      return;
    }

    // Find book matching subject and grade
    const book = books.find(b => b.subject === selectedSubject && b.grade === selectedGrade);

    const newItem: RequestItem = {
      book: book?.id,
      subject: selectedSubject,
      grade: selectedGrade,
      quantity: parseInt(quantity),
    };

    setRequestItems([...requestItems, newItem]);
    
    // Reset fields
    setSelectedSubject('');
    setSelectedGrade('');
    setQuantity('');
  };

  const removeItemFromRequest = (index: number) => {
    setRequestItems(requestItems.filter((_, i) => i !== index));
  };

  const submitRequest = async () => {
    if (requestItems.length === 0) {
      alert('الرجاء إضافة كتب إلى الطلب');
      return;
    }

    try {
      setSubmitting(true);
      
      const requestData = {
        items: requestItems,
        notes: notes,
      };
      
      await api.post('/book-requests/province/', requestData);
      
      alert('تم إرسال الطلب بنجاح');
      setIsDialogOpen(false);
      setRequestItems([]);
      setNotes('');
      
      // Reload requests
      fetchData();
      
    } catch (error: any) {
      console.error('Error submitting request:', error);
      alert(error.response?.data?.detail || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
      pending: { label: 'قيد الانتظار', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
      approved: { label: 'معتمد', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
      rejected: { label: 'مرفوض', icon: XCircle, color: 'text-red-600 bg-red-50' },
      fulfilled: { label: 'تم التنفيذ', icon: Package, color: 'text-blue-600 bg-blue-50' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  // Calculate stats
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">طلبات الكتب من الوزارة</h2>
          <p className="text-sm text-gray-600 mt-1">إنشاء ومتابعة طلبات الكتب</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="ml-2 w-4 h-4" />
              طلب جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء طلب كتب جديد</DialogTitle>
              <DialogDescription>
                اختر المادة والصف وأدخل الكمية المطلوبة
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Add Book Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">إضافة كتاب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>المادة</Label>
                      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المادة" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECTS.map(subject => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>الصف الدراسي</Label>
                      <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الصف" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADES.map(grade => (
                            <SelectItem key={grade} value={grade}>
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>الكمية</Label>
                      <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="أدخل الكمية"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={addItemToRequest} 
                    variant="outline" 
                    className="w-full"
                    type="button"
                  >
                    <Plus className="ml-2 w-4 h-4" />
                    إضافة إلى الطلب
                  </Button>
                </CardContent>
              </Card>

              {/* Request Items Table */}
              {requestItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">الكتب المطلوبة ({requestItems.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">#</TableHead>
                          <TableHead className="text-right">المادة</TableHead>
                          <TableHead className="text-right">الصف</TableHead>
                          <TableHead className="text-right">الكمية</TableHead>
                          <TableHead className="text-right">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requestItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{item.subject}</TableCell>
                            <TableCell>{item.grade}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItemFromRequest(index)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              <div>
                <Label>ملاحظات (اختياري)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات إضافية..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                إلغاء
              </Button>
              <Button 
                onClick={submitRequest} 
                disabled={submitting || requestItems.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>جاري الإرسال...</>
                ) : (
                  <>
                    <Send className="ml-2 w-4 h-4" />
                    إرسال الطلب
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">قيد الانتظار</p>
                <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.pending}</p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">معتمدة</p>
                <p className="text-3xl font-bold mt-2 text-green-600">{stats.approved}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مرفوضة</p>
                <p className="text-3xl font-bold mt-2 text-red-600">{stats.rejected}</p>
              </div>
              <div className="bg-red-500 p-3 rounded-lg">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>سجل الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>لا توجد طلبات بعد</p>
              <p className="text-sm mt-2">ابدأ بإنشاء طلب جديد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الطلب</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">عدد الكتب</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.request_number}</TableCell>
                    <TableCell>{new Date(request.created_at).toLocaleDateString('ar-YE')}</TableCell>
                    <TableCell>{request.items.length} كتاب</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {request.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={async () => {
                        try {
                          const resp = await api.get(`/book-requests/province/${request.id}/`);
                          setSelectedRequest(resp.data);
                          setShowDetails(true);
                        } catch (err) {
                          console.error('Failed to fetch request details:', err);
                          alert('فشل جلب تفاصيل الطلب');
                        }
                      }}>
                        <Eye className="w-4 h-4 ml-1" />
                        عرض
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog (for province request) */}
      {selectedRequest && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-4xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>تفاصيل الطلب {selectedRequest.request_number}</DialogTitle>
              <DialogDescription>
                معلومات كاملة عن طلب المحافظة
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">المحافظة:</span>
                  <p className="font-medium">{selectedRequest.items && selectedRequest.items.length > 0 ? (selectedRequest.items[0].book_title || '-') : '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">التاريخ:</span>
                  <p className="font-medium">{new Date(selectedRequest.created_at).toLocaleString('ar-YE')}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">الحالة:</span>
                  <p>{getStatusBadge(selectedRequest.status)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">الكتب المطلوبة</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المادة</TableHead>
                      <TableHead className="text-right">الصف</TableHead>
                      <TableHead className="text-right">الكمية المطلوبة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedRequest.items || []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.subject}</TableCell>
                        <TableCell>{item.grade}</TableCell>
                        <TableCell><Badge>{item.quantity}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedRequest.notes && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">ملاحظات:</p>
                  <p className="text-sm text-blue-800">{selectedRequest.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetails(false)}>إغلاق</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
