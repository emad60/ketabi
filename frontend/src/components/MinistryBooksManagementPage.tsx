import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
import { Plus, Edit, Trash2, BookOpen, Search, Filter } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import bookService from '../services/bookService';

interface Book {
  id: number;
  title: string;
  subject: string;
  subject_code: string;
  grade: string;
  grade_level: string;
  term: number;
  edition?: string;
  total_quantity: number;
  available_quantity: number;
}

export function MinistryBooksManagementPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    term: '1',
    grade_level: '',
    total_quantity: '',
    edition: '',
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = await bookService.getBooks();
      console.log('Fetched books from API:', data);
      
      // Map backend data to frontend format
      const mapped = (data || []).map((b: any) => ({
        id: b.id,
        title: b.subject_display 
          ? `${b.subject_display} - ${b.grade_display} - ${b.term_display}` 
          : `كتاب ${b.subject} - الصف ${b.grade_level}`,
        subject: b.subject_display || b.subject,
        subject_code: b.subject,
        grade: b.grade_display || `الصف ${b.grade_level}`,
        grade_level: b.grade_level,
        term: b.term,
        edition: b.edition || '-',
        total_quantity: b.total_quantity || 0,
        available_quantity: b.available_quantity || 0,
      }));
      setBooks(mapped);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (book?: Book) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        subject: book.subject_code,
        term: book.term?.toString() || '1',
        grade_level: book.grade_level,
        total_quantity: book.total_quantity?.toString() || '',
        edition: book.edition || '',
      });
    } else {
      setEditingBook(null);
      setFormData({
        subject: '',
        term: '1',
        grade_level: '',
        total_quantity: '',
        edition: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const payload: any = {
        subject: formData.subject,
        grade_level: formData.grade_level,
        term: parseInt(formData.term),
        edition: formData.edition || '',
        year: currentYear,
        total_quantity: parseInt(formData.total_quantity) || 0,
      };

      console.log('Sending payload:', payload);

      if (editingBook) {
        await bookService.updateBook(editingBook.id, payload);
        alert('تم تحديث الكتاب بنجاح');
      } else {
        await bookService.createBook(payload);
        alert('تم إضافة الكتاب بنجاح');
      }

      setIsDialogOpen(false);
      await fetchBooks();
    } catch (error: any) {
      console.error('Error saving book:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMsg = 'حدث خطأ أثناء حفظ الكتاب';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle unique constraint error
        if (errorData.non_field_errors) {
          errorMsg = 'هذا الكتاب موجود بالفعل بنفس المادة والصف والفصل والطبعة والسنة.\nيرجى تغيير أحد هذه القيم أو تحديث الكتاب الموجود.';
        } 
        // Handle field-specific errors
        else if (typeof errorData === 'object') {
          const errors = Object.entries(errorData)
            .map(([field, messages]: [string, any]) => {
              const fieldName = {
                subject: 'المادة',
                grade_level: 'الصف',
                term: 'الفصل الدراسي',
                edition: 'الطبعة',
                year: 'السنة',
                total_quantity: 'الكمية'
              }[field] || field;
              return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
            })
            .join('\n');
          errorMsg = `أخطاء في البيانات:\n${errors}`;
        }
      }
      
      alert(errorMsg);
    }
  };

  const handleDelete = async (bookId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكتاب؟')) return;
    
    try {
      await bookService.deleteBook(bookId);
      alert('تم حذف الكتاب بنجاح');
      await fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('حدث خطأ أثناء حذف الكتاب');
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = (book.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (book.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === 'all' || book.grade === filterGrade;
    const matchesSubject = filterSubject === 'all' || book.subject === filterSubject;
    return matchesSearch && matchesGrade && matchesSubject;
  });

  const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const gradeLabels: {[key: string]: string} = {
    '1': 'الأول',
    '2': 'الثاني',
    '3': 'الثالث',
    '4': 'الرابع',
    '5': 'الخامس',
    '6': 'السادس',
    '7': 'السابع',
    '8': 'الثامن',
    '9': 'التاسع',
    '10': 'الأول الثانوي',
    '11': 'الثاني الثانوي',
    '12': 'الثالث الثانوي',
  };
  const subjects = [
    // المواد الأساسية
    { code: 'arabic', name: 'اللغة العربية' },
    { code: 'math', name: 'الرياضيات' },
    { code: 'science', name: 'العلوم' },
    { code: 'english', name: 'اللغة الإنجليزية' },
    { code: 'islamic', name: 'التربية الإسلامية' },
    { code: 'social', name: 'التربية الاجتماعية' },
    { code: 'history', name: 'التاريخ' },
    { code: 'geography', name: 'الجغرافيا' },
    { code: 'quran', name: 'القرآن الكريم' },
    { code: 'art', name: 'التربية الفنية' },
    { code: 'music', name: 'التربية الموسيقية' },
    { code: 'sports', name: 'التربية الرياضية' },
    { code: 'computer', name: 'الحاسوب' },
    { code: 'handcraft', name: 'الأشغال اليدوية' },
    // مواد القسم العلمي
    { code: 'physics', name: 'الفيزياء (علمي)' },
    { code: 'chemistry', name: 'الكيمياء (علمي)' },
    { code: 'biology', name: 'الأحياء (علمي)' },
    { code: 'advanced_math', name: 'الرياضيات المتقدمة (علمي)' },
    // مواد القسم الأدبي
    { code: 'philosophy', name: 'الفلسفة والمنطق (أدبي)' },
    { code: 'psychology', name: 'علم النفس (أدبي)' },
    { code: 'sociology', name: 'علم الاجتماع (أدبي)' },
    { code: 'arabic_literature', name: 'الأدب العربي (أدبي)' },
    { code: 'economics', name: 'الاقتصاد (أدبي)' },
  ];
  const terms = [
    { value: '1', label: 'الفصل الأول' },
    { value: '2', label: 'الفصل الثاني' },
  ];

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
          <h2 className="text-2xl font-bold text-gray-900">إدارة الكتب</h2>
          <p className="text-sm text-gray-600 mt-1">إضافة وتعديل وحذف الكتب المدرسية</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleOpenDialog()}>
              <Plus className="ml-2 w-4 h-4" />
              إضافة كتاب جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingBook ? 'تعديل كتاب' : 'إضافة كتاب جديد'}</DialogTitle>
              <DialogDescription>
                أدخل معلومات الكتاب المدرسي
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <Label htmlFor="subject">المادة *</Label>
                <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.code} value={subject.code}>{subject.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="term">الفصل الدراسي *</Label>
                <Select value={formData.term} onValueChange={(value) => setFormData({ ...formData, term: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفصل" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="grade_level">الصف *</Label>
                <Select value={formData.grade_level} onValueChange={(value) => setFormData({ ...formData, grade_level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>{gradeLabels[grade]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="total_quantity">الكمية *</Label>
                <Input
                  id="total_quantity"
                  type="number"
                  value={formData.total_quantity}
                  onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                  placeholder="مثال: 100"
                  min="0"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="edition">الطبعة *</Label>
                <Input
                  id="edition"
                  value={formData.edition}
                  onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                  placeholder="مثال: 2025"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSubmit}
                disabled={!formData.subject || !formData.grade_level || !formData.total_quantity || !formData.edition}
              >
                {editingBook ? 'حفظ التعديلات' : 'إضافة الكتاب'}
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
                <p className="text-sm text-gray-600 mb-2">إجمالي الكتب</p>
                <p className="text-3xl font-bold">{books.length}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">إجمالي الكمية</p>
                <p className="text-3xl font-bold">
                  {books.reduce((sum, book) => sum + book.total_quantity, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">متوفر</p>
                <p className="text-3xl font-bold">
                  {books.reduce((sum, book) => sum + book.available_quantity, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">مُوزَّع</p>
                <p className="text-3xl font-bold">
                  {books.reduce((sum, book) => sum + (book.total_quantity - book.available_quantity), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="بحث عن كتاب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger>
                <SelectValue placeholder="تصفية حسب الصف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الصفوف</SelectItem>
                {grades.map((grade) => (
                  <SelectItem key={grade} value={gradeLabels[grade]}>{gradeLabels[grade]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger>
                <SelectValue placeholder="تصفية حسب المادة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المواد</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.code} value={subject.code}>{subject.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Books Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الكتب ({filteredBooks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">العنوان</TableHead>
                <TableHead className="text-right">الصف</TableHead>
                <TableHead className="text-right">المادة</TableHead>
                <TableHead className="text-right">الطبعة</TableHead>
                <TableHead className="text-right">إجمالي الكمية</TableHead>
                <TableHead className="text-right">متوفر</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBooks.map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.grade}</TableCell>
                  <TableCell>{book.subject}</TableCell>
                  <TableCell className="text-sm text-gray-600">{book.edition}</TableCell>
                  <TableCell>{book.total_quantity.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm ${
                      book.available_quantity > book.total_quantity * 0.3
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {book.available_quantity.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(book)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(book.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
