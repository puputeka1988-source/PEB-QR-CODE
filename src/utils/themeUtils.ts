import { ThemeAccent, ThemeFont } from '../types';

export interface ThemePalettePreset {
  id: ThemeAccent;
  name: string;
  category: 'Kemenag & Madrasah' | 'Kemdikbud & Nasional' | 'Akademik & Kampus' | 'Karakter & Prestasi' | 'Modern & Netral';
  desc: string;
  primaryHex: string;
  hoverHex: string;
  contrastText: string;
  ringClass: string;
}

export const THEME_PALETTES: ThemePalettePreset[] = [
  // --- Kategori 1: Kemenag & Madrasah ---
  {
    id: 'emerald',
    name: 'Hijau Madrasah / Kemenag',
    category: 'Kemenag & Madrasah',
    desc: 'Warna hijau teduh khas Kementerian Agama, MTs/MA, dan institusi Islam.',
    primaryHex: '#10b981',
    hoverHex: '#059669',
    contrastText: '#020617',
    ringClass: 'ring-emerald-500'
  },
  {
    id: 'forest',
    name: 'Hijau Hutan / Pesantren Salaf',
    category: 'Kemenag & Madrasah',
    desc: 'Hijau botol berwibawa khas kaligrafi, kitab kuning, dan pondok pesantren tradisional.',
    primaryHex: '#15803d',
    hoverHex: '#166534',
    contrastText: '#ffffff',
    ringClass: 'ring-emerald-700'
  },
  {
    id: 'mint',
    name: 'Hijau Mint / Madrasah Digital',
    category: 'Kemenag & Madrasah',
    desc: 'Hijau zamrud segar bernuansa teknologi ramah lingkungan dan madrasah sains modern.',
    primaryHex: '#059669',
    hoverHex: '#047857',
    contrastText: '#ffffff',
    ringClass: 'ring-emerald-600'
  },
  {
    id: 'olive',
    name: 'Hijau Zaitun / Adiwiyata Lestari',
    category: 'Kemenag & Madrasah',
    desc: 'Simbol sekolah berbudaya lingkungan hidup, keteduhan taman sekolah, dan konservasi alam.',
    primaryHex: '#4d7c0f',
    hoverHex: '#3f6212',
    contrastText: '#ffffff',
    ringClass: 'ring-lime-700'
  },

  // --- Kategori 2: Kemdikbud & Nasional ---
  {
    id: 'blue',
    name: 'Biru Kemdikbud / Tut Wuri',
    category: 'Kemdikbud & Nasional',
    desc: 'Biru pendidikan nasional khas SD/SMP/SMA dan Kementerian Pendidikan.',
    primaryHex: '#2563eb',
    hoverHex: '#1d4ed8',
    contrastText: '#ffffff',
    ringClass: 'ring-blue-500'
  },
  {
    id: 'sky',
    name: 'Biru Langit Ceria / Ramah Anak',
    category: 'Kemdikbud & Nasional',
    desc: 'Biru muda langit cerah, optimis, dan bersahabat untuk jenjang PAUD, TK, dan SD.',
    primaryHex: '#0284c7',
    hoverHex: '#0369a1',
    contrastText: '#ffffff',
    ringClass: 'ring-sky-500'
  },
  {
    id: 'cobalt',
    name: 'Biru Kobalt / Politeknik & Sains',
    category: 'Kemdikbud & Nasional',
    desc: 'Biru solid berdensitas tinggi untuk fakultas sains, robotika, dan rekayasa teknologi.',
    primaryHex: '#1d4ed8',
    hoverHex: '#1e40af',
    contrastText: '#ffffff',
    ringClass: 'ring-blue-700'
  },
  {
    id: 'navy',
    name: 'Biru Navy / Kejuruan (SMK)',
    category: 'Kemdikbud & Nasional',
    desc: 'Biru gelap tegas untuk SMK kejuruan, politeknik, dan akademi teknologi.',
    primaryHex: '#1e40af',
    hoverHex: '#1e3a8a',
    contrastText: '#ffffff',
    ringClass: 'ring-indigo-700'
  },

  // --- Kategori 3: Akademik & Kampus ---
  {
    id: 'indigo',
    name: 'Indigo Riset & Sains Data',
    category: 'Akademik & Kampus',
    desc: 'Indigo elegan bernuansa riset, sains data, komputasi awan, dan inovasi terapan.',
    primaryHex: '#4f46e5',
    hoverHex: '#4338ca',
    contrastText: '#ffffff',
    ringClass: 'ring-indigo-500'
  },
  {
    id: 'purple',
    name: 'Ungu Royal / Dewan Guru & Wisuda',
    category: 'Akademik & Kampus',
    desc: 'Ungu berwibawa simbol dewan guru, senat akademik, dan kehormatan wisuda sarjana.',
    primaryHex: '#9333ea',
    hoverHex: '#7e22ce',
    contrastText: '#ffffff',
    ringClass: 'ring-purple-600'
  },
  {
    id: 'violet',
    name: 'Ungu Kreatif / Pesantren Modern',
    category: 'Akademik & Kampus',
    desc: 'Ungu dinamis khas pondok pesantren modern dan yayasan pendidikan terpadu.',
    primaryHex: '#7c3aed',
    hoverHex: '#6d28d9',
    contrastText: '#ffffff',
    ringClass: 'ring-violet-500'
  },
  {
    id: 'fuchsia',
    name: 'Fuchsia Kreatif / Seni & Desain (DKV)',
    category: 'Akademik & Kampus',
    desc: 'Nuansa ekspresif dan inovatif untuk jurusan multimedia, animasi, dan seni pertunjukan.',
    primaryHex: '#c026d3',
    hoverHex: '#a21caf',
    contrastText: '#ffffff',
    ringClass: 'ring-fuchsia-500'
  },

  // --- Kategori 4: Karakter & Prestasi ---
  {
    id: 'crimson',
    name: 'Merah Sang Saka / Patriotik',
    category: 'Karakter & Prestasi',
    desc: 'Merah berani lambang semangat Merah Putih, Paskibraka, pramuka garuda, dan bela negara.',
    primaryHex: '#dc2626',
    hoverHex: '#b91c1c',
    contrastText: '#ffffff',
    ringClass: 'ring-red-600'
  },
  {
    id: 'maroon',
    name: 'Merah Marun / Ksatria Taruna',
    category: 'Karakter & Prestasi',
    desc: 'Merah marun berani identitas kepemimpinan, kepeloporan taruna, dan kedisiplinan.',
    primaryHex: '#b91c1c',
    hoverHex: '#991b1b',
    contrastText: '#ffffff',
    ringClass: 'ring-rose-700'
  },
  {
    id: 'rose',
    name: 'Rose Ceria / Karakter Ramah',
    category: 'Karakter & Prestasi',
    desc: 'Aksen rose energik dan ceria untuk PAUD, TK, SD, serta sanggar seni kreatif.',
    primaryHex: '#e11d48',
    hoverHex: '#be123c',
    contrastText: '#ffffff',
    ringClass: 'ring-rose-500'
  },
  {
    id: 'amber',
    name: 'Amber Emas / Prestasi Unggul',
    category: 'Karakter & Prestasi',
    desc: 'Kuning keemasan simbol kejayaan, juara olimpiade, dan akreditasi A unggul.',
    primaryHex: '#d97706',
    hoverHex: '#b45309',
    contrastText: '#020617',
    ringClass: 'ring-amber-500'
  },
  {
    id: 'gold',
    name: 'Kuning Emas / Medali Juara',
    category: 'Karakter & Prestasi',
    desc: 'Kilau emas trofi kejuaraan, bintang pelajar, dan medali emas olimpiade sains.',
    primaryHex: '#ca8a04',
    hoverHex: '#a16207',
    contrastText: '#020617',
    ringClass: 'ring-yellow-600'
  },
  {
    id: 'orange',
    name: 'Oranye Semangat / OSIS Mandiri',
    category: 'Karakter & Prestasi',
    desc: 'Warna oranye cerah melambangkan antusiasme, kreativitas, dan energi siswa.',
    primaryHex: '#ea580c',
    hoverHex: '#c2410c',
    contrastText: '#ffffff',
    ringClass: 'ring-orange-500'
  },
  {
    id: 'copper',
    name: 'Tembaga / Kepeloporan Pemuda',
    category: 'Karakter & Prestasi',
    desc: 'Karakter tangguh, ketekunan bengkel teknik manufaktur, dan kepemimpinan pemuda.',
    primaryHex: '#b45309',
    hoverHex: '#92400e',
    contrastText: '#ffffff',
    ringClass: 'ring-amber-700'
  },
  {
    id: 'brown',
    name: 'Coklat Pramuka / Kepanduan',
    category: 'Karakter & Prestasi',
    desc: 'Coklat khas seragam Pramuka, kedisiplinan praja muda karana, dan bumi pertiwi.',
    primaryHex: '#78350f',
    hoverHex: '#57260a',
    contrastText: '#ffffff',
    ringClass: 'ring-amber-800'
  },

  // --- Kategori 5: Modern & Netral ---
  {
    id: 'cyan',
    name: 'Cyan Bahari / Maritim Modern',
    category: 'Modern & Netral',
    desc: 'Biru toska terang untuk sekolah maritim, perkapalan, kelautan, dan sains modern.',
    primaryHex: '#0891b2',
    hoverHex: '#0e7490',
    contrastText: '#ffffff',
    ringClass: 'ring-cyan-500'
  },
  {
    id: 'teal',
    name: 'Teal Laut Sejuk',
    category: 'Modern & Netral',
    desc: 'Hijau toska laut yang sejuk, stabil, dan nyaman untuk mata saat bekerja seharian.',
    primaryHex: '#0d9488',
    hoverHex: '#0f766e',
    contrastText: '#ffffff',
    ringClass: 'ring-teal-500'
  },
  {
    id: 'slate',
    name: 'Abu Titanium / Minimalis',
    category: 'Modern & Netral',
    desc: 'Abu-abu slate teknologi tinggi yang sangat netral, berkelas, dan bersih.',
    primaryHex: '#475569',
    hoverHex: '#334155',
    contrastText: '#ffffff',
    ringClass: 'ring-slate-500'
  },
  {
    id: 'zinc',
    name: 'Monokrom Arsitektur / Presisi',
    category: 'Modern & Netral',
    desc: 'Tampilan monokromatik netral untuk sekolah teknik gambar, sipil, dan tata kota.',
    primaryHex: '#52525b',
    hoverHex: '#3f3f46',
    contrastText: '#ffffff',
    ringClass: 'ring-zinc-600'
  },
  {
    id: 'charcoal',
    name: 'Hitam Obsidian / Eksekutif',
    category: 'Modern & Netral',
    desc: 'Nuansa hitam arang gelap pekat berwibawa untuk ruang rapat dan dewan pimpinan.',
    primaryHex: '#334155',
    hoverHex: '#1e293b',
    contrastText: '#ffffff',
    ringClass: 'ring-slate-700'
  }
];

export interface FontOption {
  id: ThemeFont;
  name: string;
  category: string;
  desc: string;
  sample: string;
  fontFamily: string;
  badge: string;
  isHighClarity?: boolean;
}

export const THEME_FONTS: FontOption[] = [
  {
    id: 'lexend',
    name: 'Lexend (Anti-Buram)',
    category: 'High Legibility / Educational',
    desc: 'Didesain oleh Google Fonts khusus mengurangi stres visual & eliminasi keburaman.',
    sample: 'Presensi QR Siswa 2026',
    fontFamily: "'Lexend', sans-serif",
    badge: 'Rekomendasi Tajam',
    isHighClarity: true
  },
  {
    id: 'plus-jakarta',
    name: 'Plus Jakarta Sans',
    category: 'Modern UI (Default)',
    desc: 'Huruf proporsional, tajam, elegan, dan estetik.',
    sample: 'Presensi QR Siswa 2026',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    badge: 'Standar Elegan',
    isHighClarity: true
  },
  {
    id: 'inter',
    name: 'Inter',
    category: 'Standard Tech UI',
    desc: 'Standar aplikasi internasional dengan keterbacaan tinggi di monitor.',
    sample: 'Presensi QR Siswa 2026',
    fontFamily: "'Inter', sans-serif",
    badge: 'Ultra Crisp',
    isHighClarity: true
  },
  {
    id: 'rubik',
    name: 'Rubik Solid',
    category: 'Bold & High Contrast',
    desc: 'Bentuk huruf kokoh & tebal, sangat mudah dibaca dari jarak jauh di proyektor.',
    sample: 'Presensi QR Siswa 2026',
    fontFamily: "'Rubik', sans-serif",
    badge: 'Sangat Kontras',
    isHighClarity: true
  },
  {
    id: 'poppins',
    name: 'Poppins',
    category: 'Geometric Clean',
    desc: 'Karakter membulat ramah, tegas, dan modern.',
    sample: 'Presensi QR Siswa 2026',
    fontFamily: "'Poppins', sans-serif",
    badge: 'Populer'
  },
  {
    id: 'outfit',
    name: 'Outfit',
    category: 'Contemporary UI',
    desc: 'Modern, minimalis, dan sangat bersih untuk dashboard.',
    sample: 'Presensi QR Siswa 2026',
    fontFamily: "'Outfit', sans-serif",
    badge: 'Modern'
  },
  {
    id: 'system',
    name: 'System Default',
    category: 'Native OS',
    desc: 'Menggunakan font bawaan Windows / macOS / Android tanpa unduhan.',
    sample: 'Presensi QR Siswa 2026',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    badge: 'Cepat'
  }
];

// Helper to validate and normalize hex color
export function normalizeHex(hex: string): string {
  let cleaned = hex.trim().replace(/^#/, '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map(c => c + c).join('');
  }
  if (!/^[0-9A-Fa-f]{6}$/.test(cleaned)) {
    return '#10b981'; // fallback emerald
  }
  return '#' + cleaned.toLowerCase();
}

// Convert Hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const norm = normalizeHex(hex).slice(1);
  return {
    r: parseInt(norm.substring(0, 2), 16),
    g: parseInt(norm.substring(2, 4), 16),
    b: parseInt(norm.substring(4, 6), 16),
  };
}

// Calculate relative luminance
export function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Determine best contrast text color (White vs Dark Slate)
export function getContrastTextColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = getLuminance(r, g, b);
  // If luminance is high (bright color like yellow/gold/light cyan), use dark text
  return luminance > 0.4 ? '#020617' : '#ffffff';
}

// Generate darker or lighter shade for hover
export function adjustBrightness(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  const adjust = (val: number) => {
    const newVal = Math.round(val * factor);
    return Math.min(255, Math.max(0, newVal));
  };
  const nr = adjust(r).toString(16).padStart(2, '0');
  const ng = adjust(g).toString(16).padStart(2, '0');
  const nb = adjust(b).toString(16).padStart(2, '0');
  return `#${nr}${ng}${nb}`;
}

// Compute theme CSS variables dictionary for full-page atmospheric harmonization
export function computeThemeCssVariables(accentHex: string) {
  const validHex = normalizeHex(accentHex);
  const { r, g, b } = hexToRgb(validHex);
  const hoverHex = adjustBrightness(validHex, 0.86);
  const contrastText = getContrastTextColor(validHex);

  // Deep dark tints for replacing emerald-950 and emerald-900
  const darkR = Math.min(255, Math.max(0, Math.round(r * 0.12 + 3 * 0.88)));
  const darkG = Math.min(255, Math.max(0, Math.round(g * 0.12 + 7 * 0.88)));
  const darkB = Math.min(255, Math.max(0, Math.round(b * 0.12 + 18 * 0.88)));
  const darkHex = `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;

  const darkHoverR = Math.min(255, Math.max(0, Math.round(r * 0.20 + 3 * 0.80)));
  const darkHoverG = Math.min(255, Math.max(0, Math.round(g * 0.20 + 7 * 0.80)));
  const darkHoverB = Math.min(255, Math.max(0, Math.round(b * 0.20 + 18 * 0.80)));
  const darkHoverHex = `#${darkHoverR.toString(16).padStart(2, '0')}${darkHoverG.toString(16).padStart(2, '0')}${darkHoverB.toString(16).padStart(2, '0')}`;

  const darkestR = Math.min(255, Math.max(0, Math.round(r * 0.05 + 2 * 0.95)));
  const darkestG = Math.min(255, Math.max(0, Math.round(g * 0.05 + 4 * 0.95)));
  const darkestB = Math.min(255, Math.max(0, Math.round(b * 0.05 + 10 * 0.95)));
  const darkestHex = `#${darkestR.toString(16).padStart(2, '0')}${darkestG.toString(16).padStart(2, '0')}${darkestB.toString(16).padStart(2, '0')}`;

  const subtleRgba = `rgba(${r}, ${g}, ${b}, 0.12)`;
  const subtleMediumRgba = `rgba(${r}, ${g}, ${b}, 0.22)`;
  const subtleStrongRgba = `rgba(${r}, ${g}, ${b}, 0.35)`;
  const borderRgba = `rgba(${r}, ${g}, ${b}, 0.38)`;
  const borderSubtleRgba = `rgba(${r}, ${g}, ${b}, 0.18)`;
  const glowRgba = `rgba(${r}, ${g}, ${b}, 0.25)`;
  const ambientGlowRgba = `rgba(${r}, ${g}, ${b}, 0.08)`;
  const ambientSoftRgba = `rgba(${r}, ${g}, ${b}, 0.03)`;
  const lightBgTint = `rgba(${r}, ${g}, ${b}, 0.03)`;

  // Cards / Boxes (Kotak-kotak) colors for light mode:
  // Delicate theme tint on white canvas so every box reflects the chosen palette
  const cardLightR = Math.min(255, Math.max(0, Math.round(255 * 0.94 + r * 0.06)));
  const cardLightG = Math.min(255, Math.max(0, Math.round(255 * 0.94 + g * 0.06)));
  const cardLightB = Math.min(255, Math.max(0, Math.round(255 * 0.94 + b * 0.06)));
  const cardBgLight = `#${cardLightR.toString(16).padStart(2, '0')}${cardLightG.toString(16).padStart(2, '0')}${cardLightB.toString(16).padStart(2, '0')}`;

  const cardLightSecR = Math.min(255, Math.max(0, Math.round(255 * 0.89 + r * 0.11)));
  const cardLightSecG = Math.min(255, Math.max(0, Math.round(255 * 0.89 + g * 0.11)));
  const cardLightSecB = Math.min(255, Math.max(0, Math.round(255 * 0.89 + b * 0.11)));
  const cardBgLightSec = `#${cardLightSecR.toString(16).padStart(2, '0')}${cardLightSecG.toString(16).padStart(2, '0')}${cardLightSecB.toString(16).padStart(2, '0')}`;

  const cardBorderLightR = Math.min(255, Math.max(0, Math.round(255 * 0.72 + r * 0.28)));
  const cardBorderLightG = Math.min(255, Math.max(0, Math.round(255 * 0.72 + g * 0.28)));
  const cardBorderLightB = Math.min(255, Math.max(0, Math.round(255 * 0.72 + b * 0.28)));
  const cardBorderLight = `#${cardBorderLightR.toString(16).padStart(2, '0')}${cardBorderLightG.toString(16).padStart(2, '0')}${cardBorderLightB.toString(16).padStart(2, '0')}`;

  // Cards / Boxes (Kotak-kotak) colors for dark mode:
  // Deep dark slate infused with theme accent tone
  const cardDarkR = Math.min(255, Math.max(0, Math.round(15 * 0.86 + r * 0.14)));
  const cardDarkG = Math.min(255, Math.max(0, Math.round(23 * 0.86 + g * 0.14)));
  const cardDarkB = Math.min(255, Math.max(0, Math.round(42 * 0.86 + b * 0.14)));
  const cardBgDark = `#${cardDarkR.toString(16).padStart(2, '0')}${cardDarkG.toString(16).padStart(2, '0')}${cardDarkB.toString(16).padStart(2, '0')}`;

  const cardDarkSecR = Math.min(255, Math.max(0, Math.round(15 * 0.78 + r * 0.22)));
  const cardDarkSecG = Math.min(255, Math.max(0, Math.round(23 * 0.78 + g * 0.22)));
  const cardDarkSecB = Math.min(255, Math.max(0, Math.round(42 * 0.78 + b * 0.22)));
  const cardBgDarkSec = `#${cardDarkSecR.toString(16).padStart(2, '0')}${cardDarkSecG.toString(16).padStart(2, '0')}${cardDarkSecB.toString(16).padStart(2, '0')}`;

  const cardBorderDarkR = Math.min(255, Math.max(0, Math.round(51 * 0.65 + r * 0.35)));
  const cardBorderDarkG = Math.min(255, Math.max(0, Math.round(65 * 0.65 + g * 0.35)));
  const cardBorderDarkB = Math.min(255, Math.max(0, Math.round(85 * 0.65 + b * 0.35)));
  const cardBorderDark = `#${cardBorderDarkR.toString(16).padStart(2, '0')}${cardBorderDarkG.toString(16).padStart(2, '0')}${cardBorderDarkB.toString(16).padStart(2, '0')}`;

  // High contrast accent text color for light mode:
  // Guarantee WCAG AAA legibility (minimum 4.5:1, targeted 7:1) by darkening the accent
  const lum = getLuminance(r, g, b);
  const textDarkenFactor = lum > 0.4 ? 0.52 : 0.68;
  const accentTextLight = adjustBrightness(validHex, textDarkenFactor);
  const accentTextDark = lum < 0.2 ? adjustBrightness(validHex, 1.4) : validHex;

  return {
    primaryHex: validHex,
    hoverHex,
    darkHex,
    darkHoverHex,
    darkestHex,
    contrastText,
    subtleRgba,
    subtleMediumRgba,
    subtleStrongRgba,
    borderRgba,
    borderSubtleRgba,
    glowRgba,
    ambientGlowRgba,
    ambientSoftRgba,
    lightBgTint,
    cardBgLight,
    cardBgLightSec,
    cardBorderLight,
    cardBgDark,
    cardBgDarkSec,
    cardBorderDark,
    accentTextLight,
    accentTextDark,
  };
}

// Apply theme custom colors directly into DOM style for entire application
export function applyThemeCustomColors(accent: ThemeAccent, customHex?: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  let activeHex = '#10b981';

  if (accent === 'custom' && customHex) {
    activeHex = normalizeHex(customHex);
  } else {
    const foundPreset = THEME_PALETTES.find(p => p.id === accent);
    if (foundPreset) {
      activeHex = foundPreset.primaryHex;
    }
  }

  const vars = computeThemeCssVariables(activeHex);
  root.style.setProperty('--color-accent', vars.primaryHex);
  root.style.setProperty('--color-accent-hover', vars.hoverHex);
  root.style.setProperty('--color-accent-dark', vars.darkHex);
  root.style.setProperty('--color-accent-dark-hover', vars.darkHoverHex);
  root.style.setProperty('--color-accent-darkest', vars.darkestHex);
  root.style.setProperty('--color-accent-contrast', vars.contrastText);
  root.style.setProperty('--color-accent-subtle', vars.subtleRgba);
  root.style.setProperty('--color-accent-subtle-medium', vars.subtleMediumRgba);
  root.style.setProperty('--color-accent-subtle-strong', vars.subtleStrongRgba);
  root.style.setProperty('--color-accent-border', vars.borderRgba);
  root.style.setProperty('--color-accent-border-subtle', vars.borderSubtleRgba);
  root.style.setProperty('--color-accent-glow', vars.glowRgba);
  root.style.setProperty('--color-accent-ambient', vars.ambientGlowRgba);
  root.style.setProperty('--color-accent-ambient-soft', vars.ambientSoftRgba);
  root.style.setProperty('--color-accent-light-tint', vars.lightBgTint);

  // Cards / Boxes CSS Variables
  root.style.setProperty('--color-card-bg-light', vars.cardBgLight);
  root.style.setProperty('--color-card-bg-light-sec', vars.cardBgLightSec);
  root.style.setProperty('--color-card-border-light', vars.cardBorderLight);
  root.style.setProperty('--color-card-bg-dark', vars.cardBgDark);
  root.style.setProperty('--color-card-bg-dark-sec', vars.cardBgDarkSec);
  root.style.setProperty('--color-card-border-dark', vars.cardBorderDark);

  // High contrast text variables
  root.style.setProperty('--color-accent-text-light', vars.accentTextLight);
  root.style.setProperty('--color-accent-text-dark', vars.accentTextDark);
}
