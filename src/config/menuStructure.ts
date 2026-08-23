import { TabType } from '../types';

export interface SubMenuItemConfig {
  id: string;
  label: string;
  shortLabel?: string;
  description: string;
  iconName: string;
  badge?: string | number;
}

export interface MenuItemConfig {
  id: TabType;
  label: string;
  description: string;
  iconName: string;
  defaultSubTab: string;
  subMenus: SubMenuItemConfig[];
}

export const MENU_STRUCTURE: MenuItemConfig[] = [
  {
    id: 'Dashboard',
    label: 'Dashboard',
    description: 'Pusat kontrol kehadiran real-time & aktivitas presensi harian',
    iconName: 'LayoutDashboard',
    defaultSubTab: 'ringkasan',
    subMenus: [
      {
        id: 'ringkasan',
        label: 'Ringkasan & Aktivitas',
        shortLabel: 'Ringkasan',
        description: 'Statistik live, grafik persentase kehadiran & feed log presensi hari ini',
        iconName: 'BarChart3'
      },
      {
        id: 'grafik-analisis',
        label: 'Grafik & Visualisasi',
        shortLabel: 'Grafik Kehadiran',
        description: 'Visualisasi tren kehadiran, diagram donat status, pola jam kedatangan & komparasi kelas',
        iconName: 'Sparkles'
      },
      {
        id: 'manual',
        label: 'Presensi Manual & Grid',
        shortLabel: 'Presensi Manual',
        description: 'Matriks tombol cepat per kelas (H, T, I, S, A) & pencarian manual siswa',
        iconName: 'UserCheck'
      },
      {
        id: 'kiosk-scanner',
        label: 'Scanner QR & Lobi',
        shortLabel: 'Scan & Kiosk',
        description: 'Pemindai kamera QR cepat & mode layar penuh kiosk gerbang lobi',
        iconName: 'Monitor'
      }
    ]
  },
  {
    id: 'Siswa',
    label: 'Data Siswa',
    description: 'Direktori data induk peserta didik, rekam jejak & pendaftaran',
    iconName: 'Users',
    defaultSubTab: 'daftar',
    subMenus: [
      {
        id: 'daftar',
        label: 'Daftar & Direktori Siswa',
        shortLabel: 'Daftar Siswa',
        description: 'Tabel lengkap data siswa, filter kelas, rekam jejak & kartu profil',
        iconName: 'Users'
      },
      {
        id: 'tambah',
        label: 'Tambah Siswa Baru',
        shortLabel: 'Tambah Siswa',
        description: 'Formulir pendaftaran siswa baru beserta NISN, kelas & kontak wali',
        iconName: 'UserPlus'
      },
      {
        id: 'impor-ekspor',
        label: 'Impor & Ekspor Data',
        shortLabel: 'Impor / Ekspor',
        description: 'Unggah file CSV massal, unduh format template Excel & ekspor data',
        iconName: 'FileSpreadsheet'
      }
    ]
  },
  {
    id: 'Kartu QR',
    label: 'Kartu QR Siswa',
    description: 'Generator ID Card siswa berstandar cetak massal & PVC',
    iconName: 'QrCode',
    defaultSubTab: 'cetak-massal',
    subMenus: [
      {
        id: 'cetak-massal',
        label: 'Cetak Lembar Massal',
        shortLabel: 'Cetak Massal',
        description: 'Cetak kumpulan kartu siswa dalam lembar kertas (A4, F4, Letter) dengan garis potong',
        iconName: 'Printer'
      },
      {
        id: 'desain-kustom',
        label: 'Pengaturan Layout & Kertas',
        shortLabel: 'Layout & Kertas',
        description: 'Atur ukuran kertas (A4/F4/Legal/Kustom), margin, orientasi & dimensi kartu',
        iconName: 'Sliders'
      },
      {
        id: 'pratinjau-individu',
        label: 'Pratinjau Per Siswa',
        shortLabel: 'Kartu Individu',
        description: 'Pencarian & pratinjau kartu perorangan depan dan belakang siap cetak',
        iconName: 'Eye'
      }
    ]
  },
  {
    id: 'Riwayat',
    label: 'Riwayat Presensi',
    description: 'Arsip log kehadiran, rekapitulasi periodik & koreksi data',
    iconName: 'History',
    defaultSubTab: 'log-presensi',
    subMenus: [
      {
        id: 'log-presensi',
        label: 'Log Presensi Lengkap',
        shortLabel: 'Log Presensi',
        description: 'Daftar riwayat scan berdasarkan rentang harian, mingguan, bulanan & semester',
        iconName: 'Clock'
      },
      {
        id: 'rekap-statistik',
        label: 'Rekapitulasi & Statistik',
        shortLabel: 'Rekap & Grafik',
        description: 'Akumulasi total kehadiran kelas, persentase tepat waktu & ekspor CSV',
        iconName: 'BarChart3'
      },
      {
        id: 'kelola-koreksi',
        label: 'Kelola & Koreksi Data',
        shortLabel: 'Koreksi Data',
        description: 'Edit tanggal, jam, status kehadiran siswa & sinkronisasi Google Sheets',
        iconName: 'Sliders'
      }
    ]
  },
  {
    id: 'Jadwal Mengajar',
    label: 'Jadwal Mengajar',
    description: 'Jadwal tatap muka mingguan, kelas hari ini & sinkronisasi siswa aktif',
    iconName: 'CalendarDays',
    defaultSubTab: 'jadwal-hari-ini',
    subMenus: [
      {
        id: 'jadwal-hari-ini',
        label: 'Jadwal Hari Ini & Kelas',
        shortLabel: 'Hari Ini',
        description: 'Jadwal mengajar aktif hari ini, daftar siswa kelas terkait & status presensi live',
        iconName: 'UserCheck'
      },
      {
        id: 'kelola-jadwal',
        label: 'Kelola Jadwal Mingguan',
        shortLabel: 'Jadwal Mingguan',
        description: 'Matriks master jadwal mengajar Senin–Sabtu, jam tatap muka & alokasi ruang/lab',
        iconName: 'CalendarDays'
      },
      {
        id: 'beban-mengajar',
        label: 'Beban Mengajar Guru',
        shortLabel: 'Beban Kerja',
        description: 'Analisis jam tatap muka (JP), ekuivalensi tugas tambahan & kelayakan sertifikasi guru',
        iconName: 'Briefcase'
      },
      {
        id: 'cetak-jadwal',
        label: 'Cetak Jadwal Pelajaran',
        shortLabel: 'Cetak Jadwal',
        description: 'Format dokumen dinas resmi jadwal mengajar guru siap cetak & tanda tangan',
        iconName: 'Printer'
      }
    ]
  },
  {
    id: 'Jurnal Mengajar',
    label: 'Jurnal Mengajar',
    description: 'Catatan harian kegiatan pembelajaran & agenda mengajar guru',
    iconName: 'BookOpen',
    defaultSubTab: 'daftar-jurnal',
    subMenus: [
      {
        id: 'daftar-jurnal',
        label: 'Daftar Jurnal Mengajar',
        shortLabel: 'Daftar Jurnal',
        description: 'Riwayat jurnal terisi, filter per kelas/bulan & rekap agenda materi',
        iconName: 'BookOpen'
      },
      {
        id: 'isi-jurnal',
        label: 'Isi / Buat Jurnal Baru',
        shortLabel: 'Isi Jurnal Baru',
        description: 'Form input kegiatan belajar dengan integrasi absensi siswa otomatis',
        iconName: 'FileText'
      },
      {
        id: 'cetak-laporan',
        label: 'Cetak & Format Laporan',
        shortLabel: 'Cetak Dokumen',
        description: 'Pratinjau cetak buku jurnal dinas resmi lengkap dengan paraf pengesahan',
        iconName: 'Printer'
      }
    ]
  },
  {
    id: 'Penilaian Harian',
    label: 'Penilaian Harian',
    description: 'Buku rekapitulasi nilai Ulangan Harian (UH 1–6), UTS & UAS',
    iconName: 'Award',
    defaultSubTab: 'input-nilai',
    subMenus: [
      {
        id: 'input-nilai',
        label: 'Matriks & Input Nilai',
        shortLabel: 'Input Nilai',
        description: 'Tabel input nilai siswa UH 1..6, UTS, UAS & kalkulasi Nilai Akhir otomatis',
        iconName: 'Award'
      },
      {
        id: 'bobot-materi',
        label: 'Bobot & Materi UH',
        shortLabel: 'Bobot & Materi',
        description: 'Konfigurasi materi pokok bahasan KD, tanggal pelaksanaan & persentase bobot',
        iconName: 'Percent'
      },
      {
        id: 'cetak-rekap',
        label: 'Cetak Rekap Nilai Resmi',
        shortLabel: 'Cetak Daftar Nilai',
        description: 'Format cetak resmi kurikulum siap tanda tangan guru & kepala madrasah',
        iconName: 'Printer'
      }
    ]
  },
  {
    id: 'Pengaturan',
    label: 'Pengaturan',
    description: 'Konfigurasi sekolah, jam masuk, 2FA biometrik, tema & cadangan data',
    iconName: 'Settings',
    defaultSubTab: 'profil-sekolah',
    subMenus: [
      {
        id: 'profil-sekolah',
        label: 'Profil Sekolah & Guru',
        shortLabel: 'Profil Sekolah',
        description: 'Data identitas madrasah/sekolah, logo, nama guru, NIP & tanda tangan',
        iconName: 'GraduationCap'
      },
      {
        id: 'jam-absensi',
        label: 'Waktu & Jam Presensi',
        shortLabel: 'Jam & Audio',
        description: 'Jadwal jam masuk, batas toleransi keterlambatan & efek suara scanner',
        iconName: 'Clock'
      },
      {
        id: 'tahun-ajaran',
        label: 'Tahun Ajaran & Semester',
        shortLabel: 'Tahun Ajaran',
        description: 'Kelola kalender akademik aktif, semester ganjil/genap & arsip periode',
        iconName: 'CalendarDays'
      },
      {
        id: 'keamanan-2fa',
        label: 'Keamanan & 2FA Biometrik',
        shortLabel: 'Keamanan & 2FA',
        description: 'Akun Administrator, sandi, PIN 6-Digit & sensor sidik jari perangkat',
        iconName: 'ShieldCheck'
      },
      {
        id: 'tema-tampilan',
        label: 'Tampilan & Tema Warna',
        shortLabel: 'Tema & Warna',
        description: 'Kustomisasi mode gelap/terang dan palet warna aksen antarmuka',
        iconName: 'Palette'
      },
      {
        id: 'backup-restore',
        label: 'Backup & Restore Data',
        shortLabel: 'Backup & Pulihkan',
        description: 'Cadangkan seluruh database ke file JSON & pulihkan data kapan saja',
        iconName: 'HardDrive'
      },
      {
        id: 'changelog',
        label: 'Riwayat Versi & Changelog',
        shortLabel: 'Catatan Rilis',
        description: 'Catatan pembaruan berkala, riwayat versi sistem & log rilis fitur',
        iconName: 'Sparkles'
      }
    ]
  }
];

export const getMenuConfig = (tab: TabType): MenuItemConfig => {
  const found = MENU_STRUCTURE.find(m => m.id === tab);
  return found || MENU_STRUCTURE[0];
};

export const getSubMenuConfig = (tab: TabType, subTabId: string): SubMenuItemConfig | undefined => {
  const menu = getMenuConfig(tab);
  return menu.subMenus.find(s => s.id === subTabId) || menu.subMenus[0];
};
