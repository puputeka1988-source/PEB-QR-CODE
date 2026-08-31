import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, X, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle, 
  Info, Sparkles, Calendar, Clock, User, Bell, ExternalLink, Flame, ShieldAlert
} from 'lucide-react';
import { Announcement, Student } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatIndonesianDayAndDate } from '../../utils/formatters';

interface AnnouncementPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
  currentStudent?: Student | null;
  isAdmin?: boolean;
}

export const AnnouncementPopupModal: React.FC<AnnouncementPopupModalProps> = ({
  isOpen,
  onClose,
  announcements,
  currentStudent,
  isAdmin = false
}) => {
  const { markAnnouncementAsRead, navigateToSubTab, settings } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || announcements.length === 0) return null;

  const currentAnn = announcements[currentIndex] || announcements[0];
  const total = announcements.length;

  const handleMarkAsReadAndNext = () => {
    if (!currentAnn) return;

    if (currentStudent) {
      markAnnouncementAsRead(
        currentAnn.id, 
        currentStudent.id, 
        currentStudent.name, 
        currentStudent.class, 
        'student'
      );
    } else if (isAdmin) {
      markAnnouncementAsRead(
        currentAnn.id, 
        'admin', 
        'Administrator / Guru', 
        'Admin', 
        'admin'
      );
    }

    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleGoToAllAnnouncements = () => {
    // Tandai semua yang saat ini terbuka sebagai dibaca
    announcements.forEach(ann => {
      if (currentStudent) {
        markAnnouncementAsRead(ann.id, currentStudent.id, currentStudent.name, currentStudent.class, 'student');
      } else if (isAdmin) {
        markAnnouncementAsRead(ann.id, 'admin', 'Administrator / Guru', 'Admin', 'admin');
      }
    });
    onClose();
    if (isAdmin) {
      navigateToSubTab('Pengumuman', 'daftar-pengumuman');
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'darurat':
        return {
          bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
          icon: ShieldAlert,
          label: 'Darurat / Mendesak'
        };
      case 'penting':
        return {
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          icon: AlertTriangle,
          label: 'Penting'
        };
      case 'akademik':
        return {
          bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          icon: Sparkles,
          label: 'Akademik & Ujian'
        };
      case 'kegiatan':
        return {
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          icon: Calendar,
          label: 'Kegiatan Sekolah'
        };
      default:
        return {
          bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          icon: Info,
          label: 'Informasi Umum'
        };
    }
  };

  const catMeta = getCategoryBadge(currentAnn.category);
  const CatIcon = catMeta.icon;

  const targetDescription = currentAnn.targetType === 'all'
    ? 'Seluruh Kelas & Siswa'
    : currentAnn.targetType === 'class'
      ? `Khusus Kelas ${(currentAnn.targetClasses || []).join(', ')}`
      : 'Pesan Khusus Personal';

  return (
    <AnimatePresence>
      <div 
        id="announcement-popup-overlay"
        data-student-portal={currentStudent ? 'true' : undefined}
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm ${
          currentStudent ? 'student-portal-isolated' : ''
        }`}
      >
        <motion.div
          id="announcement-popup-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] ${
            currentStudent 
              ? 'bg-slate-900 border-slate-700 text-white' 
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          {/* Header Banner */}
          <div className="relative p-5 sm:p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner flex-shrink-0 border border-white/20">
                  <Megaphone className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-md text-white border border-white/20">
                      Pengumuman Terbaru
                    </span>
                    {total > 1 && (
                      <span className="text-xs font-medium bg-black/25 px-2 py-0.5 rounded-full text-white/90">
                        {currentIndex + 1} dari {total}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mt-1 leading-snug line-clamp-2">
                    {currentAnn.title}
                  </h2>
                </div>
              </div>

              <button
                id="btn-close-announcement-popup"
                onClick={handleMarkAsReadAndNext}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/15 transition-colors"
                title="Tutup & Tandai Dibaca"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Audience Pill & Priority */}
            <div className="mt-4 flex items-center gap-2 flex-wrap text-xs text-blue-100">
              <span className="bg-white/15 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 font-medium">
                <Bell className="w-3.5 h-3.5" />
                {targetDescription}
              </span>
              {currentAnn.priority === 'urgent' && (
                <span className="bg-red-500 text-white font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> MENDESAK
                </span>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium border ${catMeta.bg}`}>
                  <CatIcon className="w-3.5 h-3.5" />
                  {catMeta.label}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatIndonesianDayAndDate(currentAnn.date).fullString}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentAnn.time} {settings.timezone || 'WIB'}</span>
                </div>
              </div>
            </div>

            {/* Author Attribution */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <User className="w-4 h-4 text-indigo-500" />
              <span>Diterbitkan oleh: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{currentAnn.authorName}</strong> {currentAnn.authorRole ? `(${currentAnn.authorRole})` : ''}</span>
            </div>

            {/* Message Body */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line select-text font-normal shadow-sm">
              {currentAnn.content}
            </div>

            {/* Attachment Link if any */}
            {currentAnn.attachmentUrl && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/70 dark:border-indigo-900/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 font-medium truncate">
                  <ExternalLink className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span className="truncate">{currentAnn.attachmentName || 'Tautan / Dokumen Lampiran Pengumuman'}</span>
                </div>
                <a
                  href={currentAnn.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex-shrink-0 flex items-center gap-1"
                >
                  Buka Link
                </a>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
            {/* Pagination Controls */}
            {total > 1 ? (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-prev-announcement"
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition-colors"
                  title="Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 px-1">
                  {currentIndex + 1} / {total}
                </span>
                <button
                  id="btn-next-announcement"
                  onClick={() => setCurrentIndex(prev => Math.min(total - 1, prev + 1))}
                  disabled={currentIndex === total - 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition-colors"
                  title="Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Pesan tersimpan di Pengumuman</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  id="btn-open-announcement-menu"
                  onClick={handleGoToAllAnnouncements}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-xl transition-colors hidden sm:inline-flex"
                >
                  Buka Menu Pengumuman
                </button>
              )}
              <button
                id="btn-confirm-read-announcement"
                onClick={handleMarkAsReadAndNext}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{currentIndex < total - 1 ? 'Lanjut Baca Berikutnya' : 'Saya Mengerti (Tutup)'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
