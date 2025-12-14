import { useState } from 'react';
import DashboardTopNav from '../components/DashboardTopNav';
import { ProvinceWarehouseManagementPage } from '../components/ProvinceWarehouseManagementPage';

export function ProvinceWarehousesPage() {
  const [activeTab, setActiveTab] = useState('warehouses');

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <DashboardTopNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        role="province"
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProvinceWarehouseManagementPage />
      </main>
    </div>
  );
}
