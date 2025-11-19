import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionaries
const translations = {
  id: {
    // Header
    'header.home': 'BERANDA',
    'header.profile': 'PROFIL',
    'header.publicInfo': 'INFORMASI PUBLIK',
    'header.services': 'LAYANAN',
    'header.media': 'MEDIA',
    'header.links': 'TAUTAN',
    'header.contact': 'KONTAK KAMI',
    'header.emergency': 'Darurat',
    'header.hotline': 'Hotline 119',
    'header.covid': 'Info COVID-19',
    'header.search': 'Pencarian...',
    'header.ministry': 'Kementerian Kesehatan',
    'header.republic': 'Republik Indonesia',
    'header.tagline': 'Kemenkes Hebat, Indonesia Sehat',
    'header.sikmPortal': 'SIKM Portal',
    
    // Hero Section
    'hero.title1': 'Sehat Negeriku',
    'hero.title2': 'Sehat Bangsaku',
    'hero.subtitle1': 'Membangun Indonesia yang sehat, kuat, dan sejahtera melalui pelayanan kesehatan yang berkualitas dan merata untuk seluruh rakyat Indonesia.',
    'hero.title3': 'Transformasi Digital Kesehatan',
    'hero.subtitle2': 'Platform SatuSehat mengintegrasikan seluruh layanan kesehatan Indonesia dalam satu ekosistem digital yang aman dan terpercaya.',
    'hero.title4': 'Bersama Wujudkan Indonesia Sehat',
    'hero.subtitle3': 'Komitmen nyata Kementerian Kesehatan dalam memberikan akses kesehatan yang adil dan berkualitas bagi semua lapisan masyarakat.',
    'hero.cta.services': 'Jelajahi Layanan',
    'hero.cta.emergency': 'Layanan Darurat',
    'hero.cta.more': 'Pelajari Lebih Lanjut',
    
    // Services Section
    'services.title': 'Layanan Unggulan',
    'services.subtitle': 'Akses mudah dan cepat ke berbagai layanan kesehatan digital untuk mendukung kesehatan masyarakat Indonesia',
    'services.badge': 'LAYANAN KEMENTERIAN KESEHATAN',
    'services.quickAccess': 'Akses Cepat',
    'services.learnMore': 'Pelajari Lebih Lanjut',
    'services.emergency': 'Darurat',
    'services.digitalTransformation': 'TRANSFORMASI DIGITAL',
    'services.digitalPlatforms': 'Platform Digital Terdepan',
    'services.digitalDesc': 'Kementerian Kesehatan menghadirkan berbagai platform digital untuk memudahkan akses layanan kesehatan bagi seluruh rakyat Indonesia.',
    'services.exploreAll': 'Jelajahi Semua Platform',
    'services.healthAchievements': 'Pencapaian Kesehatan Indonesia',
    'services.users': 'pengguna',
    
    // Service Items
    'services.platform.title': 'Platform SatuSehat',
    'services.platform.desc': 'Sistem informações kesehatan terintegrasi untuk memudahkan akses layanan kesehatan di seluruh Indonesia.',
    'services.platform.features.1': 'Rekam Medis Digital',
    'services.platform.features.2': 'Telemedicine',
    'services.platform.features.3': 'Booking Online',
    'services.platform.badge': 'PRIORITAS',
    
    'services.disease.title': 'Penanggulangan Penyakit',
    'services.disease.desc': 'Program komprehensif pencegahan dan pengendalian penyakit menular dan tidak menular.',
    'services.disease.features.1': 'Vaksinasi Massal',
    'services.disease.features.2': 'Surveilans Epidemiologi',
    'services.disease.features.3': 'Contact Tracing',
    'services.disease.badge': 'PENTING',
    
    'services.pharmacy.title': 'Farmasi dan Alat Kesehatan',
    'services.pharmacy.desc': 'Pengawasan dan distribusi obat-obatan serta alat kesehatan untuk menjamin kualitas dan keamanan.',
    'services.pharmacy.features.1': 'Registrasi Obat',
    'services.pharmacy.features.2': 'Inspeksi Farmasi',
    'services.pharmacy.features.3': 'Standar Alkes',
    'services.pharmacy.badge': 'REGULASI',
    
    'services.policy.title': 'Kebijakan Kesehatan',
    'services.policy.desc': 'Perumusan dan implementasi kebijakan kesehatan nasional untuk mewujudkan Indonesia sehat.',
    'services.policy.features.1': 'Analisis Kebijakan',
    'services.policy.features.2': 'Evaluasi Program',
    'services.policy.features.3': 'Koordinasi Lintas Sektor',
    'services.policy.badge': 'STRATEGIS',
    
    'services.crisis.title': 'Pantauan Kejadian Krisis Kesehatan',
    'services.crisis.desc': 'Sistem monitoring dan respons cepat untuk menangani krisis kesehatan dan bencana.',
    'services.crisis.features.1': 'Alert System',
    'services.crisis.features.2': 'Emergency Response',
    'services.crisis.features.3': 'Crisis Management',
    'services.crisis.badge': 'SIAGA',
    
    // Quick Services
    'services.quick.appointment': 'Buat Janji Temu',
    'services.quick.appointmentDesc': 'Booking online Puskesmas & RS',
    'services.quick.labResults': 'Cek Hasil Lab',
    'services.quick.labResultsDesc': 'Akses hasil pemeriksaan',
    'services.quick.consultation': 'Konsultasi Online',
    'services.quick.consultationDesc': 'Telehealth 24/7',
    'services.quick.location': 'Lokasi Faskes',
    'services.quick.locationDesc': 'Cari fasilitas terdekat',
    'services.quick.immunization': 'Status Imunisasi',
    'services.quick.immunizationDesc': 'Cek riwayat vaksin',
    'services.quick.emergencyService': 'Layanan Darurat',
    'services.quick.emergencyServiceDesc': 'Hotline 119',
    
    // Digital Services
    'services.digital.sikm': 'SIKM (Sistem Informasi Kesehatan Masyarakat)',
    'services.digital.sikmDesc': 'Portal terintegrasi untuk layanan kesehatan digital',
    'services.digital.epuskesmas': 'E-Puskesmas',
    'services.digital.epuskesmasDesc': 'Sistem manajemen Puskesmas berbasis digital',
    'services.digital.pedulilindungi': 'Aplikasi PeduliLindungi',
    'services.digital.pedulilindungiDesc': 'Tracing dan monitoring kesehatan masyarakat',
    
    // Statistics
    'services.stats.life': 'Angka Harapan Hidup',
    'services.stats.lifeValue': '71.6 tahun',
    'services.stats.lifeDesc': 'Meningkat dari tahun sebelumnya',
    'services.stats.coverage': 'Cakupan JKN-KIS',
    'services.stats.coverageValue': '234 juta',
    'services.stats.coverageDesc': 'Warga terlindungi jaminan kesehatan',
    'services.stats.workers': 'Tenaga Kesehatan',
    'services.stats.workersValue': '1.2 juta',
    'services.stats.workersDesc': 'Dokter, perawat, dan tenaga kesehatan lainnya',
    'services.stats.stunting': 'Program Stunting',
    'services.stats.stuntingValue': '21.6%',
    'services.stats.stuntingDesc': 'Penurunan prevalensi stunting balita',
    
    // News Section
    'news.title': 'Berita Terbaru',
    'news.viewAll': 'Lihat Semua Berita',
    'news.readMore': 'Baca Selengkapnya',
    
    // Footer
    'footer.ministry': 'Kementerian Kesehatan Republik Indonesia',
    'footer.address': 'Jl. HR. Rasuna Said Blok X5 Kav. 4-9, Kuningan, Jakarta Selatan 12950',
    'footer.tagline': 'Kemenkes Hebat, Indonesia Sehat',
    'footer.mission': 'Membangun Indonesia yang sehat, mandiri, dan berkeadilan melalui pelayanan kesehatan berkualitas untuk seluruh rakyat Indonesia.',
    'footer.hours': 'Senin - Jumat, 08:00 - 16:00 WIB',
    'footer.response': 'Respon 1x24 jam',
    'footer.aboutUs': 'Tentang Kami',
    'footer.featuredServices': 'Layanan Unggulan',
    'footer.priorityPrograms': 'Program Prioritas',
    'footer.digitalPlatforms': 'Platform Digital Kemenkes',
    'footer.emergencyContact': 'Kontak Darurat',
    'footer.followUs': 'Ikuti Kami',
    'footer.copyright': '© 2025 Kementerian Kesehatan Republik Indonesia',
    'footer.managedBy': 'Website ini dikelola oleh',
    'footer.dataCenter': 'Pusat Data dan Informasi',
    'footer.lastUpdated': 'Terakhir diperbarui: 19 Juni 2025 • Versi 2.1.0',
    
    // Footer Links
    'footer.profile': 'Profil Kemenkes',
    'footer.visionMission': 'Visi & Misi',
    'footer.organization': 'Struktur Organisasi',
    'footer.officials': 'Pejabat Eselon I',
    'footer.contactUs': 'Hubungi Kami',
    'footer.vaccineCert': 'Sertifikat Vaksin',
    'footer.bpjs': 'BPJS Kesehatan',
    'footer.onlineImmunization': 'Imunisasi Online',
    'footer.telemedicine': 'Telemedicine',
    'footer.healthyIndonesia': 'Indonesia Sehat',
    'footer.germas': 'GERMAS',
    'footer.stuntingPrevention': 'Stunting Prevention',
    'footer.p2ptm': 'Program P2PTM',
    'footer.mentalHealth': 'Kesehatan Mental',
    'footer.privacyPolicy': 'Kebijakan Privasi',
    'footer.terms': 'Syarat & Ketentuan',
    'footer.disclaimer': 'Disclaimer',
    'footer.sitemap': 'Sitemap',
    'footer.accessibility': 'Accessibility',
    'footer.popular': 'Populer',
    'footer.priority': 'Prioritas',
    'footer.new': 'Baru',
    'footer.active': 'Aktif',
    'footer.ongoing': 'Berlangsung',
    
    // Emergency Services
    'footer.emergency.health': 'Darurat Kesehatan',
    'footer.emergency.hours24': '24 Jam • Gratis',
    'footer.emergency.halo': 'Halo Kemkes',
    'footer.emergency.weekdays': 'Senin-Jumat • 08:00-16:00',
    'footer.emergency.complaint': 'Pengaduan',
    
    // Platform descriptions
    'footer.platform.sikm': 'Sistem Informasi Kesehatan Masyarakat',
    'footer.platform.epuskesmas': 'Manajemen Puskesmas Digital',
    'footer.platform.pedulilindungi': 'Contact Tracing & Health Status',
    
    // Common
    'common.language': 'Bahasa',
    'common.indonesian': 'Bahasa Indonesia',
    'common.english': 'English',
  },
  en: {
    // Header
    'header.home': 'HOME',
    'header.profile': 'PROFILE',
    'header.publicInfo': 'PUBLIC INFORMATION',
    'header.services': 'SERVICES',
    'header.media': 'MEDIA',
    'header.links': 'LINKS',
    'header.contact': 'CONTACT US',
    'header.emergency': 'Emergency',
    'header.hotline': 'Hotline 119',
    'header.covid': 'COVID-19 Info',
    'header.search': 'Search...',
    'header.ministry': 'Ministry of Health',
    'header.republic': 'Republic of Indonesia',
    'header.tagline': 'Excellent MoH, Healthy Indonesia',
    'header.sikmPortal': 'SIKM Portal',
    
    // Hero Section
    'hero.title1': 'Healthy Nation',
    'hero.title2': 'Healthy People',
    'hero.subtitle1': 'Building a healthy, strong, and prosperous Indonesia through quality and equitable healthcare services for all Indonesian people.',
    'hero.title3': 'Digital Health Transformation',
    'hero.subtitle2': 'SatuSehat Platform integrates all Indonesian healthcare services in one secure and trusted digital ecosystem.',
    'hero.title4': 'Together Realizing Healthy Indonesia',
    'hero.subtitle3': 'Ministry of Health\'s real commitment to providing fair and quality healthcare access for all levels of society.',
    'hero.cta.services': 'Explore Services',
    'hero.cta.emergency': 'Emergency Services',
    'hero.cta.more': 'Learn More',
    
    // Services Section
    'services.title': 'Featured Services',
    'services.subtitle': 'Easy and fast access to various digital health services to support Indonesian public health',
    'services.badge': 'MINISTRY OF HEALTH SERVICES',
    'services.quickAccess': 'Quick Access',
    'services.learnMore': 'Learn More',
    'services.emergency': 'Emergency',
    'services.digitalTransformation': 'DIGITAL TRANSFORMATION',
    'services.digitalPlatforms': 'Leading Digital Platforms',
    'services.digitalDesc': 'The Ministry of Health presents various digital platforms to facilitate healthcare access for all Indonesian people.',
    'services.exploreAll': 'Explore All Platforms',
    'services.healthAchievements': 'Indonesian Health Achievements',
    'services.users': 'users',
    
    // Service Items
    'services.platform.title': 'SatuSehat Platform',
    'services.platform.desc': 'Integrated health information system to facilitate healthcare service access throughout Indonesia.',
    'services.platform.features.1': 'Digital Medical Records',
    'services.platform.features.2': 'Telemedicine',
    'services.platform.features.3': 'Online Booking',
    'services.platform.badge': 'PRIORITY',
    
    'services.disease.title': 'Disease Prevention & Control',
    'services.disease.desc': 'Comprehensive program for prevention and control of communicable and non-communicable diseases.',
    'services.disease.features.1': 'Mass Vaccination',
    'services.disease.features.2': 'Epidemiological Surveillance',
    'services.disease.features.3': 'Contact Tracing',
    'services.disease.badge': 'IMPORTANT',
    
    'services.pharmacy.title': 'Pharmacy & Medical Devices',
    'services.pharmacy.desc': 'Supervision and distribution of medicines and medical devices to ensure quality and safety.',
    'services.pharmacy.features.1': 'Drug Registration',
    'services.pharmacy.features.2': 'Pharmacy Inspection',
    'services.pharmacy.features.3': 'Medical Device Standards',
    'services.pharmacy.badge': 'REGULATION',
    
    'services.policy.title': 'Health Policy',
    'services.policy.desc': 'Formulation and implementation of national health policies to realize healthy Indonesia.',
    'services.policy.features.1': 'Policy Analysis',
    'services.policy.features.2': 'Program Evaluation',
    'services.policy.features.3': 'Cross-Sector Coordination',
    'services.policy.badge': 'STRATEGIC',
    
    'services.crisis.title': 'Health Crisis Monitoring',
    'services.crisis.desc': 'Monitoring system and rapid response to handle health crises and disasters.',
    'services.crisis.features.1': 'Alert System',
    'services.crisis.features.2': 'Emergency Response',
    'services.crisis.features.3': 'Crisis Management',
    'services.crisis.badge': 'ALERT',
    
    // Quick Services
    'services.quick.appointment': 'Make Appointment',
    'services.quick.appointmentDesc': 'Online booking for Clinics & Hospitals',
    'services.quick.labResults': 'Check Lab Results',
    'services.quick.labResultsDesc': 'Access examination results',
    'services.quick.consultation': 'Online Consultation',
    'services.quick.consultationDesc': 'Telehealth 24/7',
    'services.quick.location': 'Healthcare Facilities',
    'services.quick.locationDesc': 'Find nearest facilities',
    'services.quick.immunization': 'Immunization Status',
    'services.quick.immunizationDesc': 'Check vaccination history',
    'services.quick.emergencyService': 'Emergency Service',
    'services.quick.emergencyServiceDesc': 'Hotline 119',
    
    // Digital Services
    'services.digital.sikm': 'SIKM (Public Health Information System)',
    'services.digital.sikmDesc': 'Integrated portal for digital health services',
    'services.digital.epuskesmas': 'E-Puskesmas',
    'services.digital.epuskesmasDesc': 'Digital-based community health center management system',
    'services.digital.pedulilindungi': 'PeduliLindungi Application',
    'services.digital.pedulilindungiDesc': 'Public health tracing and monitoring',
    
    // Statistics
    'services.stats.life': 'Life Expectancy',
    'services.stats.lifeValue': '71.6 years',
    'services.stats.lifeDesc': 'Increased from previous year',
    'services.stats.coverage': 'JKN-KIS Coverage',
    'services.stats.coverageValue': '234 million',
    'services.stats.coverageDesc': 'Citizens protected by health insurance',
    'services.stats.workers': 'Health Workers',
    'services.stats.workersValue': '1.2 million',
    'services.stats.workersDesc': 'Doctors, nurses, and other health workers',
    'services.stats.stunting': 'Stunting Program',
    'services.stats.stuntingValue': '21.6%',
    'services.stats.stuntingDesc': 'Decrease in child stunting prevalence',
    
    // News Section
    'news.title': 'Latest News',
    'news.viewAll': 'View All News',
    'news.readMore': 'Read More',
    
    // Footer
    'footer.ministry': 'Ministry of Health Republic of Indonesia',
    'footer.address': 'Jl. HR. Rasuna Said Block X5 Kav. 4-9, Kuningan, South Jakarta 12950',
    'footer.tagline': 'Excellent MoH, Healthy Indonesia',
    'footer.mission': 'Building a healthy, independent, and just Indonesia through quality healthcare services for all Indonesian people.',
    'footer.hours': 'Monday - Friday, 08:00 - 16:00 WIB',
    'footer.response': 'Response within 24 hours',
    'footer.aboutUs': 'About Us',
    'footer.featuredServices': 'Featured Services',
    'footer.priorityPrograms': 'Priority Programs',
    'footer.digitalPlatforms': 'MoH Digital Platforms',
    'footer.emergencyContact': 'Emergency Contact',
    'footer.followUs': 'Follow Us',
    'footer.copyright': '© 2025 Ministry of Health Republic of Indonesia',
    'footer.managedBy': 'This website is managed by',
    'footer.dataCenter': 'Data and Information Center',
    'footer.lastUpdated': 'Last updated: June 19, 2025 • Version 2.1.0',
    
    // Footer Links
    'footer.profile': 'MoH Profile',
    'footer.visionMission': 'Vision & Mission',
    'footer.organization': 'Organizational Structure',
    'footer.officials': 'Echelon I Officials',
    'footer.contactUs': 'Contact Us',
    'footer.vaccineCert': 'Vaccine Certificate',
    'footer.bpjs': 'BPJS Health',
    'footer.onlineImmunization': 'Online Immunization',
    'footer.telemedicine': 'Telemedicine',
    'footer.healthyIndonesia': 'Healthy Indonesia',
    'footer.germas': 'GERMAS',
    'footer.stuntingPrevention': 'Stunting Prevention',
    'footer.p2ptm': 'P2PTM Program',
    'footer.mentalHealth': 'Mental Health',
    'footer.privacyPolicy': 'Privacy Policy',
    'footer.terms': 'Terms & Conditions',
    'footer.disclaimer': 'Disclaimer',
    'footer.sitemap': 'Sitemap',
    'footer.accessibility': 'Accessibility',
    'footer.popular': 'Popular',
    'footer.priority': 'Priority',
    'footer.new': 'New',
    'footer.active': 'Active',
    'footer.ongoing': 'Ongoing',
    
    // Emergency Services
    'footer.emergency.health': 'Health Emergency',
    'footer.emergency.hours24': '24 Hours • Free',
    'footer.emergency.halo': 'Halo Kemkes',
    'footer.emergency.weekdays': 'Monday-Friday • 08:00-16:00',
    'footer.emergency.complaint': 'Complaint',
    
    // Platform descriptions
    'footer.platform.sikm': 'Public Health Information System',
    'footer.platform.epuskesmas': 'Digital Community Health Center Management',
    'footer.platform.pedulilindungi': 'Contact Tracing & Health Status',
    
    // Common
    'common.language': 'Language',
    'common.indonesian': 'Bahasa Indonesia',
    'common.english': 'English',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('id');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('kemenkes-language') as Language;
    if (savedLanguage && (savedLanguage === 'id' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('kemenkes-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}