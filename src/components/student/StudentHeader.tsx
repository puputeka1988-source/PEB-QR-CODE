import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  GraduationCap, LogOut, Smartphone, User, ShieldCheck, 
  Sparkles, RefreshCw, ChevronDown
} from 'lucide-react';
import { Student } from '../../types';
import { getStudentInitials } from '../../utils/formatters';
import { NotificationBellDropdown } from '../notifications/NotificationBellDropdown';

interface StudentHeaderProps {
  student: Student;
  onOpenProfile: () => void;
  onOpenInstall: () => void;
  onNavigateToTab?: (tab: any) => void;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  student,
  onOpenProfile,
  onOpenInstall,
  onNavigateToTab
}) => {
  const { settings, studentLogout, showToast } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sm:px-6 shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* School Logo & Title */}
        <div className="flex items-center gap-3 min-w-0">
          {settings.logoUrl || settings.logoKiriUrl ? (
            <img 
              src={settings.logoUrl || settings.logoKiriUrl} 
              alt="Logo Sekolah" 
              className="w-10 h-10 object-contain rounded-lg bg-white/5 p-1 border border-slate-700/50 shrink-0" 
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                Portal Siswa
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-slate-400 font-medium truncate hidden sm:inline">
                {settings.sekolah || 'SMA Negeri 1'}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-1.5">
              <span>{student.name}</span>
              <span className="text-xs font-normal text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-700/40">
                {student.class}
              </span>
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notification Bell (Lonceng Siaran & Pengumuman) */}
          <NotificationBellDropdown 
            currentStudent={student} 
            onNavigateToTab={onNavigateToTab} 
          />

          {/* PWA Install Button */}
          <button
            onClick={onOpenInstall}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/50 rounded-lg transition-colors cursor-pointer"
            title="Pasang Aplikasi ke HP"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pasang App</span>
          </button>

          {/* Student Profile Quick Access */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            title="Buka Pengaturan Profil"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-600/30 text-emerald-400 font-black text-[11px] flex items-center justify-center border border-emerald-500/40 tracking-tight shrink-0">
              {getStudentInitials(student.name)}
            </div>
            <span className="hidden md:inline">Profil</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={studentLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded-lg transition-colors cursor-pointer"
            title="Keluar dari Portal Siswa"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
