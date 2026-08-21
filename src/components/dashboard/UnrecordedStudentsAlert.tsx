import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, CheckCircle2, UserX, UserCheck, Users, 
  ChevronDown, ChevronUp, Sparkles, Filter, Check, Clock, BookOpen
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus } from '../../types';

interface ScheduleInfo {
  day: string;
  jamKe?: string;
  mapel?: string;
  isScheduledToday?: boolean;
}

interface UnrecordedStudentsAlertProps {
  className: string;
  date: string;
  studentsInClass: Student[];
  attendanceRecords: AttendanceRecord[];
  onMarkStudent: (nisn: string, status: AttendanceStatus) => void;
  onMarkAllUnrecorded: (status: AttendanceStatus) => void;
  showOnlyUnrecorded: boolean;
  onToggleShowOnlyUnrecorded: (showOnly: boolean) => void;
  onOpenJournal?: (className: string) => void;
  scheduleInfo?: ScheduleInfo;
}

export const UnrecordedStudentsAlert: React.FC<UnrecordedStudentsAlertProps> = ({
  className,
  date,
  studentsInClass,
  attendanceRecords,
  onMarkStudent,
  onMarkAllUnrecorded,
  showOnlyUnrecorded,
  onToggleShowOnlyUnrecorded,
  onOpenJournal,
  scheduleInfo
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Map students by ID and NISN
  const recordedStudentNisns = new Set<string>();
  attendanceRecords.forEach(a => {
    if (a.nisn) recordedStudentNisns.add(a.nisn);
  });

  const totalClassCount = studentsInClass.length;
  const unrecordedStudents = studentsInClass.filter(s => !recordedStudentNisns.has(s.nisn));
  const recordedStudentsCount = totalClassCount - unrecordedStudents.length;

  const tepatWaktuCount = attendanceRecords.filter(a => a.status === 'Hadir').length;
  const terlambatCount = attendanceRecords.filter(a => a.status === 'Terlambat').length;
  const izinSakitAlpaCount = attendanceRecords.filter(a => a.status === 'Izin' || a.status === 'Sakit' || a.status === 'Alpa').length;

  const percentRecorded = totalClassCount > 0 
    ? Math.round((recordedStudentsCount / totalClassCount) * 100) 
    : 0;

  if (totalClassCount === 0) {
    return null;
  }

  // ALL STUDENTS RECORDED (100% COMPLETE)
  if (unrecordedStudents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400">
                  Status Presensi Kelas Lengkap
                </span>
                <span className="text-[10px] font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                  100% SELESAI
                </span>
              </div>
              <h4 className="text-base font-black text-white mt-0.5">
                Semua Siswa Kelas {className} Sudah Dipresensi
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Total {totalClassCount} dari {totalClassCount} siswa telah tercatat kehadirannya ({tepatWaktuCount} hadir, {terlambatCount} terlambat, {izinSakitAlpaCount} berhalangan).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenJournal && (
              <button
                type="button"
                onClick={() => onOpenJournal(className)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Buat Jurnal Kelas Ini</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // NOT SCHEDULED TODAY: Informative non-alert banner (warning is only active on scheduled days)
  if (scheduleInfo && scheduleInfo.isScheduledToday === false) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 border border-slate-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold font-mono tracking-wider text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                Bukan Jadwal Mengajar
              </span>
              <span className="text-[11px] font-bold text-slate-400 font-mono">
                Hari {scheduleInfo.day}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Kelas <strong className="text-white">{className}</strong> tidak memiliki jadwal mengajar pada hari {scheduleInfo.day}. Peringatan presensi dinonaktifkan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {unrecordedStudents.length > 0 && (
            <button
              type="button"
              onClick={() => onMarkAllUnrecorded('Hadir')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
              title="Isi presensi kelas pengganti jika diperlukan"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Presensi Pengganti ({unrecordedStudents.length} Siswa)</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // THERE ARE UNRECORDED STUDENTS -> PROMINENT ALERT
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-rose-950/20 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4"
    >
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Alert Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-inner relative">
            <AlertTriangle className="w-6 h-6 text-amber-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-900 animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-900" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold font-mono tracking-wider text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                Peringatan Presensi {scheduleInfo?.isScheduledToday ? 'Jadwal Hari Ini' : 'Kelas'}
              </span>
              {scheduleInfo?.isScheduledToday && (
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono">
                  {scheduleInfo.day}{scheduleInfo.jamKe ? ` (Jam ${scheduleInfo.jamKe})` : ''} {scheduleInfo.mapel ? `• ${scheduleInfo.mapel}` : ''}
                </span>
              )}
              <span className="text-[11px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <UserX className="w-3 h-3 text-rose-400" />
                {unrecordedStudents.length} Siswa Belum Dipresensi
              </span>
            </div>

            <h4 className="text-base font-black text-white mt-1">
              Kelas {className} Masih Memiliki Siswa yang Belum Diabsen
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Baru <span className="text-emerald-400 font-bold">{recordedStudentsCount}</span> dari{' '}
              <span className="text-white font-bold">{totalClassCount} siswa</span> ({percentRecorded}%) yang telah tercatat pada tanggal{' '}
              <span className="font-mono text-amber-300 font-bold">{date}</span>.
            </p>
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onMarkAllUnrecorded('Hadir')}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            title="Tandai semua siswa yang belum absen sebagai Hadir"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Tandai Sisa ({unrecordedStudents.length}) Hadir</span>
          </button>

          <button
            type="button"
            onClick={() => onMarkAllUnrecorded('Alpa')}
            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Tandai semua siswa yang belum absen sebagai Alpa"
          >
            <UserX className="w-3.5 h-3.5 text-rose-400" />
            <span>Tandai Sisa Alpa</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleShowOnlyUnrecorded(!showOnlyUnrecorded)}
            className={`text-xs font-bold px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
              showOnlyUnrecorded
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{showOnlyUnrecorded ? 'Tampilkan Semua Siswa' : `Filter Belum Absen (${unrecordedStudents.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors cursor-pointer"
            title={isExpanded ? 'Sembunyikan daftar nama' : 'Tampilkan daftar nama belum absen'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Hadir: {tepatWaktuCount}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Terlambat: {terlambatCount}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> I/S/A: {izinSakitAlpaCount}</span>
          </div>
          <span className="text-amber-300 font-bold">
            Belum Absen: {unrecordedStudents.length} ({100 - percentRecorded}%)
          </span>
        </div>

        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex border border-slate-800">
          <div 
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${(tepatWaktuCount / totalClassCount) * 100}%` }}
            title={`Hadir: ${tepatWaktuCount}`}
          />
          <div 
            className="bg-amber-500 h-full transition-all duration-300"
            style={{ width: `${(terlambatCount / totalClassCount) * 100}%` }}
            title={`Terlambat: ${terlambatCount}`}
          />
          <div 
            className="bg-rose-500 h-full transition-all duration-300"
            style={{ width: `${(izinSakitAlpaCount / totalClassCount) * 100}%` }}
            title={`Izin/Sakit/Alpa: ${izinSakitAlpaCount}`}
          />
          <div 
            className="bg-slate-800/80 h-full transition-all duration-300 border-l border-slate-700/50"
            style={{ width: `${(unrecordedStudents.length / totalClassCount) * 100}%` }}
            title={`Belum Presensi: ${unrecordedStudents.length}`}
          />
        </div>
      </div>

      {/* Expandable Chips List of Unrecorded Students */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="pt-2 border-t border-slate-800/80"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Daftar Siswa Belum Absen ({unrecordedStudents.length}):
              </span>
              <span className="text-[10px] text-slate-500 italic">
                Klik tombol H/T/I/S/A pada nama siswa untuk presensi langsung
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              {unrecordedStudents.map((st) => (
                <div
                  key={st.id}
                  className="bg-slate-950/80 border border-amber-500/20 hover:border-amber-500/40 rounded-xl p-2.5 flex items-center justify-between gap-2 transition-all shadow-sm group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                      {st.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500">
                      NISN: {st.nisn}
                    </p>
                  </div>

                  {/* 1-Click Quick Mark Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onMarkStudent(st.nisn, 'Hadir')}
                      className="w-6 h-6 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 text-[10px] font-black border border-emerald-500/30 transition-all flex items-center justify-center cursor-pointer"
                      title="Tandai Hadir"
                    >
                      H
                    </button>
                    <button
                      type="button"
                      onClick={() => onMarkStudent(st.nisn, 'Terlambat')}
                      className="w-6 h-6 rounded-lg bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-[10px] font-black border border-amber-500/30 transition-all flex items-center justify-center cursor-pointer"
                      title="Tandai Terlambat"
                    >
                      T
                    </button>
                    <button
                      type="button"
                      onClick={() => onMarkStudent(st.nisn, 'Izin')}
                      className="w-6 h-6 rounded-lg bg-sky-500/15 hover:bg-sky-500 hover:text-slate-950 text-sky-400 text-[10px] font-black border border-sky-500/30 transition-all flex items-center justify-center cursor-pointer"
                      title="Tandai Izin"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => onMarkStudent(st.nisn, 'Sakit')}
                      className="w-6 h-6 rounded-lg bg-purple-500/15 hover:bg-purple-500 hover:text-slate-950 text-purple-400 text-[10px] font-black border border-purple-500/30 transition-all flex items-center justify-center cursor-pointer"
                      title="Tandai Sakit"
                    >
                      S
                    </button>
                    <button
                      type="button"
                      onClick={() => onMarkStudent(st.nisn, 'Alpa')}
                      className="w-6 h-6 rounded-lg bg-rose-500/15 hover:bg-rose-500 hover:text-white text-rose-400 text-[10px] font-black border border-rose-500/30 transition-all flex items-center justify-center cursor-pointer"
                      title="Tandai Alpa"
                    >
                      A
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
