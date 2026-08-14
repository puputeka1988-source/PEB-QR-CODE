import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  QrCode, Users, CheckCircle2, Clock, AlertCircle, FileSpreadsheet, PlusCircle, Search, 
  Sparkles, TrendingUp, Calendar, BookOpen, Zap, Filter, RotateCcw, UserCheck, X, Check, CheckCheck,
  Monitor
} from 'lucide-react';
import { AttendanceStatus } from '../types';
import { cleanTimeFormat, sortStudents } from '../utils/formatters';

export const DashboardView: React.FC = () => {
  const {
    today,
    students,
    attendance,
    settings,
    filterDate,
    setFilterDate,
    setCameraModalOpen,
    setActiveTab,
    markAttendanceByNisn,
    resetAttendanceByNisnAndDate,
    updateAttendanceStatus,
    openJournalForClass,
    setIsKioskMode
  } = useApp();

  // Manual Attendance Modal States
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTab, setManualTab] = useState<'grid' | 'search' | 'form'>('grid');
  
  // Custom Editable Date & Time for manual attendance
  const [manualDate, setManualDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [manualTime, setManualTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  // Helper to get Indonesian Day and Date label
  const getIndonesianDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (isNaN(d.getTime())) return dateStr;

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const dayName = days[d.getDay()];
    const monthName = months[d.getMonth()];
    return `${dayName}, ${day} ${monthName} ${year}`;
  };

  // Mode 1: Class Batch & Grid State
  const [manualBatchClass, setManualBatchClass] = useState<string>('');

  // Mode 2: Search State
  const [manualSearchQuery, setManualSearchQuery] = useState('');

  // Mode 3: Single Form State
  const [manualNisn, setManualNisn] = useState('');
  const [manualClassFilter, setManualClassFilter] = useState('SEMUA');
  const [manualStatus, setManualStatus] = useState<AttendanceStatus>('Hadir');
  const [manualNote, setManualNote] = useState('');

  const manualClassOptions = ['SEMUA', ...Array.from(new Set(students.map(s => s.class))).sort((a: string, b: string) => (a || '').localeCompare(b || '', 'id', { numeric: true }))];
  const availableClasses = manualClassOptions.filter(c => c !== 'SEMUA');

  // Auto select first class when modal opens or if batchClass is empty
  const activeClass = manualBatchClass || availableClasses[0] || '';

  const handleOpenManualModal = () => {
    if (!manualBatchClass && availableClasses.length > 0) {
      setManualBatchClass(availableClasses[0]);
    }
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setManualDate(`${year}-${month}-${day}`);
    setManualTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    setShowManualModal(true);
  };

  const handleResetManualDateTime = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setManualDate(`${year}-${month}-${day}`);
    setManualTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
  };

  // Evaluate if current manualTime is Late based on cutoff time
  const cutoffTimeStr = settings?.jamTerlambat || settings?.jamMasuk || '07:15';
  const [cutH, cutM] = cutoffTimeStr.replace('.', ':').split(':').map(Number);
  const cutoffMinutes = (isNaN(cutH) ? 7 : cutH) * 60 + (isNaN(cutM) ? 15 : cutM);

  const [manH, manM] = manualTime.split(':').map(Number);
  const manualMinutes = (isNaN(manH) ? 7 : manH) * 60 + (isNaN(manM) ? 0 : manM);

  const isManualTimeLate = manualMinutes > cutoffMinutes;

  const filteredManualStudents = sortStudents(
    students.filter(s => manualClassFilter === 'SEMUA' || s.class === manualClassFilter)
  );

  const searchFilteredStudents = manualSearchQuery.trim()
    ? sortStudents(students.filter(s => 
        s.name.toLowerCase().includes(manualSearchQuery.toLowerCase()) || 
        s.nisn.includes(manualSearchQuery) || 
        s.class.toLowerCase().includes(manualSearchQuery.toLowerCase())
      )).slice(0, 10)
    : sortStudents(students).slice(0, 10);

  const batchClassStudents = manualBatchClass 
    ? sortStudents(students.filter(s => s.class === manualBatchClass))
    : [];

  const handleMarkAllClassHadir = () => {
    if (!manualBatchClass) return;
    const defaultStatus = isManualTimeLate ? 'Terlambat' : 'Hadir';
    batchClassStudents.forEach(s => {
      markAttendanceByNisn(s.nisn, 'Manual', defaultStatus, 'Presensi Sekaligus Kelas', manualTime, manualDate);
    });
  };

  const handleResetAllClassAttendance = () => {
    if (!manualBatchClass) return;
    batchClassStudents.forEach(s => {
      resetAttendanceByNisnAndDate(s.nisn, manualDate);
    });
  };

  const handleResetManualFormStudent = () => {
    if (!manualNisn.trim()) return;
    resetAttendanceByNisnAndDate(manualNisn.trim(), manualDate);
    setManualNisn('');
    setManualNote('');
  };

  // Attendance logs for selected manualDate in manual modal
  const modalLogs = attendance.filter(a => a.date === manualDate);

  // Filter logs for selected date
  const todayLogs = attendance.filter(a => a.date === filterDate);
  const totalStudents = students.length;

  const totalHadir = todayLogs.filter(l => l.status === 'Hadir').length;
  const totalTerlambat = todayLogs.filter(l => l.status === 'Terlambat').length;
  const totalIzin = todayLogs.filter(l => l.status === 'Izin').length;
  const totalSakit = todayLogs.filter(l => l.status === 'Sakit').length;
  const totalAlpa = todayLogs.filter(l => l.status === 'Alpa').length;

  const totalAbsen = todayLogs.length;
  const totalBelum = Math.max(0, totalStudents - totalAbsen);

  const hadirPercentage = totalStudents > 0 ? Math.round((totalHadir / totalStudents) * 100) : 0;
  const terlambatPercentage = totalStudents > 0 ? Math.round((totalTerlambat / totalStudents) * 100) : 0;

  // Class breakdown
  const classes = Array.from(new Set(students.map(s => s.class))).sort();
  const classStats = classes.map(cls => {
    const classStudents = students.filter(s => s.class === cls);
    const classScanned = todayLogs.filter(l => l.class === cls);
    const countHadir = classScanned.filter(l => l.status === 'Hadir' || l.status === 'Terlambat').length;
    const rate = classStudents.length > 0 ? Math.round((countHadir / classStudents.length) * 100) : 0;
    return {
      className: cls,
      total: classStudents.length,
      scanned: countHadir,
      rate
    };
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNisn.trim()) return;
    markAttendanceByNisn(manualNisn.trim(), 'Manual', manualStatus, manualNote, manualTime, manualDate);
    setManualNisn('');
    setManualNote('');
    setShowManualModal(false);
  };

  const exportCSV = () => {
    if (todayLogs.length === 0) return;
    const headers = ['ID Presensi', 'NISN', 'Nama Siswa', 'Kelas', 'Tanggal', 'Jam', 'Status', 'Metode', 'Catatan'];
    const rows = todayLogs.map(l => [
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

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Presensi_Siswa_${filterDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Date Bar & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Pilih Tanggal Presensi:</span>
              {filterDate === today ? (
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Hari Ini
                </span>
              ) : (
                <button
                  onClick={() => setFilterDate(today)}
                  className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                  title="Kembali ke Tanggal Hari Ini"
                >
                  ↺ Reset Hari Ini
                </button>
              )}
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="block bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm px-3 py-1.5 rounded-xl focus:outline-none focus:border-emerald-500 mt-1 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCameraModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Mulai Scan QR</span>
          </button>

          <button
            onClick={() => setIsKioskMode(true)}
            className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 border border-indigo-500/30 transition-all cursor-pointer shadow-sm"
            title="Buka Mode Kiosk Layar Penuh untuk Lobi / Gerbang"
          >
            <Monitor className="w-4 h-4 text-indigo-400" />
            <span>Mode Kiosk Lobi</span>
          </button>

          <button
            onClick={handleOpenManualModal}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Absen Manual</span>
          </button>

          <button
            onClick={() => setActiveTab('Jurnal Mengajar')}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 border border-emerald-500/30 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Isi Jurnal Mengajar</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={todayLogs.length === 0}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Unduh CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Stat 1: Total Siswa */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Siswa</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3">{totalStudents}</p>
          <p className="text-[11px] text-slate-400 mt-1">Siswa terdaftar dalam sistem</p>
        </div>

        {/* Stat 2: Hadir Tepat Waktu */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hadir Tepat Waktu</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400 mt-3">{totalHadir}</p>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3 border border-slate-800">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${hadirPercentage}%` }}></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">{hadirPercentage}% dari total siswa</p>
        </div>

        {/* Stat 3: Terlambat */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Terlambat</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-400 mt-3">{totalTerlambat}</p>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3 border border-slate-800">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${terlambatPercentage}%` }}></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">{terlambatPercentage}% siswa terlambat hari ini</p>
        </div>

        {/* Stat 4: Belum Absen */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Belum Presensi</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-400 mt-3">{totalBelum}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Izin: {totalIzin} | Sakit: {totalSakit} | Alpa: {totalAlpa}
          </p>
        </div>

      </div>

      {/* Main Content Grid: Activity Feed & Class Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Live Activity Feed (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Aktivitas Presensi ({todayLogs.length})
              </h3>
              <p className="text-xs text-slate-400">Daftar siswa yang telah melakukan scan pada {filterDate}</p>
            </div>

            <button
              onClick={() => setActiveTab('Riwayat')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Lihat Semua →
            </button>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {todayLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs italic bg-slate-950/40 rounded-2xl border border-slate-800">
                Belum ada aktivitas scan untuk tanggal ini. Klik tombol "Mulai Scan QR" untuk melakukan absensi.
              </div>
            ) : (
              todayLogs.map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                      log.status === 'Hadir'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : log.status === 'Terlambat'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {log.studentName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-white">{log.studentName}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono text-emerald-400">{log.class}</span>
                        <span>•</span>
                        <span>NISN: {log.nisn}</span>
                        {log.note && <span className="text-amber-400/90 italic">({log.note})</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={log.status}
                      onChange={(e) => updateAttendanceStatus(log.id, e.target.value as AttendanceStatus)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border focus:outline-none ${
                        log.status === 'Hadir'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : log.status === 'Terlambat'
                          ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                          : 'bg-rose-950/80 text-rose-400 border-rose-800'
                      }`}
                    >
                      <option value="Hadir">Hadir</option>
                      <option value="Terlambat">Terlambat</option>
                      <option value="Izin">Izin</option>
                      <option value="Sakit">Sakit</option>
                      <option value="Alpa">Alpa</option>
                    </select>

                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg shrink-0">
                      {cleanTimeFormat(log.time)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Class Attendance Progress */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Tingkat Kehadiran Kelas
            </h3>
          </div>

          <div className="space-y-4">
            {classStats.map(stat => (
              <div key={stat.className} className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="font-bold text-white">Kelas {stat.className}</span>
                  <span className="font-mono text-emerald-400">{stat.rate}% ({stat.scanned}/{stat.total})</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stat.rate}%` }}
                  ></div>
                </div>

                <button
                  onClick={() => openJournalForClass(stat.className)}
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold py-1.5 px-3 rounded-xl transition-all cursor-pointer mt-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Buat Jurnal Kelas {stat.className}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Help Box */}
          <div className="pt-2">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-xs text-emerald-200 space-y-1">
              <p className="font-bold">Tips Penggunaan Quick Scan:</p>
              <p className="text-emerald-300/80 leading-relaxed">
                Anda dapat menggunakan webcam laptop atau pemindai QR eksternal. Hubungkan spreadsheet Google Sheets di tab "Google Sheets API" untuk pencatatan riwayat online otomatis.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Manual Attendance Entry Modal (Model Grid Kelas) */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  <span>Input Presensi Manual (Model Grid Kelas)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Pilih kelas, klik tombol status (H, T, I, S, A) pada tiap kartu siswa.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editable Date, Time & Auto-Status Category Bar */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Format Tanggal & Jam Presensi:</span>
                </label>
                <button
                  type="button"
                  onClick={handleResetManualDateTime}
                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  title="Reset ke hari ini dan jam sekarang"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Hari Ini & Jam Sekarang</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Date Input with Day Name Badge */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="bg-transparent text-white font-mono font-bold text-xs focus:outline-none cursor-pointer w-full"
                  />
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                    {getIndonesianDateLabel(manualDate).split(',')[0] || 'Hari'}
                  </span>
                </div>

                {/* Time Input with Category Badge */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 shrink-0">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="time"
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                      className="bg-transparent text-white font-mono font-bold text-xs focus:outline-none cursor-pointer w-20"
                    />
                  </div>

                  <div className={`flex-1 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border truncate ${
                    isManualTimeLate 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {isManualTimeLate ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Terlambat (&gt;{cutoffTimeStr})</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Tepat Waktu (&le;{cutoffTimeStr})</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Selected Full Date Banner */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Tanggal Presensi Dipilih:</span>
                <span className="text-emerald-300 font-bold font-mono">
                  📅 {getIndonesianDateLabel(manualDate)}
                </span>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setManualTab('grid')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  manualTab === 'grid'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Grid Matriks Kelas</span>
              </button>

              <button
                type="button"
                onClick={() => setManualTab('search')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  manualTab === 'search'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Cari Cepat</span>
              </button>

              <button
                type="button"
                onClick={() => setManualTab('form')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  manualTab === 'form'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Form Detail</span>
              </button>
            </div>

            {/* TAB 1: Grid Matriks Kelas (Main Grid Model) */}
            {manualTab === 'grid' && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {/* Horizontal Class Selector Pill Buttons */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Pilih Kelas (Klik Pill):
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {availableClasses.map(cls => {
                      const classStudentCount = students.filter(s => s.class === cls).length;
                      const isSelected = activeClass === cls;
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => setManualBatchClass(cls)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md scale-105'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <span>Kelas {cls}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isSelected ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {classStudentCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeClass && (
                  <>
                    {/* Class Header & Quick Stats */}
                    {(() => {
                      const classStudents = students.filter(s => s.class === activeClass);
                      const classLogs = classStudents.map(s => {
                        return modalLogs.find(l => l.studentId === s.id || (l.nisn && l.nisn === s.nisn));
                      });

                      const hadirCount = classLogs.filter(l => l?.status === 'Hadir').length;
                      const terlambatCount = classLogs.filter(l => l?.status === 'Terlambat').length;
                      const izinCount = classLogs.filter(l => l?.status === 'Izin').length;
                      const sakitCount = classLogs.filter(l => l?.status === 'Sakit').length;
                      const alpaCount = classLogs.filter(l => l?.status === 'Alpa').length;
                      const belumCount = classStudents.length - (hadirCount + terlambatCount + izinCount + sakitCount + alpaCount);

                      return (
                        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                            <div>
                              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                                <span>Matriks Siswa Kelas {activeClass}</span>
                                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-md font-mono border border-emerald-500/20">
                                  {classStudents.length} Siswa
                                </span>
                              </h4>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={handleMarkAllClassHadir}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>Set Semua {isManualTimeLate ? 'Terlambat' : 'Hadir'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={handleResetAllClassAttendance}
                                className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 font-extrabold text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                title="Reset seluruh siswa kelas ini kembali ke Belum Absen"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset Kelas</span>
                              </button>
                            </div>
                          </div>

                          {/* Quick Stats Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                              Hadir: {hadirCount}
                            </span>
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                              Terlambat: {terlambatCount}
                            </span>
                            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-lg">
                              Izin: {izinCount}
                            </span>
                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-lg">
                              Sakit: {sakitCount}
                            </span>
                            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-lg">
                              Alpa: {alpaCount}
                            </span>
                            <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-lg">
                              Belum: {belumCount}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Student Cards Grid Layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                      {students
                        .filter(s => s.class === activeClass)
                        .map(s => {
                          const todayRecord = modalLogs.find(l => l.studentId === s.id || (l.nisn && l.nisn === s.nisn));
                          const curStatus = todayRecord?.status;

                          return (
                            <div
                              key={s.id}
                              className={`bg-slate-950 border rounded-2xl p-3 flex flex-col justify-between gap-2.5 transition-all ${
                                curStatus === 'Hadir'
                                  ? 'border-emerald-500/40 bg-emerald-950/10'
                                  : curStatus === 'Terlambat'
                                  ? 'border-amber-500/40 bg-amber-950/10'
                                  : curStatus === 'Izin'
                                  ? 'border-purple-500/40 bg-purple-950/10'
                                  : curStatus === 'Sakit'
                                  ? 'border-blue-500/40 bg-blue-950/10'
                                  : curStatus === 'Alpa'
                                  ? 'border-rose-500/40 bg-rose-950/10'
                                  : 'border-slate-800/80 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="truncate">
                                  <p className="font-bold text-white text-xs truncate">{s.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">NISN: {s.nisn}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                                    curStatus === 'Hadir'
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                      : curStatus === 'Terlambat'
                                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                      : curStatus === 'Izin'
                                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                      : curStatus === 'Sakit'
                                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                      : curStatus === 'Alpa'
                                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                      : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                                  }`}>
                                    {curStatus ? `${curStatus} (${todayRecord?.time || manualTime})` : 'Belum Absen'}
                                  </span>
                                  {curStatus && (
                                    <button
                                      type="button"
                                      onClick={() => resetAttendanceByNisnAndDate(s.nisn, manualDate)}
                                      title="Reset presensi siswa ini kembali ke Belum Absen"
                                      className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 transition-all cursor-pointer"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Reset</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* 5 Status Action Buttons (H, T, I, S, A) */}
                              <div className="grid grid-cols-5 gap-1 pt-1 border-t border-slate-800/50 text-[11px] font-extrabold">
                                <button
                                  type="button"
                                  onClick={() => curStatus === 'Hadir' ? resetAttendanceByNisnAndDate(s.nisn, manualDate) : markAttendanceByNisn(s.nisn, 'Manual', 'Hadir', undefined, manualTime, manualDate)}
                                  title={curStatus === 'Hadir' ? 'Klik lagi untuk Batal / Reset ke Belum Absen' : 'Tandai Hadir'}
                                  className={`py-1.5 rounded-lg text-center transition-all cursor-pointer border ${
                                    curStatus === 'Hadir'
                                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-sm'
                                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40'
                                  }`}
                                >
                                  H
                                </button>

                                <button
                                  type="button"
                                  onClick={() => curStatus === 'Terlambat' ? resetAttendanceByNisnAndDate(s.nisn, manualDate) : markAttendanceByNisn(s.nisn, 'Manual', 'Terlambat', undefined, manualTime, manualDate)}
                                  title={curStatus === 'Terlambat' ? 'Klik lagi untuk Batal / Reset ke Belum Absen' : 'Tandai Terlambat'}
                                  className={`py-1.5 rounded-lg text-center transition-all cursor-pointer border ${
                                    curStatus === 'Terlambat'
                                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/40'
                                  }`}
                                >
                                  T
                                </button>

                                <button
                                  type="button"
                                  onClick={() => curStatus === 'Izin' ? resetAttendanceByNisnAndDate(s.nisn, manualDate) : markAttendanceByNisn(s.nisn, 'Manual', 'Izin', undefined, manualTime, manualDate)}
                                  title={curStatus === 'Izin' ? 'Klik lagi untuk Batal / Reset ke Belum Absen' : 'Tandai Izin'}
                                  className={`py-1.5 rounded-lg text-center transition-all cursor-pointer border ${
                                    curStatus === 'Izin'
                                      ? 'bg-purple-500 text-white border-purple-400 font-black shadow-sm'
                                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-500/40'
                                  }`}
                                >
                                  I
                                </button>

                                <button
                                  type="button"
                                  onClick={() => curStatus === 'Sakit' ? resetAttendanceByNisnAndDate(s.nisn, manualDate) : markAttendanceByNisn(s.nisn, 'Manual', 'Sakit', undefined, manualTime, manualDate)}
                                  title={curStatus === 'Sakit' ? 'Klik lagi untuk Batal / Reset ke Belum Absen' : 'Tandai Sakit'}
                                  className={`py-1.5 rounded-lg text-center transition-all cursor-pointer border ${
                                    curStatus === 'Sakit'
                                      ? 'bg-blue-500 text-white border-blue-400 font-black shadow-sm'
                                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/40'
                                  }`}
                                >
                                  S
                                </button>

                                <button
                                  type="button"
                                  onClick={() => curStatus === 'Alpa' ? resetAttendanceByNisnAndDate(s.nisn, manualDate) : markAttendanceByNisn(s.nisn, 'Manual', 'Alpa', undefined, manualTime, manualDate)}
                                  title={curStatus === 'Alpa' ? 'Klik lagi untuk Batal / Reset ke Belum Absen' : 'Tandai Alpa'}
                                  className={`py-1.5 rounded-lg text-center transition-all cursor-pointer border ${
                                    curStatus === 'Alpa'
                                      ? 'bg-rose-500 text-white border-rose-400 font-black shadow-sm'
                                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40'
                                  }`}
                                >
                                  A
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: 1-Klik Cari (Search & Fast Log) */}
            {manualTab === 'search' && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    autoFocus
                    value={manualSearchQuery}
                    onChange={(e) => setManualSearchQuery(e.target.value)}
                    placeholder="Ketik nama siswa, NISN, atau kelas..."
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                  {manualSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setManualSearchQuery('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {searchFilteredStudents.map(s => {
                    const todayRecord = modalLogs.find(l => l.studentId === s.id || (l.nisn && l.nisn === s.nisn));
                    return (
                      <div
                        key={s.id}
                        className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{s.name}</span>
                            <span className="bg-slate-800 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono">
                              {s.class}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">NISN: {s.nisn}</p>
                          {todayRecord && (
                            <span className="inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Sudah Presensi: {todayRecord.status} ({todayRecord.time})
                            </span>
                          )}
                        </div>

                        {/* Fast Status Buttons */}
                        <div className="flex items-center gap-1 shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() => markAttendanceByNisn(s.nisn, 'Manual', 'Hadir', undefined, manualTime, manualDate)}
                            className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            title="Tandai Hadir"
                          >
                            + Hadir
                          </button>

                          <button
                            type="button"
                            onClick={() => markAttendanceByNisn(s.nisn, 'Manual', 'Terlambat', undefined, manualTime, manualDate)}
                            className="bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/20 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            title="Tandai Terlambat"
                          >
                            + Terlambat
                          </button>

                          <button
                            type="button"
                            onClick={() => markAttendanceByNisn(s.nisn, 'Manual', 'Izin', undefined, manualTime, manualDate)}
                            className="bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white border border-purple-500/20 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            title="Tandai Izin"
                          >
                            Izin
                          </button>

                          <button
                            type="button"
                            onClick={() => markAttendanceByNisn(s.nisn, 'Manual', 'Sakit', undefined, manualTime, manualDate)}
                            className="bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            title="Tandai Sakit"
                          >
                            Sakit
                          </button>

                          <button
                            type="button"
                            onClick={() => markAttendanceByNisn(s.nisn, 'Manual', 'Alpa', undefined, manualTime, manualDate)}
                            className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            title="Tandai Alpa"
                          >
                            Alpa
                          </button>

                          {todayRecord && (
                            <button
                              type="button"
                              onClick={() => resetAttendanceByNisnAndDate(s.nisn, manualDate)}
                              className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Reset presensi kembali ke Belum Absen"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {searchFilteredStudents.length === 0 && (
                    <p className="text-center text-xs text-slate-500 py-6">Tidak ditemukan siswa dengan kata kunci "{manualSearchQuery}".</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Form Input Detail */}
            {manualTab === 'form' && (
              <form onSubmit={handleManualSubmit} className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Filter Pilihan Kelas:</label>
                  <select
                    value={manualClassFilter}
                    onChange={(e) => {
                      setManualClassFilter(e.target.value);
                      setManualNisn('');
                    }}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="SEMUA">-- Semua Kelas ({students.length} Siswa) --</option>
                    {manualClassOptions.filter(c => c !== 'SEMUA').map(cls => {
                      const count = students.filter(s => s.class === cls).length;
                      return (
                        <option key={cls} value={cls}>Kelas {cls} ({count} Siswa)</option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Siswa / Masukkan NISN:</label>
                  <select
                    value={manualNisn}
                    onChange={(e) => setManualNisn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="">-- Pilih Siswa ({filteredManualStudents.length} siswa) --</option>
                    {filteredManualStudents.map(s => (
                      <option key={s.id} value={s.nisn}>{s.name} ({s.class}) - NISN: {s.nisn}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status Presensi:</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as AttendanceStatus)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Terlambat">Terlambat</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Alpa">Alpa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan Opsional:</label>
                  <input
                    type="text"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    placeholder="Contoh: Surat Izin Dokter, Lomba, Ban bocor, dll"
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs cursor-pointer transition-all shadow-md"
                  >
                    Simpan Presensi Manual
                  </button>
                  {manualNisn && (
                    <button
                      type="button"
                      onClick={handleResetManualFormStudent}
                      className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 font-bold py-2.5 px-3 rounded-xl text-xs cursor-pointer transition-all flex items-center gap-1 shrink-0"
                      title="Reset presensi siswa yang dipilih kembali ke Belum Absen"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset (Belum Absen)</span>
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer transition-all"
              >
                Selesai / Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
