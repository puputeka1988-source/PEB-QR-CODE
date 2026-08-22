import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, X, Check, ArrowRight, ShieldCheck, Zap, Wrench, 
  PlusCircle, Calendar, Tag, ChevronDown, ChevronUp, History, Info
} from 'lucide-react';
import { 
  CHANGELOG_DATA, 
  CURRENT_APP_VERSION, 
  CURRENT_RELEASE_DATE, 
  CURRENT_RELEASE_TITLE,
  ChangelogRelease,
  ChangeItem,
  ChangeType
} from '../../config/changelog';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSettings?: () => void;
}

const TYPE_CONFIG: Record<ChangeType, { label: string; icon: React.ElementType; color: string; badgeBg: string }> = {
  added: {
    label: 'Fitur Baru',
    icon: PlusCircle,
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
  },
  improved: {
    label: 'Peningkatan',
    icon: Zap,
    color: 'text-sky-400',
    badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/30'
  },
  fixed: {
    label: 'Perbaikan',
    icon: Wrench,
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
  },
  security: {
    label: 'Keamanan',
    icon: ShieldCheck,
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
  }
};

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ 
  isOpen, 
  onClose,
  onNavigateToSettings 
}) => {
  const [selectedVersion, setSelectedVersion] = useState<string>(CURRENT_APP_VERSION);
  const [showAllVersions, setShowAllVersions] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentRelease = CHANGELOG_DATA.find(r => r.version === selectedVersion) || CHANGELOG_DATA[0];

  const handleAcknowledge = () => {
    try {
      localStorage.setItem('qr_presensi_last_seen_version', CURRENT_APP_VERSION);
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto flex flex-col max-h-[90vh]"
      >
        {/* Modal Header with Gradient Banner */}
        <div className="relative px-5 py-5 sm:px-6 sm:py-6 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border-b border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Catatan Rilis Pembaruan
                  </span>
                  <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                    {currentRelease.version}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1 leading-snug">
                  {currentRelease.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
              title="Tutup dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/60">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Dirilis: {currentRelease.releaseDate}
            </span>
            {currentRelease.badge && (
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Status: {currentRelease.badge}
              </span>
            )}
          </div>
        </div>

        {/* Version Switcher Pills */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/70 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <History className="w-3.5 h-3.5 text-slate-500" />
              Riwayat Versi:
            </span>
            {CHANGELOG_DATA.slice(0, 4).map((rel) => (
              <button
                key={rel.version}
                type="button"
                onClick={() => setSelectedVersion(rel.version)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedVersion === rel.version
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                }`}
              >
                {rel.version}
              </button>
            ))}
          </div>

          {onNavigateToSettings && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToSettings();
              }}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
            >
              <span>Semua Versi</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Modal Body: Highlights & Categorized Changes */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {currentRelease.highlights && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200/90 leading-relaxed flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-emerald-300 mb-0.5">Ringkasan Pembaruan:</span>
                {currentRelease.highlights}
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              Rincian Perubahan ({currentRelease.changes.length} Poin):
            </h4>

            <div className="space-y-2">
              {currentRelease.changes.map((ch, idx) => {
                const cfg = TYPE_CONFIG[ch.type] || TYPE_CONFIG.added;
                const IconComponent = cfg.icon;

                return (
                  <div 
                    key={idx} 
                    className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700/80 transition-colors flex items-start gap-3"
                  >
                    <div className={`p-1.5 rounded-xl ${cfg.badgeBg} border shrink-0 mt-0.5`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>

                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${cfg.badgeBg}`}>
                          {cfg.label}
                        </span>
                        {ch.title && (
                          <span className="text-xs font-bold text-slate-200">
                            {ch.title}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {ch.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 sm:px-6 sm:py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Versi sistem diperbarui secara berkala dan otomatis.
          </div>

          <button
            type="button"
            onClick={handleAcknowledge}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer ml-auto"
          >
            <Check className="w-4 h-4" />
            <span>Tandai Sudah Dibaca & Mengerti</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
