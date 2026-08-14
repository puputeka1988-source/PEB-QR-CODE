import { Student, AttendanceRecord, AcademicYear } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  { id: 'std-001', name: 'Ahmad Rizky Pratama', nisn: '0051234001', class: 'X IPA 1', gender: 'L', phone: '081234567801' },
  { id: 'std-002', name: 'Anisa Rahmawati', nisn: '0051234002', class: 'X IPA 1', gender: 'P', phone: '081234567802' },
  { id: 'std-003', name: 'Bagas Setyo Nugroho', nisn: '0051234003', class: 'X IPA 2', gender: 'L', phone: '081234567803' },
  { id: 'std-004', name: 'Dian Permata Sari', nisn: '0051234004', class: 'X IPA 2', gender: 'P', phone: '081234567804' },
  { id: 'std-005', name: 'Fajar Hidayatullah', nisn: '0051234005', class: 'XI IPS 1', gender: 'L', phone: '081234567805' },
  { id: 'std-006', name: 'Gita Gutawa Putri', nisn: '0051234006', class: 'XI IPS 1', gender: 'P', phone: '081234567806' },
  { id: 'std-007', name: 'Hendrik Wijaya', nisn: '0051234007', class: 'XI IPS 2', gender: 'L', phone: '081234567807' },
  { id: 'std-008', name: 'Indah Kusuma Wardani', nisn: '0051234008', class: 'XI IPS 2', gender: 'P', phone: '081234567808' },
];

export function generateSampleAttendance(students: Student[], dateStr: string): AttendanceRecord[] {
  const records: AttendanceRecord[] = [
    {
      id: `${students[0]?.nisn || '0051234001'}-${dateStr}`,
      studentId: students[0]?.id || 'std-001',
      studentName: students[0]?.name || 'Ahmad Rizky Pratama',
      nisn: students[0]?.nisn || '0051234001',
      class: students[0]?.class || 'X IPA 1',
      date: dateStr,
      time: '06:48:12',
      status: 'Hadir',
      method: 'QR Code'
    },
    {
      id: `${students[1]?.nisn || '0051234002'}-${dateStr}`,
      studentId: students[1]?.id || 'std-002',
      studentName: students[1]?.name || 'Anisa Rahmawati',
      nisn: students[1]?.nisn || '0051234002',
      class: students[1]?.class || 'X IPA 1',
      date: dateStr,
      time: '06:55:04',
      status: 'Hadir',
      method: 'QR Code'
    },
    {
      id: `${students[2]?.nisn || '0051234003'}-${dateStr}`,
      studentId: students[2]?.id || 'std-003',
      studentName: students[2]?.name || 'Bagas Setyo Nugroho',
      nisn: students[2]?.nisn || '0051234003',
      class: students[2]?.class || 'X IPA 2',
      date: dateStr,
      time: '07:18:40',
      status: 'Terlambat',
      method: 'QR Code',
      note: 'Ban sepeda bocor'
    },
    {
      id: `${students[3]?.nisn || '0051234004'}-${dateStr}`,
      studentId: students[3]?.id || 'std-004',
      studentName: students[3]?.name || 'Dian Permata Sari',
      nisn: students[3]?.nisn || '0051234004',
      class: students[3]?.class || 'X IPA 2',
      date: dateStr,
      time: '07:02:15',
      status: 'Hadir',
      method: 'QR Code'
    },
    {
      id: `${students[5]?.nisn || '0051234005'}-${dateStr}`,
      studentId: students[4]?.id || 'std-005',
      studentName: students[4]?.name || 'Fajar Hidayatullah',
      nisn: students[4]?.nisn || '0051234005',
      class: students[4]?.class || 'XI IPS 1',
      date: dateStr,
      time: '08:00:00',
      status: 'Izin',
      method: 'Manual',
      note: 'Lomba Matematika Kabupaten'
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
