import React, { useState } from 'react';
import { Sparkles, Plus, Edit3, Trash2, CheckCircle2, BookOpen, Layers, Info, RotateCcw } from 'lucide-react';
import { ClassKokurikulerP5, AppSettings } from '../../../../types';

interface P5KokurikulerSectionProps {
  rombelClassNames: string[];
  p5ConfigMap: { [kelas: string]: ClassKokurikulerP5 };
  onUpdateP5Config: (newMap: { [kelas: string]: ClassKokurikulerP5 }) => void;
  onOpenEditModal: (kelas: string) => void;
  totalIntrakurikulerJp: number;
  totalTugasTambahanJp: number;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const P5KokurikulerSection: React.FC<P5KokurikulerSectionProps> = ({
  rombelClassNames,
  p5ConfigMap,
  onUpdateP5Config,
  onOpenEditModal,
  totalIntrakurikulerJp,
  totalTugasTambahanJp,
  showToast
}) => {
  // Quick Stepper for JP per class
  const handleQuickJpChange = (kelas: string, delta: number) => {
    const current = p5ConfigMap[kelas] || {
      kelas,
      jp: 1,
      category: 'P5',
      theme: 'Gaya Hidup Berkelanjutan',
      projectName: `Projek P5 Kelas ${kelas}`,
      role: 'Fasilitator Utama',
      isEnabled: true
    };

    const newJp = Math.max(0, Math.min(10, (current.jp ?? 1) + delta));
    const updated: ClassKokurikulerP5 = {
      ...current,
      jp: newJp,
      isEnabled: newJp > 0
    };

    const newMap = { ...p5ConfigMap, [kelas]: updated };
    onUpdateP5Config(newMap);
    showToast(`Beban P5 Kelas ${kelas} diubah menjadi ${newJp} JP`, 'info');
  };

  const handleToggleEnable = (kelas: string) => {
    const current = p5ConfigMap[kelas] || {
      kelas,
      jp: 1,
      category: 'P5',
      theme: 'Gaya Hidup Berkelanjutan',
      projectName: `Projek P5 Kelas ${kelas}`,
      role: 'Fasilitator Utama',
      isEnabled: true
    };

    const nextState = !current.isEnabled;
    const updated: ClassKokurikulerP5 = {
      ...current,
      isEnabled: nextState,
      jp: nextState ? (current.jp > 0 ? current.jp : 1) : 0
    };

    const newMap = { ...p5ConfigMap, [kelas]: updated };
    onUpdateP5Config(newMap);
    showToast(`Kokurikuler/P5 Kelas ${kelas} ${nextState ? 'diaktifkan' : 'dinonaktifkan'}`, 'info');
  };

  const handleBulkSetAll = (jp: number) => {
    const newMap = { ...p5ConfigMap };
    rombelClassNames.forEach(cls => {
      const existing = p5ConfigMap[cls] || {
        kelas: cls,
        category: 'P5',
        theme: 'Gaya Hidup Berkelanjutan',
        projectName: `Projek P5 Kelas ${cls}`,
        role: 'Fasilitator Utama'
      };
      newMap[cls] = {
        ...existing,
        jp,
        isEnabled: jp > 0
      };
    });
    onUpdateP5Config(newMap);
    showToast(`Semua kelas diset ${jp} JP Kokurikuler/P5`, 'success');
  };

  // Calculations
  const totalP5Jp = rombelClassNames.reduce((acc, cls) => {
    const item = p5ConfigMap[cls];
    if (item && item.isEnabled !== false) {
      return acc + (item.jp || 0);
    }
    return acc;
  }, 0);

  const activeP5ClassesCount = rombelClassNames.filter(cls => {
    const item = p5ConfigMap[cls];
    return item && item.isEnabled !== false && (item.jp || 0) > 0;
  }).length;

  const totalTeachingDirect = totalIntrakurikulerJp + totalP5Jp;
  const grandTotal = totalTeachingDirect + totalTugasTambahanJp;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Pengaturan Beban Kokurikuler / P5 / P5P2RA Per Kelas</span>
            </h4>
            <p className="text-xs text-slate-400">
              Alokasi jam projek penguatan profil pelajar (P5 / P5RA) yang diekuivalenkan dalam beban mengajar linier guru.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBulkSetAll(1)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold transition-all cursor-pointer"
              title="Set semua rombel 1 JP"
            >
              Set Semua 1 JP
            </button>
            <button
              onClick={() => handleBulkSetAll(2)}
              className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all cursor-pointer"
              title="Set semua rombel 2 JP"
            >
              Set Semua 2 JP
            </button>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-bold">Rombel Projek Aktif</span>
            <p className="text-lg font-black text-white">{activeP5ClassesCount} / {rombelClassNames.length} Kelas</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-teal-950/20 border border-teal-500/30 space-y-1">
            <span className="text-xs text-teal-400 font-bold">Total Ekuivalensi P5</span>
            <p className="text-lg font-black text-teal-300">+{totalP5Jp} JP / Pekan</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-bold">Total Tatap Muka Langsung</span>
            <p className="text-lg font-black text-white">{totalTeachingDirect} JP <span className="text-xs text-slate-500 font-normal">({totalIntrakurikulerJp} Intra + {totalP5Jp} P5)</span></p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
            <span className="text-xs text-emerald-400 font-bold">Total Beban Kumulatif</span>
            <p className="text-lg font-black text-emerald-300">{grandTotal} JP / Pekan</p>
          </div>
        </div>
      </div>

      {/* Info Callout: Regulasi & Simulasi Perhitungan Kurikulum Merdeka */}
      <div className="bg-teal-950/20 border border-teal-500/30 rounded-3xl p-5 space-y-3 text-xs text-teal-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-teal-300 text-sm">
              Formula Perhitungan Beban Mengajar Linier (Kurikulum Merdeka):
            </p>
            <p className="text-teal-200/90 leading-relaxed text-[11px]">
              Sesuai Kepmendikbudristek No. 262/M/2022 & KMA Kemenag, jam kokurikuler/projek (P5 / P5RA) diakui penuh dalam pemenuhan beban kerja 24 – 40 JP guru.
            </p>
          </div>
        </div>

        {/* Contoh Kasus Formula Card */}
        <div className="bg-slate-950/70 border border-teal-500/20 rounded-2xl p-3.5 space-y-2 text-slate-300">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Contoh Kasus (misal Mapel PJOK / Penjaskes):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-mono">
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-slate-400 text-[10px] font-sans">Beban Per Kelas / Rombel</span>
              <p className="text-white font-bold">2 JP Intra + 1 JP P5 = <span className="text-teal-300 font-black">3 JP / Kelas</span></p>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-slate-400 text-[10px] font-sans">Jumlah Rombel Yang Diampu</span>
              <p className="text-white font-bold">Mengampu <span className="text-emerald-400 font-black">3 Kelas</span></p>
            </div>
            <div className="bg-teal-950/40 p-2.5 rounded-xl border border-teal-500/30 space-y-0.5">
              <span className="text-teal-300 text-[10px] font-sans">Total Beban Mengajar</span>
              <p className="text-teal-300 font-black text-xs">3 Kelas × 3 JP = 9 JP / Pekan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Class by Class Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rombelClassNames.map(cls => {
          const item = p5ConfigMap[cls] || {
            kelas: cls,
            jp: 1,
            category: 'P5',
            theme: 'Gaya Hidup Berkelanjutan',
            projectName: `Projek P5 Kelas ${cls}`,
            role: 'Fasilitator Utama',
            isEnabled: true
          };

          const isEnabled = item.isEnabled !== false && (item.jp || 0) > 0;

          return (
            <div
              key={cls}
              className={`rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                isEnabled
                  ? 'bg-slate-900 border-teal-500/30 shadow-md shadow-teal-500/5'
                  : 'bg-slate-900/60 border-slate-800 opacity-65'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border shrink-0 ${
                      isEnabled
                        ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-black text-white">Kelas {cls}</h5>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-bold">
                          {item.category || 'P5'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">{item.role || 'Fasilitator Utama'}</p>
                    </div>
                  </div>

                  {/* Stepper JP */}
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                    <button
                      onClick={() => handleQuickJpChange(cls, -1)}
                      className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs flex items-center justify-center transition-all cursor-pointer"
                      title="Kurangi 1 JP"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-mono font-black text-xs text-teal-300">
                      {item.jp || 0} JP
                    </span>
                    <button
                      onClick={() => handleQuickJpChange(cls, 1)}
                      className="w-7 h-7 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center justify-center transition-all cursor-pointer"
                      title="Tambah 1 JP"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Details Pill */}
                <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold">Tema:</span>
                    <span className="text-slate-200 font-medium truncate max-w-[200px]">{item.theme || 'Gaya Hidup Berkelanjutan'}</span>
                  </div>
                  {item.projectName && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-bold">Topik Projek:</span>
                      <span className="text-teal-300 truncate max-w-[200px]">{item.projectName}</span>
                    </div>
                  )}
                  {item.notes && (
                    <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/60">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => handleToggleEnable(cls)}
                    className="w-4 h-4 rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-950 cursor-pointer"
                  />
                  <span className={`text-xs font-bold ${isEnabled ? 'text-teal-400' : 'text-slate-500'}`}>
                    {isEnabled ? 'Aktif dalam Beban' : 'Dinonaktifkan'}
                  </span>
                </label>

                <button
                  onClick={() => onOpenEditModal(cls)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Kustomisasi Rinci</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
