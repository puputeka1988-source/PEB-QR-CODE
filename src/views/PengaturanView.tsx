import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { cleanTimeFormat } from '../utils/formatters';
import { ThemeMode, ThemeAccent, AcademicYear } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, RefreshCw, X, Calendar, FileCheck, CheckCheck
} from 'lucide-react';
import { FullBackupPayload, validateBackupJson, downloadBackupJson } from '../utils/backupRestore';
import { registerBiometric, isBiometricAvailable } from '../utils/biometricAuth';
import { SubNavHeader } from '../components/SubNavHeader';
import { ProfilSekolahTab } from '../components/pengaturan/ProfilSekolahTab';
import { JamAbsensiTab } from '../components/pengaturan/JamAbsensiTab';
import { TahunAjaranTab } from '../components/pengaturan/TahunAjaranTab';
import { Keamanan2FaTab } from '../components/pengaturan/Keamanan2FaTab';
import { TemaTampilanTab } from '../components/pengaturan/TemaTampilanTab';
import { BackupRestoreTab } from '../components/pengaturan/BackupRestoreTab';

export const PengaturanView: React.FC = () => {
  const { 
    settings, updateSettings, resetToSampleData, setAttendance, showToast, 
    setThemeMode, setThemeAccent,
    academicYears, activeAcademicYear, addAcademicYear, updateAcademicYear,
    deleteAcademicYear, setActiveAcademicYear, toggleArchiveAcademicYear,
    students, attendance, journals,
    exportBackupJson, restoreFullBackup, autoSnapshot,
    setIsKioskMode, getActiveSubTab, setActiveSubTab
  } = useApp();

  const activeSubTab = getActiveSubTab('Pengaturan') || 'profil-sekolah';

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

  // Keamanan 2 Langkah (2FA & Biometrik / PIN)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(settings.twoFactorEnabled ?? false);
  const [securityPin, setSecurityPin] = useState(settings.securityPin || '123456');
  const [biometricEnabled, setBiometricEnabled] = useState(settings.biometricEnabled ?? false);
  const [biometricCredentialId, setBiometricCredentialId] = useState(settings.biometricCredentialId || '');
  const [biometricDeviceName, setBiometricDeviceName] = useState(settings.biometricDeviceName || '');
  const [isRegisteringBiometric, setIsRegisteringBiometric] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then((supported) => setIsBiometricSupported(supported));
  }, []);

  const handleRegisterDeviceBiometric = async () => {
    setIsRegisteringBiometric(true);
    try {
      const res = await registerBiometric(adminUsername || 'admin', 'Admin ' + (settings.sekolah || 'Sekolah'));
      if (res.success && res.credential) {
        setBiometricCredentialId(res.credential.id);
        setBiometricDeviceName(res.credential.deviceName || 'Perangkat Terdaftar');
        setBiometricEnabled(true);
        showToast('Sensor biometrik perangkat berhasil didaftarkan!', 'success');
      } else {
        showToast(res.error || 'Pendaftaran biometrik gagal.', 'error');
      }
    } catch (err: any) {
      showToast('Gagal menghubungkan ke sensor biometrik.', 'error');
    } finally {
      setIsRegisteringBiometric(false);
    }
  };

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
      e.target.value = '';
    }
  };

  const handleJsonDrop = (e: React.DragEvent) => {
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

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      showToast('Format file tanda tangan harus berupa PNG, JPEG, atau JPG.', 'error');
      e.target.value = '';
      return;
    }

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

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      showToast('Format file tanda tangan harus berupa PNG, JPEG, atau JPG.', 'error');
      e.target.value = '';
      return;
    }

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

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      themeAccent: themeAccentState,
      twoFactorEnabled,
      securityPin: securityPin.trim() || '123456',
      biometricEnabled,
      biometricCredentialId,
      biometricDeviceName
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
      
      {/* Sub Menu Navigation Header */}
      <SubNavHeader
        currentTab="Pengaturan"
        activeSubTab={activeSubTab}
        onSelectSubTab={(subId) => setActiveSubTab('Pengaturan', subId)}
        badgeCounts={{
          'tahun-ajaran': academicYears.length
        }}
      />

      {/* Dynamic Sub-Tab Views with Smooth Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Sub Tab 1: Profil Sekolah & Guru */}
          {activeSubTab === 'profil-sekolah' && (
            <ProfilSekolahTab
              sekolah={sekolah} setSekolah={setSekolah}
              npsn={npsn} setNpsn={setNpsn}
              alamat={alamat} setAlamat={setAlamat}
              logoUrl={logoUrl} setLogoUrl={setLogoUrl} handleLogoUpload={handleLogoUpload}
              namaGuru={namaGuru} setNamaGuru={setNamaGuru}
              nip={nip} setNip={setNip}
              mataPelajaran={mataPelajaran} setMataPelajaran={setMataPelajaran}
              jabatan={jabatan} setJabatan={setJabatan}
              guruPhone={guruPhone} setGuruPhone={setGuruPhone}
              guruBio={guruBio} setGuruBio={setGuruBio}
              guruPhotoUrl={guruPhotoUrl} setGuruPhotoUrl={setGuruPhotoUrl} handleGuruPhotoUpload={handleGuruPhotoUpload}
              ttdGuruUrl={ttdGuruUrl} setTtdGuruUrl={setTtdGuruUrl} handleTtdGuruUpload={handleTtdGuruUpload}
              namaKepalaSekolah={namaKepalaSekolah} setNamaKepalaSekolah={setNamaKepalaSekolah}
              nipKepalaSekolah={nipKepalaSekolah} setNipKepalaSekolah={setNipKepalaSekolah}
              jabatanKepalaSekolah={jabatanKepalaSekolah} setJabatanKepalaSekolah={setJabatanKepalaSekolah}
              ttdKepalaSekolahUrl={ttdKepalaSekolahUrl} setTtdKepalaSekolahUrl={setTtdKepalaSekolahUrl} handleTtdKepalaSekolahUpload={handleTtdKepalaSekolahUpload}
              kotaTandaTangan={kotaTandaTangan} setKotaTandaTangan={setKotaTandaTangan}
              onSave={handleSave}
            />
          )}

          {/* Sub Tab 2: Jam & Batas Presensi */}
          {activeSubTab === 'jam-absensi' && (
            <JamAbsensiTab
              jamMasuk={jamMasuk}
              setJamMasuk={setJamMasuk}
              jamTerlambat={jamTerlambat}
              setJamTerlambat={setJamTerlambat}
              enableSound={enableSound}
              setEnableSound={setEnableSound}
              cleanTimeFormat={cleanTimeFormat}
              onSave={handleSave}
            />
          )}

          {/* Sub Tab 3: Tahun Ajaran & Semester */}
          {activeSubTab === 'tahun-ajaran' && (
            <TahunAjaranTab
              academicYears={academicYears}
              activeAcademicYear={activeAcademicYear}
              openAddAyModal={openAddAyModal}
              openEditAyModal={openEditAyModal}
              setActiveAcademicYear={setActiveAcademicYear}
              toggleArchiveAcademicYear={toggleArchiveAcademicYear}
              setConfirmDeleteAyId={setConfirmDeleteAyId}
              ayFilterTab={ayFilterTab}
              setAyFilterTab={setAyFilterTab}
              activeYearsCount={activeYearsCount}
              archivedYearsCount={archivedYearsCount}
              filteredAcademicYears={filteredAcademicYears}
            />
          )}

          {/* Sub Tab 4: Keamanan & PIN 2FA */}
          {activeSubTab === 'keamanan-2fa' && (
            <Keamanan2FaTab
              adminUsername={adminUsername}
              setAdminUsername={setAdminUsername}
              adminPassword={adminPassword}
              setAdminPassword={setAdminPassword}
              twoFactorEnabled={twoFactorEnabled}
              setTwoFactorEnabled={setTwoFactorEnabled}
              securityPin={securityPin}
              setSecurityPin={setSecurityPin}
              biometricEnabled={biometricEnabled}
              setBiometricEnabled={setBiometricEnabled}
              biometricCredentialId={biometricCredentialId}
              setBiometricCredentialId={setBiometricCredentialId}
              biometricDeviceName={biometricDeviceName}
              setBiometricDeviceName={setBiometricDeviceName}
              isBiometricSupported={isBiometricSupported}
              isRegisteringBiometric={isRegisteringBiometric}
              handleRegisterDeviceBiometric={handleRegisterDeviceBiometric}
              showToast={showToast}
              onSave={handleSave}
            />
          )}

          {/* Sub Tab 5: Tema & Warna Aksen */}
          {activeSubTab === 'tema-tampilan' && (
            <TemaTampilanTab
              themeModeState={themeModeState}
              themeAccentState={themeAccentState}
              selectThemeMode={selectThemeMode}
              selectThemeAccent={selectThemeAccent}
              onSave={handleSave}
            />
          )}

          {/* Sub Tab 6: Backup & Restore Data */}
          {activeSubTab === 'backup-restore' && (
            <BackupRestoreTab
              students={students}
              attendance={attendance}
              journals={journals}
              settings={settings}
              exportBackupJson={exportBackupJson}
              handleJsonDrop={handleJsonDrop}
              handleJsonFileInputChange={handleJsonFileInputChange}
              isDraggingJson={isDraggingJson}
              setIsDraggingJson={setIsDraggingJson}
              fileError={fileError}
              jsonFileInputRef={jsonFileInputRef}
              autoSnapshot={autoSnapshot}
              downloadBackupJson={downloadBackupJson}
              handleRestoreAutoSnapshot={handleRestoreAutoSnapshot}
              setIsKioskMode={setIsKioskMode}
              setConfirmResetOpen={setConfirmResetOpen}
              setConfirmClearLogsOpen={setConfirmClearLogsOpen}
            />
          )}
        </motion.div>
      </AnimatePresence>

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
