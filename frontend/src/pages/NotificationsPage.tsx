import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiService.getNotifications({ page_size: 100 });
      return Array.isArray(res) ? res : (res.results || res);
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => apiService.markNotificationAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: async () => apiService.markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleOpenNotification = (notif: any) => {
    // mark read then navigate to related entity if possible
    if (!notif.read) {
      markReadMutation.mutate(notif.id);
    }

    // Try to parse shipment id from message like "#123"
    const match = (notif.message || '').match(/#(\d+)/);
    if (match) {
      const id = match[1];
      navigate(`/shipments/${id}`);
      return;
    }

    // fallback: stay on page
  };

  return (
    <div className="max-w-5xl mx-auto py-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>الإشعارات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Label>الإشعارات الواردة</Label>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isLoading}>
                تحديد الكل كمقروء
              </Button>
            </div>
          </div>

          {isLoading ? (
            <p className="text-gray-600">جاري التحميل...</p>
          ) : notifications.length === 0 ? (
            <p className="text-gray-600">لا توجد إشعارات</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n: any) => (
                <div key={n.id} className={`p-3 rounded-lg border ${n.read ? 'bg-white' : 'bg-blue-50 border-blue-100'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm">{n.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenNotification(n)}>
                        فتح
                      </Button>
                      {!n.read && (
                        <Button size="sm" variant="secondary" onClick={() => markReadMutation.mutate(n.id)}>
                          وضع كمقروء
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
