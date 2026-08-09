import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/gasScript';
import { Database, Copy, Check, ExternalLink, Sparkles, Send, ShieldCheck, AlertCircle, RefreshCw, Smartphone } from 'lucide-react';

export const IntegrasiSheetsView: React.FC = () => {
  const { settings, updateSettings, showToast, syncRecordToSheets, pullDataFromSheets, isPullingFromSheets } = useApp();

  const [urlInput, setUrlInput] = useState(settings.spreadsheetUrl || '');
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    showToast('Kode Google Apps Script berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ spreadsheetUrl: urlInput.trim() });
  };

  const handleTestConnection = async () => {
    if (!urlInput.trim().startsWith('http')) {
      return showToast('Masukkan URL Web App Google Apps Script yang valid.', 'error');
    }

    setTesting(true);
    const dummyRecord = {
      id: 'TEST-' + Date.now().toString().slice(-4),
      studentId: 'TEST-STD',
      studentName: 'Uji Koneksi QR-Presensi',
      nisn: '0000000000',
      class: 'TES KONEKSI',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('id-ID'),
      status: 'Hadir' as const,
      method: 'Manual' as const,
      note: 'Tes otomatis dari aplikasi'
    };

    const success = await syncRecordToSheets(dummyRecord);
    setTesting(false);

    if (success) {
      showToast('Koneksi berhasil! Baris tes telah dikirim ke Google Sheets.', 'success');
    } else {
      showToast('Koneksi dikirim (mode no-cors). Periksa lembar Google Sheets Anda.', 'info');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner Top */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Integrasi Realtime Google Sheets
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Setiap kali siswa melakukan scan QR, data presensi akan otomatis terkirim langsung ke Spreadsheet Google Anda
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-2xl text-xs text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Status: {settings.spreadsheetUrl ? 'Terhubung (Aktif)' : 'Belum Dikonfigurasi'}</span>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Form Configuration */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Konfigurasi Web App URL
          </h3>

          <form onSubmit={handleSaveUrl} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                URL Google Apps Script Web App:
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-2xl p-3.5 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Pastikan URL berakhiran <code>/exec</code> dari hasil penerapan Apps Script.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                Simpan URL
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>{testing ? 'Mengirim Data Tes...' : 'Uji Kirim Data'}</span>
              </button>
            </div>
          </form>

          {/* Sync Lintas Perangkat (Opsi A) Card */}
          <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-2xl space-y-3">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Sinkronisasi Lintas Perangkat (HP, Laptop, Tablet)</span>
                  <span className="text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">Opsi A Aktif</span>
                </h4>
                <p className="text-[11px] text-indigo-200/80 mt-1 leading-relaxed">
                  Aplikasi secara otomatis menarik data riwayat presensi terbaru dari Google Sheets setiap kali dibuka atau direfresh di HP/Laptop/Tablet manapun.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => pullDataFromSheets(true)}
              disabled={isPullingFromSheets || !settings.spreadsheetUrl}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-200 ${isPullingFromSheets ? 'animate-spin' : ''}`} />
              <span>{isPullingFromSheets ? 'Menyinkronkan dari Sheets...' : 'Tarik Data Terbaru dari Google Sheets Sekarang'}</span>
            </button>
          </div>

          {/* Apps Script Code Copy Card */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Kode Script Google Apps Script:</span>
              <button
                onClick={handleCopyCode}
                className="bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Kode Script'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 max-h-52 overflow-y-auto font-mono text-[11px] text-slate-400 leading-relaxed">
              <pre>{GOOGLE_APPS_SCRIPT_CODE}</pre>
            </div>
          </div>
        </div>

        {/* Right Column: Step-by-Step Tutorial */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Petunjuk Pemasangan (4 Langkah Mudah)</h3>

          <div className="space-y-4 text-xs text-slate-300">
            
            <div className="flex gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                1
              </div>
              <div>
                <p className="font-bold text-white">Buka Google Sheets Baru</p>
                <p className="text-slate-400 mt-0.5">
                  Buka <a href="https://sheets.google.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-1">Google Sheets <ExternalLink className="w-3 h-3" /></a> dan buat spreadsheet baru.
                </p>
              </div>
            </div>

            <div className="flex gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                2
              </div>
              <div>
                <p className="font-bold text-white">Buka Apps Script & Tempel Kode</p>
                <p className="text-slate-400 mt-0.5">
                  Klik menu <b>Ekstensi &gt; Apps Script</b> di Google Sheets. Hapus semua kode bawaan lalu tempelkan kode script yang ada di sebelah kiri.
                </p>
              </div>
            </div>

            <div className="flex gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                3
              </div>
              <div>
                <p className="font-bold text-white">Lakukan Penerapan (Deploy as Web App)</p>
                <p className="text-slate-400 mt-0.5">
                  Klik tombol <b>Terapkan (Deploy) &gt; Penerapan baru</b>. Pilih jenis <b>Aplikasi Web</b>.
                </p>
                <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-[11px] flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    SANGAT PENTING: Pada opsi <b>Akses (Who has access)</b>, wajib pilih <b>Siapa saja (Anyone)</b>.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                4
              </div>
              <div>
                <p className="font-bold text-white">Salin Web App URL Ke Aplikasi</p>
                <p className="text-slate-400 mt-0.5">
                  Salin Web App URL yang dihasilkan, lalu tempelkan ke kolom input di sebelah kiri dan klik "Simpan URL".
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
