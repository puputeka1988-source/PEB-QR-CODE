import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Student, IDCardPrintLayout } from '../types';
import QRCode from 'qrcode';
import { 
  Printer, Search, Filter, Download, GraduationCap, Sparkles, User, 
  RefreshCw, Sliders, Check, CreditCard, LayoutGrid, Layers, 
  FileText, ShieldCheck, Phone, CheckCircle2, ChevronRight, Eye,
  Building2, QrCode as QrIcon, Lock, Sparkle, HelpCircle, Palette,
  BadgeCheck
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
    activeAcademicYear
  } = useApp();
  
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

  // Handle selected student passed from other views
  useEffect(() => {
    if (selectedStudentForCard) {
      setSingleStudentId(selectedStudentForCard.id);
      setSelectedClass(selectedStudentForCard.class);
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

  const handlePrintStudents = (studentsToPrint: Student[]) => {
    if (studentsToPrint.length === 0) return;

    const schoolName = settings.sekolah || 'MADRASAH ALIYAH NEGERI 1';
    const schoolNpsn = settings.npsn ? `NPSN: ${settings.npsn}` : '';
    const schoolAddress = settings.alamat || 'Jl. Pendidikan No. 1';
    const schoolSubHeader = settings.instansi || 'KEMENTERIAN AGAMA RI';

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
              <td class="col-icon">
                <span class="detail-icon">🪪</span>
              </td>
              <td class="col-label">NISN</td>
              <td class="col-colon">:</td>
              <td class="col-value font-mono font-bold">${student.nisn}</td>
            </tr>
            <tr>
              <td class="col-icon">
                <span class="detail-icon">👤</span>
              </td>
              <td class="col-label">NAMA</td>
              <td class="col-colon">:</td>
              <td class="col-value font-bold text-uppercase name-value">${student.name}</td>
            </tr>
            <tr>
              <td class="col-icon">
                <span class="detail-icon">🚻</span>
              </td>
              <td class="col-label">JK</td>
              <td class="col-colon">:</td>
              <td class="col-value font-bold">${student.gender === 'P' ? 'PEREMPUAN' : 'LAKI-LAKI'}</td>
            </tr>
            <tr>
              <td class="col-icon">
                <span class="detail-icon">🏫</span>
              </td>
              <td class="col-label">KELAS</td>
              <td class="col-colon">:</td>
              <td class="col-value font-bold">${student.class}</td>
            </tr>
            <tr>
              <td class="col-icon">
                <span class="detail-icon">📅</span>
              </td>
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

    // Sisi Belakang Kartu Format Hijau-Emas Madrasah
    const renderBackCardHtml = (student: Student) => `
      <div class="card-box card-back">
        ${showPunchHole ? '<div class="punch-hole-slot"></div>' : ''}

        <!-- Header Belakang -->
        <div class="back-header-section">
          <div class="back-card-title">KARTU PRESENSI SISWA</div>
          <div class="back-stars-ornament">✦ ✦ ✦</div>
        </div>

        <!-- QR Code Display Box -->
        <div class="qr-container-box">
          <div class="qr-frame-inner">
            ${qrUrls[student.id] ? `<img src="${qrUrls[student.id]}" class="qr-image" />` : ''}
            ${showSchoolLogo && settings.logoUrl ? `<img src="${settings.logoUrl}" class="qr-center-emblem" />` : ''}
          </div>
        </div>

        <!-- Petunjuk Scan -->
        <div class="scan-instruction-box">
          <p class="scan-instruction-text">Tempelkan kartu ini pada scanner QR Code saat presensi</p>
          <div class="nfc-wave-icon">((( • )))</div>
        </div>

        <!-- Kotak Himbauan Keamanan / Legalitas -->
        <div class="security-card-box">
          <div class="security-badge-icon">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="#D4AF37" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div class="security-content">
            <div class="security-title">JAGA KARTU INI</div>
            <div class="security-desc">Kartu ini adalah identitas resmi. Jika hilang, segera laporkan ke pihak madrasah.</div>
            <div class="security-school-info">${schoolName} ${schoolNpsn ? `• ${schoolNpsn}` : ''}</div>
          </div>
        </div>

        <!-- Footer Belakang -->
        <div class="card-footer-madrasah-back"></div>
      </div>
    `;

    // CSS Styling for Print Output (High Definition Precision & Single-Line Guarantee)
    const basePrintCss = `
      @page {
        size: ${selectedLayout === 'grid-a4' ? 'A4 portrait' : selectedLayout === 'cr80-pvc-landscape' ? '85.6mm 54mm landscape' : '54mm 85.6mm portrait'};
        margin: ${selectedLayout === 'grid-a4' ? '5mm' : '0'};
      }
      * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body {
        margin: 0;
        padding: 0;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background: #ffffff;
        color: #0f172a;
      }
      .page-container {
        display: flex;
        flex-wrap: wrap;
        gap: 4mm 4mm;
        justify-content: center;
        align-items: flex-start;
      }
      .card-wrapper-item {
        page-break-inside: avoid;
        break-inside: avoid;
        margin: 1.5mm;
        ${showCutLines ? 'border: 1px dashed #94a3b8; padding: 1.5mm; border-radius: 10px;' : ''}
      }
      
      /* Card Body Core */
      .card-box {
        width: 54mm;
        height: 85.6mm;
        background-color: #F8F6F0;
        background-image: radial-gradient(#D4AF37 0.5px, transparent 0.5px);
        background-size: 8px 8px;
        border: 1.5px solid #0F3B2E;
        border-radius: 10px;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      }

      /* Punch Hole Slot */
      .punch-hole-slot {
        width: 14mm;
        height: 3mm;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 3mm;
        position: absolute;
        top: 2mm;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10;
      }

      /* Header Madrasah Deep Green */
      .card-header-madrasah {
        background: linear-gradient(145deg, #0F3B2E, #09261E);
        padding: ${showPunchHole ? '5.5mm 2mm 2mm 2mm' : '2.5mm 2mm 2mm 2mm'};
        color: #ffffff;
        text-align: left;
        position: relative;
        border-bottom: 2px solid #D4AF37;
      }
      .header-content {
        display: flex;
        align-items: center;
        gap: 1.5mm;
      }
      .header-logo {
        flex-shrink: 0;
        display: flex;
        align-items: center;
      }
      .header-text {
        flex: 1;
        min-width: 0;
      }
      .instansi-title {
        font-size: 4.6pt;
        font-weight: 700;
        color: #D4AF37;
        text-transform: uppercase;
        letter-spacing: 0.2px;
        line-height: 1.1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .school-title {
        font-size: 5.4pt;
        font-weight: 900;
        color: #ffffff;
        text-transform: uppercase;
        letter-spacing: 0.1px;
        line-height: 1.15;
        margin-top: 0.2mm;
        word-break: break-word;
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

      /* Arched Divider with Center Badge */
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

      /* Title Section */
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

      /* Table Student Details - Strictly Single Line Guaranteed */
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
      }
      .font-mono { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; }
      .font-bold { font-weight: 800; }
      .text-uppercase { text-transform: uppercase; }

      /* Footer Madrasah */
      .card-footer-madrasah {
        background: linear-gradient(145deg, #09261E, #0F3B2E);
        border-top: 1.5px solid #D4AF37;
        padding: 1.8mm 1.5mm;
        text-align: center;
        color: #ffffff;
      }
      .footer-leaf-icon {
        display: flex;
        justify-content: center;
        margin-bottom: 0.2mm;
      }
      .footer-motto-text {
        font-size: 4.3pt;
        font-style: italic;
        font-weight: 600;
        color: #E2E8F0;
        letter-spacing: 0.2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* BACK SIDE STYLING */
      .card-back {
        background: #F8F6F0;
      }
      .back-header-section {
        background: linear-gradient(145deg, #0F3B2E, #09261E);
        border-bottom: 2px solid #D4AF37;
        padding: ${showPunchHole ? '6mm 2mm 2mm 2mm' : '3mm 2mm 2mm 2mm'};
        text-align: center;
        color: #ffffff;
      }
      .back-card-title {
        font-size: 7pt;
        font-weight: 900;
        color: #D4AF37;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .back-stars-ornament {
        font-size: 4.5pt;
        color: #D4AF37;
        letter-spacing: 2px;
        margin-top: 0.2mm;
      }

      /* QR Display Inner */
      .qr-container-box {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 1mm 0 0.5mm 0;
      }
      .qr-frame-inner {
        width: 32mm;
        height: 32mm;
        background: #ffffff;
        border: 1.8px solid #D4AF37;
        border-radius: 6px;
        padding: 1.5mm;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      }
      .qr-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .qr-center-emblem {
        position: absolute;
        width: 6.5mm;
        height: 6.5mm;
        border-radius: 50%;
        border: 1px solid #D4AF37;
        background: #ffffff;
        padding: 0.5mm;
        object-fit: contain;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }

      /* Scan Instruction */
      .scan-instruction-box {
        text-align: center;
        padding: 0 2.5mm;
      }
      .scan-instruction-text {
        font-size: 4.8pt;
        font-weight: 700;
        color: #0F3B2E;
        margin: 0;
        line-height: 1.15;
      }
      .nfc-wave-icon {
        font-size: 6pt;
        font-weight: bold;
        color: #D4AF37;
        margin-top: 0.2mm;
        letter-spacing: 1px;
      }

      /* Security Notice Card */
      .security-card-box {
        margin: 0.5mm 2.5mm 1.5mm 2.5mm;
        background: #ffffff;
        border: 1px solid #D4AF37;
        border-radius: 5px;
        padding: 1.2mm 1.5mm;
        display: flex;
        align-items: center;
        gap: 1.2mm;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      }
      .security-badge-icon {
        flex-shrink: 0;
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
    <div className="space-y-6">
      
      {/* Header Bar */}
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
              Cetak Kartu Presensi Siswa (Edisi Elegan Hijau & Emas)
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Format identitas resmi madrasah/sekolah beraksen emas mewah dengan QR Code presisi, tabel identitas 1 baris proposional, dan siap cetak langsung ke printer atau PDF.
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

      {/* SECTION: Konfigurasi Cetak & Kustomisasi */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">1. Pengaturan Ukuran & Opsi Cetak</h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full self-start sm:self-auto">
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
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          
          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showPunchHole}
                onChange={(e) => setShowPunchHole(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
              />
              <span>Lubang Tali Lanyard (Slot Punch)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showCutLines}
                onChange={(e) => setShowCutLines(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
              />
              <span>Garis Potong Gunting (Cut Guide)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showSchoolLogo}
                onChange={(e) => setShowSchoolLogo(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
              />
              <span>Logo Sekolah</span>
            </label>
          </div>

          {/* Sisi Cetak Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Format Sisi Cetak:</span>
            <select
              value={printSideMode}
              onChange={(e) => setPrintSideMode(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-emerald-400 font-semibold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="both">Bolak-Balik (Sisi Depan & Belakang)</option>
              <option value="front-only">Sisi Depan Saja (Identitas Siswa)</option>
              <option value="back-only">Sisi Belakang Saja (QR Code Presensi)</option>
            </select>
          </div>

        </div>

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

      {/* DAFTAR SISWA SIAP CETAK (TABEL DATA LENGKAP) */}
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
              <span>Cetak Massal ({filteredStudents.length})</span>
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
                      <button
                        type="button"
                        onClick={() => handlePrintStudents([student])}
                        className="bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 hover:border-emerald-500 inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
                        <span>Cetak Kartu</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

