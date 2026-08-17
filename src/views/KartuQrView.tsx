import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Student, IDCardPrintLayout, PaperSize, PaperOrientation, 
  MarginPreset, CutLineStyle, CardPrintLayoutSettings 
} from '../types';
import { SubNavHeader } from '../components/SubNavHeader';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { 
  Printer, Search, Filter, Download, GraduationCap, Sparkles, User, 
  RefreshCw, Sliders, Check, CreditCard, LayoutGrid, Layers, 
  FileText, ShieldCheck, Phone, CheckCircle2, ChevronRight, Eye,
  Building2, QrCode as QrIcon, Lock, HelpCircle, Palette,
  BadgeCheck, Rotate3d, Maximize2, Settings2, Scissors, 
  FileCode2, AlignCenter, ArrowRight, Save, RotateCcw,
  Sparkle
} from 'lucide-react';

// Specifications for Paper Sizes in mm
export const PAPER_SIZE_SPECS: Record<PaperSize, { name: string; widthMm: number; heightMm: number; desc: string }> = {
  'A4': { name: 'A4', widthMm: 210, heightMm: 297, desc: '210 × 297 mm (Standar Internasional)' },
  'F4': { name: 'F4 / Folio', widthMm: 215, heightMm: 330, desc: '215 × 330 mm (Standar HVS Sekolah Indonesia)' },
  'Letter': { name: 'Letter', widthMm: 215.9, heightMm: 279.4, desc: '215.9 × 279.4 mm (8.5 × 11 inci)' },
  'Legal': { name: 'Legal', widthMm: 215.9, heightMm: 355.6, desc: '215.9 × 355.6 mm (8.5 × 14 inci)' },
  'A3': { name: 'A3', widthMm: 297, heightMm: 420, desc: '297 × 420 mm (Ukuran Kertas Besar)' },
  'Custom': { name: 'Kustom', widthMm: 210, heightMm: 297, desc: 'Tentukan Lebar & Tinggi Sendiri (mm)' }
};

// Specifications for Margin Presets in mm
export const MARGIN_PRESET_SPECS: Record<MarginPreset, { name: string; top: number; bottom: number; left: number; right: number; desc: string }> = {
  'normal': { name: 'Standar (8 mm)', top: 8, bottom: 8, left: 6, right: 6, desc: 'Margin seimbang untuk sebagian besar printer inkjet & laser' },
  'tight': { name: 'Tipis / Rapat (4 mm)', top: 4, bottom: 4, left: 4, right: 4, desc: 'Memaksimalkan kapasitas kartu dalam 1 lembar' },
  'moderate': { name: 'Sedang (12 mm)', top: 12, bottom: 12, left: 10, right: 10, desc: 'Aman untuk printer dengan margin tepi lebar' },
  'wide': { name: 'Lebar (16 mm)', top: 16, bottom: 16, left: 14, right: 14, desc: 'Ruang tepi ekstra luas untuk pemotongan alat guillotine' },
  'none': { name: 'Nol (0 mm / Borderless)', top: 0, bottom: 0, left: 0, right: 0, desc: 'Untuk printer yang mendukung cetak tanpa batas tepi' },
  'custom': { name: 'Kustom Manual', top: 8, bottom: 8, left: 6, right: 6, desc: 'Atur margin atas, bawah, kiri, dan kanan secara bebas' }
};

// Card Size Presets
export const CARD_SIZE_PRESETS = [
  { id: 'cr80-portrait', name: 'Standar PVC CR-80 Portrait', widthMm: 54.0, heightMm: 85.6, desc: 'Ukuran kartu pelajar / ATM vertikal (54 × 85.6 mm)', icon: CreditCard },
  { id: 'cr80-landscape', name: 'Standar PVC CR-80 Landscape', widthMm: 85.6, heightMm: 54.0, desc: 'Ukuran kartu pelajar horizontal (85.6 × 54.0 mm)', icon: CreditCard },
  { id: 'badge-lanyard', name: 'Badge Lanyard B4 / A6', widthMm: 70.0, heightMm: 100.0, desc: 'Ukuran badge gantung leher (70 × 100 mm)', icon: Layers },
  { id: 'pocket-mini', name: 'Kartu Saku Mini', widthMm: 60.0, heightMm: 90.0, desc: 'Ukuran saku dompet kompak (60 × 90 mm)', icon: LayoutGrid },
  { id: 'custom', name: 'Ukuran Kustom', widthMm: 54.0, heightMm: 85.6, desc: 'Tentukan dimensi kartu secara manual', icon: Sliders }
];

const DEFAULT_LAYOUT_SETTINGS: CardPrintLayoutSettings = {
  paperSize: 'A4',
  customPaperWidthMm: 210,
  customPaperHeightMm: 297,
  orientation: 'portrait',
  marginPreset: 'normal',
  marginTopMm: 8,
  marginBottomMm: 8,
  marginLeftMm: 6,
  marginRightMm: 6,
  cardWidthMm: 54.0,
  cardHeightMm: 85.6,
  gapHorizontalMm: 6,
  gapVerticalMm: 6,
  columnsCount: 0, // 0 for Auto
  showCutLines: true,
  cutLineStyle: 'dashed',
  showPunchHole: true,
  showSchoolLogo: true,
  printSideMode: 'both',
  scalePercent: 100,
  customFooterText: 'Hadir, Belajar, Berprestasi Untuk Masa Depan'
};

const STORAGE_KEY = 'qr_card_layout_settings_v2';

export const KartuQrView: React.FC = () => {
  const { 
    students, settings, selectedStudentForCard, setSelectedStudentForCard,
    activeAcademicYear, getActiveSubTab, setActiveSubTab, showToast
  } = useApp();

  const activeSubTab = getActiveSubTab('Kartu QR') || 'cetak-massal';
  
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('SEMUA');
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
  const [singleStudentId, setSingleStudentId] = useState<string>('ALL');

  // Preview interactive state
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const [previewStudentId, setPreviewStudentId] = useState<string>('');

  // Layout & Print Settings State with LocalStorage Persistence
  const [layoutSettings, setLayoutSettings] = useState<CardPrintLayoutSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_LAYOUT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load card layout settings from storage', e);
    }
    return DEFAULT_LAYOUT_SETTINGS;
  });

  // Save settings helper
  const updateLayoutSettings = (updater: Partial<CardPrintLayoutSettings> | ((prev: CardPrintLayoutSettings) => CardPrintLayoutSettings)) => {
    setLayoutSettings(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save card layout settings', e);
      }
      return next;
    });
  };

  const handleResetLayoutSettings = () => {
    setLayoutSettings(DEFAULT_LAYOUT_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LAYOUT_SETTINGS));
      showToast?.('Pengaturan layout berhasil dikembalikan ke standar awal A4', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  // Handle selected student passed from other views
  useEffect(() => {
    if (selectedStudentForCard) {
      setSingleStudentId(selectedStudentForCard.id);
      setSelectedClass(selectedStudentForCard.class);
      setPreviewStudentId(selectedStudentForCard.id);
    }
  }, [selectedStudentForCard]);

  const classes = ['SEMUA', ...Array.from(new Set(students.map(s => s.class))).sort()];

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.nisn.includes(search);
      const matchClass = selectedClass === 'SEMUA' || s.class === selectedClass;
      const matchSingle = singleStudentId === 'ALL' || s.id === singleStudentId;
      return matchSearch && matchClass && matchSingle;
    });
  }, [students, search, selectedClass, singleStudentId]);

  // Academic year display
  const currentTa = useMemo(() => {
    if (activeAcademicYear) {
      const yearName = activeAcademicYear.name || '2025/2026';
      const sem = activeAcademicYear.semester ? ` (${activeAcademicYear.semester})` : '';
      return `${yearName}${sem}`;
    }
    const yearStr = settings.tahunAjaran || '2025/2026';
    const semStr = settings.semester ? ` (${settings.semester})` : '';
    return `${yearStr}${semStr}`;
  }, [activeAcademicYear, settings.tahunAjaran, settings.semester]);

  // Generate QR code data URLs for students
  useEffect(() => {
    const generateAllQrs = async () => {
      const mapping: Record<string, string> = {};
      for (const s of students) {
        try {
          const url = await QRCode.toDataURL(s.nisn, {
            width: 320,
            margin: 1,
            errorCorrectionLevel: 'H',
            color: {
              dark: '#0F3B2E',
              light: '#FFFFFF'
            }
          });
          mapping[s.id] = url;
        } catch (err) {
          console.error('Failed to generate QR for', s.name, err);
        }
      }
      setQrUrls(mapping);
    };

    if (students.length > 0) {
      generateAllQrs();
    }
  }, [students]);

  // Default preview student
  const activePreviewStudent = useMemo(() => {
    if (previewStudentId) {
      return students.find(s => s.id === previewStudentId) || students[0];
    }
    return students[0];
  }, [previewStudentId, students]);

  // Mathematical Calculation for Sheet Layout, Columns, Rows, and Card Capacities
  const sheetCalculations = useMemo(() => {
    const { 
      paperSize, customPaperWidthMm, customPaperHeightMm, 
      orientation, marginTopMm, marginBottomMm, marginLeftMm, marginRightMm,
      cardWidthMm, cardHeightMm, gapHorizontalMm, gapVerticalMm, columnsCount
    } = layoutSettings;

    const baseSpec = PAPER_SIZE_SPECS[paperSize];
    const rawW = paperSize === 'Custom' ? (customPaperWidthMm || 210) : baseSpec.widthMm;
    const rawH = paperSize === 'Custom' ? (customPaperHeightMm || 297) : baseSpec.heightMm;

    const pageW = orientation === 'portrait' ? rawW : rawH;
    const pageH = orientation === 'portrait' ? rawH : rawW;

    const printW = Math.max(10, pageW - (marginLeftMm + marginRightMm));
    const printH = Math.max(10, pageH - (marginTopMm + marginBottomMm));

    // Calculate columns
    const autoCols = Math.max(1, Math.floor((printW + gapHorizontalMm) / (cardWidthMm + gapHorizontalMm)));
    const finalCols = columnsCount > 0 ? columnsCount : autoCols;

    // Calculate rows
    const finalRows = Math.max(1, Math.floor((printH + gapVerticalMm) / (cardHeightMm + gapVerticalMm)));
    
    const cardsPerPage = finalCols * finalRows;
    const totalStudents = filteredStudents.length;
    
    // If both sides printed, each student has 2 card sides (front + back)
    const itemsPerStudent = layoutSettings.printSideMode === 'both' ? 2 : 1;
    const totalItems = totalStudents * itemsPerStudent;
    const totalPagesNeeded = Math.ceil(totalItems / Math.max(1, cardsPerPage));

    return {
      pageW,
      pageH,
      printW,
      printH,
      finalCols,
      finalRows,
      cardsPerPage,
      totalStudents,
      totalPagesNeeded,
      isLandscapeCard: cardWidthMm > cardHeightMm
    };
  }, [layoutSettings, filteredStudents.length]);

  // Print Handler Generating Dynamic CSS matching Layout & Margin
  const handlePrintStudents = (studentsToPrint: Student[]) => {
    if (studentsToPrint.length === 0) {
      showToast?.('Tidak ada siswa yang dipilih untuk dicetak', 'warning');
      return;
    }

    const { 
      marginTopMm, marginBottomMm, marginLeftMm, marginRightMm,
      cardWidthMm, cardHeightMm, gapHorizontalMm, gapVerticalMm,
      showCutLines, cutLineStyle, showPunchHole, showSchoolLogo,
      printSideMode, customFooterText
    } = layoutSettings;

    const { pageW, pageH, finalCols, isLandscapeCard } = sheetCalculations;

    const schoolName = settings.sekolah || 'MADRASAH ALIYAH DIGITAL';
    const schoolAddress = settings.alamatSekolah || 'Jl. Pendidikan Karakter No. 7, Jakarta';
    const schoolSubHeader = settings.kemenagHeader || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA';
    const footerText = customFooterText || 'Hadir, Belajar, Berprestasi Untuk Masa Depan';

    const logoImgTag = showSchoolLogo && settings.logoUrl 
      ? `<img src="${settings.logoUrl}" style="height: 28px; width: 28px; max-width: 32px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" />`
      : `<div style="width: 26px; height: 26px; border-radius: 6px; background: rgba(212,175,55,0.2); border: 1px solid #D4AF37; display: flex; align-items: center; justify-content: center; font-size: 13px;">🕌</div>`;

    // Sisi Depan Kartu Presensi
    const renderFrontCardHtml = (student: Student) => `
      <div class="card-box card-front ${isLandscapeCard ? 'card-landscape-mode' : 'card-portrait-mode'}">
        ${showPunchHole ? '<div class="punch-hole-slot"></div>' : ''}
        
        <!-- Header Madrasah -->
        <div class="card-header-madrasah">
          <div class="header-content">
            <div class="header-logo">
              ${logoImgTag}
            </div>
            <div class="header-text">
              <div class="instansi-title">${schoolSubHeader}</div>
              <div class="school-title">${schoolName}</div>
              <div class="school-motto">${schoolAddress}</div>
            </div>
          </div>
        </div>

        <!-- Arch Wave Divider -->
        <div class="arch-gold-divider">
          <div class="arch-badge-container">
            <div class="arch-badge-icon">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="#D4AF37" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
                <path d="M6 6h10"></path><path d="M6 10h10"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Judul Kartu -->
        <div class="card-title-section">
          <div class="card-main-title">KARTU PRESENSI</div>
          <div class="card-sub-title"><span>SISWA</span></div>
        </div>

        <!-- Tabel Identitas Siswa -->
        <div class="card-student-details">
          <table class="details-table">
            <tr>
              <td class="col-icon"><span class="detail-icon">🪪</span></td>
              <td class="col-label">NISN</td>
              <td class="col-colon">:</td>
              <td class="col-value font-mono font-bold">${student.nisn}</td>
            </tr>
            <tr>
              <td class="col-icon"><span class="detail-icon">👤</span></td>
              <td class="col-label">NAMA</td>
              <td class="col-colon">:</td>
              <td class="col-value font-bold text-uppercase name-value">${student.name}</td>
            </tr>
            <tr>
              <td class="col-icon"><span class="detail-icon">🚻</span></td>
              <td class="col-label">JK</td>
              <td class="col-colon">:</td>
              <td class="col-value font-bold">${student.gender === 'P' ? 'PEREMPUAN' : 'LAKI-LAKI'}</td>
            </tr>
            <tr>
              <td class="col-icon"><span class="detail-icon">🏫</span></td>
              <td class="col-label">KELAS</td>
              <td class="col-colon">:</td>
              <td class="col-value font-bold">${student.class}</td>
            </tr>
            <tr>
              <td class="col-icon"><span class="detail-icon">📅</span></td>
              <td class="col-label">TA</td>
              <td class="col-colon">:</td>
              <td class="col-value font-bold ta-value">${currentTa}</td>
            </tr>
          </table>
        </div>

        <!-- Footer Card -->
        <div class="card-footer-madrasah">
          <div class="footer-leaf-icon">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="#D4AF37">
              <path d="M12 2L15 8L21 9L17 14L18 20L12 17L6 20L7 14L3 9L9 8L12 2Z"></path>
            </svg>
          </div>
          <div class="footer-motto-text">${footerText}</div>
        </div>

      </div>
    `;

    // Sisi Belakang Kartu Presensi
    const renderBackCardHtml = (student: Student) => {
      const qrData = qrUrls[student.id] || '';
      return `
        <div class="card-box card-back ${isLandscapeCard ? 'card-landscape-mode' : 'card-portrait-mode'}">
          ${showPunchHole ? '<div class="punch-hole-slot"></div>' : ''}
          
          <div class="card-back-header">
            <div class="back-title-badge">KODE QR RESMI PRESENSI</div>
          </div>

          <div class="qr-main-container">
            <div class="qr-border-wrap">
              <img src="${qrData}" alt="QR Code NISN ${student.nisn}" class="qr-image" />
            </div>
            <div class="qr-nisn-badge">NISN: ${student.nisn}</div>
          </div>

          <div class="security-rules-box">
            <div class="security-icon-col">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="#0F3B2E" stroke-width="2.5" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div class="security-content">
              <div class="security-title">AUTENTIKASI DIGITAL MADRASAH</div>
              <div class="security-desc">Wajib dibawa setiap hari saat presensi kedatangan & kepulangan.</div>
              <div class="security-school-info">${schoolName} • TA ${currentTa}</div>
            </div>
          </div>

          <div class="card-footer-madrasah-back"></div>
        </div>
      `;
    };

    const dynamicPrintCss = `
      @page {
        size: ${pageW}mm ${pageH}mm;
        margin: ${marginTopMm}mm ${marginRightMm}mm ${marginBottomMm}mm ${marginLeftMm}mm;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        font-family: 'Segoe UI', Arial, Roboto, sans-serif;
        background: #ffffff;
        color: #0F3B2E;
        padding: 0;
        margin: 0;
      }
      .page-container {
        display: grid;
        grid-template-columns: repeat(${finalCols}, ${cardWidthMm}mm);
        justify-content: center;
        gap: ${gapVerticalMm}mm ${gapHorizontalMm}mm;
        margin: 0 auto;
        width: 100%;
      }
      .card-wrapper-item {
        width: ${cardWidthMm}mm;
        height: ${cardHeightMm}mm;
        position: relative;
        page-break-inside: avoid;
        break-inside: avoid;
        ${showCutLines ? `outline: 1px ${cutLineStyle} #94a3b8;` : ''}
      }
      .card-box {
        width: ${cardWidthMm}mm;
        height: ${cardHeightMm}mm;
        border-radius: ${Math.min(4, Math.max(1, cardWidthMm * 0.06))}mm;
        border: 1.5px solid #0F3B2E;
        background: #ffffff;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .punch-hole-slot {
        position: absolute;
        top: 2.2mm;
        left: 50%;
        transform: translateX(-50%);
        width: 14mm;
        height: 3.2mm;
        border-radius: 2mm;
        background: #ffffff;
        border: 1px dashed #94a3b8;
        z-index: 10;
      }
      .card-header-madrasah {
        background: linear-gradient(135deg, #09261E 0%, #0F3B2E 70%, #175443 100%);
        padding: ${showPunchHole ? '5.5mm 2.5mm 3.5mm' : '3mm 2.5mm 3.5mm'};
        color: #ffffff;
        border-bottom: 2px solid #D4AF37;
        position: relative;
      }
      .header-content {
        display: flex;
        align-items: center;
        gap: 2mm;
      }
      .header-logo {
        width: 7.5mm;
        height: 7.5mm;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .header-text {
        flex: 1;
        text-align: center;
        min-width: 0;
      }
      .instansi-title {
        font-size: 3.8pt;
        font-weight: 800;
        color: #D4AF37;
        letter-spacing: 0.3px;
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .school-title {
        font-size: 5.2pt;
        font-weight: 900;
        color: #ffffff;
        letter-spacing: 0.1px;
        text-transform: uppercase;
        line-height: 1.15;
        margin-top: 0.2mm;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .school-motto {
        font-size: 3.8pt;
        color: #E2E8F0;
        line-height: 1.1;
        margin-top: 0.2mm;
        opacity: 0.9;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .arch-gold-divider {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        margin-top: -1.5mm;
        z-index: 4;
      }
      .arch-badge-container {
        width: 5.5mm;
        height: 5.5mm;
        background: #0F3B2E;
        border: 1.5px solid #D4AF37;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.15);
      }
      .arch-badge-icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .card-title-section {
        text-align: center;
        margin-top: 0.2mm;
      }
      .card-main-title {
        font-size: 7.8pt;
        font-weight: 900;
        color: #0F3B2E;
        letter-spacing: 0.8px;
        line-height: 1;
      }
      .card-sub-title {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2mm;
        margin-top: 0.4mm;
      }
      .card-sub-title span {
        font-size: 6.5pt;
        font-weight: 800;
        color: #D4AF37;
        letter-spacing: 1.5px;
      }
      .card-student-details {
        padding: 0 2.5mm;
        margin: 0.5mm 0;
      }
      .details-table {
        width: 100%;
        table-layout: fixed;
        border-collapse: collapse;
      }
      .details-table td {
        padding: 0.6mm 0;
        vertical-align: middle;
        font-size: 5.2pt;
        line-height: 1.15;
      }
      .col-icon {
        width: 3.2mm;
        text-align: center;
        white-space: nowrap;
      }
      .detail-icon {
        font-size: 5pt;
        line-height: 1;
      }
      .col-label {
        width: 12mm;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.1px;
        white-space: nowrap;
        font-size: 5pt;
      }
      .col-colon {
        width: 1.5mm;
        text-align: center;
        font-weight: bold;
        color: #0F3B2E;
        white-space: nowrap;
      }
      .col-value {
        color: #0F3B2E;
        font-size: 5.4pt;
        padding-left: 1mm;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .name-value {
        font-size: 5.3pt;
        font-weight: 800;
        letter-spacing: -0.05px;
      }
      .ta-value {
        font-size: 5.2pt;
        font-weight: 800;
        color: #0F3B2E;
      }
      .card-footer-madrasah {
        background: linear-gradient(145deg, #09261E, #0F3B2E);
        padding: 1.5mm 2mm;
        color: #ffffff;
        text-align: center;
        border-top: 1.5px solid #D4AF37;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.2mm;
      }
      .footer-leaf-icon {
        display: flex;
        align-items: center;
      }
      .footer-motto-text {
        font-size: 3.6pt;
        font-weight: 700;
        color: #D4AF37;
        letter-spacing: 0.2px;
        white-space: nowrap;
      }
      .card-back {
        background: #FDFBF7;
      }
      .card-back-header {
        padding: ${showPunchHole ? '6mm 2mm 1.5mm' : '3mm 2mm 1.5mm'};
        text-align: center;
      }
      .back-title-badge {
        display: inline-block;
        background: #0F3B2E;
        color: #D4AF37;
        font-size: 4.8pt;
        font-weight: 800;
        padding: 0.8mm 3mm;
        border-radius: 2mm;
        letter-spacing: 0.4px;
        border: 1px solid #D4AF37;
      }
      .qr-main-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 0.5mm 0;
      }
      .qr-border-wrap {
        width: ${Math.min(32, cardWidthMm * 0.58)}mm;
        height: ${Math.min(32, cardWidthMm * 0.58)}mm;
        background: #ffffff;
        border: 1.5px solid #D4AF37;
        border-radius: 3mm;
        padding: 1.2mm;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .qr-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .qr-nisn-badge {
        margin-top: 1mm;
        font-family: monospace;
        font-weight: 900;
        font-size: 6.2pt;
        color: #0F3B2E;
        background: #E8EFE9;
        padding: 0.6mm 2.5mm;
        border-radius: 1.5mm;
        border: 1px solid #C4D7C8;
      }
      .security-rules-box {
        margin: 0 2.5mm;
        padding: 1.2mm 1.8mm;
        background: #ffffff;
        border: 1px solid #D4AF37;
        border-radius: 2mm;
        display: flex;
        align-items: center;
        gap: 1.5mm;
      }
      .security-icon-col {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .security-content {
        flex: 1;
        text-align: left;
        min-width: 0;
      }
      .security-title {
        font-size: 4.6pt;
        font-weight: 900;
        color: #0F3B2E;
        letter-spacing: 0.2px;
        white-space: nowrap;
      }
      .security-desc {
        font-size: 3.8pt;
        color: #475569;
        line-height: 1.1;
        margin-top: 0.1mm;
      }
      .security-school-info {
        font-size: 3.5pt;
        color: #94a3b8;
        margin-top: 0.2mm;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .card-footer-madrasah-back {
        height: 1.8mm;
        background: linear-gradient(145deg, #09261E, #0F3B2E);
        border-top: 1.5px solid #D4AF37;
      }
    `;

    const cardsHtml = studentsToPrint.map(student => {
      const frontHtml = `<div class="card-wrapper-item">${renderFrontCardHtml(student)}</div>`;
      const backHtml = `<div class="card-wrapper-item">${renderBackCardHtml(student)}</div>`;

      if (printSideMode === 'front-only') return frontHtml;
      if (printSideMode === 'back-only') return backHtml;
      return `${frontHtml}${backHtml}`;
    }).join('');

    const printableHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Cetak Kartu Presensi - ${schoolName}</title>
          <style>
            ${dynamicPrintCss}
          </style>
        </head>
        <body>
          <div class="page-container">
            ${cardsHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          </script>
        </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=1024,height=800');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printableHtml);
      printWin.document.close();
      printWin.focus();
    } else {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(printableHtml);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 2500);
        }, 500);
      } else {
        window.print();
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Submenu Navigation Header */}
      <SubNavHeader
        currentTab="Kartu QR"
        activeSubTab={activeSubTab}
        onSelectSubTab={(id) => setActiveSubTab('Kartu QR', id)}
        badgeCounts={{
          'cetak-massal': `${filteredStudents.length} Siswa`,
          'desain-kustom': `${PAPER_SIZE_SPECS[layoutSettings.paperSize].name} • ${layoutSettings.orientation === 'portrait' ? 'Tegak' : 'Mendatar'}`,
          'pratinjau-individu': 'PVC Live'
        }}
        extraActions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('Kartu QR', 'desain-kustom')}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer shadow-sm"
              title="Atur Margin, Ukuran Kertas & Orientasi"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Atur Layout Kertas</span>
            </button>
            <button
              onClick={() => handlePrintStudents(filteredStudents)}
              disabled={filteredStudents.length === 0}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak ({filteredStudents.length})</span>
            </button>
          </div>
        }
      />

      {/* Dynamic Sub-Tab Views with Smooth Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* ========================================================================= */}
          {/* SUBMENU 1: CETAK LEMBAR MASSAL & DAFTAR SISWA                             */}
          {/* ========================================================================= */}
          {activeSubTab === 'cetak-massal' && (
            <div className="space-y-6">
          
          {/* Top Banner with Quick Layout Summary */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-6 rounded-3xl border border-emerald-500/30 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-lg">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-black text-white">Generator Cetak Kartu Presensi Massal</h3>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                    {PAPER_SIZE_SPECS[layoutSettings.paperSize].name} ({layoutSettings.orientation === 'portrait' ? 'Tegak' : 'Mendatar'})
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Cetak lembar kertas rapi dengan garis potong gunting & kode QR NISN resmi madrasah.
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">
                  <span className="bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800 font-mono">
                    Margin: {layoutSettings.marginTopMm}mm (Atas/Bwh), {layoutSettings.marginLeftMm}mm (Kiri/Kanan)
                  </span>
                  <span className="bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800 font-mono text-emerald-300">
                    Kapasitas: ~{sheetCalculations.cardsPerPage} Kartu / Lembar
                  </span>
                  <span className="bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800 font-mono text-amber-300">
                    Estimasi Kertas: {sheetCalculations.totalPagesNeeded} Lembar ({filteredStudents.length} Siswa)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
              <button
                type="button"
                onClick={() => setActiveSubTab('Kartu QR', 'desain-kustom')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ubah Ukuran & Margin</span>
              </button>
              <button
                type="button"
                onClick={() => handlePrintStudents(filteredStudents)}
                disabled={filteredStudents.length === 0}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Semua ({filteredStudents.length})</span>
              </button>
            </div>
          </div>

          {/* Quick Filter & Search Toolbar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari siswa berdasarkan nama atau NISN..."
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
              />
            </div>

            <div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                {classes.map(c => (
                  <option key={c} value={c}>Filter Kelas: {c}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={singleStudentId}
                onChange={(e) => setSingleStudentId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-medium text-emerald-400"
              >
                <option value="ALL">Pilih Semua ({filteredStudents.length} Siswa)</option>
                {students
                  .filter(s => selectedClass === 'SEMUA' || s.class === selectedClass)
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.class})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Student Table Ready to Print */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Daftar Siswa Siap Cetak Kartu ({filteredStudents.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Format cetak saat ini: Kertas <strong className="text-emerald-400">{PAPER_SIZE_SPECS[layoutSettings.paperSize].name}</strong> ({layoutSettings.orientation === 'portrait' ? 'Portrait' : 'Landscape'}), Margin {layoutSettings.marginTopMm}mm, {layoutSettings.printSideMode === 'both' ? 'Bolak-Balik (2 Sisi)' : layoutSettings.printSideMode === 'front-only' ? 'Sisi Depan Saja' : 'Sisi Belakang Saja'}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintStudents(filteredStudents)}
                  disabled={filteredStudents.length === 0}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Lembar ({filteredStudents.length})</span>
                </button>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Tidak ada siswa ditemukan. Silakan sesuaikan filter pencarian atau pilih kelas lain.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[11px] text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5 w-12 text-center">No</th>
                      <th className="px-5 py-3.5">NISN</th>
                      <th className="px-5 py-3.5">Nama Siswa</th>
                      <th className="px-5 py-3.5 text-center">L/P</th>
                      <th className="px-5 py-3.5">Kelas</th>
                      <th className="px-5 py-3.5">Tahun Ajaran</th>
                      <th className="px-5 py-3.5 text-center">Status QR</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredStudents.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                        <td className="px-5 py-3 font-mono font-bold text-emerald-400">{student.nisn}</td>
                        <td className="px-5 py-3 font-bold text-white uppercase">{student.name}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            student.gender === 'P' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {student.gender === 'P' ? 'P' : 'L'}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-200">{student.class}</td>
                        <td className="px-5 py-3 font-medium text-emerald-300">{currentTa}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Tersedia</span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewStudentId(student.id);
                                setActiveSubTab('Kartu QR', 'pratinjau-individu');
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                              title="Lihat Pratinjau PVC Satuan"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintStudents([student])}
                              className="bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 hover:border-emerald-500 inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Cetak</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMENU 2: PENGATURAN LAYOUT (MARGIN, ORIENTASI, UKURAN KERTAS & DIMENSI)  */}
      {/* ========================================================================= */}
      {activeSubTab === 'desain-kustom' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Top Actions & Summary Bar */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Pengaturan Layout Kertas & Margin Cetak</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Atur ukuran kertas (A4, F4/Folio, Letter, Legal, Kustom), orientasi, batas margin, dan jarak kisi kartu sesuai printer Anda.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
              <button
                type="button"
                onClick={handleResetLayoutSettings}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Kembalikan semua nilai ke standar awal"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset Standar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast?.('Pengaturan layout tersimpan otomatis & siap digunakan', 'success');
                  handlePrintStudents(filteredStudents.slice(0, 4));
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Uji Cetak Sample</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Grid: Settings Form vs Live Sheet Simulation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Form Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-5">

              {/* 1. UKURAN KERTAS & ORIENTASI */}
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                    <FileCode2 className="w-4 h-4" />
                    <span>1. Ukuran Kertas & Orientasi Halaman</span>
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    {sheetCalculations.pageW} × {sheetCalculations.pageH} mm
                  </span>
                </div>

                {/* Paper Size Presets */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Pilih Standar Kertas:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(Object.keys(PAPER_SIZE_SPECS) as PaperSize[]).map(ps => {
                      const spec = PAPER_SIZE_SPECS[ps];
                      const isSelected = layoutSettings.paperSize === ps;
                      return (
                        <button
                          key={ps}
                          type="button"
                          onClick={() => updateLayoutSettings({ paperSize: ps })}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                              : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">{spec.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block mt-1 line-clamp-1">
                            {ps === 'Custom' ? 'Atur Manual mm' : `${spec.widthMm} × ${spec.heightMm} mm`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Paper Size Input Fields */}
                {layoutSettings.paperSize === 'Custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-2 gap-3 text-xs"
                  >
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Lebar Kertas (mm):</label>
                      <input
                        type="number"
                        min={50}
                        max={1000}
                        value={layoutSettings.customPaperWidthMm}
                        onChange={(e) => updateLayoutSettings({ customPaperWidthMm: Number(e.target.value) || 210 })}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Tinggi Kertas (mm):</label>
                      <input
                        type="number"
                        min={50}
                        max={1000}
                        value={layoutSettings.customPaperHeightMm}
                        onChange={(e) => updateLayoutSettings({ customPaperHeightMm: Number(e.target.value) || 297 })}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Orientation Selector */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-300 mb-2">Orientasi Lembar Kertas:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateLayoutSettings({ orientation: 'portrait' })}
                      className={`p-3 rounded-2xl border flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                        layoutSettings.orientation === 'portrait'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white font-bold ring-1 ring-emerald-500/30'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-4 h-6 border-2 border-current rounded-sm flex items-center justify-center text-[8px]">T</div>
                      <div className="text-left text-xs">
                        <span className="block font-bold">Portrait (Tegak / Vertikal)</span>
                        <span className="text-[10px] text-slate-500">Standar cetak umum</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateLayoutSettings({ orientation: 'landscape' })}
                      className={`p-3 rounded-2xl border flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                        layoutSettings.orientation === 'landscape'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white font-bold ring-1 ring-emerald-500/30'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-6 h-4 border-2 border-current rounded-sm flex items-center justify-center text-[8px]">L</div>
                      <div className="text-left text-xs">
                        <span className="block font-bold">Landscape (Mendatar)</span>
                        <span className="text-[10px] text-slate-500">Cocok untuk 3–4 kolom</span>
                      </div>
                    </button>
                  </div>
                </div>

              </div>

              {/* 2. PENGATURAN MARGIN KERTAS & JARAK KARTU */}
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                    <AlignCenter className="w-4 h-4" />
                    <span>2. Margin Kertas & Jarak Antar Kartu (Gap)</span>
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    Area Efektif: {sheetCalculations.printW.toFixed(1)} × {sheetCalculations.printH.toFixed(1)} mm
                  </span>
                </div>

                {/* Margin Presets */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Preset Batas Margin:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(MARGIN_PRESET_SPECS) as MarginPreset[]).map(mp => {
                      const spec = MARGIN_PRESET_SPECS[mp];
                      const isSelected = layoutSettings.marginPreset === mp;
                      return (
                        <button
                          key={mp}
                          type="button"
                          onClick={() => {
                            if (mp !== 'custom') {
                              updateLayoutSettings({
                                marginPreset: mp,
                                marginTopMm: spec.top,
                                marginBottomMm: spec.bottom,
                                marginLeftMm: spec.left,
                                marginRightMm: spec.right
                              });
                            } else {
                              updateLayoutSettings({ marginPreset: mp });
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30'
                              : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">{spec.name}</span>
                            {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                          </div>
                          <span className="text-[9px] text-slate-500 block mt-0.5 line-clamp-1">{spec.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Precise Margin Inputs (Top, Bottom, Left, Right) */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">Nilai Margin Kertas Presisi (mm):</span>
                    <span className="text-[10px] text-slate-500">Dapat disesuaikan sesuai toleransi printer</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Atas (Top):</label>
                      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={layoutSettings.marginTopMm}
                          onChange={(e) => updateLayoutSettings({ 
                            marginTopMm: Math.max(0, Number(e.target.value) || 0),
                            marginPreset: 'custom'
                          })}
                          className="w-full bg-transparent text-white font-mono focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500">mm</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Bawah (Bottom):</label>
                      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={layoutSettings.marginBottomMm}
                          onChange={(e) => updateLayoutSettings({ 
                            marginBottomMm: Math.max(0, Number(e.target.value) || 0),
                            marginPreset: 'custom'
                          })}
                          className="w-full bg-transparent text-white font-mono focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500">mm</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Kiri (Left):</label>
                      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={layoutSettings.marginLeftMm}
                          onChange={(e) => updateLayoutSettings({ 
                            marginLeftMm: Math.max(0, Number(e.target.value) || 0),
                            marginPreset: 'custom'
                          })}
                          className="w-full bg-transparent text-white font-mono focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500">mm</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Kanan (Right):</label>
                      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={layoutSettings.marginRightMm}
                          onChange={(e) => updateLayoutSettings({ 
                            marginRightMm: Math.max(0, Number(e.target.value) || 0),
                            marginPreset: 'custom'
                          })}
                          className="w-full bg-transparent text-white font-mono focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500">mm</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gap Between Cards (Horizontal & Vertical) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Jarak Antar Kolom (Gap H):</label>
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={layoutSettings.gapHorizontalMm}
                        onChange={(e) => updateLayoutSettings({ gapHorizontalMm: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full bg-transparent text-white font-mono focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500">mm</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Jarak Antar Baris (Gap V):</label>
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={layoutSettings.gapVerticalMm}
                        onChange={(e) => updateLayoutSettings({ gapVerticalMm: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full bg-transparent text-white font-mono focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500">mm</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Jumlah Kolom Grid:</label>
                    <select
                      value={layoutSettings.columnsCount}
                      onChange={(e) => updateLayoutSettings({ columnsCount: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                    >
                      <option value={0}>Otomatis ({sheetCalculations.finalCols} Kolom)</option>
                      <option value={1}>1 Kolom (Tunggal)</option>
                      <option value={2}>2 Kolom</option>
                      <option value={3}>3 Kolom</option>
                      <option value={4}>4 Kolom</option>
                      <option value={5}>5 Kolom</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* 3. DIMENSI KARTU & KELENGKAPAN CETAK */}
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>3. Dimensi Kartu & Opsi Kelengkapan</span>
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    {layoutSettings.cardWidthMm} × {layoutSettings.cardHeightMm} mm
                  </span>
                </div>

                {/* Card Size Presets */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Preset Standar Kartu:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CARD_SIZE_PRESETS.map(cp => {
                      const isSelected = layoutSettings.cardWidthMm === cp.widthMm && layoutSettings.cardHeightMm === cp.heightMm;
                      const Icon = cp.icon;
                      return (
                        <button
                          key={cp.id}
                          type="button"
                          onClick={() => updateLayoutSettings({ cardWidthMm: cp.widthMm, cardHeightMm: cp.heightMm })}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30'
                              : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-xs text-white block truncate">{cp.name}</span>
                            <span className="text-[10px] font-mono text-emerald-400">{cp.widthMm} × {cp.heightMm} mm</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Card Dimensions (Width x Height) */}
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Lebar Kartu Fisik (mm):</label>
                    <input
                      type="number"
                      min={30}
                      max={300}
                      step={0.1}
                      value={layoutSettings.cardWidthMm}
                      onChange={(e) => updateLayoutSettings({ cardWidthMm: Number(e.target.value) || 54 })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Tinggi Kartu Fisik (mm):</label>
                    <input
                      type="number"
                      min={30}
                      max={300}
                      step={0.1}
                      value={layoutSettings.cardHeightMm}
                      onChange={(e) => updateLayoutSettings({ cardHeightMm: Number(e.target.value) || 85.6 })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Toggles: Cut lines, Punch Hole, Logo, Sides */}
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <label className="flex items-center gap-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={layoutSettings.showCutLines}
                        onChange={(e) => updateLayoutSettings({ showCutLines: e.target.checked })}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 w-4 h-4"
                      />
                      <div>
                        <span className="font-bold text-white block">Garis Potong Gunting</span>
                        <span className="text-[10px] text-slate-500">Garis batas tepi</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={layoutSettings.showPunchHole}
                        onChange={(e) => updateLayoutSettings({ showPunchHole: e.target.checked })}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 w-4 h-4"
                      />
                      <div>
                        <span className="font-bold text-white block">Lubang Tali Lanyard</span>
                        <span className="text-[10px] text-slate-500">Slot oval 14×3mm</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={layoutSettings.showSchoolLogo}
                        onChange={(e) => updateLayoutSettings({ showSchoolLogo: e.target.checked })}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 w-4 h-4"
                      />
                      <div>
                        <span className="font-bold text-white block">Logo Madrasah / Sekolah</span>
                        <span className="text-[10px] text-slate-500">Tampilkan di kop</span>
                      </div>
                    </label>
                  </div>

                  {/* Cut line style & Sisi Cetak */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Model Garis Potong:</label>
                      <select
                        value={layoutSettings.cutLineStyle}
                        onChange={(e) => updateLayoutSettings({ cutLineStyle: e.target.value as CutLineStyle })}
                        disabled={!layoutSettings.showCutLines}
                        className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      >
                        <option value="dashed">Garis Putus-Putus (Dashed - Standar)</option>
                        <option value="solid">Garis Solid Tipis (Solid Continuous)</option>
                        <option value="dotted">Garis Titik-Titik (Dotted)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Format Sisi Cetak:</label>
                      <select
                        value={layoutSettings.printSideMode}
                        onChange={(e) => updateLayoutSettings({ printSideMode: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-bold text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="both">Bolak-Balik (Sisi Depan & Belakang)</option>
                        <option value="front-only">Sisi Depan Saja (Identitas Siswa)</option>
                        <option value="back-only">Sisi Belakang Saja (QR Code Presensi)</option>
                      </select>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Right Column: Live Sheet Simulation & Calculations (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-xl sticky top-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    <span>Simulasi Lembar Kertas Real-Time</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    Skala Presisi
                  </span>
                </div>

                {/* Sheet Simulation Container */}
                <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[340px] relative overflow-hidden">
                  
                  {/* Outer Sheet Mockup with exact aspect ratio */}
                  <div 
                    className="bg-white rounded-lg shadow-2xl relative transition-all duration-300 flex flex-col justify-between"
                    style={{
                      width: layoutSettings.orientation === 'portrait' ? '220px' : '300px',
                      height: layoutSettings.orientation === 'portrait' 
                        ? `${Math.min(360, (sheetCalculations.pageH / sheetCalculations.pageW) * 220)}px` 
                        : `${Math.min(360, (sheetCalculations.pageH / sheetCalculations.pageW) * 300)}px`,
                      padding: `${(layoutSettings.marginTopMm / sheetCalculations.pageH) * 100}% ${(layoutSettings.marginRightMm / sheetCalculations.pageW) * 100}% ${(layoutSettings.marginBottomMm / sheetCalculations.pageH) * 100}% ${(layoutSettings.marginLeftMm / sheetCalculations.pageW) * 100}%`
                    }}
                  >
                    {/* Dashed Margin Border Indicator */}
                    <div className="w-full h-full border border-dashed border-blue-400/80 rounded-sm relative flex flex-col justify-start items-center p-1 bg-blue-50/20 overflow-hidden">
                      
                      {/* Grid representation of cards inside printable area */}
                      <div 
                        className="w-full h-full grid justify-center content-start gap-1"
                        style={{
                          gridTemplateColumns: `repeat(${sheetCalculations.finalCols}, minmax(0, 1fr))`
                        }}
                      >
                        {Array.from({ length: Math.min(sheetCalculations.cardsPerPage, 12) }).map((_, idx) => (
                          <div 
                            key={idx}
                            className={`rounded-[2px] bg-emerald-800 border border-emerald-950 flex flex-col items-center justify-center text-[6px] text-emerald-200 font-bold shadow-xs ${
                              layoutSettings.showCutLines ? 'ring-1 ring-slate-400/80' : ''
                            }`}
                            style={{
                              aspectRatio: `${layoutSettings.cardWidthMm} / ${layoutSettings.cardHeightMm}`,
                              minHeight: '28px'
                            }}
                          >
                            <span className="text-[5.5px] opacity-80">#{idx + 1}</span>
                            <div className="w-2.5 h-2.5 bg-white/20 rounded-[1px] my-0.5"></div>
                          </div>
                        ))}
                      </div>

                    </div>

                    {/* Watermark label */}
                    <div className="absolute bottom-1 right-2 text-[7px] font-mono text-slate-400 select-none">
                      {PAPER_SIZE_SPECS[layoutSettings.paperSize].name} • {layoutSettings.orientation.toUpperCase()}
                    </div>
                  </div>

                  {/* Dimension overlay badge */}
                  <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400">
                    <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                      📐 {sheetCalculations.pageW} × {sheetCalculations.pageH} mm
                    </span>
                    <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-emerald-400">
                      🪪 {sheetCalculations.finalCols} Kolom × {sheetCalculations.finalRows} Baris
                    </span>
                  </div>

                </div>

                {/* Capacity & Consumption Calculation Stats */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Kapasitas Per Lembar:</span>
                    <strong className="text-emerald-400 font-mono font-bold text-sm">
                      {sheetCalculations.cardsPerPage} Kartu / Halaman
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Jumlah Siswa Siap Cetak:</span>
                    <strong className="text-white font-bold">{filteredStudents.length} Siswa</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Format Sisi:</span>
                    <strong className="text-slate-200">
                      {layoutSettings.printSideMode === 'both' ? 'Bolak-Balik (2 Sisi)' : '1 Sisi'}
                    </strong>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
                    <span className="font-bold text-white">Estimasi Kertas Dibutuhkan:</span>
                    <span className="text-emerald-300 font-black font-mono text-sm bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                      {sheetCalculations.totalPagesNeeded} Lembar {PAPER_SIZE_SPECS[layoutSettings.paperSize].name}
                    </span>
                  </div>
                </div>

                {/* Quick Print Trigger Button */}
                <button
                  type="button"
                  onClick={() => handlePrintStudents(filteredStudents)}
                  disabled={filteredStudents.length === 0}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Lembar Massal Sekarang ({filteredStudents.length} Siswa)</span>
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMENU 3: PRATINJAU KARTU INDIVIDU LIVE                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'pratinjau-individu' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
          
          {/* Left Column: Student Selector */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-400" />
                  <span>Pilih Siswa untuk Pratinjau</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Pilih nama siswa untuk melihat wujud kartu PVC secara nyata.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Daftar Siswa ({students.length}):</label>
                <select
                  value={activePreviewStudent?.id || ''}
                  onChange={(e) => setPreviewStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-bold text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.class}) - NISN: {s.nisn}
                    </option>
                  ))}
                </select>
              </div>

              {activePreviewStudent && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Nama Siswa:</span>
                    <strong className="text-white">{activePreviewStudent.name}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Nomor NISN:</span>
                    <strong className="text-emerald-400 font-mono">{activePreviewStudent.nisn}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Kelas / Rombel:</span>
                    <strong className="text-white">{activePreviewStudent.class}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Jenis Kelamin:</span>
                    <strong className="text-white">{activePreviewStudent.gender === 'P' ? 'Perempuan' : 'Laki-Laki'}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tahun Ajaran:</span>
                    <strong className="text-emerald-300">{currentTa}</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-3">
              <button
                type="button"
                onClick={() => setPreviewSide(s => s === 'front' ? 'back' : 'front')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs py-3 rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Rotate3d className="w-4 h-4" />
                <span>Balik Sisi Kartu ({previewSide === 'front' ? 'Ke Sisi Belakang / QR' : 'Ke Sisi Depan'})</span>
              </button>

              {activePreviewStudent && (
                <button
                  type="button"
                  onClick={() => handlePrintStudents([activePreviewStudent])}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Kartu Satuan Siswa Ini</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Live Card Mockup Stage */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[460px] shadow-xl relative overflow-hidden">
            
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                Pratinjau Live {previewSide === 'front' ? 'Sisi Depan (Identitas)' : 'Sisi Belakang (QR Code)'}
              </span>
            </div>

            {activePreviewStudent ? (
              <div className="w-[280px] h-[440px] rounded-3xl bg-white border-2 border-[#0F3B2E] shadow-2xl overflow-hidden flex flex-col justify-between relative select-none animate-in zoom-in-95 duration-200">
                
                {/* Lanyard Punch Hole */}
                {layoutSettings.showPunchHole && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full bg-slate-100 border border-slate-300 z-20 shadow-inner"></div>
                )}

                {previewSide === 'front' ? (
                  <>
                    {/* Front Header */}
                    <div className="bg-gradient-to-br from-[#09261E] via-[#0F3B2E] to-[#175443] text-white p-3 pt-6 border-b-2 border-[#D4AF37] text-center relative">
                      <p className="text-[7px] font-bold text-[#D4AF37] tracking-wider uppercase">{settings.kemenagHeader || 'KEMENTERIAN AGAMA RI'}</p>
                      <h4 className="text-[9px] font-black uppercase text-white leading-tight mt-0.5 line-clamp-2">{settings.sekolah || 'MADRASAH ALIYAH DIGITAL'}</h4>
                      <p className="text-[6.5px] text-slate-300 mt-0.5 truncate">{settings.alamatSekolah || 'Jl. Pendidikan Karakter No. 7'}</p>
                    </div>

                    {/* Arch Gold Badge */}
                    <div className="flex justify-center -mt-3 z-10">
                      <div className="w-6 h-6 rounded-full bg-[#0F3B2E] border border-[#D4AF37] flex items-center justify-center shadow-md">
                        <GraduationCap className="w-3.5 h-3.5 text-[#D4AF37]" />
                      </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mt-1">
                      <p className="text-[11px] font-black text-[#0F3B2E] tracking-wider">KARTU PRESENSI</p>
                      <p className="text-[9px] font-bold text-[#D4AF37] tracking-widest -mt-0.5">SISWA</p>
                    </div>

                    {/* Table Details */}
                    <div className="px-4 py-1 text-[8.5px] text-[#0F3B2E]">
                      <table className="w-full font-medium">
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-1 text-slate-500 font-bold text-[7.5px] uppercase w-14">NISN</td>
                            <td className="py-1 font-mono font-bold text-emerald-800">: {activePreviewStudent.nisn}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1 text-slate-500 font-bold text-[7.5px] uppercase">Nama</td>
                            <td className="py-1 font-extrabold uppercase text-[8px] truncate max-w-[130px]">: {activePreviewStudent.name}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1 text-slate-500 font-bold text-[7.5px] uppercase">Gender</td>
                            <td className="py-1 font-bold">: {activePreviewStudent.gender === 'P' ? 'Perempuan' : 'Laki-Laki'}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1 text-slate-500 font-bold text-[7.5px] uppercase">Kelas</td>
                            <td className="py-1 font-bold text-emerald-900">: {activePreviewStudent.class}</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-slate-500 font-bold text-[7.5px] uppercase">T.A</td>
                            <td className="py-1 font-bold">: {currentTa}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Front Footer */}
                    <div className="bg-gradient-to-r from-[#09261E] to-[#0F3B2E] text-[#D4AF37] p-2 text-center text-[7px] font-bold border-t border-[#D4AF37]">
                      {layoutSettings.customFooterText || 'Hadir, Belajar, Berprestasi Untuk Masa Depan'}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Back Header */}
                    <div className="p-3 pt-7 text-center">
                      <span className="inline-block bg-[#0F3B2E] text-[#D4AF37] text-[8px] font-extrabold px-3 py-1 rounded-md border border-[#D4AF37]">
                        KODE QR RESMI PRESENSI
                      </span>
                    </div>

                    {/* QR Code Big */}
                    <div className="flex flex-col items-center justify-center px-4">
                      <div className="w-36 h-36 bg-white p-2 rounded-2xl border-2 border-[#D4AF37] shadow-md flex items-center justify-center">
                        {qrUrls[activePreviewStudent.id] ? (
                          <img src={qrUrls[activePreviewStudent.id]} alt="QR" className="w-full h-full object-contain" />
                        ) : (
                          <QrIcon className="w-12 h-12 text-slate-300 animate-spin" />
                        )}
                      </div>
                      <span className="mt-2 font-mono font-black text-[9px] text-[#0F3B2E] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        NISN: {activePreviewStudent.nisn}
                      </span>
                    </div>

                    {/* Security Notice */}
                    <div className="mx-3 my-1 p-2 bg-slate-50 border border-[#D4AF37] rounded-xl text-left text-[7px] text-slate-700">
                      <p className="font-extrabold text-[#0F3B2E]">AUTENTIKASI DIGITAL MADRASAH</p>
                      <p className="text-[6.5px] text-slate-500 leading-tight mt-0.5">Wajib dibawa setiap hari saat presensi kedatangan & kepulangan.</p>
                    </div>

                    {/* Back Footer */}
                    <div className="h-2 bg-[#0F3B2E] border-t border-[#D4AF37]"></div>
                  </>
                )}

              </div>
            ) : null}

          </div>

        </div>
      )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
};
