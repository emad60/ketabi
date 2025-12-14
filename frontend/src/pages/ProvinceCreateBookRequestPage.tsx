import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import bookService from '../services/bookService';
import { apiService } from '../services/apiService';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/select';

// نموذج إنشاء طلب كتب من المحافظة للوزارة
export default function ProvinceCreateBookRequestPage() {
  // بيانات النموذج
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [books, setBooks] = useState<Array<{book_id: number, book_title: string, quantity: number}>>([]);
  const [bookOptions, setBookOptions] = useState<Array<{id:number,title:string, grade_level?:string, subject?:string}>>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [bookQty, setBookQty] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // اسم المحافظة (جلبه من بيانات المستخدم إن وُجد)
  const provinceName = user?.province || 'أمانة العاصمة صنعاء';

  useEffect(()=>{
    (async ()=>{
      try{
        const data = await bookService.getBooks();
        setBookOptions(Array.isArray(data) ? data.map(b=>({id: b.id, title: b.title, grade_level: b.grade_level, subject: b.subject})) : []);
      }catch(err){
        console.error('Failed to load books:', err);
        setBookOptions([]);
      }
    })();
  },[]);

  // قوائم المواد والصفوف والفصول
  const SUBJECTS = [
    'رياضيات',
    'لغة عربية',
    'لغة إنجليزية',
    'علوم',
    'دراسات اجتماعية',
    'تربية إسلامية',
    'حاسوب',
    'تربية فنية',
    'تربية رياضية',
  ];

  const GRADES = [
    'الصف الأول',
    'الصف الثاني',
    'الصف الثالث',
    'الصف الرابع',
    'الصف الخامس',
    'الصف السادس',
    'الصف السابع',
    'الصف الثامن',
    'الصف التاسع',
  ];

  const TERMS = [
    { value: 'first', label: 'الفصل الدراسي الأول' },
    { value: 'second', label: 'الفصل الدراسي الثاني' },
  ];

  // إضافة كتاب
  const handleAddBook = () => {
    // If a concrete book is selected, use it
    if (selectedBookId) {
      if (!bookQty || bookQty <= 0) return;
      const opt = bookOptions.find(b=>b.id===selectedBookId);
      const title = opt ? opt.title : `كتاب ${selectedBookId}`;
      setBooks([...books, { book_id: selectedBookId, book_title: title, quantity: bookQty }]);
      setSelectedBookId(null);
      setBookQty(0);
      return;
    }

    // Otherwise, require subject+grade+term+quantity
    if (!selectedSubject || !selectedGrade || !selectedTerm) {
      alert('اختر المادة والصف والفصل قبل الإضافة');
      return;
    }
    if (!bookQty || bookQty <= 0) return;

    // Create item without book_id; backend will try to match by subject/grade
    const label = `${selectedSubject} — ${selectedGrade} — ${TERMS.find(t=>t.value===selectedTerm)?.label || ''}`;
    setBooks([...books, { book_id: 0, book_title: label, quantity: bookQty, subject: selectedSubject, grade: selectedGrade, term: selectedTerm } as any]);
    // reset
    setSelectedSubject('');
    setSelectedGrade('');
    setSelectedTerm('');
    setBookQty(0);
  };

  // حذف كتاب
  const handleRemoveBook = (idx: number) => {
    setBooks(books.filter((_, i) => i !== idx));
  };

  // إرسال الطلب
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (books.length === 0) return alert('أضف كتاب واحد على الأقل');
    setSubmitting(true);
    try{
      const payload: any = {
        notes: (reason ? reason + '\n' : '') + (notes || ''),
        items: books.map((b: any) => {
          if (b.book_id && b.book_id !== 0) {
            return { book: b.book_id, quantity: b.quantity };
          }
          // item created by subject/grade/term
          return { subject: b.subject, grade: b.grade, term: b.term, quantity: b.quantity };
        })
      };

      const res = await apiService.createProvinceRequest(payload);
      // بعد النجاح، انتقل إلى صفحة الطلبات أو اعرض رسالة
      alert('تم إرسال طلب المحافظة إلى الوزارة بنجاح');
      navigate('/province/book-requests');
    }catch(err:any){
      console.error('Failed to create province request:', err);
      alert('فشل في إرسال الطلب: ' + (err.response?.data?.detail || err.message || JSON.stringify(err)));
    }finally{
      setSubmitting(false);
    }
  };

  return (
    <div style={{maxWidth: 650, margin: '0 auto', padding: 24}}>
      <h2 style={{fontWeight:'bold', fontSize:22, marginBottom: 8}}>إنشاء طلب كتب جديد</h2>
      <div style={{color:'#888', marginBottom:24, fontSize:15}}>أدخل معلومات الكتب المطلوبة من الوزارة</div>
      <form onSubmit={handleSubmit} style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 8px #0001', padding:24}}>
        <div style={{display:'flex', gap:16, marginBottom:16}}>
          <div style={{flex:1}}>
            <label style={{fontSize:14, color:'#555'}}>تاريخ الطلب</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} required style={{width:'100%',padding:8,marginTop:4,border:'1px solid #ddd',borderRadius:6}} />
          </div>
          <div style={{flex:1}}>
            <label style={{fontSize:14, color:'#555'}}>الجهة الطالبة</label>
            <input type="text" value={provinceName} disabled style={{width:'100%',padding:8,marginTop:4,border:'1px solid #eee',background:'#f7f7f7',borderRadius:6}} />
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:14, color:'#555'}}>سبب الطلب</label>
          <input type="text" value={reason} onChange={e=>setReason(e.target.value)} placeholder="أدخل سبب الطلب (مثال: نقص في المخزون، زيادة أعداد الطلاب، إلخ)" required style={{width:'100%',padding:8,marginTop:4,border:'1px solid #ddd',borderRadius:6}} />
        </div>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:14, color:'#555', display:'block', marginBottom:8}}>الكتب المطلوبة</label>
          <div style={{display:'flex', gap:8, marginBottom:8}}>
            <div style={{flex:1}}>
              <label style={{fontSize:13, color:'#555', display:'block', marginBottom:6}}>المادة</label>
              <Select value={selectedSubject} onValueChange={(val:any)=>setSelectedSubject(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div style={{flex:1}}>
              <label style={{fontSize:13, color:'#555', display:'block', marginBottom:6}}>الصف</label>
              <Select value={selectedGrade} onValueChange={(val:any)=>setSelectedGrade(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div style={{flex:1}}>
              <label style={{fontSize:13, color:'#555', display:'block', marginBottom:6}}>الفصل</label>
              <Select value={selectedTerm} onValueChange={(val:any)=>setSelectedTerm(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفصل" />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div style={{flex:1}}>
              <label style={{fontSize:13, color:'#555', display:'block', marginBottom:6}}>الكمية</label>
              <input type="number" min={1} value={bookQty || ''} onChange={e=>setBookQty(Number(e.target.value))} placeholder="الكمية" style={{width:'100%',padding:8,border:'1px solid #ddd',borderRadius:6}} />
            </div>
            <div style={{display:'flex',alignItems:'flex-end'}}>
              <button type="button" onClick={handleAddBook} style={{background:'#8b5cf6',color:'#fff',border:'none',borderRadius:6,padding:'8px 12px',fontWeight:'bold',fontSize:18,cursor:'pointer'}}>+</button>
            </div>
          </div>
          {books.length === 0 && <div style={{background:'#f9f9f9',padding:12,borderRadius:6,color:'#888',fontSize:14}}>لم يتم إضافة أي كتب بعد. انقر على "إضافة كتاب" للبدء</div>}
          {books.length > 0 && (
            <table style={{width:'100%',marginTop:8,borderCollapse:'collapse',fontSize:15}}>
              <thead>
                <tr style={{background:'#f3f3f3'}}>
                  <th style={{padding:6,border:'1px solid #eee'}}>اسم الكتاب</th>
                  <th style={{padding:6,border:'1px solid #eee'}}>الكمية</th>
                  <th style={{padding:6,border:'1px solid #eee'}}>إزالة</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b, i) => (
                      <tr key={i}>
                        <td style={{padding:6,border:'1px solid #eee'}}>{b.book_title}</td>
                        <td style={{padding:6,border:'1px solid #eee',textAlign:'center'}}>{b.quantity}</td>
                        <td style={{padding:6,border:'1px solid #eee',textAlign:'center'}}>
                          <button type="button" onClick={()=>handleRemoveBook(i)} style={{color:'#f43f5e',background:'none',border:'none',fontSize:18,cursor:'pointer'}}>×</button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:14, color:'#555'}}>ملاحظات إضافية</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="أي ملاحظات أو تفاصيل إضافية (اختياري)" style={{width:'100%',padding:8,marginTop:4,border:'1px solid #ddd',borderRadius:6,minHeight:48}} />
        </div>
        <div style={{display:'flex',gap:8,background:'#f6f8ff',padding:12,borderRadius:8,marginBottom:20,fontWeight:'bold',fontSize:15}}>
          <div style={{flex:1}}>إجمالي الكتب المطلوبة <span style={{color:'#8b5cf6'}}>{books.reduce((a,b)=>a+b.quantity,0)}</span> كتاب</div>
          <div style={{flex:1}}>عدد الأصناف <span style={{color:'#8b5cf6'}}>{books.length}</span> صنف</div>
        </div>
        <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
          <button type="button" onClick={()=>window.history.back()} style={{background:'#eee',color:'#444',border:'none',borderRadius:6,padding:'10px 28px',fontWeight:'bold',fontSize:16,cursor:'pointer'}}>إلغاء</button>
          <button type="submit" disabled={submitting || books.length===0} style={{background:'#8b5cf6',color:'#fff',border:'none',borderRadius:6,padding:'10px 28px',fontWeight:'bold',fontSize:16,cursor:'pointer',opacity:submitting||books.length===0?0.7:1}}>إرسال الطلب</button>
        </div>
      </form>
    </div>
  );
}
