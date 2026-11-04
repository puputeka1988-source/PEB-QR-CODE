import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp, getGradeSheetDocId } from '../context/AppContext';
import { 
  Student, DailyGradeItem, ClassGradeSheet, GradeWeights,
  AssessmentType, AssessmentParticipationStatus, StudentAssessmentStatus
} from '../types';
import { formatIndonesianDayAndDate, formatDateDMY, normalizeDateToYMD } from '../utils/formatters';
import { printElementById } from '../utils/printHelper';
import { SubNavHeader } from '../components/layout/SubNavHeader';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, Printer, Download, Save, RefreshCw, ExternalLink, X, 
  Calendar, BookOpen, Check, FileSpreadsheet, Calculator,
  Sliders, Percent, Info, Settings2, Edit3, Sparkles, Filter, Cloud, CheckCircle2,
  Search, CheckSquare, ShieldCheck, Lock, Unlock, AlertTriangle, Clock, UserCheck, UserX,
  ClipboardCheck, CheckCheck, FileCheck
} from 'lucide-react';
import { PenilaianPrintDocument } from './penilaian/components/PenilaianPrintDocument';
import { LaporanWaliKelasTab } from './penilaian/components/LaporanWaliKelasTab';
import { sortClassesByTeachingSchedule } from '../utils/scheduleHelper';

export const PenilaianHarianView: React.FC = () => {
  const { 
    students, 
    settings, 
    showToast, 
    today, 
    academicYears, 
    activeAcademicYear,
    teachingSchedules,
    getActiveSubTab,
    setActiveSubTab,
    gradeSheets,
    getGradeSheet,
    saveGradeSheet
  } = useApp();

  const activeSubTab = getActiveSubTab('Penilaian Harian') || 'input-nilai';

  // Get available classes from student list, sorted by teaching schedule
  const availableClasses = useMemo(() => {
    const DUMMY_SET = new Set(['X IPA 1', 'X IPA 2', 'XI IPS 1', 'XI IPS 2']);
    const classSet = new Set<string>();
    students.forEach(s => {
      if (s.class && !DUMMY_SET.has(s.class)) classSet.add(s.class);
    });
    const arr = Array.from(classSet);
    const sorted = sortClassesByTeachingSchedule(arr, teachingSchedules);
    return sorted;
  }, [students, teachingSchedules]);

  // Selected filters
  const [selectedClass, setSelectedClass] = useState<string>(availableClasses[0] || '');

  // Keep selectedClass synchronized if availableClasses updates or selectedClass is invalid
  useEffect(() => {
    if (availableClasses.length > 0) {
      if (!selectedClass || ['X IPA 1', 'X IPA 2', 'XI IPS 1', 'XI IPS 2'].includes(selectedClass) || !availableClasses.includes(selectedClass)) {
        setSelectedClass(availableClasses[0]);
      }
    } else if (['X IPA 1', 'X IPA 2', 'XI IPS 1', 'XI IPS 2'].includes(selectedClass)) {
      setSelectedClass('');
    }
  }, [availableClasses, selectedClass]);
  const [semester, setSemester] = useState<string>(() => activeAcademicYear?.semester || settings.semester || '1 (Ganjil)');
  const [tahunAjaran, setTahunAjaran] = useState<string>(() => activeAcademicYear?.name || settings.tahunAjaran || '2025/2026');
  const [mapel, setMapel] = useState<string>(settings.mataPelajaran || 'Informatika');
  const [customKotaTandaTangan, setCustomKotaTandaTangan] = useState<string>(settings.kotaTandaTangan || 'Bula');

  // Search filter for Input Nilai table
  const [gradeSearch, setGradeSearch] = useState<string>('');

  // Bobot Penilaian (UH, UTS, UAS)
  const [gradeWeights, setGradeWeights] = useState<GradeWeights>(() => {
    return settings.defaultGradeWeights || { uh: 40, uts: 30, uas: 30 };
  });

  // Temporary weight editing values for modal/tab
  const [tempWeights, setTempWeights] = useState<GradeWeights>({ uh: 40, uts: 30, uas: 30 });

  // Synchronize temp weights whenever gradeWeights updates
  useEffect(() => {
    setTempWeights(gradeWeights);
  }, [gradeWeights]);

  // Keep synced with activeAcademicYear if it updates
  useEffect(() => {
    if (activeAcademicYear) {
      setTahunAjaran(activeAcademicYear.name);
      setSemester(activeAcademicYear.semester);
    }
  }, [activeAcademicYear?.id, activeAcademicYear?.name, activeAcademicYear?.semester]);

  // UH Metadata (Date & Materi for UH 1..6)
  const [uhMeta, setUhMeta] = useState<{ [key: number]: { date: string; materi: string } }>({
    1: { date: '', materi: '' },
    2: { date: '', materi: '' },
    3: { date: '', materi: '' },
    4: { date: '', materi: '' },
    5: { date: '', materi: '' },
    6: { date: '', materi: '' },
  });

  // Tanggal Pelaksanaan PTS / UTS & PAS / SAS (sinkron dua arah dengan matriks nilai & status penilaian)
  const [ptsDate, setPtsDate] = useState<string>('');
  const [pasDate, setPasDate] = useState<string>('');

  // Helper untuk mengambil tanggal pelaksanaan asesmen apa pun (UH 1..6, PTS, PAS)
  const getAssessmentDate = useCallback((target: AssessmentType): string => {
    if (target.startsWith('uh')) {
      const idx = parseInt(target.replace('uh', ''), 10);
      return uhMeta[idx]?.date || '';
    }
    if (target === 'uts') return ptsDate || '';
    if (target === 'uas') return pasDate || '';
    return '';
  }, [uhMeta, ptsDate, pasDate]);

  // Helper untuk memperbarui tanggal pelaksanaan asesmen (sinkronisasi dua arah otomatis)
  const setAssessmentDate = useCallback((target: AssessmentType, dateVal: string) => {
    if (target.startsWith('uh')) {
      const idx = parseInt(target.replace('uh', ''), 10);
      if (idx) {
        setUhMeta(prev => ({
          ...prev,
          [idx]: {
            ...prev[idx],
            date: dateVal
          }
        }));
      }
    } else if (target === 'uts') {
      setPtsDate(dateVal);
    } else if (target === 'uas') {
      setPasDate(dateVal);
    }
    setHasUnsavedChanges(true);
  }, []);

  // Student Grades state map: { studentId: DailyGradeItem }
  const [studentGrades, setStudentGrades] = useState<{ [studentId: string]: DailyGradeItem }>({});

  // Status Partisipasi Asesmen Siswa (Key: `${studentId}_${assessmentKey}`)
  const [studentAssessmentStatus, setStudentAssessmentStatus] = useState<{ [key: string]: StudentAssessmentStatus }>({});
  
  // Mode Kerahasiaan Nilai Angka untuk Siswa (Blind Score Protocol - Default: true)
  const [isBlindScoreEnabled, setIsBlindScoreEnabled] = useState<boolean>(true);

  // Target Asesmen yang sedang dikelola di tab Status Penilaian (default: 'uh1')
  const [statusAssessmentTarget, setStatusAssessmentTarget] = useState<AssessmentType>('uh1');

  // Input tanggal pelaksanaan ulangan di tab status (default: hari ini)
  const [statusDateInput, setStatusDateInput] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Filter tampilan di tabel status: 'ALL' | 'BELUM' | 'SUDAH'
  const [statusViewFilter, setStatusViewFilter] = useState<'ALL' | 'BELUM' | 'SUDAH'>('ALL');
  const [statusSearchQuery, setStatusSearchQuery] = useState<string>('');

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync customKotaTandaTangan if settings change
  useEffect(() => {
    if (settings.kotaTandaTangan) {
      setCustomKotaTandaTangan(settings.kotaTandaTangan);
    }
    if (settings.mataPelajaran) {
      setMapel(settings.mataPelajaran);
    }
  }, [settings.kotaTandaTangan, settings.mataPelajaran]);

  // Sinkronisasi otomatis statusDateInput saat statusAssessmentTarget atau data tanggal asesmen berubah
  useEffect(() => {
    const currentTargetDate = getAssessmentDate(statusAssessmentTarget);
    if (currentTargetDate) {
      setStatusDateInput(normalizeDateToYMD(currentTargetDate));
    }
  }, [statusAssessmentTarget, getAssessmentDate]);

  // Unique storage key for class + semester + tahunAjaran
  const storageKey = useMemo(() => {
    return `qr_presensi_grades_${selectedClass}_${semester}_${tahunAjaran.replace('/', '-')}`;
  }, [selectedClass, semester, tahunAjaran]);

  // Calculate percentage share for active grade weights
  const weightPercentages = useMemo(() => {
    const wUH = Math.max(0, Number(gradeWeights.uh) || 0);
    const wUTS = Math.max(0, Number(gradeWeights.uts) || 0);
    const wUAS = Math.max(0, Number(gradeWeights.uas) || 0);
    const total = wUH + wUTS + wUAS;

    if (total === 0) {
      return { uh: 40, uts: 30, uas: 30, total: 100, rawUh: 40, rawUts: 30, rawUas: 30 };
    }

    const uhPct = Math.round((wUH / total) * 100);
    const utsPct = Math.round((wUTS / total) * 100);
    const uasPct = Math.max(0, 100 - (uhPct + utsPct));

    return {
      uh: uhPct,
      uts: utsPct,
      uas: uasPct,
      total,
      rawUh: wUH,
      rawUts: wUTS,
      rawUas: wUAS
    };
  }, [gradeWeights]);

  // Calculate percentage share for temp weights
  const tempWeightPercentages = useMemo(() => {
    const wUH = Math.max(0, Number(tempWeights.uh) || 0);
    const wUTS = Math.max(0, Number(tempWeights.uts) || 0);
    const wUAS = Math.max(0, Number(tempWeights.uas) || 0);
    const total = wUH + wUTS + wUAS;

    if (total === 0) {
      return { uh: 40, uts: 30, uas: 30, total: 100, rawUh: 40, rawUts: 30, rawUas: 30 };
    }

    const uhPct = Math.round((wUH / total) * 100);
    const utsPct = Math.round((wUTS / total) * 100);
    const uasPct = Math.max(0, 100 - (uhPct + utsPct));

    return {
      uh: uhPct,
      uts: utsPct,
      uas: uasPct,
      total,
      rawUh: wUH,
      rawUts: wUTS,
      rawUas: wUAS
    };
  }, [tempWeights]);

  // Load saved grade sheet from AppContext / Firestore & LocalStorage
  useEffect(() => {
    // 1. Try from AppContext / Real-time Firestore state
    const sheet = getGradeSheet(selectedClass, semester, tahunAjaran);
    if (sheet) {
      if (sheet.weights) setGradeWeights(sheet.weights);
      if (sheet.uhMeta) setUhMeta(sheet.uhMeta);
      if (sheet.ptsDate) setPtsDate(sheet.ptsDate);
      else setPtsDate('');
      if (sheet.pasDate) setPasDate(sheet.pasDate);
      else setPasDate('');
      if (sheet.studentGrades) setStudentGrades(sheet.studentGrades);
      if (sheet.mapel) setMapel(sheet.mapel);
      if (sheet.studentAssessmentStatus) setStudentAssessmentStatus(sheet.studentAssessmentStatus);
      if (sheet.isBlindScoreEnabled !== undefined) setIsBlindScoreEnabled(sheet.isBlindScoreEnabled);
      setHasUnsavedChanges(false);
      return;
    }

    // 2. Fallback to localStorage
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsed: ClassGradeSheet = JSON.parse(savedData);
        if (parsed.weights) setGradeWeights(parsed.weights);
        if (parsed.uhMeta) setUhMeta(parsed.uhMeta);
        if (parsed.ptsDate) setPtsDate(parsed.ptsDate);
        else setPtsDate('');
        if (parsed.pasDate) setPasDate(parsed.pasDate);
        else setPasDate('');
        if (parsed.studentGrades) setStudentGrades(parsed.studentGrades);
        if (parsed.mapel) setMapel(parsed.mapel);
        if (parsed.studentAssessmentStatus) setStudentAssessmentStatus(parsed.studentAssessmentStatus);
        if (parsed.isBlindScoreEnabled !== undefined) setIsBlindScoreEnabled(parsed.isBlindScoreEnabled);
      } else {
        setStudentGrades({});
        setStudentAssessmentStatus({});
        setIsBlindScoreEnabled(true);
        setPtsDate('');
        setPasDate('');
        setUhMeta({
          1: { date: '', materi: '' },
          2: { date: '', materi: '' },
          3: { date: '', materi: '' },
          4: { date: '', materi: '' },
          5: { date: '', materi: '' },
          6: { date: '', materi: '' },
        });
      }
      setHasUnsavedChanges(false);
    } catch (e) {
      console.error('Failed to load grades from localStorage:', e);
    }
  }, [selectedClass, semester, tahunAjaran, getGradeSheet, gradeSheets, storageKey]);

  // Filter students for the selected class
  const classStudents = useMemo(() => {
    return students
      .filter(s => s.class === selectedClass)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClass]);

  // Filter students by search term within class
  const filteredClassStudents = useMemo(() => {
    if (!gradeSearch.trim()) return classStudents;
    const q = gradeSearch.toLowerCase().trim();
    return classStudents.filter(s => (s.name || '').toLowerCase().includes(q) || (s.nisn || '').includes(q));
  }, [classStudents, gradeSearch]);

  // Handle grade change for single cell
  const handleGradeChange = (studentId: string, field: keyof DailyGradeItem, value: string) => {
    setStudentGrades(prev => {
      const current = prev[studentId] || {};
      return {
        ...prev,
        [studentId]: {
          ...current,
          [field]: value
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  // Handle UH Metadata change (Date/Materi for UH 1..6)
  const handleUhMetaChange = (uhIndex: number, field: 'date' | 'materi', value: string) => {
    setUhMeta(prev => ({
      ...prev,
      [uhIndex]: {
        ...prev[uhIndex],
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  // Auto calculate final grade for all students using active or specified weights
  const calculateFinalGradesWithWeights = (targetWeights: GradeWeights = gradeWeights) => {
    const wUH = Math.max(0, Number(targetWeights.uh) || 0);
    const wUTS = Math.max(0, Number(targetWeights.uts) || 0);
    const wUAS = Math.max(0, Number(targetWeights.uas) || 0);

    setStudentGrades(prev => {
      const updated = { ...prev };
      classStudents.forEach(st => {
        const item = updated[st.id] || {};
        const uhValues: number[] = [];
        [item.uh1, item.uh2, item.uh3, item.uh4, item.uh5, item.uh6].forEach(val => {
          if (val !== undefined && val !== '' && !isNaN(Number(val))) {
            uhValues.push(Number(val));
          }
        });

        const utsVal = item.uts !== undefined && item.uts !== '' && !isNaN(Number(item.uts)) ? Number(item.uts) : null;
        const uasVal = item.uas !== undefined && item.uas !== '' && !isNaN(Number(item.uas)) ? Number(item.uas) : null;

        let calculatedFinal = '';
        if (uhValues.length > 0 || utsVal !== null || uasVal !== null) {
          const avgUH = uhValues.length > 0 ? uhValues.reduce((a, b) => a + b, 0) / uhValues.length : 0;
          let sumWeights = 0;
          let totalScore = 0;

          if (uhValues.length > 0 && wUH > 0) {
            totalScore += avgUH * wUH;
            sumWeights += wUH;
          }
          if (utsVal !== null && wUTS > 0) {
            totalScore += utsVal * wUTS;
            sumWeights += wUTS;
          }
          if (uasVal !== null && wUAS > 0) {
            totalScore += uasVal * wUAS;
            sumWeights += wUAS;
          }

          if (sumWeights > 0) {
            calculatedFinal = Math.round(totalScore / sumWeights).toString();
          }
        }

        updated[st.id] = {
          ...item,
          finalGrade: calculatedFinal || item.finalGrade || ''
        };
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Trigger auto calculate
  const handleAutoCalculateFinalGrades = () => {
    calculateFinalGradesWithWeights(gradeWeights);
    showToast(`Nilai akhir dihitung dengan Bobot: UH (${weightPercentages.uh}%), UTS (${weightPercentages.uts}%), UAS (${weightPercentages.uas}%).`, 'success');
  };

  // Save modified weights
  const handleApplyWeights = (recalculate: boolean = true) => {
    setGradeWeights(tempWeights);
    if (recalculate) {
      calculateFinalGradesWithWeights(tempWeights);
      showToast(`Bobot penilaian diperbarui & Nilai Akhir dikalkulasi ulang!`, 'success');
    } else {
      showToast(`Bobot penilaian berhasil diterapkan.`, 'success');
    }
    setHasUnsavedChanges(true);
    setActiveSubTab('Penilaian Harian', 'input-nilai');
  };

  const [isSaving, setIsSaving] = useState(false);

  // Save grade sheet to LocalStorage & Firebase Firestore via AppContext
  const handleSaveGrades = async () => {
    setIsSaving(true);
    try {
      const gradeSheetData: ClassGradeSheet = {
        id: storageKey,
        kelas: selectedClass,
        semester,
        tahunAjaran,
        mapel,
        weights: gradeWeights,
        uhMeta,
        ptsDate,
        pasDate,
        studentGrades,
        studentAssessmentStatus,
        isBlindScoreEnabled,
        updatedAt: new Date().toISOString()
      };
      
      const res = await saveGradeSheet(gradeSheetData);
      if (res.success) {
        setHasUnsavedChanges(false);
      }
    } catch (e) {
      console.error('Failed to save grades:', e);
      showToast('Gagal menyimpan data nilai.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to retrieve status for student on target assessment
  const getStudentAssessmentStatus = useCallback((studentId: string, assessmentKey: AssessmentType): {
    status: AssessmentParticipationStatus | 'Belum Dilaksanakan';
    date: string;
    notes: string;
  } => {
    const explicit = studentAssessmentStatus[`${studentId}_${assessmentKey}`];
    if (explicit) {
      return {
        status: explicit.status,
        date: explicit.date || '',
        notes: explicit.notes || ''
      };
    }
    // Auto deduction: check if assessment date and score are present
    const targetDate = getAssessmentDate(assessmentKey);
    const rawScore = studentGrades[studentId]?.[assessmentKey];
    if (rawScore !== undefined && rawScore !== null && rawScore.trim() !== '') {
      return { status: 'Sudah Mengikuti', date: targetDate, notes: '' };
    }
    if (targetDate) {
      return { status: 'Belum Mengikuti', date: targetDate, notes: '' };
    }
    return { status: 'Belum Dilaksanakan', date: '', notes: '' };
  }, [studentAssessmentStatus, getAssessmentDate, studentGrades]);

  // Handler to toggle / update single student status
  const handleToggleStudentStatus = (studentId: string, assessmentKey: AssessmentType, newStatus: AssessmentParticipationStatus, customDate?: string) => {
    const targetDate = customDate || statusDateInput || getAssessmentDate(assessmentKey) || new Date().toISOString().split('T')[0];
    setStudentAssessmentStatus(prev => {
      const key = `${studentId}_${assessmentKey}`;
      const existing = prev[key];
      return {
        ...prev,
        [key]: {
          status: newStatus,
          date: targetDate,
          notes: existing?.notes || '',
          updatedAt: new Date().toISOString()
        }
      };
    });

    // Auto-sync ke tanggal pelaksanaan asesmen jika belum terisi
    if (targetDate && !getAssessmentDate(assessmentKey)) {
      setAssessmentDate(assessmentKey, targetDate);
    }

    setHasUnsavedChanges(true);
  };

  // Handler to update student status notes
  const handleUpdateStudentStatusNotes = (studentId: string, assessmentKey: AssessmentType, notes: string) => {
    setStudentAssessmentStatus(prev => {
      const key = `${studentId}_${assessmentKey}`;
      const existing = prev[key] || { status: 'Belum Mengikuti' as AssessmentParticipationStatus, date: statusDateInput };
      return {
        ...prev,
        [key]: {
          ...existing,
          notes,
          updatedAt: new Date().toISOString()
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  // Batch toggle: Mark all class students as specified status
  const handleBatchUpdateStatus = (newStatus: AssessmentParticipationStatus) => {
    setStudentAssessmentStatus(prev => {
      const updated = { ...prev };
      classStudents.forEach(st => {
        const key = `${st.id}_${statusAssessmentTarget}`;
        updated[key] = {
          status: newStatus,
          date: statusDateInput,
          notes: prev[key]?.notes || '',
          updatedAt: new Date().toISOString()
        };
      });
      return updated;
    });

    // Otomatis sinkronkan tanggal ke metadata (UH 1..6, PTS, PAS) agar muncul di Matriks Nilai
    if (statusDateInput) {
      setAssessmentDate(statusAssessmentTarget, statusDateInput);
    }

    setHasUnsavedChanges(true);
    showToast(`Semua siswa di kelas ${selectedClass} ditandai: "${newStatus}" untuk ${statusAssessmentTarget.toUpperCase()} (Tgl: ${formatDateDMY(statusDateInput)}).`, 'success');
  };

  // Smart Sync from entered grades
  const handleSyncStatusFromGrades = () => {
    let markedSudah = 0;
    let markedBelum = 0;
    setStudentAssessmentStatus(prev => {
      const updated = { ...prev };
      classStudents.forEach(st => {
        const key = `${st.id}_${statusAssessmentTarget}`;
        const score = studentGrades[st.id]?.[statusAssessmentTarget];
        if (score !== undefined && score !== null && score.trim() !== '') {
          updated[key] = {
            status: 'Sudah Mengikuti',
            date: statusDateInput,
            notes: prev[key]?.notes || '',
            updatedAt: new Date().toISOString()
          };
          markedSudah++;
        } else {
          updated[key] = {
            status: 'Belum Mengikuti',
            date: statusDateInput,
            notes: prev[key]?.notes || 'Belum ada nilai terinput',
            updatedAt: new Date().toISOString()
          };
          markedBelum++;
        }
      });
      return updated;
    });

    if (statusDateInput) {
      setAssessmentDate(statusAssessmentTarget, statusDateInput);
    }

    setHasUnsavedChanges(true);
    showToast(`Sinkronisasi selesai: ${markedSudah} siswa Sudah Mengikuti, ${markedBelum} siswa Belum Mengikuti (Tgl: ${formatDateDMY(statusDateInput)}).`, 'info');
  };

  // Calculate statistics for the current selected assessment in status management
  const statusStats = useMemo(() => {
    let sudah = 0;
    let belum = 0;
    let izinSakit = 0;
    let wait = 0;

    classStudents.forEach(st => {
      const stData = getStudentAssessmentStatus(st.id, statusAssessmentTarget);
      if (stData.status === 'Sudah Mengikuti') sudah++;
      else if (stData.status === 'Belum Mengikuti' || stData.status === 'Perlu Susulan') belum++;
      else if (stData.status === 'Izin / Sakit') izinSakit++;
      else wait++;
    });

    const total = classStudents.length;
    const rate = total > 0 ? Math.round((sudah / total) * 100) : 0;
    return { sudah, belum, izinSakit, wait, total, rate };
  }, [classStudents, getStudentAssessmentStatus, statusAssessmentTarget]);

  // Overall incomplete assessments across class for badge
  const incompleteAssessmentCount = useMemo(() => {
    return statusStats.belum;
  }, [statusStats.belum]);

  const ASSESSMENT_OPTIONS: { id: AssessmentType; label: string; shortLabel: string; uhIndex?: number }[] = [
    { id: 'uh1', label: 'Ulangan Harian 1', shortLabel: 'UH 1', uhIndex: 1 },
    { id: 'uh2', label: 'Ulangan Harian 2', shortLabel: 'UH 2', uhIndex: 2 },
    { id: 'uh3', label: 'Ulangan Harian 3', shortLabel: 'UH 3', uhIndex: 3 },
    { id: 'uh4', label: 'Ulangan Harian 4', shortLabel: 'UH 4', uhIndex: 4 },
    { id: 'uh5', label: 'Ulangan Harian 5', shortLabel: 'UH 5', uhIndex: 5 },
    { id: 'uh6', label: 'Ulangan Harian 6', shortLabel: 'UH 6', uhIndex: 6 },
    { id: 'uts', label: 'Penilaian Tengah Semester', shortLabel: 'PTS / UTS' },
    { id: 'uas', label: 'Penilaian Akhir Semester', shortLabel: 'PAS / SAS' },
  ];

  // Export to CSV
  const handleExportCSV = () => {
    if (classStudents.length === 0) {
      showToast('Tidak ada data siswa untuk diekspor.', 'warning');
      return;
    }

    let csv = `DAFTAR NILAI HARIAN SISWA\n`;
    csv += `Sekolah,${settings.sekolah}\n`;
    csv += `Kelas,${selectedClass}\n`;
    csv += `Semester,${semester}\n`;
    csv += `Tahun Ajaran,${tahunAjaran}\n`;
    csv += `Mata Pelajaran,${mapel}\n\n`;

    // Headers
    csv += `NO,NAMA SISWA,L/P,UH 1,UH 2,UH 3,UH 4,UH 5,UH 6,NILAI UTS,NILAI UAS,NILAI AKHIR\n`;
    csv += `,,TANGGAL,${formatDateDMY(uhMeta[1].date) || '-'},${formatDateDMY(uhMeta[2].date) || '-'},${formatDateDMY(uhMeta[3].date) || '-'},${formatDateDMY(uhMeta[4].date) || '-'},${formatDateDMY(uhMeta[5].date) || '-'},${formatDateDMY(uhMeta[6].date) || '-'},${formatDateDMY(ptsDate) || '-'},${formatDateDMY(pasDate) || '-'}\n`;
    csv += `,,MATERI,${uhMeta[1].materi || '-'},${uhMeta[2].materi || '-'},${uhMeta[3].materi || '-'},${uhMeta[4].materi || '-'},${uhMeta[5].materi || '-'},${uhMeta[6].materi || '-'},Tengah Semester,Akhir Semester\n`;

    classStudents.forEach((student, idx) => {
      const g = studentGrades[student.id] || {};
      csv += `${idx + 1},"${student.name}",${student.gender || 'L'},${g.uh1 || ''},${g.uh2 || ''},${g.uh3 || ''},${g.uh4 || ''},${g.uh5 || ''},${g.uh6 || ''},${g.uts || ''},${g.uas || ''},${g.finalGrade || ''}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daftar_Nilai_Harian_${selectedClass.replace(/\s+/g, '_')}_${semester}_${tahunAjaran.replace('/', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV Nilai Harian berhasil diunduh.', 'success');
  };

  // Print Action with Universal Fallback
  const handleTriggerPrint = () => {
    showToast('Menyiapkan dokumen Nilai Harian...', 'info');
    printElementById('printable-nilai-area', {
      title: `Daftar Nilai Harian Siswa - ${selectedClass}`,
      orientation: 'landscape',
      pageMargin: '8mm'
    });
  };

  // Render padded rows up to 30 matching official layout
  const tableRows = useMemo(() => {
    const minRows = 30;
    const rows = [...classStudents];
    return { rows, totalDisplay: Math.max(minRows, rows.length) };
  }, [classStudents]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Submenu Navigation Header */}
      <SubNavHeader
        currentTab="Penilaian Harian"
        activeSubTab={activeSubTab}
        onSelectSubTab={(id) => setActiveSubTab('Penilaian Harian', id)}
        badgeCounts={{
          'input-nilai': `${classStudents.length} Siswa`,
          'status-penilaian': `${incompleteAssessmentCount > 0 ? `${incompleteAssessmentCount} Susulan` : 'Lengkap'}`,
          'laporan-wali-kelas': 'Siap Lapor',
          'bobot-materi': `${weightPercentages.uh}:${weightPercentages.uts}:${weightPercentages.uas}`,
          'cetak-rekap': 'Format Dinas'
        }}
        extraActions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoCalculateFinalGrades}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 px-3 rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
              title="Kalkulasi otomatis Nilai Akhir"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Hitung Nilai</span>
            </button>

            <button
              onClick={handleSaveGrades}
              disabled={isSaving}
              className={`flex items-center gap-1.5 text-xs font-black py-2 px-3.5 rounded-xl shadow-md transition-all cursor-pointer ${
                isSaving 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : hasUnsavedChanges
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
              }`}
              title="Simpan & Sinkronkan Nilai ke Cloud Firebase"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span>Menyimpan...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Nilai</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersimpan di Cloud</span>
                </>
              )}
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
          {/* SUBMENU 1: DAFTAR & INPUT NILAI                                           */}
          {/* ========================================================================= */}
          {activeSubTab === 'input-nilai' && (
            <div className="space-y-5">
          
          {/* Fast Class Selection Grid Model */}
          <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-3 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pilih Kelas Penilaian:</h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Pilih rombel untuk input nilai harian (UH 1–6, UTS, UAS, Nilai Akhir)
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
              {availableClasses.map(cls => {
                const count = students.filter(s => s.class === cls).length;
                const isSelected = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
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

          {/* Academic Info Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Semester:</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="1 (Ganjil)">Semester 1 (Ganjil)</option>
                <option value="2 (Genap)">Semester 2 (Genap)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Tahun Ajaran:</label>
              {academicYears.length > 0 ? (
                <select
                  value={tahunAjaran}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTahunAjaran(val);
                    const matched = academicYears.find(a => a.name === val);
                    if (matched) setSemester(matched.semester);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.name}>
                      {ay.name} ({ay.semester}) {ay.isCurrent ? '⭐' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={tahunAjaran}
                  onChange={(e) => setTahunAjaran(e.target.value)}
                  placeholder="2025/2026"
                  className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Mata Pelajaran:</label>
              <input
                type="text"
                value={mapel}
                onChange={(e) => setMapel(e.target.value)}
                placeholder="Informatika"
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Main Matrix Input Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
                <h2 className="text-sm font-bold text-white">Input Nilai Siswa Kelas {selectedClass}</h2>
                <span className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {classStudents.length} Siswa
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* Search in Class */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={gradeSearch}
                    onChange={(e) => setGradeSearch(e.target.value)}
                    placeholder="Cari siswa di kelas ini..."
                    className="bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48 sm:w-56"
                  />
                  {gradeSearch && (
                    <button
                      type="button"
                      onClick={() => setGradeSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('Penilaian Harian', 'status-penilaian')}
                  className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[11px] font-bold text-emerald-300 hover:text-emerald-200 transition-colors cursor-pointer"
                  title="Update status partisipasi ulangan siswa per tanggal tanpa ekspos nilai angka"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Update Status Penilaian</span>
                  {incompleteAssessmentCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {incompleteAssessmentCount} Susulan
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('Penilaian Harian', 'laporan-wali-kelas')}
                  className="flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-[11px] font-bold text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer"
                  title="Kompilasi nilai & tanggal aktif siap cetak atau dibagikan ke wali kelas"
                >
                  <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Laporan Wali Kelas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('Penilaian Harian', 'bobot-materi')}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bobot: UH {weightPercentages.uh}% • UTS {weightPercentages.uts}% • UAS {weightPercentages.uas}%</span>
                  <Edit3 className="w-3 h-3 opacity-70 ml-0.5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
                <thead>
                  {/* Top Header Level 1 */}
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-bold">
                    <th className="p-3 text-center border-r border-slate-800 w-10" rowSpan={3}>NO</th>
                    <th className="p-3 text-center border-r border-slate-800 w-52 min-w-[190px] max-w-[210px]" rowSpan={3}>NAMA SISWA</th>
                    <th className="p-3 text-center border-r border-slate-800 w-12" rowSpan={3}>L/P</th>
                    <th className="p-2 text-center border-r border-slate-800 bg-slate-900" colSpan={6}>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold tracking-wide">NILAI HARIAN</span>
                        <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          Bobot: {weightPercentages.uh}%
                        </span>
                      </div>
                    </th>
                    <th className="p-2 text-center border-r border-slate-800 w-28 min-w-[105px]">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="font-bold tracking-wide">NILAI UTS</span>
                        <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded-full">
                          {weightPercentages.uts}%
                        </span>
                      </div>
                    </th>
                    <th className="p-2 text-center border-r border-slate-800 w-28 min-w-[105px]">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="font-bold tracking-wide">NILAI UAS</span>
                        <span className="text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 px-1.5 py-0.2 rounded-full">
                          {weightPercentages.uas}%
                        </span>
                      </div>
                    </th>
                    <th className="p-3 text-center w-24 bg-emerald-500/10 text-emerald-300" rowSpan={3}>
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="font-bold tracking-wide">NILAI AKHIR</span>
                        <span className="text-[9px] font-normal text-emerald-400/80">Kalkulasi Bobot</span>
                      </div>
                    </th>
                  </tr>

                  {/* UH, UTS, UAS Meta Row: Tanggal Pelaksanaan & Materi */}
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px]">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <th key={i} className="p-1.5 border-r border-slate-800 min-w-[110px] space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 text-[10px] w-8">Tgl:</span>
                          <input
                            type="date"
                            value={normalizeDateToYMD(uhMeta[i]?.date)}
                            onChange={(e) => {
                              handleUhMetaChange(i, 'date', e.target.value);
                              if (statusAssessmentTarget === `uh${i}`) {
                                setStatusDateInput(e.target.value);
                              }
                            }}
                            title={`Tanggal Pelaksanaan UH ${i} (Otomatis sinkron ke Update Status Penilaian)`}
                            className="w-full bg-slate-900 border border-slate-700/80 rounded text-[10px] px-1 py-0.5 text-center text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 text-[10px] w-8">Materi:</span>
                          <input
                            type="text"
                            value={uhMeta[i]?.materi || ''}
                            onChange={(e) => handleUhMetaChange(i, 'materi', e.target.value)}
                            placeholder="Judul Materi"
                            className="w-full bg-slate-900 border border-slate-700/80 rounded text-[10px] px-1 py-0.5 text-center text-slate-200 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </th>
                    ))}

                    {/* UTS Tgl Input - Auto Sync with Status Penilaian */}
                    <th className="p-1.5 border-r border-slate-800 min-w-[105px] space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 text-[10px] w-8">Tgl:</span>
                        <input
                          type="date"
                          value={normalizeDateToYMD(ptsDate)}
                          onChange={(e) => {
                            setPtsDate(e.target.value);
                            if (statusAssessmentTarget === 'uts') {
                              setStatusDateInput(e.target.value);
                            }
                            setHasUnsavedChanges(true);
                          }}
                          title="Tanggal Pelaksanaan PTS / UTS (Otomatis sinkron ke Update Status Penilaian)"
                          className="w-full bg-slate-900 border border-slate-700/80 rounded text-[10px] px-1 py-0.5 text-center text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                      <div className="text-[10px] text-amber-400/80 text-center font-semibold">
                        Tengah Semester
                      </div>
                    </th>

                    {/* UAS Tgl Input - Auto Sync with Status Penilaian */}
                    <th className="p-1.5 border-r border-slate-800 min-w-[105px] space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 text-[10px] w-8">Tgl:</span>
                        <input
                          type="date"
                          value={normalizeDateToYMD(pasDate)}
                          onChange={(e) => {
                            setPasDate(e.target.value);
                            if (statusAssessmentTarget === 'uas') {
                              setStatusDateInput(e.target.value);
                            }
                            setHasUnsavedChanges(true);
                          }}
                          title="Tanggal Pelaksanaan PAS / SAS (Otomatis sinkron ke Update Status Penilaian)"
                          className="w-full bg-slate-900 border border-slate-700/80 rounded text-[10px] px-1 py-0.5 text-center text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                      <div className="text-[10px] text-sky-400/80 text-center font-semibold">
                        Akhir Semester
                      </div>
                    </th>
                  </tr>

                  {/* Sub-headers for UH, UTS, UAS */}
                  <tr className="bg-slate-950 border-b border-slate-800 text-center font-bold text-slate-300">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <th key={i} className="p-2 border-r border-slate-800 bg-slate-900/60">
                        UH {i}
                      </th>
                    ))}
                    <th className="p-2 border-r border-slate-800 bg-slate-900/60 text-amber-300">
                      UTS
                    </th>
                    <th className="p-2 border-r border-slate-800 bg-slate-900/60 text-sky-300">
                      UAS
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-slate-400">
                        Belum ada siswa di kelas <strong className="text-white">{selectedClass}</strong>. Silakan tambahkan siswa di menu Siswa.
                      </td>
                    </tr>
                  ) : filteredClassStudents.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-slate-400">
                        Tidak ada siswa yang cocok dengan pencarian &quot;{gradeSearch}&quot; di kelas {selectedClass}.
                      </td>
                    </tr>
                  ) : (
                    filteredClassStudents.map((student, index) => {
                      const grades = studentGrades[student.id] || {};
                      return (
                        <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-2.5 text-center font-mono font-bold text-slate-400 border-r border-slate-800/60">
                            {index + 1}
                          </td>
                          <td className="p-2.5 font-semibold text-white border-r border-slate-800/60">
                            {student.name}
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-300 border-r border-slate-800/60">
                            {student.gender || 'L'}
                          </td>

                          {/* UH 1..6 Cells */}
                          {(['uh1', 'uh2', 'uh3', 'uh4', 'uh5', 'uh6'] as const).map(field => (
                            <td key={field} className="p-1 border-r border-slate-800/60 text-center">
                              <input
                                type="text"
                                value={grades[field] || ''}
                                onChange={(e) => handleGradeChange(student.id, field, e.target.value)}
                                placeholder="-"
                                className="w-full bg-slate-950 border border-slate-800 text-center text-emerald-400 font-mono font-bold text-xs rounded py-1 focus:outline-none focus:border-emerald-500 focus:bg-slate-900"
                              />
                            </td>
                          ))}

                          {/* UTS Cell */}
                          <td className="p-1 border-r border-slate-800/60 text-center">
                            <input
                              type="text"
                              value={grades.uts || ''}
                              onChange={(e) => handleGradeChange(student.id, 'uts', e.target.value)}
                              placeholder="-"
                              className="w-full bg-slate-950 border border-slate-800 text-center text-amber-400 font-mono font-bold text-xs rounded py-1 focus:outline-none focus:border-emerald-500 focus:bg-slate-900"
                            />
                          </td>

                          {/* UAS Cell */}
                          <td className="p-1 border-r border-slate-800/60 text-center">
                            <input
                              type="text"
                              value={grades.uas || ''}
                              onChange={(e) => handleGradeChange(student.id, 'uas', e.target.value)}
                              placeholder="-"
                              className="w-full bg-slate-950 border border-slate-800 text-center text-sky-400 font-mono font-bold text-xs rounded py-1 focus:outline-none focus:border-emerald-500 focus:bg-slate-900"
                            />
                          </td>

                          {/* NILAI AKHIR Cell */}
                          <td className="p-1 text-center bg-emerald-500/5">
                            <input
                              type="text"
                              value={grades.finalGrade || ''}
                              onChange={(e) => handleGradeChange(student.id, 'finalGrade', e.target.value)}
                              placeholder="-"
                              className="w-full bg-slate-900 border border-emerald-500/30 text-center text-emerald-300 font-mono font-black text-xs rounded py-1 focus:outline-none focus:border-emerald-400"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
              <span>
                Disimpan untuk Kelas <strong className="text-emerald-400">{selectedClass}</strong> • {semester} • TA {tahunAjaran}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-1.5 rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Ekspor CSV</span>
                </button>
                <button
                  onClick={handleSaveGrades}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Nilai</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMENU 2: UPDATE STATUS PENILAIAN & KENDALI ULANGAN                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'status-penilaian' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* 1. Fast Class Selection Grid */}
          <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-3 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pilih Kelas:</h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Pilih rombel untuk pembaruan status keikutsertaan ulangan siswa
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
              {availableClasses.map(cls => {
                const count = students.filter(s => s.class === cls).length;
                const isSelected = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
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

          {/* 2. Header Banner with Blind Score Protocol Switch */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Update Status Penilaian</span>
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-300 font-semibold">Kelas {selectedClass}</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1.5 flex items-center gap-2">
                  <span>Kendali Keikutsertaan Ulangan Siswa Per Tanggal</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Perbarui status apakah siswa sudah mengikuti ulangan, izin/sakit, atau butuh susulan untuk tanggal tertentu. Siswa dapat langsung memantau kelengkapan ulangan di portal mandiri tanpa mengekspos nilai angka rahasia sebelum pembagian rapor.
                </p>
              </div>

              {/* Blind Score Mode Toggle Card */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsBlindScoreEnabled(!isBlindScoreEnabled);
                    setHasUnsavedChanges(true);
                    showToast(
                      !isBlindScoreEnabled 
                        ? 'Mode Blind Score DIAKTIFKAN: Nilai angka murni dirahasiakan dari portal siswa.' 
                        : 'Mode Blind Score DINONAKTIFKAN: Nilai angka terbuka di portal siswa.',
                      'info'
                    );
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-bold ${
                    isBlindScoreEnabled
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {isBlindScoreEnabled ? (
                    <>
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span>Blind Score: AKTIF (Terkunci)</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 text-amber-400" />
                      <span>Blind Score: TERBUKA</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('Penilaian Harian', 'laporan-wali-kelas')}
                  className="p-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition-all cursor-pointer flex items-center gap-2 text-xs font-bold"
                  title="Lihat Laporan Wali Kelas untuk kelas ini"
                >
                  <FileCheck className="w-4 h-4 text-indigo-400" />
                  <span>Laporan Wali Kelas</span>
                </button>
              </div>
            </div>

            {/* Assessment Component Selector Bar */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pilih Penilaian / Ulangan Yang Ingin Diupdate:</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {ASSESSMENT_OPTIONS.map(opt => {
                  const isSelected = statusAssessmentTarget === opt.id;
                  const rawTargetDate = getAssessmentDate(opt.id);
                  const displayDate = rawTargetDate ? formatDateDMY(rawTargetDate) : 'Belum diisi tgl';

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStatusAssessmentTarget(opt.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/40 scale-[1.02]'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="font-black text-xs">{opt.shortLabel}</div>
                      <div className={`text-[10px] font-mono truncate mt-0.5 ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                        {displayDate}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date, Topic & Quick Batch Action Bar */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tanggal Pelaksanaan Ulangan:</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={statusDateInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStatusDateInput(val);
                      setAssessmentDate(statusAssessmentTarget, val);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-mono rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      setStatusDateInput(todayStr);
                      setAssessmentDate(statusAssessmentTarget, todayStr);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-2.5 py-2.5 rounded-xl border border-slate-700 shrink-0 cursor-pointer"
                    title="Gunakan tanggal hari ini"
                  >
                    Hari Ini
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Materi / Pokok Bahasan KD:</span>
                </label>
                <input
                  type="text"
                  value={
                    statusAssessmentTarget.startsWith('uh')
                      ? uhMeta[parseInt(statusAssessmentTarget.replace('uh', ''), 10)]?.materi || ''
                      : statusAssessmentTarget === 'uts'
                      ? 'Penilaian Tengah Semester (PTS)'
                      : 'Penilaian Akhir Semester (PAS)'
                  }
                  onChange={(e) => {
                    if (statusAssessmentTarget.startsWith('uh')) {
                      const idx = parseInt(statusAssessmentTarget.replace('uh', ''), 10);
                      if (idx) handleUhMetaChange(idx, 'materi', e.target.value);
                    }
                  }}
                  placeholder="Contoh: Algoritma & Struktur Data"
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Aksi Cepat Massal:</span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSyncStatusFromGrades}
                    className="flex-1 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[11px] font-bold py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                    title="Otomatis tandai Sudah Mengikuti bagi siswa yang sudah terinput nilai di matriks"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sinkron dari Nilai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBatchUpdateStatus('Sudah Mengikuti')}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    title="Tandai semua siswa sudah mengikuti ulangan ini"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Semua Sudah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBatchUpdateStatus('Belum Mengikuti')}
                    className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    title="Tandai semua siswa belum mengikuti ulangan ini"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Semua Belum</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Metrics Summary for Target Assessment */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] text-slate-400 font-medium">TOTAL SISWA KELAS</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white">{statusStats.total}</span>
                <span className="text-xs text-slate-500">Siswa</span>
              </div>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl">
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SUDAH MENGIKUTI</span>
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-400">{statusStats.sudah}</span>
                <span className="text-xs text-emerald-300/70 font-semibold">{statusStats.rate}% Tuntas</span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${
              statusStats.belum > 0
                ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <span className="text-[11px] font-medium flex items-center gap-1">
                <AlertTriangle className={`w-3.5 h-3.5 ${statusStats.belum > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
                <span>BELUM MENGIKUTI / SUSULAN</span>
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={`text-2xl font-black ${statusStats.belum > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {statusStats.belum}
                </span>
                <span className="text-xs font-semibold">
                  {statusStats.belum > 0 ? 'Perlu Dikejar' : 'Nihil'}
                </span>
              </div>
            </div>

            <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl">
              <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>IZIN / SAKIT (SUSULAN)</span>
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-amber-400">{statusStats.izinSakit}</span>
                <span className="text-xs text-amber-300/70 font-semibold">Terjadwal</span>
              </div>
            </div>
          </div>

          {/* 4. Student Status Matrix Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Toolbar filter & search */}
            <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setStatusViewFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusViewFilter === 'ALL'
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'bg-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Semua Siswa ({classStudents.length})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusViewFilter('BELUM')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusViewFilter === 'BELUM'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'bg-transparent text-slate-400 hover:text-rose-300'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Belum Mengikuti ({statusStats.belum + statusStats.izinSakit})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusViewFilter('SUDAH')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusViewFilter === 'SUDAH'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-transparent text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sudah Mengikuti ({statusStats.sudah})</span>
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={statusSearchQuery}
                  onChange={(e) => setStatusSearchQuery(e.target.value)}
                  placeholder="Cari nama atau NISN..."
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:border-emerald-500"
                />
                {statusSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStatusSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3 text-center border-r border-slate-800 w-12">No</th>
                    <th className="p-3 border-r border-slate-800 w-60">Nama Siswa</th>
                    <th className="p-3 text-center border-r border-slate-800 w-28">NISN / L-P</th>
                    <th className="p-3 text-center border-r border-slate-800 w-64">
                      Aksi Cepat Toggle Status Partisipasi
                    </th>
                    <th className="p-3 text-center border-r border-slate-800 w-36">Tanggal Pelaksanaan</th>
                    <th className="p-3">Catatan / Jadwal Susulan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {classStudents
                    .filter(s => {
                      if (statusSearchQuery.trim()) {
                        const q = statusSearchQuery.toLowerCase().trim();
                        if (!s.name.toLowerCase().includes(q) && !s.nisn.includes(q)) return false;
                      }
                      if (statusViewFilter === 'ALL') return true;
                      const st = getStudentAssessmentStatus(s.id, statusAssessmentTarget);
                      if (statusViewFilter === 'BELUM') {
                        return st.status === 'Belum Mengikuti' || st.status === 'Perlu Susulan' || st.status === 'Izin / Sakit';
                      }
                      if (statusViewFilter === 'SUDAH') {
                        return st.status === 'Sudah Mengikuti';
                      }
                      return true;
                    })
                    .map((student, idx) => {
                      const stData = getStudentAssessmentStatus(student.id, statusAssessmentTarget);
                      const currentStatus = stData.status;

                      return (
                        <tr 
                          key={student.id}
                          className={`hover:bg-slate-850/60 transition-colors ${
                            currentStatus === 'Belum Mengikuti' || currentStatus === 'Perlu Susulan'
                              ? 'bg-rose-950/10'
                              : currentStatus === 'Izin / Sakit'
                              ? 'bg-amber-950/10'
                              : ''
                          }`}
                        >
                          <td className="p-3 text-center font-mono font-bold text-slate-400 border-r border-slate-800">
                            {idx + 1}
                          </td>

                          <td className="p-3 font-semibold text-white border-r border-slate-800">
                            <div className="flex items-center justify-between gap-1">
                              <span>{student.name}</span>
                              {student.status && student.status !== 'Aktif' && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                                  {student.status}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3 text-center font-mono text-slate-400 border-r border-slate-800 text-[11px]">
                            {student.nisn} ({student.gender || 'L'})
                          </td>

                          {/* Fast Action Toggle Group */}
                          <td className="p-2.5 text-center border-r border-slate-800">
                            <div className="grid grid-cols-4 gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleStudentStatus(student.id, statusAssessmentTarget, 'Sudah Mengikuti')}
                                className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
                                  currentStatus === 'Sudah Mengikuti'
                                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm ring-1 ring-emerald-400'
                                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800'
                                }`}
                                title="Sudah Mengikuti Ulangan"
                              >
                                <Check className="w-3 h-3" />
                                <span>Sudah</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStudentStatus(student.id, statusAssessmentTarget, 'Belum Mengikuti')}
                                className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
                                  currentStatus === 'Belum Mengikuti'
                                    ? 'bg-rose-500 text-white font-black shadow-sm ring-1 ring-rose-400'
                                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800'
                                }`}
                                title="Belum Mengikuti Ulangan"
                              >
                                <X className="w-3 h-3" />
                                <span>Belum</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStudentStatus(student.id, statusAssessmentTarget, 'Perlu Susulan')}
                                className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
                                  currentStatus === 'Perlu Susulan'
                                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm ring-1 ring-amber-400'
                                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800'
                                }`}
                                title="Perlu Ulangan Susulan"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span>Susulan</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStudentStatus(student.id, statusAssessmentTarget, 'Izin / Sakit')}
                                className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
                                  currentStatus === 'Izin / Sakit'
                                    ? 'bg-sky-500 text-slate-950 font-black shadow-sm ring-1 ring-sky-400'
                                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-sky-400 border border-slate-800'
                                }`}
                                title="Izin / Sakit saat ulangan"
                              >
                                <Clock className="w-3 h-3" />
                                <span>Sakit/Izin</span>
                              </button>
                            </div>
                          </td>

                          {/* Tanggal Pelaksanaan per Siswa */}
                          <td className="p-2 border-r border-slate-800 text-center">
                            <input
                              type="date"
                              value={stData.date || statusDateInput}
                              onChange={(e) => {
                                handleToggleStudentStatus(student.id, statusAssessmentTarget, currentStatus === 'Belum Dilaksanakan' ? 'Sudah Mengikuti' : currentStatus, e.target.value);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-[11px] rounded-lg p-1.5 focus:outline-none focus:border-emerald-500 text-center"
                            />
                          </td>

                          {/* Catatan / Jadwal Susulan */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={stData.notes || ''}
                              onChange={(e) => handleUpdateStudentStatusNotes(student.id, statusAssessmentTarget, e.target.value)}
                              placeholder={
                                currentStatus === 'Belum Mengikuti' || currentStatus === 'Perlu Susulan'
                                  ? 'Catatan / Waktu susulan...'
                                  : 'Keterangan...'
                              }
                              className="w-full bg-slate-950 border border-slate-800 text-white text-[11px] rounded-lg p-1.5 focus:outline-none focus:border-emerald-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
              <div className="flex items-center gap-2">
                <span>
                  Asesmen: <strong className="text-emerald-400">{statusAssessmentTarget.toUpperCase()}</strong> • Tanggal: <strong className="text-white font-mono">{formatDateDMY(statusDateInput) || 'Belum diisi'}</strong>
                </span>
                <span>•</span>
                <span>Tingkat Kelengkapan: <strong className="text-emerald-400">{statusStats.rate}%</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('Penilaian Harian', 'input-nilai')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  ← Buka Matriks Nilai
                </button>

                <button
                  type="button"
                  onClick={handleSaveGrades}
                  disabled={isSaving}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan & Sinkronkan Status'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMENU: LAPORAN WALI KELAS (KOMPILASI NILAI & TANGGAL AKTIF)             */}
      {/* ========================================================================= */}
      {activeSubTab === 'laporan-wali-kelas' && (
        <LaporanWaliKelasTab
          settings={settings}
          students={students}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          availableClasses={availableClasses}
          semester={semester}
          tahunAjaran={tahunAjaran}
          mapel={mapel}
          uhMeta={uhMeta}
          ptsDate={ptsDate}
          pasDate={pasDate}
          studentGrades={studentGrades}
          studentAssessmentStatus={studentAssessmentStatus}
          weightPercentages={weightPercentages}
          customKotaTandaTangan={customKotaTandaTangan}
          setCustomKotaTandaTangan={setCustomKotaTandaTangan}
          today={today}
          showToast={showToast}
          onNavigateToInputNilai={() => setActiveSubTab('Penilaian Harian', 'input-nilai')}
          onNavigateToStatusPenilaian={() => setActiveSubTab('Penilaian Harian', 'status-penilaian')}
        />
      )}

      {/* ========================================================================= */}
      {/* SUBMENU 4: BOBOT PENILAIAN & MATERI KOMPETENSI                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'bobot-materi' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl animate-in fade-in duration-150">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Konfigurasi Bobot Penilaian Siswa</h3>
                <p className="text-xs text-slate-400">
                  Ubah rasio persentase Nilai Harian (UH), UTS, & UAS untuk menentukan Nilai Akhir otomatis.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSubTab('Penilaian Harian', 'input-nilai')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              ← Kembali ke Daftar Nilai
            </button>
          </div>

          {/* Preset Quick Options */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Pilihan Preset Standar Kurikulum:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTempWeights({ uh: 40, uts: 30, uas: 30 })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  tempWeights.uh === 40 && tempWeights.uts === 30 && tempWeights.uas === 30
                    ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-amber-300 text-xs">Standar Umum</div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">40% : 30% : 30%</div>
              </button>

              <button
                type="button"
                onClick={() => setTempWeights({ uh: 50, uts: 25, uas: 25 })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  (tempWeights.uh === 50 && tempWeights.uts === 25 && tempWeights.uas === 25) ||
                  (tempWeights.uh === 2 && tempWeights.uts === 1 && tempWeights.uas === 1)
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-emerald-300 text-xs">Kurikulum Merdeka</div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">50% : 25% : 25% (2:1:1)</div>
              </button>

              <button
                type="button"
                onClick={() => setTempWeights({ uh: 60, uts: 20, uas: 20 })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  tempWeights.uh === 60 && tempWeights.uts === 20 && tempWeights.uas === 20
                    ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-sky-300 text-xs">UH Dominan</div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">60% : 20% : 20%</div>
              </button>

              <button
                type="button"
                onClick={() => setTempWeights({ uh: 1, uts: 1, uas: 1 })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  tempWeights.uh === 1 && tempWeights.uts === 1 && tempWeights.uas === 1
                    ? 'bg-indigo-500/15 border-indigo-500/50 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-indigo-300 text-xs">Sama Rata (Murni)</div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">33.3% : 33.3% : 33.3%</div>
              </button>
            </div>
          </div>

          {/* Visual Percentage Distribution Bar */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Distribusi Rasio Pembobotan:</span>
              <span className="font-mono font-bold text-emerald-400">Total Akumulasi: 100%</span>
            </div>
            
            <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300" 
                style={{ width: `${tempWeightPercentages.uh}%` }} 
                title={`UH: ${tempWeightPercentages.uh}%`} 
              />
              <div 
                className="bg-amber-500 h-full transition-all duration-300" 
                style={{ width: `${tempWeightPercentages.uts}%` }} 
                title={`UTS: ${tempWeightPercentages.uts}%`} 
              />
              <div 
                className="bg-sky-500 h-full transition-all duration-300" 
                style={{ width: `${tempWeightPercentages.uas}%` }} 
                title={`UAS: ${tempWeightPercentages.uas}%`} 
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <strong className="text-emerald-300">UH: {tempWeightPercentages.uh}%</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <strong className="text-amber-300">UTS: {tempWeightPercentages.uts}%</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <strong className="text-sky-300">UAS: {tempWeightPercentages.uas}%</strong>
              </span>
            </div>
          </div>

          {/* Individual Weight Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* 1. Bobot Nilai Harian (UH) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                  <BookOpen className="w-4 h-4" />
                  <span>Bobot Nilai Harian (UH)</span>
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  {tempWeightPercentages.uh}%
                </span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={tempWeights.uh}
                onChange={(e) => setTempWeights(prev => ({ ...prev, uh: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center text-sm rounded-xl py-2.5 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500">Rata-rata dari nilai UH 1 s/d UH 6</p>
            </div>

            {/* 2. Bobot Nilai UTS */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                  <Calculator className="w-4 h-4" />
                  <span>Bobot Nilai UTS</span>
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  {tempWeightPercentages.uts}%
                </span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={tempWeights.uts}
                onChange={(e) => setTempWeights(prev => ({ ...prev, uts: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center text-sm rounded-xl py-2.5 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-500">Penilaian Tengah Semester (PTS/STS)</p>
            </div>

            {/* 3. Bobot Nilai UAS */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sky-400 flex items-center gap-1.5 text-xs">
                  <Award className="w-4 h-4" />
                  <span>Bobot Nilai UAS</span>
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
                  {tempWeightPercentages.uas}%
                </span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={tempWeights.uas}
                onChange={(e) => setTempWeights(prev => ({ ...prev, uas: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center text-sm rounded-xl py-2.5 focus:outline-none focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-500">Penilaian Akhir Semester (PAS/SAS)</p>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setTempWeights({ uh: 40, uts: 30, uas: 30 })}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Reset Default (40:30:30)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleApplyWeights(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Terapkan Saja
              </button>

              <button
                type="button"
                onClick={() => handleApplyWeights(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                <span>Terapkan & Hitung Ulang Nilai Akhir</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMENU 3: REKAP CETAK FORMAT RESMI                                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'cetak-rekap' && (
        <PenilaianPrintDocument
          settings={settings}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          availableClasses={availableClasses}
          semester={semester}
          tahunAjaran={tahunAjaran}
          mapel={mapel}
          uhMeta={uhMeta}
          ptsDate={ptsDate}
          pasDate={pasDate}
          tableRows={tableRows}
          studentGrades={studentGrades}
          weightPercentages={weightPercentages}
          customKotaTandaTangan={customKotaTandaTangan}
          setCustomKotaTandaTangan={setCustomKotaTandaTangan}
          today={today}
          onExportCSV={handleExportCSV}
          onPrint={handleTriggerPrint}
        />
      )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
};
