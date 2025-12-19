import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Package, School, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import apiService from '../services/apiService';

interface DirectorateStats {
  name: string;
  total_requests: number;
  distributed_books: number;
  total_schools: number;
  completion_rate: number;
  pending_requests: number;
  status: 'completed' | 'in_progress' | 'pending';
}

export default function ProvinceDirectoratesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch directorates from database
  const { data: directoratesData = [], isLoading } = useQuery({
    queryKey: ['directorates'],
    queryFn: () => apiService.getDirectorates(),
  });

  // Fetch school requests to calculate statistics
  const { data: schoolRequests = [] } = useQuery({
    queryKey: ['school-requests-all'],
    queryFn: () => apiService.getSchoolRequests({}),
  });

  // Calculate statistics for each directorate
  const calculateDirectorateStats = () => {
    return directoratesData.map((dir: any) => {
      // Get schools in this directorate
      const dirSchoolRequests = schoolRequests.filter((req: any) => 
        req.school_directorate === dir.id || req.school_directorate_name === dir.name
      );

      const total_requests = dirSchoolRequests.length;
      const pending_requests = dirSchoolRequests.filter((req: any) => 
        req.status === 'pending' || req.status === 'under_review'
      ).length;
      
      const distributed_books = dirSchoolRequests
        .filter((req: any) => req.status === 'approved' || req.status === 'completed')
        .reduce((sum, req) => sum + (req.total_quantity || 0), 0);

      const completion_rate = total_requests > 0 
        ? Math.round(((total_requests - pending_requests) / total_requests) * 100)
        : 0;
      
      let status: 'completed' | 'in_progress' | 'pending' = 'in_progress';
      if (completion_rate === 100) {
        status = 'completed';
      } else if (completion_rate < 50) {
        status = 'pending';
      }

      return {
        name: dir.name,
        total_schools: dir.schools_count || 0,
        total_requests,
        distributed_books,
        pending_requests,
        completion_rate,
        status,
      } as DirectorateStats;
    }).sort((a, b) => b.completion_rate - a.completion_rate);
  };

  const directorates = calculateDirectorateStats();

  const filteredDirectorates = directorates.filter((dir) =>
    dir.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            مكتمل
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            جاري التوزيع
          </span>
        );
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            قيد الانتظار
          </span>
        );
      default:
        return null;
    }
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-600';
    if (rate >= 70) return 'bg-blue-600';
    if (rate >= 50) return 'bg-yellow-600';
    return 'bg-orange-600';
  };

  // Calculate summary statistics
  const totalSchools = directorates.reduce((sum, dir) => sum + dir.total_schools, 0);
  const totalRequests = directorates.reduce((sum, dir) => sum + dir.total_requests, 0);
  const totalDistributed = directorates.reduce((sum, dir) => sum + dir.distributed_books, 0);
  const totalPending = directorates.reduce((sum, dir) => sum + dir.pending_requests, 0);
  const avgCompletion = directorates.length > 0
    ? Math.round(directorates.reduce((sum, dir) => sum + dir.completion_rate, 0) / directorates.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">بيانات المديريات</h1>
                <p className="text-sm text-gray-600 mt-1">إحصائيات ومتابعة توزيع الكتب حسب المديريات</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                المديريات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{directorates.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <School className="w-4 h-4" />
                عدد المدارس
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalSchools}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Package className="w-4 h-4" />
                الكتب الموزعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalDistributed.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                الطلبات المعلقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{totalPending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                متوسط الإنجاز
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{avgCompletion}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="ابحث عن مديرية..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Directorates Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
            ) : filteredDirectorates.length === 0 ? (
              <div className="p-8 text-center text-gray-500">لا توجد بيانات</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-600 text-white">
                    <tr>
                      <th className="px-6 py-3 text-right text-sm font-semibold">المديرية</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold">عدد الطلبات</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold">الكتب الموزعة</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold">عدد المدارس</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold">نسبة الإنجاز</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold">الطلبات المعلقة</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredDirectorates.map((directorate, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-right">
                          <div className="font-medium text-gray-900">{directorate.name}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-gray-900">{directorate.total_requests}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-gray-900 font-semibold">
                            {directorate.distributed_books.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-orange-600 font-semibold">{directorate.total_schools}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getProgressColor(directorate.completion_rate)}`}
                                style={{ width: `${directorate.completion_rate}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 min-w-[3rem]">
                              {directorate.completion_rate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-gray-900">{directorate.pending_requests}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(directorate.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
