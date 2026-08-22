import React from 'react';
import { ThemeMode, ThemeAccent, ThemeFont, ThemeFontSize } from '../../../types';
import { Palette, Eye, Sun, Moon, Laptop, Check, Sparkles, Save, Type, ZoomIn } from 'lucide-react';

interface TemaTampilanTabProps {
  themeModeState: ThemeMode;
  themeAccentState: ThemeAccent;
  themeFontState: ThemeFont;
  themeFontSizeState: ThemeFontSize;
  selectThemeMode: (mode: ThemeMode) => void;
  selectThemeAccent: (accent: ThemeAccent) => void;
  selectThemeFont: (font: ThemeFont) => void;
  selectThemeFontSize: (size: ThemeFontSize) => void;
  onSave: (e?: React.FormEvent) => void;
}

export const TemaTampilanTab: React.FC<TemaTampilanTabProps> = ({
  themeModeState,
  themeAccentState,
  themeFontState,
  themeFontSizeState,
  selectThemeMode,
  selectThemeAccent,
  selectThemeFont,
  selectThemeFontSize,
  onSave
}) => {
  return (
    <form onSubmit={onSave} className="space-y-6 animate-in fade-in duration-150">
      
      {/* Section: Tema & Personalisasi Tampilan Aplikasi */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              Tema, Tipografi Font & Personalisasi Tampilan Aplikasi
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Sesuaikan mode gelap/terang, warna aksen, jenis huruf (font) dan ukuran teks agar visualisasi nyaman dilihat dan mudah dibaca di seluruh layar.
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full self-start sm:self-auto flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Pratinjau Langsung Aktif
          </span>
        </div>

        {/* Sub-section 1: Mode Tampilan (Dark, Light, System) */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            1. Mode Tampilan (Dark / Light / Sistem):
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Dark Mode */}
            <button
              type="button"
              onClick={() => selectThemeMode('dark')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                themeModeState === 'dark'
                  ? 'bg-slate-950 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                  <Moon className="w-5 h-5" />
                </div>
                {themeModeState === 'dark' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-white">Mode Gelap (Dark)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Latar slate gelap dengan kontras tinggi, nyaman untuk mata.</p>
              </div>
            </button>

            {/* Light Mode */}
            <button
              type="button"
              onClick={() => selectThemeMode('light')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                themeModeState === 'light'
                  ? 'bg-slate-950 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sun className="w-5 h-5" />
                </div>
                {themeModeState === 'light' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-white">Mode Terang (Light)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Latar putih bersih dengan kontras tajam untuk ruangan terang.</p>
              </div>
            </button>

            {/* System Mode */}
            <button
              type="button"
              onClick={() => selectThemeMode('system')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                themeModeState === 'system'
                  ? 'bg-slate-950 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Laptop className="w-5 h-5" />
                </div>
                {themeModeState === 'system' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-white">Otomatis (Sistem)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Menyesuaikan pengaturan tema di perangkat laptop / smartphone.</p>
              </div>
            </button>
          </div>
        </div>

        {/* Sub-section 2: Pilihan Font (Tipografi Visual) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Jenis Huruf / Font Utama (Tipografi):</span>
            </label>
            <span className="text-[10px] text-slate-400">Pilih font yang paling jelas & nyaman dibaca</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {
                id: 'plus-jakarta',
                name: 'Plus Jakarta Sans',
                category: 'Modern UI (Default)',
                desc: 'Huruf tajam, proporsional, & elegan.',
                sample: 'Presensi Siswa 2026',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              },
              {
                id: 'inter',
                name: 'Inter',
                category: 'Standard Tech',
                desc: 'Standar aplikasi internasional.',
                sample: 'Presensi Siswa 2026',
                fontFamily: "'Inter', sans-serif"
              },
              {
                id: 'poppins',
                name: 'Poppins',
                category: 'Geometric Clean',
                desc: 'Karakter membulat ramah & tegas.',
                sample: 'Presensi Siswa 2026',
                fontFamily: "'Poppins', sans-serif"
              },
              {
                id: 'outfit',
                name: 'Outfit',
                category: 'Contemporary UI',
                desc: 'Modern, minimalis, dan sangat terbaca.',
                sample: 'Presensi Siswa 2026',
                fontFamily: "'Outfit', sans-serif"
              },
              {
                id: 'system',
                name: 'System Default',
                category: 'Native OS',
                desc: 'Font bawaan Windows / macOS / Android.',
                sample: 'Presensi Siswa 2026',
                fontFamily: 'system-ui, sans-serif'
              }
            ].map(font => {
              const isSelected = themeFontState === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => selectThemeFont(font.id as ThemeFont)}
                  style={{ fontFamily: font.fontFamily }}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-slate-950 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {font.category}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white tracking-wide">{font.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{font.desc}</p>
                  </div>
                  <div className="pt-1.5 border-t border-slate-800/80">
                    <p className="text-xs font-semibold text-slate-200">{font.sample}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-section 3: Skala Ukuran Teks (Font Scaling) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>3. Skala Ukuran Teks (Font Size Scale):</span>
            </label>
            <span className="text-[10px] text-slate-400">Atur densitas informasi pada layar</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'compact',
                name: 'Kompak (Compact)',
                sizeLabel: '14.5px',
                desc: 'Memuat lebih banyak data siswa & tabel dalam satu tampilan layar.'
              },
              {
                id: 'normal',
                name: 'Standar (Normal)',
                sizeLabel: '16.0px',
                desc: 'Keseimbangan ideal antara densitas informasi dan kemudahan membaca.'
              },
              {
                id: 'comfortable',
                name: 'Nyaman (Comfortable)',
                sizeLabel: '17.5px',
                desc: 'Teks lebih besar dan sangat jelas dibaca dari jarak jauh atau proyektor.'
              }
            ].map(size => {
              const isSelected = themeFontSizeState === size.id;
              return (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => selectThemeFontSize(size.id as ThemeFontSize)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-slate-950 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{size.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {size.sizeLabel}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">{size.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-section 4: Pilihan Warna Aksen Utama */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-semibold text-slate-300">
            4. Warna Aksen Utama Aplikasi:
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2.5">
            {[
              { id: 'emerald', name: 'Emerald Hijau', hex: '#10b981', ring: 'ring-emerald-500' },
              { id: 'blue', name: 'Royal Blue', hex: '#3b82f6', ring: 'ring-blue-500' },
              { id: 'indigo', name: 'Indigo Ungu', hex: '#6366f1', ring: 'ring-indigo-500' },
              { id: 'violet', name: 'Violet Ungu', hex: '#8b5cf6', ring: 'ring-violet-500' },
              { id: 'teal', name: 'Teal Laut', hex: '#14b8a6', ring: 'ring-teal-500' },
              { id: 'amber', name: 'Amber Emas', hex: '#f59e0b', ring: 'ring-amber-500' },
              { id: 'rose', name: 'Rose Merah', hex: '#f43f5e', ring: 'ring-rose-500' }
            ].map(color => (
              <button
                key={color.id}
                type="button"
                onClick={() => selectThemeAccent(color.id as ThemeAccent)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                  themeAccentState === color.id
                    ? `bg-slate-950 border-white/40 ring-2 ${color.ring} shadow-md`
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center shadow-inner relative"
                  style={{ backgroundColor: color.hex }}
                >
                  {themeAccentState === color.id && (
                    <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                  )}
                </div>
                <span className="text-[11px] font-bold text-white">{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sub-section 5: Pratinjau Komponen Langsung */}
        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pratinjau Elemen Tampilan & Keterbacaan Font:</span>
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" /> Tombol Utama (Primary Button)
            </button>

            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <Check className="w-3 h-3" /> Hadir Tepat Waktu (Badge Aksen)
            </span>

            <div className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-slate-200">
              NISN: <span className="text-emerald-400 font-bold font-mono">0082736192</span>
            </div>

            <div className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-300">
              Keterbacaan Huruf: <span className="text-white font-bold">100% Tajam & Jelas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Preferensi Tema & Tipografi</span>
        </button>
      </div>

    </form>
  );
};
