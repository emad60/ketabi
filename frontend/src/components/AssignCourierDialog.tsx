import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Loader2, User, Truck } from 'lucide-react';
import api from '../services/api';

interface Courier {
  id: number;
  username: string;
  full_name: string;
  role: string;
  province?: string;
}

interface Shipment {
  id: number;
  tracking_code: string;
  status: string;
  courier_role?: string;
  assigned_courier?: { id: number; full_name: string; };
}

interface AssignCourierDialogProps {
  open: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  onAssigned?: () => void;
}

export function AssignCourierDialog({ 
  open, 
  onClose, 
  shipment,
  onAssigned 
}: AssignCourierDialogProps) {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (open && shipment) {
      fetchCouriers();
    }
  }, [open, shipment]);

  const fetchCouriers = async () => {
    try {
      setLoading(true);
      
      // Determine courier type based on shipment
      let courierRole = 'ministry_driver';
      if (shipment?.courier_role === 'province_courier') {
        courierRole = 'province_driver';
      }
      
      // Fetch available couriers
      const response = await api.get('/users/users/', {
        params: {
          role: courierRole
        }
      });
      
      const courierData = response.data.results || response.data;
      setCouriers(Array.isArray(courierData) ? courierData : []);
    } catch (error) {
      console.error('Error fetching couriers:', error);
      alert('حدث خطأ في تحميل المناديب');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedCourier || !shipment) return;

    try {
      setAssigning(true);
      
      await api.patch(`/warehouses/shipments/${shipment.id}/`, {
        assigned_courier: parseInt(selectedCourier),
        status: 'assigned'
      });

      alert('✅ تم إسناد الشحنة للمندوب بنجاح!');
      
      if (onAssigned) {
        onAssigned();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error assigning courier:', error);
      const errorMsg = error.response?.data?.detail || 'حدث خطأ أثناء الإسناد';
      alert(`❌ ${errorMsg}`);
    } finally {
      setAssigning(false);
    }
  };

  if (!shipment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2 text-xl">
            <Truck className="h-5 w-5" />
            إسناد شحنة للمندوب
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Shipment Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">رقم الشحنة:</span>
              <span className="font-semibold">{shipment.tracking_code}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">الحالة الحالية:</span>
              <span className="font-semibold">
                {shipment.status === 'pending' ? 'قيد الانتظار' : 
                 shipment.status === 'assigned' ? 'مسندة' : shipment.status}
              </span>
            </div>
            {shipment.assigned_courier && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">المندوب الحالي:</span>
                <span className="font-semibold text-blue-600">
                  {shipment.assigned_courier.full_name}
                </span>
              </div>
            )}
          </div>

          {/* Courier Selection */}
          <div className="space-y-2">
            <Label htmlFor="courier" className="text-right block">
              اختر المندوب
            </Label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="mr-2 text-sm text-gray-600">جاري تحميل المناديب...</span>
              </div>
            ) : couriers.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-600">
                <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                لا يوجد مناديب متاحين
              </div>
            ) : (
              <Select value={selectedCourier} onValueChange={setSelectedCourier}>
                <SelectTrigger className="w-full text-right">
                  <SelectValue placeholder="اختر مندوب..." />
                </SelectTrigger>
                <SelectContent>
                  {couriers.map((courier) => (
                    <SelectItem key={courier.id} value={courier.id.toString()}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{courier.full_name}</span>
                        <span className="text-xs text-gray-500">
                          ({courier.role === 'ministry_driver' ? 'مندوب وزارة' : 'مندوب محافظة'})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 text-right">
              ⚠️ سيتم تغيير حالة الشحنة إلى "مسندة" تلقائياً عند الإسناد
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={assigning}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedCourier || assigning || couriers.length === 0}
          >
            {assigning ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإسناد...
              </>
            ) : (
              'إسناد الشحنة'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
