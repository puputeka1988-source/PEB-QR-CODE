import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Student, AttendanceRecord, AppSettings, TabType, ToastNotification, AttendanceStatus } from '../types';
import { INITIAL_STUDENTS, generateSampleAttendance } from '../utils/sampleData';
import { audioFeedback } from '../utils/audio';

const generateId = () => 'id-' + Math.random().toString(36).substring(2, 9);
const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  addStudentsBulk: (newStudents: Omit<Student, 'id'>[]) => number;
  updateStudent: (id: string, updated: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  deleteAttendance: (id: string) => void;
  updateAttendanceStatus: (id: string, newStatus: AttendanceStatus, note?: string) => void;
  editAttendanceRecord: (id: string, updatedFields: Partial<AttendanceRecord>) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetToSampleData: () => void;
  syncRecordToSheets: (record: AttendanceRecord) => Promise<boolean>;
  syncStudentsToSheets: (students: Student[]) => Promise<boolean>;
  syncSettingsToSheets: (settings: AppSettings) => Promise<boolean>;
  pullDataFromSheets: (showNotification?: boolean) => Promise<boolean>;
  isPullingFromSheets: boolean;
  selectedStudentForCard: Student | null;
  setSelectedStudentForCard: (student: Student | null) => void;
  isLoggedIn: boolean;
  login: (u: string, p: string) => boolean;
  logout: () => void;
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
  logoUrl: '',
  adminUsername: 'admin',
  adminPassword: 'admin123',
  namaGuru: 'Ahmad Subagja, S.Kom',
  nip: '19880512 201503 1 004',
  mataPelajaran: 'Informatika & Pemrograman',
  jabatan: 'Guru Mata Pelajaran & Admin Presensi',
  guruPhone: '081234567890',
  guruPhotoUrl: '',
  guruBio: 'Pengampu mata pelajaran Informatika dan pengelola sistem presensi QR sekolah.'
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const today = getTodayString();

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('qr_presensi_students');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
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

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const saved = localStorage.getItem('qr_presensi_active_tab') as TabType;
      const validTabs: TabType[] = ['Dashboard', 'Siswa', 'Kartu QR', 'Riwayat', 'Integrasi Sheets', 'Pengaturan'];
      if (saved && validTabs.includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.error('Failed to parse activeTab from localStorage:', e);
    }
    return 'Dashboard';
  });

  const [cameraModalOpen, setCameraModalOpen] = useState<boolean>(false);
  const [filterDate, setFilterDate] = useState<string>(today);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);

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

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('qr_presensi_auth') === 'true' || sessionStorage.getItem('qr_presensi_auth') === 'true';
    } catch {
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

  const login = useCallback((u: string, p: string): boolean => {
    const validUsername = settings.adminUsername || 'admin';
    const validPassword = settings.adminPassword || 'admin123';

    if (u.trim() === validUsername && p === validPassword) {
      setIsLoggedIn(true);
      try {
        localStorage.setItem('qr_presensi_auth', 'true');
        sessionStorage.setItem('qr_presensi_auth', 'true');
      } catch (e) {
        console.error('Failed to set auth in storage', e);
      }
      showToast('Login berhasil! Selamat datang Administrator.', 'success');
      return true;
    } else {
      showToast('Username atau password salah!', 'error');
      return false;
    }
  }, [settings.adminUsername, settings.adminPassword, showToast]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
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
          const updatedAttendance: AttendanceRecord[] = json.data.map((item: any, idx: number) => {
            const student = studentList.find((s: Student) => s.nisn === item.nisn);
            let cleanDate = String(item.date || '').replace(/^'/, '').trim();
            if (cleanDate.includes('T')) cleanDate = cleanDate.split('T')[0];
            if (!cleanDate) cleanDate = today;

            const cleanNisn = String(item.nisn || '').replace(/^'/, '').trim();
            const recordId = item.id && !item.id.startsWith('id-') 
              ? item.id 
              : ('att-' + (cleanNisn || idx) + '-' + cleanDate);

            return {
              id: recordId,
              studentId: student ? student.id : '',
              nisn: cleanNisn,
              studentName: item.studentName || (student ? student.name : 'Siswa'),
              class: item.class || (student ? student.class : '-'),
              date: cleanDate,
              time: item.time || '00:00',
              status: (item.status as AttendanceStatus) || 'Hadir',
              method: (item.method as 'QR Code' | 'Manual') || 'QR Code',
              note: item.note || ''
            };
          });
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
          setSettings(prev => {
            const merged = { ...prev, ...json.settings };
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
    const existingIndex = attendance.findIndex(a => (a.studentId === student.id || (a.nisn && a.nisn === student.nisn)) && a.date === currentDate);

    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0]; // HH:mm:ss

    // Calculate Hadir vs Terlambat status automatically if forceStatus is not provided
    let status: AttendanceStatus = forceStatus || 'Hadir';
    if (!forceStatus) {
      // Prioritaskan settings.jamTerlambat (batas jam terlambat)
      const cutoffTime = (settings.jamTerlambat || settings.jamMasuk || '07:15').replace('.', ':');
      const [limitHour, limitMin] = cutoffTime.split(':').map(Number);
      const limitDate = new Date();
      limitDate.setHours(isNaN(limitHour) ? 7 : limitHour, isNaN(limitMin) ? 15 : limitMin, 0, 0);

      if (now > limitDate) {
        status = 'Terlambat';
      }
    }

    const deterministicId = `att-${student.nisn}-${currentDate}`;

    if (existingIndex >= 0) {
      const existing = attendance[existingIndex];
      const updatedRecord: AttendanceRecord = {
        ...existing,
        id: existing.id || deterministicId,
        time: timeString,
        status,
        method,
        note: note || (status === 'Terlambat' ? 'Terlambat masuk sekolah' : undefined)
      };

      setAttendance(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(a => a.id === existing.id || a.id === deterministicId);
        if (idx >= 0) {
          copy[idx] = updatedRecord;
        } else {
          copy.unshift(updatedRecord);
        }
        return copy;
      });

      syncRecordToSheets(updatedRecord);

      const updateMsg = `Presensi diperbarui! ${student.name} (${student.class}) ditandai ${status.toUpperCase()} [${timeString}]`;
      showToast(updateMsg, status === 'Terlambat' ? 'warning' : 'success');

      return { success: true, message: updateMsg, student, record: updatedRecord };
    }

    const newRecord: AttendanceRecord = {
      id: deterministicId,
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
  }, [students, attendance, settings.jamTerlambat, settings.jamMasuk, showToast, syncRecordToSheets]);

  const addStudent = useCallback((newStudent: Omit<Student, 'id'>): Student => {
    const student: Student = {
      ...newStudent,
      id: 'std-' + Math.random().toString(36).substring(2, 8)
    };
    setStudents(prev => {
      const updated = [student, ...prev];
      syncStudentsToSheets(updated);
      return updated;
    });
    showToast(`Siswa ${student.name} berhasil ditambahkan.`, 'success');
    return student;
  }, [showToast, syncStudentsToSheets]);

  const addStudentsBulk = useCallback((newStudents: Omit<Student, 'id'>[]): number => {
    if (!newStudents.length) return 0;
    const prepared: Student[] = newStudents.map((s, idx) => ({
      ...s,
      id: 'std-' + Math.random().toString(36).substring(2, 7) + idx
    }));
    setStudents(prev => {
      const updated = [...prepared, ...prev];
      syncStudentsToSheets(updated);
      return updated;
    });
    showToast(`Berhasil mengimpor ${prepared.length} data siswa.`, 'success');
    return prepared.length;
  }, [showToast, syncStudentsToSheets]);

  const updateStudent = useCallback((id: string, updatedFields: Partial<Student>) => {
    setStudents(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...updatedFields } : s);
      syncStudentsToSheets(updated);
      return updated;
    });
    showToast('Data siswa berhasil diperbarui.', 'success');
  }, [showToast, syncStudentsToSheets]);

  const deleteStudent = useCallback((id: string) => {
    const target = students.find(s => s.id === id);
    if (target) {
      deleteStudentFromSheets(target);
      // Remove all local attendance records of this student
      setAttendance(prev => prev.filter(a => a.studentId !== id && a.nisn !== target.nisn));
    }
    setStudents(prev => {
      const updated = prev.filter(s => s.id !== id);
      syncStudentsToSheets(updated);
      return updated;
    });
    showToast(`Data siswa ${target ? target.name : ''} & riwayat presensinya berhasil dihapus (lokal & spreadsheet).`, 'info');
  }, [students, deleteStudentFromSheets, syncStudentsToSheets, showToast]);

  const deleteAttendance = useCallback((id: string) => {
    const target = attendance.find(a => a.id === id);
    if (target) {
      deleteRecordFromSheets(target);
    }
    setAttendance(prev => prev.filter(a => a.id !== id));
    showToast('Catatan presensi berhasil dihapus (lokal & spreadsheet).', 'info');
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
      syncRecordToSheets(updatedRecord);
    }
    showToast('Data riwayat presensi berhasil diperbarui & disinkronkan.', 'success');
  }, [syncRecordToSheets, showToast]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('qr_presensi_settings', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save settings to localStorage:', e);
        // Fallback: if quota exceeded due to huge images, save settings without heavy images
        try {
          const fallbackSettings = { ...updated, logoUrl: '', guruPhotoUrl: '' };
          localStorage.setItem('qr_presensi_settings', JSON.stringify(fallbackSettings));
        } catch (e2) {
          console.error('Fallback settings save failed:', e2);
        }
      }
      syncSettingsToSheets(updated);
      return updated;
    });
    showToast('Pengaturan aplikasi & profil guru berhasil disimpan & disinkronkan.', 'success');
  }, [showToast, syncSettingsToSheets]);

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
      addStudentsBulk,
      updateStudent,
      deleteStudent,
      deleteAttendance,
      updateAttendanceStatus,
      editAttendanceRecord,
      updateSettings,
      resetToSampleData,
      syncRecordToSheets,
      syncStudentsToSheets,
      syncSettingsToSheets,
      pullDataFromSheets,
      isPullingFromSheets,
      selectedStudentForCard,
      setSelectedStudentForCard,
      isLoggedIn,
      login,
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
