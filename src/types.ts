export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alpa';

export type ThemeMode = 'dark' | 'light' | 'system';
export type ThemeAccent = 'emerald' | 'blue' | 'indigo' | 'violet' | 'amber' | 'rose' | 'teal';
export type ThemeFont = 'plus-jakarta' | 'inter' | 'poppins' | 'outfit' | 'system';
export type ThemeFontSize = 'compact' | 'normal' | 'comfortable';

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
  // Kop Sekolah & Instansi Pembina
  instansiProvinsi?: string; // e.g. "PEMERINTAH PROVINSI JAWA BARAT / DINAS PENDIDIKAN" or "KEMENTERIAN AGAMA RI"
  instansiKabupaten?: string; // e.g. "CABANG DINAS PENDIDIKAN WILAYAH VII" or "KANTOR KEMENAG KABUPATEN ..."
  sekolah: string;
  npsn?: string;
  alamat?: string;
  logoKiriUrl?: string; // Logo Kop Kiri (Lambang Pemda / Provinsi / Kementerian / Tut Wuri Handayani)
  logoKananUrl?: string; // Logo Kop Kanan (Logo Resmi Sekolah)
  logoUrl?: string; // Fallback / Global Logo Sekolah
  jamMasuk: string; // e.g. "07:00"
  jamTerlambat: string; // e.g. "07:15"
  timezone?: 'WIB' | 'WITA' | 'WIT'; // Zona Waktu: WIB (UTC+7), WITA (UTC+8), WIT (UTC+9)
  spreadsheetUrl: string;
  enableSound: boolean;
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
  themeFont?: ThemeFont; // 'plus-jakarta' | 'inter' | 'poppins' | 'outfit' | 'system'
  themeFontSize?: ThemeFontSize; // 'compact' | 'normal' | 'comfortable'
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

export interface TeachingScheduleItem {
  id: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu' | string;
  dayIndex: number; // 1: Senin, 2: Selasa, 3: Rabu, 4: Kamis, 5: Jumat, 6: Sabtu, 7: Minggu
  jamKe: string; // e.g. "1 - 2" or "3 - 4"
  startTime: string; // e.g. "07:15"
  endTime: string; // e.g. "08:35"
  kelas: string; // e.g. "X IPA 2", "XI IPS 1", "XI IPS 2"
  mapel: string; // e.g. "Informatika"
  ruang?: string; // e.g. "Lab Komputer 1"
  room?: string; // alias for ruang
  jtm?: number; // Jumlah Jam Tatap Muka (e.g. 2)
  notes?: string; // e.g. "Materi Teori / Praktikum"
  color?: string;
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

export type TabType = 'Dashboard' | 'Siswa' | 'Kartu QR' | 'Riwayat' | 'Jadwal Mengajar' | 'Jurnal Mengajar' | 'Penilaian Harian' | 'Pengaturan';

export type DashboardSubTab = 'ringkasan' | 'manual' | 'kiosk-scanner';
export type SiswaSubTab = 'daftar' | 'tambah' | 'impor-ekspor';
export type KartuQrSubTab = 'cetak-massal' | 'desain-kustom' | 'pratinjau-individu';
export type RiwayatSubTab = 'log-presensi' | 'rekap-statistik' | 'kelola-koreksi';
export type JadwalMengajarSubTab = 'jadwal-hari-ini' | 'kelola-jadwal' | 'cetak-jadwal';
export type JurnalMengajarSubTab = 'daftar-jurnal' | 'isi-jurnal' | 'cetak-laporan';
export type PenilaianHarianSubTab = 'input-nilai' | 'bobot-materi' | 'cetak-rekap';
export type PengaturanSubTab = 'profil-sekolah' | 'jam-absensi' | 'tahun-ajaran' | 'keamanan-2fa' | 'tema-tampilan' | 'backup-restore';

export type SubTabType = 
  | DashboardSubTab
  | SiswaSubTab
  | KartuQrSubTab
  | RiwayatSubTab
  | JadwalMengajarSubTab
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
