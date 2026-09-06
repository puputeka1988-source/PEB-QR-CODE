import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, History, Calendar, PlusCircle, Zap, Wrench, ShieldCheck, 
  Search, Filter, CheckCircle2, ChevronRight, Download, Tag, ArrowUpRight,
  Info, BellRing, RefreshCw
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { 
  CHANGELOG_DATA, 
  CURRENT_APP_VERSION, 
  CURRENT_RELEASE_DATE, 
  APP_BUILD_ID,
  ChangelogRelease, 
  ChangeType 
} from '../../../config/changelog';

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

interface ChangelogTabProps {
  onOpenWhatsNewModal?: () => void;
}

export const ChangelogTab: React.FC<ChangelogTabProps> = ({ onOpenWhatsNewModal }) => {
  const { effectiveTheme } = useApp();
  const isLight = effectiveTheme === 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | ChangeType>('ALL');

  // Filtered changelog list based on search and type
  const filteredChangelog = useMemo(() => {
    return CHANGELOG_DATA.map(release => {
      let filteredChanges = release.changes;

      if (selectedTypeFilter !== 'ALL') {
        filteredChanges = filteredChanges.filter(c => c.type === selectedTypeFilter);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filteredChanges = filteredChanges.filter(c => 
          (c.title && c.title.toLowerCase().includes(q)) || 
          c.description.toLowerCase().includes(q) ||
          release.title.toLowerCase().includes(q) ||
          release.version.toLowerCase().includes(q)
        );
      }

      return {
        ...release,
        changes: filteredChanges
      };
    }).filter(release => release.changes.length > 0 || (!searchQuery && selectedTypeFilter === 'ALL'));
  }, [searchQuery, selectedTypeFilter]);

  const totalReleases = CHANGELOG_DATA.length;
  const totalChangesCount = CHANGELOG_DATA.reduce((acc, curr) => acc + curr.changes.length, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Current Active Version & Highlights */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                Versi Sistem Aktif
              </span>
              <span className="font-mono text-sm font-black text-white bg-slate-950/80 px-2.5 py-0.5 rounded-lg border border-slate-800">
                {CURRENT_APP_VERSION}
              </span>
              <span className="font-mono text-[11px] text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800 hidden sm:inline">
                Build: {APP_BUILD_ID}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Pusat Riwayat Pembaruan & Catatan Rilis
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Setiap perbaikan fitur, optimasi performa, keamanan, dan pembaruan sistem tercatat secara transparan dan nomor versi berubah otomatis.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col gap-2.5 shrink-0">
            {onOpenWhatsNewModal && (
              <button
                type="button"
                onClick={onOpenWhatsNewModal}
                className="px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer hover:opacity-90 active:scale-95"
                style={{
                  backgroundColor: 'var(--color-accent, #10b981)',
                  color: 'var(--color-accent-contrast, #ffffff)',
                  boxShadow: '0 4px 14px var(--color-accent-ambient, rgba(16, 185, 129, 0.3))'
                }}
              >
                <BellRing className="w-4 h-4" />
                <span>Buka Pop-up "What's New"</span>
              </button>
            )}

            <div className="bg-slate-950/80 border border-slate-800/80 px-3.5 py-2 rounded-2xl text-[11px] text-slate-400 flex items-center justify-between gap-4">
              <span>Total Rilis: <strong className="text-white font-mono">{totalReleases}</strong></span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>Total Catatan: <strong className="text-emerald-400 font-mono">{totalChangesCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari fitur, perbaikan bug, atau nomor versi..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Reset
              </button>
            )}
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedTypeFilter === 'ALL'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Semua ({totalChangesCount})
            </button>

            {(Object.keys(TYPE_CONFIG) as ChangeType[]).map(typeKey => {
              const cfg = TYPE_CONFIG[typeKey];
              const count = CHANGELOG_DATA.reduce((acc, curr) => acc + curr.changes.filter(c => c.type === typeKey).length, 0);

              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => setSelectedTypeFilter(typeKey)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    selectedTypeFilter === typeKey
                      ? 'bg-slate-800 text-white border border-slate-600 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span className={cfg.color}>•</span>
                  <span>{cfg.label}</span>
                  <span className="text-[10px] font-mono text-slate-500">({count})</span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Vertical Timeline List */}
      <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 sm:before:left-6 before:w-0.5 before:bg-slate-800/80 before:z-0">
        {filteredChangelog.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-2 relative z-10">
            <Info className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">Tidak ada riwayat pembaruan yang cocok</h4>
            <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau reset filter kategori.</p>
          </div>
        ) : (
          filteredChangelog.map((release, rIdx) => {
            const isLatest = release.version === CURRENT_APP_VERSION;

            return (
              <motion.div
                key={release.version}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: rIdx * 0.04 }}
                className="relative z-10 pl-11 sm:pl-14"
              >
                {/* Timeline Bullet Node */}
                <div className={`absolute left-3.5 sm:left-4.5 top-5 -translate-x-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  isLatest 
                    ? 'bg-emerald-500 border-emerald-300 shadow-md shadow-emerald-500/40 ring-4 ring-emerald-500/20' 
                    : 'bg-slate-900 border-slate-600'
                }`} />

                {/* Release Card */}
                <div 
                  className="rounded-3xl border transition-all overflow-hidden"
                  style={{
                    backgroundColor: isLight ? '#ffffff' : (isLatest ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.8)'),
                    borderColor: isLatest 
                      ? (isLight ? 'var(--color-accent)' : 'rgba(16, 185, 129, 0.4)') 
                      : (isLight ? '#e2e8f0' : '#1e293b'),
                    boxShadow: isLatest 
                      ? (isLight ? '0 10px 25px -5px rgba(0, 0, 0, 0.08)' : '0 10px 25px -5px rgba(0, 0, 0, 0.5)') 
                      : undefined
                  }}
                >
                  
                  {/* Card Header */}
                  <div 
                    className="p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    style={{
                      backgroundColor: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.4)',
                      borderColor: isLight ? '#e2e8f0' : 'rgba(30, 41, 59, 0.8)'
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span 
                          className="font-mono text-sm sm:text-base font-black px-2.5 py-1 rounded-xl border"
                          style={{
                            backgroundColor: isLight ? '#ffffff' : '#020617',
                            borderColor: isLight ? '#cbd5e1' : '#1e293b',
                            color: isLight ? '#000000' : '#ffffff'
                          }}
                        >
                          {release.version}
                        </span>

                        {isLatest && (
                          <span 
                            className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: 'var(--color-accent-subtle, rgba(16, 185, 129, 0.15))',
                              borderColor: 'var(--color-accent-border, rgba(16, 185, 129, 0.4))',
                              color: isLight ? 'var(--color-accent-text-light, var(--color-accent))' : 'var(--color-accent)'
                            }}
                          >
                            Rilis Aktif (Terbaru)
                          </span>
                        )}

                        {release.badge && !isLatest && (
                          <span 
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
                              borderColor: isLight ? '#cbd5e1' : '#334155',
                              color: isLight ? '#334155' : '#94a3b8'
                            }}
                          >
                            {release.badge}
                          </span>
                        )}

                        <span 
                          className="flex items-center gap-1.5 text-xs font-medium"
                          style={{ color: isLight ? '#475569' : '#94a3b8' }}
                        >
                          <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
                          {release.releaseDate}
                        </span>
                      </div>

                      <h4 
                        className="text-base sm:text-lg font-bold mt-2 leading-snug changelog-theme-title"
                        style={{ color: isLight ? '#000000' : '#ffffff' }}
                      >
                        {release.title}
                      </h4>
                    </div>
                  </div>

                  {/* Highlights if any */}
                  {release.highlights && (
                    <div 
                      className="px-4 sm:px-6 py-3 border-b text-xs leading-relaxed flex items-start gap-2.5 transition-colors"
                      style={{
                        backgroundColor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'var(--color-accent-subtle, rgba(16, 185, 129, 0.05))',
                        borderColor: isLight ? '#e2e8f0' : 'rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
                      <div className="min-w-0 flex-1">
                        <strong 
                          className="block text-[11px] font-extrabold uppercase tracking-wider mb-0.5"
                          style={{ color: isLight ? 'var(--color-accent-text-light, var(--color-accent))' : 'var(--color-accent)' }}
                        >
                          Ringkasan Pembaruan:
                        </strong>
                        <p 
                          className="font-semibold leading-relaxed changelog-theme-highlights"
                          style={{ color: isLight ? '#000000' : '#ffffff' }}
                        >
                          {release.highlights}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Changes List */}
                  <div className="p-4 sm:p-6 space-y-3">
                    {release.changes.map((item, cIdx) => {
                      const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.added;
                      const IconComp = cfg.icon;

                      return (
                        <div
                          key={cIdx}
                          className="p-3.5 rounded-2xl border transition-colors flex items-start gap-3.5"
                          style={{
                            backgroundColor: isLight ? '#f8fafc' : 'rgba(2, 6, 23, 0.4)',
                            borderColor: isLight ? '#e2e8f0' : 'rgba(30, 41, 59, 0.7)'
                          }}
                        >
                          <div className={`p-1.5 rounded-xl ${cfg.badgeBg} border shrink-0 mt-0.5`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfg.badgeBg}`}>
                                {cfg.label}
                              </span>
                              {item.title && (
                                <span 
                                  className="text-xs font-bold"
                                  style={{ color: isLight ? '#000000' : '#f8fafc' }}
                                >
                                  {item.title}
                                </span>
                              )}
                            </div>
                            <p 
                              className="text-xs leading-relaxed"
                              style={{ color: isLight ? '#334155' : '#94a3b8' }}
                            >
                              {item.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </motion.div>
            );
          })
        )}
      </div>

    </div>
  );
};
