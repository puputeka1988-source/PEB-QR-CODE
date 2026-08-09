import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { QrCode, Clock, Calendar, Sparkles, Menu } from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { setCameraModalOpen, settings, attendance, filterDate } = useApp();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayLogs = attendance.filter(a => a.date === filterDate);
  const totalHadir = todayLogs.filter(l => l.status === 'Hadir').length;
  const totalTerlambat = todayLogs.filter(l => l.status === 'Terlambat').length;

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <header className="h-20 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between gap-4">
      
      {/* Left Branding & Mobile Menu Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-wide">{settings.sekolah}</h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" /> V2.1 PRO
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{todayFormatted}</span>
          </p>
        </div>
      </div>

      {/* Right Actions & Live Clock */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Live Attendance Stats Summary */}
        <div className="hidden md:flex items-center gap-2 text-xs bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-2xl font-mono">
          <span className="text-slate-400">Hadir:</span>
          <span className="text-emerald-400 font-bold">{totalHadir}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Terlambat:</span>
          <span className="text-amber-400 font-bold">{totalTerlambat}</span>
        </div>

        {/* Digital Clock */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-700/50">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{time || '00:00:00'}</span>
        </div>

        {/* Scan Button */}
        <button
          onClick={() => setCameraModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer"
        >
          <QrCode className="w-4.5 h-4.5 stroke-[2.5]" />
          <span>SCAN QR</span>
        </button>

      </div>

    </header>
  );
};
