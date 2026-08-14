import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Clock, Calendar, Sparkles, Menu, LogOut, Settings, User, ChevronDown, 
  BookOpen, ShieldCheck, Sun, Moon, Palette, FolderArchive, CheckCircle2, Check,
  Monitor, Maximize2
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { 
    settings, attendance, filterDate, logout, setActiveTab, setThemeMode, 
    effectiveTheme, academicYears, activeAcademicYear, setActiveAcademicYear,
    setIsKioskMode
  } = useApp();
  const [time, setTime] = useState<string>('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [ayDropdownOpen, setAyDropdownOpen] = useState(false);

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

  const toggleThemeMode = () => {
    const nextMode = effectiveTheme === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  return (
    <header className="h-20 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between gap-4">
      
      {/* Left Branding & Mobile Menu Trigger */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {settings.logoUrl && (
          <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 p-1 flex items-center justify-center shrink-0 hidden sm:flex">
            <img src={settings.logoUrl} alt="Logo Sekolah" className="w-full h-full object-contain" />
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2 truncate">
            <h2 className="text-sm font-bold text-white tracking-wide truncate">{settings.sekolah}</h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
              <Sparkles className="w-3 h-3" /> V2.1 PRO
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{todayFormatted}</span>
          </p>
        </div>
      </div>

      {/* Right Actions, Live Clock & Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Academic Year Quick Switcher Badge */}
        {activeAcademicYear && (
          <div className="relative">
            <button
              onClick={() => setAyDropdownOpen(!ayDropdownOpen)}
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer hover:border-emerald-500/40"
              title="Tahun Ajaran Aktif (Klik untuk ganti atau kelola arsip)"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono text-emerald-400 font-bold hidden md:inline truncate max-w-[130px]">
                TA {activeAcademicYear.name} ({activeAcademicYear.semester.charAt(0)})
              </span>
              <span className="font-mono text-emerald-400 font-bold md:hidden">
                TA {activeAcademicYear.name}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${ayDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {ayDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAyDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-2xl z-50 p-2 space-y-1 divide-y divide-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-2 space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Pilih Tahun Ajaran Aktif
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Tahun ajaran terpilih akan menjadi filter pencatatan
                    </p>
                  </div>

                  <div className="pt-1 max-h-48 overflow-y-auto space-y-1">
                    {academicYears.map(ay => (
                      <button
                        key={ay.id}
                        onClick={() => {
                          setActiveAcademicYear(ay.id);
                          setAyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          ay.isCurrent
                            ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                            : ay.isArchived
                            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {ay.isArchived ? (
                            <FolderArchive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <div className="truncate">
                            <p className="truncate leading-tight">TA {ay.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">Sem {ay.semester}</p>
                          </div>
                        </div>

                        {ay.isCurrent ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : ay.isArchived ? (
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">Arsip</span>
                        ) : null}
                      </button>
                    ))}
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setActiveTab('Pengaturan');
                        setAyDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Kelola & Arsipkan Tahun Ajaran</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Live Attendance Stats Summary */}
        <div className="hidden xl:flex items-center gap-2 text-xs bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-2xl font-mono">
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

        {/* Kiosk Mode Lobby Button */}
        <button
          onClick={() => setIsKioskMode(true)}
          className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm group"
          title="Buka Mode Kiosk Layar Penuh (Gerbang & Lobi)"
        >
          <Monitor className="w-4 h-4 text-indigo-400 group-hover:text-white transition-colors" />
          <span className="hidden lg:inline font-bold">Kiosk Lobi</span>
        </button>

        {/* Quick Theme Switcher Button */}
        <button
          onClick={toggleThemeMode}
          className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm group"
          title={`Ganti ke mode ${effectiveTheme === 'dark' ? 'Terang (Light)' : 'Gelap (Dark)'}`}
        >
          {effectiveTheme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
              <span className="hidden md:inline font-medium">Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-500 group-hover:-rotate-12 transition-transform" />
              <span className="hidden md:inline font-medium">Gelap</span>
            </>
          )}
        </button>

        {/* Top-Right Teacher / Admin Profile Dropdown */}
        <div className="relative">
          {/* Profile Trigger Button */}
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 p-2 sm:px-3 rounded-2xl transition-all cursor-pointer hover:border-emerald-500/40 shadow-sm"
            title="Menu Profil Guru / Admin"
          >
            {settings.guruPhotoUrl ? (
              <img
                src={settings.guruPhotoUrl}
                alt={settings.namaGuru || 'Guru'}
                className="w-8 h-8 rounded-xl object-cover border border-emerald-500/40 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
            
            <div className="text-left max-w-[140px] sm:max-w-[180px] truncate">
              <p className="text-xs font-bold text-white truncate leading-snug">
                {settings.namaGuru || settings.adminUsername || 'Admin'}
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold truncate leading-none mt-0.5">
                {settings.mataPelajaran || 'Administrator'}
              </p>
            </div>

            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Backdrop overlay for closing dropdown when clicking outside */}
          {profileOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setProfileOpen(false)}
            />
          )}

          {/* Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl shadow-black/80 backdrop-blur-2xl z-50 p-2 space-y-1 divide-y divide-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
              
              {/* Profile Summary Header inside Dropdown */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center gap-3">
                  {settings.guruPhotoUrl ? (
                    <img
                      src={settings.guruPhotoUrl}
                      alt={settings.namaGuru || 'Guru'}
                      className="w-11 h-11 rounded-2xl object-cover border-2 border-emerald-500/40 shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0 shadow-md">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {settings.namaGuru || settings.adminUsername || 'Administrator'}
                    </p>
                    {settings.mataPelajaran && (
                      <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5 truncate">
                        <BookOpen className="w-3 h-3 shrink-0" />
                        <span className="truncate">{settings.mataPelajaran}</span>
                      </p>
                    )}
                    {settings.nip && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                        NIP: {settings.nip}
                      </p>
                    )}
                  </div>
                </div>

                {settings.jabatan && (
                  <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="truncate">{settings.jabatan}</span>
                  </div>
                )}
              </div>

              {/* Navigation Options */}
              <div className="pt-1 space-y-1">
                <button
                  onClick={() => {
                    setActiveTab('Pengaturan');
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <div className="p-1.5 rounded-xl bg-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-700/80 transition-colors">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                      Pengaturan Aplikasi
                    </p>
                    <p className="text-[10px] text-slate-500">Profil guru, logo, tahun ajaran & arsip</p>
                  </div>
                </button>
              </div>

              {/* Logout Option */}
              <div className="pt-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-rose-400 hover:bg-rose-500/15 flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rose-400">Logout Admin</p>
                    <p className="text-[10px] text-rose-400/70">Keluar dari sesi administrator</p>
                  </div>
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

    </header>
  );
};


