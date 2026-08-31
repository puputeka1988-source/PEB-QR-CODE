import React, { useState, useMemo } from 'react';
import { Student, Announcement, AnnouncementCategory } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatIndonesianDayAndDate } from '../../utils/formatters';
import { 
  Megaphone, Bell, Calendar, Clock, User, CheckCircle2, 
  ExternalLink, Search, Filter, ShieldAlert, AlertTriangle, 
  Sparkles, Info, Flame, Pin, ChevronRight, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentAnnouncementTabProps {
  student: Student;
}

export const StudentAnnouncementTab: React.FC<StudentAnnouncementTabProps> = ({ student }) => {
  const { announcements, markAnnouncementAsRead, settings } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Filter announcements for this student
  const studentAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      // 1. Audience check
      const isTargetAll = ann.targetType === 'all';
      const isTargetClass = ann.targetType === 'class' && Array.isArray(ann.targetClasses) && ann.targetClasses.includes(student.class);
      const isTargetStudent = ann.targetType === 'student' && Array.isArray(ann.targetStudentIds) && (
        ann.targetStudentIds.includes(student.id) || 
        ann.targetStudentIds.includes(student.nisn)
      );

      return isTargetAll || isTargetClass || isTargetStudent;
    });
  }, [announcements, student]);

  // Check read status for this student
  const isReadByStudent = (ann: Announcement): boolean => {
    let localReadIds: string[] = [];
    try {
      const byId = JSON.parse(localStorage.getItem(`qr_read_announcements_${student.id}`) || '[]');
      const byNisn = JSON.parse(localStorage.getItem(`qr_read_announcements_${student.nisn}`) || '[]');
      localReadIds = Array.from(new Set([...byId, ...byNisn]));
    } catch (e) {}

    const isReadInDoc = Boolean(ann.readBy && (ann.readBy[student.id] || ann.readBy[student.nisn]));
    const isReadInCache = localReadIds.includes(ann.id);

    return isReadInDoc || isReadInCache;
  };

  // Filtered by search & category
  const filteredAnnouncements = useMemo(() => {
    return studentAnnouncements.filter(ann => {
      const q = searchQuery.toLowerCase();
      const matchQuery = !q || 
        ann.title.toLowerCase().includes(q) || 
        ann.content.toLowerCase().includes(q) || 
        ann.authorName.toLowerCase().includes(q);

      const matchCategory = selectedCategory === 'all' || ann.category === selectedCategory;
      return matchQuery && matchCategory;
    });
  }, [studentAnnouncements, searchQuery, selectedCategory]);

  const unreadCount = studentAnnouncements.filter(a => !isReadByStudent(a)).length;

  const getCategoryBadge = (category: AnnouncementCategory) => {
    switch (category) {
      case 'darurat':
        return {
          bg: 'bg-red-500/15 text-red-400 border-red-500/30',
          icon: ShieldAlert,
          label: 'Darurat / Mendesak'
        };
      case 'penting':
        return {
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: AlertTriangle,
          label: 'Penting'
        };
      case 'akademik':
        return {
          bg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
          icon: Sparkles,
          label: 'Akademik & Ujian'
        };
      case 'kegiatan':
        return {
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: Calendar,
          label: 'Kegiatan Sekolah'
        };
      default:
        return {
          bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          icon: Info,
          label: 'Informasi Umum'
        };
    }
  };

  const handleOpenAnnouncement = (ann: Announcement) => {
    setSelectedAnnouncement(ann);
    // Auto mark as read upon viewing
    markAnnouncementAsRead(ann.id, student.id, student.name, student.class, 'student');
  };

  return (
    <div id="student-announcement-tab" className="space-y-5">
      {/* Header Info Card */}
      <div className="p-5 bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 rounded-2xl border border-blue-800/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner flex-shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">Pengumuman & Broadcast</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500 text-white animate-pulse">
                  {unreadCount} Baru
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Informasi langsung dari guru, wali kelas, dan sekolah untuk kelas <strong className="text-white font-semibold">{student.class}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800 self-end sm:self-auto">
          <span>Total: {studentAnnouncements.length} Pengumuman</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari pengumuman atau tugas..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'info', label: 'Info' },
            { id: 'penting', label: 'Penting' },
            { id: 'darurat', label: 'Darurat' },
            { id: 'akademik', label: 'Akademik' },
            { id: 'kegiatan', label: 'Kegiatan' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-700">
          <Megaphone className="w-12 h-12 mx-auto text-slate-500 mb-3" />
          <h3 className="text-sm font-bold text-slate-100">Belum Ada Pengumuman</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Semua informasi terbaru untuk kelas {student.class} akan ditampilkan di sini secara otomatis.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAnnouncements.map(ann => {
            const isRead = isReadByStudent(ann);
            const catMeta = getCategoryBadge(ann.category);
            const CatIcon = catMeta.icon;

            return (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleOpenAnnouncement(ann)}
                className={`group p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  !isRead
                    ? 'bg-slate-900 border-blue-500/70 shadow-lg shadow-blue-950/40 hover:border-blue-400'
                    : 'bg-slate-900 border-slate-700/80 hover:border-slate-600 hover:bg-slate-850'
                }`}
              >
                <div>
                  {/* Top Badges & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${catMeta.bg}`}>
                        <CatIcon className="w-3 h-3" />
                        {catMeta.label}
                      </span>

                      {!isRead ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          BARU
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950 text-slate-300 border border-slate-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Sudah Dibaca
                        </span>
                      )}

                      {ann.isPinned && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-950 text-indigo-300 border border-indigo-500/50 flex items-center gap-0.5">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-300 font-semibold">
                      {formatIndonesianDayAndDate(ann.date).fullString} • {ann.time} {settings.timezone || 'WIB'}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-blue-300 transition-colors leading-snug line-clamp-2">
                    {ann.title}
                  </h3>

                  {/* Snippet */}
                  <p className="text-xs text-slate-200 mt-2 line-clamp-3 leading-relaxed whitespace-pre-line bg-slate-950 p-3 rounded-xl border border-slate-700 font-medium">
                    {ann.content}
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="truncate font-semibold">{ann.authorName}</span>
                  </div>

                  <div className="flex items-center gap-1 text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                    <span>Baca Detail</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Reader Modal for Selected Announcement */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <div 
            id="student-announcement-reader-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                    Detail Pengumuman
                  </span>
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-2 leading-snug">
                  {selectedAnnouncement.title}
                </h3>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-slate-200">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Diterbitkan oleh: <strong className="text-white">{selectedAnnouncement.authorName}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatIndonesianDayAndDate(selectedAnnouncement.date).fullString} • {selectedAnnouncement.time} {settings.timezone || 'WIB'}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 text-sm leading-relaxed whitespace-pre-line text-slate-100 font-normal">
                  {selectedAnnouncement.content}
                </div>

                {selectedAnnouncement.attachmentUrl && (
                  <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-800/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-blue-300 truncate">
                      <ExternalLink className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="truncate">{selectedAnnouncement.attachmentName || 'Tautan Dokumen / Lampiran'}</span>
                    </div>
                    <a
                      href={selectedAnnouncement.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                    >
                      Buka Link
                    </a>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Telah ditandai sudah dibaca</span>
                </div>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
