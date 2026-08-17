import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Student, IDCardPrintLayout } from '../types';
import { SubNavHeader } from '../components/SubNavHeader';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { 
  Printer, Search, Filter, Download, GraduationCap, Sparkles, User, 
  RefreshCw, Sliders, Check, CreditCard, LayoutGrid, Layers, 
  FileText, ShieldCheck, Phone, CheckCircle2, ChevronRight, Eye,
  Building2, QrCode as QrIcon, Lock, Sparkle, HelpCircle, Palette,
  BadgeCheck, Rotate3d, Maximize2
} from 'lucide-react';

interface PrintSizeOption {
  id: IDCardPrintLayout;
  title: string;
  subtitle: string;
  dimension: string;
  orientation: 'Landscape' | 'Portrait' | 'Multi A4 Grid';
  cardsPerPage: string;
  recommended: string;
  icon: any;
}

const PRINT_SIZE_PRESETS: PrintSizeOption[] = [
  {
    id: 'grid-a4',
    title: 'Lembar Grid Kertas A4 (Standar Massal)',
    subtitle: '8–10 kartu tersusun rapi dalam 1 lembar A4 dengan garis potong gunting (Cut Line)',
    dimension: '54 × 85.6 mm (Grid A4 Vertikal)',
    orientation: 'Multi A4 Grid',
    cardsPerPage: '8–10 Kartu / Halaman A4',
    recommended: 'Sangat hemat kertas & paling praktis untuk dibagikan ke satu kelas',
    icon: LayoutGrid
  },
  {
    id: 'cr80-pvc-portrait',
    title: 'Standar ID Card PVC CR-80 (Portrait / Vertikal)',
    subtitle: 'Ukuran standar Kartu Pelajar tegak / vertikal untuk mesin cetak PVC & Lanyard',
    dimension: '54.0 mm × 85.6 mm',
    orientation: 'Portrait',
    cardsPerPage: '1 Kartu / Halaman (Ukuran Pas PVC)',
    recommended: 'Printer Kartu PVC / Lanyard Gantung Vertikal',
    icon: CreditCard
  },
  {
    id: 'cr80-pvc-landscape',
    title: 'Standar ID Card PVC CR-80 (Landscape)',
    subtitle: 'Ukuran horizontal untuk printer PVC atau holder mika kartu pelajar',
    dimension: '85.6 mm × 54.0 mm',
    orientation: 'Landscape',
    cardsPerPage: '1 Kartu / Halaman',
    recommended: 'Holder Mika Horizontal / Dompet Kartu',
    icon: CreditCard
  },
  {
    id: 'badge-lanyard',
    title: 'Badge Lanyard Sedang (B4 / A6)',
    subtitle: 'Ukuran badge gantung leher sedang dengan QR & identitas siswa ekstra jelas terlihat',
    dimension: '70.0 mm × 100.0 mm',
    orientation: 'Portrait',
    cardsPerPage: '4 Kartu / Halaman A4',
    recommended: 'Kartu Peserta Ujian / Lanyard B4',
    icon: Layers
  }
];

export const KartuQrView: React.FC = () => {
  const { 
    students, settings, selectedStudentForCard, setSelectedStudentForCard,
    activeAcademicYear, getActiveSubTab, setActiveSubTab
  } = useApp();

  const activeSubTab = getActiveSubTab('Kartu QR') || 'cetak-massal';
  
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('SEMUA');
  const [selectedLayout, setSelectedLayout] = useState<IDCardPrintLayout>('grid-a4');
  const [cardTheme, setCardTheme] = useState<'madrasah-gold' | 'royal-blue' | 'modern-dark'>('madrasah-gold');
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
  
  // Customization Options
  const [showCutLines, setShowCutLines] = useState(true);
  const [showPunchHole, setShowPunchHole] = useState(true);
  const [printSideMode, setPrintSideMode] = useState<'both' | 'front-only' | 'back-only'>('both');
  const [showSchoolLogo, setShowSchoolLogo] = useState(true);
  const [singleStudentId, setSingleStudentId] = useState<string>('ALL');

  // Preview interactive state
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const [previewStudentId, setPreviewStudentId] = useState<string>('');

  // Handle selected student passed from other views
  useEffect(() => {
    if (selectedStudentForCard) {
      setSingleStudentId(selectedStudentForCard.id);
      setSelectedClass(selectedStudentForCard.class);
      setPreviewStudentId(selectedStudentForCard.id);
    }
  }, [selectedStudentForCard]);

  const classes = ['SEMUA', ...Array.from(new Set(students.map(s => s.class))).sort()];

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.nisn.includes(search);
    const matchClass = selectedClass === 'SEMUA' || s.class === selectedClass;
    const matchSingle = singleStudentId === 'ALL' || s.id === singleStudentId;
    return matchSearch && matchClass && matchSingle;
  });

  // Current academic year display from active academic year or settings
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

  // Generate QR code data URLs for students with high error correction and crisp resolution
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

  // Handler for printing students
  const handlePrintStudents = (studentsToPrint: Student[]) => {
    if (studentsToPrint.length === 0) return;

    const schoolName = settings.sekolah || 'MADRASAH ALIYAH DIGITAL';
    const schoolAddress = settings.alamatSekolah || 'Jl. Pendidikan Karakter No. 7, Jakarta';
    const schoolSubHeader = settings.kemenagHeader || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA';

    const logoImgTag = showSchoolLogo && settings.logoUrl 
      ? `<img src="${settings.logoUrl}" style="height: 28px; width: 28px; max-width: 32px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" />`
      : `<div style="width: 26px; height: 26px; border-radius: 6px; background: rgba(212,175,55,0.2); border: 1px solid #D4AF37; display: flex; align-items: center; justify-content: center; font-size: 13px;">🕌</div>`;

    // Sisi Depan Kartu Presensi Format Hijau-Emas Madrasah
    const renderFrontCardHtml = (student: Student) => `
      <div class="card-box card-front">
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
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="#D4AF37" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
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

        <!-- Tabel Identitas Siswa - Proposional 1 Baris Per Kolom -->
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
            <svg viewBox="0 0 24 24" width="12" height="12" fill="#D4AF37">
              <path d="M12 2L15 8L21 9L17 14L18 20L12 17L6 20L7 14L3 9L9 8L12 2Z"></path>
            </svg>
          </div>
          <div class="footer-motto-text">Hadir, Belajar, Berprestasi Untuk Masa Depan</div>
        </div>

      </div>
    `;

    // Sisi Belakang Kartu Presensi
    const renderBackCardHtml = (student: Student) => {
      const qrData = qrUrls[student.id] || '';
      return `
        <div class="card-box card-back">
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
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="#0F3B2E" stroke-width="2.5" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div class="security-content">
              <div class="security-title">AUTENTIKASI DIGITAL MADRASAH</div>
              <div class="security-desc">Kartu ini wajib dibawa setiap hari saat presensi kedatangan & kepulangan.</div>
              <div class="security-school-info">${schoolName} • TA ${currentTa}</div>
            </div>
          </div>

          <div class="card-footer-madrasah-back"></div>
        </div>
      `;
    };

    const basePrintCss = `
      @page {
        size: A4 portrait;
        margin: 8mm 6mm;
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
      }
      .page-container {
        display: grid;
        grid-template-columns: repeat(2, 54mm);
        justify-content: center;
        gap: 6mm 10mm;
        margin: 0 auto;
      }
      .card-wrapper-item {
        width: 54mm;
        height: 85.6mm;
        position: relative;
        page-break-inside: avoid;
        break-inside: avoid;
        ${showCutLines ? 'outline: 1px dashed #cbd5e1;' : ''}
      }
      .card-box {
        width: 54mm;
        height: 85.6mm;
        border-radius: 4mm;
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
        width: 32mm;
        height: 32mm;
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

    // Generate output HTML cards based on student list and side settings
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
          <title>Kartu Presensi Siswa - ${schoolName}</title>
          <style>
            ${basePrintCss}
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

    const printWin = window.open('', '_blank', 'width=980,height=800');
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

  const selectedPreset = PRINT_SIZE_PRESETS.find(p => p.id === selectedLayout) || PRINT_SIZE_PRESETS[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Submenu Navigation Header */}
      <SubNavHeader
        currentTab="Kartu QR"
        activeSubTab={activeSubTab}
        onSelectSubTab={(id) => setActiveSubTab('Kartu QR', id)}
        badgeCounts={{
          'cetak-massal': `${filteredStudents.length} Siap Cetak`,
          'desain-kustom': selectedPreset.dimension.split(' ')[0],
          'pratinjau-individu': 'Live PVC'
        }}
        extraActions={
          <button
            onClick={() => handlePrintStudents(filteredStudents)}
            disabled={filteredStudents.length === 0}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Langsung ({filteredStudents.length})</span>
          </button>
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
          {/* SUBMENU 1: CETAK LEMBAR A4 MASSAL & DAFTAR SISWA                          */}
          {/* ========================================================================= */}
          {activeSubTab === 'cetak-massal' && (
            <div className="space-y-6">
          
          {/* Top Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-6 rounded-3xl border border-emerald-500/30 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-lg">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    TEMPLAT HIJAU-EMAS RESMI MADRASAH
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                    CR-80 / PVC
                  </span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Cetak Lembar Massal Kartu Presensi Siswa
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Format identitas resmi madrasah beraksen emas dengan QR Code presisi, tabel identitas 1 baris proposional, dan siap cetak langsung ke printer atau simpan PDF.
                </p>
              </div>
            </div>

            <button
              onClick={() => handlePrintStudents(filteredStudents)}
              disabled={filteredStudents.length === 0}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 self-start md:self-center"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak {filteredStudents.length === 1 ? '1 Kartu Terpilih' : `Semua Kartu (${filteredStudents.length} Siswa)`}</span>
            </button>
          </div>

          {/* Filter and Search Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama siswa atau NISN..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSingleStudentId('ALL');
                }}
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
                  <span>Daftar Siswa Siap Cetak Kartu</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Menampilkan {filteredStudents.length} siswa dengan data terisi lengkap untuk kartu presensi.
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
                  <span>Cetak Lembar A4 ({filteredStudents.length})</span>
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
      {/* SUBMENU 2: DESAIN & FORMAT KARTU                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'desain-kustom' && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-xl animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-white">Kustomisasi Dimensi & Opsi Desain</h3>
                <p className="text-xs text-slate-400 mt-0.5">Pilih standar ukuran cetak, slot tali lanyard, dan kelengkapan sisi kartu.</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full self-start sm:self-auto font-bold">
              {selectedPreset.dimension} • {currentTa}
            </span>
          </div>

          {/* Print Size Presets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRINT_SIZE_PRESETS.map(preset => {
              const isSelected = selectedLayout === preset.id;
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedLayout(preset.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-white line-clamp-1">{preset.title}</p>
                    <p className="text-[10px] text-emerald-400 font-mono font-semibold mt-0.5">{preset.dimension}</p>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{preset.subtitle}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[9px] text-slate-400 font-mono">
                    {preset.cardsPerPage}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Customization Options Bar */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Fitur & Kelengkapan Kartu:</h4>
            
            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={showPunchHole}
                  onChange={(e) => setShowPunchHole(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-white block">Lubang Tali Lanyard</span>
                  <span className="text-[10px] text-slate-400">Slot punch 14×3mm di atas kartu</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={showCutLines}
                  onChange={(e) => setShowCutLines(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-white block">Garis Potong Gunting</span>
                  <span className="text-[10px] text-slate-400">Garis pemandu potong di lembar A4</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={showSchoolLogo}
                  onChange={(e) => setShowSchoolLogo(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-white block">Logo Madrasah / Sekolah</span>
                  <span className="text-[10px] text-slate-400">Tampilkan logo resmi pada header</span>
                </div>
              </label>
            </div>

            {/* Sisi Cetak Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
              <div className="text-xs">
                <span className="font-bold text-white block">Format Sisi Cetak Kartu:</span>
                <span className="text-[11px] text-slate-400">Tentukan apakah ingin mencetak dua sisi sekaligus atau hanya salah satu sisi.</span>
              </div>
              <select
                value={printSideMode}
                onChange={(e) => setPrintSideMode(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-emerald-400 font-bold text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="both">Bolak-Balik (Sisi Depan & Belakang)</option>
                <option value="front-only">Sisi Depan Saja (Identitas Siswa)</option>
                <option value="back-only">Sisi Belakang Saja (QR Code Presensi)</option>
              </select>
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
                {showPunchHole && (
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
                      Hadir, Belajar, Berprestasi Untuk Masa Depan
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
