import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Bell,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  MapPin,
  Calendar,
  User,
  BookOpen,
  FileText,
  Download,
  Eye,
  ArrowLeft,
  Filter,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Notification {
  id: number;
  message: string;
  notification_type: string;
  read: boolean;
  created_at: string;
  data?: any;
  shipment?: ShipmentDetails;
}

interface ShipmentDetails {
  id: number;
  tracking_code: string;
  status: string;
  from_ministry?: { id: number; name: string };
  from_ministry_name?: string;
  to_province?: { id: number; name: string; province: string };
  to_province_name?: string;
  assigned_courier?: { id: number; full_name: string; username: string };
  assigned_courier_name?: string;
  books: Array<{
    id?: number;
    book_id: number;
    book_title: string;
    book_subject?: string;
    book_grade?: string;
    quantity: number;
  }>;
  created_at: string;
  expected_delivery?: string;
  delivered_at?: string;
  notes?: string;
  related_request?: { id: number; request_number?: string };
}

export default function ProvinceShipmentNotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [shipments, setShipments] = useState<ShipmentDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // جلب الإشعارات
      const notifResponse = await api.get('/notifications/');
      const notifData = notifResponse.data.results || notifResponse.data || [];
      
      // فلترة الإشعارات الخاصة بالشحنات فقط
      const shipmentNotifications = (Array.isArray(notifData) ? notifData : []).filter((n: any) => 
        n.notification_type === 'shipment_created' || 
        n.notification_type === 'shipment_assigned' ||
        n.notification_type === 'shipment_out_for_delivery' ||
        n.notification_type === 'shipment_delivered' ||
        n.message?.includes('شحنة') || 
        n.message?.includes('shipment')
      );

      // جلب الشحنات القادمة من الوزارة
      const params: any = {};
      if (typeof user?.province === 'number') {
        params.to_province = user.province;
      }
      
      const shipmentsResponse = await api.get('/warehouses/shipments/', { params });
      let shipmentsData = shipmentsResponse.data.results || shipmentsResponse.data || [];
      
      // فلترة الشحنات القادمة من الوزارة فقط
      if (typeof user?.province !== 'number' && user?.province_name) {
        const pname = user.province_name;
        shipmentsData = (Array.isArray(shipmentsData) ? shipmentsData : []).filter((s: any) => {
          const hasMinistrySource = s.from_ministry || s.from_warehouse?.ministry;
          const matchesProvince = s.to_province?.province === pname || s.to_province?.name === pname || s.to_province === pname;
          return hasMinistrySource && matchesProvince;
        });
      } else {
        shipmentsData = (Array.isArray(shipmentsData) ? shipmentsData : []).filter((s: any) => {
          return s.from_ministry || s.from_warehouse?.ministry;
        });
      }

      // ربط الشحنات بالإشعارات
      const enrichedNotifications = shipmentNotifications.map((notif: any) => {
        const shipmentIdMatch = notif.message?.match(/#(\d+)/);
        if (shipmentIdMatch) {
          const shipmentId = parseInt(shipmentIdMatch[1]);
          const shipment = shipmentsData.find((s: any) => s.id === shipmentId);
          return { ...notif, shipment };
        }
        return notif;
      });

      setNotifications(enrichedNotifications);
      setShipments(shipmentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.post(`/notifications/${notificationId}/mark_read/`);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      assigned: { label: 'تم التعيين', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: User },
      out_for_delivery: { label: 'قيد التوصيل', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Truck },
      delivered: { label: 'تم التسليم', color: 'bg-green-100 text-green-800 border-green-300', icon: Package },
      confirmed: { label: 'مؤكد', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle },
    };

    const config = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300', icon: AlertTriangle };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      shipment_created: Package,
      shipment_assigned: User,
      shipment_out_for_delivery: Truck,
      shipment_delivered: CheckCircle,
    };
    return iconMap[type] || Bell;
  };

  const getNotificationColor = (type: string) => {
    const colorMap: Record<string, string> = {
      shipment_created: 'bg-blue-50 border-blue-200',
      shipment_assigned: 'bg-purple-50 border-purple-200',
      shipment_out_for_delivery: 'bg-yellow-50 border-yellow-200',
      shipment_delivered: 'bg-green-50 border-green-200',
    };
    return colorMap[type] || 'bg-gray-50 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الإشعارات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Bell className="w-8 h-8" />
                <h1 className="text-3xl font-bold">إشعارات الشحنات</h1>
              </div>
              <p className="text-purple-100">تقارير وإشعارات الشحنات القادمة من الوزارة</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate('/province/dashboard')}
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة للوحة التحكم
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الإشعارات</p>
                  <p className="text-3xl font-bold text-gray-900">{notifications.length}</p>
                </div>
                <Bell className="w-10 h-10 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">غير مقروءة</p>
                  <p className="text-3xl font-bold text-orange-600">{unreadCount}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">شحنات قيد التوصيل</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {shipments.filter(s => s.status === 'out_for_delivery').length}
                  </p>
                </div>
                <Truck className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">في انتظار الاستلام</p>
                  <p className="text-3xl font-bold text-green-600">
                    {shipments.filter(s => s.status === 'delivered').length}
                  </p>
                </div>
                <Package className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notifications List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  الإشعارات
                </CardTitle>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">الكل ({notifications.length})</TabsTrigger>
                    <TabsTrigger value="unread">غير مقروءة ({unreadCount})</TabsTrigger>
                    <TabsTrigger value="read">مقروءة ({notifications.length - unreadCount})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">لا توجد إشعارات</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.notification_type);
                      return (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                            notification.read ? 'bg-white border-gray-200' : getNotificationColor(notification.notification_type)
                          }`}
                          onClick={() => {
                            setSelectedNotification(notification);
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${!notification.read ? 'bg-white/50' : 'bg-gray-100'}`}>
                              <Icon className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                                  {notification.message}
                                </p>
                                {!notification.read && (
                                  <span className="flex-shrink-0 w-2 h-2 bg-purple-600 rounded-full"></span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {getTimeAgo(notification.created_at)}
                                </span>
                                {notification.shipment && (
                                  <span className="flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    رقم الشحنة: {notification.shipment.tracking_code}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notification Details / Recent Shipments */}
          <div className="lg:col-span-1">
            {selectedNotification ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    تفاصيل الإشعار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        {selectedNotification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(selectedNotification.created_at)}
                      </p>
                    </div>

                    {selectedNotification.shipment && (
                      <>
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-semibold mb-3">معلومات الشحنة</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">رقم الشحنة:</span>
                              <span className="text-sm font-mono font-semibold text-purple-600">
                                {selectedNotification.shipment.tracking_code}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">الحالة:</span>
                              {getStatusBadge(selectedNotification.shipment.status)}
                            </div>

                            <div className="flex justify-between items-start">
                              <span className="text-xs text-gray-600">من:</span>
                              <span className="text-sm text-right">
                                {selectedNotification.shipment.from_ministry_name || 
                                 selectedNotification.shipment.from_ministry?.name || 
                                 'غير محدد'}
                              </span>
                            </div>

                            {selectedNotification.shipment.assigned_courier_name && (
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-gray-600">المندوب:</span>
                                <span className="text-sm text-right flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {selectedNotification.shipment.assigned_courier_name}
                                </span>
                              </div>
                            )}

                            <div className="flex justify-between items-start">
                              <span className="text-xs text-gray-600">تاريخ الإنشاء:</span>
                              <span className="text-sm text-right">
                                {formatDate(selectedNotification.shipment.created_at)}
                              </span>
                            </div>

                            {selectedNotification.shipment.books && selectedNotification.shipment.books.length > 0 && (
                              <div>
                                <span className="text-xs text-gray-600 block mb-2">الكتب ({selectedNotification.shipment.books.length}):</span>
                                <div className="bg-gray-50 rounded p-2 space-y-1 max-h-32 overflow-y-auto">
                                  {selectedNotification.shipment.books.map((book, idx) => (
                                    <div key={idx} className="text-xs flex justify-between items-center">
                                      <span className="text-gray-700">{book.book_title}</span>
                                      <span className="font-semibold text-purple-600">×{book.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-4 space-y-2">
                          <Button
                            className="w-full"
                            onClick={() => navigate('/province/receive-shipments')}
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            عرض في صفحة الاستلام
                          </Button>
                          {selectedNotification.shipment.status === 'delivered' && (
                            <Button
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={() => navigate('/province/receive-shipments')}
                            >
                              <CheckCircle className="w-4 h-4 ml-2" />
                              تأكيد الاستلام
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    الشحنات الأخيرة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {shipments.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">لا توجد شحنات</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {shipments.slice(0, 5).map((shipment) => (
                        <div
                          key={shipment.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-all"
                          onClick={() => navigate('/province/receive-shipments')}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono text-purple-600 font-semibold">
                              {shipment.tracking_code}
                            </span>
                            {getStatusBadge(shipment.status)}
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>من: {shipment.from_ministry_name || shipment.from_ministry?.name}</span>
                            </div>
                            {shipment.books && shipment.books.length > 0 && (
                              <div className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                <span>{shipment.books.length} كتاب - {shipment.books.reduce((sum, b) => sum + b.quantity, 0)} نسخة</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {shipments.length > 5 && (
                        <Button
                          variant="outline"
                          className="w-full"
                          size="sm"
                          onClick={() => navigate('/province/receive-shipments')}
                        >
                          عرض الكل ({shipments.length})
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
