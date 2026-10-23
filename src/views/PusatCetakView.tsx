import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { SubNavHeader } from '../components/layout/SubNavHeader';
import { printHtmlDocument } from '../utils/printHelper';
import { 
  cleanDateFormat, 
  generateOfficialKopHtml, 
  getCurrentDateInTimezone,
  formatIndonesianDayAndDate 
} from '../utils/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  FileText, 
  History, 
  QrCode, 
  BookOpen, 
  Award, 
  Calendar, 
  Users, 
  Check, 
  X, 
  FileSpreadsheet, 
  ArrowRight,
  Eye, 
  Sliders, 
  Download, 
  Sparkles,
  Maximize2,
  FileDown,
  RotateCcw,
  Layers,
  ChevronDown
} from 'lucide-react';
import { TeachingJournal, Student } from '../types';

export type DocumentType = 
  | 'jurnal-mengajar'
  | 'rekap-bulanan'
  | 'blangko-absensi'
  | 'buku-nominatif'
  | 'jadwal-mingguan'
  | 'leger-nilai';

export const PusatCetakView: React.FC = () => {
  const { 
    students, 
    attendance, 
    journals, 
    teachingSchedules, 
    gradeSheets, 
    settings, 
    getActiveSubTab, 
    navigateToSubTab,
    showToast 
  } = useApp();

  const activeSubTab = getActiveSubTab('Pusat Cetak') || 'presensi';

  // Available classes
  const classes = useMemo(() => {
    const list = new Set<string>();
    students.forEach(s => { if (s.class) list.add(s.class); });
    journals.forEach(j => { if (j.kelas) list.add(j.kelas); });
    return Array.from(list).sort();
  }, [students, journals]);

  // Available subjects
  const subjects = useMemo(() => {
    const list = new Set<string>();
    if (settings?.mapelDefault) list.add(settings.mapelDefault);
    (teachingSchedules || []).forEach(s => { if (s.mapel) list.add(s.mapel); });
    (journals || []).forEach(j => { if (j.mapel) list.add(j.mapel); });
    return Array.from(list).sort();
  }, [teachingSchedules, journals, settings?.mapelDefault]);

  // Page Setup & Layout State
  const [paperSize, setPaperSize] = useState<'A4' | 'F4'>('A4');
  const [paperOrientation, setPaperOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [printDensity, setPrintDensity] = useState<'kompak' | 'standar' | 'lapang'>('standar');
  const [pageMargin, setPageMargin] = useState<'8mm' | '12mm' | '15mm'>('12mm');
  const [showKop, setShowKop] = useState<boolean>(true);
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [showSummaryBox, setShowSummaryBox] = useState<boolean>(true);

  // Filters State
  const [selectedClass, setSelectedClass] = useState<string>('SEMUA');
  const [selectedSubject, setSelectedSubject] = useState<string>('SEMUA');
  const [dateFilterMode, setDateFilterMode] = useState<'bulan' | 'semua' | 'rentang'>('bulan');
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => getCurrentDateInTimezone(settings?.timezone));
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<DocumentType | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Close preview with Escape key
  useEffect(() => {
    if (!previewDoc) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewDoc(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewDoc]);

  // Months list in Indonesian
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Filtered Students
  const filteredStudents = useMemo(() => {
    if (selectedClass === 'SEMUA') return students;
    return students.filter(s => s.class === selectedClass);
  }, [students, selectedClass]);

  // Filtered Attendance for Month
  const monthlyAttendance = useMemo(() => {
    const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    return attendance.filter(a => {
      const matchMonth = a.date.startsWith(monthPrefix);
      if (!matchMonth) return false;
      if (selectedClass !== 'SEMUA') {
        const student = students.find(s => s.id === a.studentId || s.nisn === a.nisn);
        return student?.class === selectedClass || a.class === selectedClass;
      }
      return true;
    });
  }, [attendance, selectedMonth, selectedYear, selectedClass, students]);

  // Filtered Journals for Jurnal Mengajar
  const filteredJournals = useMemo(() => {
    let list = (journals || []).filter(j => {
      // 1. Class filter
      if (selectedClass !== 'SEMUA' && j.kelas !== selectedClass) {
        return false;
      }
      // 2. Subject filter
      if (selectedSubject !== 'SEMUA' && j.mapel !== selectedSubject) {
        return false;
      }
      // 3. Date filter
      const cleanD = cleanDateFormat(j.date);
      if (dateFilterMode === 'bulan') {
        const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
        return cleanD.startsWith(monthPrefix);
      } else if (dateFilterMode === 'rentang') {
        if (startDate && cleanD < startDate) return false;
        if (endDate && cleanD > endDate) return false;
        return true;
      }
      return true;
    });

    return list.sort((a, b) => {
      const d1 = cleanDateFormat(a.date);
      const d2 = cleanDateFormat(b.date);
      return sortOrder === 'asc' ? d1.localeCompare(d2) : d2.localeCompare(d1);
    });
  }, [journals, selectedClass, selectedSubject, dateFilterMode, selectedMonth, selectedYear, startDate, endDate, sortOrder]);

  // Helper to compile CSS styles based on page settings
  const getDocumentStyles = (
    orientation: 'portrait' | 'landscape' = paperOrientation,
    size: 'A4' | 'F4' = paperSize,
    density: 'kompak' | 'standar' | 'lapang' = printDensity,
    margin: '8mm' | '12mm' | '15mm' = pageMargin
  ) => {
    const paperDimensions = size === 'A4'
      ? (orientation === 'portrait' ? '210mm 297mm' : '297mm 210mm')
      : (orientation === 'portrait' ? '215mm 330mm' : '330mm 215mm');

    const densityConfig = {
      kompak: {
        bodyFont: '9pt',
        tableFont: '8.5pt',
        thFont: '8.5pt',
        padding: '3px 4px',
        lineHeight: '1.25'
      },
      standar: {
        bodyFont: '10.5pt',
        tableFont: '9.5pt',
        thFont: '10pt',
        padding: '5px 6px',
        lineHeight: '1.35'
      },
      lapang: {
        bodyFont: '11.5pt',
        tableFont: '10.5pt',
        thFont: '11pt',
        padding: '7px 8px',
        lineHeight: '1.45'
      }
    }[density];

    return `
      @page {
        size: ${paperDimensions};
        margin: ${margin};
      }
      *, *::before, *::after {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        font-family: 'Times New Roman', Times, serif;
        background-color: #ffffff !important;
        color: #000000 !important;
        margin: 0;
        padding: 0;
        font-size: ${densityConfig.bodyFont};
        line-height: ${densityConfig.lineHeight};
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        margin-bottom: 10px;
        page-break-inside: auto;
        background-color: #ffffff !important;
      }
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
        background-color: #ffffff !important;
      }
      th, td {
        border: 1px solid #000000;
        padding: ${densityConfig.padding};
        font-size: ${densityConfig.tableFont};
        background-color: #ffffff;
        color: #000000 !important;
      }
      th {
        background-color: #f1f5f9 !important;
        font-weight: bold;
        text-align: center;
        font-size: ${densityConfig.thFont};
      }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .text-left { text-align: left; }
      .font-bold { font-weight: bold; }
      .uppercase { text-transform: uppercase; }
      .doc-title {
        text-align: center;
        font-weight: bold;
        font-size: 13pt;
        text-transform: uppercase;
        margin-top: 4px;
        margin-bottom: 3px;
        text-decoration: underline;
      }
      .doc-subtitle {
        text-align: center;
        font-size: 10.5pt;
        margin-bottom: 12px;
        font-weight: bold;
      }
      .meta-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8px;
        border: none;
      }
      .meta-table td {
        border: none;
        padding: 2px 4px;
        font-size: 10pt;
      }
      .summary-box {
        border: 1px dashed #475569;
        background-color: #f8fafc !important;
        padding: 8px 12px;
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        font-size: 9.5pt;
        border-radius: 4px;
      }
    `;
  };

  // Helper to compile full HTML with KOP and Signatures
  const buildFullHtml = (
    contentHtml: string, 
    docTitle: string,
    options?: {
      orientation?: 'portrait' | 'landscape';
      size?: 'A4' | 'F4';
      density?: 'kompak' | 'standar' | 'lapang';
      margin?: '8mm' | '12mm' | '15mm';
      includeKop?: boolean;
      includeSignatures?: boolean;
    }
  ) => {
    const curOrientation = options?.orientation ?? paperOrientation;
    const curSize = options?.size ?? paperSize;
    const curDensity = options?.density ?? printDensity;
    const curMargin = options?.margin ?? pageMargin;
    const curKop = options?.includeKop ?? showKop;
    const curSignatures = options?.includeSignatures ?? showSignatures;

    const styles = getDocumentStyles(curOrientation, curSize, curDensity, curMargin);

    const defaultCity = settings?.kotaTandaTangan || 'Bula';
    const currentDateStr = `${defaultCity}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

    return `
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>${docTitle}</title>
          <style>
            ${styles}
          </style>
        </head>
        <body>
          ${curKop ? generateOfficialKopHtml(settings) : ''}
          ${contentHtml}
          ${curSignatures ? `
            <div style="margin-top: 28px; display: flex; justify-content: space-between; page-break-inside: avoid; width: 100%;">
              <div style="text-align: center; min-width: 220px;">
                <p style="margin: 2px 0;">Mengetahui,</p>
                <p style="margin: 2px 0; font-weight: bold;">${settings?.jabatanKepalaSekolah || 'Kepala Sekolah'}</p>
                ${settings?.ttdKepalaSekolahUrl 
                  ? `<div style="height: 52px; display: flex; align-items: center; justify-content: center;"><img src="${settings.ttdKepalaSekolahUrl}" style="max-height: 50px; max-width: 160px; object-fit: contain;" /></div>` 
                  : '<div style="height: 52px;"></div>'
                }
                <p style="margin: 2px 0; font-weight: bold; text-decoration: underline;">${settings?.namaKepalaSekolah || settings?.kepalaSekolah || 'Drs. H. Ahmad Dahlan, M.Pd'}</p>
                <p style="margin: 2px 0; font-size: 9pt; font-family: monospace;">${settings?.nipKepalaSekolah ? `NIP. ${settings.nipKepalaSekolah}` : 'NIP. 19700101 199503 1 001'}</p>
              </div>
              <div style="text-align: center; min-width: 220px;">
                <p style="margin: 2px 0;">${currentDateStr}</p>
                <p style="margin: 2px 0; font-weight: bold;">Guru Pengampu / Wali Kelas</p>
                ${settings?.ttdGuruUrl 
                  ? `<div style="height: 52px; display: flex; align-items: center; justify-content: center;"><img src="${settings.ttdGuruUrl}" style="max-height: 50px; max-width: 160px; object-fit: contain;" /></div>` 
                  : '<div style="height: 52px;"></div>'
                }
                <p style="margin: 2px 0; font-weight: bold; text-decoration: underline;">${settings?.namaGuru || settings?.guru || 'Guru Pengampu'}</p>
                <p style="margin: 2px 0; font-size: 9pt; font-family: monospace;">${settings?.nip || settings?.nipGuru ? `NIP. ${settings.nip || settings.nipGuru}` : '-'}</p>
              </div>
            </div>
          ` : ''}
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 300);
            };
          </script>
        </body>
      </html>
    `;
  };

  // Helper to execute print dialog
  const executePrint = (
    contentHtml: string, 
    docTitle: string, 
    orientation: 'portrait' | 'landscape' = paperOrientation
  ) => {
    const fullHtml = buildFullHtml(contentHtml, docTitle, { orientation });
    printHtmlDocument(fullHtml, docTitle);
    showToast(`Membuka jendela cetak untuk "${docTitle}"`, 'info');
  };

  // 1. Generate HTML for Jurnal Mengajar Guru
  const generateJurnalContentHtml = () => {
    const classLabel = selectedClass === 'SEMUA' ? 'Semua Kelas' : `Kelas ${selectedClass}`;
    const subjectLabel = selectedSubject === 'SEMUA' ? (settings?.mapelDefault || 'Semua Mata Pelajaran') : selectedSubject;
    
    let periodSubtitle = '';
    if (dateFilterMode === 'bulan') {
      periodSubtitle = `Bulan ${monthNames[selectedMonth - 1]} ${selectedYear}`;
    } else if (dateFilterMode === 'rentang') {
      periodSubtitle = `Periode ${cleanDateFormat(startDate)} s.d. ${cleanDateFormat(endDate)}`;
    } else {
      periodSubtitle = `Seluruh Pertemuan (${filteredJournals.length} Catatan)`;
    }

    // Compute Summary Stats
    const totalMeetings = filteredJournals.length;
    let totalAbsenAccum = 0;
    filteredJournals.forEach(j => {
      totalAbsenAccum += (j.siswaTidakHadirJml || 0);
    });

    let rowsHtml = '';
    filteredJournals.forEach((jrn, idx) => {
      const dayInfo = formatIndonesianDayAndDate(jrn.date);
      const totalSiswa = jrn.totalSiswa || 32;
      const absenCount = jrn.siswaTidakHadirJml || 0;
      const hadirCount = Math.max(0, totalSiswa - absenCount);
      
      const isNonKbm = (jrn.materi && (jrn.materi.toLowerCase().includes('libur') || jrn.materi.toLowerCase().includes('tidak ada kbm'))) || (jrn.siswaTidakHadirNama === '-' && absenCount === 0);

      rowsHtml += `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-left" style="white-space: nowrap;">
            <strong>${dayInfo.day}</strong><br/>
            <span>${dayInfo.formattedDate}</span>
          </td>
          <td class="text-center font-bold" style="white-space: nowrap;">
            ${jrn.kelas}
            <div style="font-size: 8.5pt; font-weight: normal; color: #334155;">${jrn.mapel || subjectLabel}</div>
          </td>
          <td class="text-left" style="line-height: 1.3;">
            <strong style="color: #0f172a;">${jrn.materi || '-'}</strong>
            ${jrn.catatan ? `<div style="font-size: 8.5pt; color: #475569; margin-top: 2px;"><em>Catatan:</em> ${jrn.catatan}</div>` : ''}
          </td>
          <td class="text-left" style="line-height: 1.3;">${jrn.metode || '-'}</td>
          <td class="text-left" style="font-size: 8.5pt;">
            ${isNonKbm ? '<span style="color: #059669; font-weight: bold;">(Non-KBM / Libur)</span>' : (
              jrn.siswaTidakHadirNama && jrn.siswaTidakHadirNama !== '-'
                ? `<strong>${jrn.siswaTidakHadirNama}</strong>` 
                : '<span style="color: #64748b;">Nihil (Hadir Semua)</span>'
            )}
          </td>
          <td class="text-center font-bold" style="font-size: 8.5pt;">
            ${jrn.siswaTidakHadirKet && jrn.siswaTidakHadirKet !== '-' ? jrn.siswaTidakHadirKet : (absenCount > 0 ? `${absenCount} Siswa` : '-')}
          </td>
          <td class="text-center font-bold" style="background-color: #f8fafc;">
            ${hadirCount} / ${totalSiswa}
          </td>
          <td class="text-center" style="font-size: 8.5pt;">
            ${jrn.paraf || '✓ Paraf'}
          </td>
        </tr>
      `;
    });

    return `
      <div class="doc-title">JURNAL & AGENDA KEGIATAN BELAJAR MENGAJAR (KBM)</div>
      <div class="doc-subtitle">REKAPAN PERTEMUAN GURU PENGAMPU MATA PELAJARAN</div>

      <table class="meta-table">
        <tr>
          <td style="width: 15%; font-weight: bold;">Satuan Pendidikan</td>
          <td style="width: 2%;">:</td>
          <td style="width: 33%;">${settings?.sekolah || 'SMA Negeri / SMP / SD'}</td>
          <td style="width: 15%; font-weight: bold;">Semester / T.A.</td>
          <td style="width: 2%;">:</td>
          <td style="width: 33%;">${settings?.semester || '1 (Ganjil)'} / ${settings?.tahunAjaran || '2025/2026'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Guru Pengampu</td>
          <td>:</td>
          <td>${settings?.namaGuru || settings?.guru || 'Guru Mata Pelajaran'}</td>
          <td style="font-weight: bold;">Sasaran Rombel</td>
          <td>:</td>
          <td><strong>${classLabel}</strong></td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Mata Pelajaran</td>
          <td>:</td>
          <td><strong>${subjectLabel}</strong></td>
          <td style="font-weight: bold;">Periode Rekap</td>
          <td>:</td>
          <td>${periodSubtitle}</td>
        </tr>
      </table>

      ${showSummaryBox ? `
        <div class="summary-box">
          <div><strong>Total Pertemuan Tercatat:</strong> ${totalMeetings} Pertemuan</div>
          <div><strong>Total Ketidakhadiran Siswa:</strong> ${totalAbsenAccum} Kasus Absen</div>
          <div><strong>Format Dokumen:</strong> Standar Supervisi Kurikulum Merdeka / K13</div>
        </div>
      ` : ''}

      <table>
        <thead>
          <tr>
            <th style="width: 28px;">No</th>
            <th style="width: 95px;">Hari / Tanggal</th>
            <th style="width: 75px;">Kelas & Mapel</th>
            <th>Materi Pembelajaran / Pokok Bahasan KD</th>
            <th style="width: 130px;">Kegiatan / Metode</th>
            <th style="width: 120px;">Siswa Tidak Hadir</th>
            <th style="width: 50px;">Ket</th>
            <th style="width: 65px;">Kehadiran</th>
            <th style="width: 55px;">Paraf</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `
            <tr>
              <td colspan="9" class="text-center" style="padding: 24px; color: #64748b;">
                Belum ada rekaman jurnal mengajar yang sesuai filter kelas (${classLabel}) dan periode ini.<br/>
                <span style="font-size: 9pt;">Pastikan Anda telah mengisi jurnal di menu "Jurnal Mengajar" atau sesuaikan filter rentang tanggal.</span>
              </td>
            </tr>
          `}
        </tbody>
      </table>
    `;
  };

  // 2. Export Jurnal Mengajar to CSV / Excel
  const handleExportJurnalCsv = () => {
    if (filteredJournals.length === 0) {
      showToast('Tidak ada data jurnal untuk diekspor.', 'warning');
      return;
    }

    const headers = [
      'No',
      'Hari',
      'Tanggal',
      'Kelas',
      'Mata Pelajaran',
      'Materi Pokok / KD',
      'Kegiatan / Metode Pembelajaran',
      'Siswa Tidak Hadir (Nama)',
      'Keterangan Absen',
      'Jumlah Tidak Hadir',
      'Total Siswa',
      'Paraf',
      'Catatan'
    ];

    const rows = filteredJournals.map((j, idx) => {
      const dayInfo = formatIndonesianDayAndDate(j.date);
      return [
        idx + 1,
        `"${dayInfo.day}"`,
        `"${j.date}"`,
        `"${j.kelas}"`,
        `"${j.mapel || settings?.mapelDefault || '-'}"`,
        `"${(j.materi || '-').replace(/"/g, '""')}"`,
        `"${(j.metode || '-').replace(/"/g, '""')}"`,
        `"${(j.siswaTidakHadirNama || '-').replace(/"/g, '""')}"`,
        `"${(j.siswaTidakHadirKet || '-').replace(/"/g, '""')}"`,
        j.siswaTidakHadirJml || 0,
        j.totalSiswa || 32,
        `"${j.paraf || '-'}"`,
        `"${(j.catatan || '-').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const classLabel = selectedClass === 'SEMUA' ? 'Semua_Kelas' : `Kelas_${selectedClass.replace(/\s+/g, '_')}`;
    link.setAttribute('download', `Jurnal_Mengajar_${classLabel}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('File CSV Jurnal Mengajar berhasil diunduh.', 'success');
  };

  // 3. Generate HTML for Rekap Presensi Bulanan (Detail Pertemuan + Rekap Kanan H, T, S, I, A & %)
  const generateRekapBulananHtml = () => {
    const monthLabel = `${monthNames[selectedMonth - 1]} ${selectedYear}`;
    const targetClassLabel = selectedClass === 'SEMUA' ? 'Semua Kelas' : `Kelas ${selectedClass}`;
    const meetingDates = Array.from(new Set<string>(monthlyAttendance.map(a => a.date).filter(Boolean))).sort();

    let grandH = 0;
    let grandT = 0;
    let grandS = 0;
    let grandI = 0;
    let grandA = 0;

    let rowsHtml = '';
    filteredStudents.forEach((st, idx) => {
      const stLogs = monthlyAttendance.filter(a => a.studentId === st.id || a.nisn === st.nisn);
      const h = stLogs.filter(l => l.status === 'Hadir').length;
      const t = stLogs.filter(l => l.status === 'Terlambat').length;
      const s = stLogs.filter(l => l.status === 'Sakit').length;
      const i = stLogs.filter(l => l.status === 'Izin').length;
      const a = stLogs.filter(l => l.status === 'Alpa').length;
      const totalPhysical = h + t;
      const totalRec = h + t + s + i + a;
      const pct = totalRec > 0 ? Math.round((totalPhysical / totalRec) * 100) : 0;

      grandH += h;
      grandT += t;
      grandS += s;
      grandI += i;
      grandA += a;

      const meetingCellsHtml = meetingDates.length > 0 ? meetingDates.map(date => {
        const log = stLogs.find(l => l.date === date);
        let code = '-';
        let bg = 'transparent';
        let color = '#94a3b8';
        if (log) {
          if (log.status === 'Hadir') { code = 'H'; bg = '#dcfce7'; color = '#15803d'; }
          else if (log.status === 'Terlambat') { code = 'T'; bg = '#fef3c7'; color = '#b45309'; }
          else if (log.status === 'Sakit') { code = 'S'; bg = '#f3e8ff'; color = '#7e22ce'; }
          else if (log.status === 'Izin') { code = 'I'; bg = '#e0f2fe'; color = '#0369a1'; }
          else if (log.status === 'Alpa') { code = 'A'; bg = '#ffe4e6'; color = '#be123c'; }
        }
        return `<td class="text-center font-bold" style="font-size: 8.5pt; background-color: ${bg}; color: ${color}; padding: 3px 1px;">${code}</td>`;
      }).join('') : '';

      rowsHtml += `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-center" style="font-family: monospace; font-size: 9pt;">${st.nisn}</td>
          <td class="text-left font-bold" style="white-space: nowrap;">${st.name}</td>
          <td class="text-center">${st.class}</td>
          <td class="text-center">${st.gender || '-'}</td>
          ${meetingCellsHtml}
          <td class="text-center" style="font-weight: bold; color: #15803d; background-color: ${h > 0 ? '#f0fdf4' : 'transparent'};">${h}</td>
          <td class="text-center" style="font-weight: bold; color: #b45309; background-color: ${t > 0 ? '#fffbeb' : 'transparent'};">${t}</td>
          <td class="text-center" style="font-weight: bold; color: #6b21a8; background-color: ${s > 0 ? '#faf5ff' : 'transparent'};">${s}</td>
          <td class="text-center" style="font-weight: bold; color: #0369a1; background-color: ${i > 0 ? '#f0f9ff' : 'transparent'};">${i}</td>
          <td class="text-center" style="font-weight: bold; color: #be123c; background-color: ${a > 0 ? '#fff1f2' : 'transparent'};">${a}</td>
          <td class="text-center font-bold" style="background-color: #f8fafc;">${totalPhysical}</td>
          <td class="text-center font-bold" style="color: ${pct >= 85 ? '#15803d' : pct >= 70 ? '#b45309' : '#be123c'};">${pct}%</td>
        </tr>
      `;
    });

    const grandPhysical = grandH + grandT;
    const grandRecorded = grandH + grandT + grandS + grandI + grandA;
    const grandPct = grandRecorded > 0 ? Math.round((grandPhysical / grandRecorded) * 100) : 0;

    return `
      <div class="doc-title">REKAPITULASI PRESENSI ADMINISTRASI KBM PESERTA DIDIK</div>
      <div class="doc-subtitle">Bulan: <strong>${monthLabel}</strong> | Sasaran: <strong>${targetClassLabel}</strong></div>
      <div class="meta-grid" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 10pt;">
        <div>Tahun Ajaran: <strong>${settings?.tahunAjaran || '-'}</strong> | Semester: <strong>${settings?.semester || '-'}</strong></div>
        <div>Total Siswa: <strong>${filteredStudents.length} Peserta Didik</strong> | Pertemuan: <strong>${meetingDates.length} Hari KBM</strong></div>
      </div>
      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width: 28px;">No</th>
            <th rowspan="2" style="width: 85px;">NISN</th>
            <th rowspan="2" style="text-align: left; padding-left: 6px;">Nama Lengkap Siswa</th>
            <th rowspan="2" style="width: 48px;">Kelas</th>
            <th rowspan="2" style="width: 32px;">L/P</th>
            ${meetingDates.length > 0 ? `<th colspan="${meetingDates.length}" style="background-color: #e2e8f0; font-size: 8.5pt;">Daftar Pertemuan / Tanggal Ke-</th>` : ''}
            <th colspan="5" style="background-color: #cbd5e1; font-size: 8.5pt;">Rekapitulasi</th>
            <th rowspan="2" style="width: 44px;">Total<br/>Hadir</th>
            <th rowspan="2" style="width: 48px;">%<br/>Hadir</th>
          </tr>
          <tr>
            ${meetingDates.map((d, dIdx) => {
              const parts = d.split('-');
              const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
              return `<th style="width: 26px; padding: 3px 1px; font-size: 7.5pt;" title="${d}">P${dIdx + 1}<br/><span style="font-size: 7pt; font-weight: normal; color: #475569;">${shortDate}</span></th>`;
            }).join('')}
            <th style="width: 28px; color: #15803d; background-color: #dcfce7; font-size: 8.5pt;" title="Hadir">H</th>
            <th style="width: 28px; color: #b45309; background-color: #fef3c7; font-size: 8.5pt;" title="Terlambat">T</th>
            <th style="width: 28px; color: #6b21a8; background-color: #f3e8ff; font-size: 8.5pt;" title="Sakit">S</th>
            <th style="width: 28px; color: #0369a1; background-color: #e0f2fe; font-size: 8.5pt;" title="Izin">I</th>
            <th style="width: 28px; color: #be123c; background-color: #ffe4e6; font-size: 8.5pt;" title="Alpa">A</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="${meetingDates.length + 12}" class="text-center" style="padding: 16px;">Tidak ada data siswa atau kehadiran pada periode ini.</td></tr>`}
        </tbody>
        <tfoot>
          <tr style="background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #000000; font-size: 9pt;">
            <td colspan="5" class="text-center" style="padding: 6px;">JUMLAH HADIR FISIK KELAS (H + T)</td>
            ${meetingDates.map(d => {
              const countPhysical = monthlyAttendance.filter(a => a.date === d && (a.status === 'Hadir' || a.status === 'Terlambat')).length;
              return `<td class="text-center font-mono font-bold" style="padding: 4px 1px; color: #15803d; font-size: 8pt; background-color: #f8fafc;">${countPhysical}</td>`;
            }).join('')}
            <td class="text-center" style="color: #15803d; background-color: #dcfce7;">${grandH}</td>
            <td class="text-center" style="color: #b45309; background-color: #fef3c7;">${grandT}</td>
            <td class="text-center" style="color: #6b21a8; background-color: #f3e8ff;">${grandS}</td>
            <td class="text-center" style="color: #0369a1; background-color: #e0f2fe;">${grandI}</td>
            <td class="text-center" style="color: #be123c; background-color: #ffe4e6;">${grandA}</td>
            <td class="text-center" style="background-color: #f8fafc;">${grandPhysical}</td>
            <td class="text-center font-bold" style="color: #0f172a;">${grandPct}%</td>
          </tr>
        </tfoot>
      </table>
      <div style="font-size: 9pt; color: #334155; margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>Keterangan Status:</strong> 
          <span style="color: #15803d; font-weight: bold;">H:</span> Hadir Tepat Waktu | 
          <span style="color: #b45309; font-weight: bold;">T:</span> Terlambat | 
          <span style="color: #6b21a8; font-weight: bold;">S:</span> Sakit | 
          <span style="color: #0369a1; font-weight: bold;">I:</span> Izin Resmi | 
          <span style="color: #be123c; font-weight: bold;">A:</span> Alpa (Tanpa Keterangan)
        </div>
        <div>
          <strong>Rumus Kehadiran:</strong> % = ((H + T) / Total Pertemuan) × 100%
        </div>
      </div>
    `;
  };

  // Export Rekap Presensi Bulanan ke CSV / Excel
  const handleExportRekapPresensiCsv = () => {
    if (filteredStudents.length === 0) {
      showToast('Tidak ada data siswa untuk diekspor.', 'warning');
      return;
    }

    const meetingDates = Array.from(new Set<string>(monthlyAttendance.map(a => a.date).filter(Boolean))).sort();
    const meetingHeaders = meetingDates.map((d, i) => `P${i + 1} (${d})`);
    const headers = [
      'No',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Jenis Kelamin',
      ...meetingHeaders,
      'Hadir (H)',
      'Terlambat (T)',
      'Sakit (S)',
      'Izin (I)',
      'Alpa (A)',
      'Total Hadir Fisik',
      'Persentase Kehadiran (%)'
    ];

    const rows = filteredStudents.map((st, idx) => {
      const stLogs = monthlyAttendance.filter(a => a.studentId === st.id || a.nisn === st.nisn);
      const h = stLogs.filter(l => l.status === 'Hadir').length;
      const t = stLogs.filter(l => l.status === 'Terlambat').length;
      const s = stLogs.filter(l => l.status === 'Sakit').length;
      const i = stLogs.filter(l => l.status === 'Izin').length;
      const a = stLogs.filter(l => l.status === 'Alpa').length;
      const totalPhysical = h + t;
      const totalRec = h + t + s + i + a;
      const pct = totalRec > 0 ? Math.round((totalPhysical / totalRec) * 100) : 0;

      const meetingStatuses = meetingDates.map(date => {
        const log = stLogs.find(l => l.date === date);
        if (!log) return '-';
        if (log.status === 'Hadir') return 'H';
        if (log.status === 'Terlambat') return 'T';
        if (log.status === 'Sakit') return 'S';
        if (log.status === 'Izin') return 'I';
        if (log.status === 'Alpa') return 'A';
        return '-';
      });

      return [
        idx + 1,
        `"${st.nisn || ''}"`,
        `"${st.name}"`,
        `"${st.class}"`,
        `"${st.gender || '-'}"`,
        ...meetingStatuses.map(s => `"${s}"`),
        h,
        t,
        s,
        i,
        a,
        totalPhysical,
        `"${pct}%"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const classLabel = selectedClass === 'SEMUA' ? 'Semua_Kelas' : `Kelas_${selectedClass.replace(/\s+/g, '_')}`;
    link.setAttribute('download', `Rekap_Presensi_Bulanan_${classLabel}_${monthNames[selectedMonth - 1]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('File CSV Rekap Presensi berhasil diunduh.', 'success');
  };

  // 4. Generate HTML for Blangko Absensi Manual Kosong
  const generateBlangkoAbsensiHtml = () => {
    const targetClassLabel = selectedClass === 'SEMUA' ? 'Semua Kelas' : `Kelas ${selectedClass}`;
    let rowsHtml = '';
    filteredStudents.forEach((st, idx) => {
      rowsHtml += `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-center" style="font-family: monospace;">${st.nisn}</td>
          <td>${st.name}</td>
          <td class="text-center">${st.class}</td>
          <td class="text-center">${st.gender || '-'}</td>
          <td></td><td></td><td></td><td></td><td></td>
          <td></td><td></td><td></td><td></td><td></td>
          <td></td>
        </tr>
      `;
    });

    return `
      <div class="doc-title">DAFTAR HADIR MANUAL / BLANGKO KBM & UJIAN</div>
      <div class="doc-subtitle">Sasaran: <strong>${targetClassLabel}</strong> | Semester: <strong>${settings?.semester || '-'}</strong> | T.A: <strong>${settings?.tahunAjaran || '-'}</strong></div>
      <div class="meta-grid" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 10pt;">
        <div>Mata Pelajaran: ___________________________</div>
        <div>Guru / Pengawas: ___________________________</div>
      </div>
      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width: 30px;">No</th>
            <th rowspan="2" style="width: 95px;">NISN</th>
            <th rowspan="2">Nama Peserta Didik</th>
            <th rowspan="2" style="width: 50px;">Kelas</th>
            <th rowspan="2" style="width: 35px;">L/P</th>
            <th colspan="10">Pertemuan / Tanggal Ke-</th>
            <th rowspan="2" style="width: 90px;">Paraf / Ket</th>
          </tr>
          <tr>
            <th style="width: 26px;">1</th><th style="width: 26px;">2</th><th style="width: 26px;">3</th><th style="width: 26px;">4</th><th style="width: 26px;">5</th>
            <th style="width: 26px;">6</th><th style="width: 26px;">7</th><th style="width: 26px;">8</th><th style="width: 26px;">9</th><th style="width: 26px;">10</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="16" class="text-center">Tidak ada data siswa untuk kelas ini.</td></tr>'}
        </tbody>
      </table>
    `;
  };

  // 5. Generate HTML for Buku Nominatif Siswa
  const generateBukuNominatifHtml = () => {
    const targetClassLabel = selectedClass === 'SEMUA' ? 'Seluruh Peserta Didik' : `Kelas ${selectedClass}`;
    let rowsHtml = '';
    filteredStudents.forEach((st, idx) => {
      rowsHtml += `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-center" style="font-family: monospace;">${st.nisn}</td>
          <td class="font-bold">${st.name}</td>
          <td class="text-center">${st.class}</td>
          <td class="text-center">${st.gender === 'L' ? 'Laki-laki' : (st.gender === 'P' ? 'Perempuan' : '-')}</td>
          <td>${st.birthPlace ? `${st.birthPlace}, ` : ''}${st.birthDate || '-'}</td>
          <td>${st.parentName || '-'}</td>
          <td class="text-center" style="font-family: monospace;">${st.phone || '-'}</td>
        </tr>
      `;
    });

    return `
      <div class="doc-title">BUKU NOMINATIF & REKAPITULASI INDUK SISWA</div>
      <div class="doc-subtitle">Sasaran: <strong>${targetClassLabel}</strong> | Tahun Ajaran: <strong>${settings?.tahunAjaran || '-'}</strong></div>
      <div class="meta-grid" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 10pt;">
        <div>Satuan Pendidikan: <strong>${settings?.sekolah || '-'}</strong></div>
        <div>Total Terdaftar: <strong>${filteredStudents.length} Siswa</strong></div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 32px;">No</th>
            <th style="width: 100px;">NISN</th>
            <th>Nama Lengkap Peserta Didik</th>
            <th style="width: 55px;">Kelas</th>
            <th style="width: 80px;">Jenis Kelamin</th>
            <th style="width: 150px;">Tempat, Tanggal Lahir</th>
            <th style="width: 130px;">Nama Orang Tua / Wali</th>
            <th style="width: 105px;">Kontak / No. HP</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="8" class="text-center">Tidak ada data siswa.</td></tr>'}
        </tbody>
      </table>
    `;
  };

  // 6. Generate HTML for Jadwal Pelajaran
  const generateJadwalHtml = () => {
    const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    let filteredSchedules = teachingSchedules || [];
    if (selectedClass !== 'SEMUA') {
      filteredSchedules = filteredSchedules.filter(s => (s?.kelas || (s as any)?.rombel) === selectedClass);
    }

    let rowsHtml = '';
    let counter = 1;
    daysOrder.forEach(day => {
      const items = filteredSchedules.filter(s => (s?.day || '').toLowerCase() === day.toLowerCase());
      if (items.length > 0) {
        items.sort((a, b) => (a.startTime || (a as any).jamMulai || '').localeCompare(b.startTime || (a as any).jamMulai || ''));
        items.forEach((item, itemIdx) => {
          rowsHtml += `
            <tr>
              ${itemIdx === 0 ? `<td rowspan="${items.length}" class="text-center font-bold" style="background-color: #f8fafc;">${day}</td>` : ''}
              <td class="text-center">${counter++}</td>
              <td class="text-center">${item.jamKe || '-'}</td>
              <td class="text-center">${item.startTime || (item as any).jamMulai || ''} - ${item.endTime || (item as any).jamSelesai || ''}</td>
              <td class="text-center font-bold">${item.kelas || (item as any).rombel || '-'}</td>
              <td>${item.mapel || '-'}</td>
              <td class="text-center">${item.jtm || (item as any).jp || 2} JP</td>
              <td class="text-center">${item.ruang || item.room || (item as any).ruangan || '-'}</td>
            </tr>
          `;
        });
      }
    });

    return `
      <div class="doc-title">JADWAL PELAJARAN & KEGIATAN BELAJAR MENGAJAR</div>
      <div class="doc-subtitle">Guru: <strong>${settings?.namaGuru || settings?.guru || '-'}</strong> | Semester: <strong>${settings?.semester || '-'}</strong> | T.A: <strong>${settings?.tahunAjaran || '-'}</strong></div>
      <table>
        <thead>
          <tr>
            <th style="width: 80px;">Hari</th>
            <th style="width: 30px;">No</th>
            <th style="width: 60px;">Jam Ke</th>
            <th style="width: 100px;">Alokasi Waktu</th>
            <th style="width: 70px;">Kelas</th>
            <th>Mata Pelajaran</th>
            <th style="width: 60px;">Durasi</th>
            <th style="width: 90px;">Ruang</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="8" class="text-center">Belum ada jadwal mengajar tersimpan.</td></tr>'}
        </tbody>
      </table>
    `;
  };

  // 7. Generate HTML for Leger Nilai
  const generateLegerNilaiHtml = () => {
    const targetClass = selectedClass === 'SEMUA' ? (classes[0] || '7A') : selectedClass;
    const currentSheet = (gradeSheets || []).find(g => 
      g.kelas === targetClass && 
      g.semester === (settings?.semester || '1') && 
      g.tahunAjaran === (settings?.tahunAjaran || '2025/2026')
    );

    const targetStudents = students.filter(s => s.class === targetClass);

    let rowsHtml = '';
    targetStudents.forEach((st, idx) => {
      const grades = currentSheet?.students?.[st.id] || {};
      const uh1 = grades.uh1 ?? '-';
      const uh2 = grades.uh2 ?? '-';
      const uh3 = grades.uh3 ?? '-';
      const uh4 = grades.uh4 ?? '-';
      const uts = grades.uts ?? '-';
      const uas = grades.uas ?? '-';
      const na = grades.nilaiAkhir ?? '-';
      const pred = grades.predikat || (typeof na === 'number' ? (na >= 88 ? 'A' : (na >= 75 ? 'B' : 'C')) : '-');

      rowsHtml += `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-center" style="font-family: monospace;">${st.nisn}</td>
          <td>${st.name}</td>
          <td class="text-center">${st.gender || '-'}</td>
          <td class="text-center">${uh1}</td>
          <td class="text-center">${uh2}</td>
          <td class="text-center">${uh3}</td>
          <td class="text-center">${uh4}</td>
          <td class="text-center">${uts}</td>
          <td class="text-center">${uas}</td>
          <td class="text-center font-bold" style="background-color: #f1f5f9;">${na}</td>
          <td class="text-center font-bold">${pred}</td>
        </tr>
      `;
    });

    return `
      <div class="doc-title">LEGER DAFTAR NILAI HARIAN & RAPOR</div>
      <div class="doc-subtitle">Kelas: <strong>${targetClass}</strong> | Mata Pelajaran: <strong>${settings?.mapelDefault || '-'}</strong> | Semester: <strong>${settings?.semester || '-'}</strong></div>
      <div class="meta-grid" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 10pt;">
        <div>KKM / KKTP: <strong>${settings?.kkmDefault || 75}</strong></div>
        <div>Guru Pengampu: <strong>${settings?.namaGuru || settings?.guru || '-'}</strong></div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 30px;">No</th>
            <th style="width: 100px;">NISN</th>
            <th>Nama Lengkap Peserta Didik</th>
            <th style="width: 35px;">L/P</th>
            <th style="width: 45px;">UH 1</th>
            <th style="width: 45px;">UH 2</th>
            <th style="width: 45px;">UH 3</th>
            <th style="width: 45px;">UH 4</th>
            <th style="width: 50px;">UTS</th>
            <th style="width: 50px;">UAS</th>
            <th style="width: 60px;">Nilai Akhir</th>
            <th style="width: 50px;">Predikat</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="12" class="text-center">Tidak ada data siswa untuk kelas ini.</td></tr>'}
        </tbody>
      </table>
    `;
  };

  // Dispatcher for document generation
  const getDocContentHtml = (docType: DocumentType) => {
    switch (docType) {
      case 'jurnal-mengajar':
        return generateJurnalContentHtml();
      case 'rekap-bulanan':
        return generateRekapBulananHtml();
      case 'blangko-absensi':
        return generateBlangkoAbsensiHtml();
      case 'buku-nominatif':
        return generateBukuNominatifHtml();
      case 'jadwal-mingguan':
        return generateJadwalHtml();
      case 'leger-nilai':
        return generateLegerNilaiHtml();
      default:
        return '';
    }
  };

  // Open Preview Modal
  const openPreview = (docType: DocumentType, title: string) => {
    setPreviewDoc(docType);
    setPreviewTitle(title);
  };

  // Execute Print for a specific document
  const triggerPrintDoc = (docType: DocumentType, title: string) => {
    const html = getDocContentHtml(docType);
    executePrint(html, title);
  };

  return (
    <div className="space-y-6">
      {/* SubNavHeader for Pusat Cetak */}
      <SubNavHeader 
        currentTab="Pusat Cetak"
        activeSubTab={activeSubTab}
        onSelectSubTab={(id) => navigateToSubTab('Pusat Cetak', id)}
        badgeCounts={{
          'perangkat-guru': 'Jurnal & Jadwal',
          'presensi': 'Presensi',
          'kartu-siswa': 'Kartu QR',
          'penilaian': 'Nilai'
        }}
      />

      {/* Main Print Configuration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Pusat Cetak Dokumen Terpadu
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Standar Dinas & Madrasah
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih format dokumen resmi, sesuaikan ukuran kertas (A4/F4), orientasi, kerapatan cetak, dan data administratif sebelum mencetak.
              </p>
            </div>
          </div>

          {/* Quick Setup Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            {/* KOP Surat Toggle */}
            <button
              type="button"
              onClick={() => setShowKop(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                showKop 
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm' 
                  : 'bg-slate-800/80 text-slate-400 border-slate-700'
              }`}
              title="Aktifkan atau nonaktifkan KOP Surat Sekolah"
            >
              <Check className={`w-3.5 h-3.5 ${showKop ? 'opacity-100' : 'opacity-20'}`} />
              <span>KOP Surat Resmi</span>
            </button>

            {/* Tanda Tangan Toggle */}
            <button
              type="button"
              onClick={() => setShowSignatures(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                showSignatures 
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm' 
                  : 'bg-slate-800/80 text-slate-400 border-slate-700'
              }`}
              title="Tampilkan blok tanda tangan Kepala Sekolah dan Guru Pengampu"
            >
              <Check className={`w-3.5 h-3.5 ${showSignatures ? 'opacity-100' : 'opacity-20'}`} />
              <span>Tanda Tangan Dinas</span>
            </button>

            {/* Kotak Ringkasan Toggle */}
            <button
              type="button"
              onClick={() => setShowSummaryBox(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                showSummaryBox 
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm' 
                  : 'bg-slate-800/80 text-slate-400 border-slate-700'
              }`}
              title="Tampilkan kotak rekapitulasi jumlah pertemuan dan kehadiran"
            >
              <Check className={`w-3.5 h-3.5 ${showSummaryBox ? 'opacity-100' : 'opacity-20'}`} />
              <span>Kotak Rekap/Statistik</span>
            </button>
          </div>
        </div>

        {/* Paper & Page Layout Controls Panel */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Sliders className="w-4 h-4" />
            <span>Pengaturan Kertas & Layout Dokumen:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Ukuran Kertas */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Ukuran Kertas</label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaperSize('A4')}
                  className={`py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer ${
                    paperSize === 'A4' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A4 (210×297)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('F4')}
                  className={`py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer ${
                    paperSize === 'F4' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  F4 / Folio
                </button>
              </div>
            </div>

            {/* Orientasi Kertas */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Orientasi Halaman</label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaperOrientation('landscape')}
                  className={`py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer ${
                    paperOrientation === 'landscape' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Landscape (Mendatar)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperOrientation('portrait')}
                  className={`py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer ${
                    paperOrientation === 'portrait' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Portrait (Tegak)
                </button>
              </div>
            </div>

            {/* Kerapatan Baris / Font Size */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Kerapatan Cetak (Font & Padding)</label>
              <select
                value={printDensity}
                onChange={(e) => setPrintDensity(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none cursor-pointer"
              >
                <option value="kompak">Kompak (Font 8.5pt - Hemat Kertas)</option>
                <option value="standar">Standar (Font 9.5pt - Ideal Dinas)</option>
                <option value="lapang">Lapang (Font 10.5pt - Mudah Dibaca)</option>
              </select>
            </div>

            {/* Margin Kertas */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Margin Tepi Kertas</label>
              <select
                value={pageMargin}
                onChange={(e) => setPageMargin(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none cursor-pointer"
              >
                <option value="8mm">Tipis (8 mm - Area Cetak Maksimal)</option>
                <option value="12mm">Standar (12 mm - Rekomendasi)</option>
                <option value="15mm">Lebar (15 mm - Ruang Jilid / Klip)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Global Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
          {/* Kelas */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1.5">Filter Kelas / Rombel</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none"
            >
              <option value="SEMUA">Semua Kelas ({students.length} Siswa)</option>
              {classes.map(c => (
                <option key={c} value={c}>Kelas {c} ({students.filter(s => s.class === c).length} Siswa)</option>
              ))}
            </select>
          </div>

          {/* Mapel */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1.5">Filter Mata Pelajaran</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none"
            >
              <option value="SEMUA">Semua Mata Pelajaran ({subjects.length})</option>
              {subjects.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Mode Rentang Tanggal */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1.5">Rentang Waktu Rekap</label>
            <select
              value={dateFilterMode}
              onChange={(e) => setDateFilterMode(e.target.value as any)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none"
            >
              <option value="bulan">Per Bulan Tertentu</option>
              <option value="rentang">Rentang Tanggal Khusus (Dari - Sampai)</option>
              <option value="semua">Semua Waktu / Semester Ini</option>
            </select>
          </div>

          {/* Dynamic Month or Custom Range */}
          {dateFilterMode === 'bulan' ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Bulan</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-2 py-2 text-white font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none"
                >
                  {monthNames.map((m, idx) => (
                    <option key={m} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Tahun</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-2 py-2 text-white font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none"
                />
              </div>
            </div>
          ) : dateFilterMode === 'rentang' ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none text-[11px]"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Sampai</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none text-[11px]"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Urutan Pertemuan</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none"
              >
                <option value="asc">Pertemuan 1 → Terakhir (Urut Maju)</option>
                <option value="desc">Pertemuan Terakhir → 1 (Urut Balik)</option>
              </select>
            </div>
          )}
        </div>

        {/* Akses Cepat Cetak Jurnal Mengajar Langsung */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-950/20 -mx-6 -mb-6 p-4 px-6 rounded-b-3xl border-emerald-500/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">Cetak Cepat: Jurnal & Agenda Mengajar Guru</h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {filteredJournals.length} Pertemuan ({selectedClass === 'SEMUA' ? 'Semua Kelas' : `Kelas ${selectedClass}`})
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Format supervisi resmi lengkap KOP, jadwal, materi KD, presensi siswa & tanda tangan dinas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => openPreview('jurnal-mengajar', `Jurnal Mengajar Guru - ${selectedClass}`)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Pratinjau</span>
            </button>
            <button
              type="button"
              onClick={() => triggerPrintDoc('jurnal-mengajar', `Jurnal Mengajar - ${selectedClass}`)}
              className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Jurnal Mengajar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic SubTab Content */}
      <AnimatePresence mode="wait">
        {/* SUBTAB 1: PERANGKAT KBM & GURU (JURNAL MENGAJAR & JADWAL) */}
        {activeSubTab === 'perangkat-guru' && (
          <motion.div
            key="subtab-perangkat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Doc Card 1: JURNAL & AGENDA MENGAJAR GURU (FEATURED) */}
            <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-3.5 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Dokumen Utama Supervisi
                  </span>
                  <BookOpen className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Jurnal & Agenda Mengajar Guru
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Dokumen administrasi resmi mencakup hari/tanggal, jam ke, kelas, materi pokok KD, metode pembelajaran, rekap absensi per pertemuan (H/S/I/A), dan catatan supervisi.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Total Sesuai Filter:</span>
                    <strong className="text-emerald-400 font-mono text-sm">{filteredJournals.length} Pertemuan</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Sasaran Rombel:</span>
                    <span className="font-semibold">{selectedClass === 'SEMUA' ? 'Seluruh Kelas' : `Kelas ${selectedClass}`}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Format Rekomendasi:</span>
                    <span className="text-amber-400 font-semibold">Landscape ({paperSize}) • {printDensity}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 mt-6 space-y-2 relative z-10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => triggerPrintDoc('jurnal-mengajar', `Jurnal Mengajar - ${selectedClass}`)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Jurnal Sekarang</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openPreview('jurnal-mengajar', `Jurnal Mengajar Guru - ${selectedClass}`)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                    title="Buka pratinjau lembar cetak interaktif"
                  >
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Pratinjau</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportJurnalCsv}
                  className="w-full bg-slate-950 hover:bg-slate-800/80 text-slate-300 hover:text-white font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 border border-slate-800 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ekspor ke Spreadsheet (.csv / Excel)</span>
                </button>
              </div>
            </div>

            {/* Doc Card 2: JADWAL PELAJARAN MINGGUAN */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-amber-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Jadwal & Beban Mengajar
                  </span>
                  <Calendar className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Jadwal Mengajar Mingguan</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Tabel jadwal KBM terstruktur hari Senin sampai Sabtu lengkap dengan alokasi jam ke, rentang waktu WIB/WITA/WIT, rombel, mapel, alokasi JP, dan nama ruangan.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300 font-medium pt-2">
                  <span>📄 Format: Portrait ({paperSize})</span>
                  <span>•</span>
                  <span>⏰ Alokasi JP & Ruang</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 mt-6 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerPrintDoc('jadwal-mingguan', `Jadwal Pelajaran - ${settings?.guru || 'Sekolah'}`)}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Jadwal Pelajaran</span>
                </button>
                <button
                  type="button"
                  onClick={() => openPreview('jadwal-mingguan', `Jadwal Pelajaran - ${settings?.guru || 'Sekolah'}`)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-700 transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: PRESENSI & KEHADIRAN */}
        {activeSubTab === 'presensi' && (
          <motion.div
            key="subtab-presensi"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Rekap Bulanan */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Buku Presensi Resmi
                  </span>
                  <History className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <h3 className="text-base font-bold text-white">Rekapitulasi Presensi Bulanan</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Format matriks kehadiran siswa lengkap akumulasi Hadir, Terlambat, Sakit, Izin, dan Alpa, persentase %, serta rekap total untuk lampiran laporan bulanan dinas.
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-300 font-medium pt-2">
                  <span>📄 Kertas: Landscape</span>
                  <span>•</span>
                  <span>👥 {filteredStudents.length} Siswa</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-6 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => triggerPrintDoc('rekap-bulanan', `Rekap Presensi Bulanan - ${selectedClass}`)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Rekap Bulanan</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportRekapPresensiCsv}
                  className="bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                  title="Unduh format CSV/Excel dengan kolom per pertemuan"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => openPreview('rekap-bulanan', `Rekap Presensi Bulanan - ${selectedClass}`)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-700 transition-all cursor-pointer"
                  title="Pratinjau Dokumen"
                >
                  <Eye className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>

            {/* Blangko Absensi Manual Kosong */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-blue-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Formulir Lapangan / Ujian
                  </span>
                  <FileText className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <h3 className="text-base font-bold text-white">Blangko Daftar Hadir Manual Kosong</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Lembar absensi siap cetak berisi daftar nama & NISN siswa dengan kolom kotak kosong (1-10 pertemuan) untuk KBM luar kelas, ujian, atau cadangan manual.
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-300 font-medium pt-2">
                  <span>📄 Kertas: Landscape</span>
                  <span>•</span>
                  <span>✏️ Kolom Paraf Pengawas</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-6 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => triggerPrintDoc('blangko-absensi', `Blangko Absensi Manual - ${selectedClass}`)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Blangko Kosong</span>
                </button>
                <button
                  type="button"
                  onClick={() => openPreview('blangko-absensi', `Blangko Absensi Manual - ${selectedClass}`)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-700 transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            </div>

            {/* Jurnal & Agenda Mengajar Guru (Juga Dapat Dicetak Langsung dari Tab Presensi) */}
            <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 hover:border-emerald-500 transition-all flex flex-col justify-between group md:col-span-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Jurnal Mengajar & Kehadiran KBM
                  </span>
                  <BookOpen className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white">Jurnal & Agenda Mengajar Guru</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                      Buku agenda mengajar resmi berisi materi KD, metode belajar, catatan evaluasi, serta rekap presensi per pertemuan (H/S/I/A).
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 self-start sm:self-auto shrink-0">
                    {filteredJournals.length} Pertemuan ({selectedClass === 'SEMUA' ? 'Semua Kelas' : `Kelas ${selectedClass}`})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-6 border-t border-slate-800 mt-6 relative z-10">
                <button
                  type="button"
                  onClick={() => triggerPrintDoc('jurnal-mengajar', `Jurnal Mengajar - ${selectedClass}`)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Jurnal Mengajar</span>
                </button>
                <button
                  type="button"
                  onClick={() => openPreview('jurnal-mengajar', `Jurnal Mengajar Guru - ${selectedClass}`)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Pratinjau</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 3: KARTU & DATA SISWA */}
        {activeSubTab === 'kartu-siswa' && (
          <motion.div
            key="subtab-kartu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Kartu QR Massal */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ID Card Digital Peserta Didik
                  </span>
                  <QrCode className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <h3 className="text-base font-bold text-white">Lembar Cetak Kartu QR Massal</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cetak lembar kartu pelajar QR Code dalam susunan grid (A4 / F4) lengkap garis potong pembatas (*crop marks*), logo sekolah, dan foto siswa siap laminasi.
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-300 font-medium pt-2">
                  <span>📄 Grid 3x3 per Lembar</span>
                  <span>•</span>
                  <span>✂️ Dilengkapi Garis Potong</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => navigateToSubTab('Kartu QR', 'cetak-massal')}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Buka Generator Cetak Kartu QR</span>
                </button>
              </div>
            </div>

            {/* Buku Nominatif Siswa */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-purple-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Buku Induk Satuan Pendidikan
                  </span>
                  <Users className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                </div>
                <h3 className="text-base font-bold text-white">Buku Nominatif & Direktori Siswa</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Daftar induk seluruh peserta didik per kelas berisi NISN, Nama Lengkap, Jenis Kelamin, TTL, Nama Wali, dan Nomor Kontak untuk arsip administrasi TU / Wali Kelas.
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-300 font-medium pt-2">
                  <span>📄 Kertas: Landscape</span>
                  <span>•</span>
                  <span>📊 {filteredStudents.length} Siswa Terpilih</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-6 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => triggerPrintDoc('buku-nominatif', `Buku Nominatif Siswa - ${selectedClass}`)}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Buku Nominatif</span>
                </button>
                <button
                  type="button"
                  onClick={() => openPreview('buku-nominatif', `Buku Nominatif Siswa - ${selectedClass}`)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-700 transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-purple-400" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 4: PENILAIAN & AKADEMIK */}
        {activeSubTab === 'penilaian' && (
          <motion.div
            key="subtab-penilaian"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Leger Nilai */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Kurikulum & Asesmen
                  </span>
                  <Award className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <h3 className="text-base font-bold text-white">Leger Rekap Nilai Harian Resmi</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Daftar nilai formatif/sumatif per kelas mencakup UH 1..4, UTS, UAS, Nilai Akhir (NA), predikat (A/B/C/D), serta batas KKM/KKTP siap tanda tangan.
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-300 font-medium pt-2">
                  <span>📄 Kertas: Landscape</span>
                  <span>•</span>
                  <span>🏆 Standar Rapor Madrasah/Sekolah</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-6 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => triggerPrintDoc('leger-nilai', `Leger Nilai Kelas ${selectedClass}`)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Leger Nilai</span>
                </button>
                <button
                  type="button"
                  onClick={() => openPreview('leger-nilai', `Leger Nilai Kelas ${selectedClass}`)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-700 transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>

            {/* Link cepat ke modul Penilaian */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Input & Kelola Nilai
                  </span>
                  <FileSpreadsheet className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
                <h3 className="text-base font-bold text-white">Kelola & Input Nilai di Menu Nilai</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ingin mengubah nilai, mengatur bobot persentase materi UH, atau mengubah deskripsi kompetensi? Kunjungi modul Penilaian Harian langsung.
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-300 font-medium pt-2">
                  <span>⚙️ Atur Bobot UH, UTS, UAS</span>
                  <span>•</span>
                  <span>📊 Ekspor Format CSV / Excel</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => navigateToSubTab('Penilaian Harian', 'cetak-rekap')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
                >
                  <span>Buka Menu Penilaian Harian</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INTERACTIVE LIVE PREVIEW MODAL (Rendered to document.body to prevent being covered by Sidebar) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {previewDoc && (
            <div 
              className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-hidden"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setPreviewDoc(null);
                }
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative z-[100]"
                onClick={(e) => e.stopPropagation()}
              >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      Pratinjau Dokumen Cetak
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {paperSize} • {paperOrientation}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 truncate max-w-md">
                      {previewTitle}
                    </p>
                  </div>
                </div>

                {/* Modal Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Paper Size Selector */}
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaperSize('A4')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        paperSize === 'A4' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      A4
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaperSize('F4')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        paperSize === 'F4' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      F4
                    </button>
                  </div>

                  {/* Orientation Selector */}
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaperOrientation('landscape')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        paperOrientation === 'landscape' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Landscape
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaperOrientation('portrait')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        paperOrientation === 'portrait' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Portrait
                    </button>
                  </div>

                  {/* Density Selector */}
                  <select
                    value={printDensity}
                    onChange={(e) => setPrintDensity(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="kompak">Kompak (8.5pt)</option>
                    <option value="standar">Standar (9.5pt)</option>
                    <option value="lapang">Lapang (10.5pt)</option>
                  </select>

                  {/* Print Action */}
                  <button
                    type="button"
                    onClick={() => triggerPrintDoc(previewDoc, previewTitle)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Sekarang</span>
                  </button>

                  {/* Close Modal */}
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Tutup Pratinjau"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Document Preview Canvas (Real Paper Simulation with Dedicated Workdesk Background) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 sm:pb-24 pb-20 bg-slate-950 flex justify-center items-start">
                <div 
                  className={`bg-white text-black shadow-2xl transition-all font-serif rounded-sm border border-slate-200 ${
                    paperOrientation === 'landscape' ? 'w-full max-w-[1050px]' : 'w-full max-w-[800px]'
                  }`}
                  style={{
                    backgroundColor: '#ffffff',
                    padding: pageMargin === '8mm' ? '24px 32px' : pageMargin === '12mm' ? '36px 44px' : '48px 56px',
                    minHeight: paperOrientation === 'landscape' ? '580px' : '780px',
                    marginBottom: '40px'
                  }}
                >
                  <style>
                    {getDocumentStyles(paperOrientation, paperSize, printDensity, pageMargin)}
                  </style>

                  {/* Kop */}
                  {showKop && (
                    <div 
                      dangerouslySetInnerHTML={{ __html: generateOfficialKopHtml(settings) }}
                    />
                  )}

                  {/* Content Body */}
                  <div
                    dangerouslySetInnerHTML={{ __html: getDocContentHtml(previewDoc) }}
                  />

                  {/* Signatures */}
                  {showSignatures && (
                    <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ textAlign: 'center', minWidth: '200px' }}>
                        <p style={{ margin: '2px 0' }}>Mengetahui,</p>
                        <p style={{ margin: '2px 0', fontWeight: 'bold' }}>{settings?.jabatanKepalaSekolah || 'Kepala Sekolah'}</p>
                        {settings?.ttdKepalaSekolahUrl 
                          ? <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src={settings.ttdKepalaSekolahUrl} style={{ maxHeight: '48px', maxWidth: '150px', objectFit: 'contain' }} alt="TTD Kepala Sekolah" /></div>
                          : <div style={{ height: '50px' }}></div>
                        }
                        <p style={{ margin: '2px 0', fontWeight: 'bold', textDecoration: 'underline' }}>{settings?.namaKepalaSekolah || settings?.kepalaSekolah || 'Drs. H. Ahmad Dahlan, M.Pd'}</p>
                        <p style={{ margin: '2px 0', fontSize: '9pt', fontFamily: 'monospace' }}>{settings?.nipKepalaSekolah ? `NIP. ${settings.nipKepalaSekolah}` : 'NIP. 19700101 199503 1 001'}</p>
                      </div>
                      <div style={{ textAlign: 'center', minWidth: '200px' }}>
                        <p style={{ margin: '2px 0' }}>{settings?.kotaTandaTangan || 'Bula'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p style={{ margin: '2px 0', fontWeight: 'bold' }}>Guru Pengampu / Wali Kelas</p>
                        {settings?.ttdGuruUrl 
                          ? <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src={settings.ttdGuruUrl} style={{ maxHeight: '48px', maxWidth: '150px', objectFit: 'contain' }} alt="TTD Guru" /></div>
                          : <div style={{ height: '50px' }}></div>
                        }
                        <p style={{ margin: '2px 0', fontWeight: 'bold', textDecoration: 'underline' }}>{settings?.namaGuru || settings?.guru || 'Guru Pengampu'}</p>
                        <p style={{ margin: '2px 0', fontSize: '9pt', fontFamily: 'monospace' }}>{settings?.nip || settings?.nipGuru ? `NIP. ${settings.nip || settings.nipGuru}` : '-'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span>💡 Tip:</span>
                  <span>Gunakan tombol "Cetak Sekarang" untuk membuka dialog printer atau simpan sebagai PDF berstandar resmi.</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </div>
  );
};
