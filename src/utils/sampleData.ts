import { Student, AttendanceRecord, AcademicYear, TeachingScheduleItem, Announcement } from '../types';

export const INITIAL_STUDENTS: Student[] = [];

export function generateSampleAttendance(_students: Student[], _dateStr: string): AttendanceRecord[] {
  return [];
}

export const INITIAL_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: 'ay-2024-2025-genap',
    name: '2024/2025',
    semester: '2 (Genap)',
    isCurrent: false,
    isArchived: true,
    startDate: '2025-01-06',
    endDate: '2025-06-20',
    notes: 'Tahun Ajaran Lalu (Arsip)',
    createdAt: '2024-06-01T00:00:00.000Z'
  },
  {
    id: 'ay-2025-2026-ganjil',
    name: '2025/2026',
    semester: '1 (Ganjil)',
    isCurrent: true,
    isArchived: false,
    startDate: '2025-07-14',
    endDate: '2025-12-19',
    notes: 'Tahun Ajaran Aktif Berjalan',
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: 'ay-2025-2026-genap',
    name: '2025/2026',
    semester: '2 (Genap)',
    isCurrent: false,
    isArchived: false,
    startDate: '2026-01-05',
    endDate: '2026-06-19',
    notes: 'Semester Mendatang',
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: 'ay-2026-2027-ganjil',
    name: '2026/2027',
    semester: '1 (Ganjil)',
    isCurrent: false,
    isArchived: false,
    startDate: '2026-07-13',
    endDate: '2026-12-18',
    notes: 'Tahun Ajaran Baru (Draf/Persiapan)',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const INITIAL_TEACHING_SCHEDULES: TeachingScheduleItem[] = [];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-001',
    title: 'Jadwal Pelaksanaan Penilaian Akhir Semester (PAS) Ganjil',
    content: 'Diberitahukan kepada seluruh siswa bahwa pelaksanaan Penilaian Akhir Semester (PAS) Ganjil Tahun Ajaran 2025/2026 akan dimulai pekan depan. Harap membawa Kartu Peserta Ujian / Kartu QR Presensi, perlengkapan alat tulis lengkap, serta memastikan kehadiran tepat waktu pukul 07.00 WIB.',
    category: 'akademik',
    targetType: 'all',
    authorName: 'Admin / Guru',
    authorRole: 'Guru / Admin',
    date: '2026-08-29',
    time: '07:00:00',
    createdAt: new Date().toISOString(),
    isPinned: true,
    priority: 'high',
    readBy: {}
  }
];
