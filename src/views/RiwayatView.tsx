import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, AttendanceRecord } from '../types';
import { SubNavHeader } from '../components/SubNavHeader';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, Filter, FileSpreadsheet, Trash2, Calendar, CheckCircle2, Clock, 
  AlertCircle, Pencil, X, Save, ShieldCheck, Printer, Layers, CalendarDays, 
  RefreshCw, FolderArchive, Search, UserCheck, AlertTriangle, ArrowRight,
  TrendingUp, BarChart3, PieChart, Sparkles, Check, CheckSquare
} from 'lucide-react';
import { cleanDateFormat, cleanTimeFormat } from '../utils/formatters';

export const RiwayatView: React.FC = () => {
  const { 
    attendance, students, updateAttendanceStatus, editAttendanceRecord, 
    deleteAttendance, settings, pullDataFromSheets, isPullingFromSheets,
    academicYears, activeAcademicYear, getActiveSubTab, setActiveSubTab, showToast
  } = useApp();

  const activeSubTab = getActiveSubTab('Riwayat') || 'log-presensi';

  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('SEMUA');
  const [filterPeriod, setFilterPeriod] = useState<'SEMUA' | 'HARIAN' | 'MINGGUAN' | 'BULANAN' | 'SEMESTER'>('SEMUA');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');
  const [filterClass, setFilterClass] = useState<string>('SEMUA');
  const [searchLog, setSearchLog] = useState<string>('');

  // Quick Correction Form State (Submenu 3)
  const [quickStudentId, setQuickStudentId] = useState<string>('');
  const [quickDate, setQuickDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quickTime, setQuickTime] = useState<string>('07:15:00');
  const [quickStatus, setQuickStatus] = useState<AttendanceStatus>('Hadir');
  const [quickNote, setQuickNote] = useState<string>('');

  // Edit Modal State
  const [editingLog, setEditingLog] = useState<AttendanceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('Hadir');
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editMethod, setEditMethod] = useState<'QR Code' | 'Manual'>('QR Code');
  const [editNote, setEditNote] = useState<string>('');

  const classes = ['SEMUA', ...Array.from(new Set(students.map(s => s.class))).sort()];

  const openEditModal = (log: AttendanceRecord) => {
    setEditingLog(log);
    setEditStatus(log.status);
    setEditDate(log.date);
    setEditTime(log.time);
    setEditMethod(log.method);
    setEditNote(log.note || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    editAttendanceRecord(editingLog.id, {
      status: editStatus,
      date: editDate,
      time: editTime,
      method: editMethod,
      note: editNote.trim() || undefined
    });

    setEditingLog(null);
  };

  const handleQuickCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStudentId) {
      showToast('Pilih siswa yang ingin dikoreksi datanya.', 'warning');
      return;
    }

    const selectedSt = students.find(s => s.id === quickStudentId);
    if (!selectedSt) return;

    // Check if record exists for this date and student
    const existingLog = attendance.find(a => a.nisn === selectedSt.nisn && a.date === quickDate);
    if (existingLog) {
      editAttendanceRecord(existingLog.id, {
        status: quickStatus,
        time: quickTime,
        method: 'Manual',
        note: quickNote.trim() || 'Koreksi Riwayat Presensi'
      });
      showToast(`Presensi ${selectedSt.name} tanggal ${quickDate} berhasil diperbarui menjadi ${quickStatus}.`, 'success');
    } else {
      showToast(`Data presensi untuk ${selectedSt.name} tanggal ${quickDate} tidak ditemukan di log. Gunakan Presensi Manual di Dashboard untuk membuat baru.`, 'info');
    }

    setQuickNote('');
  };

  // Filtered Attendance Logic
  const filteredAttendance = useMemo(() => {
    return attendance.filter(record => {
      // 1. Academic Year filter
      let matchAcademicYear = true;
      if (filterAcademicYear !== 'SEMUA') {
        const selectedAy = academicYears.find(a => a.id === filterAcademicYear);
        if (selectedAy && selectedAy.startDate && selectedAy.endDate) {
          matchAcademicYear = record.date >= selectedAy.startDate && record.date <= selectedAy.endDate;
        }
      }

      // 2. Class filter
      const matchClass = filterClass === 'SEMUA' || record.class === filterClass;

      // 3. Status filter
      const matchStatus = filterStatus === 'SEMUA' || record.status === filterStatus;

      // 4. Search query
      const matchSearch = !searchLog || 
        record.studentName.toLowerCase().includes(searchLog.toLowerCase()) || 
        record.nisn.includes(searchLog) ||
        (record.note && record.note.toLowerCase().includes(searchLog.toLowerCase()));

      // 5. Period & Date filter
      let matchPeriod = true;
      const targetDateStr = record.date;
      const refDateStr = filterDate || new Date().toISOString().split('T')[0];

      if (filterPeriod === 'HARIAN') {
        matchPeriod = filterDate ? targetDateStr === filterDate : targetDateStr === refDateStr;
      } else if (filterPeriod === 'MINGGUAN') {
        const tTime = new Date(targetDateStr).getTime();
        const rTime = new Date(refDateStr).getTime();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        matchPeriod = tTime >= (rTime - sevenDaysMs) && tTime <= (rTime + 24 * 60 * 60 * 1000);
      } else if (filterPeriod === 'BULANAN') {
        matchPeriod = targetDateStr.substring(0, 7) === refDateStr.substring(0, 7);
      } else if (filterPeriod === 'SEMESTER') {
        const tDate = new Date(targetDateStr);
        const rDate = new Date(refDateStr);
        const tYear = tDate.getFullYear();
        const rYear = rDate.getFullYear();
        const tSem = tDate.getMonth() >= 6 ? 1 : 2;
        const rSem = rDate.getMonth() >= 6 ? 1 : 2;
        matchPeriod = tYear === rYear && tSem === rSem;
      } else if (filterPeriod === 'SEMUA') {
        if (filterDate) {
          matchPeriod = targetDateStr === filterDate;
        }
      }

      return matchAcademicYear && matchClass && matchStatus && matchPeriod && matchSearch;
    });
  }, [attendance, filterAcademicYear, academicYears, filterClass, filterStatus, searchLog, filterPeriod, filterDate]);

  // Summary Statistics Metrics
  const totalLogs = filteredAttendance.length;
  const totalHadir = filteredAttendance.filter(l => l.status === 'Hadir').length;
  const totalTerlambat = filteredAttendance.filter(l => l.status === 'Terlambat').length;
  const totalIzin = filteredAttendance.filter(l => l.status === 'Izin').length;
  const totalSakit = filteredAttendance.filter(l => l.status === 'Sakit').length;
  const totalAlpa = filteredAttendance.filter(l => l.status === 'Alpa').length;
  const totalHadirFisik = totalHadir + totalTerlambat;

  const hadirPercentage = totalLogs > 0 ? Math.round((totalHadirFisik / totalLogs) * 100) : 0;
  const onTimePercentage = totalHadirFisik > 0 ? Math.round((totalHadir / totalHadirFisik) * 100) : 0;

  // Breakdown statistics per class
  const classBreakdown = useMemo(() => {
    const map: Record<string, { total: number; hadir: number; terlambat: number; izin: number; sakit: number; alpa: number }> = {};
    
    filteredAttendance.forEach(rec => {
      if (!map[rec.class]) {
        map[rec.class] = { total: 0, hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpa: 0 };
      }
      map[rec.class].total++;
      if (rec.status === 'Hadir') map[rec.class].hadir++;
      else if (rec.status === 'Terlambat') map[rec.class].terlambat++;
      else if (rec.status === 'Izin') map[rec.class].izin++;
      else if (rec.status === 'Sakit') map[rec.class].sakit++;
      else if (rec.status === 'Alpa') map[rec.class].alpa++;
    });

    return Object.entries(map).map(([className, stats]) => {
      const hadirAll = stats.hadir + stats.terlambat;
      const rate = stats.total > 0 ? Math.round((hadirAll / stats.total) * 100) : 0;
      return {
        className,
        ...stats,
        hadirAll,
        rate
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [filteredAttendance]);

  // Student-level attendance recap stats (H, T, I, S, A) with Jenis Kelamin
  const studentRecapStats = useMemo(() => {
    let targetStudents = students;
    if (filterClass !== 'SEMUA') {
      targetStudents = students.filter(s => s.class === filterClass);
    }
    if (targetStudents.length === 0) {
      const uniqueStudentsMap = new Map<string, { id: string; name: string; nisn: string; class: string; gender?: 'L' | 'P' }>();
      filteredAttendance.forEach(a => {
        if (!uniqueStudentsMap.has(a.nisn)) {
          const stObj = students.find(s => s.nisn === a.nisn);
          uniqueStudentsMap.set(a.nisn, {
            id: a.studentId,
            name: a.studentName,
            nisn: a.nisn,
            class: a.class,
            gender: stObj?.gender
          });
        }
      });
      targetStudents = Array.from(uniqueStudentsMap.values()) as any;
    }

    const list = targetStudents.map(st => {
      const logs = filteredAttendance.filter(l => l.nisn === st.nisn || l.studentId === st.id);
      const countH = logs.filter(l => l.status === 'Hadir').length;
      const countT = logs.filter(l => l.status === 'Terlambat').length;
      const countI = logs.filter(l => l.status === 'Izin').length;
      const countS = logs.filter(l => l.status === 'Sakit').length;
      const countA = logs.filter(l => l.status === 'Alpa').length;
      const totalHadirFisik = countH + countT;
      const totalRecorded = countH + countT + countI + countS + countA;
      const rate = totalRecorded > 0 ? Math.round((totalHadirFisik / totalRecorded) * 100) : 0;
      return {
        ...st,
        countH,
        countT,
        countI,
        countS,
        countA,
        totalHadirFisik,
        totalRecorded,
        rate
      };
    });

    return list.sort((a, b) => {
      if (a.class !== b.class) return (a.class || '').localeCompare(b.class || '', 'id', { numeric: true });
      return (a.name || '').localeCompare(b.name || '', 'id');
    });
  }, [students, filteredAttendance, filterClass]);

  const getAcademicYearLabel = () => {
    if (filterAcademicYear === 'SEMUA') {
      return activeAcademicYear ? `TA ${activeAcademicYear.name} (Aktif)` : 'Semua Tahun Ajaran';
    }
    const ay = academicYears.find(a => a.id === filterAcademicYear);
    return ay ? `TA ${ay.name} (Sem ${ay.semester.charAt(0)})` : 'Tahun Ajaran';
  };

  const getPeriodLabelText = () => {
    const refStr = filterDate || 'Hari ini';
    switch (filterPeriod) {
      case 'HARIAN': return `Harian (${refStr})`;
      case 'MINGGUAN': return `Mingguan (7 Hari dari ${refStr})`;
      case 'BULANAN': return `Bulanan (${filterDate ? filterDate.substring(0, 7) : 'Bulan Ini'})`;
      case 'SEMESTER': return `Semester (${filterDate ? filterDate.substring(0, 4) : 'Tahun Ini'})`;
      default: return 'Semua Periode';
    }
  };

  const handlePrintReport = () => {
    // 1. Gather target students according to class filter
    let targetStudents = students;
    if (filterClass !== 'SEMUA') {
      targetStudents = students.filter(s => s.class === filterClass);
    }
    
    // Fallback: if students list in context is empty, extract from filteredAttendance
    if (targetStudents.length === 0) {
      const uniqueStudentsMap = new Map<string, { id: string; name: string; nisn: string; class: string; gender?: 'L' | 'P' }>();
      filteredAttendance.forEach(a => {
        if (!uniqueStudentsMap.has(a.nisn)) {
          const stObj = students.find(s => s.nisn === a.nisn);
          uniqueStudentsMap.set(a.nisn, {
            id: a.studentId,
            name: a.studentName,
            nisn: a.nisn,
            class: a.class,
            gender: stObj?.gender
          });
        }
      });
      targetStudents = Array.from(uniqueStudentsMap.values()) as any;
    }

    if (targetStudents.length === 0 && filteredAttendance.length === 0) {
      showToast('Tidak ada data presensi atau siswa untuk dicetak.', 'warning');
      return;
    }

    // Sort students by class then by name
    targetStudents = [...targetStudents].sort((a, b) => {
      if (a.class !== b.class) return (a.class || '').localeCompare(b.class || '', 'id', { numeric: true });
      return (a.name || '').localeCompare(b.name || '', 'id');
    });

    const schoolName = settings.sekolah || 'SEKOLAH DIGITAL';
    const schoolAddress = settings.alamat || '';
    const schoolNpsn = settings.npsn ? `NPSN: ${settings.npsn}` : '';
    const teacherName = settings.namaGuru || 'Guru Pengampu';
    const teacherNip = settings.nip ? `NIP: ${settings.nip}` : '';
    const teacherTtdUrl = settings.ttdGuruUrl || '';
    const principalName = settings.namaKepalaSekolah || 'Drs. H. Ahmad Dahlan, M.Pd';
    const principalNip = settings.nipKepalaSekolah ? `NIP: ${settings.nipKepalaSekolah}` : 'NIP: 19700101 199503 1 001';
    const principalTitle = settings.jabatanKepalaSekolah || 'Kepala Sekolah';
    const principalTtdUrl = settings.ttdKepalaSekolahUrl || '';
    const citySign = settings.kotaTandaTangan || 'Bula';
    const periodText = getPeriodLabelText();
    const ayText = getAcademicYearLabel();
    const classText = filterClass === 'SEMUA' ? 'Semua Kelas' : `Kelas ${filterClass}`;
    const currentDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let grandTotalH = 0;
    let grandTotalT = 0;
    let grandTotalI = 0;
    let grandTotalS = 0;
    let grandTotalA = 0;

    const tableRowsHtml = targetStudents.map((student, idx) => {
      // Find all matching attendance records for this student in filteredAttendance
      const studentLogs = filteredAttendance.filter(l => l.nisn === student.nisn || l.studentId === student.id);
      
      const countH = studentLogs.filter(l => l.status === 'Hadir').length;
      const countT = studentLogs.filter(l => l.status === 'Terlambat').length;
      const countI = studentLogs.filter(l => l.status === 'Izin').length;
      const countS = studentLogs.filter(l => l.status === 'Sakit').length;
      const countA = studentLogs.filter(l => l.status === 'Alpa').length;

      const totalHadirFisik = countH + countT;
      const totalRec = countH + countT + countI + countS + countA;
      const percentage = totalRec > 0 ? Math.round((totalHadirFisik / totalRec) * 100) : 0;
      const genderLabel = student.gender ? student.gender : '-';

      grandTotalH += countH;
      grandTotalT += countT;
      grandTotalI += countI;
      grandTotalS += countS;
      grandTotalA += countA;

      return `
        <tr style="border-bottom: 1px solid #cbd5e1; font-size: 11px;">
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1;">${idx + 1}</td>
          <td style="padding: 6px 6px; font-family: monospace; text-align: center; border: 1px solid #cbd5e1; font-size: 10px;">${student.nisn || '-'}</td>
          <td style="padding: 6px 8px; font-weight: bold; border: 1px solid #cbd5e1; text-align: left;">${student.name}</td>
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">${genderLabel}</td>
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">${student.class}</td>
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #166534; background: ${countH > 0 ? '#f0fdf4' : 'transparent'};">${countH}</td>
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #92400e; background: ${countT > 0 ? '#fffbeb' : 'transparent'};">${countT}</td>
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #0369a1; background: ${countI > 0 ? '#f0f9ff' : 'transparent'};">${countI}</td>
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #7e22ce; background: ${countS > 0 ? '#faf5ff' : 'transparent'};">${countS}</td>
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #be123c; background: ${countA > 0 ? '#fff1f2' : 'transparent'};">${countA}</td>
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; background: #f8fafc;">${totalHadirFisik}</td>
          <td style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: ${percentage >= 85 ? '#166534' : percentage >= 70 ? '#92400e' : '#be123c'};">${percentage}%</td>
        </tr>
      `;
    }).join('');

    const grandTotalRecorded = grandTotalH + grandTotalT + grandTotalI + grandTotalS + grandTotalA;
    const grandTotalHadirFisik = grandTotalH + grandTotalT;
    const overallRate = grandTotalRecorded > 0 ? Math.round((grandTotalHadirFisik / grandTotalRecorded) * 100) : 0;

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Laporan Rekapitulasi Kehadiran - ${schoolName}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm 15mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 12px; font-size: 11px; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; }
            .header h1 { margin: 0; font-size: 17px; text-transform: uppercase; letter-spacing: 0.5px; }
            .header h2 { margin: 3px 0 0 0; font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
            .header p { margin: 2px 0 0 0; font-size: 10px; color: #64748b; }
            .meta-grid { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; font-size: 11px; }
            .meta-item { display: inline-block; margin-right: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th { background-color: #f1f5f9; border: 1px solid #94a3b8; padding: 6px 4px; text-align: center; font-size: 10px; text-transform: uppercase; color: #1e293b; font-weight: bold; }
            td { border: 1px solid #cbd5e1; }
            .legend { margin-top: 10px; font-size: 9.5px; color: #475569; display: flex; justify-content: space-between; align-items: center; border: 1px dashed #cbd5e1; padding: 6px 10px; border-radius: 4px; background: #fafafa; }
            .signatures { display: flex; justify-content: space-between; margin-top: 36px; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 220px; font-size: 11px; }
            .sig-space { height: 50px; }
            @media print {
              body { padding: 0; }
              @page { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${schoolName}</h1>
            ${schoolAddress || schoolNpsn ? `<p>${[schoolAddress, schoolNpsn].filter(Boolean).join(' • ')}</p>` : ''}
            <h2>LAPORAN REKAPITULASI KEHADIRAN SISWA</h2>
          </div>

          <div class="meta-grid">
            <div>
              <span class="meta-item"><strong>Tahun Ajaran:</strong> ${ayText}</span>
              <span class="meta-item"><strong>Kelas:</strong> ${classText}</span>
              <span class="meta-item"><strong>Periode:</strong> ${periodText}</span>
            </div>
            <div>
              <strong>Total Siswa:</strong> ${targetStudents.length} siswa
            </div>
          </div>

          <table>
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th rowspan="2" style="width: 28px;">No</th>
                <th rowspan="2" style="width: 80px;">NISN</th>
                <th rowspan="2" style="text-align: left; padding-left: 8px;">Nama Siswa</th>
                <th rowspan="2" style="width: 38px;">L/P</th>
                <th rowspan="2" style="width: 60px;">Kelas</th>
                <th colspan="5" style="background: #e2e8f0;">Rekapitulasi Kehadiran</th>
                <th rowspan="2" style="width: 50px;">Total Hadir</th>
                <th rowspan="2" style="width: 45px;">%</th>
              </tr>
              <tr style="background-color: #f8fafc;">
                <th style="width: 32px; color: #166534; background: #dcfce7;">H</th>
                <th style="width: 32px; color: #92400e; background: #fef3c7;">T</th>
                <th style="width: 32px; color: #0369a1; background: #e0f2fe;">I</th>
                <th style="width: 32px; color: #7e22ce; background: #f3e8ff;">S</th>
                <th style="width: 32px; color: #be123c; background: #ffe4e6;">A</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a; font-size: 11px;">
                <td colspan="5" style="text-align: center; padding: 7px; border: 1px solid #94a3b8;">JUMLAH TOTAL</td>
                <td style="text-align: center; padding: 7px; border: 1px solid #94a3b8; color: #166534; background: #dcfce7;">${grandTotalH}</td>
                <td style="text-align: center; padding: 7px; border: 1px solid #94a3b8; color: #92400e; background: #fef3c7;">${grandTotalT}</td>
                <td style="text-align: center; padding: 7px; border: 1px solid #94a3b8; color: #0369a1; background: #e0f2fe;">${grandTotalI}</td>
                <td style="text-align: center; padding: 7px; border: 1px solid #94a3b8; color: #7e22ce; background: #f3e8ff;">${grandTotalS}</td>
                <td style="text-align: center; padding: 7px; border: 1px solid #94a3b8; color: #be123c; background: #ffe4e6;">${grandTotalA}</td>
                <td style="text-align: center; padding: 7px; border: 1px solid #94a3b8;">${grandTotalHadirFisik}</td>
                <td style="text-align: center; padding: 7px; border: 1px solid #94a3b8;">${overallRate}%</td>
              </tr>
            </tfoot>
          </table>

          <div class="legend">
            <div>
              <strong>Keterangan Status:</strong> 
              <span style="color: #166534; font-weight: bold;">H</span>: Hadir Tepat Waktu | 
              <span style="color: #92400e; font-weight: bold;">T</span>: Terlambat | 
              <span style="color: #0369a1; font-weight: bold;">I</span>: Izin | 
              <span style="color: #7e22ce; font-weight: bold;">S</span>: Sakit | 
              <span style="color: #be123c; font-weight: bold;">A</span>: Alpa / Tanpa Keterangan
            </div>
            <div>
              <strong>Jenis Kelamin:</strong> L: Laki-laki | P: Perempuan
            </div>
          </div>

          <div class="signatures">
            <div class="sig-box">
              <p>Mengetahui,</p>
              <p><strong>${principalTitle}</strong></p>
              ${principalTtdUrl ? `<div class="sig-space" style="display:flex;align-items:center;justify-content:center;"><img src="${principalTtdUrl}" style="max-height:50px;max-width:150px;object-fit:contain;margin:0 auto;" /></div>` : `<div class="sig-space"></div>`}
              <p><strong><u>${principalName}</u></strong></p>
              <p style="font-size:10px; margin-top:2px; color:#475569;">${principalNip}</p>
            </div>
            <div class="sig-box">
              <p>${citySign}, ${currentDate}</p>
              <p><strong>Guru / Wali Kelas</strong></p>
              ${teacherTtdUrl ? `<div class="sig-space" style="display:flex;align-items:center;justify-content:center;"><img src="${teacherTtdUrl}" style="max-height:50px;max-width:150px;object-fit:contain;margin:0 auto;" /></div>` : `<div class="sig-space"></div>`}
              <p><strong><u>${teacherName}</u></strong></p>
              ${teacherNip ? `<p style="font-size:10px; margin-top:2px; color:#475569;">${teacherNip}</p>` : ''}
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(reportHtml);
      printWin.document.close();
      printWin.focus();
    } else {
      window.print();
    }
  };

  const exportFilteredCSV = () => {
    let targetStudents = students;
    if (filterClass !== 'SEMUA') {
      targetStudents = students.filter(s => s.class === filterClass);
    }
    if (targetStudents.length === 0) {
      const uniqueStudentsMap = new Map<string, { id: string; name: string; nisn: string; class: string; gender?: 'L' | 'P' }>();
      filteredAttendance.forEach(a => {
        if (!uniqueStudentsMap.has(a.nisn)) {
          const stObj = students.find(s => s.nisn === a.nisn);
          uniqueStudentsMap.set(a.nisn, {
            id: a.studentId,
            name: a.studentName,
            nisn: a.nisn,
            class: a.class,
            gender: stObj?.gender
          });
        }
      });
      targetStudents = Array.from(uniqueStudentsMap.values()) as any;
    }

    if (targetStudents.length === 0) {
      showToast('Tidak ada data untuk diekspor.', 'warning');
      return;
    }

    targetStudents = [...targetStudents].sort((a, b) => {
      if (a.class !== b.class) return (a.class || '').localeCompare(b.class || '', 'id', { numeric: true });
      return (a.name || '').localeCompare(b.name || '', 'id');
    });

    const headers = ['No', 'NISN', 'Nama Siswa', 'Jenis Kelamin', 'Kelas', 'Hadir (H)', 'Terlambat (T)', 'Izin (I)', 'Sakit (S)', 'Alpa (A)', 'Total Hadir', 'Persentase (%)'];
    const rows = targetStudents.map((student, idx) => {
      const studentLogs = filteredAttendance.filter(l => l.nisn === student.nisn || l.studentId === student.id);
      const countH = studentLogs.filter(l => l.status === 'Hadir').length;
      const countT = studentLogs.filter(l => l.status === 'Terlambat').length;
      const countI = studentLogs.filter(l => l.status === 'Izin').length;
      const countS = studentLogs.filter(l => l.status === 'Sakit').length;
      const countA = studentLogs.filter(l => l.status === 'Alpa').length;
      const totalHadirFisik = countH + countT;
      const totalRec = countH + countT + countI + countS + countA;
      const percentage = totalRec > 0 ? Math.round((totalHadirFisik / totalRec) * 100) : 0;
      const gender = student.gender ? student.gender : '-';

      return [
        idx + 1,
        `"${student.nisn || ''}"`,
        `"${student.name}"`,
        `"${gender}"`,
        `"${student.class}"`,
        countH,
        countT,
        countI,
        countS,
        countA,
        totalHadirFisik,
        `"${percentage}%"`
      ];
    });

    const periodLabel = filterPeriod === 'SEMUA' ? 'Semua_Periode' : filterPeriod;
    const classLabel = filterClass === 'SEMUA' ? 'Semua_Kelas' : `Kelas_${filterClass}`;

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Kehadiran_${classLabel}_${periodLabel}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Submenu Navigation Header */}
      <SubNavHeader
        currentTab="Riwayat"
        activeSubTab={activeSubTab}
        onSelectSubTab={(id) => setActiveSubTab('Riwayat', id)}
        badgeCounts={{
          'log-presensi': `${filteredAttendance.length} Log`,
          'rekap-statistik': `${hadirPercentage}% Hadir`,
          'kelola-koreksi': 'Koreksi'
        }}
        extraActions={
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReport}
              disabled={filteredAttendance.length === 0}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cetak Rekap</span>
            </button>
            <button
              onClick={exportFilteredCSV}
              disabled={filteredAttendance.length === 0}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh CSV</span>
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
          {/* SUBMENU 1: LOG PRESENSI LENGKAP & RIWAYAT SCAN                            */}
          {/* ========================================================================= */}
          {activeSubTab === 'log-presensi' && (
            <div className="space-y-6">
          
          {/* Filter & Sort Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-900 p-4 rounded-3xl border border-slate-800">
            
            {/* Academic Year Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2">
              <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="w-full">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tahun Ajaran</label>
                <select
                  value={filterAcademicYear}
                  onChange={(e) => setFilterAcademicYear(e.target.value)}
                  className="w-full bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="SEMUA" className="bg-slate-900 text-white">Semua TA</option>
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.id} className="bg-slate-900 text-white">
                      TA {ay.name} (Sem {ay.semester.charAt(0)}) {ay.isCurrent ? '⭐' : ay.isArchived ? '📦' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Class Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2">
              <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="w-full">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">1. Pilih Kelas</label>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="w-full bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  {classes.map(c => (
                    <option key={c} value={c} className="bg-slate-900 text-white">
                      {c === 'SEMUA' ? 'Semua Kelas' : `Kelas ${c}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Period Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2">
              <CalendarDays className="w-4 h-4 text-teal-400 shrink-0" />
              <div className="w-full">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">2. Periode</label>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value as any)}
                  className="w-full bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="SEMUA" className="bg-slate-900 text-white">Semua Periode</option>
                  <option value="HARIAN" className="bg-slate-900 text-white">Harian (Per Hari)</option>
                  <option value="MINGGUAN" className="bg-slate-900 text-white">Mingguan (7 Hari)</option>
                  <option value="BULANAN" className="bg-slate-900 text-white">Bulanan (Per Bulan)</option>
                  <option value="SEMESTER" className="bg-slate-900 text-white">Semester (6 Bulan)</option>
                </select>
              </div>
            </div>

            {/* Reference Date Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="w-full">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">3. Tanggal Acuan</label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
                  />
                  {filterDate && (
                    <button
                      onClick={() => setFilterDate('')}
                      title="Reset Tanggal"
                      className="text-[10px] text-slate-400 hover:text-rose-400 font-bold px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2">
              <Filter className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="w-full">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">4. Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="SEMUA" className="bg-slate-900 text-white">Semua Status</option>
                  <option value="Hadir" className="bg-slate-900 text-emerald-400">Hadir</option>
                  <option value="Terlambat" className="bg-slate-900 text-amber-400">Terlambat</option>
                  <option value="Izin" className="bg-slate-900 text-sky-400">Izin</option>
                  <option value="Sakit" className="bg-slate-900 text-purple-400">Sakit</option>
                  <option value="Alpa" className="bg-slate-900 text-rose-400">Alpa</option>
                </select>
              </div>
            </div>

          </div>

          {/* Search bar inside Log view */}
          <div className="flex items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama siswa, NISN, atau keterangan catatan..."
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono shrink-0">
              Menampilkan <span className="text-white font-bold">{filteredAttendance.length}</span> catatan
            </div>
          </div>

          {/* History Log Table */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="p-4">Tanggal & Jam</th>
                    <th className="p-4">Nama Siswa</th>
                    <th className="p-4">Kelas / NISN</th>
                    <th className="p-4">Status Presensi</th>
                    <th className="p-4">Metode & Catatan</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500 text-xs italic">
                        Belum ada riwayat presensi yang sesuai dengan kriteria filter ({filterClass}, {getPeriodLabelText()}).
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map(log => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono">
                          <p className="font-bold text-white">{cleanDateFormat(log.date)}</p>
                          <p className="text-[11px] text-emerald-400 font-mono">{cleanTimeFormat(log.time)}</p>
                        </td>

                        <td className="p-4 font-bold text-white">
                          {log.studentName}
                        </td>

                        <td className="p-4 font-mono text-xs">
                          <span className="text-slate-200 font-bold">{log.class}</span>
                          <p className="text-[11px] text-slate-500">{log.nisn}</p>
                        </td>

                        <td className="p-4">
                          <select
                            value={log.status}
                            onChange={(e) => updateAttendanceStatus(log.id, e.target.value as AttendanceStatus)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-full border focus:outline-none cursor-pointer ${
                              log.status === 'Hadir'
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                                : log.status === 'Terlambat'
                                ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                                : 'bg-rose-950/80 text-rose-400 border-rose-800'
                            }`}
                          >
                            <option value="Hadir" className="bg-slate-900 text-emerald-400">Hadir</option>
                            <option value="Terlambat" className="bg-slate-900 text-amber-400">Terlambat</option>
                            <option value="Izin" className="bg-slate-900 text-sky-400">Izin</option>
                            <option value="Sakit" className="bg-slate-900 text-purple-400">Sakit</option>
                            <option value="Alpa" className="bg-slate-900 text-rose-400">Alpa</option>
                          </select>
                        </td>

                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                              {log.method}
                            </span>
                            {log.note && (
                              <p className="text-xs text-slate-300 italic mt-1">{log.note}</p>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            <button
                              onClick={() => openEditModal(log)}
                              title="Edit Riwayat Presensi"
                              className="p-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setDeletingRecord(log)}
                              title="Hapus Log Presensi"
                              className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMENU 2: REKAPITULASI & STATISTIK KEHADIRAN                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'rekap-statistik' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Key Metrics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Total Presensi Tercatat</span>
                <History className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-white mt-2">{totalLogs}</p>
              <p className="text-[11px] text-slate-500 mt-1">Berdasarkan filter aktif saat ini</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Kehadiran Fisik</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-emerald-400 mt-2">{totalHadirFisik}</p>
              <p className="text-[11px] text-emerald-400/80 mt-1">{hadirPercentage}% dari total log ({totalHadir} tepat waktu)</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Keterlambatan</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-black text-amber-400 mt-2">{totalTerlambat}</p>
              <p className="text-[11px] text-amber-400/80 mt-1">{totalHadirFisik > 0 ? Math.round((totalTerlambat / totalHadirFisik) * 100) : 0}% dari siswa hadir</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Izin, Sakit & Alpa</span>
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-3xl font-black text-rose-400 mt-2">{totalIzin + totalSakit + totalAlpa}</p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">I:{totalIzin} • S:{totalSakit} • A:{totalAlpa}</p>
            </div>
          </div>

          {/* Class Attendance Breakdown Table */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <span>Rekapitulasi Persentase Kehadiran Per Rombel / Kelas</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tingkat partisipasi kehadiran dan perbandingan antar kelas
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReport}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Format Dinas</span>
                </button>
              </div>
            </div>

            {classBreakdown.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs italic">
                Belum ada data presensi untuk dihitung statistik kelasnya.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4 text-center">Total Log</th>
                      <th className="py-3 px-4 text-center">Hadir Tepat</th>
                      <th className="py-3 px-4 text-center">Terlambat</th>
                      <th className="py-3 px-4 text-center">Izin</th>
                      <th className="py-3 px-4 text-center">Sakit</th>
                      <th className="py-3 px-4 text-center">Alpa</th>
                      <th className="py-3 px-4">Tingkat Kehadiran (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {classBreakdown.map(item => (
                      <tr key={item.className} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white text-sm">{item.className}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold">{item.total}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-emerald-400 font-bold">{item.hadir}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-amber-400 font-bold">{item.terlambat}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-sky-400 font-bold">{item.izin}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-purple-400 font-bold">{item.sakit}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-rose-400 font-bold">{item.alpa}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${item.rate}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-xs text-white min-w-[36px] text-right">
                              {item.rate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Student-level Attendance Breakdown Table (H, T, I, S, A) with Jenis Kelamin */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-400" />
                  <span>Daftar Rekapitulasi Presensi Individu Siswa (H, T, I, S, A)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rincian absensi per siswa sesuai filter ({filterClass === 'SEMUA' ? 'Semua Kelas' : `Kelas ${filterClass}`}, {getPeriodLabelText()})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReport}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Rekap Siswa</span>
                </button>
              </div>
            </div>

            {studentRecapStats.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs italic">
                Tidak ada data siswa untuk ditampilkan pada filter saat ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3 text-center w-10">No</th>
                      <th className="py-3 px-3">NISN</th>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-3 text-center">L/P</th>
                      <th className="py-3 px-3 text-center">Kelas</th>
                      <th className="py-3 px-3 text-center text-emerald-400">H</th>
                      <th className="py-3 px-3 text-center text-amber-400">T</th>
                      <th className="py-3 px-3 text-center text-sky-400">I</th>
                      <th className="py-3 px-3 text-center text-purple-400">S</th>
                      <th className="py-3 px-3 text-center text-rose-400">A</th>
                      <th className="py-3 px-3 text-center">Total Hadir</th>
                      <th className="py-3 px-4">Kehadiran (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {studentRecapStats.map((st, idx) => (
                      <tr key={st.id || st.nisn || idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">{st.nisn || '-'}</td>
                        <td className="py-3 px-4 font-bold text-white text-xs">{st.name}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.gender === 'L' ? 'bg-sky-950 text-sky-400 border border-sky-800/50' :
                            st.gender === 'P' ? 'bg-pink-950 text-pink-400 border border-pink-800/50' :
                            'text-slate-500'
                          }`}>
                            {st.gender || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-300">{st.class}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">{st.countH}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-amber-400 bg-amber-950/20">{st.countT}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-sky-400 bg-sky-950/20">{st.countI}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-purple-400 bg-purple-950/20">{st.countS}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-rose-400 bg-rose-950/20">{st.countA}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-white">{st.totalHadirFisik}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 min-w-[50px]">
                              <div
                                className={`h-full rounded-full ${
                                  st.rate >= 85 ? 'bg-emerald-500' :
                                  st.rate >= 70 ? 'bg-amber-500' :
                                  'bg-rose-500'
                                }`}
                                style={{ width: `${st.rate}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-[11px] text-white min-w-[32px] text-right">
                              {st.rate}%
                            </span>
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
      {/* SUBMENU 3: KELOLA, KOREKSI & SINKRONISASI DATA                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'kelola-koreksi' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-150">
          
          {/* Left Column: Quick Correction Form */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Formulir Koreksi Cepat Presensi</h3>
                <p className="text-xs text-slate-400">Ubah status, tanggal, atau jam scan siswa terdaftar</p>
              </div>
            </div>

            <form onSubmit={handleQuickCorrectionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">1. Pilih Siswa yang Ingin Dikoreksi:</label>
                <select
                  value={quickStudentId}
                  onChange={(e) => setQuickStudentId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.class} - {s.nisn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">2. Tanggal Presensi:</label>
                  <input
                    type="date"
                    value={quickDate}
                    onChange={(e) => setQuickDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white font-mono rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">3. Jam Scan:</label>
                  <input
                    type="text"
                    value={quickTime}
                    onChange={(e) => setQuickTime(e.target.value)}
                    placeholder="07:15:00"
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white font-mono rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">4. Koreksi Status Kehadiran:</label>
                <select
                  value={quickStatus}
                  onChange={(e) => setQuickStatus(e.target.value as AttendanceStatus)}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Hadir" className="text-emerald-400">Hadir (Tepat Waktu)</option>
                  <option value="Terlambat" className="text-amber-400">Terlambat</option>
                  <option value="Izin" className="text-sky-400">Izin</option>
                  <option value="Sakit" className="text-purple-400">Sakit</option>
                  <option value="Alpa" className="text-rose-400">Alpa</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">5. Alasan Koreksi / Catatan:</label>
                <input
                  type="text"
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="Contoh: Salah scan kartu / Kartu tertinggal / Surat izin dokter"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Presensi Siswa</span>
              </button>
            </form>
          </div>

          {/* Right Column: Google Sheets Sync & Log Management Info */}
          <div className="space-y-6">
            
            {/* Google Sheets Sync Card */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Sinkronisasi Google Sheets 2-Arah</h3>
                  <p className="text-xs text-slate-400">Tarik data presensi terbaru atau pulihkan riwayat dari cloud</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Aplikasi secara otomatis mengirim scan presensi ke spreadsheet Anda. Jika Anda mengedit spreadsheet secara langsung di Google Sheets, Anda dapat menarik pembaruan kembali ke aplikasi ini.
              </p>

              {settings.spreadsheetUrl ? (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <p className="text-[11px] text-slate-400 font-bold uppercase">Spreadsheet Terhubung:</p>
                  <p className="text-xs text-emerald-400 font-mono truncate">{settings.spreadsheetUrl}</p>
                  <button
                    onClick={() => pullDataFromSheets(true)}
                    disabled={isPullingFromSheets}
                    className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isPullingFromSheets ? 'animate-spin' : ''}`} />
                    <span>{isPullingFromSheets ? 'Menyinkronkan dari Sheets...' : 'Tarik & Sinkronkan Data Sheets Sekarang'}</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400">
                  URL Google Sheets belum diatur. Buka menu <strong className="text-white">Pengaturan</strong> untuk menautkan spreadsheet Google.
                </div>
              )}
            </div>

            {/* Safety & Backup Helper Card */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl space-y-2 text-xs text-emerald-300">
              <p className="font-bold flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <span>Pencadangan Otomatis & Keamanan Data</span>
              </p>
              <p className="leading-relaxed">
                Seluruh catatan presensi tersimpan secara aman di database lokal browser Anda dan disinkronkan secara realtime dengan Google Sheets serta Firestore. Anda dapat mencadangkan seluruh data kapan saja melalui menu <b>Pengaturan &gt; Backup & Restore Data</b>.
              </p>
            </div>

          </div>

        </div>
      )}

        </motion.div>
      </AnimatePresence>

      {/* Edit Attendance Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Riwayat Presensi</h3>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {editingLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingLog(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student Info Card inside Modal */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white text-sm">{editingLog.studentName}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">NISN: {editingLog.nisn}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-emerald-400 font-bold font-mono">
                {editingLog.class}
              </span>
            </div>

            {/* Spreadsheet Sync Warning Note */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-[11px] text-emerald-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>
                <b>Otomatis Menimpa Spreadsheet:</b> Hasil edit akan memperbarui data lokal dan menimpa (overwrite) baris data di Google Sheets tanpa membuat baris baru.
              </span>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              
              {/* Status Select */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Status Presensi:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                  className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Terlambat">Terlambat</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Alpa">Alpa</option>
                </select>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Tanggal:</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Jam Scan / Log:</label>
                  <input
                    type="text"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    required
                    placeholder="07:15:00"
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Method Select */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Metode Scan:</label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value as 'QR Code' | 'Manual')}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
                >
                  <option value="QR Code">QR Code</option>
                  <option value="Manual">Manual Input</option>
                </select>
              </div>

              {/* Note Textarea */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Catatan / Keterangan (Opsional):</label>
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Contoh: Izin acara keluarga / Sakit demam dengan surat"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl p-3 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const recordToDelete = editingLog;
                    setEditingLog(null);
                    setDeletingRecord(recordToDelete);
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-500/20"
                  title="Hapus presensi ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLog(null)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan & Sync</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Konfirmasi Hapus Presensi</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan presensi untuk <strong className="text-white">{deletingRecord.studentName}</strong> (NISN: <span className="font-mono text-emerald-400">{deletingRecord.nisn}</span>) pada tanggal <span className="font-mono text-white">{deletingRecord.date}</span> jam <span className="font-mono text-slate-300">{deletingRecord.time}</span>?
            </p>
            <p className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
              <strong>Pemberitahuan Sinkronisasi:</strong> Menghapus catatan ini juga akan menghapus baris presensi terkait di spreadsheet Google Sheets Anda secara otomatis.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAttendance(deletingRecord.id);
                  setDeletingRecord(null);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Ya, Hapus Presensi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
