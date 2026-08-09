import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, Save, Volume2, VolumeX, Clock, Building, RefreshCw, Trash2, 
  Sparkles, KeyRound, User, Upload, Image, BookOpen, Award, Phone, 
  UserCheck, X, GraduationCap, ShieldCheck
} from 'lucide-react';

export const PengaturanView: React.FC = () => {
  const { settings, updateSettings, resetToSampleData, setAttendance, showToast } = useApp();

  const [sekolah, setSekolah] = useState(settings.sekolah);
  const [npsn, setNpsn] = useState(settings.npsn || '');
  const [alamat, setAlamat] = useState(settings.alamat || '');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  
  const [jamMasuk, setJamMasuk] = useState(settings.jamMasuk);
  const [jamTerlambat, setJamTerlambat] = useState(settings.jamTerlambat);
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

  // Confirmation Modals
  const [confirmClearLogsOpen, setConfirmClearLogsOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Helper for compressing image before saving to localStorage to prevent QuotaExceededError
  const compressImage = (file: File, maxWidth = 300, maxHeight = 300, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
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
            resolve(canvas.toDataURL('image/jpeg', quality));
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
    try {
      const compressed = await compressImage(file, 350, 350, 0.85);
      setLogoUrl(compressed);
      showToast('Logo sekolah berhasil diproses & dioptimalkan.', 'info');
    } catch (err) {
      showToast('Gagal memproses file logo.', 'error');
    }
  };

  const handleGuruPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 350, 350, 0.85);
      setGuruPhotoUrl(compressed);
      showToast('Foto profil guru berhasil diproses & dioptimalkan.', 'info');
    } catch (err) {
      showToast('Gagal memproses foto guru.', 'error');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      sekolah: sekolah.trim(),
      npsn: npsn.trim(),
      alamat: alamat.trim(),
      logoUrl,
      jamMasuk,
      jamTerlambat,
      enableSound,
      adminUsername: adminUsername.trim() || 'admin',
      adminPassword: adminPassword || 'admin123',
      namaGuru: namaGuru.trim(),
      nip: nip.trim(),
      mataPelajaran: mataPelajaran.trim(),
      jabatan: jabatan.trim(),
      guruPhone: guruPhone.trim(),
      guruPhotoUrl,
      guruBio: guruBio.trim()
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
                <Image className="w-4 h-4 text-emerald-400" /> Upload Logo Resmi Sekolah
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Logo ini akan ditampilkan di header aplikasi, kartu QR siswa, cetak laporan, dan layar login administrator.
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
                Upload foto formal/resmi guru pengampu atau wali kelas (Format JPG/PNG, maks 3MB).
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Jam Masuk Sekolah:</label>
              <input
                type="time"
                value={jamMasuk}
                onChange={(e) => setJamMasuk(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Siswa yang scan sebelum atau pada jam ini berstatus Hadir.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Batas Jam Terlambat:</label>
              <input
                type="time"
                value={jamTerlambat}
                onChange={(e) => setJamTerlambat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Siswa yang scan setelah jam ini otomatis berstatus Terlambat.</p>
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

    </div>
  );
};

