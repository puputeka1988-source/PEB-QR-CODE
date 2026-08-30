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
    id: 'navy',
    name: 'Biru Navy / Kejuruan (SMK)',
    category: 'Kemdikbud & Nasional',
    desc: 'Biru gelap tegas untuk SMK kejuruan, politeknik, dan akademi teknologi.',
    primaryHex: '#1e40af',
    hoverHex: '#1e3a8a',
    contrastText: '#ffffff',
    ringClass: 'ring-indigo-700'
  },
  {
    id: 'cyan',
    name: 'Cyan Bahari / Modern',
    category: 'Modern & Netral',
    desc: 'Biru toska terang untuk sekolah maritim, bahari, dan sains modern.',
    primaryHex: '#0891b2',
    hoverHex: '#0e7490',
    contrastText: '#ffffff',
    ringClass: 'ring-cyan-500'
  },
  {
    id: 'teal',
    name: 'Teal Laut Sejuk',
    category: 'Modern & Netral',
    desc: 'Hijau toska laut yang sejuk, stabil, dan nyaman untuk mata.',
    primaryHex: '#0d9488',
    hoverHex: '#0f766e',
    contrastText: '#ffffff',
    ringClass: 'ring-teal-500'
  },
  {
    id: 'indigo',
    name: 'Indigo Akademik',
    category: 'Akademik & Kampus',
    desc: 'Indigo elegan bernuansa riset, sains data, dan teknologi terapan.',
    primaryHex: '#4f46e5',
    hoverHex: '#4338ca',
    contrastText: '#ffffff',
    ringClass: 'ring-indigo-500'
  },
  {
    id: 'violet',
    name: 'Ungu Kreatif / Pesantren',
    category: 'Akademik & Kampus',
    desc: 'Ungu berwibawa khas pondok pesantren modern dan yayasan pendidikan.',
    primaryHex: '#7c3aed',
    hoverHex: '#6d28d9',
    contrastText: '#ffffff',
    ringClass: 'ring-violet-500'
  },
  {
    id: 'maroon',
    name: 'Merah Marun / Ksatria',
    category: 'Karakter & Prestasi',
    desc: 'Merah marun berani identitas kepemimpinan, olahraga, dan kedisiplinan.',
    primaryHex: '#b91c1c',
    hoverHex: '#991b1b',
    contrastText: '#ffffff',
    ringClass: 'ring-rose-700'
  },
  {
    id: 'rose',
    name: 'Rose Cerah / Ceria',
    category: 'Karakter & Prestasi',
    desc: 'Aksen rose ceria untuk PAUD, TK, SD, dan sekolah seni kreatif.',
    primaryHex: '#e11d48',
    hoverHex: '#be123c',
    contrastText: '#ffffff',
    ringClass: 'ring-rose-500'
  },
  {
    id: 'amber',
    name: 'Amber Emas / Prestasi',
    category: 'Karakter & Prestasi',
    desc: 'Kuning keemasan simbol kejayaan, juara olimpiade, dan akreditasi unggul.',
    primaryHex: '#d97706',
    hoverHex: '#b45309',
    contrastText: '#020617',
    ringClass: 'ring-amber-500'
  },
  {
    id: 'orange',
    name: 'Oranye Semangat',
    category: 'Karakter & Prestasi',
    desc: 'Warna oranye cerah melambangkan antusiasme, kreativitas, dan energi siswa.',
    primaryHex: '#ea580c',
    hoverHex: '#c2410c',
    contrastText: '#ffffff',
    ringClass: 'ring-orange-500'
  },
  {
    id: 'brown',
    name: 'Coklat Pramuka / Kepanduan',
    category: 'Karakter & Prestasi',
    desc: 'Coklat khas seragam Pramuka, kedisiplinan praja muda karana, dan alam.',
    primaryHex: '#78350f',
    hoverHex: '#57260a',
    contrastText: '#ffffff',
    ringClass: 'ring-amber-800'
  },
  {
    id: 'slate',
    name: 'Abu Titanium / Minimalis',
    category: 'Modern & Netral',
    desc: 'Abu-abu slate teknologi tinggi yang sangat netral dan bersih.',
    primaryHex: '#475569',
    hoverHex: '#334155',
    contrastText: '#ffffff',
    ringClass: 'ring-slate-500'
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

// Compute theme CSS variables dictionary
export function computeThemeCssVariables(accentHex: string) {
  const validHex = normalizeHex(accentHex);
  const { r, g, b } = hexToRgb(validHex);
  const hoverHex = adjustBrightness(validHex, 0.88);
  const contrastText = getContrastTextColor(validHex);
  const subtleRgba = `rgba(${r}, ${g}, ${b}, 0.14)`;
  const borderRgba = `rgba(${r}, ${g}, ${b}, 0.35)`;
  const glowRgba = `rgba(${r}, ${g}, ${b}, 0.25)`;

  return {
    primaryHex: validHex,
    hoverHex,
    contrastText,
    subtleRgba,
    borderRgba,
    glowRgba,
  };
}

// Apply theme custom colors directly into DOM style
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
  root.style.setProperty('--color-accent-contrast', vars.contrastText);
  root.style.setProperty('--color-accent-subtle', vars.subtleRgba);
  root.style.setProperty('--color-accent-border', vars.borderRgba);
  root.style.setProperty('--color-accent-glow', vars.glowRgba);
}
