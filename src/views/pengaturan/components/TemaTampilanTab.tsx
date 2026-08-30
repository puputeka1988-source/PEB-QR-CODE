import React, { useState, useMemo } from 'react';
import { 
  ThemeMode, ThemeAccent, ThemeFont, ThemeFontSize, 
  ThemeContrastMode, ThemeFontWeight 
} from '../../../types';
import { 
  THEME_PALETTES, THEME_FONTS, normalizeHex, 
  computeThemeCssVariables, getContrastTextColor 
} from '../../../utils/themeUtils';
import { 
  Palette, Eye, Sun, Moon, Laptop, Check, Sparkles, Save, 
  Type, ZoomIn, Pipette, Sliders, ShieldCheck, Award, 
  Building2, School, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';

interface TemaTampilanTabProps {
  themeModeState: ThemeMode;
  themeAccentState: ThemeAccent;
  themeCustomAccentState?: string;
  themeFontState: ThemeFont;
  themeFontSizeState: ThemeFontSize;
  themeContrastModeState?: ThemeContrastMode;
  themeFontWeightState?: ThemeFontWeight;
  selectThemeMode: (mode: ThemeMode) => void;
  selectThemeAccent: (accent: ThemeAccent) => void;
  selectThemeCustomAccent: (hex: string) => void;
  selectThemeFont: (font: ThemeFont) => void;
  selectThemeFontSize: (size: ThemeFontSize) => void;
  selectThemeContrastMode: (mode: ThemeContrastMode) => void;
  selectThemeFontWeight: (weight: ThemeFontWeight) => void;
  schoolName?: string;
  onSave: (e?: React.FormEvent) => void;
}

type PaletteCategoryFilter = 'Semua' | 'Kemenag & Madrasah' | 'Kemdikbud & Nasional' | 'Akademik & Kampus' | 'Karakter & Prestasi' | 'Modern & Netral' | 'Kustom Mandiri';

export const TemaTampilanTab: React.FC<TemaTampilanTabProps> = ({
  themeModeState,
  themeAccentState,
  themeCustomAccentState = '#10b981',
  themeFontState,
  themeFontSizeState,
  themeContrastModeState = 'normal',
  themeFontWeightState = 'normal',
  selectThemeMode,
  selectThemeAccent,
  selectThemeCustomAccent,
  selectThemeFont,
  selectThemeFontSize,
  selectThemeContrastMode,
  selectThemeFontWeight,
  schoolName = 'Sekolah / Madrasah',
  onSave
}) => {
  const [activeCategory, setActiveCategory] = useState<PaletteCategoryFilter>('Semua');
  const [customHexInput, setCustomHexInput] = useState(themeCustomAccentState || '#10b981');
  const [hexInputError, setHexInputError] = useState(false);

  // Quick school brand suggestions
  const SCHOOL_BRAND_SUGGESTIONS = [
    { name: 'Hijau Kemenag', hex: '#047857' },
    { name: 'Biru Tut Wuri', hex: '#1d4ed8' },
    { name: 'Navy SMK Teknik', hex: '#1e3a8a' },
    { name: 'Marun Al-Azhar', hex: '#831843' },
    { name: 'Toska Maritim', hex: '#0e7490' },
    { name: 'Emas Prestasi', hex: '#b45309' },
    { name: 'Coklat Pramuka', hex: '#78350f' },
    { name: 'Ungu Pesantren', hex: '#6d28d9' },
  ];

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomHexInput(val);
    const cleaned = val.trim().replace(/^#/, '');
    if (/^[0-9A-Fa-f]{6}$/.test(cleaned) || /^[0-9A-Fa-f]{3}$/.test(cleaned)) {
      setHexInputError(false);
      selectThemeCustomAccent('#' + cleaned);
    } else {
      setHexInputError(true);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomHexInput(val);
    setHexInputError(false);
    selectThemeCustomAccent(val);
  };

  const handleApplyPresetSuggestion = (hex: string) => {
    setCustomHexInput(hex);
    setHexInputError(false);
    selectThemeCustomAccent(hex);
  };

  const filteredPalettes = useMemo(() => {
    if (activeCategory === 'Semua') return THEME_PALETTES;
    if (activeCategory === 'Kustom Mandiri') return [];
    return THEME_PALETTES.filter(p => p.category === activeCategory);
  }, [activeCategory]);

  // Current active computed color info
  const activeColorInfo = useMemo(() => {
    if (themeAccentState === 'custom') {
      return {
        name: 'Warna Kustom Sekolah',
        hex: normalizeHex(customHexInput),
        contrast: getContrastTextColor(customHexInput)
      };
    }
    const found = THEME_PALETTES.find(p => p.id === themeAccentState);
    return {
      name: found ? found.name : 'Emerald Kemenag',
      hex: found ? found.primaryHex : '#10b981',
      contrast: found ? found.contrastText : '#020617'
    };
  }, [themeAccentState, customHexInput]);

  return (
    <form onSubmit={onSave} className="space-y-8 animate-in fade-in duration-200">
      
      {/* Main Container */}
      <div className="bg-slate-900/90 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-7 shadow-xl">
        
        {/* Header Title & Preview Indicator */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Identitas Visual, Palet Warna Sekolah & Tipografi
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sesuaikan warna khas institusi/sekolah dan font berkejelasan tinggi agar aplikasi tampil resmi, tajam, dan tidak buram di berbagai monitor & proyektor.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <Eye className="w-3.5 h-3.5 animate-pulse" /> Live Preview Aktif
            </span>
          </div>
        </div>

        {/* =========================================================================
            SECTION 1: PEMILIH PALET WARNA KHAS SEKOLAH (COLOR PALETTE)
            ========================================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>1. Pemilih Palet Warna Khas Sekolah / Madrasah:</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pilih palet resmi sesuai instansi pembina (Kemenag / Kemdikbud / SMK / Pesantren) atau masukkan kode HEX warna seragam sekolah Anda.
              </p>
            </div>

            {/* Active Color Tag */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
              <span className="text-[10px] text-slate-400">Warna Aktif:</span>
              <div 
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-inner"
                style={{ backgroundColor: activeColorInfo.hex }}
              />
              <span className="text-xs font-mono font-bold text-white uppercase">{activeColorInfo.hex}</span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {activeColorInfo.name}
              </span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/60 text-xs">
            {(['Semua', 'Kemenag & Madrasah', 'Kemdikbud & Nasional', 'Akademik & Kampus', 'Karakter & Prestasi', 'Modern & Netral', 'Kustom Mandiri'] as PaletteCategoryFilter[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
                  activeCategory === cat
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat === 'Kustom Mandiri' && <Pipette className="w-3.5 h-3.5" />}
                {cat === 'Kemenag & Madrasah' && <School className="w-3.5 h-3.5" />}
                {cat === 'Kemdikbud & Nasional' && <Building2 className="w-3.5 h-3.5" />}
                {cat === 'Karakter & Prestasi' && <Award className="w-3.5 h-3.5" />}
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Preset Palettes Grid */}
          {activeCategory !== 'Kustom Mandiri' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPalettes.map(palette => {
                const isSelected = themeAccentState === palette.id;
                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => selectThemeAccent(palette.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden ${
                      isSelected
                        ? `bg-slate-950 border-emerald-500 shadow-lg ring-2 ${palette.ringClass}/40`
                        : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md border border-white/20 transition-transform group-hover:scale-105"
                          style={{ backgroundColor: palette.primaryHex }}
                        >
                          {isSelected && (
                            <Check 
                              className="w-4 h-4 stroke-[3]" 
                              style={{ color: palette.contrastText }} 
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {palette.name}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {palette.primaryHex}
                          </span>
                        </div>
                      </div>

                      <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                        {palette.category.split('&')[0].trim()}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {palette.desc}
                    </p>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: palette.primaryHex }}
                        />
                        <span 
                          className="w-2.5 h-2.5 rounded-full opacity-75" 
                          style={{ backgroundColor: palette.hoverHex }}
                        />
                        <span 
                          className="w-2.5 h-2.5 rounded-full opacity-50" 
                          style={{ backgroundColor: palette.primaryHex }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">
                        {isSelected ? '✓ Terpilih' : 'Klik untuk Terapkan'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom School Hex Code Box */}
          <div className="bg-slate-950/90 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Pipette className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    Kustomisasi Kode HEX Warna Identitas Sekolah Mandiri
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Ingin menggunakan warna lambang / seragam sekolah yang spesifik? Masukkan kode HEX atau klik kotak warna.
                  </p>
                </div>
              </div>

              {themeAccentState === 'custom' && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 self-start sm:self-auto">
                  <CheckCircle2 className="w-3 h-3" /> Warna Kustom Digunakan
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Color Picker Control */}
              <div className="md:col-span-6 flex items-center gap-3">
                <div className="relative group">
                  <input
                    type="color"
                    id="schoolColorPicker"
                    value={normalizeHex(customHexInput)}
                    onChange={handleColorPickerChange}
                    className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-2 border-slate-700 group-hover:border-emerald-500 p-1 transition-all"
                  />
                </div>

                <div className="flex-1 relative">
                  <label htmlFor="customHexCodeInput" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Kode Warna HEX (#RRGGBB):
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        id="customHexCodeInput"
                        value={customHexInput}
                        onChange={handleHexChange}
                        placeholder="#10b981"
                        maxLength={7}
                        className={`w-full bg-slate-900 border px-3 py-2 rounded-xl text-xs font-mono font-bold text-white focus:outline-none transition-all uppercase ${
                          hexInputError 
                            ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' 
                            : 'border-slate-700 focus:border-emerald-500'
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => selectThemeCustomAccent(customHexInput)}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Terapkan
                    </button>
                  </div>
                  {hexInputError && (
                    <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Format HEX tidak valid. Contoh: #10b981
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Brand Color Chips */}
              <div className="md:col-span-6 space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Rekomendasi Cepat Warna Sekolah Populer:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SCHOOL_BRAND_SUGGESTIONS.map(sug => (
                    <button
                      key={sug.hex}
                      type="button"
                      onClick={() => handleApplyPresetSuggestion(sug.hex)}
                      className="text-[10px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sug.hex }} />
                      <span>{sug.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 2: TIPOGRAFI, FONT ANTI-BURAM & KEJELASAN VISUAL
            ========================================================================= */}
        <div className="space-y-4 pt-3 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Type className="w-4 h-4 text-emerald-400" />
                <span>2. Pilihan Jenis Huruf (Font) & Pengatur Anti-Buram:</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Font berkejelasan tinggi (high legibility) mencegah keburaman teks saat ditampilkan di layar proyektor atau monitor resolusi rendah.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 self-start sm:self-auto">
              Font Terpilih: <strong className="text-white">{THEME_FONTS.find(f => f.id === themeFontState)?.name || 'Plus Jakarta Sans'}</strong>
            </span>
          </div>

          {/* Font Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {THEME_FONTS.map(font => {
              const isSelected = themeFontState === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => selectThemeFont(font.id)}
                  style={{ fontFamily: font.fontFamily }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 relative group ${
                    isSelected
                      ? 'bg-slate-950 border-emerald-500 shadow-lg ring-2 ring-emerald-500/20'
                      : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                      font.isHighClarity
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        : 'text-slate-400 bg-slate-900 border-slate-800'
                    }`}>
                      {font.badge}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white tracking-tight">{font.name}</p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {font.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <p className="text-xs font-semibold text-slate-200">
                      {font.sample}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      0123456789 • Hadir • 100%
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Contrast Mode & Weight Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            
            {/* High Contrast Anti-Blur Switch */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Mode Kontras Tinggi (Anti-Buram)</p>
                  <p className="text-[10px] text-slate-400">Mempertegas render tepi huruf di layar proyektor / monitor redup.</p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => selectThemeContrastMode('normal')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    themeContrastModeState === 'normal'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Standar
                </button>
                <button
                  type="button"
                  onClick={() => selectThemeContrastMode('high')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    themeContrastModeState === 'high'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tajam (Anti-Buram)
                </button>
              </div>
            </div>

            {/* Font Weight Adjuster */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Ketebalan Huruf (Font Weight)</p>
                  <p className="text-[10px] text-slate-400">Atur bobot teks agar lebih mudah dibaca dari jarak jauh.</p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['normal', 'medium', 'bold'] as ThemeFontWeight[]).map(weight => (
                  <button
                    key={weight}
                    type="button"
                    onClick={() => selectThemeFontWeight(weight)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                      themeFontWeightState === weight
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {weight === 'normal' ? 'Normal' : weight === 'medium' ? 'Sedang' : 'Tebal'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 3: MODE TAMPILAN (DARK, LIGHT, SISTEM) & SKALA UKURAN TEKS
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-3 border-t border-slate-800/80">
          
          {/* Mode Gelap / Terang */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-200">
              3. Mode Gelap & Terang (Dark / Light / Sistem):
            </label>
            
            <div className="grid grid-cols-3 gap-2.5">
              {/* Dark */}
              <button
                type="button"
                onClick={() => selectThemeMode('dark')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  themeModeState === 'dark'
                    ? 'bg-slate-950 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                    <Moon className="w-4 h-4" />
                  </div>
                  {themeModeState === 'dark' && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Mode Gelap</p>
                  <p className="text-[10px] text-slate-400">Kontras tinggi & nyaman di mata.</p>
                </div>
              </button>

              {/* Light */}
              <button
                type="button"
                onClick={() => selectThemeMode('light')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  themeModeState === 'light'
                    ? 'bg-slate-950 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Sun className="w-4 h-4" />
                  </div>
                  {themeModeState === 'light' && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Mode Terang</p>
                  <p className="text-[10px] text-slate-400">Putih bersih untuk ruangan terang.</p>
                </div>
              </button>

              {/* System */}
              <button
                type="button"
                onClick={() => selectThemeMode('system')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  themeModeState === 'system'
                    ? 'bg-slate-950 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Laptop className="w-4 h-4" />
                  </div>
                  {themeModeState === 'system' && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Otomatis</p>
                  <p className="text-[10px] text-slate-400">Ikuti setelan OS laptop / HP.</p>
                </div>
              </button>
            </div>
          </div>

          {/* Skala Ukuran Teks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ZoomIn className="w-4 h-4 text-emerald-400" />
                <span>4. Skala Ukuran Teks (Font Scale):</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {themeFontSizeState === 'compact' ? '14.5px' : themeFontSizeState === 'normal' ? '16px' : themeFontSizeState === 'comfortable' ? '17.5px' : '19px'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'compact', name: 'Kompak', sizeLabel: '14.5px', desc: 'Muat banyak data' },
                { id: 'normal', name: 'Standar', sizeLabel: '16.0px', desc: 'Ideal seimbang' },
                { id: 'comfortable', name: 'Nyaman', sizeLabel: '17.5px', desc: 'Lebih besar' },
                { id: 'spacious', name: 'Besar (TV)', sizeLabel: '19.0px', desc: 'Khusus proyektor' },
              ].map(size => {
                const isSelected = themeFontSizeState === size.id;
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => selectThemeFontSize(size.id as ThemeFontSize)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-slate-950 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{size.name}</span>
                      {isSelected && (
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-2 h-2 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-slate-400">{size.sizeLabel}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 4: PRATINJAU INTERAKTIF KOMPONEN IDENTITAS SEKOLAH
            ========================================================================= */}
        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <p className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Pratinjau Nyata Elemen Visual Aplikasi ({schoolName}):</span>
            </p>
            <span className="text-[10px] font-mono text-slate-400">
              Font: <strong className="text-slate-200">{THEME_FONTS.find(f => f.id === themeFontState)?.name}</strong> • Warna: <strong className="text-emerald-400 uppercase">{activeColorInfo.hex}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            
            {/* Card 1: Tombol & Aksi Utama */}
            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Aksi & Tombol Utama:</p>
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Simpan Presensi Siswa
                </button>
                <button
                  type="button"
                  className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" /> Lihat Rekap Kelas
                </button>
              </div>
            </div>

            {/* Card 2: Status & Badge Identitas */}
            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status & Badge Nilai:</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[11px] font-bold flex items-center gap-1 shadow-sm">
                  <Check className="w-3 h-3 stroke-[3]" /> Hadir (Tepat Waktu)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold">
                  Akreditasi A Unggul
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-mono">
                  Kelas 7-A (32 Siswa)
                </span>
              </div>
            </div>

            {/* Card 3: Kartu Data Siswa & Keterbacaan */}
            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Keterbacaan Huruf & NISN:</p>
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Ahmad Fauzi Ridwan</p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-400">NISN: <strong className="text-emerald-400">0082736192</strong></span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    100% Tajam
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Pengaturan tema langsung tersinkronisasi dan tersimpan ke profil sekolah.</span>
        </p>

        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-7 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Preferensi Tema & Tipografi</span>
        </button>
      </div>

    </form>
  );
};
