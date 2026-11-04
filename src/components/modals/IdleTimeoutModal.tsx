import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ShieldAlert, LogOut, CheckCircle2, AlertTriangle } from 'lucide-react';

interface IdleTimeoutModalProps {
  isOpen: boolean;
  role: 'admin' | 'student';
  userName?: string;
  secondsRemaining: number;
  totalWarningSeconds: number;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

export const IdleTimeoutModal: React.FC<IdleTimeoutModalProps> = ({
  isOpen,
  role,
  userName,
  secondsRemaining,
  totalWarningSeconds,
  onStayLoggedIn,
  onLogout
}) => {
  // Listen to keyboard shortcut (Enter to stay logged in)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStayLoggedIn();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onLogout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onStayLoggedIn, onLogout]);

  if (!isOpen) return null;

  const percentage = Math.max(0, Math.min(100, (secondsRemaining / (totalWarningSeconds || 60)) * 100));
  const isUrgent = secondsRemaining <= 15;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="idle-timeout-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/80 overflow-hidden text-center"
        >
          {/* Subtle Ambient Glowing Aura */}
          <div 
            className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500 ${
              isUrgent ? 'bg-rose-500' : 'bg-amber-500'
            }`} 
            aria-hidden="true"
          />

          {/* Top Badge & Icon */}
          <div className="relative mx-auto mb-4 flex items-center justify-center">
            <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
              isUrgent 
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-lg shadow-rose-500/20' 
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/20'
            }`}>
              {isUrgent ? (
                <ShieldAlert className="w-8 h-8 animate-bounce" />
              ) : (
                <Clock className="w-8 h-8 animate-pulse" />
              )}
            </div>
          </div>

          {/* Title */}
          <h2 id="idle-timeout-title" className="text-lg sm:text-xl font-bold text-white mb-2">
            Sesi Akan Segera Berakhir!
          </h2>

          {/* Role-specific explanation */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
            {role === 'admin' ? (
              <>
                Tidak ada aktivitas terdeteksi pada layar Anda. Demi menjaga <strong className="text-white">keamanan data sekolah</strong> dan kerahasiaan nilai, sesi Administrator Anda akan otomatis ditutup.
              </>
            ) : (
              <>
                Hai <strong className="text-white">{userName || 'Siswa'}</strong>, Anda belum melakukan aktivitas. Demi menjaga <strong className="text-white">privasi akun Anda</strong>, sesi Portal Siswa akan otomatis ditutup.
              </>
            )}
          </p>

          {/* Countdown Display Card */}
          <div className={`p-4 rounded-2xl border mb-5 transition-colors ${
            isUrgent 
              ? 'bg-rose-950/40 border-rose-500/30 text-rose-300' 
              : 'bg-slate-950/60 border-slate-800 text-slate-200'
          }`}>
            <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-1 flex items-center justify-center gap-1.5">
              <AlertTriangle className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
              <span>Otomatis Keluar Dalam</span>
            </div>

            <div className="flex items-baseline justify-center gap-1.5 my-1">
              <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                isUrgent ? 'text-rose-400 animate-pulse' : 'text-amber-400'
              }`}>
                {secondsRemaining}
              </span>
              <span className="text-xs text-slate-400 font-medium">detik</span>
            </div>

            {/* Progress Countdown Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                  isUrgent ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onStayLoggedIn}
              autoFocus
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Tetap Masuk (Lanjutkan Sesi)</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="bg-slate-800 hover:bg-rose-950/50 hover:border-rose-500/40 hover:text-rose-300 text-slate-300 font-semibold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Keluar Sekarang</span>
            </button>
          </div>

          <p className="text-[10px] text-slate-500 mt-4">
            Tekan tombol <strong>Enter</strong> pada keyboard untuk langsung melanjutkan sesi.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
