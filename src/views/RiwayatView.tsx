import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, AttendanceRecord } from '../types';
import { History, Filter, FileSpreadsheet, Trash2, Calendar, CheckCircle2, Clock, AlertCircle, Pencil, X, Save, ShieldCheck, Printer, Layers, CalendarDays } from 'lucide-react';

export const RiwayatView: React.FC = () => {
  const { attendance, students, updateAttendanceStatus, editAttendanceRecord, deleteAttendance, settings } = useApp();

  const [filterPeriod, setFilterPeriod] = useState<'SEMUA' | 'HARIAN' | 'MINGGUAN' | 'BULANAN' | 'SEMESTER'>('SEMUA');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');
  const [filterClass, setFilterClass] = useState<string>('SEMUA');

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

  // Filtered Attendance Logic by Period, Class, Status, and Reference Date
  const filteredAttendance = attendance.filter(record => {
    // 1. Class filter
    const matchClass = filterClass === 'SEMUA' || record.class === filterClass;

    // 2. Status filter
    const matchStatus = filterStatus === 'SEMUA' || record.status === filterStatus;

    // 3. Period & Date filter
    let matchPeriod = true;
    const targetDateStr = record.date; // "YYYY-MM-DD"
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
      const tSem = tDate.getMonth() >= 6 ? 1 : 2; // Semester 1: Jul-Des, Semester 2: Jan-Jun
      const rSem = rDate.getMonth() >= 6 ? 1 : 2;
      matchPeriod = tYear === rYear && tSem === rSem;
    } else if (filterPeriod === 'SEMUA') {
      if (filterDate) {
        matchPeriod = targetDateStr === filterDate;
      }
    }

    return matchClass && matchStatus && matchPeriod;
  });

  const handlePrintReport = () => {
    if (filteredAttendance.length === 0) return;

    const schoolName = settings.sekolah || 'SEKOLAH DIGITAL';
    const teacherName = settings.namaGuru || 'Guru Pengampu';
    const teacherNip = settings.nip ? `NIP: ${settings.nip}` : '';
    const periodText = getPeriodLabelText();
    const classText = filterClass === 'SEMUA' ? 'Semua Kelas' : `Kelas ${filterClass}`;
    const statusText = filterStatus === 'SEMUA' ? 'Semua Status' : filterStatus;
    const currentDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const tableRowsHtml = filteredAttendance.map((log, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px; text-align: center; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 8px; font-size: 11px; font-family: monospace;">
          <strong>${log.date}</strong><br>
          <span style="color: #059669;">${log.time}</span>
        </td>
        <td style="padding: 8px; font-size: 11px; font-weight: bold;">${log.studentName}</td>
        <td style="padding: 8px; font-size: 11px; font-family: monospace; text-align: center;">
          <strong>${log.class}</strong><br>
          <span style="color: #64748b; font-size: 10px;">${log.nisn}</span>
        </td>
        <td style="padding: 8px; font-size: 11px; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 999px; font-weight: bold; font-size: 10px; ${
            log.status === 'Hadir' ? 'background:#dcfce7; color:#166534;' :
            log.status === 'Terlambat' ? 'background:#fef3c7; color:#92400e;' :
            log.status === 'Izin' ? 'background:#e0f2fe; color:#075985;' :
            log.status === 'Sakit' ? 'background:#f3e8ff; color:#6b21a8;' :
            'background:#ffe4e6; color:#991b1b;'
          }">
            ${log.status}
          </span>
        </td>
        <td style="padding: 8px; font-size: 10px; color: #334155;">
          <strong>${log.method}</strong>
          ${log.note ? `<br><span style="font-style: italic; color: #64748b;">${log.note}</span>` : ''}
        </td>
      </tr>
    `).join('');

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Laporan Presensi - ${schoolName}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 15px; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
            .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
            .header h2 { margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #475569; }
            .meta-grid { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 11px; }
            .meta-item { display: inline-block; margin-right: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; color: #334155; }
            .signatures { display: flex; justify-content: space-between; margin-top: 50px; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 220px; font-size: 11px; }
            .sig-space { height: 60px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${schoolName}</h1>
            <h2>LAPORAN REKAPITULASI PRESENSI SISWA</h2>
          </div>
          <div class="meta-grid">
            <div>
              <span class="meta-item"><strong>Kelas:</strong> ${classText}</span>
              <span class="meta-item"><strong>Periode:</strong> ${periodText}</span>
              <span class="meta-item"><strong>Filter Status:</strong> ${statusText}</span>
            </div>
            <div>
              <strong>Total Data:</strong> ${filteredAttendance.length} siswa
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">No</th>
                <th style="width: 110px;">Tanggal & Jam</th>
                <th>Nama Siswa</th>
                <th style="width: 100px; text-align: center;">Kelas / NISN</th>
                <th style="width: 90px; text-align: center;">Status</th>
                <th>Metode & Catatan</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
          <div class="signatures">
            <div class="sig-box">
              <p>Mengetahui,</p>
              <p><strong>Kepala Sekolah</strong></p>
              <div class="sig-space"></div>
              <p><strong>(........................................)</strong></p>
            </div>
            <div class="sig-box">
              <p>Dicetak pada ${currentDate}</p>
              <p><strong>Guru / Wali Kelas</strong></p>
              <div class="sig-space"></div>
              <p><strong>${teacherName}</strong></p>
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

    // Try popup window first
    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(reportHtml);
      printWin.document.close();
      printWin.focus();
    } else {
      // Fallback iframe print if popup blocked by browser
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
        doc.write(reportHtml);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 2000);
        }, 500);
      } else {
        window.print();
      }
    }
  };

  const exportFilteredCSV = () => {
    if (filteredAttendance.length === 0) return;
    const headers = ['ID Presensi', 'NISN', 'Nama Siswa', 'Kelas', 'Tanggal', 'Jam Scan', 'Status', 'Metode', 'Catatan'];
    const rows = filteredAttendance.map(l => [
      l.id,
      `"${l.nisn}"`,
      `"${l.studentName}"`,
      `"${l.class}"`,
      l.date,
      l.time,
      l.status,
      l.method,
      `"${l.note || ''}"`
    ]);

    const periodLabel = filterPeriod === 'SEMUA' ? 'Semua_Periode' : filterPeriod;
    const classLabel = filterClass === 'SEMUA' ? 'Semua_Kelas' : `Kelas_${filterClass}`;

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Presensi_${classLabel}_${periodLabel}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Printable CSS style wrapper */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-area, #printable-report-area * {
            visibility: visible;
          }
          #printable-report-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 no-print">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            Riwayat & Rekapitulasi Presensi ({filteredAttendance.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Laporan presensi kelas per periode (Harian, Mingguan, Bulanan, Semester) & sinkronisasi otomatis.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              Kelas: {filterClass}
            </span>
            <span className="text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-1 rounded-full">
              Periode: {getPeriodLabelText()}
            </span>
            <span className="text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-full">
              Status: {filterStatus}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Print Report Button */}
          <button
            onClick={handlePrintReport}
            disabled={filteredAttendance.length === 0}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak Rekap</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={exportFilteredCSV}
            disabled={filteredAttendance.length === 0}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh CSV ({filteredAttendance.length})</span>
          </button>
        </div>
      </div>

      {/* Filter & Sort Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 no-print">
        
        {/* 1. Class Selection Filter */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
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

        {/* 2. Period Filter (Harian, Mingguan, Bulanan, Semester) */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
          <CalendarDays className="w-4 h-4 text-teal-400 shrink-0" />
          <div className="w-full">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">2. Periode Rekap</label>
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

        {/* 3. Reference Date Filter */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
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

        {/* 4. Status Filter */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
          <Filter className="w-4 h-4 text-purple-400 shrink-0" />
          <div className="w-full">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">4. Status Presensi</label>
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

      {/* Printable Report Wrapper */}
      <div id="printable-report-area">
        
        {/* Printable Official Header (Shown when printing) */}
        <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-4">
          <h1 className="text-xl font-bold uppercase tracking-wider">{settings.sekolah || 'SEKOLAH DIGITAL'}</h1>
          <h2 className="text-base font-semibold uppercase text-slate-700">LAPORAN REKAPITULASI PRESENSI SISWA</h2>
          <div className="flex justify-center gap-6 text-xs mt-2 text-slate-600 font-medium">
            <span>Kelas: <strong>{filterClass === 'SEMUA' ? 'Semua Kelas' : filterClass}</strong></span>
            <span>Periode: <strong>{getPeriodLabelText()}</strong></span>
            <span>Pengampu: <strong>{settings.namaGuru || 'Guru Kelas'}</strong></span>
          </div>
        </div>

        {/* History Log Table */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl print:bg-white print:border-slate-300 print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px] tracking-wider print:bg-slate-100 print:text-black print:border-slate-300">
                <tr>
                  <th className="p-4">Tanggal & Jam</th>
                  <th className="p-4">Nama Siswa</th>
                  <th className="p-4">Kelas / NISN</th>
                  <th className="p-4">Status Presensi</th>
                  <th className="p-4">Metode & Catatan</th>
                  <th className="p-4 text-right no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-slate-300">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500 text-xs italic">
                      Belum ada riwayat presensi yang sesuai dengan kriteria filter ({filterClass}, {getPeriodLabelText()}).
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors print:hover:bg-transparent">
                      <td className="p-4 font-mono">
                        <p className="font-bold text-white print:text-black">{log.date}</p>
                        <p className="text-[11px] text-emerald-400 print:text-slate-600">{log.time}</p>
                      </td>

                      <td className="p-4 font-bold text-white print:text-black">
                        {log.studentName}
                      </td>

                      <td className="p-4 font-mono text-xs">
                        <span className="text-slate-200 font-bold print:text-black">{log.class}</span>
                        <p className="text-[11px] text-slate-500 print:text-slate-600">{log.nisn}</p>
                      </td>

                      <td className="p-4">
                        <select
                          value={log.status}
                          onChange={(e) => updateAttendanceStatus(log.id, e.target.value as AttendanceStatus)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border focus:outline-none cursor-pointer print:bg-transparent print:text-black print:border-black ${
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
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded print:bg-transparent print:text-black print:border print:border-slate-300">
                            {log.method}
                          </span>
                          {log.note && (
                            <p className="text-xs text-slate-300 italic mt-1 print:text-slate-600">{log.note}</p>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-right no-print">
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

        {/* Printable Footer Signatures (Shown when printing) */}
        <div className="hidden print:flex justify-between items-end mt-12 pt-8 text-xs text-black">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah</p>
            <div className="h-16"></div>
            <p className="font-bold underline">(........................................)</p>
          </div>
          <div className="text-right">
            <p>Guru / Wali Kelas,</p>
            <p className="font-bold">{settings.namaGuru || 'Guru Pengampu'}</p>
            <div className="h-16"></div>
            <p className="font-bold underline">{settings.namaGuru || '(........................................)'}</p>
            {settings.nip && <p className="text-[10px]">NIP: {settings.nip}</p>}
          </div>
        </div>

      </div>

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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 no-print">
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

