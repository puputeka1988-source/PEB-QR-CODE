import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { motion } from 'motion/react';
import { Clock, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { AttendanceRecord, AppSettings } from '../../../types';

interface HourlyArrivalChartProps {
  attendance: AttendanceRecord[];
  filterDate: string;
  settings: AppSettings;
  selectedClass?: string;
}

export const HourlyArrivalChart: React.FC<HourlyArrivalChartProps> = ({
  attendance,
  filterDate,
  settings,
  selectedClass = 'ALL'
}) => {
  const cutoffTime = settings.jamTerlambat || settings.jamMasuk || '07:15';
  const todayLogs = attendance.filter(a => a.date === filterDate && (a.status === 'Hadir' || a.status === 'Terlambat'));

  const timeBuckets = useMemo(() => {
    const buckets = [
      { id: 'b1', label: '< 06:30', fullLabel: 'Sebelum 06:30 (Pagi Sekali)', count: 0, isLate: false },
      { id: 'b2', label: '06:30-06:45', fullLabel: '06:30 - 06:45', count: 0, isLate: false },
      { id: 'b3', label: '06:45-07:00', fullLabel: '06:45 - 07:00', count: 0, isLate: false },
      { id: 'b4', label: '07:00-07:15', fullLabel: '07:00 - 07:15', count: 0, isLate: false },
      { id: 'b5', label: '07:15-07:30', fullLabel: '07:15 - 07:30', count: 0, isLate: true },
      { id: 'b6', label: '> 07:30', fullLabel: 'Setelah 07:30 (Sangat Terlambat)', count: 0, isLate: true }
    ];

    todayLogs.forEach(log => {
      if (!log.time) return;
      const clean = log.time.replace('.', ':');
      const [hStr, mStr] = clean.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (isNaN(h)) return;
      const totalMins = h * 60 + (isNaN(m) ? 0 : m);

      if (totalMins < 6 * 60 + 30) {
        buckets[0].count++;
      } else if (totalMins < 6 * 60 + 45) {
        buckets[1].count++;
      } else if (totalMins < 7 * 60) {
        buckets[2].count++;
      } else if (totalMins < 7 * 60 + 15) {
        buckets[3].count++;
      } else if (totalMins < 7 * 60 + 30) {
        buckets[4].count++;
      } else {
        buckets[5].count++;
      }
    });

    return buckets;
  }, [todayLogs]);

  // Find Peak Arrival Time
  const peakBucket = useMemo(() => {
    let max = timeBuckets[0];
    timeBuckets.forEach(b => {
      if (b.count > max.count) max = b;
    });
    return max.count > 0 ? max : null;
  }, [timeBuckets]);

  const totalArrived = todayLogs.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Distribusi Jam Kedatangan</span>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                selectedClass !== 'ALL'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                {selectedClass !== 'ALL' ? `Kelas ${selectedClass}` : 'Semua'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Pola waktu kedatangan siswa di gerbang/sekolah</p>
          </div>
        </div>

        {peakBucket && (
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-2xl flex items-center gap-2 self-start sm:self-auto">
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">
              Puncak Kedatangan: <strong className="text-white font-mono">{peakBucket.label}</strong> ({peakBucket.count} siswa)
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="w-full h-56 sm:h-64 my-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={timeBuckets} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="label" 
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
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const pct = totalArrived > 0 ? Math.round((data.count / totalArrived) * 100) : 0;
                  return (
                    <div className="bg-slate-950/95 border border-slate-700 px-3.5 py-2.5 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-md">
                      <p className="font-bold text-white flex items-center gap-1.5">
                        {data.isLate ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {data.fullLabel} (Terlambat)
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {data.fullLabel} (Tepat Waktu)
                          </span>
                        )}
                      </p>
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span>Jumlah Siswa:</span>
                        <strong className="font-mono text-white">{data.count} Siswa ({pct}%)</strong>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {timeBuckets.map((entry, index) => (
                <Cell 
                  key={`bar-cell-${index}`} 
                  fill={entry.isLate ? '#F59E0B' : '#10B981'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Info Footnote */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            Tepat Waktu (&lt; {cutoffTime})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
            Terlambat (&ge; {cutoffTime})
          </span>
        </div>
        <span className="font-mono text-slate-500">{totalArrived} Total Siswa Masuk</span>
      </div>
    </motion.div>
  );
};
