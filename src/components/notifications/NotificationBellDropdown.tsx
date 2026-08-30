import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, Check, CheckCheck, Megaphone, AlertTriangle, ShieldAlert, 
  Sparkles, Calendar, Info, Clock, User, ChevronRight, ExternalLink,
  PlusCircle, Pin, Eye, Flame, Trash2, ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Announcement, AnnouncementCategory, Student } from '../../types';
import { formatIndonesianDayAndDate } from '../../utils/formatters';
import { AnnouncementDetailModal } from '../modals/AnnouncementDetailModal';

interface NotificationBellDropdownProps {
  isAdmin?: boolean;
  currentStudent?: Student | null;
  onNavigateToTab?: (tab: any) => void;
}

export const NotificationBellDropdown: React.FC<NotificationBellDropdownProps> = ({
  isAdmin = false,
  currentStudent = null,
  onNavigateToTab
}) => {
  const { 
    announcements, 
    getUnreadAnnouncementsForStudent, 
    getUnreadAnnouncementsForAdmin,
    getAnnouncementsForStudent,
    markAnnouncementAsRead,
    markAllAnnouncementsAsReadForStudent,
    markAllAnnouncementsAsReadForAdmin,
    navigateToSubTab,
    setActiveSubTab
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'important'>('all');
  const [selectedAnnouncementForDetail, setSelectedAnnouncementForDetail] = useState<Announcement | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Compute items based on role
  const relevantAnnouncements: Announcement[] = useMemo(() => {
    if (isAdmin) {
      // For Admin: All announcements sorted by pinned first, then newest createdAt / date
      return [...announcements].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (b.createdAt || b.date).localeCompare(a.createdAt || a.date);
      });
    }

    if (currentStudent) {
      // For Student: announcements targeted to student
      const studentList = getAnnouncementsForStudent(currentStudent);
      return [...studentList].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (b.createdAt || b.date).localeCompare(a.createdAt || a.date);
      });
    }

    return [];
  }, [isAdmin, currentStudent, announcements, getAnnouncementsForStudent]);

  // Check read status per item
  const isItemRead = (ann: Announcement): boolean => {
    if (isAdmin) {
      let localReadIds: string[] = [];
      try {
        localReadIds = JSON.parse(localStorage.getItem('qr_read_announcements_admin') || '[]');
      } catch (e) {}
      const isReadInDoc = Boolean(ann.readBy && ann.readBy['admin']);
      const isReadInCache = localReadIds.includes(ann.id);
      return isReadInDoc || isReadInCache;
    }

    if (currentStudent) {
      let localReadIds: string[] = [];
      try {
        const byId = JSON.parse(localStorage.getItem(`qr_read_announcements_${currentStudent.id}`) || '[]');
        const byNisn = JSON.parse(localStorage.getItem(`qr_read_announcements_${currentStudent.nisn}`) || '[]');
        localReadIds = Array.from(new Set([...byId, ...byNisn]));
      } catch (e) {}
      const isReadInDoc = Boolean(ann.readBy && (ann.readBy[currentStudent.id] || ann.readBy[currentStudent.nisn]));
      const isReadInCache = localReadIds.includes(ann.id);
      return isReadInDoc || isReadInCache;
    }

    return true;
  };

  // Compute unread items & count
  const unreadAnnouncements = useMemo(() => {
    if (isAdmin) {
      return getUnreadAnnouncementsForAdmin();
    }
    if (currentStudent) {
      return getUnreadAnnouncementsForStudent(currentStudent);
    }
    return [];
  }, [isAdmin, currentStudent, getUnreadAnnouncementsForAdmin, getUnreadAnnouncementsForStudent, relevantAnnouncements]);

  const unreadCount = unreadAnnouncements.length;

  // Filtered list
  const filteredList = useMemo(() => {
    return relevantAnnouncements.filter(ann => {
      const read = isItemRead(ann);
      if (filterMode === 'unread') {
        return !read;
      }
      if (filterMode === 'important') {
        return ann.category === 'darurat' || ann.category === 'penting' || ann.priority === 'urgent' || ann.priority === 'high';
      }
      return true;
    });
  }, [relevantAnnouncements, filterMode, unreadAnnouncements]);

  // Handle Mark Single Item as Read
  const handleItemClick = (ann: Announcement) => {
    if (currentStudent) {
      markAnnouncementAsRead(ann.id, currentStudent.id, currentStudent.name, currentStudent.class, 'student');
      markAnnouncementAsRead(ann.id, currentStudent.nisn, currentStudent.name, currentStudent.class, 'student');
    } else if (isAdmin) {
      markAnnouncementAsRead(ann.id, 'admin', 'Administrator / Guru', 'Admin', 'admin');
      try {
        const existing: string[] = JSON.parse(localStorage.getItem('qr_read_announcements_admin') || '[]');
        if (!existing.includes(ann.id)) {
          existing.push(ann.id);
          localStorage.setItem('qr_read_announcements_admin', JSON.stringify(existing));
        }
      } catch {}
    }
    setSelectedAnnouncementForDetail(ann);
  };

  // Handle Mark All as Read
  const handleMarkAllRead = () => {
    if (currentStudent) {
      markAllAnnouncementsAsReadForStudent(currentStudent);
    } else if (isAdmin) {
      markAllAnnouncementsAsReadForAdmin();
    }
  };

  // Handle Go to Full Announcements Tab
  const handleGoToFullTab = () => {
    setIsOpen(false);
    if (isAdmin) {
      navigateToSubTab('Pengumuman', 'daftar-pengumuman');
    } else if (onNavigateToTab) {
      onNavigateToTab('pengumuman');
    }
  };

  // Handle Create Broadcast Quick Link (Admin Only)
  const handleCreateBroadcast = () => {
    setIsOpen(false);
    navigateToSubTab('Pengumuman', 'buat-broadcast');
  };

  const getCategoryConfig = (category: AnnouncementCategory) => {
    switch (category) {
      case 'darurat':
        return {
          icon: ShieldAlert,
          bg: 'bg-red-500/15 text-red-400 border-red-500/30',
          dot: 'bg-red-500',
          label: 'Darurat'
        };
      case 'penting':
        return {
          icon: AlertTriangle,
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
          label: 'Penting'
        };
      case 'akademik':
        return {
          icon: Sparkles,
          bg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
          dot: 'bg-indigo-500',
          label: 'Akademik'
        };
      case 'kegiatan':
        return {
          icon: Calendar,
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
          label: 'Kegiatan'
        };
      default:
        return {
          icon: Info,
          bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          dot: 'bg-blue-500',
          label: 'Info'
        };
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Detail Modal */}
      <AnnouncementDetailModal
        isOpen={Boolean(selectedAnnouncementForDetail)}
        onClose={() => setSelectedAnnouncementForDetail(null)}
        announcement={selectedAnnouncementForDetail}
        currentStudent={currentStudent}
        isAdmin={isAdmin}
      />

      {/* Bell Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 sm:px-2.5 sm:py-1.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm ${
          isOpen
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 ring-2 ring-emerald-500/30'
            : unreadCount > 0
            ? 'bg-slate-800/90 text-amber-400 hover:text-amber-300 border-amber-500/40 hover:border-amber-500/60'
            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80'
        }`}
        title={`Notifikasi & Siaran Pengumuman ${unreadCount > 0 ? `(${unreadCount} baru)` : ''}`}
        aria-label="Notifikasi Pengumuman"
      >
        <div className="relative">
          <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-300'}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </div>

        <span className="hidden xl:inline font-semibold">
          {isAdmin ? 'Siaran' : 'Info'}
        </span>

        {unreadCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-black text-[10px] leading-tight shadow-sm shadow-red-900/50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </motion.button>

      {/* Dropdown Notification Flyout */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-x-3 top-16 sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-2 w-auto sm:w-96 md:w-[420px] bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[580px]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-white truncate">
                    {isAdmin ? 'Notifikasi Siaran & Pengumuman' : 'Pemberitahuan & Siaran'}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    {unreadCount > 0 ? `${unreadCount} pengumuman belum dibaca` : 'Semua pengumuman telah dibaca'}
                  </p>
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-[11px] font-bold border border-slate-700 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  title="Tandai semua sebagai sudah dibaca"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tandai Dibaca</span>
                </button>
              )}
            </div>

            {/* Quick Action & Filter Bar */}
            <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Semua ({relevantAnnouncements.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('unread')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                    filterMode === 'unread'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>Belum Dibaca</span>
                  {unreadCount > 0 && (
                    <span className={`px-1 py-0.2 rounded-full text-[9px] ${
                      filterMode === 'unread' ? 'bg-white text-emerald-800' : 'bg-red-500 text-white'
                    }`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('important')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                    filterMode === 'important'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Penting
                </button>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleCreateBroadcast}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Buat</span>
                </button>
              )}
            </div>

            {/* List of Announcements */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
              {filteredList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">Tidak ada pengumuman dalam kategori ini</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    {filterMode === 'unread' 
                      ? 'Hebat! Anda telah membaca semua notifikasi pengumuman.'
                      : 'Belum ada siaran atau pengumuman yang diterbitkan.'}
                  </p>
                </div>
              ) : (
                filteredList.map((ann) => {
                  const read = isItemRead(ann);
                  const catConfig = getCategoryConfig(ann.category);
                  const CatIcon = catConfig.icon;
                  const readerCount = Object.keys(ann.readBy || {}).length;

                  return (
                    <div
                      key={ann.id}
                      onClick={() => handleItemClick(ann)}
                      className={`p-3 rounded-2xl transition-all cursor-pointer group flex items-start gap-3 border ${
                        !read 
                          ? 'bg-slate-800/90 hover:bg-slate-800 border-emerald-500/30 shadow-md shadow-slate-950/40' 
                          : 'bg-slate-900/40 hover:bg-slate-800/60 border-transparent text-slate-400'
                      }`}
                    >
                      {/* Left Category Icon & Unread Indicator */}
                      <div className="relative shrink-0 mt-0.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${catConfig.bg}`}>
                          <CatIcon className="w-4 h-4" />
                        </div>
                        {!read && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catConfig.bg}`}>
                            {catConfig.label}
                          </span>

                          {ann.isPinned && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-flex items-center gap-0.5">
                              <Pin className="w-2.5 h-2.5" /> Pin
                            </span>
                          )}

                          {!read && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                              Baru
                            </span>
                          )}

                          {ann.priority === 'urgent' && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 uppercase tracking-wider animate-pulse">
                              Darurat
                            </span>
                          )}
                        </div>

                        <h4 className={`text-xs sm:text-sm font-bold line-clamp-1 group-hover:text-emerald-400 transition-colors ${
                          !read ? 'text-white' : 'text-slate-300'
                        }`}>
                          {ann.title}
                        </h4>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {ann.content}
                        </p>

                        <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500 flex-wrap">
                          <span className="text-slate-400 font-medium">{ann.authorName}</span>
                          <span>•</span>
                          <span>{formatIndonesianDayAndDate(ann.date).fullString} • {ann.time}</span>
                          
                          {isAdmin && readerCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400 font-semibold inline-flex items-center gap-0.5">
                                <Eye className="w-3 h-3" /> {readerCount} membaca
                              </span>
                            </>
                          )}

                          {ann.attachmentUrl && (
                            <span className="text-indigo-400 font-bold inline-flex items-center gap-0.5 ml-auto">
                              <ExternalLink className="w-3 h-3" /> Lampiran
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-3" />
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Action */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={handleGoToFullTab}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <span>Lihat Semua di Tab Pengumuman</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
