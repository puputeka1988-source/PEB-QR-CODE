import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, X, Check, ArrowRight, ShieldCheck, Zap, Wrench, 
  PlusCircle, Calendar, Tag, ChevronDown, ChevronUp, History, Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
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
  const { effectiveTheme } = useApp();
  const isLight = effectiveTheme === 'light';

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
        className="rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto flex flex-col max-h-[90vh] border transition-colors"
        style={{
          backgroundColor: isLight ? '#ffffff' : '#0f172a',
          borderColor: isLight ? '#cbd5e1' : 'rgba(51, 65, 85, 0.8)'
        }}
      >
        {/* Modal Header */}
        <div 
          className="relative px-5 py-5 sm:px-6 sm:py-6 border-b transition-colors"
          style={{
            backgroundColor: isLight ? '#ffffff' : '#0f172a',
            borderColor: isLight ? '#e2e8f0' : 'rgba(30, 41, 59, 0.8)'
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                style={{
                  backgroundColor: 'var(--color-accent-subtle-medium, rgba(16, 185, 129, 0.15))',
                  border: '1px solid var(--color-accent-border, rgba(16, 185, 129, 0.3))',
                  color: 'var(--color-accent)'
                }}
              >
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: 'var(--color-accent-subtle, rgba(16, 185, 129, 0.1))',
                      borderColor: 'var(--color-accent-border, rgba(16, 185, 129, 0.3))',
                      color: isLight ? 'var(--color-accent-text-light, var(--color-accent))' : 'var(--color-accent)'
                    }}
                  >
                    Catatan Rilis Pembaruan
                  </span>
                  <span 
                    className="font-mono text-xs font-bold px-2 py-0.5 rounded-md border"
                    style={{
                      backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
                      borderColor: isLight ? '#cbd5e1' : '#334155',
                      color: isLight ? '#000000' : '#ffffff'
                    }}
                  >
                    {currentRelease.version}
                  </span>
                </div>
                <h3 
                  className="text-base sm:text-lg font-black mt-1.5 leading-snug changelog-theme-title"
                  style={{ color: isLight ? '#000000' : '#ffffff' }}
                >
                  {currentRelease.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-colors cursor-pointer shrink-0"
              style={{
                color: isLight ? '#475569' : '#94a3b8',
                backgroundColor: isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.8)'
              }}
              title="Tutup dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div 
            className="flex items-center gap-4 text-xs mt-3 pt-3 border-t"
            style={{
              borderColor: isLight ? '#e2e8f0' : 'rgba(30, 41, 59, 0.6)',
              color: isLight ? '#334155' : '#94a3b8'
            }}
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
              Dirilis: {currentRelease.releaseDate}
            </span>
            {currentRelease.badge && (
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: 'var(--color-accent-subtle, rgba(16, 185, 129, 0.1))',
                  borderColor: 'var(--color-accent-border, rgba(16, 185, 129, 0.3))',
                  color: isLight ? 'var(--color-accent-text-light, var(--color-accent))' : 'var(--color-accent)'
                }}
              >
                Status: {currentRelease.badge}
              </span>
            )}
          </div>
        </div>

        {/* Version Switcher Pills */}
        <div 
          className="px-5 sm:px-6 py-2.5 border-b flex items-center justify-between gap-2 overflow-x-auto"
          style={{
            backgroundColor: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.6)',
            borderColor: isLight ? '#e2e8f0' : 'rgba(30, 41, 59, 0.7)'
          }}
        >
          <div className="flex items-center gap-1.5">
            <span 
              className="text-[11px] font-semibold shrink-0 mr-1 flex items-center gap-1"
              style={{ color: isLight ? '#334155' : '#94a3b8' }}
            >
              <History className="w-3.5 h-3.5" />
              Riwayat Versi:
            </span>
            {CHANGELOG_DATA.slice(0, 4).map((rel) => (
              <button
                key={rel.version}
                type="button"
                onClick={() => setSelectedVersion(rel.version)}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border"
                style={selectedVersion === rel.version ? {
                  backgroundColor: 'var(--color-accent)',
                  borderColor: 'var(--color-accent)',
                  color: 'var(--color-accent-contrast, #ffffff)',
                  boxShadow: '0 4px 12px var(--color-accent-ambient, rgba(0,0,0,0.2))'
                } : {
                  backgroundColor: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.8)',
                  borderColor: isLight ? '#cbd5e1' : 'rgba(51, 65, 85, 0.6)',
                  color: isLight ? '#000000' : '#cbd5e1'
                }}
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
              className="text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer hover:opacity-80"
              style={{ color: isLight ? 'var(--color-accent-text-light, var(--color-accent))' : 'var(--color-accent)' }}
            >
              <span>Semua Versi</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Modal Body: Highlights & Categorized Changes */}
        <div 
          className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1"
          style={{ backgroundColor: isLight ? '#ffffff' : 'transparent' }}
        >
          {currentRelease.highlights && (
            <div 
              className="p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 shadow-sm transition-colors"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'var(--color-accent-subtle, rgba(16, 185, 129, 0.08))',
                borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'var(--color-accent-border, rgba(16, 185, 129, 0.3))'
              }}
            >
              <div 
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs"
                style={{
                  backgroundColor: 'var(--color-accent-subtle-medium, rgba(16, 185, 129, 0.15))',
                  color: 'var(--color-accent)'
                }}
              >
                <Info className="w-4 h-4" />
              </div>
              <div className="space-y-1.5 min-w-0 flex-1">
                <span 
                  className="font-extrabold text-xs uppercase tracking-wider block"
                  style={{ color: isLight ? 'var(--color-accent-text-light, var(--color-accent))' : 'var(--color-accent)' }}
                >
                  Ringkasan Pembaruan:
                </span>
                <p 
                  className="text-xs font-semibold leading-relaxed changelog-theme-highlights"
                  style={{ color: isLight ? '#000000' : '#ffffff' }}
                >
                  {currentRelease.highlights}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            <h4 
              className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: isLight ? '#334155' : '#94a3b8' }}
            >
              <Tag className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
              Rincian Perubahan ({currentRelease.changes.length} Poin):
            </h4>

            <div className="space-y-2">
              {currentRelease.changes.map((ch, idx) => {
                const cfg = TYPE_CONFIG[ch.type] || TYPE_CONFIG.added;
                const IconComponent = cfg.icon;

                return (
                  <div 
                    key={idx} 
                    className="p-3.5 rounded-2xl border transition-colors flex items-start gap-3"
                    style={{
                      backgroundColor: isLight ? '#ffffff' : 'rgba(2, 6, 23, 0.5)',
                      borderColor: isLight ? '#e2e8f0' : 'rgba(30, 41, 59, 0.8)'
                    }}
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
                          <span 
                            className="text-xs font-bold"
                            style={{ color: isLight ? '#000000' : '#f8fafc' }}
                          >
                            {ch.title}
                          </span>
                        )}
                      </div>
                      <p 
                        className="text-xs leading-relaxed"
                        style={{ color: isLight ? '#334155' : '#94a3b8' }}
                      >
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
        <div 
          className="px-5 py-4 sm:px-6 sm:py-4 border-t flex items-center justify-between gap-3 shrink-0 transition-colors"
          style={{
            backgroundColor: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.8)',
            borderColor: isLight ? '#e2e8f0' : '#1e293b'
          }}
        >
          <div 
            className="text-[11px] hidden sm:block font-medium"
            style={{ color: isLight ? '#64748b' : '#64748b' }}
          >
            Versi sistem diperbarui secara berkala dan otomatis.
          </div>

          <button
            type="button"
            onClick={handleAcknowledge}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ml-auto hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: 'var(--color-accent, #10b981)',
              color: 'var(--color-accent-contrast, #ffffff)',
              boxShadow: '0 4px 14px var(--color-accent-ambient, rgba(16, 185, 129, 0.3))'
            }}
          >
            <Check className="w-4 h-4" />
            <span>Tandai Sudah Dibaca & Mengerti</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
