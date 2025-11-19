import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
} from 'lucide-react';

export function CreateBookRequest() {
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [requestItems, setRequestItems] = useState<
    Array<{ book: string; grade: string; quantity: number }>
  >([]);

  const requests = [
    {
      id: 'REQ-2024-045',
      date: '2024-11-14',
      books: 5200,
      status: 'قيد المراجعة',
      ministry_response: 'تحت الدراسة',
      items: 8,
    },
    {
      id: 'REQ-2024-044',
      date: '2024-11-12',
      books: 3800,
      status: 'معتمد',
      ministry_response: 'تم الموافقة - سيتم الشحن قريباً',
      items: 6,
    },
    {
      id: 'REQ-2024-043',
      date: '2024-11-10',
      books: 4200,
      status: 'مكتمل',
      ministry_response: 'تم الشحن - رقم الشحنة SH-2024-098',
      items: 7,
    },
    {
      id: 'REQ-2024-042',
      date: '2024-11-08',
      books: 2900,
      status: 'مرفوض',
      ministry_response: 'الكميات المطلوبة غير متوفرة حالياً',
      items: 5,
    },
  ];

  const bookTemplates = [
    { title: 'اللغة العربية - الصف الأول', grade: 'الأول' },
    { title: 'الرياضيات - الصف الثاني', grade: 'الثاني' },
    { title: 'العلوم - الصف الثالث', grade: 'الثالث' },
    { title: 'اللغة الإنجليزية - الصف الرابع', grade: 'الرابع' },
    { title: 'التربية الإسلامية - الصف الخامس', grade: 'الخامس' },
  ];

  const addRequestItem = () => {
    setRequestItems([...requestItems, { book: '', grade: '', quantity: 0 }]);
  };

  const removeRequestItem = (index: number) => {
    setRequestItems(requestItems.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'مكتمل':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'معتمد':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'قيد المراجعة':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'مرفوض':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مكتمل':
        return 'bg-green-100 text-green-700';
      case 'معتمد':
        return 'bg-blue-100 text-blue-700';
      case 'قيد المراجعة':
        return 'bg-yellow-100 text-yellow-700';
      case 'مرفوض':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">إجمالي الطلبات</p>
                <p className="text-2xl">48</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">قيد المراجعة</p>
                <p className="text-2xl">5</p>
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
                <p className="text-sm text-gray-600 mb-2">معتمد</p>
                <p className="text-2xl">38</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">مرفوض</p>
                <p className="text-2xl">5</p>
              </div>
              <div className="bg-red-500 p-3 rounded-lg">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Request */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>طلبات الكتب إلى الوزارة</CardTitle>
            <Dialog open={showCreateRequest} onOpenChange={setShowCreateRequest}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء طلب جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إنشاء طلب كتب جديد</DialogTitle>
                  <DialogDescription>
                    أدخل معلومات الكتب المطلوبة من الوزارة
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>الجهة الطالبة</Label>
                      <Input value="أمانة العاصمة صنعاء" disabled className="text-right" />
                    </div>
                    <div>
                      <Label>تاريخ الطلب</Label>
                      <Input type="date" className="text-right" />
                    </div>
                  </div>

                  <div>
                    <Label>سبب الطلب</Label>
                    <Textarea
                      placeholder="أدخل سبب الطلب (مثل: نقص في المخزون، زيادة أعداد الطلاب، إلخ)"
                      className="text-right"
                      rows={3}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4>الكتب المطلوبة</h4>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addRequestItem}
                      >
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة كتاب
                      </Button>
                    </div>

                    {requestItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        لم يتم إضافة أي كتب بعد. انقر على "إضافة كتاب" للبدء
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {requestItems.map((item, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-12 gap-3 items-end p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="col-span-5">
                              <Label className="text-sm">اسم الكتاب</Label>
                              <Input
                                placeholder="اختر أو أدخل اسم الكتاب"
                                className="text-right"
                                list={`books-${index}`}
                              />
                              <datalist id={`books-${index}`}>
                                {bookTemplates.map((book, i) => (
                                  <option key={i} value={book.title} />
                                ))}
                              </datalist>
                            </div>
                            <div className="col-span-3">
                              <Label className="text-sm">الصف</Label>
                              <Input placeholder="مثال: الأول" className="text-right" />
                            </div>
                            <div className="col-span-3">
                              <Label className="text-sm">الكمية</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                className="text-right"
                              />
                            </div>
                            <div className="col-span-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => removeRequestItem(index)}
                                className="w-full"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>ملاحظات إضافية</Label>
                    <Textarea
                      placeholder="أي ملاحظات أو تفاصيل إضافية (اختياري)"
                      className="text-right"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">إجمالي الكتب المطلوبة</p>
                      <p className="text-xl">
                        {requestItems.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()} كتاب
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">عدد الأصناف</p>
                      <p className="text-xl">{requestItems.length} صنف</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                      إرسال الطلب
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowCreateRequest(false);
                        setRequestItems([]);
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الطلب</TableHead>
                <TableHead className="text-right">تاريخ الطلب</TableHead>
                <TableHead className="text-right">عدد الكتب</TableHead>
                <TableHead className="text-right">عدد الأصناف</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">رد الوزارة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.id}</TableCell>
                  <TableCell>{request.date}</TableCell>
                  <TableCell>{request.books.toLocaleString()}</TableCell>
                  <TableCell>{request.items}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600 max-w-xs truncate">
                      {request.ministry_response}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
