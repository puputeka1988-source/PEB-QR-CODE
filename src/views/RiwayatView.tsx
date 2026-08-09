import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus } from '../types';
import { History, Search, Filter, FileSpreadsheet, Trash2, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const RiwayatView: React.FC = () => {
  const { attendance, students, updateAttendanceStatus, deleteAttendance } = useApp();

  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');
  const [filterClass, setFilterClass] = useState<string>('SEMUA');
  const [search, setSearch] = useState<string>('');

  const classes = ['SEMUA', ...Array.from(new Set(students.map(s => s.class))).sort()];

  const filteredAttendance = attendance.filter(record => {
    const matchDate = !filterDate || record.date === filterDate;
    const matchStatus = filterStatus === 'SEMUA' || record.status === filterStatus;
    const matchClass = filterClass === 'SEMUA' || record.class === filterClass;
    const matchSearch = record.studentName.toLowerCase().includes(search.toLowerCase()) || record.nisn.includes(search);

    return matchDate && matchStatus && matchClass && matchSearch;
  });

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

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Riwayat_Presensi_Laporan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            Riwayat & Rekapitulasi Presensi ({filteredAttendance.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Laporan lengkap log absensi siswa dengan filter tanggal, status, dan ekspor spreadsheet
          </p>
        </div>

        <button
          onClick={exportFilteredCSV}
          disabled={filteredAttendance.length === 0}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Unduh Laporan CSV ({filteredAttendance.length})</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari siswa / NISN..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="text-[10px] text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded"
            >
              Reset
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="SEMUA">Status: Semua</option>
            <option value="Hadir">Hadir</option>
            <option value="Terlambat">Terlambat</option>
            <option value="Izin">Izin</option>
            <option value="Sakit">Sakit</option>
            <option value="Alpa">Alpa</option>
          </select>
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
          >
            {classes.map(c => (
              <option key={c} value={c}>Kelas: {c}</option>
            ))}
          </select>
        </div>

      </div>

      {/* History Log Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="p-4">Tanggal & Jam</th>
                <th className="p-4">Siswa</th>
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
                    Belum ada riwayat presensi yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono">
                      <p className="font-bold text-white">{log.date}</p>
                      <p className="text-[11px] text-emerald-400">{log.time}</p>
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
                        <option value="Hadir">Hadir</option>
                        <option value="Terlambat">Terlambat</option>
                        <option value="Izin">Izin</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Alpa">Alpa</option>
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
                      <button
                        onClick={() => {
                          if (confirm(`Hapus catatan presensi ${log.studentName} (${log.date})?`)) {
                            deleteAttendance(log.id);
                          }
                        }}
                        title="Hapus Log"
                        className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
