import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { motion } from 'motion/react';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { AttendanceRecord, Student } from '../../types';

interface AttendanceTrendChartProps {
  attendance: AttendanceRecord[];
  students: Student[];
  filterDate: string;
  selectedClass?: string;
}

export const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({
  attendance,
  students,
  filterDate,
  selectedClass = 'ALL'
}) => {
  const [dayRange, setDayRange] = useState<7 | 14 | 30>(7);

  const totalStudents = students.length || 1;

  // Generate historical data based on dayRange ending at filterDate or today
  const trendData = useMemo(() => {
    const data = [];
    const baseDate = new Date(filterDate || new Date().toISOString().split('T')[0]);
    if (isNaN(baseDate.getTime())) return [];

    // Helper days
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    for (let i = dayRange - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`;
      const shortLabel = `${d.getDate()}/${d.getMonth() + 1}`;

      const logsOnDate = attendance.filter(a => a.date === dateStr);
      const hadir = logsOnDate.filter(a => a.status === 'Hadir').length;
      const terlambat = logsOnDate.filter(a => a.status === 'Terlambat').length;
      const izin = logsOnDate.filter(a => a.status === 'Izin').length;
      const sakit = logsOnDate.filter(a => a.status === 'Sakit').length;
      const alpa = logsOnDate.filter(a => a.status === 'Alpa').length;
      const totalHadirFisik = hadir + terlambat;
      const rate = Math.min(100, Math.round((totalHadirFisik / totalStudents) * 100));

      data.push({
        date: dateStr,
        label: dayLabel,
        shortLabel,
        hadir,
        terlambat,
        izinSakitAlpa: izin + sakit + alpa,
        totalHadirFisik,
        rate
      });
    }

    return data;
  }, [attendance, totalStudents, filterDate, dayRange]);

  // Calculate average attendance in this range
  const avgAttendance = useMemo(() => {
    if (trendData.length === 0) return 0;
    const sum = trendData.reduce((acc, curr) => acc + curr.rate, 0);
    return Math.round(sum / trendData.length);
  }, [trendData]);

  // Calculate trend comparison (first half vs second half)
  const trendDifference = useMemo(() => {
    if (trendData.length < 2) return 0;
    const mid = Math.floor(trendData.length / 2);
    const firstHalf = trendData.slice(0, mid);
    const secondHalf = trendData.slice(mid);
    
    const avg1 = firstHalf.reduce((a, b) => a + b.rate, 0) / (firstHalf.length || 1);
    const avg2 = secondHalf.reduce((a, b) => a + b.rate, 0) / (secondHalf.length || 1);
    return Math.round(avg2 - avg1);
  }, [trendData]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs min-w-[200px] space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-white">{data.label}</span>
            <span className="font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              {data.rate}%
            </span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Tepat Waktu:
              </span>
              <span className="font-mono font-bold text-white">{data.hadir}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Terlambat:
              </span>
              <span className="font-mono font-bold text-white">{data.terlambat}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                Izin / Sakit / Alpa:
              </span>
              <span className="font-mono font-bold text-white">{data.izinSakitAlpa}</span>
            </div>
            <div className="border-t border-slate-800/80 pt-1 flex justify-between items-center text-slate-400">
              <span>Total Fisik Hadir:</span>
              <span className="font-mono font-bold text-emerald-300">{data.totalHadirFisik} / {totalStudents}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden"
    >
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Tren Kehadiran Siswa</span>
                <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  selectedClass !== 'ALL'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}>
                  {selectedClass !== 'ALL' ? `Kelas ${selectedClass}` : 'Semua Kelas'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Grafik historis kehadiran tepat waktu, terlambat, dan ketidakhadiran
              </p>
            </div>
          </div>
        </div>

        {/* Range Selector & Summary Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1 text-xs">
            {([7, 14, 30] as const).map(range => (
              <button
                key={range}
                onClick={() => setDayRange(range)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  dayRange === range
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range} Hari
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Trend Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 relative z-10">
        <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-semibold block">Rata-rata Kehadiran:</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-400 font-mono">{avgAttendance}%</span>
            <span className="text-[10px] text-slate-500">dalam {dayRange} hari</span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-semibold block">Pergerakan Tren:</span>
          <div className="flex items-center gap-1.5 mt-1">
            {trendDifference >= 0 ? (
              <div className="flex items-center text-emerald-400 font-bold text-base font-mono">
                <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                <span>+{trendDifference}%</span>
              </div>
            ) : (
              <div className="flex items-center text-rose-400 font-bold text-base font-mono">
                <ArrowDownRight className="w-4 h-4 stroke-[3]" />
                <span>{trendDifference}%</span>
              </div>
            )}
            <span className="text-[10px] text-slate-400">vs periode lalu</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Status Disiplin:</span>
            <span className="text-xs font-bold text-white mt-1 block">
              {avgAttendance >= 90 ? '🌟 Sangat Disiplin' : avgAttendance >= 75 ? '👍 Baik' : '⚠️ Perlu Perhatian'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="w-full h-72 sm:h-80 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorTerlambat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="shortLabel" 
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
              domain={[0, Math.max(10, totalStudents)]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              align="right" 
              height={36}
              iconType="circle"
              formatter={(value) => {
                const labels: Record<string, string> = {
                  hadir: 'Tepat Waktu',
                  terlambat: 'Terlambat',
                  izinSakitAlpa: 'Izin/Sakit/Alpa'
                };
                return <span className="text-xs text-slate-300 font-semibold">{labels[value] || value}</span>;
              }}
            />
            <Area
              type="monotone"
              dataKey="hadir"
              name="hadir"
              stroke="#10B981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorHadir)"
            />
            <Area
              type="monotone"
              dataKey="terlambat"
              name="terlambat"
              stroke="#F59E0B"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTerlambat)"
            />
            <Area
              type="monotone"
              dataKey="izinSakitAlpa"
              name="izinSakitAlpa"
              stroke="#F43F5E"
              strokeWidth={1.5}
              fill="none"
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </motion.div>
  );
};
