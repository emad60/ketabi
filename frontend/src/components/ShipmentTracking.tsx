import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import {
  Package,
  MapPin,
  CheckCircle,
  Clock,
  Truck,
  User,
  Phone,
  Calendar,
  FileText,
} from 'lucide-react';

interface ShipmentTrackingProps {
  type: 'ministry' | 'capital';
}

export function ShipmentTracking({ type }: ShipmentTrackingProps) {
  const [trackingId, setTrackingId] = useState('');
  const [showTracking, setShowTracking] = useState(false);

  const trackingData = {
    id: 'SH-2024-001',
    status: 'قيد التسليم',
    from: type === 'ministry' ? 'المخزن المركزي - صنعاء' : 'مخزن أمانة العاصمة',
    to: type === 'ministry' ? 'أمانة العاصمة' : 'مديرية الوحدة',
    representative: {
      name: 'محمد أحمد الشامي',
      phone: '777123456',
      vehicle: 'شاحنة - ABC123',
    },
    books: [
      { title: 'اللغة العربية - الصف الأول', quantity: 1500 },
      { title: 'الرياضيات - الصف الثاني', quantity: 1200 },
      { title: 'العلوم - الصف الثالث', quantity: 1000 },
      { title: 'اللغة الإنجليزية - الصف الرابع', quantity: 800 },
      { title: 'التربية الإسلامية - الصف الخامس', quantity: 700 },
    ],
    timeline: [
      {
        status: 'تم الإنشاء',
        description: 'تم إنشاء الشحنة وتجهيز الطلب',
        date: '2024-11-14',
        time: '08:30 ص',
        completed: true,
      },
      {
        status: 'تم التحميل',
        description: 'تم تحميل الكتب على المركبة',
        date: '2024-11-14',
        time: '10:15 ص',
        completed: true,
      },
      {
        status: 'في الطريق',
        description: 'الشحنة في طريقها إلى الوجهة',
        date: '2024-11-14',
        time: '11:00 ص',
        completed: true,
      },
      {
        status: 'وصلت للمحافظة',
        description: 'وصلت الشحنة إلى مخزن المحافظة',
        date: '2024-11-14',
        time: '02:30 م',
        completed: false,
      },
      {
        status: 'تم التسليم',
        description: 'تم التسليم والتوقيع على المستندات',
        date: '-',
        time: '-',
        completed: false,
      },
    ],
  };

  const handleTrack = () => {
    if (trackingId) {
      setShowTracking(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>تتبع الشحنة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="أدخل رقم الشحنة (مثال: SH-2024-001)"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="text-right"
            />
            <Button
              onClick={handleTrack}
              className={type === 'ministry' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}
            >
              تتبع
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Results */}
      {showTracking && (
        <div className="space-y-6">
          {/* Shipment Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">رقم الشحنة</p>
                    <p>{trackingData.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Truck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">الحالة</p>
                    <p>{trackingData.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">إجمالي الكتب</p>
                    <p>{trackingData.books.reduce((sum, book) => sum + book.quantity, 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Route and Representative */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات المسار</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">من</p>
                    <p>{trackingData.from}</p>
                  </div>
                </div>
                <div className="border-r-2 border-dashed border-gray-300 h-8 mr-5"></div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">إلى</p>
                    <p>{trackingData.to}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معلومات المندوب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">الاسم</p>
                    <p>{trackingData.representative.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">رقم الهاتف</p>
                    <p>{trackingData.representative.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">المركبة</p>
                    <p>{trackingData.representative.vehicle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>تتبع الشحنة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {trackingData.timeline.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`p-2 rounded-full ${
                          item.completed ? 'bg-green-100' : 'bg-gray-100'
                        }`}
                      >
                        {item.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      {index < trackingData.timeline.length - 1 && (
                        <div
                          className={`w-0.5 h-16 ${
                            item.completed ? 'bg-green-300' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={item.completed ? 'text-green-600' : 'text-gray-500'}>
                          {item.status}
                        </h4>
                        {item.date !== '-' && (
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{item.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{item.time}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Books List */}
          <Card>
            <CardHeader>
              <CardTitle>محتويات الشحنة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trackingData.books.map((book, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <p>{book.title}</p>
                    </div>
                    <p className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
                      {book.quantity.toLocaleString()} كتاب
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
