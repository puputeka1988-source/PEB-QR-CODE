import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, Calendar, Menu, LogOut, Settings, User, ChevronDown, 
  BookOpen, ShieldCheck, Sun, Moon, FolderArchive, Check,
  Monitor, School, Sparkles, ArrowLeft, LayoutDashboard,
  Wifi, WifiOff, RefreshCw, CloudUpload
} from 'lucide-react';
import { CURRENT_APP_VERSION } from '../../config/changelog';
import { getCurrentTimeInTimezone } from '../../utils/formatters';
import { NotificationBellDropdown } from '../notifications/NotificationBellDropdown';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenChangelog?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, onOpenChangelog }) => {
  const { 
    settings, attendance, filterDate, logout, activeTab, setActiveTab, 
    previousTab, navigateBack, navigateToDashboard, setThemeMode, 
    effectiveTheme, academicYears, activeAcademicYear, setActiveAcademicYear,
    setIsKioskMode, isOnline, offlineQueue, isQueueSyncing, setIsOfflineQueueModalOpen
  } = useApp();
  const [time, setTime] = useState<string>('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [ayDropdownOpen, setAyDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const ayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tz = settings.timezone || 'WIB';
    const update = () => {
      setTime(getCurrentTimeInTimezone(tz, true));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [settings.timezone]);

  // Click anywhere on window to close open dropdowns
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (ayDropdownOpen && ayRef.current && !ayRef.current.contains(e.target as Node)) {
        setAyDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileOpen(false);
        setAyDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen, ayDropdownOpen]);

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
    <header className="h-20 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-xl sticky top-0 z-30 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-6">
      
      {/* Left Branding: Logo & School Identity (Prioritized prominent width) */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white shrink-0 cursor-pointer"
          title="Buka Navigasi Menu"
        >
          <Menu className="w-5 h-5" />
        </motion.button>

        {/* Back Button with Arrow icon only (no text) to preserve maximum space for logo & school name */}
        {activeTab !== 'Dashboard' && (
          <motion.button
            whileHover={{ scale: 1.08, x: -2 }}
            whileTap={{ scale: 0.92 }}
            onClick={navigateBack}
            id="btn-header-back"
            className="p-2 sm:p-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 transition-all cursor-pointer shrink-0 shadow-sm group"
            title={`Kembali ke ${previousTab || 'Dashboard'}`}
            aria-label={`Kembali ke ${previousTab || 'Dashboard'}`}
          >
            <ArrowLeft className="w-5 h-5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
          </motion.button>
        )}

        {/* School Logo Container */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-950/80 border border-slate-800 p-1 flex items-center justify-center shrink-0 shadow-sm">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo Sekolah" className="w-full h-full object-contain" />
          ) : (
            <School className="w-5 h-5 text-emerald-400" />
          )}
        </div>

        {/* School Name & Subtitle Info */}
        <div className="min-w-0 flex-1">
          <h1 
            className="text-sm sm:text-base md:text-lg font-extrabold text-white tracking-tight leading-tight truncate select-text"
            title={settings.sekolah || 'Sistem Presensi Siswa'}
          >
            {settings.sekolah || 'Sistem Presensi Siswa'}
          </h1>
          <div className="flex items-center flex-wrap gap-x-2.5 gap-y-0.5 text-xs text-slate-400 mt-0.5">
            <span className="flex items-center gap-1.5 text-slate-400 truncate">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate font-medium">{todayFormatted}</span>
            </span>
            {activeAcademicYear && (
              <span className="hidden md:inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded-md border border-emerald-500/20 shrink-0">
                TA {activeAcademicYear.name} ({activeAcademicYear.semester})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Actions & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        
        {/* Academic Year Quick Switcher Badge (Compact) */}
        {activeAcademicYear && (
          <div className="relative hidden sm:block" ref={ayRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setAyDropdownOpen(!ayDropdownOpen)}
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer hover:border-emerald-500/40"
              title="Tahun Ajaran Aktif (Klik untuk ganti atau kelola arsip)"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono text-emerald-400 font-bold text-xs">
                TA {activeAcademicYear.name}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${ayDropdownOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {ayDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent cursor-default"
                    onClick={() => setAyDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-64 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-2xl z-50 p-2 space-y-1 divide-y divide-slate-800/80"
                  >
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
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Digital Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 bg-slate-800/60 px-2.5 py-1.5 rounded-xl border border-slate-700/60 shadow-inner">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{time || '00:00:00'} <span className="text-[10px] text-emerald-400 font-bold ml-0.5">{settings.timezone || 'WIB'}</span></span>
        </div>

        {/* Offline Presensi & Sync Queue Indicator */}
        {(() => {
          const pendingCount = offlineQueue.filter(q => q.status === 'pending' || q.status === 'failed').length;
          return (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOfflineQueueModalOpen(true)}
              id="btn-header-offline-queue"
              className={`px-2 sm:px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm border ${
                !isOnline
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                  : pendingCount > 0
                  ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border-orange-500/40 animate-pulse'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
              }`}
              title={
                !isOnline
                  ? `Mode Offline Aktif! Ada ${pendingCount} antrean presensi tersimpan lokal.`
                  : pendingCount > 0
                  ? `Ada ${pendingCount} antrean presensi menunggu sinkronisasi.`
                  : 'Koneksi Online: Semua presensi tersinkron dengan Cloud'
              }
            >
              {isQueueSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
              ) : !isOnline ? (
                <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : pendingCount > 0 ? (
                <CloudUpload className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              ) : (
                <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span className="hidden md:inline font-semibold">
                {isQueueSyncing ? 'Sinkron...' : !isOnline ? 'Offline' : pendingCount > 0 ? 'Antrean' : 'Online'}
              </span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                  {pendingCount}
                </span>
              )}
            </motion.button>
          );
        })()}

        {/* Notification Bell Dropdown (Broadcast & Pengumuman) */}
        <NotificationBellDropdown isAdmin={true} />

        {/* Kiosk Mode Lobby Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsKioskMode(true)}
          className="px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm group"
          title="Buka Mode Kiosk Layar Penuh (Gerbang & Lobi)"
        >
          <Monitor className="w-4 h-4 text-indigo-400 group-hover:text-white transition-colors shrink-0" />
          <span className="hidden xl:inline font-bold">Kiosk Lobi</span>
        </motion.button>

        {/* Quick Theme Switcher Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleThemeMode}
          className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer shadow-sm group"
          title={`Ganti ke mode ${effectiveTheme === 'dark' ? 'Terang (Light)' : 'Gelap (Dark)'}`}
        >
          {effectiveTheme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform shrink-0" />
              <span className="hidden xl:inline">Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-500 group-hover:-rotate-12 transition-transform shrink-0" />
              <span className="hidden xl:inline">Gelap</span>
            </>
          )}
        </motion.button>

        {/* Top-Right Teacher / Admin Profile Photo-Only Trigger Button */}
        <div className="relative" ref={profileRef}>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setProfileOpen(!profileOpen)}
            id="btn-header-profile"
            className={`relative rounded-2xl transition-all cursor-pointer shadow-sm p-0.5 border shrink-0 ${
              profileOpen
                ? 'ring-2 ring-emerald-400 border-emerald-400 bg-emerald-500/20'
                : 'border-slate-700/80 hover:border-emerald-500/60 bg-slate-800/80 hover:bg-slate-800'
            }`}
            title={`Profil ${settings.namaGuru || settings.adminUsername || 'Admin'} (Klik untuk buka menu)`}
            aria-label="Menu Profil Admin"
          >
            {settings.guruPhotoUrl ? (
              <img
                src={settings.guruPhotoUrl}
                alt={settings.namaGuru || 'Guru'}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] object-cover"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-slate-900 border border-slate-700/80 flex items-center justify-center text-emerald-400">
                <User className="w-5 h-5" />
              </div>
            )}
            {/* Active Status Indicator Dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </motion.button>

          {/* Backdrop overlay for closing dropdown when clicking anywhere */}
          <AnimatePresence>
            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent cursor-default"
                  onClick={() => setProfileOpen(false)}
                />

                {/* Dropdown Menu */}
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-72 bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl shadow-black/80 backdrop-blur-2xl z-50 p-2 space-y-1 divide-y divide-slate-800/80"
                >
                  
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

                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        if (onOpenChangelog) {
                          onOpenChangelog();
                        } else {
                          setActiveTab('Pengaturan');
                        }
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-3 transition-colors cursor-pointer group"
                    >
                      <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                            Catatan Rilis & Changelog
                          </p>
                          <span className="font-mono text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                            {CURRENT_APP_VERSION}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">Lihat fitur baru & riwayat pembaruan</p>
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

                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

      </div>

    </header>
  );
};


