import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, AttendanceRecord, AttendanceStatus } from '../../types';
import { 
  CheckCircle2, Clock, AlertCircle, Calendar, 
  Search, Filter, ChevronRight, FileText, Sparkles,
  TrendingUp, Award, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { cleanDateFormat } from '../../utils/formatters';

interface StudentAttendanceTabProps {
  student: Student;
}

export const StudentAttendanceTab: React.FC<StudentAttendanceTabProps> = ({ student }) => {
  const { attendance, settings, activeAcademicYear } = useApp();
  
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    try {
      return localStorage.getItem('qr_presensi_student_attendance_month') || 'SEMUA';
    } catch (e) {
      return 'SEMUA';
    }
  });

  const [selectedStatus, setSelectedStatus] = useState<string>(() => {
    try {
      return localStorage.getItem('qr_presensi_student_attendance_status') || 'SEMUA';
    } catch (e) {
      return 'SEMUA';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('qr_presensi_student_attendance_month', selectedMonth);
    } catch (e) {}
  }, [selectedMonth]);

  useEffect(() => {
    try {
      localStorage.setItem('qr_presensi_student_attendance_status', selectedStatus);
    } catch (e) {}
  }, [selectedStatus]);

  // Filter attendance records specific to this student
  const studentRecords = useMemo(() => {
    return attendance.filter(
      a => (a.studentId === student.id || a.nisn === student.nisn)
    ).sort((a, b) => {
      const dateA = cleanDateFormat(a.date);
      const dateB = cleanDateFormat(b.date);
      return dateB.localeCompare(dateA);
    });
  }, [attendance, student.id, student.nisn]);

  // Extract available months from records
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    studentRecords.forEach(r => {
      const d = cleanDateFormat(r.date);
      if (d && d.length >= 7) {
        monthsSet.add(d.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [studentRecords]);

  // Filtered by selected month and status
  const filteredRecords = useMemo(() => {
    return studentRecords.filter(r => {
      const dateStr = cleanDateFormat(r.date);
      const matchMonth = selectedMonth === 'SEMUA' || dateStr.startsWith(selectedMonth);
      const matchStatus = selectedStatus === 'SEMUA' || r.status === selectedStatus;
      return matchMonth && matchStatus;
    });
  }, [studentRecords, selectedMonth, selectedStatus]);

  // Attendance summary statistics
  const stats = useMemo(() => {
    const baseList = selectedMonth === 'SEMUA' 
      ? studentRecords 
      : studentRecords.filter(r => cleanDateFormat(r.date).startsWith(selectedMonth));

    const hadir = baseList.filter(r => r.status === 'Hadir').length;
    const terlambat = baseList.filter(r => r.status === 'Terlambat').length;
    const sakit = baseList.filter(r => r.status === 'Sakit').length;
    const izin = baseList.filter(r => r.status === 'Izin').length;
    const alpa = baseList.filter(r => r.status === 'Alpa').length;
    const total = baseList.length;

    const totalHadirFisik = hadir + terlambat;
    const persentase = total > 0 ? Math.round((totalHadirFisik / total) * 100) : 100;

    return { hadir, terlambat, sakit, izin, alpa, total, persentase };
  }, [studentRecords, selectedMonth]);

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'Hadir':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Hadir
          </span>
        );
      case 'Terlambat':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Terlambat
          </span>
        );
      case 'Sakit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <AlertCircle className="w-3.5 h-3.5" /> Sakit
          </span>
        );
      case 'Izin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <FileText className="w-3.5 h-3.5" /> Izin
          </span>
        );
      case 'Alpa':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Alpa
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Attendance Percentage */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-2 bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div>
            <div className="text-xs font-medium text-emerald-400">Tingkat Kehadiran</div>
            <div className="text-3xl font-black text-white mt-1">{stats.persentase}%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {stats.hadir + stats.terlambat} dari {stats.total} hari pertemuan
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Hadir Tepat Waktu */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Hadir Tepat</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.hadir}</div>
          <div className="text-[10px] text-slate-500">Tepat Waktu</div>
        </div>

        {/* Terlambat */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Terlambat</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{stats.terlambat}</div>
          <div className="text-[10px] text-slate-500">&gt; {settings.jamTerlambat || '07:15'} {settings.timezone || 'WIB'}</div>
        </div>

        {/* Sakit / Izin */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Sakit / Izin</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{stats.sakit + stats.izin}</div>
          <div className="text-[10px] text-slate-500">S: {stats.sakit} | I: {stats.izin}</div>
        </div>

        {/* Alpa */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Tanpa Ket (A)</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{stats.alpa}</div>
          <div className="text-[10px] text-slate-500">Hari Tidak Masuk</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-300">Pilih Bulan:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer flex-1 sm:flex-none"
          >
            <option value="SEMUA">Semua Bulan</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-300">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer flex-1 sm:flex-none"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="Hadir">Hadir</option>
            <option value="Terlambat">Terlambat</option>
            <option value="Sakit">Sakit</option>
            <option value="Izin">Izin</option>
            <option value="Alpa">Alpa</option>
          </select>
        </div>
      </div>

      {/* Attendance Logs List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Rincian Log Kehadiran Saya</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {filteredRecords.length} Catatan
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium">Belum ada catatan presensi pada filter ini.</p>
            <p className="text-xs text-slate-500 mt-1">Presensi yang dicatat oleh guru akan otomatis tampil di sini.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredRecords.map((record) => (
              <div 
                key={record.id} 
                className="p-4 hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-center shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono leading-none">
                      {record.date.split('-')[1] || ''}
                    </span>
                    <span className="text-sm font-bold text-emerald-400 font-mono leading-none mt-0.5">
                      {record.date.split('-')[2] || record.date}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200">
                      {record.date}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>Pukul {record.time} {settings.timezone || 'WIB'}</span>
                      <span>•</span>
                      <span>Metode: {record.method}</span>
                    </div>
                    {record.note && (
                      <div className="text-[11px] text-amber-300/90 mt-1 italic">
                        Catatan: "{record.note}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {getStatusBadge(record.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
