import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QrCode, Users, CheckCircle2, Clock, AlertCircle, FileSpreadsheet, PlusCircle, Search, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import { AttendanceStatus } from '../types';
import { cleanTimeFormat } from '../utils/formatters';

export const DashboardView: React.FC = () => {
  const {
    today,
    students,
    attendance,
    filterDate,
    setFilterDate,
    setCameraModalOpen,
    setActiveTab,
    markAttendanceByNisn,
    updateAttendanceStatus
  } = useApp();

  const [manualNisn, setManualNisn] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualStatus, setManualStatus] = useState<AttendanceStatus>('Hadir');
  const [manualNote, setManualNote] = useState('');

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
    markAttendanceByNisn(manualNisn.trim(), 'Manual', manualStatus, manualNote);
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
            onClick={() => setShowManualModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Absen Manual</span>
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
              <div key={stat.className} className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Kelas {stat.className}</span>
                  <span className="font-mono text-emerald-400">{stat.rate}% ({stat.scanned}/{stat.total})</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stat.rate}%` }}
                  ></div>
                </div>
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

      {/* Manual Attendance Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Input Presensi Manual</h3>
            <p className="text-xs text-slate-400">Gunakan jika kartu siswa hilang atau QR Code rusak.</p>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Siswa / Masukkan NISN:</label>
                <select
                  value={manualNisn}
                  onChange={(e) => setManualNisn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.nisn}>{s.name} ({s.class}) - NISN: {s.nisn}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status Presensi:</label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value as AttendanceStatus)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
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
                  placeholder="Contoh: Surat Izin Dokter, Lomba, dll"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs"
                >
                  Simpan Absen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
