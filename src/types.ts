export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alpa';

export interface Student {
  id: string;
  name: string;
  nisn: string;
  class: string;
  gender?: 'L' | 'P';
  photoUrl?: string;
  phone?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  nisn: string;
  class: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  status: AttendanceStatus;
  method: 'QR Code' | 'Manual';
  note?: string;
}

export interface AppSettings {
  sekolah: string;
  npsn?: string;
  alamat?: string;
  jamMasuk: string; // e.g. "07:00"
  jamTerlambat: string; // e.g. "07:15"
  spreadsheetUrl: string;
  enableSound: boolean;
  logoUrl?: string;
  adminUsername?: string;
  adminPassword?: string;
  // Profil Guru / Admin
  namaGuru?: string;
  nip?: string;
  mataPelajaran?: string;
  jabatan?: string;
  guruPhone?: string;
  guruPhotoUrl?: string;
  guruBio?: string;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: number;
}

export type TabType = 'Dashboard' | 'Siswa' | 'Kartu QR' | 'Riwayat' | 'Integrasi Sheets' | 'Pengaturan';
