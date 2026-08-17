export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alpa';

export type ThemeMode = 'dark' | 'light' | 'system';
export type ThemeAccent = 'emerald' | 'blue' | 'indigo' | 'violet' | 'amber' | 'rose' | 'teal';

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
  ttdGuruUrl?: string; // Data URL or Image URL for teacher signature PNG, JPEG, JPG
  // Profil Kepala Sekolah
  namaKepalaSekolah?: string;
  nipKepalaSekolah?: string;
  jabatanKepalaSekolah?: string;
  ttdKepalaSekolahUrl?: string; // Data URL or Image URL for principal signature PNG, JPEG, JPG
  kotaTandaTangan?: string; // e.g. "Bula", "Kec. Bula"
  semester?: string; // e.g. "1 (Ganjil)"
  tahunAjaran?: string; // e.g. "2025/2026"
  // Bobot Penilaian Default (UH, UTS, UAS)
  defaultGradeWeights?: GradeWeights;
  // Kustomisasi Tema & Tampilan
  themeMode?: ThemeMode; // 'dark' | 'light' | 'system'
  themeAccent?: ThemeAccent; // 'emerald' | 'blue' | 'indigo' | 'violet' | 'amber' | 'rose' | 'teal'
  // Keamanan 2 Langkah (Biometrik / Fingerprint & PIN Keamanan)
  twoFactorEnabled?: boolean;
  securityPin?: string; // 6-digit PIN e.g. "123456"
  biometricEnabled?: boolean;
  biometricCredentialId?: string;
  biometricDeviceName?: string;
}

export interface GradeWeights {
  uh: number; // Nilai Harian / Ulangan Harian (e.g. 40 or 2)
  uts: number; // Nilai Tengah Semester (e.g. 30 or 1)
  uas: number; // Nilai Akhir Semester (e.g. 30 or 1)
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
  weights?: GradeWeights;
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

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2024/2025", "2025/2026", "2026/2027"
  semester: '1 (Ganjil)' | '2 (Genap)' | string;
  isCurrent: boolean;
  isArchived: boolean;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
}

export type PaperSize = 'A4' | 'F4' | 'Letter' | 'Legal' | 'A3' | 'Custom';
export type PaperOrientation = 'portrait' | 'landscape';
export type MarginPreset = 'normal' | 'tight' | 'moderate' | 'wide' | 'none' | 'custom';
export type CutLineStyle = 'dashed' | 'solid' | 'dotted';

export interface CardPrintLayoutSettings {
  paperSize: PaperSize;
  customPaperWidthMm: number;
  customPaperHeightMm: number;
  orientation: PaperOrientation;
  marginPreset: MarginPreset;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  cardWidthMm: number;
  cardHeightMm: number;
  gapHorizontalMm: number;
  gapVerticalMm: number;
  columnsCount: number; // 0 = Auto
  showCutLines: boolean;
  cutLineStyle: CutLineStyle;
  showPunchHole: boolean;
  showSchoolLogo: boolean;
  printSideMode: 'both' | 'front-only' | 'back-only';
  scalePercent: number; // 80 to 120
  customFooterText?: string;
}

export type IDCardPrintLayout = 
  | 'grid-a4' // Standar Grid A4 (8-10 Kartu per Lembar dengan Garis Potong)
  | 'cr80-pvc-landscape' // Standar PVC/ATM Landscape (85.6mm x 54mm)
  | 'cr80-pvc-portrait' // Standar PVC/ATM Portrait (54mm x 85.6mm)
  | 'badge-lanyard' // Lanyard Badge Holder Sedang (70mm x 100mm)
  | 'pocket-mini'; // Kartu Saku Kompak (60mm x 90mm)

export interface IDCardPrintConfig {
  layout: IDCardPrintLayout;
  showCutLines: boolean;
  showBackSide: boolean;
  showSchoolLogo: boolean;
  showPhotoOrAvatar: boolean;
  showGenderBadge: boolean;
  customCardHeader?: string;
  customCardFooter?: string;
  schoolContactInfo?: string;
}

export type TabType = 'Dashboard' | 'Siswa' | 'Kartu QR' | 'Riwayat' | 'Jurnal Mengajar' | 'Penilaian Harian' | 'Pengaturan';

export type DashboardSubTab = 'ringkasan' | 'manual' | 'kiosk-scanner';
export type SiswaSubTab = 'daftar' | 'tambah' | 'impor-ekspor';
export type KartuQrSubTab = 'cetak-massal' | 'desain-kustom' | 'pratinjau-individu';
export type RiwayatSubTab = 'log-presensi' | 'rekap-statistik' | 'kelola-koreksi';
export type JurnalMengajarSubTab = 'daftar-jurnal' | 'isi-jurnal' | 'cetak-laporan';
export type PenilaianHarianSubTab = 'input-nilai' | 'bobot-materi' | 'cetak-rekap';
export type PengaturanSubTab = 'profil-sekolah' | 'jam-absensi' | 'tahun-ajaran' | 'keamanan-2fa' | 'tema-tampilan' | 'backup-restore';

export type SubTabType = 
  | DashboardSubTab
  | SiswaSubTab
  | KartuQrSubTab
  | RiwayatSubTab
  | JurnalMengajarSubTab
  | PenilaianHarianSubTab
  | PengaturanSubTab;

export interface SubMenuItem {
  id: string;
  label: string;
  description?: string;
  iconName: string;
  badge?: string | number;
}
