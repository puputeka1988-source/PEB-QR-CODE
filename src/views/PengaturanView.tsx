import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { cleanTimeFormat } from '../utils/formatters';
import { ThemeMode, ThemeAccent, AcademicYear } from '../types';
import { 
  Settings, Save, Volume2, VolumeX, Clock, Building, RefreshCw, Trash2, 
  Sparkles, KeyRound, User, Upload, Image as ImageIcon, BookOpen, Award, Phone, 
  UserCheck, X, GraduationCap, ShieldCheck, Palette, Sun, Moon, Laptop, Check, Eye,
  Calendar, Archive, ArchiveRestore, Plus, CheckCircle2, AlertCircle, FolderArchive,
  Layers, ChevronRight, Edit3, ArrowUpRight, Download, UploadCloud, FileJson, Database,
  RotateCcw, FileCheck, Maximize2, Monitor, CheckCheck, HelpCircle, HardDrive
} from 'lucide-react';
import { FullBackupPayload, validateBackupJson, downloadBackupJson } from '../utils/backupRestore';

export const PengaturanView: React.FC = () => {
  const { 
    settings, updateSettings, resetToSampleData, setAttendance, showToast, 
    setThemeMode, setThemeAccent, effectiveTheme,
    academicYears, activeAcademicYear, addAcademicYear, updateAcademicYear,
    deleteAcademicYear, setActiveAcademicYear, toggleArchiveAcademicYear,
    students, attendance, journals,
    exportBackupJson, restoreFullBackup, autoSnapshot, refreshAutoSnapshot,
    setIsKioskMode
  } = useApp();

  const [sekolah, setSekolah] = useState(settings.sekolah);
  const [npsn, setNpsn] = useState(settings.npsn || '');
  const [alamat, setAlamat] = useState(settings.alamat || '');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');

  // Academic Year Management states
  const [ayModalOpen, setAyModalOpen] = useState(false);
  const [editingAyId, setEditingAyId] = useState<string | null>(null);
  const [ayName, setAyName] = useState('2025/2026');
  const [aySemester, setAySemester] = useState<'1 (Ganjil)' | '2 (Genap)'>('1 (Ganjil)');
  const [ayStartDate, setAyStartDate] = useState('2025-07-15');
  const [ayEndDate, setAyEndDate] = useState('2025-12-20');
  const [ayNotes, setAyNotes] = useState('');
  const [ayIsCurrent, setAyIsCurrent] = useState(false);
  const [ayIsArchived, setAyIsArchived] = useState(false);
  const [ayFilterTab, setAyFilterTab] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');
  const [confirmDeleteAyId, setConfirmDeleteAyId] = useState<string | null>(null);
  
  const [jamMasuk, setJamMasuk] = useState(() => cleanTimeFormat(settings.jamMasuk).slice(0, 5) || '07:00');
  const [jamTerlambat, setJamTerlambat] = useState(() => cleanTimeFormat(settings.jamTerlambat).slice(0, 5) || '07:15');

  // Theme states
  const [themeModeState, setThemeModeState] = useState<ThemeMode>(settings.themeMode || 'dark');
  const [themeAccentState, setThemeAccentState] = useState<ThemeAccent>(settings.themeAccent || 'emerald');

  useEffect(() => {
    if (settings.themeMode) setThemeModeState(settings.themeMode);
    if (settings.themeAccent) setThemeAccentState(settings.themeAccent);
  }, [settings.themeMode, settings.themeAccent]);

  useEffect(() => {
    if (settings.jamMasuk) {
      setJamMasuk(cleanTimeFormat(settings.jamMasuk).slice(0, 5) || '07:00');
    }
    if (settings.jamTerlambat) {
      setJamTerlambat(cleanTimeFormat(settings.jamTerlambat).slice(0, 5) || '07:15');
    }
  }, [settings.jamMasuk, settings.jamTerlambat]);
  const [enableSound, setEnableSound] = useState(settings.enableSound);
  const [adminUsername, setAdminUsername] = useState(settings.adminUsername || 'admin');
  const [adminPassword, setAdminPassword] = useState(settings.adminPassword || 'admin123');

  // Teacher / Admin Profile states
  const [namaGuru, setNamaGuru] = useState(settings.namaGuru || '');
  const [nip, setNip] = useState(settings.nip || '');
  const [mataPelajaran, setMataPelajaran] = useState(settings.mataPelajaran || '');
  const [jabatan, setJabatan] = useState(settings.jabatan || '');
  const [guruPhone, setGuruPhone] = useState(settings.guruPhone || '');
  const [guruPhotoUrl, setGuruPhotoUrl] = useState(settings.guruPhotoUrl || '');
  const [guruBio, setGuruBio] = useState(settings.guruBio || '');
  const [ttdGuruUrl, setTtdGuruUrl] = useState(settings.ttdGuruUrl || '');
  const [kotaTandaTangan, setKotaTandaTangan] = useState(settings.kotaTandaTangan || 'Bula');

  // Principal / Kepala Sekolah Profile states
  const [namaKepalaSekolah, setNamaKepalaSekolah] = useState(settings.namaKepalaSekolah || '');
  const [nipKepalaSekolah, setNipKepalaSekolah] = useState(settings.nipKepalaSekolah || '');
  const [jabatanKepalaSekolah, setJabatanKepalaSekolah] = useState(settings.jabatanKepalaSekolah || 'Kepala Sekolah');
  const [ttdKepalaSekolahUrl, setTtdKepalaSekolahUrl] = useState(settings.ttdKepalaSekolahUrl || '');

  // Confirmation Modals
  const [confirmClearLogsOpen, setConfirmClearLogsOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Backup & Restore 1-Klik States
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<FullBackupPayload | null>(null);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDraggingJson, setIsDraggingJson] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Handle incoming JSON file for restore
  const handleProcessJsonFile = (file: File) => {
    setFileError(null);
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setFileError('Format file tidak sesuai. Harap unggah file cadangan berekstensi .json');
      showToast('Harap pilih file berformat .JSON', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const validation = validateBackupJson(text);
        if (!validation.isValid || !validation.payload) {
          setFileError(validation.error || 'File JSON tidak valid.');
          showToast(validation.error || 'Format JSON tidak valid.', 'error');
          return;
        }

        setPendingPayload(validation.payload);
        setRestoreModalOpen(true);
      } catch (err: any) {
        setFileError(`Gagal membaca file: ${err?.message || 'Error'}`);
        showToast('Gagal memproses file JSON.', 'error');
      }
    };
    reader.onerror = () => {
      setFileError('Terjadi kesalahan saat membaca file dari komputer.');
      showToast('Gagal membaca file.', 'error');
    };
    reader.readAsText(file);
  };

  const handleJsonFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessJsonFile(file);
      // Reset input value so same file can be re-selected if desired
      e.target.value = '';
    }
  };

  const handleJsonDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingJson(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessJsonFile(file);
    }
  };

  const handleExecuteRestore = async () => {
    if (!pendingPayload) return;
    setIsRestoring(true);
    const res = await restoreFullBackup(pendingPayload, restoreMode);
    setIsRestoring(false);
    if (res.success) {
      setRestoreModalOpen(false);
      setPendingPayload(null);
    }
  };

  const handleRestoreAutoSnapshot = async () => {
    if (!autoSnapshot) {
      showToast('Tidak ada snapshot otomatis yang tersimpan di memori lokal.', 'warning');
      return;
    }
    setPendingPayload(autoSnapshot);
    setRestoreMode('overwrite');
    setRestoreModalOpen(true);
  };

  // Helper for compressing image before saving to localStorage to prevent QuotaExceededError
  const compressImage = (file: File, maxWidth = 400, maxHeight = 400, quality = 0.9): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Retain image/png for PNGs to preserve background transparency
            const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            resolve(canvas.toDataURL(mimeType, quality));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Gagal memproses file gambar'));
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit upload capacity to max 500 KB
    const MAX_SIZE_BYTES = 500 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      showToast(`Ukuran file logo (${(file.size / 1024).toFixed(0)} KB) melebihi batas maksimal 500 KB.`, 'error');
      e.target.value = '';
      return;
    }

    try {
      const compressed = await compressImage(file, 400, 400, 0.9);
      setLogoUrl(compressed);
      showToast('Logo sekolah berhasil diupload & dioptimalkan.', 'success');
    } catch (err) {
      showToast('Gagal memproses file logo.', 'error');
    }
  };

  const handleGuruPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit upload capacity to max 500 KB
    const MAX_SIZE_BYTES = 500 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      showToast(`Ukuran file foto (${(file.size / 1024).toFixed(0)} KB) melebihi batas maksimal 500 KB.`, 'error');
      e.target.value = '';
      return;
    }

    try {
      const compressed = await compressImage(file, 400, 400, 0.9);
      setGuruPhotoUrl(compressed);
      showToast('Foto profil guru berhasil diupload & dioptimalkan.', 'success');
    } catch (err) {
      showToast('Gagal memproses foto guru.', 'error');
    }
  };

  const handleTtdGuruUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format (PNG, JPEG, JPG)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      showToast('Format file tanda tangan harus berupa PNG, JPEG, atau JPG.', 'error');
      e.target.value = '';
      return;
    }

    // Limit upload capacity to max 1 MB
    const MAX_SIZE_BYTES = 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      showToast(`Ukuran file tanda tangan (${(file.size / 1024).toFixed(0)} KB) melebihi batas maksimal 1 MB.`, 'error');
      e.target.value = '';
      return;
    }

    try {
      const compressed = await compressImage(file, 500, 300, 0.95);
      setTtdGuruUrl(compressed);
      showToast('File tanda tangan Guru berhasil diupload & dioptimalkan!', 'success');
    } catch (err) {
      showToast('Gagal memproses gambar tanda tangan.', 'error');
    }
  };

  const handleTtdKepalaSekolahUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format (PNG, JPEG, JPG)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      showToast('Format file tanda tangan harus berupa PNG, JPEG, atau JPG.', 'error');
      e.target.value = '';
      return;
    }

    // Limit upload capacity to max 1 MB
    const MAX_SIZE_BYTES = 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      showToast(`Ukuran file tanda tangan (${(file.size / 1024).toFixed(0)} KB) melebihi batas maksimal 1 MB.`, 'error');
      e.target.value = '';
      return;
    }

    try {
      const compressed = await compressImage(file, 500, 300, 0.95);
      setTtdKepalaSekolahUrl(compressed);
      showToast('File tanda tangan Kepala Sekolah berhasil diupload & dioptimalkan!', 'success');
    } catch (err) {
      showToast('Gagal memproses gambar tanda tangan.', 'error');
    }
  };

  const selectThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    setThemeMode(mode);
  };

  const selectThemeAccent = (accent: ThemeAccent) => {
    setThemeAccentState(accent);
    setThemeAccent(accent);
  };

  const openAddAyModal = () => {
    setEditingAyId(null);
    setAyName('');
    setAySemester('1 (Ganjil)');
    setAyStartDate('');
    setAyEndDate('');
    setAyNotes('');
    setAyIsCurrent(false);
    setAyIsArchived(false);
    setAyModalOpen(true);
  };

  const openEditAyModal = (ay: AcademicYear) => {
    setEditingAyId(ay.id);
    setAyName(ay.name);
    setAySemester(ay.semester);
    setAyStartDate(ay.startDate || '');
    setAyEndDate(ay.endDate || '');
    setAyNotes(ay.notes || '');
    setAyIsCurrent(ay.isCurrent);
    setAyIsArchived(ay.isArchived);
    setAyModalOpen(true);
  };

  const handleSaveAcademicYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ayName.trim()) {
      showToast('Nama Tahun Ajaran tidak boleh kosong (contoh: 2025/2026).', 'error');
      return;
    }

    if (editingAyId) {
      updateAcademicYear(editingAyId, {
        name: ayName.trim(),
        semester: aySemester,
        startDate: ayStartDate.trim() || undefined,
        endDate: ayEndDate.trim() || undefined,
        notes: ayNotes.trim() || undefined,
        isCurrent: ayIsCurrent,
        isArchived: ayIsArchived
      });
    } else {
      addAcademicYear({
        name: ayName.trim(),
        semester: aySemester,
        startDate: ayStartDate.trim() || undefined,
        endDate: ayEndDate.trim() || undefined,
        notes: ayNotes.trim() || undefined,
        isCurrent: ayIsCurrent,
        isArchived: ayIsArchived
      });
    }

    setAyModalOpen(false);
  };

  const filteredAcademicYears = academicYears.filter(ay => {
    if (ayFilterTab === 'ACTIVE') return !ay.isArchived;
    if (ayFilterTab === 'ARCHIVED') return ay.isArchived;
    return true;
  });

  const activeYearsCount = academicYears.filter(a => !a.isArchived).length;
  const archivedYearsCount = academicYears.filter(a => a.isArchived).length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedJamMasuk = cleanTimeFormat(jamMasuk).slice(0, 5) || '07:00';
    const cleanedJamTerlambat = cleanTimeFormat(jamTerlambat).slice(0, 5) || '07:15';
    updateSettings({
      sekolah: sekolah.trim(),
      npsn: npsn.trim(),
      alamat: alamat.trim(),
      logoUrl,
      jamMasuk: cleanedJamMasuk,
      jamTerlambat: cleanedJamTerlambat,
      enableSound,
      adminUsername: adminUsername.trim() || 'admin',
      adminPassword: adminPassword || 'admin123',
      namaGuru: namaGuru.trim(),
      nip: nip.trim(),
      mataPelajaran: mataPelajaran.trim(),
      jabatan: jabatan.trim(),
      guruPhone: guruPhone.trim(),
      guruPhotoUrl,
      guruBio: guruBio.trim(),
      ttdGuruUrl,
      namaKepalaSekolah: namaKepalaSekolah.trim(),
      nipKepalaSekolah: nipKepalaSekolah.trim(),
      jabatanKepalaSekolah: jabatanKepalaSekolah.trim() || 'Kepala Sekolah',
      ttdKepalaSekolahUrl,
      kotaTandaTangan: kotaTandaTangan.trim() || 'Bula',
      themeMode: themeModeState,
      themeAccent: themeAccentState
    });
  };

  const handleClearLogs = () => {
    setAttendance([]);
    showToast('Seluruh riwayat presensi telah dikosongkan.', 'info');
    setConfirmClearLogsOpen(false);
  };

  const handleResetSample = () => {
    resetToSampleData();
    showToast('Data berhasil di-reset ke data sampel awal.', 'success');
    setConfirmResetOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
      
      {/* Top Banner */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            Pengaturan Aplikasi & Profil Guru
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola identitas instansi, upload logo sekolah, profil guru pengampu & mata pelajaran, serta akses administrator.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Section: Tema & Personalisasi Tampilan Aplikasi (Option 2 - Full Theme Switcher) */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                Tema & Personalisasi Tampilan Aplikasi
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Kustomisasi mode gelap/terang dan warna aksen tombol/indikator aplikasi sesuai preferensi Anda.
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full self-start sm:self-auto flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Pratinjau Langsung Aktif
            </span>
          </div>

          {/* Sub-section 1: Mode Tampilan (Dark, Light, System) */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              1. Pilih Mode Tampilan (Dark / Light / Sistem):
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Dark Mode */}
              <button
                type="button"
                onClick={() => selectThemeMode('dark')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  themeModeState === 'dark'
                    ? 'bg-slate-800/90 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400">
                    <Moon className="w-4 h-4" />
                  </div>
                  {themeModeState === 'dark' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Mode Gelap (Dark)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Latar gelap pekat, nyaman di mata saat ruangan redup</p>
                </div>
              </button>

              {/* Light Mode */}
              <button
                type="button"
                onClick={() => selectThemeMode('light')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  themeModeState === 'light'
                    ? 'bg-slate-800/90 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Sun className="w-4 h-4" />
                  </div>
                  {themeModeState === 'light' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Mode Terang (Light)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Latar bersih kontras tinggi, ideal di ruang kelas siang hari</p>
                </div>
              </button>

              {/* Auto System Mode */}
              <button
                type="button"
                onClick={() => selectThemeMode('system')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  themeModeState === 'system'
                    ? 'bg-slate-800/90 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Laptop className="w-4 h-4" />
                  </div>
                  {themeModeState === 'system' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Otomatis Sistem (OS)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Menyesuaikan tema laptop/HP pengguna secara real-time</p>
                </div>
              </button>
            </div>
          </div>

          {/* Sub-section 2: Pilihan Warna Aksen (Color Accents) */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-slate-300">
              2. Pilih Warna Aksen Utama Aplikasi:
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {[
                { key: 'emerald', label: 'Emerald Edu', colorHex: '#10b981', border: 'border-emerald-500', bg: 'bg-emerald-500' },
                { key: 'blue', label: 'Ocean Blue', colorHex: '#2563eb', border: 'border-blue-500', bg: 'bg-blue-500' },
                { key: 'indigo', label: 'Royal Indigo', colorHex: '#6366f1', border: 'border-indigo-500', bg: 'bg-indigo-500' },
                { key: 'violet', label: 'Violet Purple', colorHex: '#8b5cf6', border: 'border-violet-500', bg: 'bg-violet-500' },
                { key: 'teal', label: 'Teal Bahari', colorHex: '#0d9488', border: 'border-teal-500', bg: 'bg-teal-500' },
                { key: 'amber', label: 'Amber Sunset', colorHex: '#f59e0b', border: 'border-amber-500', bg: 'bg-amber-500' },
                { key: 'rose', label: 'Rose Crimson', colorHex: '#f43f5e', border: 'border-rose-500', bg: 'bg-rose-500' }
              ].map((accent) => {
                const isSelected = themeAccentState === accent.key;
                return (
                  <button
                    key={accent.key}
                    type="button"
                    onClick={() => selectThemeAccent(accent.key as ThemeAccent)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2 text-center ${
                      isSelected
                        ? 'bg-slate-800 border-white/60 shadow-lg ring-2 ring-white/20'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="relative">
                      <div 
                        className={`w-7 h-7 rounded-full shadow-inner ${accent.bg}`}
                        style={{ backgroundColor: accent.colorHex }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-950">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-white truncate w-full">
                      {accent.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-section 3: Live Preview Component Showcase */}
          <div className="bg-slate-950/90 rounded-2xl border border-slate-800/90 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Contoh Pratinjau Komponen dengan Aksen Terpilih:
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Mode aktif: <strong className="text-white uppercase">{effectiveTheme}</strong> ({themeAccentState})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" /> Tombol Utama (Primary Button)
              </button>

              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <Check className="w-3 h-3" /> Hadir Tepat Waktu (Badge Aksen)
              </span>

              <div className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-slate-300">
                Presensi: <span className="text-emerald-400 font-bold">100% Aktif</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Identitas Sekolah & Upload Logo */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-400" />
            Identitas Instansi & Upload Logo Sekolah
          </h3>

          {/* Logo Upload Box */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden group">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo Sekolah" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center p-2">
                    <GraduationCap className="w-8 h-8 text-slate-600 mx-auto" />
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">Belum Ada Logo</span>
                  </div>
                )}
              </div>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-lg transition-colors cursor-pointer"
                  title="Hapus Logo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <p className="text-xs font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
                <ImageIcon className="w-4 h-4 text-emerald-400" /> Upload Logo Resmi Sekolah
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Logo ini akan ditampilkan di header aplikasi, kartu QR siswa, cetak laporan, dan layar login administrator (Format PNG/JPG/WEBP, <span className="text-emerald-400 font-semibold">Maksimal 500 KB</span>).
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-emerald-500/20">
                  <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Pilih File Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs border border-slate-700 cursor-pointer"
                  >
                    Reset ke Default
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Sekolah / Instansi:</label>
              <input
                type="text"
                required
                value={sekolah}
                onChange={(e) => setSekolah(e.target.value)}
                placeholder="Contoh: SMA Negeri 1 Kita"
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">NPSN / Kode Sekolah:</label>
              <input
                type="text"
                value={npsn}
                onChange={(e) => setNpsn(e.target.value)}
                placeholder="Contoh: 20261988"
                className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Sekolah:</label>
              <input
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Contoh: Jl. Pendidikan No. 45, Kota Edukasi"
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section: Pengelompokan & Manajemen Arsip Tahun Ajaran / Semester */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Pengelompokan & Manajemen Arsip Tahun Ajaran
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Atur tahun ajaran aktif berjalan, kelola riwayat tahun lampau dalam arsip, dan buat periode baru.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddAyModal}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tahun Ajaran</span>
            </button>
          </div>

          {/* Active Year Spotlight Card */}
          {activeAcademicYear && (
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Tahun Ajaran Aktif Saat Ini
                  </span>
                </div>
                <h4 className="text-lg font-black text-white">
                  Tahun Ajaran {activeAcademicYear.name} • Semester {activeAcademicYear.semester}
                </h4>
                <p className="text-xs text-slate-400">
                  {activeAcademicYear.startDate && activeAcademicYear.endDate 
                    ? `Periode Aktif: ${activeAcademicYear.startDate} s/d ${activeAcademicYear.endDate}`
                    : 'Periode aktif untuk seluruh pencatatan presensi siswa & jurnal mengajar'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Total Siswa</p>
                  <p className="text-sm font-bold text-white">{students.length}</p>
                </div>
                <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Presensi Tercatat</p>
                  <p className="text-sm font-bold text-emerald-400">{attendance.length}</p>
                </div>
                <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Jurnal Guru</p>
                  <p className="text-sm font-bold text-teal-400">{journals.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* Filter Tabs: Semua / Aktif / Arsip */}
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <button
              type="button"
              onClick={() => setAyFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                ayFilterTab === 'ALL'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Periode ({academicYears.length})
            </button>
            <button
              type="button"
              onClick={() => setAyFilterTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                ayFilterTab === 'ACTIVE'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Aktif & Draf ({activeYearsCount})
            </button>
            <button
              type="button"
              onClick={() => setAyFilterTab('ARCHIVED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                ayFilterTab === 'ARCHIVED'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              Diarsipkan ({archivedYearsCount})
            </button>
          </div>

          {/* Academic Years List */}
          <div className="space-y-3">
            {filteredAcademicYears.map(ay => (
              <div
                key={ay.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  ay.isCurrent
                    ? 'bg-slate-800/80 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                    : ay.isArchived
                    ? 'bg-slate-950/40 border-slate-800/80 opacity-80'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    ay.isCurrent
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : ay.isArchived
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {ay.isArchived ? <FolderArchive className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-white text-sm">
                        Tahun Ajaran {ay.name} • Semester {ay.semester}
                      </h4>

                      {ay.isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          🟢 AKTIF BERJALAN
                        </span>
                      )}

                      {ay.isArchived && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          📦 DIARSIPKAN
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400">
                      {ay.startDate && ay.endDate ? `Rentang Waktu: ${ay.startDate} s/d ${ay.endDate}` : 'Rentang tanggal belum dispesifikasi'}
                      {ay.notes ? ` • ${ay.notes}` : ''}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0">
                  {!ay.isCurrent && (
                    <button
                      type="button"
                      onClick={() => setActiveAcademicYear(ay.id)}
                      className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-bold px-3 py-1.5 rounded-xl text-xs border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                      title="Jadikan sebagai tahun ajaran aktif utama"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aktifkan</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleArchiveAcademicYear(ay.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      ay.isArchived
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500 hover:text-slate-950'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                    }`}
                    title={ay.isArchived ? 'Pulihkan dari arsip' : 'Masukkan ke arsip data lampau'}
                  >
                    {ay.isArchived ? (
                      <>
                        <ArchiveRestore className="w-3.5 h-3.5" />
                        <span>Buka Arsip</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-3.5 h-3.5" />
                        <span>Arsipkan</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditAyModal(ay)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                    title="Edit Data Tahun Ajaran"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {!ay.isCurrent && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteAyId(ay.id)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 transition-colors cursor-pointer"
                      title="Hapus Tahun Ajaran"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Profil Guru / Admin & Mata Pelajaran */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Profil Guru / Admin & Mata Pelajaran yang Diampu
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Informasi identitas guru/admin ini akan dicantumkan pada kartu QR, laporan cetak presensi, dan sidebar aplikasi.
              </p>
            </div>
          </div>

          {/* Photo & Main Details Upload */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden group">
                {guruPhotoUrl ? (
                  <img src={guruPhotoUrl} alt={namaGuru} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <User className="w-8 h-8 text-slate-600 mx-auto" />
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">Foto Guru</span>
                  </div>
                )}
              </div>
              {guruPhotoUrl && (
                <button
                  type="button"
                  onClick={() => setGuruPhotoUrl('')}
                  className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-lg transition-colors cursor-pointer"
                  title="Hapus Foto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <p className="text-xs font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
                <Upload className="w-4 h-4 text-emerald-400" /> Upload Foto Profil Guru / Admin
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Upload foto formal/resmi guru pengampu atau wali kelas (Format JPG/PNG/WEBP, <span className="text-emerald-400 font-semibold">Maksimal 500 KB</span>).
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-emerald-500/20">
                  <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Pilih Foto Guru</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleGuruPhotoUpload}
                    className="hidden"
                  />
                </label>
                {guruPhotoUrl && (
                  <button
                    type="button"
                    onClick={() => setGuruPhotoUrl('')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs border border-slate-700 cursor-pointer"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Lengkap & Gelar Guru / Admin:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={namaGuru}
                  onChange={(e) => setNamaGuru(e.target.value)}
                  placeholder="Contoh: Ahmad Subagja, S.Kom"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                NIP / NUPTK / Kode Guru:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Award className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Contoh: 19880512 201503 1 004"
                  className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mata Pelajaran yang Diampu:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                </div>
                <input
                  type="text"
                  value={mataPelajaran}
                  onChange={(e) => setMataPelajaran(e.target.value)}
                  placeholder="Contoh: Informatika & Pemrograman"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Jabatan / Peran di Sekolah:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                </div>
                <input
                  type="text"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  placeholder="Contoh: Guru Mata Pelajaran & Admin Presensi"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kota / Tempat / Kecamatan Tanda Tangan:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Building className="w-4 h-4 text-emerald-400" />
                </div>
                <input
                  type="text"
                  value={kotaTandaTangan}
                  onChange={(e) => setKotaTandaTangan(e.target.value)}
                  placeholder="Contoh: Bula, Kec. Bula, atau Ambon"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                No. WhatsApp / Telepon Guru:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={guruPhone}
                  onChange={(e) => setGuruPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Catatan / Bio Guru:
              </label>
              <textarea
                rows={2}
                value={guruBio}
                onChange={(e) => setGuruBio(e.target.value)}
                placeholder="Catatan singkat atau sambutan guru..."
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Upload File Tanda Tangan Digital Guru Mata Pelajaran (PNG, JPEG, JPG) */}
            <div className="md:col-span-2 bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Upload Tanda Tangan Digital Guru Mata Pelajaran</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      PNG, JPEG, JPG
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tanda tangan ini akan otomatis dicetak pada blok tanda tangan (Guru Mata Pelajaran) di seluruh lembar laporan. Format PNG transparan direkomendasikan.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4 pt-1">
                {/* Preview Box */}
                <div className="w-full md:w-56 h-28 bg-white/95 rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center p-2 relative shrink-0 shadow-inner overflow-hidden">
                  {ttdGuruUrl ? (
                    <>
                      <img 
                        src={ttdGuruUrl} 
                        alt="Preview Tanda Tangan Guru" 
                        className="max-h-20 max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setTtdGuruUrl('')}
                        className="absolute top-1 right-1 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-lg transition-colors cursor-pointer shadow"
                        title="Hapus Tanda Tangan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center space-y-1">
                      <ImageIcon className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-[10px] font-medium text-slate-500">Belum Ada Tanda Tangan</p>
                      <p className="text-[9px] text-slate-400">Kosong (Tanda Tangan Manual)</p>
                    </div>
                  )}
                </div>

                {/* Upload Action */}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-center">
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <span>Pilih File Tanda Tangan Guru (PNG / JPG)</span>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg" 
                        onChange={handleTtdGuruUpload}
                        className="hidden" 
                      />
                    </label>

                    {ttdGuruUrl && (
                      <button
                        type="button"
                        onClick={() => setTtdGuruUrl('')}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold whitespace-nowrap"
                      >
                        Hapus
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    💡 <strong>Tips:</strong> Gunakan foto/scan tanda tangan pada kertas putih bersih atau gambar berlatar belakang transparan (PNG). Ukuran maksimal file: 1 MB.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2.5: Profil Kepala Sekolah (Untuk Pengesahan & Tanda Tangan Laporan) */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Profil Kepala Sekolah (Atasan & Pengesahan Laporan)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Data Kepala Sekolah ini akan terintegrasi secara otomatis pada blok tanda tangan pengesahan (Mengetahui, Kepala Sekolah) di seluruh lembar cetak laporan (Jurnal Mengajar, Rekapan Presensi, dan Penilaian Harian).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Lengkap & Gelar Kepala Sekolah:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4 text-emerald-400" />
                </div>
                <input
                  type="text"
                  value={namaKepalaSekolah}
                  onChange={(e) => setNamaKepalaSekolah(e.target.value)}
                  placeholder="Contoh: Drs. H. Ahmad Dahlan, M.Pd"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                NIP Kepala Sekolah:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <input
                  type="text"
                  value={nipKepalaSekolah}
                  onChange={(e) => setNipKepalaSekolah(e.target.value)}
                  placeholder="Contoh: 19700101 199503 1 001"
                  className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Jabatan / Sebutan Pengesah (Sesuai Nomenklatur):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                </div>
                <input
                  type="text"
                  value={jabatanKepalaSekolah}
                  onChange={(e) => setJabatanKepalaSekolah(e.target.value)}
                  placeholder="Contoh: Kepala Sekolah / Kepala SMA Negeri 1 Kita"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Upload File Tanda Tangan Digital Kepala Sekolah (PNG, JPEG, JPG) */}
            <div className="md:col-span-2 bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Upload Tanda Tangan Digital Kepala Sekolah</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      PNG, JPEG, JPG
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tanda tangan ini akan otomatis muncul pada blok dokumen cetak laporan (Jurnal Mengajar, Presensi, & Penilaian). Format PNG transparan direkomendasikan.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4 pt-1">
                {/* Preview Box */}
                <div className="w-full md:w-56 h-28 bg-white/95 rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center p-2 relative shrink-0 shadow-inner overflow-hidden">
                  {ttdKepalaSekolahUrl ? (
                    <>
                      <img 
                        src={ttdKepalaSekolahUrl} 
                        alt="Preview Tanda Tangan Kepala Sekolah" 
                        className="max-h-20 max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setTtdKepalaSekolahUrl('')}
                        className="absolute top-1 right-1 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-lg transition-colors cursor-pointer shadow"
                        title="Hapus Tanda Tangan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center space-y-1">
                      <ImageIcon className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-[10px] font-medium text-slate-500">Belum Ada Tanda Tangan</p>
                      <p className="text-[9px] text-slate-400">Kosong (Tanda Tangan Manual)</p>
                    </div>
                  )}
                </div>

                {/* Upload Action */}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-center">
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <span>Pilih File Tanda Tangan (PNG / JPG)</span>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg" 
                        onChange={handleTtdKepalaSekolahUpload}
                        className="hidden" 
                      />
                    </label>

                    {ttdKepalaSekolahUrl && (
                      <button
                        type="button"
                        onClick={() => setTtdKepalaSekolahUrl('')}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold whitespace-nowrap"
                      >
                        Hapus
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    💡 <strong>Tips:</strong> Gunakan foto/scan tanda tangan pada kertas putih bersih atau gambar berlatar belakang transparan (PNG). Ukuran maksimal file: 1 MB.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Batas Waktu Absensi */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Batas Waktu Presensi
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Jam Masuk Sekolah (HH:mm):</label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={cleanTimeFormat(jamMasuk).slice(0, 5) || '07:00'}
                  onChange={(e) => setJamMasuk(e.target.value)}
                  className="w-28 bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 shrink-0"
                />
                <input
                  type="text"
                  placeholder="07:00"
                  value={jamMasuk}
                  onChange={(e) => setJamMasuk(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Dapat memilih jam atau mengetik manual (contoh: 07:00).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Batas Jam Terlambat (HH:mm):</label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={cleanTimeFormat(jamTerlambat).slice(0, 5) || '07:15'}
                  onChange={(e) => setJamTerlambat(e.target.value)}
                  className="w-28 bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 shrink-0"
                />
                <input
                  type="text"
                  placeholder="07:15"
                  value={jamTerlambat}
                  onChange={(e) => setJamTerlambat(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Dapat memilih jam atau mengetik manual (contoh: 07:15).</p>
            </div>
          </div>
        </div>

        {/* Section 4: Audio & Preferensi */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Preferensi Suara & Feedback
          </h3>

          <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                {enableSound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-bold text-white">Audio Beep Feedback</p>
                <p className="text-[11px] text-slate-400">Bunyi sinyal tinggi untuk scan sukses, sinyal rendah untuk error</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEnableSound(!enableSound)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                enableSound ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                enableSound ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* Section 5: Akun & Password Administrator */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            Akun & Password Administrator
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Username Admin:</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password Admin:</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="admin123"
                  className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Username dan password ini digunakan saat login kembali setelah Anda melakukan Logout.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Seluruh Pengaturan</span>
          </button>
        </div>

      </form>

      {/* Mode Kiosk Lobi / Gerbang Quick Launcher Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-lg">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                  TAMPILAN GERBANG & LOBI SEKOLAH
                </span>
              </div>
              <h3 className="text-base font-black text-white tracking-tight">
                Mode Kiosk Layar Penuh (Fullscreen Kiosk)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed max-w-xl">
                Buka layar presensi mandiri khusus untuk dipasang pada monitor/TV gerbang sekolah, lobi utama, atau meja piket dengan jam digital raksasa, pemindai QR ultra-cepat, dan sapaan suara.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsKioskMode(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0 self-start sm:self-center"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Buka Mode Kiosk</span>
          </button>
        </div>
      </div>

      {/* Backup & Restore 1-Klik JSON Zone */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Pencadangan & Pemulihan Data (Backup & Restore 1-Klik)
              </h3>
              <p className="text-xs text-slate-400">
                Amankan seluruh data siswa, riwayat absensi, jurnal mengajar, dan tahun ajaran dalam format JSON portabel
              </p>
            </div>
          </div>

          {/* Quick stats badge */}
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 self-start sm:self-auto">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>{students.length} Siswa • {attendance.length} Log • {journals.length} Jurnal</span>
          </div>
        </div>

        {/* Action Grid: Export & Import Dropzone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: 1-Klik Ekspor JSON */}
          <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl space-y-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Download className="w-4 h-4" />
                <span>1-Klik Unduh Cadangan (Ekspor JSON)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Unduh seluruh isi database aplikasi (Data Siswa, Absensi, Jurnal Mengajar, Master Tahun Ajaran, Pengaturan Profil) ke dalam satu file berkas <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">.JSON</code> yang aman dan rapi.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={exportBackupJson}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Cadangan Lengkap (.JSON)</span>
              </button>
            </div>
          </div>

          {/* Card 2: 1-Klik Pulihkan / Impor JSON */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDraggingJson(true); }}
            onDragLeave={() => setIsDraggingJson(false)}
            onDrop={handleJsonDrop}
            className={`border-2 border-dashed p-5 rounded-2xl space-y-3 flex flex-col justify-between transition-all ${
              isDraggingJson 
                ? 'bg-purple-950/30 border-purple-500' 
                : 'bg-slate-950/70 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                <UploadCloud className="w-4 h-4" />
                <span>1-Klik Pulihkan Data (Impor JSON)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tarik & lepas file <code className="text-purple-400 bg-slate-900 px-1 py-0.5 rounded">.JSON</code> hasil cadangan ke area ini atau klik tombol di bawah untuk memilih file dari komputer.
              </p>

              {fileError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <input
                type="file"
                ref={jsonFileInputRef}
                accept=".json,application/json"
                onChange={handleJsonFileInputChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => jsonFileInputRef.current?.click()}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Pilih & Pulihkan File JSON</span>
              </button>
            </div>
          </div>

        </div>

        {/* Auto-Snapshot Disaster Recovery Card */}
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">Cadangan Otomatis Lokal (Auto-Snapshot)</h4>
                <span className="text-[10px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.2 rounded-full">
                  Lokal Browser
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {autoSnapshot ? (
                  <>
                    Tersimpan otomatis: <strong className="text-slate-200">{new Date(autoSnapshot.exportedTimestamp).toLocaleString('id-ID')}</strong> ({autoSnapshot.summary.totalStudents} Siswa, {autoSnapshot.summary.totalAttendanceRecords} Presensi)
                  </>
                ) : (
                  'Sistem otomatis memperbarui snapshot cadangan darurat di memori browser secara berkala.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {autoSnapshot && (
              <button
                type="button"
                onClick={() => downloadBackupJson(autoSnapshot, `${settings.sekolah}_AutoSnapshot`)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                title="Unduh file snapshot"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Snapshot</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRestoreAutoSnapshot}
              disabled={!autoSnapshot}
              className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Pulihkan Snapshot</span>
            </button>
          </div>
        </div>

      </div>

      {/* Danger Zone */}
      <div className="bg-rose-950/20 border border-rose-500/20 p-6 rounded-3xl space-y-4 mt-8">
        <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Zona Pemeliharaan Data
        </h3>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>Muat Ulang Data Sample</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmClearLogsOpen(true)}
            className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 border border-rose-500/30 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Kosongkan Seluruh Log Absensi</span>
          </button>
        </div>
      </div>

      {/* Academic Year Add/Edit Modal */}
      {ayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingAyId ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Konfigurasi periode akademik dan semester
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAyModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAcademicYear} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tahun Ajaran <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 2025/2026"
                    value={ayName}
                    onChange={(e) => setAyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Semester:
                  </label>
                  <select
                    value={aySemester}
                    onChange={(e) => setAySemester(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="1 (Ganjil)">1 (Ganjil)</option>
                    <option value="2 (Genap)">2 (Genap)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Mulai:</label>
                  <input
                    type="date"
                    value={ayStartDate}
                    onChange={(e) => setAyStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Selesai:</label>
                  <input
                    type="date"
                    value={ayEndDate}
                    onChange={(e) => setAyEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan / Keterangan:</label>
                <input
                  type="text"
                  placeholder="Contoh: Kurikulum Merdeka - Semester Ganjil"
                  value={ayNotes}
                  onChange={(e) => setAyNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Status checkboxes */}
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ayIsCurrent}
                    onChange={(e) => {
                      setAyIsCurrent(e.target.checked);
                      if (e.target.checked) setAyIsArchived(false);
                    }}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                  />
                  <span>Jadikan sebagai <strong>Tahun Ajaran Aktif</strong> saat ini</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ayIsArchived}
                    disabled={ayIsCurrent}
                    onChange={(e) => setAyIsArchived(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900 disabled:opacity-40"
                  />
                  <span>Simpan langsung sebagai <strong>Arsip (Data Lampau)</strong></span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAyModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {editingAyId ? 'Simpan Perubahan' : 'Tambah Tahun Ajaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Academic Year Modal */}
      {confirmDeleteAyId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus Tahun Ajaran</h3>
                <p className="text-xs text-slate-400">Konfirmasi penghapusan master tahun ajaran</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus data master Tahun Ajaran ini?
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteAyId(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmDeleteAyId) deleteAcademicYear(confirmDeleteAyId);
                  setConfirmDeleteAyId(null);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Clear Logs Modal */}
      {confirmClearLogsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Kosongkan Log Presensi</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-rose-400">SELURUH</strong> catatan riwayat presensi yang ada di sistem?
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearLogsOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearLogs}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Ya, Hapus Semua Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset Sample Data Modal */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset ke Data Sampel</h3>
                <p className="text-xs text-slate-400">Kembalikan data ke kondisi awal</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin memuat ulang data contoh siswa dan presensi? Data yang telah ditambahkan manual akan ditimpa.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetSample}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Ya, Reset Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore JSON Backup Preview & Execution Modal */}
      {restoreModalOpen && pendingPayload && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Konfirmasi Pemulihan Cadangan Data (.JSON)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Periksa ringkasan konten cadangan sebelum diterapkan ke sistem
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setRestoreModalOpen(false); setPendingPayload(null); }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Backup Metadata Card */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Asal Sekolah:</span>
                <span className="font-bold text-white">{pendingPayload.schoolInfo?.name || 'Sekolah'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Waktu Cadangan Dibuat:</span>
                <span className="font-mono text-slate-300">
                  {new Date(pendingPayload.exportedTimestamp || Date.now()).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Versi Format File:</span>
                <span className="font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  v{pendingPayload.version}
                </span>
              </div>
            </div>

            {/* Content Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Data Siswa</span>
                <p className="text-xl font-black text-white font-mono">{pendingPayload.summary.totalStudents}</p>
                <span className="text-[10px] text-slate-500">Siswa</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Log Presensi</span>
                <p className="text-xl font-black text-emerald-400 font-mono">{pendingPayload.summary.totalAttendanceRecords}</p>
                <span className="text-[10px] text-slate-500">Catatan</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Jurnal Mengajar</span>
                <p className="text-xl font-black text-blue-400 font-mono">{pendingPayload.summary.totalJournals}</p>
                <span className="text-[10px] text-slate-500">Pertemuan</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Tahun Ajaran</span>
                <p className="text-xl font-black text-purple-400 font-mono">{pendingPayload.summary.totalAcademicYears}</p>
                <span className="text-[10px] text-slate-500">Periode</span>
              </div>
            </div>

            {/* Mode Selection Options */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-300">Pilih Metode Pemulihan:</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Option 1: Timpa Bersih */}
                <div 
                  onClick={() => setRestoreMode('overwrite')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    restoreMode === 'overwrite'
                      ? 'bg-purple-950/30 border-purple-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <input
                      type="radio"
                      name="restoreMode"
                      checked={restoreMode === 'overwrite'}
                      onChange={() => setRestoreMode('overwrite')}
                      className="text-purple-500 focus:ring-purple-500"
                    />
                    <span className={restoreMode === 'overwrite' ? 'text-purple-300' : 'text-slate-300'}>
                      Timpa Bersih (Overwrite)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 pl-5 leading-snug">
                    Menggantikan seluruh data di aplikasi secara total dengan data dari file cadangan ini.
                  </p>
                </div>

                {/* Option 2: Gabungkan Data */}
                <div 
                  onClick={() => setRestoreMode('merge')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    restoreMode === 'merge'
                      ? 'bg-emerald-950/30 border-emerald-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <input
                      type="radio"
                      name="restoreMode"
                      checked={restoreMode === 'merge'}
                      onChange={() => setRestoreMode('merge')}
                      className="text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className={restoreMode === 'merge' ? 'text-emerald-300' : 'text-slate-300'}>
                      Gabungkan Data (Merge)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 pl-5 leading-snug">
                    Menambahkan data dari file tanpa menghapus data yang sudah ada (mencegah duplikasi).
                  </p>
                </div>

              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => { setRestoreModalOpen(false); setPendingPayload(null); }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isRestoring}
                onClick={handleExecuteRestore}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memulihkan Data...</span>
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    <span>Mulai Pemulihan Data</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

