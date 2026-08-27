import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Download, CheckCircle2, Sparkles, 
  ArrowRight, ShieldCheck, Zap, Layers, Globe,
  HelpCircle, Share2, MoreVertical, PlusSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StudentInstallPwaTab: React.FC = () => {
  const { settings, showToast } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already running in standalone/PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast?.('Aplikasi sedang dipasang ke layar utama HP Anda.', 'success');
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      showToast?.('Ikuti panduan langkah di bawah untuk menambahkan ke Layar Utama HP.', 'info');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800/40 rounded-3xl p-6 shadow-xl relative overflow-hidden text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg">
          <Smartphone className="w-8 h-8" />
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-white mt-4">
          Pasang Aplikasi Presensi Siswa di HP
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-1.5 leading-relaxed">
          Buka aplikasi langsung dari layar utama ponsel Anda layaknya aplikasi APK Android resmi tanpa perlu mengetik alamat web lagi.
        </p>

        {/* Install Button */}
        <div className="mt-5">
          {isInstalled ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Aplikasi Sudah Terpasang di HP Ini</span>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/60 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Pasang Sekarang (Instan)</span>
            </button>
          )}
        </div>
      </div>

      {/* Keunggulan Opsi Web App / PWA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white">Super Cepat & Ringan</h4>
          <p className="text-[11px] text-slate-400">Tidak memakan memori penyimpanan HP dan hemat baterai.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white">Otomatis Terupdate</h4>
          <p className="text-[11px] text-slate-400">Selalu mutakhir tanpa perlu download file APK update berulang kali.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white">Barcode 1:1 Resmi</h4>
          <p className="text-[11px] text-slate-400">Barcode selalu siap ditampilkan ke kamera guru di gerbang/kelas.</p>
        </div>
      </div>

      {/* Panduan Langkah Mudah di Android & iOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span>Panduan Cara Pasang Manual di Browser HP</span>
        </h3>

        {/* Android Guide */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Smartphone className="w-4 h-4" />
            <span>Untuk Pengguna Android (Google Chrome):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] flex items-center justify-center font-black">1</span>
                <span>Ketuk Menu Titik 3</span>
              </div>
              <p className="text-[11px] text-slate-400">Ketuk ikon menu titik tiga (⋮) di pojok kanan atas Google Chrome.</p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] flex items-center justify-center font-black">2</span>
                <span>Tambahkan ke Layar Utama</span>
              </div>
              <p className="text-[11px] text-slate-400">Pilih menu "Tambahkan ke Layar Utama" atau "Install Aplikasi".</p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] flex items-center justify-center font-black">3</span>
                <span>Selesai!</span>
              </div>
              <p className="text-[11px] text-slate-400">Ikon aplikasi akan muncul di layar HP Anda dan siap dibuka kapan pun.</p>
            </div>
          </div>
        </div>

        {/* iPhone / iOS Guide */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
            <Smartphone className="w-4 h-4" />
            <span>Untuk Pengguna iPhone / iPad (Safari):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[10px] flex items-center justify-center font-black">1</span>
                <span>Ketuk Tombol Share</span>
              </div>
              <p className="text-[11px] text-slate-400">Ketuk ikon bagikan (Share <Share2 className="w-3 h-3 inline" />) di bagian bawah Safari.</p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[10px] flex items-center justify-center font-black">2</span>
                <span>Add to Home Screen</span>
              </div>
              <p className="text-[11px] text-slate-400">Gulir ke bawah dan pilih "Add to Home Screen" (Tambah ke Layar Utama).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
