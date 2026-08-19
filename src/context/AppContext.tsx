import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Student, AttendanceRecord, AppSettings, TabType, ToastNotification, AttendanceStatus, TeachingJournal, ThemeMode, ThemeAccent, AcademicYear, ClassGradeSheet } from '../types';
import { INITIAL_STUDENTS, generateSampleAttendance, INITIAL_ACADEMIC_YEARS } from '../utils/sampleData';
import { audioFeedback } from '../utils/audio';
import { cleanDateFormat, cleanTimeFormat, sortStudents } from '../utils/formatters';
import { 
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  FullBackupPayload, createBackupPayload, downloadBackupJson, 
  saveAutoSnapshot, getAutoSnapshot 
} from '../utils/backupRestore';

const generateId = () => 'id-' + Math.random().toString(36).substring(2, 9);
const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  deleteAttendance: (id: string) => void;
  updateAttendanceStatus: (id: string, newStatus: AttendanceStatus, note?: string) => void;
  editAttendanceRecord: (id: string, updatedFields: Partial<AttendanceRecord>) => void;
  addJournal: (newJournal: Omit<TeachingJournal, 'id'>) => TeachingJournal;
  updateJournal: (id: string, updatedFields: Partial<TeachingJournal>) => void;
  deleteJournal: (id: string) => void;
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
      const currentRealToday = getTodayString();
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
        if (Array.isArray(parsed)) return sortStudents(parsed);
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
        if (Array.isArray(parsed)) return parsed;
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
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse journals from localStorage:', e);
    }
    return [
      {
        id: 'jrn-1',
        date: today,
        day: 'Selasa',
        kelas: 'X IPA 1',
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

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const saved = localStorage.getItem('qr_presensi_active_tab') as TabType;
      const validTabs: TabType[] = ['Dashboard', 'Siswa', 'Kartu QR', 'Riwayat', 'Jurnal Mengajar', 'Penilaian Harian', 'Pengaturan'];
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

  // Apply theme attributes to document element
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-accent', themeAccent);
    if (effectiveTheme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
    }
  }, [effectiveTheme, themeAccent]);

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

  // ---------------------------------------------------------------------------
  // FIREBASE FIRESTORE REAL-TIME SYNCHRONIZATION LISTENERS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // 1. Students Real-time Listener
    const unsubStudents = onSnapshot(collection(db, 'students'), snapshot => {
      if (snapshot.empty) {
        INITIAL_STUDENTS.forEach(st => {
          setDoc(doc(db, 'students', st.id), sanitizeForFirestore(st)).catch(console.error);
        });
      } else {
        const loaded: Student[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        setStudents(sortStudents(loaded));
      }
    }, err => console.error('Firestore students sync error:', err));

    // 2. Attendance Real-time Listener
    const unsubAttendance = onSnapshot(collection(db, 'attendance'), snapshot => {
      if (snapshot.empty) {
        const samples = generateSampleAttendance(INITIAL_STUDENTS, getTodayString());
        samples.forEach(att => {
          setDoc(doc(db, 'attendance', att.id), sanitizeForFirestore(att)).catch(console.error);
        });
      } else {
        const loaded: AttendanceRecord[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
        loaded.sort((a, b) => (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time));
        setAttendance(loaded);
      }
    }, err => console.error('Firestore attendance sync error:', err));

    // 3. Teaching Journals Real-time Listener
    const unsubJournals = onSnapshot(collection(db, 'journals'), snapshot => {
      if (!snapshot.empty) {
        const loaded: TeachingJournal[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TeachingJournal));
        loaded.sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));
        setJournals(loaded);
      }
    }, err => console.error('Firestore journals sync error:', err));

    // 4. App Settings Real-time Listener
    const unsubSettings = onSnapshot(doc(db, 'settings', 'app_settings'), snapshot => {
      if (snapshot.exists()) {
        setSettings(prev => ({ ...prev, ...snapshot.data() }));
      } else {
        setDoc(doc(db, 'settings', 'app_settings'), sanitizeForFirestore(DEFAULT_SETTINGS)).catch(console.error);
      }
    }, err => console.error('Firestore settings sync error:', err));

    // 5. Academic Years Real-time Listener
    const unsubAcademicYears = onSnapshot(collection(db, 'academic_years'), snapshot => {
      if (!snapshot.empty) {
        const loaded: AcademicYear[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AcademicYear));
        loaded.sort((a, b) => b.name.localeCompare(a.name));
        setAcademicYears(loaded);
      } else {
        INITIAL_ACADEMIC_YEARS.forEach(ay => {
          setDoc(doc(db, 'academic_years', ay.id), sanitizeForFirestore(ay)).catch(console.error);
        });
      }
    }, err => console.error('Firestore academic years sync error:', err));

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
    }, err => console.error('Firestore gradeSheets sync error:', err));

    return () => {
      unsubStudents();
      unsubAttendance();
      unsubJournals();
      unsubSettings();
      unsubAcademicYears();
      unsubGradeSheets();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('qr_presensi_active_tab', activeTab);
    } catch (e) {}
  }, [activeTab]);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem('qr_presensi_auth') || sessionStorage.getItem('qr_presensi_auth');
      return savedAuth === 'true';
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
        localStorage.setItem('qr_presensi_auth', 'true');
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
        localStorage.setItem('qr_presensi_auth', 'true');
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
        localStorage.setItem('qr_presensi_auth', 'true');
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

    const targetDate = (customDate && customDate.trim()) ? customDate.trim() : getTodayString();
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

    const now = new Date();
    let timeString = now.toTimeString().split(' ')[0]; // HH:mm:ss

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

      setDoc(doc(db, 'attendance', deterministicId), sanitizeForFirestore(updatedRecord)).catch(console.error);
      syncRecordToSheets(updatedRecord);

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
    setDoc(doc(db, 'attendance', deterministicId), sanitizeForFirestore(newRecord)).catch(console.error);
    syncRecordToSheets(newRecord);

    const successMsg = `Berhasil! ${student.name} (${student.class}) ditandai ${status.toUpperCase()} [${targetDate} ${timeString}]`;
    showToast(successMsg, status === 'Terlambat' ? 'warning' : 'success');

    return { success: true, isDuplicate: false, message: successMsg, student, record: newRecord };
  }, [students, attendance, settings.jamTerlambat, settings.jamMasuk, showToast, syncRecordToSheets]);

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
      setAttendance(prev => prev.filter(a => a.id !== record.id && a.id !== deterministicId && !((a.studentId === student.id || a.nisn === student.nisn) && a.date === targetDate)));
      deleteDoc(doc(db, 'attendance', record.id)).catch(console.error);
      deleteDoc(doc(db, 'attendance', deterministicId)).catch(console.error);

      const msg = `Presensi ${student.name} (${student.class}) tanggal ${targetDate} berhasil di-reset ke BELUM ABSEN.`;
      showToast(msg, 'info');
      return { success: true, message: msg };
    } else {
      const msg = `${student.name} (${student.class}) sudah berstatus BELUM ABSEN pada tanggal ${targetDate}.`;
      showToast(msg, 'info');
      return { success: true, message: msg };
    }
  }, [students, attendance, deleteRecordFromSheets, showToast]);

  const addStudent = useCallback((newStudent: Omit<Student, 'id'>): Student => {
    const student: Student = {
      ...newStudent,
      id: 'std-' + Math.random().toString(36).substring(2, 8)
    };
    setStudents(prev => sortStudents([student, ...prev]));
    setDoc(doc(db, 'students', student.id), sanitizeForFirestore(student)).catch(console.error);
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
    const batch = writeBatch(db);
    prepared.forEach(st => {
      batch.set(doc(db, 'students', st.id), sanitizeForFirestore(st));
    });
    batch.commit().catch(console.error);
    syncStudentsToSheets([...prepared, ...students]);
    showToast(`Berhasil mengimpor ${prepared.length} data siswa.`, 'success');
    return prepared.length;
  }, [students, showToast, syncStudentsToSheets]);

  const updateStudent = useCallback((id: string, updatedFields: Partial<Student>) => {
    setStudents(prev => sortStudents(prev.map(s => s.id === id ? { ...s, ...updatedFields } : s)));
    updateDoc(doc(db, 'students', id), sanitizeForFirestore(updatedFields)).catch(console.error);
    syncStudentsToSheets(students.map(s => s.id === id ? { ...s, ...updatedFields } : s));
    showToast('Data siswa berhasil diperbarui.', 'success');
  }, [students, showToast, syncStudentsToSheets]);

  const deleteStudent = useCallback((id: string) => {
    const target = students.find(s => s.id === id);
    if (target) {
      deleteStudentFromSheets(target);
      setAttendance(prev => prev.filter(a => a.studentId !== id && a.nisn !== target.nisn));
    }
    setStudents(prev => prev.filter(s => s.id !== id));
    deleteDoc(doc(db, 'students', id)).catch(console.error);
    syncStudentsToSheets(students.filter(s => s.id !== id));
    showToast(`Data siswa ${target ? target.name : ''} & riwayat presensinya berhasil dihapus.`, 'info');
  }, [students, deleteStudentFromSheets, syncStudentsToSheets, showToast]);

  const deleteAttendance = useCallback((id: string) => {
    const target = attendance.find(a => a.id === id);
    if (target) {
      deleteRecordFromSheets(target);
    }
    setAttendance(prev => prev.filter(a => a.id !== id));
    deleteDoc(doc(db, 'attendance', id)).catch(console.error);
    showToast('Catatan presensi berhasil dihapus.', 'info');
  }, [attendance, deleteRecordFromSheets, showToast]);

  const updateAttendanceStatus = useCallback((id: string, newStatus: AttendanceStatus, note?: string) => {
    let updatedRecord: AttendanceRecord | null = null;
    setAttendance(prev => prev.map(a => {
      if (a.id === id) {
        updatedRecord = { ...a, status: newStatus, note: note !== undefined ? note : a.note };
        return updatedRecord;
      }
      return a;
    }));
    if (updatedRecord) {
      updateDoc(doc(db, 'attendance', id), sanitizeForFirestore({ status: newStatus, note: note || '' })).catch(console.error);
      syncRecordToSheets(updatedRecord);
    }
    showToast('Status presensi telah diperbarui & disinkronkan.', 'success');
  }, [syncRecordToSheets, showToast]);

  const editAttendanceRecord = useCallback((id: string, updatedFields: Partial<AttendanceRecord>) => {
    let updatedRecord: AttendanceRecord | null = null;
    setAttendance(prev => prev.map(a => {
      if (a.id === id) {
        updatedRecord = { ...a, ...updatedFields };
        return updatedRecord;
      }
      return a;
    }));
    if (updatedRecord) {
      updateDoc(doc(db, 'attendance', id), sanitizeForFirestore(updatedFields)).catch(console.error);
      syncRecordToSheets(updatedRecord);
    }
    showToast('Data riwayat presensi berhasil diperbarui & disinkronkan.', 'success');
  }, [syncRecordToSheets, showToast]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if ((!updated.spreadsheetUrl || !updated.spreadsheetUrl.trim()) && prev.spreadsheetUrl) {
        updated.spreadsheetUrl = prev.spreadsheetUrl;
      }
      try {
        localStorage.setItem('qr_presensi_settings', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save settings to localStorage:', e);
      }
      setDoc(doc(db, 'settings', 'app_settings'), sanitizeForFirestore(updated), { merge: true }).catch(console.error);
      syncSettingsToSheets(updated);
      return updated;
    });
    showToast('Pengaturan aplikasi & profil guru berhasil disimpan & disinkronkan.', 'success');
  }, [showToast, syncSettingsToSheets]);

  const addJournal = useCallback((newJournal: Omit<TeachingJournal, 'id'>): TeachingJournal => {
    const journal: TeachingJournal = {
      ...newJournal,
      id: 'jrn-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString()
    };
    setJournals(prev => [journal, ...prev]);
    setDoc(doc(db, 'journals', journal.id), sanitizeForFirestore(journal)).catch(console.error);
    showToast('Jurnal mengajar berhasil ditambahkan.', 'success');
    return journal;
  }, [showToast]);

  const updateJournal = useCallback((id: string, updatedFields: Partial<TeachingJournal>) => {
    setJournals(prev => prev.map(j => j.id === id ? { ...j, ...updatedFields } : j));
    updateDoc(doc(db, 'journals', id), sanitizeForFirestore(updatedFields)).catch(console.error);
    showToast('Jurnal mengajar berhasil diperbarui.', 'success');
  }, [showToast]);

  const deleteJournal = useCallback((id: string) => {
    setJournals(prev => prev.filter(j => j.id !== id));
    deleteDoc(doc(db, 'journals', id)).catch(console.error);
    showToast('Jurnal mengajar berhasil dihapus.', 'info');
  }, [showToast]);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    updateSettings({ themeMode: newMode });
  }, [updateSettings]);

  const setThemeAccent = useCallback((newAccent: ThemeAccent) => {
    updateSettings({ themeAccent: newAccent });
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

    setDoc(doc(db, 'academic_years', created.id), sanitizeForFirestore(created)).catch(console.error);
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

    updateDoc(doc(db, 'academic_years', id), sanitizeForFirestore(updatedFields)).catch(console.error);
    showToast('Tahun Ajaran berhasil diperbarui.', 'success');
  }, [showToast, updateSettings]);

  const deleteAcademicYear = useCallback((id: string) => {
    const target = academicYears.find(y => y.id === id);
    if (target?.isCurrent) {
      showToast('Tidak dapat menghapus Tahun Ajaran yang sedang aktif saat ini. Silakan aktifkan tahun ajaran lain terlebih dahulu.', 'warning');
      return;
    }
    setAcademicYears(prev => prev.filter(y => y.id !== id));
    deleteDoc(doc(db, 'academic_years', id)).catch(console.error);
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

    academicYears.forEach(y => {
      const isNowCurrent = y.id === id;
      const isNowArchived = isNowCurrent ? false : y.isArchived;
      updateDoc(doc(db, 'academic_years', y.id), { isCurrent: isNowCurrent, isArchived: isNowArchived }).catch(console.error);
    });

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
    updateDoc(doc(db, 'academic_years', id), { isArchived: nextArchived }).catch(console.error);
    
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

      // 3. Persist to Firestore Cloud
      await setDoc(doc(db, 'gradeSheets', docId), sanitized);
      if (docId !== legacyKey) {
        try {
          await setDoc(doc(db, 'gradeSheets', legacyKey), sanitized);
        } catch (e) {}
      }

      showToast(`Data Nilai Harian Kelas ${gradeSheet.kelas} tersimpan & disinkronkan ke seluruh perangkat!`, 'success');
      return { success: true, message: 'Berhasil disimpan ke Cloud' };
    } catch (err: any) {
      console.error('Failed to save gradeSheet to Firestore:', err);
      showToast(`Gagal menyimpan data nilai ke Cloud: ${err?.message || 'Error'}`, 'error');
      return { success: false, message: err?.message || 'Gagal menyimpan nilai' };
    }
  }, [showToast]);

  const exportBackupJson = useCallback(() => {
    const payload = createBackupPayload(students, attendance, journals, academicYears, settings, gradeSheets);
    downloadBackupJson(payload, settings.sekolah);
    showToast('Cadangan data sistem (JSON) berhasil diunduh.', 'success');
  }, [students, attendance, journals, academicYears, settings, gradeSheets, showToast]);

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
      const incomingSettings: AppSettings = payload.data.settings || DEFAULT_SETTINGS;

      let finalStudents: Student[] = [];
      let finalAttendance: AttendanceRecord[] = [];
      let finalJournals: TeachingJournal[] = [];
      let finalAcademicYears: AcademicYear[] = [];
      let finalGradeSheets: ClassGradeSheet[] = [];
      let finalSettings: AppSettings = settings;

      if (mode === 'overwrite') {
        finalStudents = sortStudents(incomingStudents);
        finalAttendance = incomingAttendance;
        finalJournals = incomingJournals;
        finalAcademicYears = incomingAcademicYears.length > 0 ? incomingAcademicYears : INITIAL_ACADEMIC_YEARS;
        finalGradeSheets = incomingGradeSheets;
        finalSettings = { ...DEFAULT_SETTINGS, ...incomingSettings };
      } else {
        // Mode 'merge': gabungkan data siswa berdasarkan NISN / ID unik
        const studentMap = new Map<string, Student>();
        students.forEach(s => studentMap.set(s.nisn || s.id, s));
        incomingStudents.forEach(s => studentMap.set(s.nisn || s.id, s));
        finalStudents = sortStudents(Array.from(studentMap.values()));

        // Gabungkan data presensi berdasarkan NISN + Tanggal
        const attMap = new Map<string, AttendanceRecord>();
        attendance.forEach(a => attMap.set(a.id || `${a.nisn}-${a.date}`, a));
        incomingAttendance.forEach(a => attMap.set(a.id || `${a.nisn}-${a.date}`, a));
        finalAttendance = Array.from(attMap.values()).sort((a, b) => (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time));

        // Gabungkan data jurnal mengajar berdasarkan ID
        const jrnMap = new Map<string, TeachingJournal>();
        journals.forEach(j => jrnMap.set(j.id, j));
        incomingJournals.forEach(j => jrnMap.set(j.id, j));
        finalJournals = Array.from(jrnMap.values()).sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));

        // Gabungkan tahun ajaran
        const ayMap = new Map<string, AcademicYear>();
        academicYears.forEach(ay => ayMap.set(ay.id || ay.name, ay));
        incomingAcademicYears.forEach(ay => ayMap.set(ay.id || ay.name, ay));
        finalAcademicYears = Array.from(ayMap.values()).sort((a, b) => b.name.localeCompare(a.name));

        // Gabungkan data nilai
        const gsMap = new Map<string, ClassGradeSheet>();
        gradeSheets.forEach(g => gsMap.set(g.id || `${g.kelas}-${g.semester}-${g.tahunAjaran}`, g));
        incomingGradeSheets.forEach(g => gsMap.set(g.id || `${g.kelas}-${g.semester}-${g.tahunAjaran}`, g));
        finalGradeSheets = Array.from(gsMap.values());

        finalSettings = { ...settings, ...incomingSettings };
      }

      // 1. Perbarui state lokal React
      setStudents(finalStudents);
      setAttendance(finalAttendance);
      setJournals(finalJournals);
      setAcademicYears(finalAcademicYears);
      setGradeSheets(finalGradeSheets);
      setSettings(finalSettings);

      // 2. Perbarui LocalStorage
      try {
        localStorage.setItem('qr_presensi_students', JSON.stringify(finalStudents));
        localStorage.setItem('qr_presensi_attendance', JSON.stringify(finalAttendance));
        localStorage.setItem('qr_presensi_journals', JSON.stringify(finalJournals));
        localStorage.setItem('qr_presensi_academic_years', JSON.stringify(finalAcademicYears));
        localStorage.setItem('qr_presensi_grade_sheets_all', JSON.stringify(finalGradeSheets));
        localStorage.setItem('qr_presensi_settings', JSON.stringify(finalSettings));
      } catch (e) {
        console.warn('LocalStorage save warning during restore:', e);
      }

      // 3. Batch commit ke Firestore
      try {
        const batch = writeBatch(db);
        
        // Simpan Siswa
        finalStudents.forEach(st => {
          batch.set(doc(db, 'students', st.id), sanitizeForFirestore(st));
        });

        // Simpan Presensi
        finalAttendance.slice(0, 450).forEach(att => {
          batch.set(doc(db, 'attendance', att.id), sanitizeForFirestore(att));
        });

        // Simpan Jurnal
        finalJournals.forEach(jrn => {
          batch.set(doc(db, 'journals', jrn.id), sanitizeForFirestore(jrn));
        });

        // Simpan Tahun Ajaran
        finalAcademicYears.forEach(ay => {
          batch.set(doc(db, 'academic_years', ay.id), sanitizeForFirestore(ay));
        });

        // Simpan Data Nilai
        finalGradeSheets.forEach(gs => {
          const docId = gs.id || getGradeSheetDocId(gs.kelas, gs.semester, gs.tahunAjaran);
          batch.set(doc(db, 'gradeSheets', docId), deepSanitizeForFirestore(gs));
        });

        // Simpan Settings
        batch.set(doc(db, 'settings', 'app_settings'), sanitizeForFirestore(finalSettings));

        await batch.commit();
      } catch (fbErr) {
        console.warn('Firestore restore batch warning (offline or permissions):', fbErr);
      }

      // 4. Sinkronisasi ke Google Sheets jika terhubung
      syncStudentsToSheets(finalStudents);
      syncSettingsToSheets(finalSettings);

      const msg = mode === 'overwrite'
        ? `Pemulihan selesai! ${finalStudents.length} siswa, ${finalAttendance.length} log presensi, ${finalJournals.length} jurnal, ${finalGradeSheets.length} rekap nilai berhasil dipulihkan.`
        : `Penggabungan selesai! Total kini ${finalStudents.length} siswa, ${finalAttendance.length} log presensi, ${finalJournals.length} jurnal, ${finalGradeSheets.length} rekap nilai aktif.`;

      showToast(msg, 'success');
      return { success: true, message: msg };
    } catch (err: any) {
      const errMsg = `Gagal memulihkan cadangan: ${err?.message || 'Terjadi kesalahan'}`;
      showToast(errMsg, 'error');
      return { success: false, message: errMsg };
    }
  }, [students, attendance, journals, academicYears, gradeSheets, settings, showToast, syncStudentsToSheets, syncSettingsToSheets]);

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
      deleteAttendance,
      updateAttendanceStatus,
      editAttendanceRecord,
      addJournal,
      updateJournal,
      deleteJournal,
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
      effectiveTheme,
      resetToSampleData,
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
      logout
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
