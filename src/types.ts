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
  kotaTandaTangan?: string; // e.g. "Bula", "Kec. Bula"
  semester?: string; // e.g. "1 (Ganjil)"
  tahunAjaran?: string; // e.g. "2025/2026"
}

export interface DailyGradeItem {
  uh1?: string;
  uh2?: string;
  uh3?: string;
  uh4?: string;
  uh5?: string;
  uh6?: string;
  uts?: string;
  uas?: string;
  finalGrade?: string;
}

export interface ClassGradeSheet {
  id: string; // e.g. "grades-X IPA 1-Ganjil-2025/2026"
  kelas: string;
  semester: string;
  tahunAjaran: string;
  mapel: string;
  uhMeta: {
    [key: number]: {
      date: string;
      materi: string;
    };
  };
  studentGrades: {
    [studentId: string]: DailyGradeItem;
  };
  updatedAt?: string;
}

export interface TeachingJournal {
  id: string;
  date: string; // YYYY-MM-DD
  day: string; // e.g. "Senin"
  kelas: string; // e.g. "X IPA 1"
  mapel: string; // e.g. "Matematika"
  materi: string; // Pokok Bahasan KD / Judul Materi
  metode: string; // Jenis Kegiatan / Metode Pemb
  siswaTidakHadirNama?: string; // Nama siswa tidak hadir e.g. "Ahmad (Sakit), Budi (Alpa)"
  siswaTidakHadirKet?: string; // Ket e.g. "S:1, A:1"
  siswaTidakHadirJml?: number; // Jumlah siswa tidak hadir
  totalSiswa?: number; // Jumlah total siswa di kelas / hadir
  paraf?: string; // Paraf / Status (e.g. "Paraf")
  catatan?: string; // Catatan
  createdAt?: string;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: number;
}

export type TabType = 'Dashboard' | 'Siswa' | 'Kartu QR' | 'Riwayat' | 'Jurnal Mengajar' | 'Penilaian Harian' | 'Integrasi Sheets' | 'Pengaturan';
