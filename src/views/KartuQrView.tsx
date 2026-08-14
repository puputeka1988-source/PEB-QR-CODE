import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Student, IDCardPrintLayout } from '../types';
import QRCode from 'qrcode';
import { 
  Printer, Search, Filter, Download, GraduationCap, Sparkles, User, 
  RefreshCw, Sliders, Check, CreditCard, LayoutGrid, Layers, 
  FileText, ShieldCheck, Phone, CheckCircle2, ChevronRight, Eye
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
    dimension: '85.6 × 54.0 mm per kartu (Grid A4)',
    orientation: 'Multi A4 Grid',
    cardsPerPage: '8–10 Kartu / Halaman',
    recommended: 'Sangat hemat kertas & paling praktis untuk dibagikan ke satu kelas',
    icon: LayoutGrid
  },
  {
    id: 'cr80-pvc-landscape',
    title: 'Standar ID Card PVC CR-80 (Landscape)',
    subtitle: 'Ukuran standar Kartu Pelajar / KTP / ATM horizontal untuk cetak langsung pada printer PVC atau holder mika',
    dimension: '85.6 mm × 54.0 mm',
    orientation: 'Landscape',
    cardsPerPage: '1 Kartu / Halaman (Ukuran Pas)',
    recommended: 'Printer Kartu PVC / Mesin Cetak Khusus Kartu ID',
    icon: CreditCard
  },
  {
    id: 'cr80-pvc-portrait',
    title: 'Standar ID Card PVC CR-80 (Portrait)',
    subtitle: 'Ukuran standar Kartu Pelajar tegak / vertikal untuk gantungan tali Lanyard',
    dimension: '54.0 mm × 85.6 mm',
    orientation: 'Portrait',
    cardsPerPage: '1 Kartu / Halaman (Ukuran Pas)',
    recommended: 'Lanyard Kartu Gantung Vertikal Standar',
    icon: CreditCard
  },
  {
    id: 'badge-lanyard',
    title: 'Badge Lanyard Sedang (B4 / A6)',
    subtitle: 'Ukuran badge gantung leher sedang dengan QR & identitas siswa ekstra jelas terlihat',
    dimension: '70.0 mm × 100.0 mm',
    orientation: 'Portrait',
    cardsPerPage: '4 Kartu / Halaman A4 atau Satuan',
    recommended: 'Kartu Peserta Ujian / Panitia / Lanyard B4',
    icon: Layers
  },
  {
    id: 'pocket-mini',
    title: 'Kartu Saku Kompak / Dompet',
    subtitle: 'Ukuran mini praktis untuk diselipkan di saku seragam sekolah atau sampul buku catatan',
    dimension: '60.0 mm × 90.0 mm',
    orientation: 'Portrait',
    cardsPerPage: '6 Kartu / Halaman A4',
    recommended: 'Buku Catatan / Saku Seragam Siswa',
    icon: FileText
  }
];

export const KartuQrView: React.FC = () => {
  const { students, settings, selectedStudentForCard, setSelectedStudentForCard } = useApp();
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('SEMUA');
  const [selectedLayout, setSelectedLayout] = useState<IDCardPrintLayout>('grid-a4');
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
  
  // Customization Options
  const [showCutLines, setShowCutLines] = useState(true);
  const [showBackSide, setShowBackSide] = useState(false);
  const [showSchoolLogo, setShowSchoolLogo] = useState(true);
  const [showGenderBadge, setShowGenderBadge] = useState(true);
  const [singleStudentId, setSingleStudentId] = useState<string>('ALL');
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');

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

  // Generate QR code data URLs for students
  useEffect(() => {
    const generateAllQrs = async () => {
      const mapping: Record<string, string> = {};
      for (const s of students) {
        try {
          const url = await QRCode.toDataURL(s.nisn, {
            width: 250,
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          });
          mapping[s.id] = url;
        } catch (err) {
          console.error('Failed to generate QR for', s.name, err);
        }
      }
      setQrUrls(mapping);
    };

    generateAllQrs();
  }, [students]);

  const handlePrint = () => {
    if (filteredStudents.length === 0) return;

    const schoolName = settings.sekolah || 'SEKOLAH DIGITAL';
    const schoolNpsn = settings.npsn ? `NPSN: ${settings.npsn}` : '';
    const schoolAddress = settings.alamat || 'Indonesia';
    const logoImgTag = showSchoolLogo && settings.logoUrl 
      ? `<img src="${settings.logoUrl}" style="height: 32px; width: auto; max-width: 48px; object-fit: contain;" />`
      : `<div style="font-weight: 900; font-size: 13px; color: #059669; letter-spacing: 0.5px;">${schoolName.substring(0, 16)}</div>`;

    // Rules on back side
    const backSideHtml = (student: Student) => `
      <div class="id-card id-card-back" style="display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid;">
        <div style="border-bottom: 1.5px solid #059669; padding-bottom: 4px; display: flex; align-items: center; justify-content: space-between;">
          <div style="font-size: 9px; font-weight: bold; color: #0f172a; text-transform: uppercase;">KETENTUAN KARTU PRESENSI</div>
          <div style="font-size: 8px; font-weight: bold; color: #059669;">${settings.tahunAjaran || '2025/2026'}</div>
        </div>
        <div style="font-size: 8px; color: #334155; line-height: 1.4; margin: 4px 0;">
          <ol style="margin: 0; padding-left: 14px;">
            <li>Kartu ini adalah identitas resmi presensi kehadiran siswa <strong>${schoolName}</strong>.</li>
            <li>Wajib dibawa dan dipindai (scan QR) setiap hadir & pulang sekolah.</li>
            <li>Tidak boleh dicoret, dilipat ekstrem, atau dipindahtangankan.</li>
            <li>Jika kartu hilang/rusak, segera lapor ke admin presensi sekolah.</li>
          </ol>
        </div>
        <div style="border-top: 1px dashed #cbd5e1; padding-top: 3px; font-size: 7.5px; color: #64748b; text-align: center;">
          ${schoolAddress} • ${schoolNpsn}
        </div>
      </div>
    `;

    // Render cards HTML based on selected layout
    let cardsHtml = '';
    let pageCss = '';

    if (selectedLayout === 'grid-a4') {
      pageCss = `
        @page { size: A4 portrait; margin: 8mm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #0f172a; }
        .page-container { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-start; }
        .id-card-wrapper { margin: 4px; ${showCutLines ? 'border: 1px dashed #94a3b8; padding: 4px; border-radius: 14px;' : ''} page-break-inside: avoid; }
        .id-card { 
          width: 85.6mm; 
          height: 54mm; 
          border: 1.5px solid #0f172a; 
          border-radius: 10px; 
          padding: 8px 10px; 
          background: #ffffff; 
          box-sizing: border-box;
          display: flex; 
          flex-direction: column; 
          justify-content: space-between; 
          position: relative;
        }
      `;

      cardsHtml = filteredStudents.map(s => `
        <div class="id-card-wrapper">
          <div class="id-card">
            <div style="border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 6px;">
                ${logoImgTag}
                <div>
                  <div style="font-size: 8.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; line-height: 1;">${schoolName}</div>
                  <div style="font-size: 7px; color: #059669; font-weight: 600; margin-top: 1px;">KARTU PRESENSI SISWA</div>
                </div>
              </div>
              <span style="font-size: 8.5px; font-weight: 800; background: #0f172a; color: #ffffff; padding: 2px 7px; border-radius: 4px; font-family: monospace;">${s.class}</span>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 4px 0;">
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 11px; font-weight: 900; color: #0f172a; line-height: 1.2; word-break: break-word;">${s.name}</div>
                <div style="font-size: 9.5px; font-family: monospace; font-weight: 700; color: #059669; margin-top: 3px;">NISN: ${s.nisn}</div>
                ${showGenderBadge && s.gender ? `<div style="font-size: 7.5px; color: #64748b; margin-top: 2px;">Jenis Kelamin: ${s.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</div>` : ''}
              </div>
              <div style="width: 58px; height: 58px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 2px; background: #fff; shrink-0; display: flex; align-items: center; justify-content: center;">
                ${qrUrls[s.id] ? `<img src="${qrUrls[s.id]}" style="width: 100%; height: 100%; object-fit: contain;" />` : ''}
              </div>
            </div>

            <div style="border-top: 1px dashed #cbd5e1; padding-top: 3px; font-size: 7px; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
              <span>Pindai QR saat masuk/pulang</span>
              <span style="font-weight: bold; color: #0f172a;">TA: ${settings.tahunAjaran || '2025/2026'}</span>
            </div>
          </div>
        </div>
        ${showBackSide ? `<div class="id-card-wrapper">${backSideHtml(s)}</div>` : ''}
      `).join('');

    } else if (selectedLayout === 'cr80-pvc-landscape') {
      pageCss = `
        @page { size: 85.6mm 54mm landscape; margin: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #0f172a; }
        .page-container { width: 85.6mm; height: 54mm; margin: 0; padding: 0; }
        .id-card { 
          width: 85.6mm; 
          height: 54mm; 
          padding: 8px 10px; 
          background: #ffffff; 
          box-sizing: border-box;
          display: flex; 
          flex-direction: column; 
          justify-content: space-between; 
          page-break-after: always;
        }
      `;

      cardsHtml = filteredStudents.map(s => `
        <div class="id-card">
          <div style="border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              ${logoImgTag}
              <div>
                <div style="font-size: 8.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; line-height: 1;">${schoolName}</div>
                <div style="font-size: 7px; color: #059669; font-weight: 600; margin-top: 1px;">KARTU PRESENSI RESMI</div>
              </div>
            </div>
            <span style="font-size: 8.5px; font-weight: 800; background: #0f172a; color: #ffffff; padding: 2px 7px; border-radius: 4px; font-family: monospace;">${s.class}</span>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 4px 0;">
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 11px; font-weight: 900; color: #0f172a; line-height: 1.2; word-break: break-word;">${s.name}</div>
              <div style="font-size: 9.5px; font-family: monospace; font-weight: 700; color: #059669; margin-top: 3px;">NISN: ${s.nisn}</div>
              ${showGenderBadge && s.gender ? `<div style="font-size: 7.5px; color: #64748b; margin-top: 2px;">Jenis Kelamin: ${s.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</div>` : ''}
            </div>
            <div style="width: 58px; height: 58px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 2px; background: #fff; shrink-0; display: flex; align-items: center; justify-content: center;">
              ${qrUrls[s.id] ? `<img src="${qrUrls[s.id]}" style="width: 100%; height: 100%; object-fit: contain;" />` : ''}
            </div>
          </div>

          <div style="border-top: 1px dashed #cbd5e1; padding-top: 3px; font-size: 7px; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
            <span>Scan pada sensor barcode</span>
            <span style="font-weight: bold; color: #0f172a;">${settings.tahunAjaran || '2025/2026'}</span>
          </div>
        </div>
        ${showBackSide ? backSideHtml(s) : ''}
      `).join('');

    } else if (selectedLayout === 'cr80-pvc-portrait') {
      pageCss = `
        @page { size: 54mm 85.6mm portrait; margin: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #0f172a; }
        .page-container { width: 54mm; height: 85.6mm; margin: 0; padding: 0; }
        .id-card { 
          width: 54mm; 
          height: 85.6mm; 
          padding: 8px; 
          background: #ffffff; 
          box-sizing: border-box;
          display: flex; 
          flex-direction: column; 
          justify-content: space-between; 
          page-break-after: always;
          text-align: center;
        }
      `;

      cardsHtml = filteredStudents.map(s => `
        <div class="id-card">
          <div style="border-bottom: 1.5px solid #059669; padding-bottom: 4px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 2px;">
              ${logoImgTag}
            </div>
            <div style="font-size: 8px; font-weight: 800; color: #0f172a; text-transform: uppercase;">${schoolName}</div>
            <div style="font-size: 6.5px; color: #059669; font-weight: bold;">KARTU PRESENSI SISWA</div>
          </div>

          <div style="margin: 4px 0; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 76px; height: 76px; border: 1.5px solid #0f172a; border-radius: 8px; padding: 2px; background: #fff; margin-bottom: 4px;">
              ${qrUrls[s.id] ? `<img src="${qrUrls[s.id]}" style="width: 100%; height: 100%; object-fit: contain;" />` : ''}
            </div>
            <div style="font-size: 10px; font-weight: 900; color: #0f172a; line-height: 1.2;">${s.name}</div>
            <div style="font-size: 9px; font-family: monospace; font-weight: bold; color: #059669; margin-top: 2px;">NISN: ${s.nisn}</div>
            <span style="font-size: 8px; font-weight: bold; background: #0f172a; color: #ffffff; padding: 1px 8px; border-radius: 4px; margin-top: 3px; font-family: monospace;">KELAS ${s.class}</span>
          </div>

          <div style="border-top: 1px dashed #cbd5e1; padding-top: 3px; font-size: 6.5px; color: #64748b;">
            Pindai QR saat presensi • TA ${settings.tahunAjaran || '2025/2026'}
          </div>
        </div>
        ${showBackSide ? backSideHtml(s) : ''}
      `).join('');

    } else if (selectedLayout === 'badge-lanyard') {
      pageCss = `
        @page { size: 70mm 100mm portrait; margin: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #0f172a; }
        .id-card { 
          width: 70mm; 
          height: 100mm; 
          padding: 10px; 
          background: #ffffff; 
          box-sizing: border-box;
          display: flex; 
          flex-direction: column; 
          justify-content: space-between; 
          page-break-after: always;
          text-align: center;
        }
      `;

      cardsHtml = filteredStudents.map(s => `
        <div class="id-card">
          <div style="border-bottom: 2px solid #059669; padding-bottom: 6px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 3px;">
              ${logoImgTag}
            </div>
            <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase;">${schoolName}</div>
            <div style="font-size: 7.5px; color: #059669; font-weight: bold; letter-spacing: 0.5px;">KARTU TANDA PENGENAL PRESENSI</div>
          </div>

          <div style="margin: 6px 0; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 90px; height: 90px; border: 2px solid #0f172a; border-radius: 10px; padding: 3px; background: #fff; margin-bottom: 6px;">
              ${qrUrls[s.id] ? `<img src="${qrUrls[s.id]}" style="width: 100%; height: 100%; object-fit: contain;" />` : ''}
            </div>
            <div style="font-size: 12px; font-weight: 900; color: #0f172a; line-height: 1.2;">${s.name}</div>
            <div style="font-size: 10.5px; font-family: monospace; font-weight: bold; color: #059669; margin-top: 3px;">NISN: ${s.nisn}</div>
            <div style="margin-top: 4px; display: flex; gap: 4px; justify-content: center;">
              <span style="font-size: 9px; font-weight: bold; background: #0f172a; color: #ffffff; padding: 2px 10px; border-radius: 6px;">${s.class}</span>
              ${s.gender ? `<span style="font-size: 9px; font-weight: bold; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 2px 8px; border-radius: 6px;">${s.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</span>` : ''}
            </div>
          </div>

          <div style="border-top: 1px dashed #cbd5e1; padding-top: 4px; font-size: 7.5px; color: #64748b;">
            Tunjukkan pada scanner kamera presensi • ${settings.tahunAjaran || '2025/2026'}
          </div>
        </div>
        ${showBackSide ? backSideHtml(s) : ''}
      `).join('');

    } else if (selectedLayout === 'pocket-mini') {
      pageCss = `
        @page { size: 60mm 90mm portrait; margin: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #0f172a; }
        .id-card { 
          width: 60mm; 
          height: 90mm; 
          padding: 8px; 
          background: #ffffff; 
          box-sizing: border-box;
          display: flex; 
          flex-direction: column; 
          justify-content: space-between; 
          page-break-after: always;
          text-align: center;
        }
      `;

      cardsHtml = filteredStudents.map(s => `
        <div class="id-card">
          <div style="border-bottom: 1.5px solid #059669; padding-bottom: 4px;">
            <div style="font-size: 8.5px; font-weight: 800; color: #0f172a; text-transform: uppercase;">${schoolName}</div>
            <div style="font-size: 6.5px; color: #059669; font-weight: bold;">KARTU SAKU PRESENSI</div>
          </div>

          <div style="margin: 4px 0; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 80px; height: 80px; border: 1.5px solid #0f172a; border-radius: 8px; padding: 2px; background: #fff; margin-bottom: 4px;">
              ${qrUrls[s.id] ? `<img src="${qrUrls[s.id]}" style="width: 100%; height: 100%; object-fit: contain;" />` : ''}
            </div>
            <div style="font-size: 10.5px; font-weight: 900; color: #0f172a; line-height: 1.2;">${s.name}</div>
            <div style="font-size: 9.5px; font-family: monospace; font-weight: bold; color: #059669; margin-top: 2px;">${s.nisn}</div>
            <span style="font-size: 8px; font-weight: bold; background: #0f172a; color: #ffffff; padding: 1px 8px; border-radius: 4px; margin-top: 3px;">${s.class}</span>
          </div>

          <div style="border-top: 1px dashed #cbd5e1; padding-top: 3px; font-size: 6.5px; color: #64748b;">
            Pindai saat absensi • TA ${settings.tahunAjaran || '2025/2026'}
          </div>
        </div>
        ${showBackSide ? backSideHtml(s) : ''}
      `).join('');
    }

    const printableHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Cetak Kartu QR Siswa - ${schoolName}</title>
          <style>
            ${pageCss}
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            ${cardsHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 300);
            };
          </script>
        </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=950,height=750');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Kartu Identitas QR Code Siswa
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pilih ukuran cetak (Kertas A4 massal, Kartu PVC CR-80, Lanyard Badge, atau Kartu Saku) dengan QR Code presisi tinggi.
          </p>
        </div>

        <button
          onClick={handlePrint}
          disabled={filteredStudents.length === 0}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak {filteredStudents.length === 1 ? '1 Kartu' : `Semua Kartu (${filteredStudents.length})`}</span>
        </button>
      </div>

      {/* SECTION: Pilihan Ukuran & Format Cetak Kartu */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">1. Pilih Ukuran & Format Cetak Kartu ID</h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            {selectedPreset.dimension}
          </span>
        </div>

        {/* Print Size Presets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
                    ? 'bg-slate-800/90 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
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
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-white line-clamp-1">{preset.title}</p>
                  <p className="text-[10px] text-emerald-400 font-mono font-semibold mt-0.5">{preset.dimension}</p>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{preset.subtitle}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[9px] text-slate-500 font-mono">
                  {preset.cardsPerPage}
                </div>
              </button>
            );
          })}
        </div>

        {/* Customization Controls Strip */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 pt-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showCutLines}
                onChange={(e) => setShowCutLines(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
              />
              <span>Garis Panduan Potong (Cut Guide)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showSchoolLogo}
                onChange={(e) => setShowSchoolLogo(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
              />
              <span>Tampilkan Logo Sekolah</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showGenderBadge}
                onChange={(e) => setShowGenderBadge(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
              />
              <span>Badge Jenis Kelamin (L/P)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showBackSide}
                onChange={(e) => setShowBackSide(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
              />
              <span>Cetak 2 Sisi (Sisi Belakang Ketentuan)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Pratinjau Sisi:</span>
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex gap-1">
              <button
                type="button"
                onClick={() => setPreviewSide('front')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  previewSide === 'front' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Muka Depan
              </button>
              <button
                type="button"
                onClick={() => setPreviewSide('back')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  previewSide === 'back' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Muka Belakang
              </button>
            </div>
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
            <option value="ALL">Cetak Semua Siswa Terfilter ({filteredStudents.length})</option>
            {students
              .filter(s => selectedClass === 'SEMUA' || s.class === selectedClass)
              .map(s => (
                <option key={s.id} value={s.id}>
                  Siswa: {s.name} ({s.class})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Live Interactive Card Grid */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-500 text-xs">
          Tidak ada siswa ditemukan. Silakan sesuaikan filter pencarian atau pilih kelas lain.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map(s => (
            <div
              key={s.id}
              className={`bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between transition-all group ${
                showCutLines ? 'border-dashed border-slate-700 hover:border-emerald-500/60' : 'border-slate-800 hover:border-emerald-500/50'
              }`}
            >
              {/* Badge Size Info */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2 min-w-0">
                  {showSchoolLogo && settings.logoUrl ? (
                    <div className="w-8 h-8 rounded-xl bg-white p-1 border border-slate-700 flex items-center justify-center shrink-0">
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider truncate">
                      {settings.sekolah}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">
                      {settings.mataPelajaran ? `Presensi: ${settings.mataPelajaran}` : 'Kartu Pelajar & Presensi'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 shrink-0">
                  {s.class}
                </span>
              </div>

              {/* Card Body - Front Side */}
              {previewSide === 'front' ? (
                <div className="my-4 flex items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500">Nama Lengkap</p>
                      <p className="text-sm font-black text-white truncate">{s.name}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500">NISN / Nomor Induk</p>
                      <p className="text-xs font-mono font-bold text-emerald-400 tracking-wider">
                        {s.nisn}
                      </p>
                    </div>

                    {showGenderBadge && s.gender && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Gender:</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          s.gender === 'P'
                            ? 'bg-pink-500/15 text-pink-400 border-pink-500/30'
                            : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${s.gender === 'P' ? 'bg-pink-400' : 'bg-sky-400'}`}></span>
                          {s.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* QR Code Container */}
                  <div className="bg-white p-2 rounded-2xl shadow-md shrink-0 border border-slate-200">
                    {qrUrls[s.id] ? (
                      <img
                        src={qrUrls[s.id]}
                        alt={`QR ${s.name}`}
                        className="w-24 h-24 object-contain"
                      />
                    ) : (
                      <div className="w-24 h-24 flex items-center justify-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Card Body - Back Side Preview */
                <div className="my-4 p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-[11px] text-slate-300">
                  <p className="font-bold text-emerald-400 text-xs border-b border-slate-800 pb-1">
                    Ketentuan & Tata Tertib:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[10px]">
                    <li>Wajib dibawa & dipindai saat hadir & pulang sekolah.</li>
                    <li>QR Code terenkripsi dengan NISN resmi siswa.</li>
                    <li>Jagalah kartu agar tidak kotor, terlipat, atau basah.</li>
                  </ol>
                  <p className="text-[9px] text-slate-500 pt-1 border-t border-slate-800/80">
                    {settings.alamat || 'SMA Negeri 1 Kita'} • NPSN: {settings.npsn || '20261988'}
                  </p>
                </div>
              )}

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Pindai QR saat presensi
                </span>
                <span className="font-mono font-bold text-slate-400">
                  TA {settings.tahunAjaran || '2025/2026'}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
