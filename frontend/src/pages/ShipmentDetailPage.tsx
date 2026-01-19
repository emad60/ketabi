import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ShipmentDetailsDialog } from '../components/ShipmentDetailsDialog';
import apiService from '../services/apiService';

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        setLoading(true);
        if (!id) return setError('Invalid shipment id');
        // Get shipment type from URL query params if present
        const shipmentType = searchParams.get('type');
        const data = await apiService.getShipment(parseInt(id, 10), shipmentType || undefined);
        setShipment(data);
      } catch (err: any) {
        console.error('Error fetching shipment:', err);
        setError('لم يتم العثور على الشحنة');
      } finally {
        setLoading(false);
      }
    };
    fetchShipment();
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>جاري تحميل تفاصيل الشحنة...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => navigate(-1)}>العودة</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Render the dialog in open mode as a full page */}
      <ShipmentDetailsDialog open={true} onClose={() => navigate(-1)} shipment={shipment} />
    </div>
  );
}
