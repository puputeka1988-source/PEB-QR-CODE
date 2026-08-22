import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'motion/react';
import { PieChart as PieIcon, CheckCircle2, Clock, AlertCircle, HelpCircle } from 'lucide-react';
import { AttendanceRecord, Student } from '../../../types';

interface AttendancePieChartProps {
  attendance: AttendanceRecord[];
  students: Student[];
  filterDate: string;
  selectedClass?: string;
}

interface StatusSlice {
  name: string;
  value: number;
  color: string;
  percentage: number;
  iconName: string;
}

export const AttendancePieChart: React.FC<AttendancePieChartProps> = ({
  attendance,
  students,
  filterDate,
  selectedClass = 'ALL'
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const totalStudents = students.length;
  const todayLogs = attendance.filter(a => a.date === filterDate);

  const hadirCount = todayLogs.filter(l => l.status === 'Hadir').length;
  const terlambatCount = todayLogs.filter(l => l.status === 'Terlambat').length;
  const izinCount = todayLogs.filter(l => l.status === 'Izin').length;
  const sakitCount = todayLogs.filter(l => l.status === 'Sakit').length;
  const alpaCount = todayLogs.filter(l => l.status === 'Alpa').length;

  const totalRecorded = todayLogs.length;
  const belumAbsenCount = Math.max(0, totalStudents - totalRecorded);
  const totalHadirFisik = hadirCount + terlambatCount;
  const overallRate = totalStudents > 0 ? Math.round((totalHadirFisik / totalStudents) * 100) : 0;

  const rawData: StatusSlice[] = [
    { 
      name: 'Tepat Waktu', 
      value: hadirCount, 
      color: '#10B981', 
      percentage: totalStudents > 0 ? Math.round((hadirCount / totalStudents) * 100) : 0,
      iconName: 'CheckCircle2'
    },
    { 
      name: 'Terlambat', 
      value: terlambatCount, 
      color: '#F59E0B', 
      percentage: totalStudents > 0 ? Math.round((terlambatCount / totalStudents) * 100) : 0,
      iconName: 'Clock'
    },
    { 
      name: 'Izin', 
      value: izinCount, 
      color: '#0EA5E9', 
      percentage: totalStudents > 0 ? Math.round((izinCount / totalStudents) * 100) : 0,
      iconName: 'HelpCircle'
    },
    { 
      name: 'Sakit', 
      value: sakitCount, 
      color: '#A855F7', 
      percentage: totalStudents > 0 ? Math.round((sakitCount / totalStudents) * 100) : 0,
      iconName: 'AlertCircle'
    },
    { 
      name: 'Alpa', 
      value: alpaCount, 
      color: '#EF4444', 
      percentage: totalStudents > 0 ? Math.round((alpaCount / totalStudents) * 100) : 0,
      iconName: 'AlertCircle'
    },
    { 
      name: 'Belum Absen', 
      value: belumAbsenCount, 
      color: '#334155', 
      percentage: totalStudents > 0 ? Math.round((belumAbsenCount / totalStudents) * 100) : 0,
      iconName: 'Clock'
    }
  ];

  // Filter out 0 values for pie rendering, but if all 0, provide placeholder
  const chartData = rawData.filter(d => d.value > 0);
  const displayData = chartData.length > 0 ? chartData : [{ name: 'Belum Ada Data', value: 1, color: '#1e293b', percentage: 0, iconName: '' }];

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const activeSlice = activeIndex !== null && chartData[activeIndex] ? chartData[activeIndex] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Komposisi Kehadiran</span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  selectedClass !== 'ALL'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}>
                  {selectedClass !== 'ALL' ? `Kelas ${selectedClass}` : 'Semua'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribusi status siswa hari ini</p>
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold bg-slate-950 text-slate-300 px-3 py-1 rounded-full border border-slate-800">
            {totalStudents} Siswa
          </span>
        </div>

        {/* Donut Chart with Centered Metric */}
        <div className="relative w-full h-56 flex items-center justify-center my-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as StatusSlice;
                    return (
                      <div className="bg-slate-950/95 border border-slate-700 px-3 py-2 rounded-xl shadow-xl text-xs space-y-1 backdrop-blur-md">
                        <div className="flex items-center gap-2 font-bold text-white">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                          <span>{data.name}</span>
                        </div>
                        <p className="text-slate-300 font-mono">
                          {data.value} Siswa ({data.percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={88}
                paddingAngle={3}
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                stroke="none"
              >
                {displayData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      filter: activeIndex === index ? 'brightness(1.2) drop-shadow(0 0 6px rgba(255,255,255,0.2))' : 'none'
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Donut Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            {activeSlice ? (
              <motion.div
                key={activeSlice.name}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: activeSlice.color }}>
                  {activeSlice.name}
                </span>
                <span className="text-2xl font-black text-white font-mono">{activeSlice.value}</span>
                <span className="text-[10px] text-slate-400 block font-mono">({activeSlice.percentage}%)</span>
              </motion.div>
            ) : (
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hadir Fisik</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{overallRate}%</span>
                <span className="text-[10px] text-slate-400 font-mono block">{totalHadirFisik}/{totalStudents} Siswa</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Legend Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
        {rawData.map((item, idx) => (
          <div
            key={item.name}
            onMouseEnter={() => {
              const foundIdx = chartData.findIndex(c => c.name === item.name);
              if (foundIdx !== -1) setActiveIndex(foundIdx);
            }}
            onMouseLeave={() => setActiveIndex(null)}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 transition-all cursor-pointer text-xs"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-300 font-medium text-[11px] truncate">{item.name}</span>
            </div>
            <span className="font-mono font-bold text-white text-[11px] shrink-0">{item.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
