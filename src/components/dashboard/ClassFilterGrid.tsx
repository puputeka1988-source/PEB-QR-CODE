import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Check, Search, Filter, RotateCcw, CheckCircle2, 
  Sparkles, Layers, ArrowRight, UserCheck, AlertTriangle, UserX, ExternalLink
} from 'lucide-react';
import { Student, AttendanceRecord } from '../../types';

interface ClassFilterGridProps {
  classes: string[];
  students: Student[];
  attendance: AttendanceRecord[];
  filterDate: string;
  selectedClass: string; // 'ALL' or specific class name
  onSelectClass: (className: string) => void;
  onNavigateToManual?: (className: string) => void;
}

export const ClassFilterGrid: React.FC<ClassFilterGridProps> = ({
  classes,
  students,
  attendance,
  filterDate,
  selectedClass,
  onSelectClass,
  onNavigateToManual
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Map student ID to class for fast lookup
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => map.set(s.id, s));
    return map;
  }, [students]);

  const todayLogs = useMemo(() => {
    return attendance.filter(a => a.date === filterDate);
  }, [attendance, filterDate]);

  // Compute statistics for all classes and per class
  const totalStudents = students.length;
  const totalTodayHadir = todayLogs.filter(l => l.status === 'Hadir' || l.status === 'Terlambat').length;
  const totalOverallRate = totalStudents > 0 ? Math.round((totalTodayHadir / totalStudents) * 100) : 0;

  const classCardsData = useMemo(() => {
    return classes.map(cls => {
      const clsStudents = students.filter(s => s.class === cls);
      const total = clsStudents.length;

      const clsLogs = todayLogs.filter(l => {
        const student = studentMap.get(l.studentId);
        return l.class === cls || (student && student.class === cls);
      });

      const tepatWaktu = clsLogs.filter(l => l.status === 'Hadir').length;
      const terlambat = clsLogs.filter(l => l.status === 'Terlambat').length;
      const izin = clsLogs.filter(l => l.status === 'Izin').length;
      const sakit = clsLogs.filter(l => l.status === 'Sakit').length;
      const alpa = clsLogs.filter(l => l.status === 'Alpa').length;

      const hadirFisik = tepatWaktu + terlambat;
      const belumAbsen = Math.max(0, total - (hadirFisik + izin + sakit + alpa));
      const rate = total > 0 ? Math.round((hadirFisik / total) * 100) : 0;

      return {
        className: cls,
        label: `Kelas ${cls}`,
        total,
        tepatWaktu,
        terlambat,
        izin,
        sakit,
        alpa,
        hadirFisik,
        belumAbsen,
        rate
      };
    });
  }, [classes, students, todayLogs, studentMap]);

  // Filter classes by search query
  const filteredClassCards = useMemo(() => {
    if (!searchQuery.trim()) return classCardsData;
    const q = searchQuery.toLowerCase().trim();
    return classCardsData.filter(c => 
      c.className.toLowerCase().includes(q) || 
      c.label.toLowerCase().includes(q)
    );
  }, [classCardsData, searchQuery]);

  const activeClassObj = classCardsData.find(c => c.className === selectedClass);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4"
    >
      {/* Top Header & Search / Reset bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Filter Kelas Grafik Kehadiran</h3>
              <span className="text-[11px] font-mono font-bold bg-slate-950 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-800">
                {classes.length} Rombel
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik salah satu kelas di bawah untuk memfilter tren, persentase donat, dan diagram jam kedatangan secara instan
            </p>
          </div>
        </div>

        {/* Right tools: Search & Reset */}
        <div className="flex flex-wrap items-center gap-2">
          {classes.length > 4 && (
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kelas..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-36 transition-all"
              />
            </div>
          )}

          {selectedClass !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectClass('ALL')}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tampilkan Semua Kelas</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Indicator & Warning Banner */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/70 border border-slate-800/80 px-4 py-2.5 rounded-2xl text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400">Status Filter Aktif:</span>
            {selectedClass === 'ALL' ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg font-bold">
                <Users className="w-3.5 h-3.5" />
                Semua Kelas ({totalStudents} Siswa)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-lg font-bold">
                <Check className="w-3.5 h-3.5 text-indigo-400" />
                Kelas {selectedClass} ({activeClassObj?.total || 0} Siswa)
              </span>
            )}

            {selectedClass !== 'ALL' && activeClassObj && activeClassObj.belumAbsen > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-lg font-bold font-mono animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                {activeClassObj.belumAbsen} Belum Dipresensi
              </span>
            )}
          </div>

          {selectedClass !== 'ALL' && activeClassObj && (
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-300">
              <span className="text-emerald-400 font-bold">{activeClassObj.rate}% Hadir</span>
              <span className="text-slate-500">•</span>
              <span>{activeClassObj.hadirFisik}/{activeClassObj.total} Masuk</span>
              {onNavigateToManual && (
                <button
                  type="button"
                  onClick={() => onNavigateToManual(selectedClass)}
                  className="ml-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Presensi Kelas Ini</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid of Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        
        {/* CARD 0: SEMUA KELAS (GLOBAL) */}
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectClass('ALL')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
            selectedClass === 'ALL'
              ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
          }`}
        >
          {selectedClass === 'ALL' && (
            <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-sm">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5">
              <Users className={`w-3.5 h-3.5 ${selectedClass === 'ALL' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className={`text-xs font-black truncate ${selectedClass === 'ALL' ? 'text-white' : 'text-slate-200'}`}>
                Semua Kelas
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              {totalStudents} Total Siswa
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-medium">Kehadiran</span>
            <span className={`text-xs font-mono font-bold ${selectedClass === 'ALL' ? 'text-emerald-300' : 'text-emerald-400'}`}>
              {totalOverallRate}%
            </span>
          </div>
        </motion.button>

        {/* CARDS FOR EACH CLASS */}
        {filteredClassCards.map(item => {
          const isSelected = selectedClass === item.className;
          const hasUnrecorded = item.belumAbsen > 0;

          return (
            <motion.button
              key={item.className}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectClass(item.className)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                isSelected
                  ? 'bg-indigo-500/15 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                  : hasUnrecorded
                  ? 'bg-slate-950/60 border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-950'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-950'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-sm">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between pr-5">
                  <span className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-slate-400 font-mono">
                    {item.total} Siswa
                  </p>
                  {hasUnrecorded ? (
                    <span className="text-[9px] font-bold font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                      {item.belumAbsen} Belum
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      Lengkap
                    </span>
                  )}
                </div>
              </div>

              {/* Progress and status */}
              <div className="mt-3 pt-2 border-t border-slate-800/60 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">{item.hadirFisik}/{item.total} Hadir</span>
                  <span className={`font-bold ${
                    item.rate >= 85 ? 'text-emerald-400' : item.rate >= 70 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {item.rate}%
                  </span>
                </div>

                {/* Micro Progress Bar */}
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-emerald-500 h-full" 
                    style={{ width: `${item.total > 0 ? (item.tepatWaktu / item.total) * 100 : 0}%` }}
                    title={`Tepat Waktu: ${item.tepatWaktu}`}
                  />
                  <div 
                    className="bg-amber-500 h-full" 
                    style={{ width: `${item.total > 0 ? (item.terlambat / item.total) * 100 : 0}%` }}
                    title={`Terlambat: ${item.terlambat}`}
                  />
                  <div 
                    className="bg-rose-500 h-full" 
                    style={{ width: `${item.total > 0 ? ((item.izin + item.sakit + item.alpa) / item.total) * 100 : 0}%` }}
                    title={`Izin/Sakit/Alpa: ${item.izin + item.sakit + item.alpa}`}
                  />
                </div>
              </div>
            </motion.button>
          );
        })}

      </div>

      {filteredClassCards.length === 0 && (
        <div className="py-6 text-center text-slate-500 text-xs">
          Tidak ada kelas yang cocok dengan pencarian "{searchQuery}".
        </div>
      )}
    </motion.div>
  );
};
