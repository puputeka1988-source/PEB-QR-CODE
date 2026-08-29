import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Student, AttendanceRecord, AppSettings, TabType, ToastNotification, AttendanceStatus, TeachingJournal, ThemeMode, ThemeAccent, ThemeFont, ThemeFontSize, AcademicYear, ClassGradeSheet, TeachingScheduleItem, Announcement } from '../types';
import { INITIAL_STUDENTS, generateSampleAttendance, INITIAL_ACADEMIC_YEARS, INITIAL_TEACHING_SCHEDULES, INITIAL_ANNOUNCEMENTS } from '../utils/sampleData';
import { audioFeedback } from '../utils/audio';
import { cleanDateFormat, cleanTimeFormat, sortStudents, formatIndonesianDayAndDate, getCurrentDateInTimezone, getCurrentTimeInTimezone, formatTimeWithTimezone, getTimezoneIana } from '../utils/formatters';
import { 
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  safeFirestoreWrite, executeChunkedBatch, OperationType, handleFirestoreError 
} from '../lib/firestoreWriter';
import { 
  FullBackupPayload, createBackupPayload, downloadBackupJson, 
  saveAutoSnapshot, getAutoSnapshot 
} from '../utils/backupRestore';

const generateId = () => 'id-' + Math.random().toString(36).substring(2, 9);
const getTodayString = (tz?: 'WIB' | 'WITA' | 'WIT' | string) => getCurrentDateInTimezone(tz);

export const getGradeSheetDocId = (kelas: string, semester: string, tahunAjaran: string): string => {
  const raw = `grades_${kelas}_${semester}_${tahunAjaran}`;
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_');
};

function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const clean: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      clean[key] = obj[key];
    }
  });
  return clean;
}

function deepSanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitizeForFirestore(item)) as any;
  }
  const clean: any = {};
  Object.keys(obj as any).forEach(key => {
    const val = (obj as any)[key];
    if (val !== undefined) {
      clean[key] = typeof val === 'object' && val !== null ? deepSanitizeForFirestore(val) : val;
    }
  });
  return clean;
}

interface AppContextType {
  today: string;
  students: Student[];
  attendance: AttendanceRecord[];
  journals: TeachingJournal[];
  academicYears: AcademicYear[];
  activeAcademicYear: AcademicYear | undefined;
  settings: AppSettings;
  gradeSheets: ClassGradeSheet[];
  getGradeSheet: (kelas: string, semester: string, tahunAjaran: string) => ClassGradeSheet | undefined;
  saveGradeSheet: (sheet: ClassGradeSheet) => Promise<{ success: boolean; message: string }>;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  activeSubTabs: Record<TabType, string>;
  getActiveSubTab: (tab: TabType) => string;
  setActiveSubTab: (tab: TabType, subTab: string) => void;
  navigateToSubTab: (tab: TabType, subTab: string) => void;
  cameraModalOpen: boolean;
  setCameraModalOpen: (open: boolean) => void;
  filterDate: string;
  setFilterDate: (date: string) => void;
  toast: ToastNotification | null;
  showToast: (message: string, type?: ToastNotification['type']) => void;
  markAttendanceByNisn: (
    nisn: string,
    method?: 'QR Code' | 'Manual',
    forceStatus?: AttendanceStatus,
    note?: string,
    customTime?: string,
    customDate?: string,
    allowOverwrite?: boolean
  ) => { success: boolean; isDuplicate?: boolean; message: string; student?: Student; record?: AttendanceRecord };
  resetAttendanceByNisnAndDate: (nisn: string, customDate?: string) => { success: boolean; message: string };
  addStudent: (newStudent: Omit<Student, 'id'>) => Student;
  addStudentsBulk: (newStudents: Omit<Student, 'id'>[]) => number;
  updateStudent: (id: string, updated: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  deleteStudentsBulk: (ids: string[]) => void;
  deleteAttendance: (id: string) => void;
  clearAttendanceForClassAndDate: (targetDate: string, targetKelas: string) => { count: number; success: boolean };
  updateAttendanceStatus: (id: string, newStatus: AttendanceStatus, note?: string) => void;
  editAttendanceRecord: (id: string, updatedFields: Partial<AttendanceRecord>) => void;
  addJournal: (newJournal: Omit<TeachingJournal, 'id'>) => TeachingJournal;
  updateJournal: (id: string, updatedFields: Partial<TeachingJournal>) => void;
  deleteJournal: (id: string) => void;
  syncJournalAttendanceForClassAndDate: (targetDate: string, targetKelas: string, customAtt?: AttendanceRecord[], customStudents?: Student[]) => boolean;
  syncAllJournalsWithAttendance: () => number;
  teachingSchedules: TeachingScheduleItem[];
  addTeachingSchedule: (item: Omit<TeachingScheduleItem, 'id'>) => TeachingScheduleItem;
  updateTeachingSchedule: (id: string, updatedFields: Partial<TeachingScheduleItem>) => void;
  deleteTeachingSchedule: (id: string) => void;
  resetTeachingSchedules: () => void;
  addAcademicYear: (year: Omit<AcademicYear, 'id' | 'createdAt'>) => AcademicYear;
  updateAcademicYear: (id: string, updatedFields: Partial<AcademicYear>) => void;
  deleteAcademicYear: (id: string) => void;
  setActiveAcademicYear: (id: string) => void;
  toggleArchiveAcademicYear: (id: string) => void;
  targetJournalClass: string | null;
  setTargetJournalClass: (cls: string | null) => void;
  openJournalForClass: (className: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeAccent: (accent: ThemeAccent) => void;
  setThemeFont: (font: ThemeFont) => void;
  setThemeFontSize: (size: ThemeFontSize) => void;
  effectiveTheme: 'dark' | 'light';
  resetToSampleData: () => void;
  syncRecordToSheets: (record: AttendanceRecord) => Promise<boolean>;
  syncStudentsToSheets: (students: Student[]) => Promise<boolean>;
  syncSettingsToSheets: (settings: AppSettings) => Promise<boolean>;
  pullDataFromSheets: (showNotification?: boolean) => Promise<boolean>;
  isPullingFromSheets: boolean;
  selectedStudentForCard: Student | null;
  setSelectedStudentForCard: (student: Student | null) => void;
  isLoggedIn: boolean;
  login: (u: string, p: string) => boolean | { requires2FA: boolean };
  verify2FA: (pin?: string, isBiometricSuccess?: boolean) => boolean;
  cancel2FA: () => void;
  is2FAPending: boolean;
  logout: () => void;
  // Announcements and Broadcasts
  announcements: Announcement[];
  addAnnouncement: (item: Omit<Announcement, 'id' | 'createdAt' | 'date' | 'time'> & { date?: string; time?: string }) => Announcement;
  updateAnnouncement: (id: string, updatedFields: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  markAnnouncementAsRead: (announcementId: string, readerKey: string, readerName?: string, readerClass?: string, role?: 'student' | 'admin' | 'teacher') => void;
  getUnreadAnnouncementsForStudent: (student: Student) => Announcement[];
  // Student Portal Auth & State
  loggedInStudent: Student | null;
  isStudentLoggedIn: boolean;
  studentLogin: (nisn: string, pinOrBirthDate?: string) => { success: boolean; message: string; student?: Student };
  studentLogout: () => void;
  updateStudentProfile: (studentId: string, profileData: Partial<Student>) => Promise<boolean>;
  resetStudentPin: (studentId: string, customPin?: string) => { success: boolean; pin: string };
  // Kiosk Mode & Fullscreen Lobby State
  isKioskMode: boolean;
  setIsKioskMode: (val: boolean) => void;
  // Backup & Restore 1-Klik Engine
  exportBackupJson: () => void;
  restoreFullBackup: (payload: FullBackupPayload, mode: 'overwrite' | 'merge') => Promise<{ success: boolean; message: string }>;
  autoSnapshot: FullBackupPayload | null;
  refreshAutoSnapshot: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
  instansiProvinsi: 'PEMERINTAH DAERAH PROVINSI',
  instansiKabupaten: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
  sekolah: 'SMA Negeri 1 Kita',
  npsn: '20261988',
  alamat: 'Jl. Pendidikan No. 45, Kota Edukasi',
  logoKiriUrl: '',
  logoKananUrl: '',
  logoUrl: '',
  jamMasuk: '07:00',
  jamTerlambat: '07:15',
  timezone: 'WIB',
  spreadsheetUrl: '',
  enableSound: true,
  adminUsername: 'admin',
  adminPassword: 'admin123',
  namaGuru: 'Ahmad Subagja, S.Kom',
  nip: '19880512 201503 1 004',
  mataPelajaran: 'Informatika & Pemrograman',
  jabatan: 'Guru Mata Pelajaran & Admin Presensi',
  guruPhone: '081234567890',
  guruPhotoUrl: '',
  guruBio: 'Pengampu mata pelajaran Informatika dan pengelola sistem presensi QR sekolah.',
  ttdGuruUrl: '',
  namaKepalaSekolah: 'Drs. H. Ahmad Dahlan, M.Pd',
  nipKepalaSekolah: '19700101 199503 1 001',
  jabatanKepalaSekolah: 'Kepala Sekolah',
  ttdKepalaSekolahUrl: '',
  kotaTandaTangan: 'Bula',
  semester: '1 (Ganjil)',
  tahunAjaran: '2025/2026',
  themeMode: 'dark',
  themeAccent: 'emerald'
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [today, setToday] = useState<string>(getTodayString);

  // Otomatis memperbarui 'today' dan 'filterDate' ketika tanggal berganti (contoh: tengah malam atau ketika tab dibuka kembali)
  useEffect(() => {
    const checkDateRollover = () => {
      const currentRealToday = getTodayString(settings?.timezone);
      setToday(prevToday => {
        if (prevToday !== currentRealToday) {
          setFilterDate(prevFilterDate => {
            // Jika tanggal filter pengguna sebelumnya adalah tanggal hari sebelumnya, otomatis perbarui ke hari ini yang baru
            if (prevFilterDate === prevToday || !prevFilterDate) {
              return currentRealToday;
            }
            return prevFilterDate;
          });
          return currentRealToday;
        }
        return prevToday;
      });
    };

    // Cek setiap 5 detik
    const intervalId = setInterval(checkDateRollover, 5000);

    // Cek setiap kali tab/jendela kembali fokus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkDateRollover();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkDateRollover);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkDateRollover);
    };
  }, []);

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('qr_presensi_students');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(s => s && s.class !== 'X IPA 1' && s.id !== 'std-001' && s.id !== 'std-002' && s.nisn !== '0051234001' && s.nisn !== '0051234002');
          return sortStudents(cleaned);
        }
      }
    } catch (e) {
      console.error('Failed to parse students from localStorage:', e);
    }
    return sortStudents(INITIAL_STUDENTS);
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('qr_presensi_attendance');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(a => a && a.class !== 'X IPA 1' && a.nisn !== '0051234001' && a.nisn !== '0051234002' && a.studentId !== 'std-001' && a.studentId !== 'std-002');
        }
      }
    } catch (e) {
      console.error('Failed to parse attendance from localStorage:', e);
    }
    return generateSampleAttendance(INITIAL_STUDENTS, today);
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('qr_presensi_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to parse settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [journals, setJournals] = useState<TeachingJournal[]>(() => {
    try {
      const saved = localStorage.getItem('qr_presensi_journals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(j => j.kelas === 'X IPA 1' ? { ...j, kelas: 'X IPA 2' } : j);
        }
      }
    } catch (e) {
      console.error('Failed to parse journals from localStorage:', e);
    }
    return [
      {
        id: 'jrn-1',
        date: today,
        day: 'Selasa',
        kelas: 'X IPA 2',
        mapel: 'Matematika',
        materi: 'Persamaan & Pertidaksamaan Nilai Mutlak',
        metode: 'Diskusi Kelompok & Latihan Soal',
        siswaTidakHadirNama: 'Budi Santoso (Sakit)',
        siswaTidakHadirKet: 'S: 1',
        siswaTidakHadirJml: 1,
        totalSiswa: 32,
        paraf: 'Paraf',
        catatan: 'Siswa dapat memahami konsep dasar dengan baik dan aktif berdiskusi.',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(() => {
    try {
      const saved = localStorage.getItem('qr_presensi_academic_years');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse academicYears from localStorage:', e);
    }
    return INITIAL_ACADEMIC_YEARS;
  });

  const [gradeSheets, setGradeSheets] = useState<ClassGradeSheet[]>(() => {
    try {
      const saved = localStorage.getItem('qr_presensi_grade_sheets_all');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse gradeSheets from localStorage:', e);
    }
    return [];
  });

  const [teachingSchedules, setTeachingSchedules] = useState<TeachingScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem('qr_presensi_teaching_schedules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse teachingSchedules from localStorage:', e);
    }
    return INITIAL_TEACHING_SCHEDULES;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem('qr_presensi_announcements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse announcements from localStorage:', e);
    }
    return INITIAL_ANNOUNCEMENTS;
  });

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const saved = localStorage.getItem('qr_presensi_active_tab') as TabType;
      const validTabs: TabType[] = ['Dashboard', 'Siswa', 'Kartu QR', 'Riwayat', 'Pengumuman', 'Jadwal Mengajar', 'Jurnal Mengajar', 'Penilaian Harian', 'Pengaturan'];
      if (saved && validTabs.includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.error('Failed to parse activeTab from localStorage:', e);
    }
    return 'Dashboard';
  });

  const DEFAULT_SUB_TABS: Record<TabType, string> = {
    'Dashboard': 'ringkasan',
    'Siswa': 'daftar',
    'Kartu QR': 'cetak-massal',
    'Riwayat': 'log-presensi',
    'Pengumuman': 'daftar-pengumuman',
    'Jadwal Mengajar': 'jadwal-hari-ini',
    'Jurnal Mengajar': 'daftar-jurnal',
    'Penilaian Harian': 'input-nilai',
    'Pengaturan': 'profil-sekolah',
  };

  const [activeSubTabs, setActiveSubTabs] = useState<Record<TabType, string>>(() => {
    try {
      const saved = localStorage.getItem('qr_presensi_active_subtabs');
      if (saved) {
        return { ...DEFAULT_SUB_TABS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse activeSubTabs:', e);
    }
    return DEFAULT_SUB_TABS;
  });

  const getActiveSubTab = useCallback((tab: TabType): string => {
    return activeSubTabs[tab] || DEFAULT_SUB_TABS[tab] || '';
  }, [activeSubTabs]);

  const setActiveSubTab = useCallback((tab: TabType, subTab: string) => {
    setActiveSubTabs(prev => {
      const next = { ...prev, [tab]: subTab };
      try {
        localStorage.setItem('qr_presensi_active_subtabs', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const navigateToSubTab = useCallback((tab: TabType, subTab: string) => {
    setActiveTab(tab);
    setActiveSubTabs(prev => {
      const next = { ...prev, [tab]: subTab };
      try {
        localStorage.setItem('qr_presensi_active_subtabs', JSON.stringify(next));
        localStorage.setItem('qr_presensi_active_tab', tab);
      } catch (e) {}
      return next;
    });
  }, []);

  const [cameraModalOpen, setCameraModalOpen] = useState<boolean>(false);
  const [isKioskMode, setIsKioskMode] = useState<boolean>(false);
  const [filterDate, setFilterDate] = useState<string>(today);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);
  const [targetJournalClass, setTargetJournalClass] = useState<string | null>(null);
  const [autoSnapshot, setAutoSnapshot] = useState<FullBackupPayload | null>(() => getAutoSnapshot());

  const refreshAutoSnapshot = useCallback(() => {
    setAutoSnapshot(getAutoSnapshot());
  }, []);

  // Auto-snapshot debouncer: automatically saves a lightweight disaster-recovery snapshot to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      if (students.length > 0 || attendance.length > 0) {
        const payload = createBackupPayload(students, attendance, journals, academicYears, settings);
        saveAutoSnapshot(payload);
        setAutoSnapshot(payload);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [students, attendance, journals, academicYears, settings]);

  // System Dark Mode Detection
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const themeMode: ThemeMode = settings.themeMode || 'dark';
  const effectiveTheme: 'dark' | 'light' = themeMode === 'system' ? (systemIsDark ? 'dark' : 'light') : themeMode;
  const themeAccent: ThemeAccent = settings.themeAccent || 'emerald';
  const themeFont: ThemeFont = settings.themeFont || 'plus-jakarta';
  const themeFontSize: ThemeFontSize = settings.themeFontSize || 'normal';

  // Apply theme attributes and typography to document element and body
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-accent', themeAccent);
    root.setAttribute('data-font', themeFont);
    root.setAttribute('data-font-size', themeFontSize);

    if (document.body) {
      document.body.setAttribute('data-font', themeFont);
      document.body.setAttribute('data-font-size', themeFontSize);
    }

    if (effectiveTheme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
    }
  }, [effectiveTheme, themeAccent, themeFont, themeFontSize]);

  const openJournalForClass = useCallback((className: string) => {
    setTargetJournalClass(className);
    navigateToSubTab('Jurnal Mengajar', 'isi-jurnal');
  }, [navigateToSubTab]);

  // Sync to LocalStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('qr_presensi_students', JSON.stringify(students));
    } catch (e) {
      console.error('Failed to save students to localStorage:', e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem('qr_presensi_attendance', JSON.stringify(attendance));
    } catch (e) {
      console.error('Failed to save attendance to localStorage:', e);
    }
  }, [attendance]);

  useEffect(() => {
    try {
      localStorage.setItem('qr_presensi_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('qr_presensi_active_tab', activeTab);
    } catch (e) {
      console.error('Failed to save activeTab to localStorage:', e);
    }
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('qr_presensi_journals', JSON.stringify(journals));
    } catch (e) {
      console.error('Failed to save journals to localStorage:', e);
    }
  }, [journals]);

  useEffect(() => {
    try {
      localStorage.setItem('qr_presensi_academic_years', JSON.stringify(academicYears));
    } catch (e) {
      console.error('Failed to save academicYears to localStorage:', e);
    }
  }, [academicYears]);

  useEffect(() => {
    try {
      localStorage.setItem('qr_presensi_grade_sheets_all', JSON.stringify(gradeSheets));
    } catch (e) {
      console.error('Failed to save gradeSheets to localStorage:', e);
    }
  }, [gradeSheets]);

  useEffect(() => {
    try {
      localStorage.setItem('qr_presensi_announcements', JSON.stringify(announcements));
    } catch (e) {
      console.error('Failed to save announcements to localStorage:', e);
    }
  }, [announcements]);

  // ---------------------------------------------------------------------------
  // FIREBASE FIRESTORE REAL-TIME SYNCHRONIZATION LISTENERS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // 1. Students Real-time Listener
    const unsubStudents = onSnapshot(collection(db, 'students'), snapshot => {
      if (!snapshot.empty) {
        const loaded: Student[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        const cleaned = loaded.filter(s => s.class !== 'X IPA 1' && s.id !== 'std-001' && s.id !== 'std-002' && s.nisn !== '0051234001' && s.nisn !== '0051234002');
        setStudents(sortStudents(cleaned));
      }
    }, err => handleFirestoreError(err, OperationType.GET, 'students'));

    // 2. Attendance Real-time Listener
    const unsubAttendance = onSnapshot(collection(db, 'attendance'), snapshot => {
      if (!snapshot.empty) {
        const loaded: AttendanceRecord[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
        const cleaned = loaded.filter(a => a.class !== 'X IPA 1' && a.nisn !== '0051234001' && a.nisn !== '0051234002' && a.studentId !== 'std-001' && a.studentId !== 'std-002');
        cleaned.sort((a, b) => (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time));
        setAttendance(cleaned);
      }
    }, err => handleFirestoreError(err, OperationType.GET, 'attendance'));

    // 3. Teaching Journals Real-time Listener
    const unsubJournals = onSnapshot(collection(db, 'journals'), snapshot => {
      if (!snapshot.empty) {
        const loaded: TeachingJournal[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TeachingJournal));
        loaded.sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));
        setJournals(loaded);
      }
    }, err => handleFirestoreError(err, OperationType.GET, 'journals'));

    // 4. App Settings Real-time Listener
    const unsubSettings = onSnapshot(doc(db, 'settings', 'app_settings'), snapshot => {
      if (snapshot.exists()) {
        setSettings(prev => ({ ...prev, ...snapshot.data() }));
      }
    }, err => handleFirestoreError(err, OperationType.GET, 'settings/app_settings'));

    // 5. Academic Years Real-time Listener
    const unsubAcademicYears = onSnapshot(collection(db, 'academic_years'), snapshot => {
      if (!snapshot.empty) {
        const loaded: AcademicYear[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AcademicYear));
        loaded.sort((a, b) => b.name.localeCompare(a.name));
        setAcademicYears(loaded);
      }
    }, err => handleFirestoreError(err, OperationType.GET, 'academic_years'));

    // 6. GradeSheets Real-time Listener (Penilaian Harian Siswa Multi-Perangkat)
    const unsubGradeSheets = onSnapshot(collection(db, 'gradeSheets'), snapshot => {
      if (!snapshot.empty) {
        const loaded: ClassGradeSheet[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClassGradeSheet));
        setGradeSheets(loaded);
        try {
          localStorage.setItem('qr_presensi_grade_sheets_all', JSON.stringify(loaded));
          loaded.forEach(sheet => {
            if (sheet.id) {
              localStorage.setItem(sheet.id, JSON.stringify(sheet));
            }
            if (sheet.kelas && sheet.semester && sheet.tahunAjaran) {
              const legacyKey = `qr_presensi_grades_${sheet.kelas}_${sheet.semester}_${sheet.tahunAjaran.replace('/', '-')}`;
              localStorage.setItem(legacyKey, JSON.stringify(sheet));
              const docId = getGradeSheetDocId(sheet.kelas, sheet.semester, sheet.tahunAjaran);
              localStorage.setItem(docId, JSON.stringify(sheet));
            }
          });
        } catch (e) {
          console.warn('LocalStorage save error for gradeSheets:', e);
        }
      }
    }, err => handleFirestoreError(err, OperationType.GET, 'gradeSheets'));

    // 7. Teaching Schedules Real-time Listener
    const unsubSchedules = onSnapshot(collection(db, 'teaching_schedules'), snapshot => {
      const loaded: TeachingScheduleItem[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TeachingScheduleItem));
      if (loaded.length > 0) {
        loaded.sort((a, b) => (a.dayIndex - b.dayIndex) || a.startTime.localeCompare(b.startTime));
        setTeachingSchedules(loaded);
        try {
          localStorage.setItem('qr_presensi_teaching_schedules', JSON.stringify(loaded));
        } catch (e) {}
      } else {
        setTeachingSchedules([]);
        try {
          localStorage.setItem('qr_presensi_teaching_schedules', JSON.stringify([]));
        } catch (e) {}
      }
    }, err => handleFirestoreError(err, OperationType.GET, 'teaching_schedules'));

    // 8. Announcements & Broadcasts Real-time Listener
    const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), snapshot => {
      if (!snapshot.empty) {
        const loaded: Announcement[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
        loaded.sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));
        setAnnouncements(loaded);
        try {
          localStorage.setItem('qr_presensi_announcements', JSON.stringify(loaded));
        } catch (e) {}
      }
    }, err => handleFirestoreError(err, OperationType.GET, 'announcements'));

    return () => {
      unsubStudents();
      unsubAttendance();
      unsubJournals();
      unsubSettings();
      unsubAcademicYears();
      unsubGradeSheets();
      unsubSchedules();
      unsubAnnouncements();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('qr_presensi_active_tab', activeTab);
    } catch (e) {}
  }, [activeTab]);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      // Bersihkan auth yang tersimpan di localStorage agar tidak persisten saat browser ditutup
      localStorage.removeItem('qr_presensi_auth');
      
      // Sesi login hanya bertahan di sessionStorage (otomatis terhapus saat browser/tab ditutup)
      const sessionAuth = sessionStorage.getItem('qr_presensi_auth');
      return sessionAuth === 'true';
    } catch (e) {
      return false;
    }
  });

  const showToast = useCallback((message: string, type: ToastNotification['type'] = 'info') => {
    const newToast: ToastNotification = {
      id: generateId(),
      message,
      type,
      timestamp: Date.now()
    };
    setToast(newToast);

    if (settings.enableSound) {
      if (type === 'success') audioFeedback.playSuccess();
      else if (type === 'error') audioFeedback.playError();
      else if (type === 'warning') audioFeedback.playWarning();
    }

    setTimeout(() => {
      setToast(current => (current?.id === newToast.id ? null : current));
    }, 3800);
  }, [settings.enableSound]);

  const [is2FAPending, setIs2FAPending] = useState<boolean>(false);

  const login = useCallback((u: string, p: string): boolean | { requires2FA: boolean } => {
    const validUsername = settings.adminUsername || 'admin';
    const validPassword = settings.adminPassword || 'admin123';

    if (u.trim() === validUsername && p === validPassword) {
      // Check if 2-Step Verification is enabled
      if (settings.twoFactorEnabled) {
        setIs2FAPending(true);
        return { requires2FA: true };
      }

      setIsLoggedIn(true);
      setIs2FAPending(false);
      try {
        // Hapus dari localStorage dan simpan hanya di sessionStorage agar wajib login ulang setelah browser ditutup
        localStorage.removeItem('qr_presensi_auth');
        sessionStorage.setItem('qr_presensi_auth', 'true');
        localStorage.setItem('qr_presensi_active_tab', 'Dashboard');
      } catch (e) {}
      setActiveTab('Dashboard');
      setActiveSubTabs(prev => ({ ...prev, Dashboard: 'ringkasan' }));
      showToast('Login berhasil! Selamat datang Administrator.', 'success');
      return true;
    } else {
      showToast('Username atau password salah!', 'error');
      return false;
    }
  }, [settings.adminUsername, settings.adminPassword, settings.twoFactorEnabled, showToast]);

  const verify2FA = useCallback((pin?: string, isBiometricSuccess?: boolean): boolean => {
    if (!is2FAPending) return false;

    // Biometric success branch
    if (isBiometricSuccess) {
      setIsLoggedIn(true);
      setIs2FAPending(false);
      try {
        localStorage.removeItem('qr_presensi_auth');
        sessionStorage.setItem('qr_presensi_auth', 'true');
        localStorage.setItem('qr_presensi_active_tab', 'Dashboard');
      } catch (e) {}
      setActiveTab('Dashboard');
      setActiveSubTabs(prev => ({ ...prev, Dashboard: 'ringkasan' }));
      showToast('Verifikasi biometrik berhasil! Selamat datang.', 'success');
      return true;
    }

    // Security PIN branch
    const requiredPin = settings.securityPin || '123456';
    if (pin && pin === requiredPin) {
      setIsLoggedIn(true);
      setIs2FAPending(false);
      try {
        localStorage.removeItem('qr_presensi_auth');
        sessionStorage.setItem('qr_presensi_auth', 'true');
        localStorage.setItem('qr_presensi_active_tab', 'Dashboard');
      } catch (e) {}
      setActiveTab('Dashboard');
      setActiveSubTabs(prev => ({ ...prev, Dashboard: 'ringkasan' }));
      showToast('Verifikasi PIN Keamanan berhasil! Selamat datang.', 'success');
      return true;
    }

    showToast('PIN Keamanan yang dimasukkan salah!', 'error');
    return false;
  }, [is2FAPending, settings.securityPin, showToast]);

  const cancel2FA = useCallback(() => {
    setIs2FAPending(false);
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setIs2FAPending(false);
    try {
      localStorage.removeItem('qr_presensi_auth');
      sessionStorage.removeItem('qr_presensi_auth');
    } catch (e) {
      console.error('Failed to remove storage auth', e);
    }
    showToast('Anda telah berhasil logout.', 'info');
  }, [showToast]);

  // --- STUDENT PORTAL AUTH & SESSION STATE ---
  const [loggedInStudentId, setLoggedInStudentId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('qr_presensi_student_auth_id') || null;
    } catch (e) {
      return null;
    }
  });

  const loggedInStudent = useMemo<Student | null>(() => {
    if (!loggedInStudentId) return null;
    return students.find(s => s.id === loggedInStudentId || s.nisn === loggedInStudentId) || null;
  }, [loggedInStudentId, students]);

  const isStudentLoggedIn = Boolean(loggedInStudent);

  const studentLogin = useCallback((nisnInput: string, pinOrBirthDate?: string): { success: boolean; message: string; student?: Student } => {
    const cleanNisn = nisnInput.trim();
    if (!cleanNisn) {
      showToast('Harap masukkan NISN Anda.', 'warning');
      return { success: false, message: 'NISN tidak boleh kosong' };
    }

    const student = students.find(s => s.nisn === cleanNisn || s.id === cleanNisn);
    if (!student) {
      const msg = `Siswa dengan NISN "${cleanNisn}" tidak ditemukan dalam database sekolah.`;
      showToast(msg, 'error');
      return { success: false, message: msg };
    }

    // Jika siswa memiliki PIN tersimpan, verifikasi PIN
    if (student.studentPin && student.studentPin.trim() !== '') {
      const inputPin = pinOrBirthDate ? pinOrBirthDate.trim() : '';
      const cleanBirthDate = student.birthDate ? student.birthDate.replace(/[^0-9]/g, '') : '';
      if (inputPin !== student.studentPin.trim() && (cleanBirthDate ? inputPin !== cleanBirthDate : true)) {
        const msg = 'PIN Akun Siswa salah. Jika Anda lupa PIN, silakan hubungi Guru / Admin Sekolah untuk mereset PIN Anda.';
        showToast(msg, 'error');
        return { success: false, message: msg };
      }
    }

    setLoggedInStudentId(student.id);
    try {
      localStorage.setItem('qr_presensi_student_auth_id', student.id);
    } catch (e) {}

    showToast(`Selamat datang di Portal Siswa, ${student.name}!`, 'success');
    return { success: true, message: 'Login siswa berhasil', student };
  }, [students, showToast]);

  const studentLogout = useCallback(() => {
    setLoggedInStudentId(null);
    try {
      localStorage.removeItem('qr_presensi_student_auth_id');
      localStorage.removeItem('qr_presensi_student_active_tab');
      localStorage.removeItem('qr_presensi_student_schedule_subview');
      localStorage.removeItem('qr_presensi_student_schedule_day');
      localStorage.removeItem('qr_presensi_student_attendance_month');
      localStorage.removeItem('qr_presensi_student_attendance_status');
    } catch (e) {}
    showToast('Anda telah keluar dari Portal Siswa.', 'info');
  }, [showToast]);

  const [isPullingFromSheets, setIsPullingFromSheets] = useState<boolean>(false);

  const syncSettingsToSheets = useCallback(async (settingsToSync: AppSettings): Promise<boolean> => {
    if (!settingsToSync.spreadsheetUrl || !settingsToSync.spreadsheetUrl.trim().startsWith('http')) {
      return false;
    }
    try {
      await fetch(settingsToSync.spreadsheetUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'syncSettings',
          settings: settingsToSync
        })
      });
      return true;
    } catch (e) {
      console.error('Spreadsheet Settings Sync Error:', e);
      return false;
    }
  }, []);

  const syncStudentsToSheets = useCallback(async (studentsToSync: Student[]): Promise<boolean> => {
    if (!settings.spreadsheetUrl || !settings.spreadsheetUrl.trim().startsWith('http')) {
      return false;
    }
    try {
      await fetch(settings.spreadsheetUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'syncStudents',
          students: studentsToSync
        })
      });
      return true;
    } catch (e) {
      console.error('Spreadsheet Students Sync Error:', e);
      return false;
    }
  }, [settings.spreadsheetUrl]);

  const syncRecordToSheets = useCallback(async (record: AttendanceRecord): Promise<boolean> => {
    if (!settings.spreadsheetUrl || !settings.spreadsheetUrl.trim().startsWith('http')) {
      return false;
    }
    try {
      await fetch(settings.spreadsheetUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      return true;
    } catch (e) {
      console.error('Spreadsheet Sync Error:', e);
      return false;
    }
  }, [settings.spreadsheetUrl]);

  const pullDataFromSheets = useCallback(async (showNotification = false): Promise<boolean> => {
    if (!settings.spreadsheetUrl || !settings.spreadsheetUrl.trim().startsWith('http')) {
      if (showNotification) {
        showToast('URL Google Sheets Web App belum dikonfigurasi.', 'warning');
      }
      return false;
    }
    setIsPullingFromSheets(true);
    try {
      const res = await fetch(settings.spreadsheetUrl.trim(), { method: 'GET', redirect: 'follow' });
      if (!res.ok) {
        if (showNotification) showToast('Gagal terhubung ke Google Sheets API.', 'error');
        setIsPullingFromSheets(false);
        return false;
      }
      const json = await res.json();
      if (json.status === 'success') {
        let pulledStudentCount = 0;
        let pulledAttendanceCount = 0;
        let pulledSettingsCount = 0;

        // 1. Sync Data Siswa dari Google Sheets jika ada
        if (Array.isArray(json.students)) {
          setStudents(json.students);
          pulledStudentCount = json.students.length;
        }

        // 2. Sync Data Presensi dari Google Sheets jika ada
        if (Array.isArray(json.data)) {
          const studentList = Array.isArray(json.students) ? json.students : students;
          const map = new Map<string, AttendanceRecord>();

          json.data.forEach((item: any, idx: number) => {
            const cleanDate = cleanDateFormat(item.date || today);
            const cleanTime = cleanTimeFormat(item.time || '00:00:00');

            const cleanNisn = String(item.nisn || '').replace(/^'/, '').trim();
            const student = studentList.find((s: Student) => s.nisn === cleanNisn);

            // Format ID Presensi deterministik murni: NISN-Tanggal (Contoh: 20261001-2026-08-10)
            const recordId = (cleanNisn && cleanDate) ? `${cleanNisn}-${cleanDate}` : (item.id || `att-${idx}`);

            const record: AttendanceRecord = {
              id: recordId,
              studentId: student ? student.id : '',
              nisn: cleanNisn,
              studentName: item.studentName || (student ? student.name : 'Siswa'),
              class: item.class || (student ? student.class : '-'),
              date: cleanDate,
              time: cleanTime,
              status: (item.status as AttendanceStatus) || 'Hadir',
              method: (item.method as 'QR Code' | 'Manual') || 'QR Code',
              note: item.note || ''
            };

            // Map berdasarkan ID deterministik NISN-Tanggal untuk menghilangkan data ganda dari Spreadsheet
            map.set(recordId, record);
          });

          const updatedAttendance = Array.from(map.values());
          setAttendance(updatedAttendance);
          pulledAttendanceCount = updatedAttendance.length;

          // Auto update filterDate jika filterDate saat ini tidak memiliki data tapi ada data yang ditarik
          if (updatedAttendance.length > 0) {
            const datesAvailable = updatedAttendance.map(a => a.date);
            if (!datesAvailable.includes(filterDate)) {
              setFilterDate(datesAvailable[0]);
            }
          }
        }

        // 3. Sync Data Pengaturan & Logo dari Google Sheets jika ada
        if (json.settings && typeof json.settings === 'object' && Object.keys(json.settings).length > 0) {
          const rawPulled = { ...json.settings };
          if (rawPulled.jamMasuk) {
            rawPulled.jamMasuk = cleanTimeFormat(rawPulled.jamMasuk).slice(0, 5) || '07:00';
          }
          if (rawPulled.jamTerlambat) {
            rawPulled.jamTerlambat = cleanTimeFormat(rawPulled.jamTerlambat).slice(0, 5) || '07:15';
          }
          if (typeof rawPulled.enableSound === 'string') {
            rawPulled.enableSound = rawPulled.enableSound === 'true';
          }

          setSettings(prev => {
            const merged = { ...prev };
            (Object.keys(rawPulled) as (keyof AppSettings)[]).forEach(k => {
              const val = rawPulled[k];
              if (k === 'spreadsheetUrl') {
                if (typeof val === 'string' && val.trim().startsWith('http')) {
                  merged.spreadsheetUrl = val.trim();
                }
              } else if (val !== undefined && val !== null && val !== '') {
                (merged as any)[k] = val;
              }
            });

            try {
              localStorage.setItem('qr_presensi_settings', JSON.stringify(merged));
            } catch (e) {
              console.error('Failed to save pulled settings to localStorage:', e);
            }
            return merged;
          });
          pulledSettingsCount = Object.keys(json.settings).length;
        }

        if (showNotification) {
          showToast(`Berhasil menyinkronkan data dari Google Sheets (${pulledStudentCount} Siswa, ${pulledAttendanceCount} Presensi, ${pulledSettingsCount > 0 ? 'Pengaturan & Logo' : 'Default Pengaturan'}).`, 'success');
        }
        setIsPullingFromSheets(false);
        return true;
      } else if (showNotification) {
        showToast(json.message || 'Respons dari Google Sheets tidak valid.', 'error');
      }
    } catch (e) {
      console.error('Fetch from Sheets error:', e);
      if (showNotification) showToast('Terjadi kesalahan saat mengambil data dari Google Sheets.', 'error');
    }
    setIsPullingFromSheets(false);
    return false;
  }, [settings.spreadsheetUrl, students, today, showToast]);

  // Auto pull data from Sheets when app initializes
  useEffect(() => {
    if (settings.spreadsheetUrl && settings.spreadsheetUrl.trim().startsWith('http')) {
      pullDataFromSheets(false);
    }
  }, [settings.spreadsheetUrl]);

  const deleteRecordFromSheets = useCallback(async (record: AttendanceRecord): Promise<boolean> => {
    if (!settings.spreadsheetUrl || !settings.spreadsheetUrl.trim().startsWith('http')) {
      return false;
    }
    try {
      await fetch(settings.spreadsheetUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id: record.id,
          nisn: record.nisn,
          studentName: record.studentName,
          date: record.date
        })
      });
      return true;
    } catch (e) {
      console.error('Spreadsheet Delete Error:', e);
      return false;
    }
  }, [settings.spreadsheetUrl]);

  const deleteStudentFromSheets = useCallback(async (student: Student): Promise<boolean> => {
    if (!settings.spreadsheetUrl || !settings.spreadsheetUrl.trim().startsWith('http')) {
      return false;
    }
    try {
      await fetch(settings.spreadsheetUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteStudent',
          studentId: student.id,
          nisn: student.nisn,
          studentName: student.name
        })
      });
      return true;
    } catch (e) {
      console.error('Spreadsheet Delete Student Error:', e);
      return false;
    }
  }, [settings.spreadsheetUrl]);

  const computeAbsenceForClassAndDate = useCallback((
    targetDate: string,
    targetKelas: string,
    currentAttendance: AttendanceRecord[] = attendance,
    currentStudents: Student[] = students
  ) => {
    if (!targetKelas || !targetDate) return null;
    const cleanDate = cleanDateFormat(targetDate);
    const cleanClass = targetKelas.trim().toLowerCase();
    
    const classStudents = currentStudents.filter(s => s.class && s.class.trim().toLowerCase() === cleanClass);
    const totalClassCount = classStudents.length || 30;

    const dateLogs = currentAttendance.filter(a => {
      const aDate = cleanDateFormat(a.date);
      if (aDate !== cleanDate) return false;
      const matchClass = a.class && a.class.trim().toLowerCase() === cleanClass;
      const matchStudent = classStudents.some(s => s.id === a.studentId || (s.nisn && s.nisn === a.nisn));
      return matchClass || matchStudent;
    });

    const absentList: string[] = [];
    let sakitCount = 0;
    let izinCount = 0;
    let alpaCount = 0;

    classStudents.forEach(s => {
      const record = dateLogs.find(a => a.studentId === s.id || (a.nisn && a.nisn === s.nisn));
      if (record) {
        if (record.status === 'Sakit') {
          sakitCount++;
          absentList.push(`${s.name} (Sakit)`);
        } else if (record.status === 'Izin') {
          izinCount++;
          absentList.push(`${s.name} (Izin)`);
        } else if (record.status === 'Alpa') {
          alpaCount++;
          absentList.push(`${s.name} (Alpa)`);
        }
      }
    });

    const totalAbsent = absentList.length;
    const ketParts: string[] = [];
    if (sakitCount > 0) ketParts.push(`S:${sakitCount}`);
    if (izinCount > 0) ketParts.push(`I:${izinCount}`);
    if (alpaCount > 0) ketParts.push(`A:${alpaCount}`);

    return {
      siswaTidakHadirNama: totalAbsent > 0 ? absentList.join(', ') : 'Nihil (Hadir Semua)',
      siswaTidakHadirKet: ketParts.length > 0 ? ketParts.join(', ') : 'Nihil',
      siswaTidakHadirJml: totalAbsent,
      totalSiswa: totalClassCount
    };
  }, [attendance, students]);

  const syncJournalAttendanceForClassAndDate = useCallback((
    targetDate: string,
    targetKelas: string,
    customAtt?: AttendanceRecord[],
    customStudents?: Student[]
  ): boolean => {
    if (!targetDate || !targetKelas) return false;
    const cleanDate = cleanDateFormat(targetDate);
    const cleanClass = targetKelas.trim().toLowerCase();

    const currentAtt = customAtt || attendance;
    const currentStud = customStudents || students;

    const matching = journals.filter(j => cleanDateFormat(j.date) === cleanDate && j.kelas.trim().toLowerCase() === cleanClass);
    if (matching.length === 0) return false;

    const absenceData = computeAbsenceForClassAndDate(cleanDate, targetKelas, currentAtt, currentStud);
    if (!absenceData) return false;

    let modified = false;
    const nextJournals = journals.map(j => {
      if (cleanDateFormat(j.date) === cleanDate && j.kelas.trim().toLowerCase() === cleanClass) {
        if (
          j.siswaTidakHadirNama !== absenceData.siswaTidakHadirNama ||
          j.siswaTidakHadirKet !== absenceData.siswaTidakHadirKet ||
          j.siswaTidakHadirJml !== absenceData.siswaTidakHadirJml ||
          j.totalSiswa !== absenceData.totalSiswa
        ) {
          modified = true;
          safeFirestoreWrite(
            () => updateDoc(doc(db, 'journals', j.id), sanitizeForFirestore(absenceData)),
            OperationType.UPDATE,
            `journals/${j.id}`
          );
          return { ...j, ...absenceData };
        }
      }
      return j;
    });

    if (modified) {
      setJournals(nextJournals);
      try {
        localStorage.setItem('qr_presensi_journals', JSON.stringify(nextJournals));
      } catch (e) {}
    }
    return modified;
  }, [journals, attendance, students, computeAbsenceForClassAndDate]);

  const syncAllJournalsWithAttendance = useCallback((): number => {
    let syncedCount = 0;
    const nextJournals = journals.map(j => {
      const cleanDate = cleanDateFormat(j.date);
      const absenceData = computeAbsenceForClassAndDate(cleanDate, j.kelas, attendance, students);
      if (absenceData) {
        if (
          j.siswaTidakHadirNama !== absenceData.siswaTidakHadirNama ||
          j.siswaTidakHadirKet !== absenceData.siswaTidakHadirKet ||
          j.siswaTidakHadirJml !== absenceData.siswaTidakHadirJml ||
          j.totalSiswa !== absenceData.totalSiswa
        ) {
          syncedCount++;
          safeFirestoreWrite(
            () => updateDoc(doc(db, 'journals', j.id), sanitizeForFirestore(absenceData)),
            OperationType.UPDATE,
            `journals/${j.id}`
          );
          return { ...j, ...absenceData };
        }
      }
      return j;
    });

    if (syncedCount > 0) {
      setJournals(nextJournals);
      try {
        localStorage.setItem('qr_presensi_journals', JSON.stringify(nextJournals));
      } catch (e) {}
      showToast(`Berhasil menyinkronkan ${syncedCount} catatan jurnal dengan data presensi siswa terkini.`, 'success');
    } else {
      showToast('Seluruh jurnal mengajar sudah sinkron dengan data presensi terkini.', 'info');
    }
    return syncedCount;
  }, [journals, attendance, students, computeAbsenceForClassAndDate, showToast]);

  const markAttendanceByNisn = useCallback((
    nisnInput: string,
    method: 'QR Code' | 'Manual' = 'QR Code',
    forceStatus?: AttendanceStatus,
    note?: string,
    customTime?: string,
    customDate?: string,
    allowOverwrite?: boolean
  ) => {
    const cleanedNisn = nisnInput.trim();
    const student = students.find(s => s.nisn === cleanedNisn || s.id === cleanedNisn);

    if (!student) {
      const msg = `NISN / Kode "${cleanedNisn}" tidak ditemukan dalam data siswa.`;
      showToast(msg, 'error');
      return { success: false, isDuplicate: false, message: msg };
    }

    const targetDate = (customDate && customDate.trim()) ? customDate.trim() : getTodayString(settings?.timezone);
    const existingIndex = attendance.findIndex(a => (a.studentId === student.id || (a.nisn && a.nisn === student.nisn)) && a.date === targetDate);

    // Deteksi jika siswa sudah pernah presensi hari ini dan sedang scan lewat QR Code tanpa instruksi overwrite paksa
    if (existingIndex >= 0 && !allowOverwrite && method === 'QR Code') {
      const existing = attendance[existingIndex];
      const duplicateMsg = `Siswa ${student.name} (${student.class}) SUDAH melakukan presensi hari ini pada pukul ${existing.time} [Status: ${existing.status}].`;
      showToast(duplicateMsg, 'warning');
      return {
        success: false,
        isDuplicate: true,
        message: duplicateMsg,
        student,
        record: existing
      };
    }

    let timeString = getCurrentTimeInTimezone(settings?.timezone, true);

    if (customTime && customTime.trim()) {
      const parts = customTime.trim().split(':');
      const h = (parts[0] || '07').padStart(2, '0');
      const m = (parts[1] || '00').padStart(2, '0');
      const s = parts[2] ? parts[2].padStart(2, '0') : '00';
      timeString = `${h}:${m}:${s}`;
    }

    // Calculate Hadir vs Terlambat status automatically if forceStatus is not provided
    let status: AttendanceStatus = forceStatus || 'Hadir';
    if (!forceStatus) {
      // Prioritaskan settings.jamTerlambat (batas jam terlambat)
      const cutoffTime = (settings.jamTerlambat || settings.jamMasuk || '07:15').replace('.', ':');
      const [limitHour, limitMin] = cutoffTime.split(':').map(Number);

      const [userHour, userMin] = timeString.split(':').map(Number);
      const userMinutes = (isNaN(userHour) ? 7 : userHour) * 60 + (isNaN(userMin) ? 0 : userMin);
      const limitMinutes = (isNaN(limitHour) ? 7 : limitHour) * 60 + (isNaN(limitMin) ? 15 : limitMin);

      if (userMinutes > limitMinutes) {
        status = 'Terlambat';
      }
    }

    const deterministicId = `${student.nisn}-${targetDate}`;

    if (existingIndex >= 0) {
      const existing = attendance[existingIndex];
      const updatedRecord: AttendanceRecord = {
        ...existing,
        id: deterministicId,
        date: targetDate,
        time: timeString,
        status,
        method,
        note: note || (status === 'Terlambat' ? 'Terlambat masuk sekolah' : undefined)
      };

      setAttendance(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(a => a.id === existing.id || a.id === deterministicId || (a.nisn === student.nisn && a.date === targetDate));
        if (idx >= 0) {
          copy[idx] = updatedRecord;
        } else {
          copy.unshift(updatedRecord);
        }
        return copy;
      });

      safeFirestoreWrite(
        () => setDoc(doc(db, 'attendance', deterministicId), sanitizeForFirestore(updatedRecord)),
        OperationType.WRITE,
        `attendance/${deterministicId}`
      );
      syncRecordToSheets(updatedRecord);

      // Auto-synchronize teaching journal on this date and class
      const updatedAttendance = attendance.map(a => (a.id === existing.id || a.id === deterministicId || (a.nisn === student.nisn && a.date === targetDate)) ? updatedRecord : a);
      syncJournalAttendanceForClassAndDate(targetDate, student.class, updatedAttendance);

      const updateMsg = `Presensi diperbarui! ${student.name} (${student.class}) ditandai ${status.toUpperCase()} [${targetDate} ${timeString}]`;
      showToast(updateMsg, status === 'Terlambat' ? 'warning' : 'success');

      return { success: true, isDuplicate: false, message: updateMsg, student, record: updatedRecord };
    }

    const newRecord: AttendanceRecord = {
      id: deterministicId,
      studentId: student.id,
      studentName: student.name,
      nisn: student.nisn,
      class: student.class,
      date: targetDate,
      time: timeString,
      status,
      method,
      note: note || (status === 'Terlambat' ? 'Terlambat masuk sekolah' : undefined)
    };

    setAttendance(prev => [newRecord, ...prev]);
    safeFirestoreWrite(
      () => setDoc(doc(db, 'attendance', deterministicId), sanitizeForFirestore(newRecord)),
      OperationType.CREATE,
      `attendance/${deterministicId}`
    );
    syncRecordToSheets(newRecord);

    // Auto-synchronize teaching journal on this date and class
    const nextAttendance = [newRecord, ...attendance];
    syncJournalAttendanceForClassAndDate(targetDate, student.class, nextAttendance);

    const successMsg = `Berhasil! ${student.name} (${student.class}) ditandai ${status.toUpperCase()} [${targetDate} ${timeString}]`;
    showToast(successMsg, status === 'Terlambat' ? 'warning' : 'success');

    return { success: true, isDuplicate: false, message: successMsg, student, record: newRecord };
  }, [students, attendance, settings.jamTerlambat, settings.jamMasuk, showToast, syncRecordToSheets, syncJournalAttendanceForClassAndDate]);

  const resetAttendanceByNisnAndDate = useCallback((nisnInput: string, dateInput?: string) => {
    const cleanedNisn = nisnInput.trim();
    const student = students.find(s => s.nisn === cleanedNisn || s.id === cleanedNisn);
    if (!student) {
      const msg = `Siswa dengan NISN/ID "${nisnInput}" tidak ditemukan.`;
      showToast(msg, 'error');
      return { success: false, message: msg };
    }

    const targetDate = (dateInput && dateInput.trim()) ? dateInput.trim() : getTodayString();
    const deterministicId = `${student.nisn}-${targetDate}`;

    const record = attendance.find(a => a.id === deterministicId || ((a.studentId === student.id || a.nisn === student.nisn) && a.date === targetDate));

    if (record) {
      deleteRecordFromSheets(record);
      const nextAtt = attendance.filter(a => a.id !== record.id && a.id !== deterministicId && !((a.studentId === student.id || a.nisn === student.nisn) && a.date === targetDate));
      setAttendance(nextAtt);
      safeFirestoreWrite(
        () => deleteDoc(doc(db, 'attendance', record.id)),
        OperationType.DELETE,
        `attendance/${record.id}`
      );
      if (record.id !== deterministicId) {
        safeFirestoreWrite(
          () => deleteDoc(doc(db, 'attendance', deterministicId)),
          OperationType.DELETE,
          `attendance/${deterministicId}`
        );
      }

      // Auto-synchronize teaching journal on reset
      syncJournalAttendanceForClassAndDate(targetDate, student.class, nextAtt);

      const msg = `Presensi ${student.name} (${student.class}) tanggal ${targetDate} berhasil di-reset ke BELUM ABSEN.`;
      showToast(msg, 'info');
      return { success: true, message: msg };
    } else {
      const msg = `${student.name} (${student.class}) sudah berstatus BELUM ABSEN pada tanggal ${targetDate}.`;
      showToast(msg, 'info');
      return { success: true, message: msg };
    }
  }, [students, attendance, deleteRecordFromSheets, showToast, syncJournalAttendanceForClassAndDate]);

  const addStudent = useCallback((newStudent: Omit<Student, 'id'>): Student => {
    const student: Student = {
      ...newStudent,
      id: 'std-' + Math.random().toString(36).substring(2, 8)
    };
    setStudents(prev => sortStudents([student, ...prev]));
    safeFirestoreWrite(
      () => setDoc(doc(db, 'students', student.id), sanitizeForFirestore(student)),
      OperationType.CREATE,
      `students/${student.id}`
    );
    syncStudentsToSheets([student, ...students]);
    showToast(`Siswa ${student.name} berhasil ditambahkan.`, 'success');
    return student;
  }, [students, showToast, syncStudentsToSheets]);

  const addStudentsBulk = useCallback((newStudents: Omit<Student, 'id'>[]): number => {
    if (!newStudents.length) return 0;
    const sortedInput = sortStudents(newStudents);
    const prepared: Student[] = sortedInput.map((s, idx) => ({
      ...s,
      id: 'std-' + Math.random().toString(36).substring(2, 7) + idx
    }));
    setStudents(prev => sortStudents([...prepared, ...prev]));
    executeChunkedBatch(
      prepared,
      (batch, st) => {
        batch.set(doc(db, 'students', st.id), sanitizeForFirestore(st));
      },
      30,
      'students'
    );
    syncStudentsToSheets([...prepared, ...students]);
    showToast(`Berhasil mengimpor ${prepared.length} data siswa.`, 'success');
    return prepared.length;
  }, [students, showToast, syncStudentsToSheets]);

  const updateStudent = useCallback((id: string, updatedFields: Partial<Student>) => {
    const existingStudent = students.find(s => s.id === id);
    const newStudents = students.map(s => s.id === id ? { ...s, ...updatedFields } : s);
    setStudents(sortStudents(newStudents));
    safeFirestoreWrite(
      () => updateDoc(doc(db, 'students', id), sanitizeForFirestore(updatedFields)),
      OperationType.UPDATE,
      `students/${id}`
    );

    // If class, name, or nisn was updated, cascade to all attendance records of this student
    if (existingStudent && (updatedFields.class !== undefined || updatedFields.name !== undefined || updatedFields.nisn !== undefined)) {
      const newClass = updatedFields.class !== undefined ? updatedFields.class : existingStudent.class;
      const newName = updatedFields.name !== undefined ? updatedFields.name : existingStudent.name;
      const newNisn = updatedFields.nisn !== undefined ? updatedFields.nisn : existingStudent.nisn;

      setAttendance(prev => prev.map(a => {
        if (a.studentId === id || a.nisn === existingStudent.nisn || (a.nisn === newNisn)) {
          return {
            ...a,
            studentId: id,
            studentName: newName,
            nisn: newNisn,
            class: newClass
          };
        }
        return a;
      }));

      // Cascade update to Firestore attendance records in small chunks
      const affectedAttendance = attendance.filter(
        (a): a is AttendanceRecord => a.studentId === id || a.nisn === existingStudent.nisn || a.nisn === newNisn
      );
      if (affectedAttendance.length > 0) {
        executeChunkedBatch<AttendanceRecord>(
          affectedAttendance,
          (batch, a) => {
            const patch: Partial<AttendanceRecord> = {};
            if (updatedFields.class !== undefined) patch.class = newClass;
            if (updatedFields.name !== undefined) patch.studentName = newName;
            if (updatedFields.nisn !== undefined) patch.nisn = newNisn;
            batch.update(doc(db, 'attendance', a.id), sanitizeForFirestore(patch));
          },
          30,
          'attendance'
        );
      }
    }

    syncStudentsToSheets(newStudents);
    showToast('Data siswa & riwayat presensinya berhasil diperbarui.', 'success');
  }, [students, attendance, showToast, syncStudentsToSheets]);

  const updateStudentProfile = useCallback(async (studentId: string, profileData: Partial<Student>): Promise<boolean> => {
    try {
      updateStudent(studentId, {
        ...profileData,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error('Failed to update student profile', err);
      showToast('Gagal memperbarui profil siswa.', 'error');
      return false;
    }
  }, [updateStudent, showToast]);

  const resetStudentPin = useCallback((studentId: string, customPin?: string): { success: boolean; pin: string } => {
    const target = students.find(s => s.id === studentId);
    if (!target) return { success: false, pin: '' };

    // Default to last 6 digits of NISN or '123456'
    const defaultPin = target.nisn && target.nisn.length >= 6 
      ? target.nisn.slice(-6) 
      : (target.nisn || '123456');
    const finalPin = customPin !== undefined ? customPin : defaultPin;

    updateStudent(studentId, {
      studentPin: finalPin,
      updatedAt: new Date().toISOString()
    });

    showToast(`PIN Akun Siswa ${target.name} berhasil di-reset menjadi: ${finalPin}`, 'success');
    return { success: true, pin: finalPin };
  }, [students, updateStudent, showToast]);

  const deleteStudent = useCallback((id: string) => {
    const target = students.find(s => s.id === id);
    if (target) {
      deleteStudentFromSheets(target);
      setAttendance(prev => prev.filter(a => a.studentId !== id && a.nisn !== target.nisn));
    }
    setStudents(prev => prev.filter(s => s.id !== id));
    safeFirestoreWrite(
      () => deleteDoc(doc(db, 'students', id)),
      OperationType.DELETE,
      `students/${id}`
    );
    syncStudentsToSheets(students.filter(s => s.id !== id));
    showToast(`Data siswa ${target ? target.name : ''} & riwayat presensinya berhasil dihapus.`, 'info');
  }, [students, deleteStudentFromSheets, syncStudentsToSheets, showToast]);

  const deleteStudentsBulk = useCallback((ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const targetSet = new Set(ids);
    const targets = students.filter(s => targetSet.has(s.id));
    const targetNisns = new Set(targets.map(s => s.nisn).filter(Boolean));

    // 1. Remove from Google Sheets
    targets.forEach(t => {
      deleteStudentFromSheets(t);
    });

    // 2. Cascade remove related attendance records in local state
    const nextAttendance = attendance.filter(a => !targetSet.has(a.studentId) && !targetNisns.has(a.nisn));
    setAttendance(nextAttendance);

    // 3. Remove from students local state
    const remainingStudents = students.filter(s => !targetSet.has(s.id));
    setStudents(remainingStudents);

    // 4. Batch delete from Firestore students collection
    executeChunkedBatch<Student>(
      targets,
      (batch, st) => {
        batch.delete(doc(db, 'students', st.id));
      },
      30,
      'students'
    );

    // 5. Batch delete cascading attendance from Firestore
    const affectedAttendance = attendance.filter(a => targetSet.has(a.studentId) || targetNisns.has(a.nisn));
    if (affectedAttendance.length > 0) {
      executeChunkedBatch<AttendanceRecord>(
        affectedAttendance,
        (batch, att) => {
          batch.delete(doc(db, 'attendance', att.id));
        },
        30,
        'attendance'
      );
    }

    // 6. Sync remaining students to Sheets
    syncStudentsToSheets(remainingStudents);

    showToast(`Berhasil menghapus ${targets.length} data siswa beserta riwayat presensinya.`, 'info');
  }, [students, attendance, deleteStudentFromSheets, syncStudentsToSheets, showToast]);

  const deleteAttendance = useCallback((id: string) => {
    const target = attendance.find(a => a.id === id);
    if (target) {
      deleteRecordFromSheets(target);
    }
    const nextAtt = attendance.filter(a => a.id !== id);
    setAttendance(nextAtt);
    safeFirestoreWrite(
      () => deleteDoc(doc(db, 'attendance', id)),
      OperationType.DELETE,
      `attendance/${id}`
    );
    if (target) {
      syncJournalAttendanceForClassAndDate(target.date, target.class, nextAtt);
    }
    showToast('Catatan presensi berhasil dihapus & jurnal disinkronkan.', 'info');
  }, [attendance, deleteRecordFromSheets, showToast, syncJournalAttendanceForClassAndDate]);

  const clearAttendanceForClassAndDate = useCallback((targetDate: string, targetKelas: string): { count: number; success: boolean } => {
    if (!targetDate) return { count: 0, success: false };
    const cleanDate = cleanDateFormat(targetDate);
    const cleanClass = targetKelas ? targetKelas.trim().toLowerCase() : '';
    const isAllClasses = !cleanClass || cleanClass === 'semua' || cleanClass === 'semua kelas';

    // Map students for class matching fallback
    const studentClassMap = new Map<string, string>();
    students.forEach(s => {
      if (s.id && s.class) studentClassMap.set(s.id, s.class.trim().toLowerCase());
      if (s.nisn && s.class) studentClassMap.set(s.nisn, s.class.trim().toLowerCase());
    });

    const matchingRecords = attendance.filter(a => {
      const aDateClean = cleanDateFormat(a.date);
      const isDateMatch = aDateClean === cleanDate || (a.date && a.date.startsWith(cleanDate)) || a.date === targetDate;
      if (!isDateMatch) return false;
      if (isAllClasses) return true;

      const directClass = a.class ? a.class.trim().toLowerCase() : '';
      const mappedClass = (a.studentId && studentClassMap.get(a.studentId)) || (a.nisn && studentClassMap.get(a.nisn)) || '';
      return directClass === cleanClass || mappedClass === cleanClass;
    });

    if (matchingRecords.length === 0) {
      showToast(`Tidak ditemukan data presensi pada tanggal ${cleanDate}${!isAllClasses ? ` kelas ${targetKelas}` : ''}.`, 'info');
      return { count: 0, success: true };
    }

    const matchingIds = new Set(matchingRecords.map(r => r.id));
    const nextAtt = attendance.filter(a => !matchingIds.has(a.id));
    setAttendance(nextAtt);
    try {
      localStorage.setItem('qr_presensi_attendance', JSON.stringify(nextAtt));
    } catch (e) {}

    // Batch delete from Firestore
    executeChunkedBatch<AttendanceRecord>(
      matchingRecords,
      (batch, r) => {
        batch.delete(doc(db, 'attendance', r.id));
      },
      30,
      'attendance'
    );

    // Sync deletion with sheets
    matchingRecords.forEach(r => {
      deleteRecordFromSheets(r);
    });

    // Update journal absence recomputation
    if (isAllClasses) {
      const distinctClasses = Array.from(new Set(matchingRecords.map(r => r.class))).filter(Boolean);
      distinctClasses.forEach(cls => {
        syncJournalAttendanceForClassAndDate(cleanDate, cls, nextAtt);
      });
    } else {
      syncJournalAttendanceForClassAndDate(cleanDate, targetKelas, nextAtt);
    }

    const msg = `Berhasil mengosongkan ${matchingRecords.length} log presensi pada tanggal ${cleanDate}${!isAllClasses ? ` kelas ${targetKelas}` : ''}.`;
    showToast(msg, 'success');
    return { count: matchingRecords.length, success: true };
  }, [attendance, students, deleteRecordFromSheets, showToast, syncJournalAttendanceForClassAndDate]);

  const updateAttendanceStatus = useCallback((id: string, newStatus: AttendanceStatus, note?: string) => {
    let updatedRecord: AttendanceRecord | null = null;
    const nextAtt = attendance.map(a => {
      if (a.id === id) {
        updatedRecord = { ...a, status: newStatus, note: note !== undefined ? note : a.note };
        return updatedRecord;
      }
      return a;
    });
    setAttendance(nextAtt);
    if (updatedRecord) {
      const rec = updatedRecord as AttendanceRecord;
      safeFirestoreWrite(
        () => updateDoc(doc(db, 'attendance', id), sanitizeForFirestore({ status: newStatus, note: note || '' })),
        OperationType.UPDATE,
        `attendance/${id}`
      );
      syncRecordToSheets(rec);
      syncJournalAttendanceForClassAndDate(rec.date, rec.class, nextAtt);
    }
    showToast('Status presensi telah diperbarui & jurnal disinkronkan.', 'success');
  }, [attendance, syncRecordToSheets, showToast, syncJournalAttendanceForClassAndDate]);

  const editAttendanceRecord = useCallback((id: string, updatedFields: Partial<AttendanceRecord>) => {
    let updatedRecord: AttendanceRecord | null = null;
    const oldRecord = attendance.find(a => a.id === id);
    const nextAtt = attendance.map(a => {
      if (a.id === id) {
        updatedRecord = { ...a, ...updatedFields };
        return updatedRecord;
      }
      return a;
    });
    setAttendance(nextAtt);
    if (updatedRecord) {
      const rec = updatedRecord as AttendanceRecord;
      safeFirestoreWrite(
        () => updateDoc(doc(db, 'attendance', id), sanitizeForFirestore(updatedFields)),
        OperationType.UPDATE,
        `attendance/${id}`
      );
      syncRecordToSheets(rec);

      // Auto cross-synchronize journals on edited date/class
      if (oldRecord) {
        syncJournalAttendanceForClassAndDate(oldRecord.date, oldRecord.class, nextAtt);
        if (rec.date !== oldRecord.date || rec.class !== oldRecord.class) {
          syncJournalAttendanceForClassAndDate(rec.date, rec.class, nextAtt);
        }
      } else {
        syncJournalAttendanceForClassAndDate(rec.date, rec.class, nextAtt);
      }
    }
    showToast('Data riwayat presensi & jurnal terkait berhasil diperbarui.', 'success');
  }, [attendance, syncRecordToSheets, showToast, syncJournalAttendanceForClassAndDate]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if ((!updated.spreadsheetUrl || !updated.spreadsheetUrl.trim()) && prev.spreadsheetUrl) {
        updated.spreadsheetUrl = prev.spreadsheetUrl;
      }
      try {
        localStorage.setItem('qr_presensi_settings', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save settings to localStorage:', e);
      }
      safeFirestoreWrite(
        () => setDoc(doc(db, 'settings', 'app_settings'), sanitizeForFirestore(updated), { merge: true }),
        OperationType.WRITE,
        'settings/app_settings'
      );
      syncSettingsToSheets(updated);
      return updated;
    });
    showToast('Pengaturan aplikasi & profil guru berhasil disimpan & disinkronkan.', 'success');
  }, [showToast, syncSettingsToSheets]);

  const addJournal = useCallback((newJournal: Omit<TeachingJournal, 'id'>): TeachingJournal => {
    const patchedFields = { ...newJournal };
    if (patchedFields.date && !patchedFields.day) {
      patchedFields.day = formatIndonesianDayAndDate(patchedFields.date).day;
    }

    const journal: TeachingJournal = {
      ...patchedFields,
      id: 'jrn-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString()
    };
    setJournals(prev => [journal, ...prev]);
    safeFirestoreWrite(
      () => setDoc(doc(db, 'journals', journal.id), sanitizeForFirestore(journal)),
      OperationType.CREATE,
      `journals/${journal.id}`
    );
    showToast('Jurnal mengajar berhasil ditambahkan.', 'success');
    return journal;
  }, [showToast]);

  const updateJournal = useCallback((id: string, updatedFields: Partial<TeachingJournal>) => {
    const prevJournal = journals.find(j => j.id === id);
    const patchedFields = { ...updatedFields };
    if (patchedFields.date && !patchedFields.day) {
      patchedFields.day = formatIndonesianDayAndDate(patchedFields.date).day;
    }

    setJournals(prev => prev.map(j => j.id === id ? { ...j, ...patchedFields } : j));
    safeFirestoreWrite(
      () => updateDoc(doc(db, 'journals', id), sanitizeForFirestore(patchedFields)),
      OperationType.UPDATE,
      `journals/${id}`
    );

    const targetDate = patchedFields.date || prevJournal?.date;
    const targetKelas = patchedFields.kelas || prevJournal?.kelas;
    if (targetDate && targetKelas) {
      setTimeout(() => {
        syncJournalAttendanceForClassAndDate(targetDate, targetKelas);
        if (prevJournal && (prevJournal.date !== targetDate || prevJournal.kelas !== targetKelas)) {
          syncJournalAttendanceForClassAndDate(prevJournal.date, prevJournal.kelas);
        }
      }, 100);
    }

    showToast('Jurnal mengajar berhasil diperbarui & disinkronkan.', 'success');
  }, [journals, showToast, syncJournalAttendanceForClassAndDate]);

  const deleteJournal = useCallback((id: string) => {
    setJournals(prev => prev.filter(j => j.id !== id));
    safeFirestoreWrite(
      () => deleteDoc(doc(db, 'journals', id)),
      OperationType.DELETE,
      `journals/${id}`
    );
    showToast('Jurnal mengajar berhasil dihapus.', 'info');
  }, [showToast]);

  const addTeachingSchedule = useCallback((item: Omit<TeachingScheduleItem, 'id'>): TeachingScheduleItem => {
    const newSchedule: TeachingScheduleItem = {
      ...item,
      id: 'sch-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
    };
    setTeachingSchedules(prev => {
      const next = [...prev, newSchedule];
      next.sort((a, b) => (a.dayIndex - b.dayIndex) || a.startTime.localeCompare(b.startTime));
      try {
        localStorage.setItem('qr_presensi_teaching_schedules', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    safeFirestoreWrite(
      () => setDoc(doc(db, 'teaching_schedules', newSchedule.id), sanitizeForFirestore(newSchedule)),
      OperationType.CREATE,
      `teaching_schedules/${newSchedule.id}`
    );
    showToast(`Jadwal mengajar kelas ${newSchedule.kelas} (${newSchedule.day}) berhasil ditambahkan.`, 'success');
    return newSchedule;
  }, [showToast]);

  const updateTeachingSchedule = useCallback((id: string, updatedFields: Partial<TeachingScheduleItem>) => {
    setTeachingSchedules(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...updatedFields } : s);
      next.sort((a, b) => (a.dayIndex - b.dayIndex) || a.startTime.localeCompare(b.startTime));
      try {
        localStorage.setItem('qr_presensi_teaching_schedules', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    safeFirestoreWrite(
      () => updateDoc(doc(db, 'teaching_schedules', id), sanitizeForFirestore(updatedFields)),
      OperationType.UPDATE,
      `teaching_schedules/${id}`
    );
    showToast('Jadwal mengajar berhasil diperbarui.', 'success');
  }, [showToast]);

  const deleteTeachingSchedule = useCallback((id: string) => {
    const target = teachingSchedules.find(s => s.id === id);
    setTeachingSchedules(prev => {
      const next = prev.filter(s => s.id !== id);
      try {
        localStorage.setItem('qr_presensi_teaching_schedules', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    safeFirestoreWrite(
      () => deleteDoc(doc(db, 'teaching_schedules', id)),
      OperationType.DELETE,
      `teaching_schedules/${id}`
    );
    showToast(`Jadwal mengajar ${target ? `${target.day} ${target.kelas}` : ''} berhasil dihapus.`, 'info');
  }, [teachingSchedules, showToast]);

  const resetTeachingSchedules = useCallback(() => {
    setTeachingSchedules(INITIAL_TEACHING_SCHEDULES);
    try {
      localStorage.setItem('qr_presensi_teaching_schedules', JSON.stringify(INITIAL_TEACHING_SCHEDULES));
    } catch (e) {}
    executeChunkedBatch(
      INITIAL_TEACHING_SCHEDULES,
      (batch, sch) => {
        batch.set(doc(db, 'teaching_schedules', sch.id), sanitizeForFirestore(sch));
      },
      30,
      'teaching_schedules'
    );
    showToast('Jadwal mengajar telah direset ke default contoh.', 'info');
  }, [showToast]);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    updateSettings({ themeMode: newMode });
  }, [updateSettings]);

  const setThemeAccent = useCallback((newAccent: ThemeAccent) => {
    updateSettings({ themeAccent: newAccent });
  }, [updateSettings]);

  const setThemeFont = useCallback((newFont: ThemeFont) => {
    updateSettings({ themeFont: newFont });
  }, [updateSettings]);

  const setThemeFontSize = useCallback((newSize: ThemeFontSize) => {
    updateSettings({ themeFontSize: newSize });
  }, [updateSettings]);

  const activeAcademicYear = academicYears.find(ay => ay.isCurrent) || academicYears.find(ay => !ay.isArchived) || academicYears[0];

  const addAcademicYear = useCallback((newYear: Omit<AcademicYear, 'id' | 'createdAt'>): AcademicYear => {
    const created: AcademicYear = {
      ...newYear,
      id: 'ay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString()
    };
    
    setAcademicYears(prev => {
      let nextList = [created, ...prev];
      if (created.isCurrent) {
        nextList = nextList.map(y => y.id === created.id ? y : { ...y, isCurrent: false });
        updateSettings({ tahunAjaran: created.name, semester: created.semester });
      }
      return nextList;
    });

    safeFirestoreWrite(
      () => setDoc(doc(db, 'academic_years', created.id), sanitizeForFirestore(created)),
      OperationType.CREATE,
      `academic_years/${created.id}`
    );
    showToast(`Tahun Ajaran ${created.name} (${created.semester}) berhasil ditambahkan.`, 'success');
    return created;
  }, [showToast, updateSettings]);

  const updateAcademicYear = useCallback((id: string, updatedFields: Partial<AcademicYear>) => {
    setAcademicYears(prev => {
      const nextList = prev.map(y => {
        if (y.id === id) {
          const updated = { ...y, ...updatedFields };
          if (updated.isCurrent) {
            updateSettings({ tahunAjaran: updated.name, semester: updated.semester });
          }
          return updated;
        }
        if (updatedFields.isCurrent) {
          return { ...y, isCurrent: false };
        }
        return y;
      });
      return nextList;
    });

    safeFirestoreWrite(
      () => updateDoc(doc(db, 'academic_years', id), sanitizeForFirestore(updatedFields)),
      OperationType.UPDATE,
      `academic_years/${id}`
    );
    showToast('Tahun Ajaran berhasil diperbarui.', 'success');
  }, [showToast, updateSettings]);

  const deleteAcademicYear = useCallback((id: string) => {
    const target = academicYears.find(y => y.id === id);
    if (target?.isCurrent) {
      showToast('Tidak dapat menghapus Tahun Ajaran yang sedang aktif saat ini. Silakan aktifkan tahun ajaran lain terlebih dahulu.', 'warning');
      return;
    }
    setAcademicYears(prev => prev.filter(y => y.id !== id));
    safeFirestoreWrite(
      () => deleteDoc(doc(db, 'academic_years', id)),
      OperationType.DELETE,
      `academic_years/${id}`
    );
    showToast(`Tahun Ajaran ${target?.name || ''} berhasil dihapus.`, 'info');
  }, [academicYears, showToast]);

  const setActiveAcademicYear = useCallback((id: string) => {
    const target = academicYears.find(y => y.id === id);
    if (!target) return;

    setAcademicYears(prev => prev.map(y => ({
      ...y,
      isCurrent: y.id === id,
      isArchived: y.id === id ? false : y.isArchived
    })));

    executeChunkedBatch<AcademicYear>(
      academicYears,
      (batch, y) => {
        const isNowCurrent = y.id === id;
        const isNowArchived = isNowCurrent ? false : y.isArchived;
        batch.update(doc(db, 'academic_years', y.id), { isCurrent: isNowCurrent, isArchived: isNowArchived });
      },
      50,
      'academic_years'
    );

    updateSettings({ tahunAjaran: target.name, semester: target.semester });
    showToast(`Tahun Ajaran aktif diubah ke ${target.name} - Semester ${target.semester}.`, 'success');
  }, [academicYears, showToast, updateSettings]);

  const toggleArchiveAcademicYear = useCallback((id: string) => {
    const target = academicYears.find(y => y.id === id);
    if (!target) return;

    if (target.isCurrent && !target.isArchived) {
      showToast('Tahun Ajaran yang sedang aktif tidak dapat langsung diarsipkan. Pindahkan status aktif ke tahun ajaran lain terlebih dahulu.', 'warning');
      return;
    }

    const nextArchived = !target.isArchived;
    setAcademicYears(prev => prev.map(y => y.id === id ? { ...y, isArchived: nextArchived } : y));
    safeFirestoreWrite(() => updateDoc(doc(db, 'academic_years', id), { isArchived: nextArchived }), OperationType.UPDATE, `academic_years/${id}`);
    
    showToast(
      nextArchived 
        ? `Tahun Ajaran ${target.name} (${target.semester}) berhasil dimasukkan ke ARSIP.` 
        : `Tahun Ajaran ${target.name} (${target.semester}) berhasil dipulihkan dari arsip.`,
      'info'
    );
  }, [academicYears, showToast]);

  const getGradeSheet = useCallback((kelas: string, semester: string, tahunAjaran: string): ClassGradeSheet | undefined => {
    const docId = getGradeSheetDocId(kelas, semester, tahunAjaran);
    const legacyKey = `qr_presensi_grades_${kelas}_${semester}_${tahunAjaran.replace('/', '-')}`;
    
    const found = gradeSheets.find(g => 
      g.id === docId || 
      g.id === legacyKey ||
      (g.kelas === kelas && g.semester === semester && g.tahunAjaran === tahunAjaran)
    );
    if (found) return found;

    try {
      const localData = localStorage.getItem(legacyKey) || localStorage.getItem(docId);
      if (localData) return JSON.parse(localData);
    } catch (e) {}

    return undefined;
  }, [gradeSheets]);

  const saveGradeSheet = useCallback(async (gradeSheet: ClassGradeSheet): Promise<{ success: boolean; message: string }> => {
    try {
      const docId = getGradeSheetDocId(gradeSheet.kelas, gradeSheet.semester, gradeSheet.tahunAjaran);
      const legacyKey = `qr_presensi_grades_${gradeSheet.kelas}_${gradeSheet.semester}_${gradeSheet.tahunAjaran.replace('/', '-')}`;
      
      const completeSheet: ClassGradeSheet = {
        ...gradeSheet,
        id: docId,
        updatedAt: new Date().toISOString()
      };

      const sanitized = deepSanitizeForFirestore(completeSheet);

      // 1. Optimistic local state update
      setGradeSheets(prev => {
        const next = prev.filter(g => 
          g.id !== docId && 
          g.id !== legacyKey && 
          !(g.kelas === gradeSheet.kelas && g.semester === gradeSheet.semester && g.tahunAjaran === gradeSheet.tahunAjaran)
        );
        return [...next, completeSheet];
      });

      // 2. Cache in localStorage
      try {
        localStorage.setItem(docId, JSON.stringify(completeSheet));
        localStorage.setItem(legacyKey, JSON.stringify(completeSheet));
      } catch (e) {}

      // 3. Persist to Firestore Cloud safely with fallback
      await safeFirestoreWrite(
        () => setDoc(doc(db, 'gradeSheets', docId), sanitized),
        OperationType.WRITE,
        `gradeSheets/${docId}`
      );

      showToast(`Data Nilai Harian Kelas ${gradeSheet.kelas} tersimpan & disinkronkan!`, 'success');
      return { success: true, message: 'Berhasil disimpan' };
    } catch (err: any) {
      console.warn('GradeSheet save note:', err);
      showToast('Data Nilai Harian tersimpan di penyimpanan lokal.', 'info');
      return { success: true, message: 'Tersimpan lokal' };
    }
  }, [showToast]);

  // ---------------------------------------------------------------------------
  // ANNOUNCEMENTS & BROADCAST LOGIC
  // ---------------------------------------------------------------------------
  const addAnnouncement = useCallback((newAnn: Omit<Announcement, 'id' | 'createdAt' | 'date' | 'time'> & { date?: string; time?: string }): Announcement => {
    const tz = settings.timezone || 'WIB';
    const nowTime = getCurrentTimeInTimezone(tz);
    const nowDate = getCurrentDateInTimezone(tz);
    const nowIso = new Date().toISOString();

    const created: Announcement = {
      ...newAnn,
      id: 'ann-' + Math.random().toString(36).substring(2, 9),
      date: newAnn.date || nowDate,
      time: newAnn.time || nowTime,
      createdAt: nowIso,
      isPinned: newAnn.isPinned ?? false,
      priority: newAnn.priority ?? 'normal',
      readBy: newAnn.readBy || {}
    };

    setAnnouncements(prev => [created, ...prev]);

    safeFirestoreWrite(
      () => setDoc(doc(db, 'announcements', created.id), sanitizeForFirestore(created)),
      OperationType.CREATE,
      `announcements/${created.id}`
    );

    const targetDesc = created.targetType === 'all' 
      ? 'semua kelas' 
      : created.targetType === 'class' 
        ? `kelas ${(created.targetClasses || []).join(', ')}` 
        : `siswa pilihan (${(created.targetStudentNames || []).length} siswa)`;
    
    showToast(`Pengumuman broadcast berhasil dikirim ke ${targetDesc}!`, 'success');
    return created;
  }, [settings.timezone, showToast]);

  const updateAnnouncement = useCallback((id: string, updatedFields: Partial<Announcement>) => {
    setAnnouncements(prev => prev.map(ann => {
      if (ann.id !== id) return ann;
      return {
        ...ann,
        ...updatedFields,
        updatedAt: new Date().toISOString()
      };
    }));

    safeFirestoreWrite(
      () => updateDoc(doc(db, 'announcements', id), sanitizeForFirestore({ ...updatedFields, updatedAt: new Date().toISOString() })),
      OperationType.UPDATE,
      `announcements/${id}`
    );

    showToast('Pengumuman / broadcast berhasil diperbarui.', 'success');
  }, [showToast]);

  const deleteAnnouncement = useCallback((id: string) => {
    setAnnouncements(prev => prev.filter(ann => ann.id !== id));
    safeFirestoreWrite(
      () => deleteDoc(doc(db, 'announcements', id)),
      OperationType.DELETE,
      `announcements/${id}`
    );
    showToast('Pengumuman berhasil dihapus.', 'info');
  }, [showToast]);

  const markAnnouncementAsRead = useCallback((
    announcementId: string, 
    readerKey: string, 
    readerName?: string, 
    readerClass?: string, 
    role: 'student' | 'admin' | 'teacher' = 'student'
  ) => {
    if (!announcementId || !readerKey) return;
    const nowIso = new Date().toISOString();

    // 1. Cache di LocalStorage agar instan & tidak trigger popup lagi
    try {
      const cacheKey = `qr_read_announcements_${readerKey}`;
      const existingCache: string[] = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      if (!existingCache.includes(announcementId)) {
        existingCache.push(announcementId);
        localStorage.setItem(cacheKey, JSON.stringify(existingCache));
      }
    } catch (e) {}

    // 2. Perbarui state React
    setAnnouncements(prev => prev.map(ann => {
      if (ann.id !== announcementId) return ann;
      const currentReadBy = ann.readBy || {};
      if (currentReadBy[readerKey]) return ann;
      return {
        ...ann,
        readBy: {
          ...currentReadBy,
          [readerKey]: {
            readAt: nowIso,
            readerName: readerName || '',
            readerClass: readerClass || '',
            role
          }
        }
      };
    }));

    // 3. Persist ke Firestore
    safeFirestoreWrite(async () => {
      const annRef = doc(db, 'announcements', announcementId);
      await updateDoc(annRef, {
        [`readBy.${readerKey}`]: {
          readAt: nowIso,
          readerName: readerName || '',
          readerClass: readerClass || '',
          role
        }
      });
    }, OperationType.UPDATE, `announcements/${announcementId}`);
  }, []);

  const getUnreadAnnouncementsForStudent = useCallback((student: Student): Announcement[] => {
    if (!student) return [];
    
    let localReadIds: string[] = [];
    try {
      const byId = JSON.parse(localStorage.getItem(`qr_read_announcements_${student.id}`) || '[]');
      const byNisn = JSON.parse(localStorage.getItem(`qr_read_announcements_${student.nisn}`) || '[]');
      localReadIds = Array.from(new Set([...byId, ...byNisn]));
    } catch (e) {}

    return announcements.filter(ann => {
      // 1. Apakah pengumuman ini ditujukan untuk siswa ini?
      const isTargetAll = ann.targetType === 'all';
      const isTargetClass = ann.targetType === 'class' && Array.isArray(ann.targetClasses) && ann.targetClasses.includes(student.class);
      const isTargetStudent = ann.targetType === 'student' && Array.isArray(ann.targetStudentIds) && (
        ann.targetStudentIds.includes(student.id) || 
        ann.targetStudentIds.includes(student.nisn)
      );

      if (!isTargetAll && !isTargetClass && !isTargetStudent) {
        return false;
      }

      // 2. Apakah sudah dibaca di doc atau di cache lokal?
      const isReadInDoc = Boolean(ann.readBy && (ann.readBy[student.id] || ann.readBy[student.nisn]));
      const isReadInCache = localReadIds.includes(ann.id);

      return !isReadInDoc && !isReadInCache;
    });
  }, [announcements]);

  const exportBackupJson = useCallback(() => {
    const payload = createBackupPayload(students, attendance, journals, academicYears, settings, gradeSheets, teachingSchedules, announcements);
    downloadBackupJson(payload, settings.sekolah);
    showToast('Cadangan data sistem (JSON) berhasil diunduh.', 'success');
  }, [students, attendance, journals, academicYears, settings, gradeSheets, teachingSchedules, announcements, showToast]);

  const restoreFullBackup = useCallback(async (payload: FullBackupPayload, mode: 'overwrite' | 'merge'): Promise<{ success: boolean; message: string }> => {
    try {
      if (!payload || !payload.data) {
        throw new Error('Format data cadangan tidak lengkap.');
      }

      const incomingStudents: Student[] = Array.isArray(payload.data.students) ? payload.data.students : [];
      const incomingAttendance: AttendanceRecord[] = Array.isArray(payload.data.attendance) ? payload.data.attendance : [];
      const incomingJournals: TeachingJournal[] = Array.isArray(payload.data.journals) ? payload.data.journals : [];
      const incomingAcademicYears: AcademicYear[] = Array.isArray(payload.data.academicYears) ? payload.data.academicYears : [];
      const incomingGradeSheets: ClassGradeSheet[] = Array.isArray(payload.data.gradeSheets) ? payload.data.gradeSheets : [];
      const incomingSchedules: TeachingScheduleItem[] = Array.isArray(payload.data.teachingSchedules) ? payload.data.teachingSchedules : [];
      const incomingAnnouncements: Announcement[] = Array.isArray(payload.data.announcements) ? payload.data.announcements : [];
      const incomingSettings: AppSettings = payload.data.settings || DEFAULT_SETTINGS;

      let finalStudents: Student[] = [];
      let finalAttendance: AttendanceRecord[] = [];
      let finalJournals: TeachingJournal[] = [];
      let finalAcademicYears: AcademicYear[] = [];
      let finalGradeSheets: ClassGradeSheet[] = [];
      let finalSchedules: TeachingScheduleItem[] = [];
      let finalAnnouncements: Announcement[] = [];
      let finalSettings: AppSettings = settings;

      if (mode === 'overwrite') {
        finalStudents = sortStudents(incomingStudents);
        finalAttendance = incomingAttendance;
        finalJournals = incomingJournals;
        finalAcademicYears = incomingAcademicYears.length > 0 ? incomingAcademicYears : INITIAL_ACADEMIC_YEARS;
        finalGradeSheets = incomingGradeSheets;
        finalSchedules = incomingSchedules.length > 0 ? incomingSchedules : INITIAL_TEACHING_SCHEDULES;
        finalAnnouncements = incomingAnnouncements.length > 0 ? incomingAnnouncements : INITIAL_ANNOUNCEMENTS;
        finalSettings = { ...DEFAULT_SETTINGS, ...incomingSettings };
      } else {
        // Mode 'merge'
        const studentMap = new Map<string, Student>();
        students.forEach(s => studentMap.set(s.nisn || s.id, s));
        incomingStudents.forEach(s => studentMap.set(s.nisn || s.id, s));
        finalStudents = sortStudents(Array.from(studentMap.values()));

        const attMap = new Map<string, AttendanceRecord>();
        attendance.forEach(a => attMap.set(a.id || `${a.nisn}-${a.date}`, a));
        incomingAttendance.forEach(a => attMap.set(a.id || `${a.nisn}-${a.date}`, a));
        finalAttendance = Array.from(attMap.values()).sort((a, b) => (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time));

        const jrnMap = new Map<string, TeachingJournal>();
        journals.forEach(j => jrnMap.set(j.id, j));
        incomingJournals.forEach(j => jrnMap.set(j.id, j));
        finalJournals = Array.from(jrnMap.values()).sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));

        const ayMap = new Map<string, AcademicYear>();
        academicYears.forEach(ay => ayMap.set(ay.id || ay.name, ay));
        incomingAcademicYears.forEach(ay => ayMap.set(ay.id || ay.name, ay));
        finalAcademicYears = Array.from(ayMap.values()).sort((a, b) => b.name.localeCompare(a.name));

        const gsMap = new Map<string, ClassGradeSheet>();
        gradeSheets.forEach(g => gsMap.set(g.id || `${g.kelas}-${g.semester}-${g.tahunAjaran}`, g));
        incomingGradeSheets.forEach(g => gsMap.set(g.id || `${g.kelas}-${g.semester}-${g.tahunAjaran}`, g));
        finalGradeSheets = Array.from(gsMap.values());

        const schMap = new Map<string, TeachingScheduleItem>();
        teachingSchedules.forEach(s => schMap.set(s.id || `${s.day}-${s.jamKe}-${s.kelas}`, s));
        incomingSchedules.forEach(s => schMap.set(s.id || `${s.day}-${s.jamKe}-${s.kelas}`, s));
        finalSchedules = Array.from(schMap.values()).sort((a, b) => (a.dayIndex - b.dayIndex) || a.startTime.localeCompare(b.startTime));

        const annMap = new Map<string, Announcement>();
        announcements.forEach(an => annMap.set(an.id, an));
        incomingAnnouncements.forEach(an => annMap.set(an.id, an));
        finalAnnouncements = Array.from(annMap.values()).sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));

        finalSettings = { ...settings, ...incomingSettings };
      }

      // 1. Perbarui state lokal React
      setStudents(finalStudents);
      setAttendance(finalAttendance);
      setJournals(finalJournals);
      setAcademicYears(finalAcademicYears);
      setGradeSheets(finalGradeSheets);
      setTeachingSchedules(finalSchedules);
      setAnnouncements(finalAnnouncements);
      setSettings(finalSettings);

      // 2. Perbarui LocalStorage
      try {
        localStorage.setItem('qr_presensi_students', JSON.stringify(finalStudents));
        localStorage.setItem('qr_presensi_attendance', JSON.stringify(finalAttendance));
        localStorage.setItem('qr_presensi_journals', JSON.stringify(finalJournals));
        localStorage.setItem('qr_presensi_academic_years', JSON.stringify(finalAcademicYears));
        localStorage.setItem('qr_presensi_grade_sheets_all', JSON.stringify(finalGradeSheets));
        localStorage.setItem('qr_presensi_teaching_schedules', JSON.stringify(finalSchedules));
        localStorage.setItem('qr_presensi_announcements', JSON.stringify(finalAnnouncements));
        localStorage.setItem('qr_presensi_settings', JSON.stringify(finalSettings));
      } catch (e) {
        console.warn('LocalStorage save warning during restore:', e);
      }

      // 3. Safe chunked batch commit ke Firestore
      try {
        await executeChunkedBatch(finalStudents, (batch, st) => {
          batch.set(doc(db, 'students', st.id), sanitizeForFirestore(st));
        });

        await executeChunkedBatch(finalAttendance.slice(0, 500), (batch, att) => {
          batch.set(doc(db, 'attendance', att.id), sanitizeForFirestore(att));
        });

        await executeChunkedBatch(finalJournals, (batch, jrn) => {
          batch.set(doc(db, 'journals', jrn.id), sanitizeForFirestore(jrn));
        });

        await executeChunkedBatch(finalAcademicYears, (batch, ay) => {
          batch.set(doc(db, 'academic_years', ay.id), sanitizeForFirestore(ay));
        });

        await executeChunkedBatch(finalGradeSheets, (batch, gs) => {
          const docId = gs.id || getGradeSheetDocId(gs.kelas, gs.semester, gs.tahunAjaran);
          batch.set(doc(db, 'gradeSheets', docId), deepSanitizeForFirestore(gs));
        });

        await executeChunkedBatch(finalSchedules, (batch, sch) => {
          batch.set(doc(db, 'teaching_schedules', sch.id), sanitizeForFirestore(sch));
        });

        await executeChunkedBatch(finalAnnouncements, (batch, ann) => {
          batch.set(doc(db, 'announcements', ann.id), sanitizeForFirestore(ann));
        });

        await safeFirestoreWrite(() => setDoc(doc(db, 'settings', 'app_settings'), sanitizeForFirestore(finalSettings)), OperationType.WRITE, 'settings/app_settings');
      } catch (fbErr) {
        console.warn('Firestore restore batch warning (offline or permissions):', fbErr);
      }

      syncStudentsToSheets(finalStudents);
      syncSettingsToSheets(finalSettings);

      const msg = mode === 'overwrite'
        ? `Pemulihan selesai! ${finalStudents.length} siswa, ${finalAttendance.length} log presensi, ${finalJournals.length} jurnal, ${finalGradeSheets.length} rekap nilai, ${finalAnnouncements.length} pengumuman berhasil dipulihkan.`
        : `Penggabungan selesai! Total kini ${finalStudents.length} siswa, ${finalAttendance.length} log presensi, ${finalJournals.length} jurnal, ${finalGradeSheets.length} rekap nilai, ${finalAnnouncements.length} pengumuman aktif.`;

      showToast(msg, 'success');
      return { success: true, message: msg };
    } catch (err: any) {
      const errMsg = `Gagal memulihkan cadangan: ${err?.message || 'Terjadi kesalahan'}`;
      showToast(errMsg, 'error');
      return { success: false, message: errMsg };
    }
  }, [students, attendance, journals, academicYears, gradeSheets, teachingSchedules, announcements, settings, showToast, syncStudentsToSheets, syncSettingsToSheets]);

  const resetToSampleData = useCallback(() => {
    setStudents(sortStudents(INITIAL_STUDENTS));
    const sampleAtt = generateSampleAttendance(INITIAL_STUDENTS, getTodayString());
    setAttendance(sampleAtt);
    showToast('Data telah direset ke data contoh (dummy).', 'info');
  }, [showToast]);

  return (
    <AppContext.Provider value={{
      today,
      students,
      attendance,
      journals,
      academicYears,
      activeAcademicYear,
      settings,
      gradeSheets,
      getGradeSheet,
      saveGradeSheet,
      activeTab,
      setActiveTab,
      activeSubTabs,
      getActiveSubTab,
      setActiveSubTab,
      navigateToSubTab,
      cameraModalOpen,
      setCameraModalOpen,
      isKioskMode,
      setIsKioskMode,
      filterDate,
      setFilterDate,
      toast,
      showToast,
      markAttendanceByNisn,
      resetAttendanceByNisnAndDate,
      addStudent,
      addStudentsBulk,
      updateStudent,
      deleteStudent,
      deleteStudentsBulk,
      deleteAttendance,
      clearAttendanceForClassAndDate,
      updateAttendanceStatus,
      editAttendanceRecord,
      addJournal,
      updateJournal,
      deleteJournal,
      syncJournalAttendanceForClassAndDate,
      syncAllJournalsWithAttendance,
      teachingSchedules,
      addTeachingSchedule,
      updateTeachingSchedule,
      deleteTeachingSchedule,
      resetTeachingSchedules,
      addAcademicYear,
      updateAcademicYear,
      deleteAcademicYear,
      setActiveAcademicYear,
      toggleArchiveAcademicYear,
      targetJournalClass,
      setTargetJournalClass,
      openJournalForClass,
      updateSettings,
      setThemeMode,
      setThemeAccent,
      setThemeFont,
      setThemeFontSize,
      effectiveTheme,
      resetToSampleData,
      announcements,
      addAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      markAnnouncementAsRead,
      getUnreadAnnouncementsForStudent,
      exportBackupJson,
      restoreFullBackup,
      autoSnapshot,
      refreshAutoSnapshot,
      syncRecordToSheets,
      syncStudentsToSheets,
      syncSettingsToSheets,
      pullDataFromSheets,
      isPullingFromSheets,
      selectedStudentForCard,
      setSelectedStudentForCard,
      isLoggedIn,
      login,
      verify2FA,
      cancel2FA,
      is2FAPending,
      logout,
      loggedInStudent,
      isStudentLoggedIn,
      studentLogin,
      studentLogout,
      updateStudentProfile,
      resetStudentPin
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
