import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Student, AttendanceRecord, AppSettings, TabType, ToastNotification, AttendanceStatus } from '../types';
import { INITIAL_STUDENTS, generateSampleAttendance } from '../utils/sampleData';
import { audioFeedback } from '../utils/audio';

const generateId = () => 'id-' + Math.random().toString(36).substring(2, 9);
const getTodayString = () => new Date().toISOString().split('T')[0];

interface AppContextType {
  students: Student[];
  attendance: AttendanceRecord[];
  settings: AppSettings;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  cameraModalOpen: boolean;
  setCameraModalOpen: (open: boolean) => void;
  filterDate: string;
  setFilterDate: (date: string) => void;
  toast: ToastNotification | null;
  showToast: (message: string, type?: ToastNotification['type']) => void;
  markAttendanceByNisn: (nisn: string, method?: 'QR Code' | 'Manual', forceStatus?: AttendanceStatus, note?: string) => { success: boolean; message: string; student?: Student; record?: AttendanceRecord };
  addStudent: (newStudent: Omit<Student, 'id'>) => Student;
  updateStudent: (id: string, updated: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  deleteAttendance: (id: string) => void;
  updateAttendanceStatus: (id: string, newStatus: AttendanceStatus, note?: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetToSampleData: () => void;
  syncRecordToSheets: (record: AttendanceRecord) => Promise<boolean>;
  selectedStudentForCard: Student | null;
  setSelectedStudentForCard: (student: Student | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
  sekolah: 'SMA Negeri 1 Kita',
  npsn: '20261988',
  alamat: 'Jl. Pendidikan No. 45, Kota Edukasi',
  jamMasuk: '07:00',
  jamTerlambat: '07:15',
  spreadsheetUrl: '',
  enableSound: true,
  logoUrl: ''
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const today = getTodayString();

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('qr_presensi_students');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse students from localStorage:', e);
    }
    return INITIAL_STUDENTS;
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

  const [activeTab, setActiveTab] = useState<TabType>('Dashboard');
  const [cameraModalOpen, setCameraModalOpen] = useState<boolean>(false);
  const [filterDate, setFilterDate] = useState<string>(today);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('qr_presensi_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('qr_presensi_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('qr_presensi_settings', JSON.stringify(settings));
  }, [settings]);

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

  const markAttendanceByNisn = useCallback((
    nisnInput: string,
    method: 'QR Code' | 'Manual' = 'QR Code',
    forceStatus?: AttendanceStatus,
    note?: string
  ) => {
    const cleanedNisn = nisnInput.trim();
    const student = students.find(s => s.nisn === cleanedNisn || s.id === cleanedNisn);

    if (!student) {
      const msg = `NISN / Kode "${cleanedNisn}" tidak ditemukan dalam data siswa.`;
      showToast(msg, 'error');
      return { success: false, message: msg };
    }

    const currentDate = getTodayString();
    const existingIndex = attendance.findIndex(a => a.studentId === student.id && a.date === currentDate);

    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0]; // HH:mm:ss

    // Calculate Hadir vs Terlambat status automatically if forceStatus is not provided
    let status: AttendanceStatus = forceStatus || 'Hadir';
    if (!forceStatus) {
      const [limitHour, limitMin] = settings.jamTerlambat.split(':').map(Number);
      const limitDate = new Date();
      limitDate.setHours(limitHour, limitMin, 0, 0);

      if (now > limitDate) {
        status = 'Terlambat';
      }
    }

    if (existingIndex >= 0) {
      const existing = attendance[existingIndex];
      // Updated message for duplicate scan
      const msg = `Siswa ${student.name} (${student.class}) SUDAH dikonfirmasi absen hari ini (${existing.status} jam ${existing.time}).`;
      showToast(msg, 'warning');
      return { success: false, message: msg, student, record: existing };
    }

    const newRecord: AttendanceRecord = {
      id: generateId(),
      studentId: student.id,
      studentName: student.name,
      nisn: student.nisn,
      class: student.class,
      date: currentDate,
      time: timeString,
      status,
      method,
      note: note || (status === 'Terlambat' ? 'Terlambat masuk sekolah' : undefined)
    };

    setAttendance(prev => [newRecord, ...prev]);
    syncRecordToSheets(newRecord);

    const successMsg = `Berhasil! ${student.name} (${student.class}) ditandai ${status.toUpperCase()} [${timeString}]`;
    showToast(successMsg, status === 'Terlambat' ? 'warning' : 'success');

    return { success: true, message: successMsg, student, record: newRecord };
  }, [students, attendance, settings.jamTerlambat, showToast, syncRecordToSheets]);

  const addStudent = useCallback((newStudent: Omit<Student, 'id'>): Student => {
    const student: Student = {
      ...newStudent,
      id: 'std-' + Math.random().toString(36).substring(2, 8)
    };
    setStudents(prev => [student, ...prev]);
    showToast(`Siswa ${student.name} berhasil ditambahkan.`, 'success');
    return student;
  }, [showToast]);

  const updateStudent = useCallback((id: string, updated: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
    showToast('Data siswa berhasil diperbarui.', 'success');
  }, [showToast]);

  const deleteStudent = useCallback((id: string) => {
    const target = students.find(s => s.id === id);
    setStudents(prev => prev.filter(s => s.id !== id));
    showToast(`Data siswa ${target ? target.name : ''} telah dihapus.`, 'info');
  }, [students, showToast]);

  const deleteAttendance = useCallback((id: string) => {
    setAttendance(prev => prev.filter(a => a.id !== id));
    showToast('Catatan presensi berhasil dihapus.', 'info');
  }, [showToast]);

  const updateAttendanceStatus = useCallback((id: string, newStatus: AttendanceStatus, note?: string) => {
    setAttendance(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: newStatus, note: note !== undefined ? note : a.note };
      }
      return a;
    }));
    showToast('Status presensi telah diperbarui.', 'success');
  }, [showToast]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    showToast('Pengaturan aplikasi berhasil disimpan.', 'success');
  }, [showToast]);

  const resetToSampleData = useCallback(() => {
    setStudents(INITIAL_STUDENTS);
    const sampleAtt = generateSampleAttendance(INITIAL_STUDENTS, getTodayString());
    setAttendance(sampleAtt);
    showToast('Data telah direset ke data contoh (dummy).', 'info');
  }, [showToast]);

  return (
    <AppContext.Provider value={{
      students,
      attendance,
      settings,
      activeTab,
      setActiveTab,
      cameraModalOpen,
      setCameraModalOpen,
      filterDate,
      setFilterDate,
      toast,
      showToast,
      markAttendanceByNisn,
      addStudent,
      updateStudent,
      deleteStudent,
      deleteAttendance,
      updateAttendanceStatus,
      updateSettings,
      resetToSampleData,
      syncRecordToSheets,
      selectedStudentForCard,
      setSelectedStudentForCard
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
