import { Student, AttendanceRecord, AcademicYear, TeachingScheduleItem, Announcement } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  { id: 'std-003', name: 'Bagas Setyo Nugroho', nisn: '0051234003', class: 'X IPA 2', gender: 'L', phone: '081234567803' },
  { id: 'std-004', name: 'Dian Permata Sari', nisn: '0051234004', class: 'X IPA 2', gender: 'P', phone: '081234567804' },
  { id: 'std-005', name: 'Fajar Hidayatullah', nisn: '0051234005', class: 'XI IPS 1', gender: 'L', phone: '081234567805' },
  { id: 'std-006', name: 'Gita Gutawa Putri', nisn: '0051234006', class: 'XI IPS 1', gender: 'P', phone: '081234567806' },
  { id: 'std-007', name: 'Hendrik Wijaya', nisn: '0051234007', class: 'XI IPS 2', gender: 'L', phone: '081234567807' },
  { id: 'std-008', name: 'Indah Kusuma Wardani', nisn: '0051234008', class: 'XI IPS 2', gender: 'P', phone: '081234567808' },
];

export function generateSampleAttendance(students: Student[], dateStr: string): AttendanceRecord[] {
  const findStd = (nisn: string, defaultName: string, defaultClass: string, defaultId: string) => {
    const found = students.find(s => s.nisn === nisn || s.id === defaultId);
    return {
      id: found?.id || defaultId,
      name: found?.name || defaultName,
      nisn: found?.nisn || nisn,
      class: found?.class || defaultClass
    };
  };

  const stdBagas = findStd('0051234003', 'Bagas Setyo Nugroho', 'X IPA 2', 'std-003');
  const stdDian = findStd('0051234004', 'Dian Permata Sari', 'X IPA 2', 'std-004');
  const stdFajar = findStd('0051234005', 'Fajar Hidayatullah', 'XI IPS 1', 'std-005');
  const stdGita = findStd('0051234006', 'Gita Gutawa Putri', 'XI IPS 1', 'std-006');
  const stdHendrik = findStd('0051234007', 'Hendrik Wijaya', 'XI IPS 2', 'std-007');

  const records: AttendanceRecord[] = [
    {
      id: `${stdBagas.nisn}-${dateStr}`,
      studentId: stdBagas.id,
      studentName: stdBagas.name,
      nisn: stdBagas.nisn,
      class: stdBagas.class,
      date: dateStr,
      time: '07:18:40',
      status: 'Terlambat',
      method: 'QR Code',
      note: 'Ban sepeda bocor'
    },
    {
      id: `${stdDian.nisn}-${dateStr}`,
      studentId: stdDian.id,
      studentName: stdDian.name,
      nisn: stdDian.nisn,
      class: stdDian.class,
      date: dateStr,
      time: '07:02:15',
      status: 'Hadir',
      method: 'QR Code'
    },
    {
      id: `${stdFajar.nisn}-${dateStr}`,
      studentId: stdFajar.id,
      studentName: stdFajar.name,
      nisn: stdFajar.nisn,
      class: stdFajar.class,
      date: dateStr,
      time: '08:00:00',
      status: 'Izin',
      method: 'Manual',
      note: 'Lomba Matematika Kabupaten'
    },
    {
      id: `${stdGita.nisn}-${dateStr}`,
      studentId: stdGita.id,
      studentName: stdGita.name,
      nisn: stdGita.nisn,
      class: stdGita.class,
      date: dateStr,
      time: '06:51:20',
      status: 'Hadir',
      method: 'QR Code'
    },
    {
      id: `${stdHendrik.nisn}-${dateStr}`,
      studentId: stdHendrik.id,
      studentName: stdHendrik.name,
      nisn: stdHendrik.nisn,
      class: stdHendrik.class,
      date: dateStr,
      time: '06:58:30',
      status: 'Hadir',
      method: 'QR Code'
    }
  ];
  return records;
}

export const INITIAL_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: 'ay-2024-2025',
    name: '2024/2025',
    semester: '2 (Genap)',
    isCurrent: false,
    isArchived: true,
    startDate: '2025-01-06',
    endDate: '2025-06-20',
    notes: 'Tahun Ajaran lampau (Arsip semester genap)',
    createdAt: '2024-07-01T00:00:00.000Z'
  },
  {
    id: 'ay-2025-2026',
    name: '2025/2026',
    semester: '1 (Ganjil)',
    isCurrent: true,
    isArchived: false,
    startDate: '2025-07-14',
    endDate: '2025-12-19',
    notes: 'Tahun Ajaran Berjalan / Aktif Saat Ini',
    createdAt: '2025-07-01T00:00:00.000Z'
  },
  {
    id: 'ay-2026-2027',
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

export const INITIAL_TEACHING_SCHEDULES: TeachingScheduleItem[] = [
  {
    id: 'sch-1',
    day: 'Senin',
    dayIndex: 1,
    jamKe: '1 - 2',
    startTime: '07:15',
    endTime: '08:35',
    kelas: 'X IPA 2',
    mapel: 'Informatika',
    ruang: 'Lab Komputer 1',
    jtm: 2,
    notes: 'Dasar Berpikir Komputasional & Logika'
  },
  {
    id: 'sch-2',
    day: 'Senin',
    dayIndex: 1,
    jamKe: '3 - 4',
    startTime: '08:35',
    endTime: '09:55',
    kelas: 'XI IPS 1',
    mapel: 'Informatika',
    ruang: 'Lab Komputer 1',
    jtm: 2,
    notes: 'Pengolahan Data Spreadsheet Lanjutan'
  },
  {
    id: 'sch-3',
    day: 'Selasa',
    dayIndex: 2,
    jamKe: '1 - 2',
    startTime: '07:15',
    endTime: '08:35',
    kelas: 'XI IPS 2',
    mapel: 'Informatika',
    ruang: 'Lab Komputer 2',
    jtm: 2,
    notes: 'Jaringan Komputer & Topologi LAN'
  },
  {
    id: 'sch-4',
    day: 'Rabu',
    dayIndex: 3,
    jamKe: '2 - 3',
    startTime: '07:55',
    endTime: '09:15',
    kelas: 'X IPA 2',
    mapel: 'Informatika',
    ruang: 'Lab Komputer 1',
    jtm: 2,
    notes: 'Praktikum Algoritma & Flowchart'
  },
  {
    id: 'sch-5',
    day: 'Kamis',
    dayIndex: 4,
    jamKe: '1 - 2',
    startTime: '07:15',
    endTime: '08:35',
    kelas: 'XI IPS 1',
    mapel: 'Informatika',
    ruang: 'R. Kelas XI IPS 1',
    jtm: 2,
    notes: 'Dampak Sosial Informatika & Hak Cipta Digital'
  },
  {
    id: 'sch-6',
    day: 'Jumat',
    dayIndex: 5,
    jamKe: '1 - 2',
    startTime: '07:15',
    endTime: '08:25',
    kelas: 'XI IPS 2',
    mapel: 'Informatika',
    ruang: 'Lab Komputer 1',
    jtm: 2,
    notes: 'Praktikum Kolaborasi Dokumen & Cloud'
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-001',
    title: 'Jadwal Pelaksanaan Penilaian Akhir Semester (PAS) Ganjil',
    content: 'Diberitahukan kepada seluruh siswa bahwa pelaksanaan Penilaian Akhir Semester (PAS) Ganjil Tahun Ajaran 2025/2026 akan dimulai pekan depan. Harap membawa Kartu Peserta Ujian / Kartu QR Presensi, perlengkapan alat tulis lengkap, serta memastikan kehadiran tepat waktu pukul 07.00 WIB.',
    category: 'akademik',
    targetType: 'all',
    authorName: 'Bpk. Ahmad Fauzi, S.Pd',
    authorRole: 'Guru Informatika / Admin',
    date: '2026-08-29',
    time: '07:00:00',
    createdAt: new Date().toISOString(),
    isPinned: true,
    priority: 'high',
    readBy: {}
  },
  {
    id: 'ann-002',
    title: 'Praktikum Pemrograman & Penggunaan Lab Komputer 1',
    content: 'Khusus untuk siswa kelas X IPA 2, praktikum Informatika besok akan diadakan langsung di Laboratorium Komputer 1. Siswa diharapkan sudah berada di depan lab 10 menit sebelum jam pelajaran dimulai dengan membawa modul pembelajaran.',
    category: 'info',
    targetType: 'class',
    targetClasses: ['X IPA 2'],
    authorName: 'Bpk. Ahmad Fauzi, S.Pd',
    authorRole: 'Guru Informatika',
    date: '2026-08-29',
    time: '07:15:00',
    createdAt: new Date().toISOString(),
    isPinned: false,
    priority: 'normal',
    readBy: {}
  }
];

