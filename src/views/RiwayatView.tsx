import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, AttendanceRecord } from '../types';
import { SubNavHeader } from '../components/layout/SubNavHeader';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, Filter, FileSpreadsheet, Trash2, Calendar, CheckCircle2, Clock, 
  AlertCircle, Pencil, X, Save, ShieldCheck, Printer, Layers, CalendarDays, 
  RefreshCw, FolderArchive, Search, UserCheck, AlertTriangle, ArrowRight,
  TrendingUp, BarChart3, PieChart, Sparkles, Check, CheckSquare,
  ChevronLeft, ChevronRight, Info, WifiOff, ChevronDown, ChevronUp, LayoutGrid, Table
} from 'lucide-react';
import { cleanDateFormat, cleanTimeFormat, generateOfficialKopHtml, getCurrentDateInTimezone, getCurrentTimeInTimezone } from '../utils/formatters';
import { printHtmlDocument } from '../utils/printHelper';

export const RiwayatView: React.FC = () => {
  const { 
    attendance, students, journals, updateAttendanceStatus, editAttendanceRecord, 
    deleteAttendance, clearAttendanceForClassAndDate, settings, pullDataFromSheets, isPullingFromSheets,
    academicYears, activeAcademicYear, getActiveSubTab, setActiveSubTab, showToast
  } = useApp();

  const activeSubTab = getActiveSubTab('Riwayat') || 'log-presensi';

  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('SEMUA');
  const [filterPeriod, setFilterPeriod] = useState<'SEMUA' | 'HARIAN' | 'MINGGUAN' | 'BULANAN' | 'SEMESTER'>('SEMUA');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');
  const [filterClass, setFilterClass] = useState<string>('SEMUA');
  const [searchLog, setSearchLog] = useState<string>('');

  // Pagination for Log Presensi
  const [logPage, setLogPage] = useState<number>(1);
  const [logPageSize, setLogPageSize] = useState<number>(25);

  // Pagination & Search for Rekapitulasi & Statistik
  const [rekapPage, setRekapPage] = useState<number>(1);
  const [rekapPageSize, setRekapPageSize] = useState<number>(25);
  const [searchRekap, setSearchRekap] = useState<string>('');
  const [rekapLayoutMode, setRekapLayoutMode] = useState<'matriks' | 'ringkas'>('matriks');
  const [expandedStudentCards, setExpandedStudentCards] = useState<Record<string, boolean>>({});

  // Quick Correction Form State (Submenu 3)
  const [quickStudentId, setQuickStudentId] = useState<string>('');
  const [quickDate, setQuickDate] = useState<string>(() => getCurrentDateInTimezone(settings?.timezone));
  const [quickTime, setQuickTime] = useState<string>(() => getCurrentTimeInTimezone(settings?.timezone, true));
  const [quickStatus, setQuickStatus] = useState<AttendanceStatus>('Hadir');
  const [quickNote, setQuickNote] = useState<string>('');

  // Quick Holiday / Non-KBM Cleanup State (Submenu 3)
  const [cleanupDate, setCleanupDate] = useState<string>(() => getCurrentDateInTimezone(settings?.timezone));
  const [cleanupClass, setCleanupClass] = useState<string>('SEMUA');

  // Batch Clear Confirmation Modal State
  const [clearBatchModal, setClearBatchModal] = useState<{ 
    isOpen: boolean; 
    date: string; 
    class: string; 
    count: number; 
    title: string; 
    subtitle: string;
  } | null>(null);

  // Edit Modal State
  const [editingLog, setEditingLog] = useState<AttendanceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('Hadir');
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editMethod, setEditMethod] = useState<'QR Code' | 'Manual'>('QR Code');
  const [editNote, setEditNote] = useState<string>('');

  const classes = ['SEMUA', ...Array.from(new Set(students.map(s => s.class))).sort()];

  const openEditModal = (log: AttendanceRecord) => {
    setEditingLog(log);
    setEditStatus(log.status);
    setEditDate(log.date);
    setEditTime(log.time);
    setEditMethod(log.method);
    setEditNote(log.note || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    editAttendanceRecord(editingLog.id, {
      status: editStatus,
      date: editDate,
      time: editTime,
      method: editMethod,
      note: editNote.trim() || undefined
    });

    setEditingLog(null);
  };

  const handleQuickCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStudentId) {
      showToast('Pilih siswa yang ingin dikoreksi datanya.', 'warning');
      return;
    }

    const selectedSt = students.find(s => s.id === quickStudentId);
    if (!selectedSt) return;

    // Check if record exists for this date and student
    const existingLog = attendance.find(a => a.nisn === selectedSt.nisn && a.date === quickDate);
    if (existingLog) {
      editAttendanceRecord(existingLog.id, {
        status: quickStatus,
        time: quickTime,
        method: 'Manual',
        note: quickNote.trim() || 'Koreksi Riwayat Presensi'
      });
      showToast(`Presensi ${selectedSt.name} tanggal ${quickDate} berhasil diperbarui menjadi ${quickStatus}.`, 'success');
    } else {
      showToast(`Data presensi untuk ${selectedSt.name} tanggal ${quickDate} tidak ditemukan di log. Gunakan Presensi Manual di Dashboard untuk membuat baru.`, 'info');
    }

    setQuickNote('');
  };

  // Quick student map for O(1) identity lookups
  const studentsMap = useMemo(() => {
    const byId = new Map<string, typeof students[0]>();
    const byNisn = new Map<string, typeof students[0]>();
    for (const s of students) {
      if (s.id) byId.set(s.id, s);
      if (s.nisn) byNisn.set(s.nisn, s);
    }
    return { byId, byNisn };
  }, [students]);

  // Reset pagination on filter change
  useEffect(() => {
    setLogPage(1);
  }, [filterAcademicYear, filterPeriod, filterDate, filterStatus, filterClass, searchLog]);

  // Filtered Attendance Logic
  const filteredAttendance = useMemo(() => {
    return attendance.filter(record => {
      // 1. Academic Year filter
      let matchAcademicYear = true;
      if (filterAcademicYear !== 'SEMUA') {
        const selectedAy = academicYears.find(a => a.id === filterAcademicYear);
        if (selectedAy && selectedAy.startDate && selectedAy.endDate) {
          matchAcademicYear = record.date >= selectedAy.startDate && record.date <= selectedAy.endDate;
        }
      }

      // Find current student from master map for instant O(1) lookup
      const studentObj = (record.studentId && studentsMap.byId.get(record.studentId)) || 
                         (record.nisn && studentsMap.byNisn.get(record.nisn));

      const effectiveClass = studentObj ? studentObj.class : record.class;
      const effectiveName = studentObj ? studentObj.name : record.studentName;
      const effectiveNisn = studentObj ? studentObj.nisn : record.nisn;

      // 2. Class filter: match if student's current class matches OR record's historical class matches
      const matchClass = filterClass === 'SEMUA' || effectiveClass === filterClass || record.class === filterClass;

      // 3. Status filter
      const matchStatus = filterStatus === 'SEMUA' || record.status === filterStatus;

      // 4. Search query
      const q = (searchLog || '').toLowerCase();
      const matchSearch = !searchLog || 
        (effectiveName && effectiveName.toLowerCase().includes(q)) || 
        (record.studentName && record.studentName.toLowerCase().includes(q)) || 
        (effectiveNisn && effectiveNisn.includes(searchLog)) ||
        (record.nisn && record.nisn.includes(searchLog)) ||
        (record.note && record.note.toLowerCase().includes(q));

      // 5. Period & Date filter
      let matchPeriod = true;
      const targetDateStr = record.date;
      const refDateStr = filterDate || new Date().toISOString().split('T')[0];

      if (filterPeriod === 'HARIAN') {
        matchPeriod = filterDate ? targetDateStr === filterDate : targetDateStr === refDateStr;
      } else if (filterPeriod === 'MINGGUAN') {
        const tTime = new Date(targetDateStr).getTime();
        const rTime = new Date(refDateStr).getTime();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        matchPeriod = tTime >= (rTime - sevenDaysMs) && tTime <= (rTime + 24 * 60 * 60 * 1000);
      } else if (filterPeriod === 'BULANAN') {
        matchPeriod = targetDateStr.substring(0, 7) === refDateStr.substring(0, 7);
      } else if (filterPeriod === 'SEMESTER') {
        const tDate = new Date(targetDateStr);
        const rDate = new Date(refDateStr);
        const tYear = tDate.getFullYear();
        const rYear = rDate.getFullYear();
        const tSem = tDate.getMonth() >= 6 ? 1 : 2;
        const rSem = rDate.getMonth() >= 6 ? 1 : 2;
        matchPeriod = tYear === rYear && tSem === rSem;
      } else if (filterPeriod === 'SEMUA') {
        if (filterDate) {
          matchPeriod = targetDateStr === filterDate;
        }
      }

      return matchAcademicYear && matchClass && matchStatus && matchPeriod && matchSearch;
    });
  }, [attendance, studentsMap, filterAcademicYear, academicYears, filterClass, filterStatus, searchLog, filterPeriod, filterDate]);

  // Paginated attendance for UI table
  const paginatedAttendance = useMemo(() => {
    if (logPageSize <= 0) return filteredAttendance;
    const start = (logPage - 1) * logPageSize;
    return filteredAttendance.slice(start, start + logPageSize);
  }, [filteredAttendance, logPage, logPageSize]);

  const totalLogPages = useMemo(() => {
    if (logPageSize <= 0) return 1;
    return Math.max(1, Math.ceil(filteredAttendance.length / logPageSize));
  }, [filteredAttendance.length, logPageSize]);

  // Single-pass Attendance Counts Map O(N)
  const attendanceCountMap = useMemo(() => {
    const map = new Map<string, { H: number; T: number; I: number; S: number; A: number }>();
    for (const l of filteredAttendance) {
      const studentObj = (l.studentId && studentsMap.byId.get(l.studentId)) || (l.nisn && studentsMap.byNisn.get(l.nisn));
      const primaryKey = studentObj?.id || l.studentId || l.nisn;
      if (!primaryKey) continue;

      let entry = map.get(primaryKey);
      if (!entry) {
        entry = { H: 0, T: 0, I: 0, S: 0, A: 0 };
        map.set(primaryKey, entry);
        if (studentObj?.nisn && studentObj.nisn !== primaryKey) {
          map.set(studentObj.nisn, entry);
        }
        if (l.nisn && l.nisn !== primaryKey) {
          map.set(l.nisn, entry);
        }
      }
      if (l.status === 'Hadir') entry.H++;
      else if (l.status === 'Terlambat') entry.T++;
      else if (l.status === 'Izin') entry.I++;
      else if (l.status === 'Sakit') entry.S++;
      else if (l.status === 'Alpa') entry.A++;
    }
    return map;
  }, [filteredAttendance, studentsMap]);

  // Distinct meeting dates from filtered attendance (ordered chronologically)
  const meetingDates = useMemo(() => {
    const set = new Set<string>();
    filteredAttendance.forEach(a => {
      if (a.date) set.add(a.date);
    });
    return Array.from(set).sort();
  }, [filteredAttendance]);

  // Fast Lookup map: `${studentIdOrNisn}_${date}` -> AttendanceRecord
  const studentAttendanceByDateMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const a of filteredAttendance) {
      if (!a.date) continue;
      if (a.studentId) {
        map.set(`${a.studentId}_${a.date}`, a);
      }
      if (a.nisn) {
        map.set(`${a.nisn}_${a.date}`, a);
      }
    }
    return map;
  }, [filteredAttendance]);

  // Meeting column summary statistics (H, T, S, I, A, total, % per meeting)
  const meetingSummaryStats = useMemo(() => {
    return meetingDates.map(date => {
      let h = 0;
      let t = 0;
      let i = 0;
      let s = 0;
      let a = 0;
      filteredAttendance.forEach(att => {
        if (att.date === date) {
          if (att.status === 'Hadir') h++;
          else if (att.status === 'Terlambat') t++;
          else if (att.status === 'Izin') i++;
          else if (att.status === 'Sakit') s++;
          else if (att.status === 'Alpa') a++;
        }
      });
      const physical = h + t;
      const total = h + t + i + s + a;
      const rate = total > 0 ? Math.round((physical / total) * 100) : 0;
      return { date, h, t, i, s, a, physical, total, rate };
    });
  }, [meetingDates, filteredAttendance]);

  // Summary Statistics Metrics
  const totalLogs = filteredAttendance.length;
  const totalHadir = filteredAttendance.filter(l => l.status === 'Hadir').length;
  const totalTerlambat = filteredAttendance.filter(l => l.status === 'Terlambat').length;
  const totalIzin = filteredAttendance.filter(l => l.status === 'Izin').length;
  const totalSakit = filteredAttendance.filter(l => l.status === 'Sakit').length;
  const totalAlpa = filteredAttendance.filter(l => l.status === 'Alpa').length;
  const totalHadirFisik = totalHadir + totalTerlambat;

  const hadirPercentage = totalLogs > 0 ? Math.round((totalHadirFisik / totalLogs) * 100) : 0;
  const onTimePercentage = totalHadirFisik > 0 ? Math.round((totalHadir / totalHadirFisik) * 100) : 0;

  // Breakdown statistics per class (using student's current class)
  const classBreakdown = useMemo(() => {
    const map: Record<string, { total: number; hadir: number; terlambat: number; izin: number; sakit: number; alpa: number }> = {};
    
    filteredAttendance.forEach(rec => {
      const studentObj = (rec.studentId && studentsMap.byId.get(rec.studentId)) || 
                         (rec.nisn && studentsMap.byNisn.get(rec.nisn));
      const targetClass = studentObj ? studentObj.class : rec.class;

      if (!map[targetClass]) {
        map[targetClass] = { total: 0, hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpa: 0 };
      }
      map[targetClass].total++;
      if (rec.status === 'Hadir') map[targetClass].hadir++;
      else if (rec.status === 'Terlambat') map[targetClass].terlambat++;
      else if (rec.status === 'Izin') map[targetClass].izin++;
      else if (rec.status === 'Sakit') map[targetClass].sakit++;
      else if (rec.status === 'Alpa') map[targetClass].alpa++;
    });

    return Object.entries(map).map(([className, stats]) => {
      const hadirAll = stats.hadir + stats.terlambat;
      const rate = stats.total > 0 ? Math.round((hadirAll / stats.total) * 100) : 0;
      return {
        className,
        ...stats,
        hadirAll,
        rate
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [filteredAttendance, studentsMap]);

  // Student-level attendance recap stats (H, T, I, S, A) with Jenis Kelamin - O(N) optimized
  const studentRecapStats = useMemo(() => {
    let targetStudents = students;
    if (filterClass !== 'SEMUA') {
      targetStudents = students.filter(s => s.class === filterClass);
    }
    if (targetStudents.length === 0) {
      const uniqueStudentsMap = new Map<string, { id: string; name: string; nisn: string; class: string; gender?: 'L' | 'P' }>();
      filteredAttendance.forEach(a => {
        if (!uniqueStudentsMap.has(a.nisn)) {
          const stObj = (a.nisn && studentsMap.byNisn.get(a.nisn)) || (a.studentId && studentsMap.byId.get(a.studentId));
          uniqueStudentsMap.set(a.nisn, {
            id: a.studentId,
            name: stObj?.name || a.studentName,
            nisn: a.nisn,
            class: stObj?.class || a.class,
            gender: stObj?.gender
          });
        }
      });
      targetStudents = Array.from(uniqueStudentsMap.values()) as any;
    }

    const list = targetStudents.map(st => {
      const counts = (st.id && attendanceCountMap.get(st.id)) || 
                     (st.nisn && attendanceCountMap.get(st.nisn)) || 
                     { H: 0, T: 0, I: 0, S: 0, A: 0 };
      const countH = counts.H;
      const countT = counts.T;
      const countI = counts.I;
      const countS = counts.S;
      const countA = counts.A;
      const totalHadirFisik = countH + countT;
      const totalRecorded = countH + countT + countI + countS + countA;
      const rate = totalRecorded > 0 ? Math.round((totalHadirFisik / totalRecorded) * 100) : 0;
      return {
        ...st,
        countH,
        countT,
        countI,
        countS,
        countA,
        totalHadirFisik,
        totalRecorded,
        rate
      };
    });

    return list.sort((a, b) => {
      if (a.class !== b.class) return (a.class || '').localeCompare(b.class || '', 'id', { numeric: true });
      return (a.name || '').localeCompare(b.name || '', 'id');
    });
  }, [students, filteredAttendance, filterClass, studentsMap, attendanceCountMap]);

  // Search filter for Rekapitulasi Siswa
  const filteredStudentRecapStats = useMemo(() => {
    if (!searchRekap.trim()) return studentRecapStats;
    const q = searchRekap.toLowerCase();
    return studentRecapStats.filter(st =>
      (st.name || '').toLowerCase().includes(q) ||
      (st.nisn || '').toLowerCase().includes(q) ||
      (st.class || '').toLowerCase().includes(q)
    );
  }, [studentRecapStats, searchRekap]);

  const totalRecapPages = Math.ceil(filteredStudentRecapStats.length / rekapPageSize) || 1;
  const paginatedStudentRecap = useMemo(() => {
    const start = (rekapPage - 1) * rekapPageSize;
    return filteredStudentRecapStats.slice(start, start + rekapPageSize);
  }, [filteredStudentRecapStats, rekapPage, rekapPageSize]);

  const getAcademicYearLabel = () => {
    if (filterAcademicYear === 'SEMUA') {
      return activeAcademicYear ? `TA ${activeAcademicYear.name} (Aktif)` : 'Semua Tahun Ajaran';
    }
    const ay = academicYears.find(a => a.id === filterAcademicYear);
    return ay ? `TA ${ay.name} (Sem ${ay.semester.charAt(0)})` : 'Tahun Ajaran';
  };

  const getPeriodLabelText = () => {
    const refStr = filterDate || 'Hari ini';
    switch (filterPeriod) {
      case 'HARIAN': return `Harian (${refStr})`;
      case 'MINGGUAN': return `Mingguan (7 Hari dari ${refStr})`;
      case 'BULANAN': return `Bulanan (${filterDate ? filterDate.substring(0, 7) : 'Bulan Ini'})`;
      case 'SEMESTER': return `Semester (${filterDate ? filterDate.substring(0, 4) : 'Tahun Ini'})`;
      default: return 'Semua Periode';
    }
  };

  // Find matching journal for current filterDate
  const matchingJournalForFilterDate = useMemo(() => {
    if (!filterDate) return null;
    const cleanD = cleanDateFormat(filterDate);
    const targetC = (filterClass || 'SEMUA').toLowerCase();
    return journals.find(j => cleanDateFormat(j.date) === cleanD && (filterClass === 'SEMUA' || (j?.kelas && j.kelas.toLowerCase() === targetC)));
  }, [journals, filterDate, filterClass]);

  const isJournalNonKbm = useMemo(() => {
    if (!matchingJournalForFilterDate) return false;
    const text = `${matchingJournalForFilterDate.materi || ''} ${matchingJournalForFilterDate.metode || ''} ${matchingJournalForFilterDate.catatan || ''}`.toLowerCase();
    return text.includes('libur') || text.includes('tidak ada kbm') || text.includes('non-kbm') || text.includes('kegiatan sekolah') || text.includes('classmeeting') || text.includes('upacara') || text.includes('mandiri');
  }, [matchingJournalForFilterDate]);

  // Clean-up Tool Memos (Submenu 3)
  const matchingCleanupAttendance = useMemo(() => {
    if (!cleanupDate) return [];
    const cleanD = cleanDateFormat(cleanupDate);
    const targetCleanup = (cleanupClass || 'SEMUA').toLowerCase();
    return attendance.filter(a => {
      const matchD = cleanDateFormat(a.date) === cleanD;
      const matchC = cleanupClass === 'SEMUA' || (a?.class && a.class.toLowerCase() === targetCleanup);
      return matchD && matchC;
    });
  }, [attendance, cleanupDate, cleanupClass]);

  const matchingCleanupJournal = useMemo(() => {
    if (!cleanupDate) return null;
    const cleanD = cleanDateFormat(cleanupDate);
    const targetCleanup = (cleanupClass || 'SEMUA').toLowerCase();
    return journals.find(j => cleanDateFormat(j.date) === cleanD && (cleanupClass === 'SEMUA' || (j?.kelas && j.kelas.toLowerCase() === targetCleanup)));
  }, [journals, cleanupDate, cleanupClass]);

  const handlePrintReport = () => {
    // 1. Gather target students according to class filter
    let targetStudents = students;
    if (filterClass !== 'SEMUA') {
      targetStudents = students.filter(s => s.class === filterClass);
    }
    
    // Fallback: if students list in context is empty, extract from filteredAttendance
    if (targetStudents.length === 0) {
      const uniqueStudentsMap = new Map<string, { id: string; name: string; nisn: string; class: string; gender?: 'L' | 'P' }>();
      filteredAttendance.forEach(a => {
        if (!uniqueStudentsMap.has(a.nisn || a.studentId)) {
          const stObj = students.find(s => (s.nisn && s.nisn === a.nisn) || (s.id && s.id === a.studentId));
          uniqueStudentsMap.set(a.nisn || a.studentId, {
            id: a.studentId,
            name: stObj?.name || a.studentName,
            nisn: a.nisn,
            class: stObj?.class || a.class,
            gender: stObj?.gender
          });
        }
      });
      targetStudents = Array.from(uniqueStudentsMap.values()) as any;
    }

    if (targetStudents.length === 0 && filteredAttendance.length === 0) {
      showToast('Tidak ada data presensi atau siswa untuk dicetak.', 'warning');
      return;
    }

    // Sort students by class then by name
    targetStudents = [...targetStudents].sort((a, b) => {
      if (a.class !== b.class) return (a.class || '').localeCompare(b.class || '', 'id', { numeric: true });
      return (a.name || '').localeCompare(b.name || '', 'id');
    });

    const schoolName = settings.sekolah || 'SEKOLAH DIGITAL';
    const schoolAddress = settings.alamat || '';
    const teacherName = settings.namaGuru || 'Guru Pengampu';
    const teacherNip = settings.nip ? `NIP: ${settings.nip}` : '';
    const teacherTtdUrl = settings.ttdGuruUrl || '';
    const principalName = settings.namaKepalaSekolah || 'Drs. H. Ahmad Dahlan, M.Pd';
    const principalNip = settings.nipKepalaSekolah ? `NIP: ${settings.nipKepalaSekolah}` : 'NIP: 19700101 199503 1 001';
    const principalTitle = settings.jabatanKepalaSekolah || 'Kepala Sekolah';
    const principalTtdUrl = settings.ttdKepalaSekolahUrl || '';
    const citySign = settings.kotaTandaTangan || 'Bula';
    const periodText = getPeriodLabelText();
    const ayText = getAcademicYearLabel();
    const classText = filterClass === 'SEMUA' ? 'Semua Kelas' : `Kelas ${filterClass}`;
    const currentDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let grandTotalH = 0;
    let grandTotalT = 0;
    let grandTotalI = 0;
    let grandTotalS = 0;
    let grandTotalA = 0;

    const hasMeetings = meetingDates.length > 0;
    const pageOrientation = hasMeetings ? 'landscape' : 'portrait';

    const tableRowsHtml = targetStudents.map((student, idx) => {
      // Find matching attendance counts in O(1)
      const counts = (student.id && attendanceCountMap.get(student.id)) || 
                     (student.nisn && attendanceCountMap.get(student.nisn)) || 
                     { H: 0, T: 0, I: 0, S: 0, A: 0 };
      
      const countH = counts.H;
      const countT = counts.T;
      const countI = counts.I;
      const countS = counts.S;
      const countA = counts.A;

      const totalHadirFisik = countH + countT;
      const totalRec = countH + countT + countI + countS + countA;
      const percentage = totalRec > 0 ? Math.round((totalHadirFisik / totalRec) * 100) : 0;
      const genderLabel = student.gender ? student.gender : '-';

      grandTotalH += countH;
      grandTotalT += countT;
      grandTotalI += countI;
      grandTotalS += countS;
      grandTotalA += countA;

      const meetingCellsHtml = hasMeetings ? meetingDates.map(d => {
        const rec = studentAttendanceByDateMap.get(`${student.id}_${d}`) || studentAttendanceByDateMap.get(`${student.nisn}_${d}`);
        let code = '-';
        let bg = 'transparent';
        let color = '#94a3b8';
        if (rec) {
          if (rec.status === 'Hadir') { code = 'H'; bg = '#dcfce7'; color = '#15803d'; }
          else if (rec.status === 'Terlambat') { code = 'T'; bg = '#fef3c7'; color = '#b45309'; }
          else if (rec.status === 'Izin') { code = 'I'; bg = '#e0f2fe'; color = '#0369a1'; }
          else if (rec.status === 'Sakit') { code = 'S'; bg = '#f3e8ff'; color = '#7e22ce'; }
          else if (rec.status === 'Alpa') { code = 'A'; bg = '#ffe4e6'; color = '#be123c'; }
        }
        return `<td style="padding: 4px 1px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; font-size: 8.5px; background: ${bg}; color: ${color};">${code}</td>`;
      }).join('') : '';

      return `
        <tr style="border-bottom: 1px solid #cbd5e1; font-size: 10.5px;">
          <td style="padding: 5px 2px; text-align: center; border: 1px solid #cbd5e1;">${idx + 1}</td>
          <td style="padding: 5px 4px; font-family: monospace; text-align: center; border: 1px solid #cbd5e1; font-size: 9.5px;">${student.nisn || '-'}</td>
          <td style="padding: 5px 6px; font-weight: bold; border: 1px solid #cbd5e1; text-align: left; white-space: nowrap;">${student.name}</td>
          <td style="padding: 5px 2px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">${genderLabel}</td>
          <td style="padding: 5px 2px; text-align: center; border: 1px solid #cbd5e1; font-weight: 600;">${student.class}</td>
          ${meetingCellsHtml}
          <td style="padding: 5px 3px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #166534; background: ${countH > 0 ? '#f0fdf4' : 'transparent'};">${countH}</td>
          <td style="padding: 5px 3px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #92400e; background: ${countT > 0 ? '#fffbeb' : 'transparent'};">${countT}</td>
          <td style="padding: 5px 3px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #7e22ce; background: ${countS > 0 ? '#faf5ff' : 'transparent'};">${countS}</td>
          <td style="padding: 5px 3px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #0369a1; background: ${countI > 0 ? '#f0f9ff' : 'transparent'};">${countI}</td>
          <td style="padding: 5px 3px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #be123c; background: ${countA > 0 ? '#fff1f2' : 'transparent'};">${countA}</td>
          <td style="padding: 5px 3px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; background: #f8fafc;">${totalHadirFisik}</td>
          <td style="padding: 5px 4px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: ${percentage >= 85 ? '#166534' : percentage >= 70 ? '#92400e' : '#be123c'};">${percentage}%</td>
        </tr>
      `;
    }).join('');

    const grandTotalRecorded = grandTotalH + grandTotalT + grandTotalI + grandTotalS + grandTotalA;
    const grandTotalHadirFisik = grandTotalH + grandTotalT;
    const overallRate = grandTotalRecorded > 0 ? Math.round((grandTotalHadirFisik / grandTotalRecorded) * 100) : 0;

    const kopHtml = generateOfficialKopHtml(settings, {
      marginBottom: '10px',
      textColor: '#0f172a'
    });

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Laporan Rekapitulasi Kehadiran - ${schoolName}</title>
          <style>
            @page { size: A4 ${pageOrientation}; margin: ${hasMeetings ? '8mm 10mm' : '10mm 12mm'}; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 8px; font-size: 10px; }
            .report-title-container { text-align: center; margin: 4px 0 8px 0; }
            .report-title-container h2 { margin: 0; font-size: 13.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; text-decoration: underline; }
            .report-title-container p { margin: 2px 0 0 0; font-size: 9.5px; color: #475569; }
            .meta-grid { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 10px; border-radius: 6px; margin-bottom: 8px; font-size: 10px; }
            .meta-item { display: inline-block; margin-right: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 4px; }
            th { background-color: #f1f5f9; border: 1px solid #94a3b8; padding: 4px 2px; text-align: center; font-size: 9px; text-transform: uppercase; color: #1e293b; font-weight: bold; }
            td { border: 1px solid #cbd5e1; }
            .legend { margin-top: 8px; font-size: 9px; color: #475569; display: flex; justify-content: space-between; align-items: center; border: 1px dashed #cbd5e1; padding: 5px 8px; border-radius: 4px; background: #fafafa; }
            .signatures { display: flex; justify-content: space-between; margin-top: 24px; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 220px; font-size: 10.5px; }
            .sig-space { height: 45px; }
            @media print {
              body { padding: 0; }
              @page { margin: 8mm; }
            }
          </style>
        </head>
        <body>
          ${kopHtml}

          <div class="report-title-container">
            <h2>LAPORAN REKAPITULASI PRESENSI ADMINISTRASI KBM</h2>
            <p>Rincian Kehadiran Per Pertemuan & Akumulasi H, T, S, I, A serta Persentase Kehadiran</p>
          </div>

          <div class="meta-grid">
            <div>
              <span class="meta-item"><strong>Tahun Ajaran:</strong> ${ayText}</span>
              <span class="meta-item"><strong>Kelas:</strong> ${classText}</span>
              <span class="meta-item"><strong>Periode:</strong> ${periodText}</span>
              ${hasMeetings ? `<span class="meta-item"><strong>Total Pertemuan:</strong> ${meetingDates.length} Pertemuan</span>` : ''}
            </div>
            <div>
              <strong>Total Siswa:</strong> ${targetStudents.length} siswa
            </div>
          </div>

          <table>
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th rowspan="2" style="width: 24px;">No</th>
                <th rowspan="2" style="width: 75px;">NISN</th>
                <th rowspan="2" style="text-align: left; min-width: 140px; padding-left: 6px;">Nama Lengkap Siswa</th>
                <th rowspan="2" style="width: 28px;">L/P</th>
                <th rowspan="2" style="width: 42px;">Kelas</th>
                ${hasMeetings ? `<th colspan="${meetingDates.length}" style="background: #e2e8f0; font-size: 9px;">Rincian Pertemuan / Tanggal Ke-</th>` : ''}
                <th colspan="5" style="background: #cbd5e1; font-size: 9px;">Rekapitulasi</th>
                <th rowspan="2" style="width: 42px;">Total<br/>Hadir</th>
                <th rowspan="2" style="width: 42px;">%<br/>Keh</th>
              </tr>
              <tr style="background-color: #f8fafc;">
                ${hasMeetings ? meetingDates.map((d, dIdx) => {
                  const parts = d.split('-');
                  const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
                  return `<th style="font-size: 7.5px; padding: 3px 1px; min-width: 22px;" title="${d}">P${dIdx + 1}<br/><span style="font-size: 7px; font-weight: normal; color: #475569;">${shortDate}</span></th>`;
                }).join('') : ''}
                <th style="width: 26px; color: #166534; background: #dcfce7; font-size: 8.5px;" title="Hadir">H</th>
                <th style="width: 26px; color: #92400e; background: #fef3c7; font-size: 8.5px;" title="Terlambat">T</th>
                <th style="width: 26px; color: #7e22ce; background: #f3e8ff; font-size: 8.5px;" title="Sakit">S</th>
                <th style="width: 26px; color: #0369a1; background: #e0f2fe; font-size: 8.5px;" title="Izin">I</th>
                <th style="width: 26px; color: #be123c; background: #ffe4e6; font-size: 8.5px;" title="Alpa">A</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a; font-size: 9.5px;">
                <td colspan="5" style="text-align: center; padding: 5px; border: 1px solid #94a3b8;">JUMLAH HADIR FISIK (H + T)</td>
                ${hasMeetings ? meetingDates.map((_, mIdx) => {
                  const ms = meetingSummaryStats[mIdx];
                  return `<td style="text-align: center; padding: 4px 1px; border: 1px solid #94a3b8; font-size: 8px; background: #f8fafc; color: #166534;">${ms ? ms.physical : 0}</td>`;
                }).join('') : ''}
                <td style="text-align: center; padding: 5px 2px; border: 1px solid #94a3b8; color: #166534; background: #dcfce7;">${grandTotalH}</td>
                <td style="text-align: center; padding: 5px 2px; border: 1px solid #94a3b8; color: #92400e; background: #fef3c7;">${grandTotalT}</td>
                <td style="text-align: center; padding: 5px 2px; border: 1px solid #94a3b8; color: #7e22ce; background: #f3e8ff;">${grandTotalS}</td>
                <td style="text-align: center; padding: 5px 2px; border: 1px solid #94a3b8; color: #0369a1; background: #e0f2fe;">${grandTotalI}</td>
                <td style="text-align: center; padding: 5px 2px; border: 1px solid #94a3b8; color: #be123c; background: #ffe4e6;">${grandTotalA}</td>
                <td style="text-align: center; padding: 5px 2px; border: 1px solid #94a3b8; background: #f1f5f9;">${grandTotalHadirFisik}</td>
                <td style="text-align: center; padding: 5px 2px; border: 1px solid #94a3b8; color: #0f172a; font-weight: 800;">${overallRate}%</td>
              </tr>
            </tfoot>
          </table>

          <div class="legend">
            <div>
              <strong>Keterangan Status:</strong> 
              <span style="color: #166534; font-weight: bold;">H</span>: Hadir Tepat Waktu | 
              <span style="color: #92400e; font-weight: bold;">T</span>: Terlambat | 
              <span style="color: #7e22ce; font-weight: bold;">S</span>: Sakit | 
              <span style="color: #0369a1; font-weight: bold;">I</span>: Izin | 
              <span style="color: #be123c; font-weight: bold;">A</span>: Alpa / Tanpa Keterangan
            </div>
            <div>
              <strong>Rumus Kehadiran:</strong> % = ((H + T) / Total Pertemuan) × 100% | <strong>Jenis Kelamin:</strong> L: Laki-laki, P: Perempuan
            </div>
          </div>

          <div class="signatures">
            <div class="sig-box">
              <p>Mengetahui,</p>
              <p><strong>${principalTitle}</strong></p>
              ${principalTtdUrl ? `<div class="sig-space" style="display:flex;align-items:center;justify-content:center;"><img src="${principalTtdUrl}" style="max-height:45px;max-width:140px;object-fit:contain;margin:0 auto;" /></div>` : `<div class="sig-space"></div>`}
              <p><strong><u>${principalName}</u></strong></p>
              <p style="font-size:9.5px; margin-top:2px; color:#475569;">${principalNip}</p>
            </div>
            <div class="sig-box">
              <p>${citySign}, ${currentDate}</p>
              <p><strong>Guru Pengampu / Wali Kelas</strong></p>
              ${teacherTtdUrl ? `<div class="sig-space" style="display:flex;align-items:center;justify-content:center;"><img src="${teacherTtdUrl}" style="max-height:45px;max-width:140px;object-fit:contain;margin:0 auto;" /></div>` : `<div class="sig-space"></div>`}
              <p><strong><u>${teacherName}</u></strong></p>
              ${teacherNip ? `<p style="font-size:9.5px; margin-top:2px; color:#475569;">${teacherNip}</p>` : ''}
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    printHtmlDocument(reportHtml, `Laporan Rekapitulasi Kehadiran - ${schoolName}`);
  };

  const exportFilteredCSV = () => {
    let targetStudents = students;
    if (filterClass !== 'SEMUA') {
      targetStudents = students.filter(s => s.class === filterClass);
    }
    if (targetStudents.length === 0) {
      const uniqueStudentsMap = new Map<string, { id: string; name: string; nisn: string; class: string; gender?: 'L' | 'P' }>();
      filteredAttendance.forEach(a => {
        if (!uniqueStudentsMap.has(a.nisn || a.studentId)) {
          const stObj = students.find(s => (s.nisn && s.nisn === a.nisn) || (s.id && s.id === a.studentId));
          uniqueStudentsMap.set(a.nisn || a.studentId, {
            id: a.studentId,
            name: stObj?.name || a.studentName,
            nisn: a.nisn,
            class: stObj?.class || a.class,
            gender: stObj?.gender
          });
        }
      });
      targetStudents = Array.from(uniqueStudentsMap.values()) as any;
    }

    if (targetStudents.length === 0) {
      showToast('Tidak ada data untuk diekspor.', 'warning');
      return;
    }

    targetStudents = [...targetStudents].sort((a, b) => {
      if (a.class !== b.class) return (a.class || '').localeCompare(b.class || '', 'id', { numeric: true });
      return (a.name || '').localeCompare(b.name || '', 'id');
    });

    const meetingHeaders = meetingDates.map((d, i) => `P${i + 1} (${d})`);
    const headers = [
      'No', 
      'NISN', 
      'Nama Siswa', 
      'Jenis Kelamin', 
      'Kelas', 
      ...meetingHeaders, 
      'Hadir (H)', 
      'Terlambat (T)', 
      'Sakit (S)', 
      'Izin (I)', 
      'Alpa (A)', 
      'Total Hadir Fisik', 
      'Persentase Kehadiran (%)'
    ];

    const rows = targetStudents.map((student, idx) => {
      const counts = (student.id && attendanceCountMap.get(student.id)) || 
                     (student.nisn && attendanceCountMap.get(student.nisn)) || 
                     { H: 0, T: 0, I: 0, S: 0, A: 0 };
      const countH = counts.H;
      const countT = counts.T;
      const countI = counts.I;
      const countS = counts.S;
      const countA = counts.A;
      const totalHadirFisik = countH + countT;
      const totalRec = countH + countT + countI + countS + countA;
      const percentage = totalRec > 0 ? Math.round((totalHadirFisik / totalRec) * 100) : 0;
      const gender = student.gender ? student.gender : '-';

      const meetingStatuses = meetingDates.map(d => {
        const rec = studentAttendanceByDateMap.get(`${student.id}_${d}`) || studentAttendanceByDateMap.get(`${student.nisn}_${d}`);
        return rec ? (rec.status === 'Hadir' ? 'H' : rec.status === 'Terlambat' ? 'T' : rec.status === 'Sakit' ? 'S' : rec.status === 'Izin' ? 'I' : 'A') : '-';
      });

      return [
        idx + 1,
        `"${student.nisn || ''}"`,
        `"${student.name}"`,
        `"${gender}"`,
        `"${student.class}"`,
        ...meetingStatuses.map(s => `"${s}"`),
        countH,
        countT,
        countS,
        countI,
        countA,
        totalHadirFisik,
        `"${percentage}%"`
      ];
    });

    const periodLabel = filterPeriod === 'SEMUA' ? 'Semua_Periode' : filterPeriod;
    const classLabel = filterClass === 'SEMUA' ? 'Semua_Kelas' : `Kelas_${filterClass}`;

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Kehadiran_${classLabel}_${periodLabel}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Submenu Navigation Header */}
      <SubNavHeader
        currentTab="Riwayat"
        activeSubTab={activeSubTab}
        onSelectSubTab={(id) => setActiveSubTab('Riwayat', id)}
        badgeCounts={{
          'log-presensi': `${filteredAttendance.length} Log`,
          'rekap-statistik': `${hadirPercentage}% Hadir`,
          'kelola-koreksi': 'Koreksi'
        }}
        extraActions={
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReport}
              disabled={filteredAttendance.length === 0}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cetak Rekap</span>
            </button>
            <button
              onClick={exportFilteredCSV}
              disabled={filteredAttendance.length === 0}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh CSV</span>
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
          {/* SUBMENU 1: LOG PRESENSI LENGKAP & RIWAYAT SCAN                            */}
          {/* ========================================================================= */}
          {activeSubTab === 'log-presensi' && (
            <div className="space-y-6">
          
          {/* Grid Pemilihan Kelas Log Presensi */}
          <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-3 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pilih Kelas Presensi:</h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Filter log catatan presensi berdasarkan rombel / seluruh kelas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
              {/* Pilihan: Semua Kelas */}
              <button
                type="button"
                onClick={() => {
                  setFilterClass('SEMUA');
                  setLogPage(1);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  filterClass === 'SEMUA'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/40 scale-[1.02]'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs">Semua Kelas</span>
                  {filterClass === 'SEMUA' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className={`text-[10px] font-mono ${filterClass === 'SEMUA' ? 'text-slate-950 font-bold' : 'text-slate-500'}`}>
                  {students.length} Siswa Total
                </div>
              </button>

              {/* Pilihan: Masing-masing Kelas */}
              {Array.from(new Set(students.map(s => s.class).filter(Boolean))).sort().map(cls => {
                const count = students.filter(s => s.class === cls).length;
                const isSelected = filterClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => {
                      setFilterClass(cls);
                      setLogPage(1);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/40 scale-[1.02]'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs">Kelas {cls}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className={`text-[10px] font-mono ${isSelected ? 'text-slate-950 font-bold' : 'text-slate-500'}`}>
                      {count} Siswa
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter & Sort Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-3xl border border-slate-800">
            
            {/* Academic Year Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2">
              <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="w-full">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">1. Tahun Ajaran</label>
                <select
                  value={filterAcademicYear}
                  onChange={(e) => {
                    setFilterAcademicYear(e.target.value);
                    setLogPage(1);
                  }}
                  className="w-full bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="SEMUA" className="bg-slate-900 text-white">Semua TA</option>
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.id} className="bg-slate-900 text-white">
                      TA {ay.name} (Sem {ay.semester.charAt(0)}) {ay.isCurrent ? '⭐' : ay.isArchived ? '📦' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Period Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2">
              <CalendarDays className="w-4 h-4 text-teal-400 shrink-0" />
              <div className="w-full">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">2. Periode</label>
                <select
                  value={filterPeriod}
                  onChange={(e) => {
                    setFilterPeriod(e.target.value as any);
                    setLogPage(1);
                  }}
                  className="w-full bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="SEMUA" className="bg-slate-900 text-white">Semua Periode</option>
                  <option value="HARIAN" className="bg-slate-900 text-white">Harian (Per Hari)</option>
                  <option value="MINGGUAN" className="bg-slate-900 text-white">Mingguan (7 Hari)</option>
                  <option value="BULANAN" className="bg-slate-900 text-white">Bulanan (Per Bulan)</option>
                  <option value="SEMESTER" className="bg-slate-900 text-white">Semester (6 Bulan)</option>
                </select>
              </div>
            </div>

            {/* Reference Date Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="w-full">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">3. Tanggal Acuan</label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      setLogPage(1);
                    }}
                    className="w-full bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
                  />
                  {filterDate && (
                    <button
                      onClick={() => {
                        setFilterDate('');
                        setLogPage(1);
                      }}
                      title="Reset Tanggal"
                      className="text-[10px] text-slate-400 hover:text-rose-400 font-bold px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2">
              <Filter className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="w-full">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">4. Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setLogPage(1);
                  }}
                  className="w-full bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="SEMUA" className="bg-slate-900 text-white">Semua Status</option>
                  <option value="Hadir" className="bg-slate-900 text-emerald-400">Hadir</option>
                  <option value="Terlambat" className="bg-slate-900 text-amber-400">Terlambat</option>
                  <option value="Izin" className="bg-slate-900 text-sky-400">Izin</option>
                  <option value="Sakit" className="bg-slate-900 text-purple-400">Sakit</option>
                  <option value="Alpa" className="bg-slate-900 text-rose-400">Alpa</option>
                </select>
              </div>
            </div>

          </div>

          {/* Search bar inside Log view */}
          <div className="flex items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama siswa, NISN, atau keterangan catatan..."
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono shrink-0">
              Menampilkan <span className="text-white font-bold">{filteredAttendance.length}</span> catatan
            </div>
          </div>

          {/* Smart Journal Non-KBM Notice Banner */}
          {matchingJournalForFilterDate && (
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
              isJournalNonKbm 
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' 
                : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
            }`}>
              <div className="flex items-start gap-2.5">
                <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isJournalNonKbm ? 'text-amber-400' : 'text-indigo-400'}`} />
                <div>
                  <p className="text-xs font-bold">
                    Catatan Jurnal Mengajar ({cleanDateFormat(filterDate)}, Kelas {matchingJournalForFilterDate.kelas}): <span className="underline italic">"{matchingJournalForFilterDate.materi}"</span>
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {isJournalNonKbm ? (
                      <span>Agenda pada jurnal tercatat <strong>Tidak Ada KBM / Libur / Kegiatan Non-KBM</strong>, namun saat ini terdeteksi <strong>{filteredAttendance.length} log presensi siswa</strong> pada tanggal ini.</span>
                    ) : (
                      <span>Rekap presensi di jurnal: {matchingJournalForFilterDate.siswaTidakHadirKet || 'Hadir Lengkap'}.</span>
                    )}
                  </p>
                </div>
              </div>
              {isJournalNonKbm && filteredAttendance.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setClearBatchModal({
                      isOpen: true,
                      date: filterDate,
                      class: filterClass,
                      count: filteredAttendance.length,
                      title: `Kosongkan Presensi (${cleanDateFormat(filterDate)})`,
                      subtitle: `Apakah Anda yakin ingin mengosongkan seluruh ${filteredAttendance.length} catatan presensi pada tanggal ${filterDate} untuk ${filterClass !== 'SEMUA' ? `kelas ${filterClass}` : 'seluruh kelas'}? Log presensi akan dihapus dan rekap jurnal akan disinkronkan.`
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan Presensi Hari Ini</span>
                </button>
              )}
            </div>
          )}

          {/* History Log Table */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="p-4">Tanggal & Jam</th>
                    <th className="p-4">Nama Siswa</th>
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
                        Belum ada riwayat presensi yang sesuai dengan kriteria filter ({filterClass}, {getPeriodLabelText()}).
                      </td>
                    </tr>
                  ) : (
                    paginatedAttendance.map(log => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono">
                          <p className="font-bold text-white">{cleanDateFormat(log.date)}</p>
                          <p className="text-[11px] text-emerald-400 font-mono">{cleanTimeFormat(log.time)}</p>
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
                            <option value="Hadir" className="bg-slate-900 text-emerald-400">Hadir</option>
                            <option value="Terlambat" className="bg-slate-900 text-amber-400">Terlambat</option>
                            <option value="Izin" className="bg-slate-900 text-sky-400">Izin</option>
                            <option value="Sakit" className="bg-slate-900 text-purple-400">Sakit</option>
                            <option value="Alpa" className="bg-slate-900 text-rose-400">Alpa</option>
                          </select>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                {log.method}
                              </span>
                              {log.isOfflineQueued && (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                                  <WifiOff className="w-2.5 h-2.5" /> Antrean Offline
                                </span>
                              )}
                            </div>
                            {log.note && (
                              <p className="text-xs text-slate-300 italic mt-1">{log.note}</p>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            <button
                              onClick={() => openEditModal(log)}
                              title="Edit Riwayat Presensi"
                              className="p-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setDeletingRecord(log)}
                              title="Hapus Log Presensi"
                              className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls for Log Presensi */}
            {filteredAttendance.length > 0 && (
              <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <span>Tampilkan:</span>
                  <select
                    value={logPageSize}
                    onChange={(e) => {
                      setLogPageSize(Number(e.target.value));
                      setLogPage(1);
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value={15}>15 baris</option>
                    <option value={25}>25 baris</option>
                    <option value={50}>50 baris</option>
                    <option value={100}>100 baris</option>
                    <option value={-1}>Semua ({filteredAttendance.length})</option>
                  </select>
                  <span className="text-slate-500">
                    Menampilkan {logPageSize <= 0 ? filteredAttendance.length : Math.min(filteredAttendance.length, (logPage - 1) * logPageSize + 1)} - {logPageSize <= 0 ? filteredAttendance.length : Math.min(filteredAttendance.length, logPage * logPageSize)} dari {filteredAttendance.length} catatan
                  </span>
                </div>

                {logPageSize > 0 && totalLogPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={logPage <= 1}
                      onClick={() => setLogPage(p => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono px-2 text-slate-300 font-semibold">
                      Hal {logPage} dari {totalLogPages}
                    </span>
                    <button
                      type="button"
                      disabled={logPage >= totalLogPages}
                      onClick={() => setLogPage(p => Math.min(totalLogPages, p + 1))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Halaman Berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMENU 2: REKAPITULASI & STATISTIK KEHADIRAN                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'rekap-statistik' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Key Metrics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Total Presensi Tercatat</span>
                <History className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-white mt-2">{totalLogs}</p>
              <p className="text-[11px] text-slate-500 mt-1">Berdasarkan filter aktif saat ini</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Kehadiran Fisik</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-emerald-400 mt-2">{totalHadirFisik}</p>
              <p className="text-[11px] text-emerald-400/80 mt-1">{hadirPercentage}% dari total log ({totalHadir} tepat waktu)</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Keterlambatan</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-black text-amber-400 mt-2">{totalTerlambat}</p>
              <p className="text-[11px] text-amber-400/80 mt-1">{totalHadirFisik > 0 ? Math.round((totalTerlambat / totalHadirFisik) * 100) : 0}% dari siswa hadir</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Izin, Sakit & Alpa</span>
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-3xl font-black text-rose-400 mt-2">{totalIzin + totalSakit + totalAlpa}</p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">I:{totalIzin} • S:{totalSakit} • A:{totalAlpa}</p>
            </div>
          </div>

          {/* Class Attendance Breakdown Table */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <span>Rekapitulasi Persentase Kehadiran Per Rombel / Kelas</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tingkat partisipasi kehadiran dan perbandingan antar kelas
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReport}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Format Dinas</span>
                </button>
              </div>
            </div>

            {classBreakdown.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs italic">
                Belum ada data presensi untuk dihitung statistik kelasnya.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4 text-center">Total Log</th>
                      <th className="py-3 px-4 text-center">Hadir Tepat</th>
                      <th className="py-3 px-4 text-center">Terlambat</th>
                      <th className="py-3 px-4 text-center">Izin</th>
                      <th className="py-3 px-4 text-center">Sakit</th>
                      <th className="py-3 px-4 text-center">Alpa</th>
                      <th className="py-3 px-4">Tingkat Kehadiran (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {classBreakdown.map(item => (
                      <tr key={item.className} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white text-sm">{item.className}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold">{item.total}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-emerald-400 font-bold">{item.hadir}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-amber-400 font-bold">{item.terlambat}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-sky-400 font-bold">{item.izin}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-purple-400 font-bold">{item.sakit}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-rose-400 font-bold">{item.alpa}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${item.rate}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-xs text-white min-w-[36px] text-right">
                              {item.rate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Student-level Attendance Breakdown Table / Cards (H, T, S, I, A) with Jenis Kelamin & Pagination */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-purple-400" />
                    <span>Rekapitulasi Presensi Administrasi Siswa</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {meetingDates.length} Pertemuan Tercatat
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {filteredStudentRecapStats.length} Siswa
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Rincian presensi detail per pertemuan (P1, P2..Pn) dan akumulasi total status H, T, S, I, A serta persentase kehadiran di kolom kanan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari siswa / NISN..."
                    value={searchRekap}
                    onChange={(e) => {
                      setSearchRekap(e.target.value);
                      setRekapPage(1);
                    }}
                    className="w-full sm:w-52 bg-slate-950 border border-slate-800 pl-9 pr-8 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  {searchRekap && (
                    <button
                      onClick={() => setSearchRekap('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Desktop View Switcher */}
                <div className="hidden lg:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRekapLayoutMode('matriks')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      rekapLayoutMode === 'matriks'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Tampilkan rincian kolom pertemuan demi pertemuan"
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Matriks Pertemuan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRekapLayoutMode('ringkas')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      rekapLayoutMode === 'ringkas'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Tampilkan ringkasan total kehadiran saja"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Ringkasan</span>
                  </button>
                </div>

                {/* Mobile Expand / Collapse All Helper */}
                <button
                  type="button"
                  onClick={() => {
                    const allOpen = paginatedStudentRecap.length > 0 && paginatedStudentRecap.every(s => expandedStudentCards[s.id || s.nisn]);
                    if (allOpen) {
                      setExpandedStudentCards({});
                    } else {
                      const next: Record<string, boolean> = {};
                      paginatedStudentRecap.forEach(s => {
                        const k = s.id || s.nisn;
                        if (k) next[k] = true;
                      });
                      setExpandedStudentCards(next);
                    }
                  }}
                  className="lg:hidden bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-purple-400" />
                  <span>Rincian</span>
                </button>

                {/* Export CSV Button */}
                <button
                  type="button"
                  onClick={exportFilteredCSV}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  title="Unduh file Excel / CSV rincian pertemuan"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">CSV</span>
                </button>

                {/* Print Button */}
                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 cursor-pointer shrink-0"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Rekap</span>
                </button>
              </div>
            </div>

            {filteredStudentRecapStats.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs italic">
                Tidak ada data siswa untuk ditampilkan pada filter saat ini.
              </div>
            ) : (
              <>
                {/* ========================================================================= */}
                {/* 1. MOBILE RESPONSIVE CARD VIEW (Visible on small screens: < lg)          */}
                {/* ========================================================================= */}
                <div className="block lg:hidden divide-y divide-slate-800/70 p-3 sm:p-4 space-y-3 bg-slate-950/20">
                  {paginatedStudentRecap.map((st, idx) => {
                    const absoluteIndex = (rekapPage - 1) * rekapPageSize + idx + 1;
                    const cardKey = st.id || st.nisn || String(idx);
                    const isExpanded = !!expandedStudentCards[cardKey];

                    return (
                      <div
                        key={cardKey}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition-all shadow-md"
                      >
                        {/* Header: No, Nama, NISN, Gender, Kelas, & Rate */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-purple-400 shrink-0 mt-0.5">
                              #{absoluteIndex}
                            </span>
                            <div className="min-w-0">
                              <h4 className="font-bold text-white text-sm truncate leading-snug">
                                {st.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                                <span className="font-mono text-slate-300">{st.nisn || '-'}</span>
                                <span>•</span>
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  st.gender === 'L' ? 'bg-sky-950 text-sky-400 border border-sky-800/50' :
                                  st.gender === 'P' ? 'bg-pink-950 text-pink-400 border border-pink-800/50' :
                                  'text-slate-500'
                                }`}>
                                  {st.gender === 'L' ? 'L' : st.gender === 'P' ? 'P' : '-'}
                                </span>
                                <span>•</span>
                                <span className="font-medium text-slate-300">{st.class}</span>
                              </div>
                            </div>
                          </div>

                          {/* Attendance Percentage Badge */}
                          <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border shrink-0 flex items-center gap-1 ${
                            st.rate >= 85 ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60' :
                            st.rate >= 70 ? 'bg-amber-950/80 text-amber-400 border-amber-800/60' :
                            'bg-rose-950/80 text-rose-400 border-rose-800/60'
                          }`}>
                            <span>{st.rate}%</span>
                            <span className="text-[10px] font-sans font-normal opacity-75">Hadir</span>
                          </div>
                        </div>

                        {/* 5 Prominent Metric Boxes: H, T, S, I, A */}
                        <div className="grid grid-cols-5 gap-1.5">
                          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-2 text-center">
                            <div className="font-mono font-black text-emerald-400 text-sm sm:text-base leading-none">
                              {st.countH}
                            </div>
                            <div className="text-[9px] uppercase tracking-wider font-bold text-emerald-500/80 mt-1">
                              Hadir
                            </div>
                          </div>

                          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-2 text-center">
                            <div className="font-mono font-black text-amber-400 text-sm sm:text-base leading-none">
                              {st.countT}
                            </div>
                            <div className="text-[9px] uppercase tracking-wider font-bold text-amber-500/80 mt-1">
                              Telat
                            </div>
                          </div>

                          <div className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-2 text-center">
                            <div className="font-mono font-black text-purple-400 text-sm sm:text-base leading-none">
                              {st.countS}
                            </div>
                            <div className="text-[9px] uppercase tracking-wider font-bold text-purple-500/80 mt-1">
                              Sakit
                            </div>
                          </div>

                          <div className="bg-sky-950/30 border border-sky-800/40 rounded-xl p-2 text-center">
                            <div className="font-mono font-black text-sky-400 text-sm sm:text-base leading-none">
                              {st.countI}
                            </div>
                            <div className="text-[9px] uppercase tracking-wider font-bold text-sky-500/80 mt-1">
                              Izin
                            </div>
                          </div>

                          <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-2 text-center">
                            <div className="font-mono font-black text-rose-400 text-sm sm:text-base leading-none">
                              {st.countA}
                            </div>
                            <div className="text-[9px] uppercase tracking-wider font-bold text-rose-500/80 mt-1">
                              Alpa
                            </div>
                          </div>
                        </div>

                        {/* Attendance Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Total Hadir Fisik (H + T)</span>
                            <span className="font-medium text-slate-300">
                              <strong className="text-white font-mono">{st.totalHadirFisik}</strong> dari {st.totalRecorded || meetingDates.length} pertemuan tercatat
                            </span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                st.rate >= 85 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                                st.rate >= 70 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                                'bg-gradient-to-r from-rose-600 to-rose-400'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, st.rate))}%` }}
                            />
                          </div>
                        </div>

                        {/* Meeting Breakdown (P1..Pn) Collapsible */}
                        {meetingDates.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/70">
                            <button
                              type="button"
                              onClick={() => setExpandedStudentCards(prev => ({ ...prev, [cardKey]: !prev[cardKey] }))}
                              className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-950 text-slate-300 hover:text-white transition-colors text-xs font-medium cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-purple-400" />
                                <span>Rincian {meetingDates.length} Pertemuan</span>
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-purple-400 font-bold">
                                <span>{isExpanded ? 'Tutup' : 'Lihat Detail'}</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                              </span>
                            </button>

                            {/* Collapsed Horizontal Quick Swipe Badges */}
                            {!isExpanded && (
                              <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
                                {meetingDates.map((date, mIdx) => {
                                  const rec = studentAttendanceByDateMap.get(`${st.id}_${date}`) || studentAttendanceByDateMap.get(`${st.nisn}_${date}`);
                                  const status = rec?.status;
                                  let chipClass = 'bg-slate-800 text-slate-500 border-slate-700';
                                  let label = '-';
                                  if (status === 'Hadir') { chipClass = 'bg-emerald-950 text-emerald-400 border-emerald-800/60'; label = 'H'; }
                                  else if (status === 'Terlambat') { chipClass = 'bg-amber-950 text-amber-400 border-amber-800/60'; label = 'T'; }
                                  else if (status === 'Sakit') { chipClass = 'bg-purple-950 text-purple-400 border-purple-800/60'; label = 'S'; }
                                  else if (status === 'Izin') { chipClass = 'bg-sky-950 text-sky-400 border-sky-800/60'; label = 'I'; }
                                  else if (status === 'Alpa') { chipClass = 'bg-rose-950 text-rose-400 border-rose-800/60'; label = 'A'; }

                                  return (
                                    <div
                                      key={date}
                                      className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold shrink-0 flex items-center gap-1 ${chipClass}`}
                                      title={`P${mIdx + 1} (${date}): ${status || 'Tidak ada catatan'}`}
                                    >
                                      <span className="opacity-70 text-[9px]">P{mIdx + 1}:</span>
                                      <span>{label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Expanded Detailed Grid */}
                            {isExpanded && (
                              <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-slate-950/90 rounded-xl border border-slate-800 text-xs">
                                {meetingDates.map((date, mIdx) => {
                                  const rec = studentAttendanceByDateMap.get(`${st.id}_${date}`) || studentAttendanceByDateMap.get(`${st.nisn}_${date}`);
                                  const status = rec?.status;
                                  const time = rec?.time;
                                  const note = rec?.note;
                                  const dateParts = date.split('-');
                                  const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : date;

                                  return (
                                    <div 
                                      key={date} 
                                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800"
                                    >
                                      <div className="min-w-0 pr-1">
                                        <div className="font-bold text-slate-200 flex items-center gap-1 text-[11px]">
                                          <span className="text-purple-400">P{mIdx + 1}</span>
                                          <span className="text-[10px] font-normal text-slate-400">({formattedDate})</span>
                                        </div>
                                        {time && (
                                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                            <Clock className="w-2.5 h-2.5 text-slate-500" />
                                            <span>{cleanTimeFormat(time)}</span>
                                          </div>
                                        )}
                                        {note && (
                                          <div className="text-[9.5px] text-slate-400 italic truncate max-w-[90px]" title={note}>
                                            {note}
                                          </div>
                                        )}
                                      </div>

                                      <div className="shrink-0">
                                        {status === 'Hadir' ? (
                                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">Hadir</span>
                                        ) : status === 'Terlambat' ? (
                                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/60">Telat</span>
                                        ) : status === 'Sakit' ? (
                                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-800/60">Sakit</span>
                                        ) : status === 'Izin' ? (
                                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800/60">Izin</span>
                                        ) : status === 'Alpa' ? (
                                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800/60">Alpa</span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700">-</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ========================================================================= */}
                {/* 2. DESKTOP & TABLET MATRIX / RECAP TABLE (Visible on screens >= lg)       */}
                {/* ========================================================================= */}
                <div className="hidden lg:block overflow-x-auto relative">
                  {rekapLayoutMode === 'matriks' && meetingDates.length > 0 ? (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-950 text-slate-300 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0 z-20">
                        <tr>
                          {/* Frozen / Sticky Left Columns */}
                          <th className="py-3 px-2 text-center w-10 sticky left-0 z-30 bg-slate-950 border-r border-slate-800">No</th>
                          <th className="py-3 px-2.5 w-24 sticky left-10 z-30 bg-slate-950 border-r border-slate-800">NISN</th>
                          <th className="py-3 px-3 min-w-[170px] sticky left-34 z-30 bg-slate-950 border-r border-slate-800 shadow-md">Nama Peserta Didik</th>
                          <th className="py-3 px-2 text-center w-10 border-r border-slate-800">L/P</th>
                          <th className="py-3 px-2 text-center w-14 border-r border-slate-800">Kelas</th>

                          {/* Dynamic Meeting Columns */}
                          {meetingDates.map((date, idx) => {
                            const parts = date.split('-');
                            const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
                            return (
                              <th 
                                key={date} 
                                className="py-2.5 px-1.5 text-center w-11 border-r border-slate-800/60 font-mono tracking-tight"
                                title={`Pertemuan ke-${idx + 1} (${date})`}
                              >
                                <div className="text-purple-300 font-bold">P{idx + 1}</div>
                                <div className="text-[9px] font-normal text-slate-400">{shortDate}</div>
                              </th>
                            );
                          })}

                          {/* Summary Right Columns */}
                          <th className="py-3 px-2 text-center w-11 text-emerald-400 bg-emerald-950/40 border-l border-slate-800" title="Hadir Tepat Waktu">H</th>
                          <th className="py-3 px-2 text-center w-11 text-amber-400 bg-amber-950/40 border-r border-slate-800" title="Terlambat">T</th>
                          <th className="py-3 px-2 text-center w-11 text-purple-400 bg-purple-950/40 border-r border-slate-800" title="Sakit">S</th>
                          <th className="py-3 px-2 text-center w-11 text-sky-400 bg-sky-950/40 border-r border-slate-800" title="Izin">I</th>
                          <th className="py-3 px-2 text-center w-11 text-rose-400 bg-rose-950/40 border-r border-slate-800" title="Alpa">A</th>
                          <th className="py-3 px-3 text-center min-w-[110px] bg-slate-950" title="Persentase Kehadiran Fisik (H+T)">% Kehadiran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {paginatedStudentRecap.map((st, idx) => {
                          const absoluteIndex = (rekapPage - 1) * rekapPageSize + idx + 1;
                          return (
                            <tr key={st.id || st.nisn || idx} className="hover:bg-slate-800/40 transition-colors">
                              {/* Sticky Left Cells */}
                              <td className="py-2.5 px-2 text-center font-mono text-slate-400 sticky left-0 z-10 bg-slate-900 border-r border-slate-800">
                                {absoluteIndex}
                              </td>
                              <td className="py-2.5 px-2.5 font-mono text-slate-400 text-[11px] sticky left-10 z-10 bg-slate-900 border-r border-slate-800">
                                {st.nisn || '-'}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-white text-xs sticky left-34 z-10 bg-slate-900 border-r border-slate-800 shadow-sm truncate max-w-[190px]">
                                {st.name}
                              </td>
                              <td className="py-2.5 px-2 text-center border-r border-slate-800">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  st.gender === 'L' ? 'bg-sky-950 text-sky-400 border border-sky-800/50' :
                                  st.gender === 'P' ? 'bg-pink-950 text-pink-400 border border-pink-800/50' :
                                  'text-slate-500'
                                }`}>
                                  {st.gender || '-'}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center font-semibold text-slate-300 border-r border-slate-800">
                                {st.class}
                              </td>

                              {/* Meeting Cells */}
                              {meetingDates.map(date => {
                                const rec = studentAttendanceByDateMap.get(`${st.id}_${date}`) || studentAttendanceByDateMap.get(`${st.nisn}_${date}`);
                                const status = rec?.status;
                                const time = rec?.time;
                                const note = rec?.note;

                                let badgeContent = '-';
                                let badgeClass = 'text-slate-600 font-normal';

                                if (status === 'Hadir') {
                                  badgeContent = 'H';
                                  badgeClass = 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold';
                                } else if (status === 'Terlambat') {
                                  badgeContent = 'T';
                                  badgeClass = 'bg-amber-950/80 text-amber-400 border border-amber-800/60 font-bold';
                                } else if (status === 'Sakit') {
                                  badgeContent = 'S';
                                  badgeClass = 'bg-purple-950/80 text-purple-400 border border-purple-800/60 font-bold';
                                } else if (status === 'Izin') {
                                  badgeContent = 'I';
                                  badgeClass = 'bg-sky-950/80 text-sky-400 border border-sky-800/60 font-bold';
                                } else if (status === 'Alpa') {
                                  badgeContent = 'A';
                                  badgeClass = 'bg-rose-950/80 text-rose-400 border border-rose-800/60 font-bold';
                                }

                                return (
                                  <td 
                                    key={date} 
                                    className="py-2 px-1 text-center border-r border-slate-800/50"
                                    title={`${date}: ${status || 'Tidak ada catatan'}${time ? ` (${time})` : ''}${note ? ` - ${note}` : ''}`}
                                  >
                                    <span className={`inline-block w-6 h-6 leading-6 rounded-md text-[10px] text-center font-mono ${badgeClass}`}>
                                      {badgeContent}
                                    </span>
                                  </td>
                                );
                              })}

                              {/* Summary Right Cells */}
                              <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20 border-l border-slate-800">
                                {st.countH}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-400 bg-amber-950/20 border-r border-slate-800">
                                {st.countT}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono font-bold text-purple-400 bg-purple-950/20 border-r border-slate-800">
                                {st.countS}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono font-bold text-sky-400 bg-sky-950/20 border-r border-slate-800">
                                {st.countI}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono font-bold text-rose-400 bg-rose-950/20 border-r border-slate-800">
                                {st.countA}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 min-w-[50px]">
                                    <div
                                      className={`h-full rounded-full ${
                                        st.rate >= 85 ? 'bg-emerald-500' :
                                        st.rate >= 70 ? 'bg-amber-500' :
                                        'bg-rose-500'
                                      }`}
                                      style={{ width: `${st.rate}%` }}
                                    />
                                  </div>
                                  <span className="font-mono font-bold text-[11px] text-white min-w-[32px] text-right">
                                    {st.rate}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-950 text-slate-300 font-bold text-[11px] border-t-2 border-slate-800">
                        <tr>
                          <td colSpan={5} className="py-3 px-3 text-center sticky left-0 z-20 bg-slate-950 border-r border-slate-800 text-slate-400">
                            JUMLAH HADIR FISIK KELAS (H + T)
                          </td>
                          {meetingSummaryStats.map((ms) => (
                            <td key={ms.date} className="py-2.5 px-1 text-center border-r border-slate-800 font-mono text-emerald-400 bg-slate-900/40">
                              <div>{ms.physical}</div>
                              <div className="text-[9px] text-slate-500 font-normal">{ms.rate}%</div>
                            </td>
                          ))}
                          <td className="py-3 px-2 text-center text-emerald-400 font-mono bg-emerald-950/30 border-l border-slate-800">{totalHadir}</td>
                          <td className="py-3 px-2 text-center text-amber-400 font-mono bg-amber-950/30 border-r border-slate-800">{totalTerlambat}</td>
                          <td className="py-3 px-2 text-center text-purple-400 font-mono bg-purple-950/30 border-r border-slate-800">{totalSakit}</td>
                          <td className="py-3 px-2 text-center text-sky-400 font-mono bg-sky-950/30 border-r border-slate-800">{totalIzin}</td>
                          <td className="py-3 px-2 text-center text-rose-400 font-mono bg-rose-950/30 border-r border-slate-800">{totalAlpa}</td>
                          <td className="py-3 px-3 text-center font-mono text-white bg-slate-950">{hadirPercentage}%</td>
                        </tr>
                      </tfoot>
                    </table>
                  ) : (
                    /* Classic Compact Table */
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                        <tr>
                          <th className="py-3.5 px-3 text-center w-12">No</th>
                          <th className="py-3.5 px-3">NISN</th>
                          <th className="py-3.5 px-4">Nama Siswa</th>
                          <th className="py-3.5 px-3 text-center">L/P</th>
                          <th className="py-3.5 px-3 text-center">Kelas</th>
                          <th className="py-3.5 px-3 text-center text-emerald-400">H</th>
                          <th className="py-3.5 px-3 text-center text-amber-400">T</th>
                          <th className="py-3.5 px-3 text-center text-purple-400">S</th>
                          <th className="py-3.5 px-3 text-center text-sky-400">I</th>
                          <th className="py-3.5 px-3 text-center text-rose-400">A</th>
                          <th className="py-3.5 px-3 text-center">Total Hadir</th>
                          <th className="py-3.5 px-4">Kehadiran (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {paginatedStudentRecap.map((st, idx) => {
                          const absoluteIndex = (rekapPage - 1) * rekapPageSize + idx + 1;
                          return (
                            <tr key={st.id || st.nisn || idx} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-3 text-center font-mono text-slate-400">{absoluteIndex}</td>
                              <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">{st.nisn || '-'}</td>
                              <td className="py-3 px-4 font-bold text-white text-xs">{st.name}</td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  st.gender === 'L' ? 'bg-sky-950 text-sky-400 border border-sky-800/50' :
                                  st.gender === 'P' ? 'bg-pink-950 text-pink-400 border border-pink-800/50' :
                                  'text-slate-500'
                                }`}>
                                  {st.gender || '-'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center font-semibold text-slate-300">{st.class}</td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">{st.countH}</td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-amber-400 bg-amber-950/20">{st.countT}</td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-purple-400 bg-purple-950/20">{st.countS}</td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-sky-400 bg-sky-950/20">{st.countI}</td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-rose-400 bg-rose-950/20">{st.countA}</td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-white">{st.totalHadirFisik}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 min-w-[50px]">
                                    <div
                                      className={`h-full rounded-full ${
                                        st.rate >= 85 ? 'bg-emerald-500' :
                                        st.rate >= 70 ? 'bg-amber-500' :
                                        'bg-rose-500'
                                      }`}
                                      style={{ width: `${st.rate}%` }}
                                    />
                                  </div>
                                  <span className="font-mono font-bold text-[11px] text-white min-w-[32px] text-right">
                                    {st.rate}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Status Legend Footnote */}
                <div className="p-3.5 bg-slate-950/60 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2.5 text-[11px] text-slate-400">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-slate-300">Keterangan Status:</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> <strong>H:</strong> Hadir</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> <strong>T:</strong> Terlambat</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> <strong>S:</strong> Sakit</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span> <strong>I:</strong> Izin</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> <strong>A:</strong> Alpa</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    % Kehadiran = ((H + T) / Total Pertemuan) × 100%
                  </div>
                </div>
              </>
            )}

            {/* Pagination Controls for Rekapitulasi & Statistik */}
            {filteredStudentRecapStats.length > 0 && (
              <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <span>Tampilkan:</span>
                  <select
                    value={rekapPageSize}
                    onChange={(e) => {
                      setRekapPageSize(Number(e.target.value));
                      setRekapPage(1);
                    }}
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>dari total <strong className="text-white font-mono">{filteredStudentRecapStats.length}</strong> siswa</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setRekapPage(p => Math.max(1, p - 1))}
                    disabled={rekapPage === 1}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Sebelumnya
                  </button>

                  <span className="px-3 py-1 font-mono font-bold text-purple-400">
                    Halaman {rekapPage} / {totalRecapPages}
                  </span>

                  <button
                    onClick={() => setRekapPage(p => Math.min(totalRecapPages, p + 1))}
                    disabled={rekapPage >= totalRecapPages}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMENU 3: KELOLA, KOREKSI & SINKRONISASI DATA                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'kelola-koreksi' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-150">
          
          {/* Left Column: Quick Correction Form */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Formulir Koreksi Cepat Presensi</h3>
                <p className="text-xs text-slate-400">Ubah status, tanggal, atau jam scan siswa terdaftar</p>
              </div>
            </div>

            <form onSubmit={handleQuickCorrectionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">1. Pilih Siswa yang Ingin Dikoreksi:</label>
                <select
                  value={quickStudentId}
                  onChange={(e) => setQuickStudentId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.class} - {s.nisn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">2. Tanggal Presensi:</label>
                  <input
                    type="date"
                    value={quickDate}
                    onChange={(e) => setQuickDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white font-mono rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">3. Jam Scan:</label>
                  <input
                    type="text"
                    value={quickTime}
                    onChange={(e) => setQuickTime(e.target.value)}
                    placeholder="07:15:00"
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white font-mono rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">4. Koreksi Status Kehadiran:</label>
                <select
                  value={quickStatus}
                  onChange={(e) => setQuickStatus(e.target.value as AttendanceStatus)}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Hadir" className="text-emerald-400">Hadir (Tepat Waktu)</option>
                  <option value="Terlambat" className="text-amber-400">Terlambat</option>
                  <option value="Izin" className="text-sky-400">Izin</option>
                  <option value="Sakit" className="text-purple-400">Sakit</option>
                  <option value="Alpa" className="text-rose-400">Alpa</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">5. Alasan Koreksi / Catatan:</label>
                <input
                  type="text"
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="Contoh: Salah scan kartu / Kartu tertinggal / Surat izin dokter"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Presensi Siswa</span>
              </button>
            </form>
          </div>

          {/* Right Column: Google Sheets Sync & Log Management Info */}
          <div className="space-y-6">
            
            {/* Quick Holiday / Non-KBM Cleanup Card */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Pembersihan Presensi Hari Libur / Non-KBM</h3>
                  <p className="text-xs text-slate-400">Kosongkan log presensi pada tanggal tertentu saat tidak ada KBM</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">Pilih Tanggal:</label>
                    <input
                      type="date"
                      value={cleanupDate}
                      onChange={(e) => setCleanupDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white font-mono rounded-2xl p-2.5 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">Pilih Kelas:</label>
                    <select
                      value={cleanupClass}
                      onChange={(e) => setCleanupClass(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-2.5 focus:outline-none focus:border-rose-500 cursor-pointer"
                    >
                      {classes.map(c => (
                        <option key={c} value={c}>{c === 'SEMUA' ? 'Semua Kelas' : `Kelas ${c}`}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {matchingCleanupJournal && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                    <span className="font-bold text-emerald-400">Catatan Jurnal: </span>
                    <span>"{matchingCleanupJournal.materi}" ({matchingCleanupJournal.kelas})</span>
                  </div>
                )}

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Log Presensi Ditemukan:</span>
                  <span className="font-bold font-mono text-rose-400">{matchingCleanupAttendance.length} catatan</span>
                </div>

                <button
                  type="button"
                  disabled={matchingCleanupAttendance.length === 0}
                  onClick={() => {
                    setClearBatchModal({
                      isOpen: true,
                      date: cleanupDate,
                      class: cleanupClass,
                      count: matchingCleanupAttendance.length,
                      title: `Kosongkan Presensi (${cleanDateFormat(cleanupDate)})`,
                      subtitle: `Apakah Anda yakin ingin mengosongkan ${matchingCleanupAttendance.length} catatan presensi pada tanggal ${cleanupDate} untuk ${cleanupClass !== 'SEMUA' ? `kelas ${cleanupClass}` : 'seluruh kelas'}? Tindakan ini akan menghapus log presensi dan menyinkronkan rekap jurnal.`
                    });
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/20 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Kosongkan {matchingCleanupAttendance.length} Log Presensi Tanggal Tersebut</span>
                </button>
              </div>
            </div>

            {/* Google Sheets Sync Card */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Sinkronisasi Google Sheets 2-Arah</h3>
                  <p className="text-xs text-slate-400">Tarik data presensi terbaru atau pulihkan riwayat dari cloud</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Aplikasi secara otomatis mengirim scan presensi ke spreadsheet Anda. Jika Anda mengedit spreadsheet secara langsung di Google Sheets, Anda dapat menarik pembaruan kembali ke aplikasi ini.
              </p>

              {settings.spreadsheetUrl ? (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <p className="text-[11px] text-slate-400 font-bold uppercase">Spreadsheet Terhubung:</p>
                  <p className="text-xs text-emerald-400 font-mono truncate">{settings.spreadsheetUrl}</p>
                  <button
                    onClick={() => pullDataFromSheets(true)}
                    disabled={isPullingFromSheets}
                    className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isPullingFromSheets ? 'animate-spin' : ''}`} />
                    <span>{isPullingFromSheets ? 'Menyinkronkan dari Sheets...' : 'Tarik & Sinkronkan Data Sheets Sekarang'}</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400">
                  URL Google Sheets belum diatur. Buka menu <strong className="text-white">Pengaturan</strong> untuk menautkan spreadsheet Google.
                </div>
              )}
            </div>

            {/* Safety & Backup Helper Card */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl space-y-2 text-xs text-emerald-300">
              <p className="font-bold flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <span>Pencadangan Otomatis & Keamanan Data</span>
              </p>
              <p className="leading-relaxed">
                Seluruh catatan presensi tersimpan secara aman di database lokal browser Anda dan disinkronkan secara realtime dengan Google Sheets serta Firestore. Anda dapat mencadangkan seluruh data kapan saja melalui menu <b>Pengaturan &gt; Backup & Restore Data</b>.
              </p>
            </div>

          </div>

        </div>
      )}

        </motion.div>
      </AnimatePresence>

      {/* Edit Attendance Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Riwayat Presensi</h3>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {editingLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingLog(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student Info Card inside Modal */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white text-sm">{editingLog.studentName}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">NISN: {editingLog.nisn}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-emerald-400 font-bold font-mono">
                {editingLog.class}
              </span>
            </div>

            {/* Spreadsheet Sync Warning Note */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-[11px] text-emerald-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>
                <b>Otomatis Menimpa Spreadsheet:</b> Hasil edit akan memperbarui data lokal dan menimpa (overwrite) baris data di Google Sheets tanpa membuat baris baru.
              </span>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              
              {/* Status Select */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Status Presensi:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                  className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Terlambat">Terlambat</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Alpa">Alpa</option>
                </select>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Tanggal:</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Jam Scan / Log:</label>
                  <input
                    type="text"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    required
                    placeholder="07:15:00"
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Method Select */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Metode Scan:</label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value as 'QR Code' | 'Manual')}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
                >
                  <option value="QR Code">QR Code</option>
                  <option value="Manual">Manual Input</option>
                </select>
              </div>

              {/* Note Textarea */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Catatan / Keterangan (Opsional):</label>
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Contoh: Izin acara keluarga / Sakit demam dengan surat"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl p-3 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const recordToDelete = editingLog;
                    setEditingLog(null);
                    setDeletingRecord(recordToDelete);
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-500/20"
                  title="Hapus presensi ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLog(null)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan & Sync</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Konfirmasi Hapus Presensi</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan presensi untuk <strong className="text-white">{deletingRecord.studentName}</strong> (NISN: <span className="font-mono text-emerald-400">{deletingRecord.nisn}</span>) pada tanggal <span className="font-mono text-white">{deletingRecord.date}</span> jam <span className="font-mono text-slate-300">{deletingRecord.time}</span>?
            </p>
            <p className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
              <strong>Pemberitahuan Sinkronisasi:</strong> Menghapus catatan ini juga akan menghapus baris presensi terkait di spreadsheet Google Sheets Anda secara otomatis.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAttendance(deletingRecord.id);
                  setDeletingRecord(null);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Ya, Hapus Presensi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Clear Attendance Confirmation Modal */}
      {clearBatchModal && clearBatchModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{clearBatchModal.title}</h3>
                <p className="text-xs text-slate-400">Pembersihan Massal Riwayat Presensi</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {clearBatchModal.subtitle}
            </p>

            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl space-y-1.5 text-[11px] text-rose-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Tanggal:</span>
                <span className="font-mono font-bold text-white">{cleanDateFormat(clearBatchModal.date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Kelas:</span>
                <span className="font-bold text-white">{clearBatchModal.class === 'SEMUA' ? 'Semua Kelas' : `Kelas ${clearBatchModal.class}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Jumlah Log Dihapus:</span>
                <span className="font-mono font-bold text-rose-400">{clearBatchModal.count} catatan</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClearBatchModal(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetD = clearBatchModal.date;
                  const targetC = clearBatchModal.class;
                  setClearBatchModal(null);
                  clearAttendanceForClassAndDate(targetD, targetC);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Ya, Kosongkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
