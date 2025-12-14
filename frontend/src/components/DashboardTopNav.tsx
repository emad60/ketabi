import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import apiService from '../services/apiService';
import { LogOut, Home, FileText, Building2, TruckIcon, Users, BookOpen, BarChart3, Package } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

type Props = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  role?: 'province' | 'ministry';
};

export default function DashboardTopNav({ activeTab, onTabChange, role = 'province' }: Props) {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiService.getNotifications({ page_size: 5 });
      return Array.isArray(res) ? res : (res.results || res);
    },
    staleTime: 1000 * 30,
  });

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.read).length : 0;

  const handleNotifClick = async (notif: any) => {
    // mark notifications read locally then navigate
    try {
      if (!notif.read) {
        await apiService.markNotificationAsRead(notif.id);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    } catch (err) {
      // ignore
    }
    // try parse shipment id from message
    const match = (notif.message || '').match(/#(\d+)/);
    if (match) {
      navigate(`/shipments/${match[1]}`);
    } else {
      // open notifications page
      navigate('/notifications');
    }
    setShowNotifications(false);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const basePath = role === 'province' ? '/province' : '/ministry';

  const links = role === 'ministry' 
    ? [
        { key: 'overview', label: 'لوحة التحكم', icon: Home, to: `${basePath}/dashboard` },
        { key: 'provinces', label: 'إدارة المحافظات', icon: Building2, to: `${basePath}/provinces` },
        { key: 'province-requests', label: 'طلبات المحافظات', icon: FileText, to: `${basePath}/province-requests` },
        { key: 'shipments', label: 'إدارة الشحنات', icon: TruckIcon, to: `${basePath}/shipments` },
        { key: 'warehouses', label: 'المستودعات', icon: Package, to: `${basePath}/warehouses` },
        { key: 'couriers', label: 'المناديب', icon: Users, to: `${basePath}/couriers` },
        { key: 'reports', label: 'التقارير', icon: BarChart3, to: `${basePath}/reports` },
      ]
    : [
        { key: 'overview', label: 'لوحة التحكم', icon: Home, to: `${basePath}/dashboard` },
        { key: 'school-requests', label: 'طلبات المدارس', icon: FileText, to: `${basePath}/school-requests` },
        { key: 'track-shipments', label: 'تتبع الشحنات', icon: TruckIcon, to: `${basePath}/track-shipments` },
        { key: 'warehouses', label: 'المستودعات', icon: Package, to: `${basePath}/warehouses` },
        { key: 'couriers', label: 'المناديب', icon: Users, to: `${basePath}/couriers` },
        { key: 'reports', label: 'التقارير', icon: BarChart3, to: `${basePath}/reports` },
        { key: 'create-request', label: 'إنشاء طلب', icon: FileText, to: `${basePath}/create-request` },
      ];

  return (
    <div className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] shadow-md" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2 rounded-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="text-white">
            <h1 className="text-lg font-bold">{role === 'ministry' ? 'وزارة التربية والتعليم' : (user?.province_name || 'إدارة المحافظة')}</h1>
            <p className="text-sm opacity-90">نظام إدارة توزيع الكتب المدرسية</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right text-white">
            <p className="font-semibold">{user?.full_name}</p>
            <p className="text-sm opacity-90">{user?.role || ''}</p>
          </div>
            <div className="relative">
              <button
                className="relative mr-3"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="الإشعارات"
              >
                <Bell className="w-6 h-6 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{unreadCount}</span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute z-50 right-0 mt-2 w-80 bg-white rounded shadow-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <strong>الإشعارات</strong>
                    <button className="text-xs text-gray-500" onClick={() => navigate('/notifications')}>عرض الكل</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="text-sm text-gray-600">لا توجد إشعارات</div>
                    ) : (
                      notifications.map((n: any) => (
                        <div key={n.id} className={`p-2 rounded ${n.read ? 'bg-white' : 'bg-blue-50'}`}>
                          <button className="w-full text-right" onClick={() => handleNotifClick(n)}>
                            <div className="text-sm">{n.message}</div>
                            <div className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</div>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleLogout} 
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 font-semibold"
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
        </div>
      </div>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-3 overflow-x-auto">
            {links.map((l) => {
              const Icon = l.icon as any;
              const active = activeTab === l.key || window.location.pathname.includes(l.to.replace(basePath, ''));
              return (
                <button
                  key={l.key}
                  onClick={() => { onTabChange(l.key); navigate(l.to); }}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-medium transition-all ${
                    active ? 'text-purple-600 bg-purple-50 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span>{l.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
