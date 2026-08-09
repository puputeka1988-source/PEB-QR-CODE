import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Save, Volume2, VolumeX, Clock, Building, RefreshCw, Trash2, Sparkles } from 'lucide-react';

export const PengaturanView: React.FC = () => {
  const { settings, updateSettings, resetToSampleData, setAttendance } = useApp();

  const [sekolah, setSekolah] = useState(settings.sekolah);
  const [npsn, setNpsn] = useState(settings.npsn || '');
  const [alamat, setAlamat] = useState(settings.alamat || '');
  const [jamMasuk, setJamMasuk] = useState(settings.jamMasuk);
  const [jamTerlambat, setJamTerlambat] = useState(settings.jamTerlambat);
  const [enableSound, setEnableSound] = useState(settings.enableSound);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      sekolah: sekolah.trim(),
      npsn: npsn.trim(),
      alamat: alamat.trim(),
      jamMasuk,
      jamTerlambat,
      enableSound
    });
  };

  const handleClearLogs = () => {
    if (confirm('Apakah Anda yakin ingin menghapus SELURUH riwayat presensi? Tindakan ini tidak dapat dibatalkan.')) {
      setAttendance([]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
      
      {/* Top Banner */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            Pengaturan Aplikasi & Jam Operasional
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Atur identitas sekolah, batas waktu keterlambatan, dan preferensi pemindai QR Code
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Identitas Sekolah */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-400" />
            Identitas Instansi / Sekolah
          </h3>

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
                placeholder="Contoh: Jl. Pendidikan No. 45"
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Batas Waktu Absensi */}
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

        {/* Section 3: Audio & Preferensi */}
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

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan</span>
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
            onClick={resetToSampleData}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>Muat Ulang Data Sample</span>
          </button>

          <button
            type="button"
            onClick={handleClearLogs}
            className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 border border-rose-500/30 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Kosongkan Seluruh Log Absensi</span>
          </button>
        </div>
      </div>

    </div>
  );
};
