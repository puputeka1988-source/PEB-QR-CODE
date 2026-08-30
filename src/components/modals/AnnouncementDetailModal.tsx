import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, X, Calendar, Clock, User, Bell, ExternalLink, 
  Flame, ShieldAlert, AlertTriangle, Sparkles, Info, CheckCircle2,
  Users, Share2, Pin
} from 'lucide-react';
import { Announcement, Student } from '../../types';
import { formatIndonesianDayAndDate } from '../../utils/formatters';

interface AnnouncementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
  currentStudent?: Student | null;
  isAdmin?: boolean;
}

export const AnnouncementDetailModal: React.FC<AnnouncementDetailModalProps> = ({
  isOpen,
  onClose,
  announcement,
  currentStudent,
  isAdmin = false
}) => {
  if (!isOpen || !announcement) return null;

  const getCategoryBadge = (category: string) => {
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

  const cat = getCategoryBadge(announcement.category);
  const CatIcon = cat.icon;

  const readCount = Object.keys(announcement.readBy || {}).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header Banner */}
          <div className={`p-6 border-b border-slate-800 flex items-start justify-between gap-4 ${
            announcement.category === 'darurat'
              ? 'bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900'
              : announcement.category === 'penting'
              ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900'
              : 'bg-gradient-to-r from-indigo-950/30 via-slate-900 to-slate-900'
          }`}>
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cat.bg}`}>
                  <CatIcon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </span>

                {announcement.isPinned && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Pin className="w-3.5 h-3.5" /> Disematkan
                  </span>
                )}

                {announcement.priority === 'urgent' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                    <Flame className="w-3.5 h-3.5" /> Prioritas Tinggi
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                {announcement.title}
              </h2>

              <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <strong className="text-slate-200">{announcement.authorName}</strong>
                  {announcement.authorRole && (
                    <span className="text-slate-400">({announcement.authorRole})</span>
                  )}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{formatIndonesianDayAndDate(announcement.date).fullString}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{announcement.time}</span>
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 transition-colors cursor-pointer shrink-0"
              aria-label="Tutup Detail"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Target Audience Tag */}
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
              <Users className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Ditujukan kepada:</strong>{' '}
                {announcement.targetType === 'all'
                  ? 'Seluruh Siswa & Guru Sekolah'
                  : announcement.targetType === 'class'
                  ? `Kelas ${announcement.targetClasses?.join(', ')}`
                  : `Siswa Tertentu (${announcement.targetStudentNames?.join(', ') || 'Personal'})`}
              </span>
            </div>

            {/* Main Content */}
            <div className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
              {announcement.content}
            </div>

            {/* Attachment Button if present */}
            {announcement.attachmentUrl && (
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-indigo-300">Lampiran / Dokumen Terkait:</div>
                  <div className="text-sm font-semibold text-white truncate">
                    {announcement.attachmentName || announcement.attachmentUrl}
                  </div>
                </div>
                <a
                  href={announcement.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-colors shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Lampiran</span>
                </a>
              </div>
            )}

            {/* Admin View Stats */}
            {isAdmin && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Telah dibaca oleh <strong>{readCount}</strong> penerima</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">ID: {announcement.id}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tutup & Mengerti</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
