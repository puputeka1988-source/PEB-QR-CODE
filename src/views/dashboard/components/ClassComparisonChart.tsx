import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { motion } from 'motion/react';
import { Trophy, TrendingUp, BookOpen, Users, CheckCheck } from 'lucide-react';
import { AttendanceRecord, Student } from '../../../types';

interface ClassComparisonChartProps {
  attendance: AttendanceRecord[];
  students: Student[];
  filterDate: string;
  selectedClass?: string;
  scheduledClasses?: string[];
  filledJournalClasses?: string[];
  onSelectClass?: (className: string) => void;
  onOpenJournal?: (className: string) => void;
}

export const ClassComparisonChart: React.FC<ClassComparisonChartProps> = ({
  attendance,
  students,
  filterDate,
  selectedClass = 'ALL',
  scheduledClasses,
  filledJournalClasses,
  onSelectClass,
  onOpenJournal
}) => {
  const todayLogs = attendance.filter(a => a.date === filterDate);
  const classes = Array.from(new Set(students.map(s => s.class))).sort((a: string, b: string) => (a || '').localeCompare(b || '', 'id', { numeric: true }));

  const classData = useMemo(() => {
    return classes.map(cls => {
      const classStudents = students.filter(s => s.class === cls);
      const classLogs = todayLogs.filter(l => l.class === cls);
      const tepatWaktu = classLogs.filter(l => l.status === 'Hadir').length;
      const terlambat = classLogs.filter(l => l.status === 'Terlambat').length;
      const izin = classLogs.filter(l => l.status === 'Izin').length;
      const sakit = classLogs.filter(l => l.status === 'Sakit').length;
      const alpa = classLogs.filter(l => l.status === 'Alpa').length;
      const totalHadirFisik = tepatWaktu + terlambat;
      const rate = classStudents.length > 0 ? Math.round((totalHadirFisik / classStudents.length) * 100) : 0;

      return {
        className: `Kelas ${cls}`,
        shortClass: cls,
        total: classStudents.length,
        tepatWaktu,
        terlambat,
        izin,
        sakit,
        alpa,
        totalHadirFisik,
        rate
      };
    });
  }, [classes, students, todayLogs]);

  // Top Performing Class
  const topClass = useMemo(() => {
    if (classData.length === 0) return null;
    const sorted = [...classData].sort((a, b) => b.rate - a.rate || b.totalHadirFisik - a.totalHadirFisik);
    return sorted[0].rate > 0 ? sorted[0] : null;
  }, [classData]);

  const getBarColor = (rate: number) => {
    if (rate >= 90) return '#10B981'; // Emerald
    if (rate >= 75) return '#06B6D4'; // Cyan
    if (rate >= 60) return '#F59E0B'; // Amber
    return '#EF4444'; // Rose
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Komparasi Kehadiran Antar Kelas</h3>
            <p className="text-xs text-slate-400 mt-0.5">Peringkat dan persentase kehadiran per rombongan belajar</p>
          </div>
        </div>

        {topClass && (
          <div className="bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 border border-amber-500/30 px-3.5 py-1.5 rounded-2xl flex items-center gap-2 self-start sm:self-auto shadow-sm">
            <span className="text-amber-400">👑</span>
            <span className="text-xs font-bold text-white">
              Terdisiplin: <strong className="text-emerald-400">{topClass.className}</strong> ({topClass.rate}%)
            </span>
          </div>
        )}
      </div>

      {/* Bar Chart Container */}
      <div className="w-full h-64 sm:h-72 my-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={classData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="shortClass" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-950/95 border border-slate-700 p-3.5 rounded-2xl shadow-xl text-xs space-y-2 backdrop-blur-md min-w-[190px]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <strong className="text-white font-bold">{data.className}</strong>
                        <span className="font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {data.rate}%
                        </span>
                      </div>
                      <div className="space-y-1 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-emerald-400">Tepat Waktu:</span>
                          <span className="font-mono font-bold text-white">{data.tepatWaktu}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-400">Terlambat:</span>
                          <span className="font-mono font-bold text-white">{data.terlambat}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-rose-400">Izin / Sakit / Alpa:</span>
                          <span className="font-mono font-bold text-white">{data.izin + data.sakit + data.alpa}</span>
                        </div>
                        <div className="border-t border-slate-800 pt-1 flex justify-between text-slate-400">
                          <span>Total Siswa:</span>
                          <span className="font-mono font-bold text-white">{data.totalHadirFisik} / {data.total}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="rate" 
              radius={[8, 8, 0, 0]}
              onClick={(data) => {
                if (data && data.shortClass && onSelectClass) {
                  onSelectClass(data.shortClass);
                }
              }}
            >
              {classData.map((entry, index) => {
                const isSelected = selectedClass === entry.shortClass;
                return (
                  <Cell 
                    key={`cell-bar-${index}`} 
                    fill={getBarColor(entry.rate)} 
                    stroke={isSelected ? '#FFFFFF' : 'none'}
                    strokeWidth={isSelected ? 2 : 0}
                    className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Grid of Class Cards with Journal Action */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
        {classData.map(cls => {
          const isSelected = selectedClass === cls.shortClass;
          return (
            <div
              key={cls.className}
              onClick={() => onSelectClass && onSelectClass(cls.shortClass)}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-indigo-500/15 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>{cls.className}</span>
                    {isSelected && (
                      <span className="text-[10px] bg-indigo-500 text-white font-mono px-1.5 py-0.2 rounded font-bold">
                        Aktif
                      </span>
                    )}
                  </span>
                  <span 
                    className="font-mono font-black px-2 py-0.5 rounded-md text-[11px]"
                    style={{ 
                      color: getBarColor(cls.rate),
                      backgroundColor: `${getBarColor(cls.rate)}15`
                    }}
                  >
                    {cls.rate}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  {cls.totalHadirFisik} dari {cls.total} siswa hadir ({cls.tepatWaktu} tepat, {cls.terlambat} telat)
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {onSelectClass && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClass(cls.shortClass);
                    }}
                    className={`flex-1 text-[11px] font-bold py-1.5 px-2 rounded-xl border transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-indigo-500 text-white border-indigo-400 font-black'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    {isSelected ? 'Filter Aktif' : 'Filter Grafik'}
                  </button>
                )}

                {onOpenJournal && (!scheduledClasses || scheduledClasses.includes(cls.shortClass)) && (() => {
                  const isJournalFilled = filledJournalClasses?.includes(cls.shortClass);
                  return (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenJournal(cls.shortClass);
                      }}
                      className={`text-[11px] font-bold py-1.5 px-2.5 rounded-xl border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isJournalFilled
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-900 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border-slate-800 hover:border-emerald-500/30'
                      }`}
                      title={
                        isJournalFilled
                          ? `Jurnal Mengajar Kelas ${cls.shortClass} Sudah Diisi (Klik untuk lihat/edit)`
                          : `Isi Jurnal Mengajar Kelas ${cls.shortClass}`
                      }
                    >
                      {isJournalFilled ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Jurnal Terisi</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-3 h-3 text-emerald-400" />
                          <span>Jurnal</span>
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
