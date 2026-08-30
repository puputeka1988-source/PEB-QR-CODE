export type ChangeType = 'added' | 'improved' | 'fixed' | 'security';

export interface ChangeItem {
  type: ChangeType;
  title?: string;
  description: string;
}

export interface ChangelogRelease {
  version: string;
  releaseDate: string; // e.g. "22 Agustus 2026"
  title: string;
  badge?: string; // e.g. "Terbaru", "Stabil", "Mayor"
  highlights?: string;
  changes: ChangeItem[];
}

export const CHANGELOG_DATA: ChangelogRelease[] = [
  {
    version: 'v2.8.0',
    releaseDate: '30 Agustus 2026',
    title: 'Notifikasi Lonceng Siaran & Antrean Pemindai Offline',
    badge: 'Terbaru',
    highlights: 'Pembaruan ini menghadirkan fitur notifikasi lonceng siaran/pengumuman langsung di Header & Portal Siswa, mode pemindai presensi offline berkecepatan tinggi dengan antrean sinkronisasi lokal, serta otomatisasi penomoran versi sistem.',
    changes: [
      {
        type: 'added',
        title: 'Lonceng Notifikasi Siaran & Pengumuman (Header Web & Siswa)',
        description: 'Dropdown notifikasi interaktif pada Header Web Admin dan Portal Siswa dengan badge counter unread, filter status, tandai dibaca instan, dan pratinjau pesan lengkap.'
      },
      {
        type: 'added',
        title: 'Mode Pemindai Offline & Antrean Sinkronisasi (Offline Sync Queue)',
        description: 'Pemindaian QR presensi tetap berjalan lancar saat internet offline atau lambat. Data diantrekan secara lokal dan otomatis disinkronkan ke Firestore & Spreadsheet saat koneksi pulih.'
      },
      {
        type: 'added',
        title: 'Pelacakan Versi & Build Stamp Otomatis',
        description: 'Sistem secara otomatis mendeteksi dan memperbarui nomor versi aplikasi serta nomor build pada seluruh antarmuka (Sidebar, Header, Pengaturan, dan Modal Rilis).'
      },
      {
        type: 'fixed',
        title: 'Perbaikan Render Objek Tanggal',
        description: 'Penanganan pemformatan hari dan tanggal pada komponen dialog siaran dan notifikasi agar tidak memicu error render React child.'
      },
      {
        type: 'improved',
        title: 'Indikator Jaringan & Voice Feedback',
        description: 'Status konektivitas online/offline yang responsif di seluruh layar termasuk Mode Kiosk Lobi dan Modal Pemindai Kamera.'
      }
    ]
  },
  {
    version: 'v2.6.0',
    releaseDate: '22 Agustus 2026',
    title: 'Pusat Riwayat Pembaruan (Changelog) & Restrukturisasi Modular',
    badge: 'Stabil',
    highlights: 'Pembaruan ini menambahkan pelacakan versi dinamis otomatis, dialog informasi pembaruan terintegrasi, serta perapian arsitektur folder kode berstandar tinggi.',
    changes: [
      {
        type: 'added',
        title: 'Pusat Catatan Rilis (Changelog)',
        description: 'Sub-menu interaktif "Riwayat Versi & Changelog" di Pengaturan dengan pencarian, filter kategori per jenis perubahan, dan penanda rilis terbaru.'
      },
      {
        type: 'added',
        title: 'Dialog Notifikasi "What\'s New"',
        description: 'Modal otomatis yang menginformasikan fitur baru kepada guru setiap kali ada pembaruan versi rilis berkala.'
      },
      {
        type: 'improved',
        title: 'Penataan Struktur File Bersih (Clean Architecture)',
        description: 'Restrukturisasi folder komponen menjadi Layout, UI, Print, Modals, dan View-specific sub-components untuk navigasi cepat dan skalabilitas tinggi.'
      },
      {
        type: 'improved',
        title: 'Sinkronisasi Versi Dinamis',
        description: 'Nomor versi sistem pada Sidebar, Header, dan Pengaturan otomatis tersinkronisasi langsung dari catatan rilis aktif.'
      }
    ]
  },
  {
    version: 'v2.5.0',
    releaseDate: '15 Agustus 2026',
    title: 'Penyempurnaan Rekap Nilai Harian & Jadwal Pelajaran',
    badge: 'Stabil',
    highlights: 'Fokus pada digitalisasi dokumen dinas resmi kurikulum merdeka dan kemudahan cetak format A4/F4.',
    changes: [
      {
        type: 'added',
        title: 'Rekap Nilai Ulangan Harian Lengkap',
        description: 'Perhitungan otomatis nilai UH 1–6, UTS, UAS dengan bobot KD dan pratinjau cetak daftar nilai resmi.'
      },
      {
        type: 'added',
        title: 'Cetak Jadwal Pelajaran Resmi',
        description: 'Format dokumen dinas jadwal mengajar mingguan siap cetak dan tanda tangan kepala madrasah/sekolah.'
      },
      {
        type: 'improved',
        title: 'Standarisasi Kop Surat & Tanda Tangan',
        description: 'Komponen kop surat dinas ganda (logo kiri-kanan) dan blok tanda tangan otomatis di seluruh lembar cetak.'
      },
      {
        type: 'security',
        title: 'Pencegahan Input Nilai Tak Valid',
        description: 'Validasi angka nilai 0–100 dan auto-highlight siswa di bawah KKM/Kriteria Ketuntasan.'
      }
    ]
  },
  {
    version: 'v2.4.0',
    releaseDate: '01 Agustus 2026',
    title: 'Mode Kiosk Layar Penuh Gerbang & Sound Feedback',
    badge: 'Stabil',
    highlights: 'Menghadirkan pengalaman presensi mandiri di gerbang lobi dengan visual futuristik dan suara konfirmasi responsif.',
    changes: [
      {
        type: 'added',
        title: 'Mode Kiosk Lobi & Gerbang',
        description: 'Tampilan layar penuh khusus pemindaian QR mandiri siswa dengan jam digital besar dan live feed log kedatangan.'
      },
      {
        type: 'added',
        title: 'Audio Synthesizer Terintegrasi',
        description: 'Efek suara bip konfirmasi saat scan berhasil, peringatan saat terlambat, dan buzzer saat kartu tidak dikenali.'
      },
      {
        type: 'improved',
        title: 'Optimalisasi Mesin Pemindai QR',
        description: 'Deteksi kamera ganda (depan/belakang) dengan auto-focus dan rendering resolusi tinggi tanpa lag.'
      },
      {
        type: 'fixed',
        title: 'Penyesuaian Toleransi Jam Masuk',
        description: 'Perhitungan status Terlambat otomatis tepat sesuai batas toleransi menit yang dikonfigurasi.'
      }
    ]
  },
  {
    version: 'v2.3.0',
    releaseDate: '18 Juli 2026',
    title: 'Manajemen Multi Tahun Ajaran & Cadangan Terenkripsi',
    badge: 'Stabil',
    highlights: 'Mendukung kelangsungan data antar tahun pelajaran dan keamanan data sekolah tingkat lanjut.',
    changes: [
      {
        type: 'added',
        title: 'Pengelolaan Tahun Ajaran & Semester',
        description: 'Fitur ganti semester (Ganjil/Genap), aktivasi periode baru, dan pengarsipan rekam jejak tahun ajaran lampau.'
      },
      {
        type: 'added',
        title: 'Backup & Restore JSON Cerdas',
        description: 'Pencadangan seluruh database ke format file JSON terstruktur dengan opsi Timpa Bersih (Overwrite) atau Gabungkan (Merge).'
      },
      {
        type: 'security',
        title: 'Keamanan 2FA & Biometrik WebAuthn',
        description: 'Perlindungan akun admin dengan PIN 6-digit dan login menggunakan sensor sidik jari perangkat laptop/ponsel.'
      }
    ]
  },
  {
    version: 'v2.2.0',
    releaseDate: '05 Juli 2026',
    title: 'Buku Jurnal Mengajar & Generator Kartu QR Massal',
    badge: 'Stabil',
    highlights: 'Mempercepat administrasi harian guru di kelas serta cetak kartu identitas siswa dalam berbagai ukuran kertas.',
    changes: [
      {
        type: 'added',
        title: 'Buku Jurnal Pembelajaran Guru',
        description: 'Pencatatan agenda materi harian kelas yang otomatis terhubung dengan data kehadiran siswa saat jam mengajar.'
      },
      {
        type: 'added',
        title: 'Pilihan Ukuran Kertas Kartu QR',
        description: 'Tata letak cetak ID Card fleksibel di kertas A4, F4/Folio, Legal, dan Letter dengan garis potong presisi.'
      },
      {
        type: 'improved',
        title: 'Sinkronisasi Google Sheets (Apps Script)',
        description: 'Ekspor log presensi langsung ke Google Spreadsheet secara terotomatisasi.'
      }
    ]
  },
  {
    version: 'v2.0.0',
    releaseDate: '01 Juni 2026',
    title: 'Peluncuran Sistem QR-Presensi Siswa Terpadu',
    badge: 'Mayor',
    highlights: 'Rilis perdana platform manajemen presensi siswa berbasis QR Code dengan penyimpanan cloud real-time.',
    changes: [
      {
        type: 'added',
        title: 'Sistem Pemindaian QR Code Real-time',
        description: 'Pencatatan presensi siswa cepat via barcode QR dengan identifikasi instan nama, NISN, dan kelas.'
      },
      {
        type: 'added',
        title: 'Dashboard Analitik & Status Harian',
        description: 'Statistik kehadiran kelas, diagram donat, visualisasi jam kedatangan, dan peringatan siswa belum absen.'
      },
      {
        type: 'added',
        title: 'Database Cloud Firestore & Offline Sync',
        description: 'Penyimpanan data awan yang aman, stabil, dan dapat diakses dari berbagai perangkat.'
      }
    ]
  }
];

// Deklarasi global build-time metadata yang diinjeksi oleh Vite
declare const __APP_BUILD_TIME__: string | undefined;
declare const __APP_BUILD_ID__: string | undefined;

// Versi saat ini didapatkan secara otomatis dan dinamis dari rilis teratas
export const CURRENT_APP_VERSION = CHANGELOG_DATA[0]?.version || 'v2.8.0';
export const CURRENT_RELEASE_DATE = CHANGELOG_DATA[0]?.releaseDate || '';
export const CURRENT_RELEASE_TITLE = CHANGELOG_DATA[0]?.title || '';
export const CURRENT_RELEASE_HIGHLIGHTS = CHANGELOG_DATA[0]?.highlights || '';

export const APP_BUILD_TIME = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : new Date().toISOString();
export const APP_BUILD_ID = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'dev-build';

export function getFullAppVersionDisplay(): string {
  return `${CURRENT_APP_VERSION} (Build ${APP_BUILD_ID})`;
}

