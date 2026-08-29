import { Student, AttendanceRecord, TeachingJournal, AcademicYear, AppSettings, ClassGradeSheet, TeachingScheduleItem, Announcement } from '../types';

export interface FullBackupPayload {
  version: string;
  appName: string;
  exportedAt: string;
  exportedTimestamp: number;
  schoolInfo: {
    name: string;
    npsn?: string;
    address?: string;
  };
  summary: {
    totalStudents: number;
    totalAttendanceRecords: number;
    totalJournals: number;
    totalAcademicYears: number;
    totalGradeSheets?: number;
    totalTeachingSchedules?: number;
    totalAnnouncements?: number;
  };
  data: {
    students: Student[];
    attendance: AttendanceRecord[];
    journals: TeachingJournal[];
    academicYears: AcademicYear[];
    settings: AppSettings;
    gradeSheets?: ClassGradeSheet[];
    teachingSchedules?: TeachingScheduleItem[];
    announcements?: Announcement[];
  };
}

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  payload?: FullBackupPayload;
}

/**
 * Creates a clean, serialized full backup JSON object
 */
export function createBackupPayload(
  students: Student[],
  attendance: AttendanceRecord[],
  journals: TeachingJournal[],
  academicYears: AcademicYear[],
  settings: AppSettings,
  gradeSheets: ClassGradeSheet[] = [],
  teachingSchedules: TeachingScheduleItem[] = [],
  announcements: Announcement[] = []
): FullBackupPayload {
  const now = new Date();
  return {
    version: '2.0.0',
    appName: 'Sistem Presensi QR & Jurnal Mengajar',
    exportedAt: now.toISOString(),
    exportedTimestamp: now.getTime(),
    schoolInfo: {
      name: settings.sekolah || 'Sekolah',
      npsn: settings.npsn || '',
      address: settings.alamat || ''
    },
    summary: {
      totalStudents: students.length,
      totalAttendanceRecords: attendance.length,
      totalJournals: journals.length,
      totalAcademicYears: academicYears.length,
      totalGradeSheets: gradeSheets.length,
      totalTeachingSchedules: teachingSchedules.length,
      totalAnnouncements: announcements.length
    },
    data: {
      students,
      attendance,
      journals,
      academicYears,
      settings,
      gradeSheets,
      teachingSchedules,
      announcements
    }
  };
}

/**
 * Triggers a 1-click JSON file download in browser
 */
export function downloadBackupJson(payload: FullBackupPayload, schoolName?: string): void {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const cleanSchool = (schoolName || payload.schoolInfo.name || 'Sekolah')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const filename = `Backup_Presensi_${cleanSchool}_${dateStr}.json`;

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates parsed JSON file to ensure it is a valid backup payload
 */
export function validateBackupJson(jsonString: string): BackupValidationResult {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: 'Format file tidak valid (Bukan objek JSON).' };
    }

    // Support both standardized 2.0 payload format and legacy flat formats
    if (parsed.data && typeof parsed.data === 'object') {
      const { students, attendance, journals, academicYears, settings, gradeSheets, teachingSchedules } = parsed.data;
      if (!Array.isArray(students) && !Array.isArray(attendance)) {
        return { isValid: false, error: 'File cadangan tidak memuat data siswa atau presensi yang valid.' };
      }

      const payload: FullBackupPayload = {
        version: parsed.version || '2.0.0',
        appName: parsed.appName || 'Sistem Presensi QR',
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        exportedTimestamp: parsed.exportedTimestamp || Date.now(),
        schoolInfo: parsed.schoolInfo || { name: settings?.sekolah || 'Sekolah' },
        summary: {
          totalStudents: Array.isArray(students) ? students.length : 0,
          totalAttendanceRecords: Array.isArray(attendance) ? attendance.length : 0,
          totalJournals: Array.isArray(journals) ? journals.length : 0,
          totalAcademicYears: Array.isArray(academicYears) ? academicYears.length : 0,
          totalGradeSheets: Array.isArray(gradeSheets) ? gradeSheets.length : 0,
          totalTeachingSchedules: Array.isArray(teachingSchedules) ? teachingSchedules.length : 0
        },
        data: {
          students: Array.isArray(students) ? students : [],
          attendance: Array.isArray(attendance) ? attendance : [],
          journals: Array.isArray(journals) ? journals : [],
          academicYears: Array.isArray(academicYears) ? academicYears : [],
          settings: settings || {},
          gradeSheets: Array.isArray(gradeSheets) ? gradeSheets : [],
          teachingSchedules: Array.isArray(teachingSchedules) ? teachingSchedules : []
        }
      };

      return { isValid: true, payload };
    }

    // Legacy or flat format fallback
    if (Array.isArray(parsed.students) || Array.isArray(parsed.attendance)) {
      const payload: FullBackupPayload = {
        version: '1.0.0-legacy',
        appName: 'Sistem Presensi QR (Format Sederhana)',
        exportedAt: new Date().toISOString(),
        exportedTimestamp: Date.now(),
        schoolInfo: { name: parsed.settings?.sekolah || 'Sekolah' },
        summary: {
          totalStudents: Array.isArray(parsed.students) ? parsed.students.length : 0,
          totalAttendanceRecords: Array.isArray(parsed.attendance) ? parsed.attendance.length : 0,
          totalJournals: Array.isArray(parsed.journals) ? parsed.journals.length : 0,
          totalAcademicYears: Array.isArray(parsed.academicYears) ? parsed.academicYears.length : 0,
          totalGradeSheets: Array.isArray(parsed.gradeSheets) ? parsed.gradeSheets.length : 0
        },
        data: {
          students: Array.isArray(parsed.students) ? parsed.students : [],
          attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
          journals: Array.isArray(parsed.journals) ? parsed.journals : [],
          academicYears: Array.isArray(parsed.academicYears) ? parsed.academicYears : [],
          settings: parsed.settings || {},
          gradeSheets: Array.isArray(parsed.gradeSheets) ? parsed.gradeSheets : []
        }
      };
      return { isValid: true, payload };
    }

    return { isValid: false, error: 'Struktur file JSON tidak sesuai dengan format cadangan data Presensi QR.' };
  } catch (e: any) {
    return { isValid: false, error: `Gagal membaca file JSON: ${e?.message || 'Sintaks tidak valid'}` };
  }
}

const AUTO_SNAPSHOT_KEY = 'qr_presensi_auto_snapshot';

/**
 * Saves a local snapshot to localStorage for disaster recovery
 */
export function saveAutoSnapshot(payload: FullBackupPayload): void {
  try {
    localStorage.setItem(AUTO_SNAPSHOT_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Auto snapshot to localStorage failed (storage full?):', e);
  }
}

/**
 * Retrieves the latest auto-snapshot from localStorage
 */
export function getAutoSnapshot(): FullBackupPayload | null {
  try {
    const raw = localStorage.getItem(AUTO_SNAPSHOT_KEY);
    if (!raw) return null;
    const res = validateBackupJson(raw);
    return res.isValid && res.payload ? res.payload : null;
  } catch (e) {
    console.warn('Failed to retrieve auto-snapshot:', e);
    return null;
  }
}
