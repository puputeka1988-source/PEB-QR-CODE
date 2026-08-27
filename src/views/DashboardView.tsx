import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, Users, CheckCircle2, Clock, AlertCircle, FileSpreadsheet, PlusCircle, Search, 
  Sparkles, TrendingUp, Calendar, BookOpen, Zap, Filter, RotateCcw, UserCheck, X, Check, CheckCheck,
  Monitor, Keyboard, ArrowRight, BarChart3, PieChart, LineChart, AlertTriangle, UserX
} from 'lucide-react';
import { AttendanceStatus, AttendanceRecord } from '../types';
import { cleanTimeFormat, sortStudents, getStudentInitials, formatIndonesianDayAndDate, getCurrentDateInTimezone, getCurrentTimeInTimezone, getTimeInTimezone } from '../utils/formatters';
import { SubNavHeader } from '../components/layout/SubNavHeader';
import { AttendanceTrendChart } from './dashboard/components/AttendanceTrendChart';
import { AttendancePieChart } from './dashboard/components/AttendancePieChart';
import { HourlyArrivalChart } from './dashboard/components/HourlyArrivalChart';
import { ClassComparisonChart } from './dashboard/components/ClassComparisonChart';
import { ClassFilterGrid } from './dashboard/components/ClassFilterGrid';
import { UnrecordedStudentsAlert } from './dashboard/components/UnrecordedStudentsAlert';

export const DashboardView: React.FC = () => {
  const {
    today,
    students,
    attendance,
    journals,
    settings,
    teachingSchedules,
    filterDate,
    setFilterDate,
    setCameraModalOpen,
    setActiveTab,
    markAttendanceByNisn,
    resetAttendanceByNisnAndDate,
    updateAttendanceStatus,
    openJournalForClass,
    setIsKioskMode,
    getActiveSubTab,
    setActiveSubTab,
    navigateToSubTab
  } = useApp();

  const activeSubTab = getActiveSubTab('Dashboard') || 'ringkasan';

  // Manual Attendance States
  const [manualTab, setManualTab] = useState<'grid' | 'search' | 'form'>('grid');
  
  // Custom Editable Date for manual attendance
  const [manualDate, setManualDate] = useState<string>(() => getCurrentDateInTimezone(settings?.timezone));
  
  // Live dynamic clock ticking in real-time matching the dashboard clock
  const [liveTime, setLiveTime] = useState<string>(() => getCurrentTimeInTimezone(settings?.timezone, true));

  React.useEffect(() => {
    const tz = settings?.timezone || 'WIB';
    const updateTime = () => {
      setLiveTime(getCurrentTimeInTimezone(tz, true));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [settings?.timezone]);

  // Barcode USB Hardware Scanner simulation input
  const [hardwareBarcodeNisn, setHardwareBarcodeNisn] = useState('');

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

  // Chart Specific Class Filter State
  const [selectedChartClass, setSelectedChartClass] = useState<string>('ALL');

  const filteredChartStudents = useMemo(() => {
    if (selectedChartClass === 'ALL') return students;
    return students.filter(s => s.class === selectedChartClass);
  }, [students, selectedChartClass]);

  const filteredChartAttendance = useMemo(() => {
    if (selectedChartClass === 'ALL') return attendance;
    const studentIdToClass = new Map(students.map(s => [s.id, s.class]));
    return attendance.filter(a => {
      const cls = a.class || studentIdToClass.get(a.studentId);
      return cls === selectedChartClass;
    });
  }, [attendance, students, selectedChartClass]);

  // Auto select first class when batchClass is empty
  const activeClass = manualBatchClass || availableClasses[0] || '';

  // Evaluate if current liveTime is Late based on cutoff time
  const cutoffTimeStr = settings?.jamTerlambat || settings?.jamMasuk || '07:15';
  const [cutH, cutM] = cutoffTimeStr.replace('.', ':').split(':').map(Number);
  const cutoffMinutes = (isNaN(cutH) ? 7 : cutH) * 60 + (isNaN(cutM) ? 15 : cutM);

  const [liveH, liveM] = liveTime.split(':').map(Number);
  const liveMinutes = (isNaN(liveH) ? 7 : liveH) * 60 + (isNaN(liveM) ? 0 : liveM);

  const isManualTimeLate = liveMinutes > cutoffMinutes;

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

  // State for toggling only unrecorded students in batch grid
  const [showOnlyUnrecordedBatch, setShowOnlyUnrecordedBatch] = useState<boolean>(false);

  // Attendance logs for selected manualDate in manual view
  const modalLogs = attendance.filter(a => a.date === manualDate);

  const batchClassStudents = activeClass 
    ? sortStudents(students.filter(s => s.class === activeClass))
    : [];

  const batchUnrecordedStudents = useMemo(() => {
    const recordedNisns = new Set(modalLogs.map(l => l.nisn));
    return batchClassStudents.filter(s => !recordedNisns.has(s.nisn));
  }, [batchClassStudents, modalLogs]);

  const displayedBatchStudents = useMemo(() => {
    if (showOnlyUnrecordedBatch) {
      return batchUnrecordedStudents;
    }
    return batchClassStudents;
  }, [showOnlyUnrecordedBatch, batchUnrecordedStudents, batchClassStudents]);

  const handleMarkAllClassHadir = () => {
    if (!activeClass || batchClassStudents.length === 0) return;
    const baseDate = new Date();
    const tz = settings?.timezone || 'WIB';

    batchClassStudents.forEach((s, idx) => {
      // Incremental 1-second shift for each student so each has a unique timestamp
      const studentDate = new Date(baseDate.getTime() + idx * 1000);
      const studentTime = getTimeInTimezone(studentDate, tz, true);

      const [sH, sM] = studentTime.split(':').map(Number);
      const sMinutes = (isNaN(sH) ? 7 : sH) * 60 + (isNaN(sM) ? 0 : sM);
      const isLate = sMinutes > cutoffMinutes;
      const defaultStatus = isLate ? 'Terlambat' : 'Hadir';

      markAttendanceByNisn(s.nisn, 'Manual', defaultStatus, 'Presensi Sekaligus Kelas', studentTime, manualDate);
    });
  };

  const handleMarkAllUnrecordedBatch = (status: AttendanceStatus) => {
    if (!activeClass || batchUnrecordedStudents.length === 0) return;
    const baseDate = new Date();
    const tz = settings?.timezone || 'WIB';

    batchUnrecordedStudents.forEach((s, idx) => {
      // Incremental 1-second shift for each student so each has a unique timestamp
      const studentDate = new Date(baseDate.getTime() + idx * 1000);
      const studentTime = getTimeInTimezone(studentDate, tz, true);

      const [sH, sM] = studentTime.split(':').map(Number);
      const sMinutes = (isNaN(sH) ? 7 : sH) * 60 + (isNaN(sM) ? 0 : sM);
      const isLate = sMinutes > cutoffMinutes;
      const finalStatus = status === 'Hadir' && isLate ? 'Terlambat' : status;

      markAttendanceByNisn(s.nisn, 'Manual', finalStatus, 'Presensi Sisa Siswa', studentTime, manualDate);
    });
  };

  const handleResetAllClassAttendance = () => {
    if (!activeClass) return;
    batchClassStudents.forEach(s => {
      resetAttendanceByNisnAndDate(s.nisn, manualDate);
    });
  };

  const handleHardwareBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hardwareBarcodeNisn.trim()) return;
    markAttendanceByNisn(hardwareBarcodeNisn.trim(), 'QR Code');
    setHardwareBarcodeNisn('');
  };

  // Filter logs for selected date
  const todayLogs = attendance.filter(a => a.date === filterDate);
  const totalStudents = students.length;

  const totalHadir = todayLogs.filter(l => l.status === 'Hadir').length;
  const totalTerlambat = todayLogs.filter(l => l.status === 'Terlambat').length;
  const totalIzin = todayLogs.filter(l => l.status === 'Izin').length;
  const totalSakit = todayLogs.filter(l => l.status === 'Sakit').length;
  const totalAlpa = todayLogs.filter(l => l.status === 'Alpa').length;

  const totalHadirFisik = totalHadir + totalTerlambat; // Siswa yang hadir di sekolah
  const totalAbsen = todayLogs.length;
  const totalBelum = Math.max(0, totalStudents - totalAbsen);

  const hadirPercentage = totalStudents > 0 ? Math.round((totalHadirFisik / totalStudents) * 100) : 0;
  const tepatWaktuPercentage = totalStudents > 0 ? Math.round((totalHadir / totalStudents) * 100) : 0;
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

  // Overall attendance completeness per class for selected filterDate
  const classesStatusSummary = useMemo(() => {
    const dateLogs = attendance.filter(a => a.date === filterDate);
    const logMap = new Map<string, AttendanceRecord>();
    dateLogs.forEach(l => {
      if (l.nisn) logMap.set(l.nisn, l);
    });

    return availableClasses.map(cls => {
      const clsStudents = students.filter(s => s.class === cls);
      const total = clsStudents.length;
      const recorded = clsStudents.filter(s => logMap.has(s.nisn)).length;
      const unrecorded = total - recorded;
      const rate = total > 0 ? Math.round((recorded / total) * 100) : 0;

      return {
        className: cls,
        total,
        recorded,
        unrecorded,
        unrecordedStudents: clsStudents.filter(s => !logMap.has(s.nisn)),
        rate,
        isComplete: unrecorded === 0 && total > 0,
        hasStarted: recorded > 0
      };
    });
  }, [attendance, filterDate, availableClasses, students]);

  // Hari dan Jadwal Mengajar Guru untuk tanggal filterDate yang dipilih
  const selectedDateDayInfo = useMemo(() => {
    return formatIndonesianDayAndDate(filterDate);
  }, [filterDate]);

  const scheduledForSelectedDate = useMemo(() => {
    if (!teachingSchedules || teachingSchedules.length === 0) return [];
    const targetDay = selectedDateDayInfo.day.toLowerCase();
    return teachingSchedules.filter(s => s.day.toLowerCase() === targetDay);
  }, [teachingSchedules, selectedDateDayInfo.day]);

  const scheduledClassesForSelectedDate = useMemo(() => {
    return Array.from(new Set(scheduledForSelectedDate.map(s => s.kelas))).filter(Boolean);
  }, [scheduledForSelectedDate]);

  const classScheduleMap = useMemo(() => {
    const map = new Map<string, { jamKe: string; mapel: string; startTime: string; endTime: string; room?: string }>();
    scheduledForSelectedDate.forEach(sch => {
      if (!map.has(sch.kelas)) {
        map.set(sch.kelas, {
          jamKe: sch.jamKe,
          mapel: sch.mapel,
          startTime: sch.startTime,
          endTime: sch.endTime,
          room: sch.room
        });
      }
    });
    return map;
  }, [scheduledForSelectedDate]);

  // Status Jurnal Mengajar untuk tanggal terpilih
  const filledJournalClassesForSelectedDate = useMemo(() => {
    return journals
      .filter(j => j.date === filterDate)
      .map(j => j.kelas);
  }, [journals, filterDate]);

  const filledJournalClassesForManualDate = useMemo(() => {
    return journals
      .filter(j => j.date === manualDate)
      .map(j => j.kelas);
  }, [journals, manualDate]);

  const filledSchedulesCount = useMemo(() => {
    if (scheduledForSelectedDate.length === 0) return 0;
    return scheduledForSelectedDate.filter(sch => 
      filledJournalClassesForSelectedDate.includes(sch.kelas)
    ).length;
  }, [scheduledForSelectedDate, filledJournalClassesForSelectedDate]);

  const isAllScheduledJournalsFilled = useMemo(() => {
    return scheduledForSelectedDate.length > 0 && filledSchedulesCount === scheduledForSelectedDate.length;
  }, [scheduledForSelectedDate, filledSchedulesCount]);

  // PERINGATAN PRESENSI HANYA MUNCUL DI KELAS DAN HARI YANG SESUAI DI JADWAL MENGAJAR GURU
  const incompleteClassesToday = useMemo(() => {
    if (scheduledClassesForSelectedDate.length > 0) {
      return classesStatusSummary
        .filter(c => scheduledClassesForSelectedDate.includes(c.className) && c.unrecorded > 0)
        .map(c => ({
          ...c,
          schedule: classScheduleMap.get(c.className)
        }));
    }
    // Jika tidak ada jadwal mengajar pada hari tersebut, tidak memunculkan peringatan presensi
    return [];
  }, [classesStatusSummary, scheduledClassesForSelectedDate, classScheduleMap]);

  // Status apakah seluruh kelas terjadwal pada hari ini sudah 100% dipresensi
  const allScheduledClassesComplete = useMemo(() => {
    if (scheduledClassesForSelectedDate.length === 0) return false;
    const scheduledSummary = classesStatusSummary.filter(c => scheduledClassesForSelectedDate.includes(c.className));
    return scheduledSummary.length > 0 && scheduledSummary.every(c => c.isComplete);
  }, [classesStatusSummary, scheduledClassesForSelectedDate]);

  // Hari dan Jadwal untuk manualDate yang dipilih pada Tab Manual
  const manualDateDayInfo = useMemo(() => {
    return formatIndonesianDayAndDate(manualDate);
  }, [manualDate]);

  const scheduledForManualDate = useMemo(() => {
    if (!teachingSchedules || teachingSchedules.length === 0) return [];
    const targetDay = manualDateDayInfo.day.toLowerCase();
    return teachingSchedules.filter(s => s.day.toLowerCase() === targetDay);
  }, [teachingSchedules, manualDateDayInfo.day]);

  const scheduledClassesForManualDate = useMemo(() => {
    return Array.from(new Set(scheduledForManualDate.map(s => s.kelas))).filter(Boolean);
  }, [scheduledForManualDate]);

  const manualClassScheduleMap = useMemo(() => {
    const map = new Map<string, { jamKe: string; mapel: string; startTime: string; endTime: string; room?: string }>();
    scheduledForManualDate.forEach(sch => {
      if (!map.has(sch.kelas)) {
        map.set(sch.kelas, {
          jamKe: sch.jamKe,
          mapel: sch.mapel,
          startTime: sch.startTime,
          endTime: sch.endTime,
          room: sch.room
        });
      }
    });
    return map;
  }, [scheduledForManualDate]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNisn.trim()) return;
    const currentTime = getCurrentTimeInTimezone(settings?.timezone, true);
    markAttendanceByNisn(manualNisn.trim(), 'Manual', manualStatus, manualNote, currentTime, manualDate);
    setManualNisn('');
    setManualNote('');
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
      
      {/* Dynamic Submenu Header Bar */}
      <SubNavHeader
        currentTab="Dashboard"
        activeSubTab={activeSubTab}
        onSelectSubTab={(id) => setActiveSubTab('Dashboard', id)}
        badgeCounts={{
          ringkasan: `${hadirPercentage}%`,
          'grafik-analisis': 'Grafik',
          manual: `${totalHadirFisik}/${totalStudents}`,
          'kiosk-scanner': 'Live'
        }}
        extraActions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCameraModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan QR</span>
            </button>
            <button
              onClick={() => setIsKioskMode(true)}
              className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-indigo-500/30 transition-all cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5 text-indigo-400" />
              <span>Kiosk</span>
            </button>
          </div>
        }
      />

      {/* Dynamic Sub-Tab Views with Smooth Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* ========================================================================= */}
          {/* SUBMENU 1: RINGKASAN & AKTIVITAS                                          */}
          {/* ========================================================================= */}
          {activeSubTab === 'ringkasan' && (
            <div className="space-y-6">
          
          {/* Date Bar & Quick Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
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
                onClick={() => setActiveSubTab('Dashboard', 'grafik-analisis')}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 border border-emerald-500/30 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Lihat Grafik & Analitik</span>
              </button>

              <button
                onClick={() => setActiveSubTab('Dashboard', 'manual')}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Presensi Manual Grid</span>
              </button>

              {scheduledForSelectedDate.length > 0 && (
                <button
                  onClick={() => navigateToSubTab('Jurnal Mengajar', 'isi-jurnal')}
                  className={`font-semibold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 border transition-all cursor-pointer ${
                    isAllScheduledJournalsFilled
                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                  }`}
                  title={
                    isAllScheduledJournalsFilled
                      ? `Seluruh Jurnal (${filledSchedulesCount}/${scheduledForSelectedDate.length} Sesi) Telah Diisi Hari Ini`
                      : `Isi Jurnal Mengajar (${filledSchedulesCount}/${scheduledForSelectedDate.length} Sesi Terisi)`
                  }
                >
                  {isAllScheduledJournalsFilled ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Jurnal Lengkap ({filledSchedulesCount}/{scheduledForSelectedDate.length} Sesi)</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span>
                        Isi Jurnal ({filledSchedulesCount > 0 ? `${filledSchedulesCount}/${scheduledForSelectedDate.length} Terisi` : `${scheduledForSelectedDate.length} Sesi`})
                      </span>
                    </>
                  )}
                </button>
              )}

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

          {/* Primary Stats Grid with Animated Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Stat 1: Total Siswa */}
            <motion.div 
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Siswa</span>
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mt-3">{totalStudents}</p>
              <p className="text-[11px] text-slate-400 mt-1">Siswa terdaftar dalam sistem</p>
            </motion.div>

            {/* Stat 2: Total Hadir */}
            <motion.div 
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Hadir (Akumulasi)</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-emerald-400 mt-3">{totalHadirFisik}</p>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3 border border-slate-800">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${hadirPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-emerald-500 h-full rounded-full"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                {hadirPercentage}% kehadiran ({totalHadir} tepat waktu, {totalTerlambat} terlambat)
              </p>
            </motion.div>

            {/* Stat 3: Terlambat */}
            <motion.div 
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Datang Terlambat</span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-amber-400 mt-3">{totalTerlambat}</p>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3 border border-slate-800">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${terlambatPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-amber-500 h-full rounded-full"
                />
              </div>
              <p className="text-[11px] text-amber-400/90 mt-1.5 font-medium">
                {totalTerlambat} siswa ({terlambatPercentage}%) • Tetap dihitung hadir
              </p>
            </motion.div>

            {/* Stat 4: Izin, Sakit & Alpa */}
            <motion.div 
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Izin, Sakit & Alpa</span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <p className="text-3xl font-black text-white">{totalIzin + totalSakit + totalAlpa}</p>
                <span className="text-xs font-semibold text-slate-400 font-mono">
                  (I:{totalIzin} S:{totalSakit} A:{totalAlpa})
                </span>
              </div>
              <p className="text-[11px] text-rose-400/90 mt-2 font-medium">
                {totalBelum} siswa belum melakukan scan presensi
              </p>
            </motion.div>

          </div>

          {/* Automatic Incomplete Classes Alert Banner - FILTERED STRICTLY BY TEACHER'S SCHEDULE */}
          {incompleteClassesToday.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-950/20 border-2 border-amber-500/30 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 flex-wrap">
                      <span>Peringatan Presensi Jadwal {selectedDateDayInfo.day}: Ada {incompleteClassesToday.length} Kelas Belum Lengkap Dipresensi</span>
                      <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                        {incompleteClassesToday.reduce((acc, c) => acc + c.unrecorded, 0)} Siswa Belum Dipresensi
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Peringatan ini khusus untuk kelas yang terjadwal mengajar pada hari <span className="text-amber-300 font-bold">{selectedDateDayInfo.day}</span> ({selectedDateDayInfo.formattedDate}). Klik kelas untuk membuka presensi:
                    </p>
                  </div>
                </div>
              </div>

              {/* Class chips with unrecorded counts and schedule details */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {incompleteClassesToday.map((clsItem) => (
                  <button
                    key={clsItem.className}
                    type="button"
                    onClick={() => {
                      setManualBatchClass(clsItem.className);
                      setActiveSubTab('Dashboard', 'manual');
                    }}
                    className="bg-slate-950/80 hover:bg-amber-500/20 text-slate-200 hover:text-white border border-amber-500/30 hover:border-amber-400/60 rounded-xl px-3 py-2 text-xs font-bold transition-all flex items-center gap-2 group cursor-pointer shadow-sm"
                  >
                    <span className="text-white font-black group-hover:text-amber-300">Kelas {clsItem.className}</span>
                    {clsItem.schedule && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        (Jam {clsItem.schedule.jamKe}{clsItem.schedule.mapel ? ` • ${clsItem.schedule.mapel}` : ''})
                      </span>
                    )}
                    <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                      {clsItem.unrecorded} belum
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Success Banner when All Scheduled Classes Today are 100% Completed */}
          {allScheduledClassesComplete && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-950/20 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5 text-slate-200"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>Presensi Jadwal Hari {selectedDateDayInfo.day} Telah 100% Lengkap!</span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Selesai
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Seluruh siswa di kelas terjadwal hari {selectedDateDayInfo.day} ({scheduledClassesForSelectedDate.join(', ')}) telah terdata dengan lengkap.
                </p>
              </div>
            </motion.div>
          )}

          {/* Quick Dual Visualizations Row: Donut Composition + Hourly Arrival */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttendancePieChart
              attendance={attendance}
              students={students}
              filterDate={filterDate}
            />
            <HourlyArrivalChart
              attendance={attendance}
              filterDate={filterDate}
              settings={settings}
            />
          </div>

          {/* 2 Columns: Live Feed & Class Attendance Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Live Scan Feed */}
            <div className="lg:col-span-2 bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Feed Presensi Hari Ini
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {getIndonesianDateLabel(filterDate)} • {todayLogs.length} siswa tercatat
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {todayLogs.length} Scan Masuk
                </span>
              </div>

              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                {todayLogs.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                    <QrCode className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold text-slate-400">Belum Ada Presensi Pada Tanggal Ini</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Gunakan tombol "Mulai Scan QR" atau "Presensi Manual Grid" untuk mencatat kehadiran siswa.
                    </p>
                  </div>
                ) : (
                  todayLogs.slice().reverse().map(log => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 tracking-tight ${
                          log.status === 'Hadir'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : log.status === 'Terlambat'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {getStudentInitials(log.studentName)}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-xs sm:text-sm text-white truncate">{log.studentName}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
                            <span className="font-mono text-emerald-400">{log.class}</span>
                            <span>•</span>
                            <span>NISN: {log.nisn}</span>
                            {log.note && <span className="text-amber-400/90 italic truncate">({log.note})</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <select
                          value={log.status}
                          onChange={(e) => updateAttendanceStatus(log.id, e.target.value as AttendanceStatus)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border focus:outline-none cursor-pointer ${
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

                        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                          {cleanTimeFormat(log.time)}
                        </span>
                      </div>
                    </motion.div>
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

              <div className="space-y-3.5">
                {classStats.map(stat => (
                  <div key={stat.className} className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span className="font-bold text-white">Kelas {stat.className}</span>
                      <span className="font-mono text-emerald-400">{stat.rate}% ({stat.scanned}/{stat.total})</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.rate}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="bg-emerald-500 h-full rounded-full"
                      />
                    </div>

                    {scheduledClassesForSelectedDate.includes(stat.className) && (() => {
                      const isJournalFilled = filledJournalClassesForSelectedDate.includes(stat.className);
                      return (
                        <button
                          onClick={() => openJournalForClass(stat.className)}
                          className={`w-full flex items-center justify-center gap-1.5 text-[11px] font-bold py-1.5 px-3 rounded-xl transition-all cursor-pointer mt-1 border ${
                            isJournalFilled
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 shadow-sm'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                          title={
                            isJournalFilled
                              ? `Jurnal Kelas ${stat.className} sudah diisi pada ${filterDate}. Klik untuk melihat/edit.`
                              : `Buat Jurnal Mengajar untuk Kelas ${stat.className} (Jadwal Hari Ini)`
                          }
                        >
                          {isJournalFilled ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Jurnal Sudah Diisi</span>
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Buat Jurnal Kelas {stat.className}</span>
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                ))}
              </div>

              {/* Help Box */}
              <div className="pt-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-xs text-emerald-200 space-y-1">
                  <p className="font-bold">Tips Integrasi Jurnal & Presensi:</p>
                  <p className="text-emerald-300/80 leading-relaxed text-[11px]">
                    Presensi yang tercatat hari ini akan otomatis terhubung saat Anda mengisi Jurnal Mengajar dan Rekap Penilaian Harian.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMENU: GRAFIK & VISUALISASI KEHADIRAN                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'grafik-analisis' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Header & Date Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Pusat Grafik & Analisis Kehadiran</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualisasi komparatif, tren harian, diagram waktu, dan ranking disiplin sekolah
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-transparent text-white font-mono font-bold text-xs focus:outline-none cursor-pointer"
                />
              </div>

              {filterDate !== today && (
                <button
                  onClick={() => setFilterDate(today)}
                  className="bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer border border-slate-700"
                >
                  Hari Ini
                </button>
              )}
            </div>
          </div>

          {/* Class Filter Grid Selector */}
          <ClassFilterGrid
            classes={availableClasses}
            students={students}
            attendance={attendance}
            filterDate={filterDate}
            selectedClass={selectedChartClass}
            onSelectClass={(cls) => setSelectedChartClass(cls)}
            onNavigateToManual={(cls) => {
              setManualBatchClass(cls);
              setActiveSubTab('Dashboard', 'manual');
            }}
            scheduledClasses={scheduledClassesForSelectedDate}
          />

          {/* Row 1: Historical Attendance Trend Area Chart */}
          <AttendanceTrendChart
            attendance={filteredChartAttendance}
            students={filteredChartStudents}
            filterDate={filterDate}
            selectedClass={selectedChartClass}
          />

          {/* Row 2: Status Donut Chart & Hourly Arrival Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttendancePieChart
              attendance={filteredChartAttendance}
              students={filteredChartStudents}
              filterDate={filterDate}
              selectedClass={selectedChartClass}
            />

            <HourlyArrivalChart
              attendance={filteredChartAttendance}
              filterDate={filterDate}
              settings={settings}
              selectedClass={selectedChartClass}
            />
          </div>

          {/* Row 3: Class Comparison & Discipline Ranking */}
          <ClassComparisonChart
            attendance={attendance}
            students={students}
            filterDate={filterDate}
            selectedClass={selectedChartClass}
            scheduledClasses={scheduledClassesForSelectedDate}
            filledJournalClasses={filledJournalClassesForSelectedDate}
            onSelectClass={(cls) => setSelectedChartClass(cls)}
            onOpenJournal={(className) => openJournalForClass(className)}
          />

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMENU 2: PRESENSI MANUAL & GRID MATRIKS                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'manual' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl animate-in fade-in duration-150">
          
          {/* Header & Date/Time Setting */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <span>Presensi Manual & Grid Matriks Kelas</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih kelas dan tentukan status kehadiran siswa secara cepat dan presisi.
              </p>
            </div>

            {/* Custom Date & Dynamic Live Clock Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="bg-transparent text-white font-mono font-bold text-xs focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-slate-200">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{liveTime} <span className="text-[10px] text-emerald-400 font-bold ml-0.5">{settings?.timezone || 'WIB'}</span></span>
              </div>
            </div>
          </div>

          {/* Mode Switchers */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setManualTab('grid')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                manualTab === 'grid'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Grid Matriks Kelas</span>
            </button>

            <button
              onClick={() => setManualTab('search')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                manualTab === 'search'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Pencarian Cepat</span>
            </button>

            <button
              onClick={() => setManualTab('form')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                manualTab === 'form'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Formulir Tunggal</span>
            </button>
          </div>

          {/* TAB 1: Grid Matriks Kelas */}
          {manualTab === 'grid' && (
            <div className="space-y-4">
              
              {/* Horizontal Class Selector Pill Buttons */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {availableClasses.map(cls => {
                    const classStudentCount = students.filter(s => s.class === cls).length;
                    const isSelected = activeClass === cls;
                    const clsLogs = modalLogs.filter(l => l.class === cls || students.some(st => st.id === l.studentId && st.class === cls));
                    const clsUnrecorded = Math.max(0, classStudentCount - clsLogs.length);
                    const isScheduledThisDay = scheduledClassesForManualDate.includes(cls);

                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setManualBatchClass(cls)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-md'
                            : isScheduledThisDay
                              ? 'bg-slate-900 text-amber-300 border-amber-500/40 hover:border-amber-400 hover:text-white'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {isScheduledThisDay && !isSelected && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title={`Jadwal Hari ${manualDateDayInfo.day}`} />
                        )}
                        <span>Kelas {cls} ({classStudentCount})</span>
                        {isScheduledThisDay && (
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            Jadwal {manualDateDayInfo.day}
                          </span>
                        )}
                        {clsUnrecorded > 0 && !isSelected && isScheduledThisDay && (
                          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shrink-0" title={`${clsUnrecorded} siswa belum dipresensi (Jadwal Hari Ini)`} />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMarkAllClassHadir}
                    className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Tandai Semua Hadir ({activeClass})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetAllClassAttendance}
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Kelas Ini</span>
                  </button>
                </div>
              </div>

              {/* Automatic Warning & Quick Actions for Unrecorded Students in Selected Class */}
              <UnrecordedStudentsAlert
                className={activeClass}
                date={manualDate}
                studentsInClass={batchClassStudents}
                attendanceRecords={modalLogs}
                isJournalFilled={filledJournalClassesForManualDate.includes(activeClass)}
                scheduleInfo={{
                  day: manualDateDayInfo.day,
                  jamKe: manualClassScheduleMap.get(activeClass)?.jamKe,
                  mapel: manualClassScheduleMap.get(activeClass)?.mapel,
                  isScheduledToday: scheduledClassesForManualDate.includes(activeClass)
                }}
                onMarkStudent={(nisn, status) => {
                  const currentTime = getCurrentTimeInTimezone(settings?.timezone, true);
                  const [sH, sM] = currentTime.split(':').map(Number);
                  const sMinutes = (isNaN(sH) ? 7 : sH) * 60 + (isNaN(sM) ? 0 : sM);
                  const isLate = sMinutes > cutoffMinutes;
                  const finalStatus = status === 'Hadir' && isLate ? 'Terlambat' : status;
                  markAttendanceByNisn(nisn, 'Manual', finalStatus, 'Presensi Manual Grid', currentTime, manualDate);
                }}
                onMarkAllUnrecorded={(status) => {
                  handleMarkAllUnrecordedBatch(status);
                }}
                showOnlyUnrecorded={showOnlyUnrecordedBatch}
                onToggleShowOnlyUnrecorded={(showOnly) => setShowOnlyUnrecordedBatch(showOnly)}
                onOpenJournal={(clsName) => openJournalForClass(clsName)}
              />

              {/* Student Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[540px] overflow-y-auto pr-1 scrollbar-thin">
                {displayedBatchStudents.length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-slate-950/60 border border-dashed border-slate-800 rounded-3xl p-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                    <p className="text-sm font-bold text-white">Semua Siswa Kelas {activeClass} Sudah Dipresensi</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Tidak ada siswa yang berstatus 'Belum Presensi' untuk tanggal ini.
                    </p>
                    {showOnlyUnrecordedBatch && (
                      <button
                        type="button"
                        onClick={() => setShowOnlyUnrecordedBatch(false)}
                        className="mt-3 inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Tampilkan Semua Siswa ({batchClassStudents.length})</span>
                      </button>
                    )}
                  </div>
                ) : (
                  displayedBatchStudents.map(student => {
                    const existingRecord = modalLogs.find(l => l.nisn === student.nisn);
                    const currentStatus = existingRecord ? existingRecord.status : null;

                    return (
                      <div
                        key={student.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          currentStatus === 'Hadir'
                            ? 'bg-emerald-950/20 border-emerald-800/60 shadow-sm'
                            : currentStatus === 'Terlambat'
                            ? 'bg-amber-950/20 border-amber-800/60 shadow-sm'
                            : currentStatus === 'Izin' || currentStatus === 'Sakit' || currentStatus === 'Alpa'
                            ? 'bg-rose-950/20 border-rose-800/60 shadow-sm'
                            : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="truncate">
                            <p className="font-bold text-xs text-white truncate">{student.name}</p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">NISN: {student.nisn}</p>
                          </div>
                          {currentStatus ? (
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                              currentStatus === 'Hadir'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : currentStatus === 'Terlambat'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {currentStatus}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0 animate-pulse">
                              Belum Absen
                            </span>
                          )}
                        </div>

                        {/* Action buttons H, T, I, S, A */}
                        <div className="flex items-center gap-1 pt-1">
                          {(['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpa'] as AttendanceStatus[]).map(st => {
                            const isBtnActive = currentStatus === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => {
                                  const currentTime = getCurrentTimeInTimezone(settings?.timezone, true);
                                  markAttendanceByNisn(student.nisn, 'Manual', st, undefined, currentTime, manualDate);
                                }}
                                className={`flex-1 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all border ${
                                  isBtnActive
                                    ? st === 'Hadir'
                                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                                      : st === 'Terlambat'
                                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                      : 'bg-rose-500 text-slate-950 border-rose-400 shadow-sm'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                                }`}
                              >
                                {st === 'Hadir' ? 'H' : st === 'Terlambat' ? 'T' : st === 'Izin' ? 'I' : st === 'Sakit' ? 'S' : 'A'}
                              </button>
                            );
                          })}

                          {currentStatus && (
                            <button
                              type="button"
                              onClick={() => resetAttendanceByNisnAndDate(student.nisn, manualDate)}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-0.5 cursor-pointer shrink-0"
                              title="Reset siswa ke Belum Absen"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* TAB 2: Pencarian Cepat */}
          {manualTab === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ketik Nama Siswa, NISN, atau Kelas untuk presensi instan..."
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 rounded-2xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                {searchFilteredStudents.map(student => {
                  const existingRecord = modalLogs.find(l => l.nisn === student.nisn);
                  return (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <div>
                        <p className="font-bold text-xs text-white">{student.name}</p>
                        <p className="text-[10px] text-slate-400">Kelas {student.class} • NISN: {student.nisn}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {(['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpa'] as AttendanceStatus[]).map(st => (
                          <button
                            key={st}
                            onClick={() => {
                              const currentTime = getCurrentTimeInTimezone(settings?.timezone, true);
                              markAttendanceByNisn(student.nisn, 'Manual', st, undefined, currentTime, manualDate);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 border border-slate-800 hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-400 text-slate-300 transition-all cursor-pointer"
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Formulir Tunggal */}
          {manualTab === 'form' && (
            <form onSubmit={handleManualSubmit} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Siswa / Masukkan NISN:</label>
                <select
                  value={manualNisn}
                  onChange={(e) => setManualNisn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">-- Pilih Siswa ({students.length} Siswa Terdaftar) --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.nisn}>{s.name} ({s.class}) - NISN: {s.nisn}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status Kehadiran:</label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value as AttendanceStatus)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Hadir">Hadir (Tepat Waktu)</option>
                  <option value="Terlambat">Terlambat</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Alpa">Alpa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan Tambahan (Opsional):</label>
                <input
                  type="text"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="Contoh: Surat Izin Resmi, Kegiatan Lomba..."
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Simpan Presensi
              </button>
            </form>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMENU 3: SCANNER QR & MODE KIOSK LOBI                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'kiosk-scanner' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
          
          {/* Card 1: Scanner Kamera QR Cepat */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Scanner Kamera Terintegrasi</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Gunakan kamera perangkat (laptop, webcam USB, atau smartphone) untuk mendeteksi kode QR pada Kartu Pelajar secara instan dengan panduan audio feedback.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-300">
                <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Fitur Pemindai Kamera:</span>
                </p>
                <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-1 pl-1">
                  <li>Deteksi otomatis NISN & foto siswa</li>
                  <li>Suara konfirmasi berhasil (Hadir / Terlambat)</li>
                  <li>Pencegahan duplikasi presensi ganda</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setCameraModalOpen(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <QrCode className="w-5 h-5" />
              <span>Buka Jendela Kamera Scanner</span>
            </button>
          </div>

          {/* Card 2: Mode Kiosk Lobi Gerbang */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Mode Layar Penuh Kiosk Lobi</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Tampilan antarmuka khusus layar lebar (stand lobi sekolah, monitor gerbang, atau tablet absensi) dengan jam digital besar dan ucapan selamat datang.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-300">
                <p className="font-bold text-indigo-400 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4" />
                  <span>Kelebihan Mode Kiosk:</span>
                </p>
                <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-1 pl-1">
                  <li>Layar bersih tanpa menu sidebar yang mengganggu</li>
                  <li>Dukungan Barcode Scanner Laser USB & Kamera</li>
                  <li>Animasi kartu ucapan selamat datang realtime</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setIsKioskMode(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <Monitor className="w-5 h-5" />
              <span>Masuk ke Mode Kiosk Lobi</span>
            </button>
          </div>

          {/* Hardware Barcode Scanner USB Quick Test Helper */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Keyboard className="w-4 h-4 text-emerald-400" />
              <span>Uji Coba Input Pemindai Barcode USB / Bluetooth:</span>
            </div>
            <form onSubmit={handleHardwareBarcodeSubmit} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Arahkan scanner barcode atau ketik NISN manual lalu tekan Enter..."
                value={hardwareBarcodeNisn}
                onChange={(e) => setHardwareBarcodeNisn(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs px-4 py-2.5 rounded-2xl focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs px-4 py-2.5 rounded-2xl border border-slate-700 transition-colors cursor-pointer"
              >
                Scan Enter
              </button>
            </form>
          </div>

        </div>
      )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
};
