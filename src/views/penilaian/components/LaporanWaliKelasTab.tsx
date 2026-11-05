import React, { useState, useMemo, useEffect } from 'react';
import { 
  Award, Printer, Download, Share2, Check, Search, 
  AlertTriangle, CheckCircle2, XCircle, Users, BookOpen, 
  Sparkles, UserX, Clock, UserCheck, ShieldCheck, Lock
} from 'lucide-react';
import { 
  AppSettings, Student, DailyGradeItem, AssessmentType, 
  StudentAssessmentStatus 
} from '../../../types';
import { OfficialKopSurat } from '../../../components/print/OfficialKopSurat';
import { formatIndonesianDayAndDate, formatDateDMY } from '../../../utils/formatters';
import { printElementById } from '../../../utils/printHelper';

interface ActiveAssessmentInfo {
  key: AssessmentType;
  label: string;
  shortLabel: string;
  date: string;
  materi: string;
  hasScores: boolean;
  hasDate: boolean;
  scoreCount: number;
}

interface LaporanWaliKelasTabProps {
  settings: AppSettings;
  students: Student[];
  selectedClass: string;
  setSelectedClass: (cls: string) => void;
  availableClasses: string[];
  semester: string;
  tahunAjaran: string;
  mapel: string;
  uhMeta: { [key: number]: { date: string; materi: string } };
  ptsDate?: string;
  pasDate?: string;
  studentGrades: { [studentId: string]: DailyGradeItem };
  studentAssessmentStatus?: { [key: string]: StudentAssessmentStatus };
  weightPercentages: { uh: number; uts: number; uas: number };
  customKotaTandaTangan: string;
  setCustomKotaTandaTangan: (val: string) => void;
  today: string;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onNavigateToInputNilai?: () => void;
  onNavigateToStatusPenilaian?: () => void;
}

export const LaporanWaliKelasTab: React.FC<LaporanWaliKelasTabProps> = ({
  settings,
  students,
  selectedClass,
  setSelectedClass,
  availableClasses,
  semester,
  tahunAjaran,
  mapel,
  uhMeta,
  ptsDate,
  pasDate,
  studentGrades,
  studentAssessmentStatus = {},
  customKotaTandaTangan,
  setCustomKotaTandaTangan,
  today,
  showToast,
  onNavigateToInputNilai,
  onNavigateToStatusPenilaian
}) => {
  // Purge any dummy classes permanently: 'X IPA 1', 'X IPA 2', 'XI IPS 1', 'XI IPS 2'
  const DUMMY_CLASSES_SET = useMemo(() => new Set(['X IPA 1', 'X IPA 2', 'XI IPS 1', 'XI IPS 2']), []);

  const cleanAvailableClasses = useMemo(() => {
    return availableClasses.filter(c => c && !DUMMY_CLASSES_SET.has(c.trim()));
  }, [availableClasses, DUMMY_CLASSES_SET]);

  // Synchronize selectedClass if invalid or pointing to dummy class
  useEffect(() => {
    if (cleanAvailableClasses.length > 0) {
      if (!selectedClass || DUMMY_CLASSES_SET.has(selectedClass) || !cleanAvailableClasses.includes(selectedClass)) {
        setSelectedClass(cleanAvailableClasses[0]);
      }
    } else if (selectedClass && DUMMY_CLASSES_SET.has(selectedClass)) {
      setSelectedClass('');
    }
  }, [cleanAvailableClasses, selectedClass, setSelectedClass, DUMMY_CLASSES_SET]);

  // Dynamic filter: whether to only show active (filled) assessments or the entire 6 UH template
  const [onlyActiveAssessments, setOnlyActiveAssessments] = useState<boolean>(true);

  // Filter student rows: 'ALL' | 'BELUM_UJIAN' | 'SUDAH_UJIAN'
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BELUM_UJIAN' | 'SUDAH_UJIAN'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editable homeroom teacher (Wali Kelas) name and NIP for signature
  const defaultWaliKelasInfo = useMemo(() => {
    if (settings.additionalDuties) {
      const match = settings.additionalDuties.find(
        d => d.isActive && d.name.toLowerCase().includes('wali') && d.name.includes(selectedClass)
      );
      if (match) {
        return {
          name: settings.namaGuru || 'Wali Kelas',
          nip: settings.nip ? (settings.nip.startsWith('NIP') ? settings.nip : `NIP. ${settings.nip}`) : ''
        };
      }
    }
    return { name: '', nip: '' };
  }, [settings.additionalDuties, settings.namaGuru, settings.nip, selectedClass]);

  const [waliKelasName, setWaliKelasName] = useState<string>(defaultWaliKelasInfo.name);
  const [waliKelasNip, setWaliKelasNip] = useState<string>(defaultWaliKelasInfo.nip);

  // Synchronize when selectedClass changes if values were default or empty
  useEffect(() => {
    if (defaultWaliKelasInfo.name && !waliKelasName) {
      setWaliKelasName(defaultWaliKelasInfo.name);
    }
    if (defaultWaliKelasInfo.nip && !waliKelasNip) {
      setWaliKelasNip(defaultWaliKelasInfo.nip);
    }
  }, [selectedClass, defaultWaliKelasInfo]);

  const [copiedWA, setCopiedWA] = useState<boolean>(false);

  // Filter real students for the selected class (strictly excluding any dummy classes)
  const classStudents = useMemo(() => {
    if (!selectedClass || DUMMY_CLASSES_SET.has(selectedClass)) return [];
    return students
      .filter(s => s.class === selectedClass && !DUMMY_CLASSES_SET.has(s.class))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClass, DUMMY_CLASSES_SET]);

  // Assessment master catalogue (UH 1..6, PTS, PAS)
  const allAssessments: { key: AssessmentType; label: string; shortLabel: string; uhIndex?: number }[] = useMemo(() => [
    { key: 'uh1', label: 'Ulangan Harian 1', shortLabel: 'UH 1', uhIndex: 1 },
    { key: 'uh2', label: 'Ulangan Harian 2', shortLabel: 'UH 2', uhIndex: 2 },
    { key: 'uh3', label: 'Ulangan Harian 3', shortLabel: 'UH 3', uhIndex: 3 },
    { key: 'uh4', label: 'Ulangan Harian 4', shortLabel: 'UH 4', uhIndex: 4 },
    { key: 'uh5', label: 'Ulangan Harian 5', shortLabel: 'UH 5', uhIndex: 5 },
    { key: 'uh6', label: 'Ulangan Harian 6', shortLabel: 'UH 6', uhIndex: 6 },
    { key: 'uts', label: 'Penilaian Tengah Semester', shortLabel: 'PTS / UTS' },
    { key: 'uas', label: 'Penilaian Akhir Semester', shortLabel: 'PAS / SAS' },
  ], []);

  // Helper to extract assessment metadata
  const getAssessmentDetails = (target: AssessmentType): { date: string; materi: string } => {
    if (target.startsWith('uh')) {
      const idx = parseInt(target.replace('uh', ''), 10);
      return {
        date: uhMeta[idx]?.date || '',
        materi: uhMeta[idx]?.materi || ''
      };
    }
    if (target === 'uts') return { date: ptsDate || '', materi: 'Penilaian Tengah Semester' };
    if (target === 'uas') return { date: pasDate || '', materi: 'Penilaian Akhir Semester' };
    return { date: '', materi: '' };
  };

  // Compile active assessment list (the core dynamic compilation!)
  const assessmentCompilation: ActiveAssessmentInfo[] = useMemo(() => {
    return allAssessments.map(item => {
      const meta = getAssessmentDetails(item.key);
      let count = 0;
      classStudents.forEach(st => {
        const sc = studentGrades[st.id]?.[item.key];
        const explicit = studentAssessmentStatus[`${st.id}_${item.key}`]?.status;
        if ((sc !== undefined && sc !== null && sc.trim() !== '') || explicit === 'Sudah Mengikuti') {
          count++;
        }
      });
      const hasDate = Boolean(meta.date && meta.date.trim() !== '');
      const hasScores = count > 0;
      return {
        key: item.key,
        label: item.label,
        shortLabel: item.shortLabel,
        date: meta.date,
        materi: meta.materi,
        hasScores,
        hasDate,
        scoreCount: count
      };
    });
  }, [allAssessments, classStudents, studentGrades, studentAssessmentStatus, uhMeta, ptsDate, pasDate]);

  // Visible assessments based on smart toggle (Only active or all 6)
  const visibleAssessments = useMemo(() => {
    if (onlyActiveAssessments) {
      // Must have date OR at least one student score recorded
      return assessmentCompilation.filter(a => a.hasDate || a.hasScores);
    }
    return assessmentCompilation;
  }, [onlyActiveAssessments, assessmentCompilation]);

  // Evaluated student participation analysis (100% blind to raw numbers!)
  interface StudentParticipationAnalysis {
    student: Student;
    attendanceMap: Record<AssessmentType, boolean>;
    missingAssessments: ActiveAssessmentInfo[];
    completedAssessments: ActiveAssessmentInfo[];
    isAllCompleted: boolean;
    hasMissing: boolean;
    statusUjianText: 'SUDAH UJIAN' | 'BELUM UJIAN' | 'BELUM ADA UJIAN';
    himbauanSusulan: string;
  }

  const studentParticipationList = useMemo<StudentParticipationAnalysis[]>(() => {
    // Only check against assessments that have a date set or scores recorded
    const activeTestItems = assessmentCompilation.filter(a => a.hasDate || a.hasScores);

    return classStudents.map(student => {
      const grades = studentGrades[student.id] || {};
      const attendanceMap: Record<AssessmentType, boolean> = {
        uh1: false, uh2: false, uh3: false, uh4: false,
        uh5: false, uh6: false, uts: false, uas: false
      };

      const missingAssessments: ActiveAssessmentInfo[] = [];
      const completedAssessments: ActiveAssessmentInfo[] = [];

      activeTestItems.forEach(test => {
        const raw = grades[test.key];
        const explicitStatus = studentAssessmentStatus[`${student.id}_${test.key}`]?.status;
        const hasScore = raw !== undefined && raw !== null && raw.trim() !== '';
        const isAttended = hasScore || explicitStatus === 'Sudah Mengikuti';

        attendanceMap[test.key] = isAttended;

        if (isAttended) {
          completedAssessments.push(test);
        } else {
          missingAssessments.push(test);
        }
      });

      const hasMissing = missingAssessments.length > 0;
      const isAllCompleted = activeTestItems.length > 0 && !hasMissing;

      let statusUjianText: 'SUDAH UJIAN' | 'BELUM UJIAN' | 'BELUM ADA UJIAN' = 'BELUM ADA UJIAN';
      if (activeTestItems.length === 0) {
        statusUjianText = 'BELUM ADA UJIAN';
      } else if (hasMissing) {
        statusUjianText = 'BELUM UJIAN';
      } else {
        statusUjianText = 'SUDAH UJIAN';
      }

      // Generate action note for Wali Kelas
      let himbauanSusulan = '';
      if (activeTestItems.length === 0) {
        himbauanSusulan = 'Belum ada ulangan dijadwalkan';
      } else if (missingAssessments.length > 0) {
        himbauanSusulan = `Wajib Susulan: ${missingAssessments.map(m => m.shortLabel).join(', ')}`;
      } else {
        himbauanSusulan = 'Lengkap (Semua ulangan sudah diikuti)';
      }

      return {
        student,
        attendanceMap,
        missingAssessments,
        completedAssessments,
        isAllCompleted,
        hasMissing,
        statusUjianText,
        himbauanSusulan
      };
    });
  }, [classStudents, assessmentCompilation, studentGrades, studentAssessmentStatus]);

  // Filtered rows for on-screen display
  const filteredStudents = useMemo(() => {
    return studentParticipationList.filter(item => {
      // 1. Status filter
      if (statusFilter === 'BELUM_UJIAN' && !item.hasMissing) return false;
      if (statusFilter === 'SUDAH_UJIAN' && !item.isAllCompleted) return false;

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (item.student.name || '').toLowerCase().includes(q);
        const matchNisn = (item.student.nisn || '').includes(q);
        if (!matchName && !matchNisn) return false;
      }
      return true;
    });
  }, [studentParticipationList, statusFilter, searchQuery]);

  // Class Summary Statistics
  const summaryStats = useMemo(() => {
    const total = classStudents.length;
    let lengkap = 0;
    let susulan = 0;

    studentParticipationList.forEach(item => {
      if (item.isAllCompleted) lengkap++;
      if (item.hasMissing) susulan++;
    });

    const activeTestsCount = assessmentCompilation.filter(a => a.hasDate || a.hasScores).length;
    const participationRate = total > 0 ? Math.round((lengkap / total) * 100) : 0;

    return {
      total,
      lengkap,
      susulan,
      activeTestsCount,
      participationRate
    };
  }, [classStudents, studentParticipationList, assessmentCompilation]);

  // Generate WhatsApp message copy for Wali Kelas (strictly no confidential marks exposed)
  const handleCopyWhatsAppBrief = () => {
    const activeTests = assessmentCompilation.filter(a => a.hasDate || a.hasScores);
    const dateFormatted = formatIndonesianDayAndDate(today).fullString;

    let text = `*PEMBERITAHUAN SUSULAN ULANGAN HARIAN KE WALI KELAS*\n`;
    text += `🏫 *Sekolah:* ${settings.sekolah}\n`;
    text += `👥 *Kelas:* ${selectedClass}\n`;
    text += `📚 *Mata Pelajaran:* ${mapel}\n`;
    text += `👨‍🏫 *Guru Pengampu:* ${settings.namaGuru || 'Guru Mapel'}\n`;
    text += `📅 *Semester / TA:* ${semester} / ${tahunAjaran}\n`;
    text += `📆 *Tanggal Laporan:* ${dateFormatted}\n\n`;

    text += `📌 *ULANGAN YANG SUDAH TERLAKSANA:*\n`;
    if (activeTests.length === 0) {
      text += `_(Belum ada ulangan harian yang memiliki tanggal pelaksanaan)_\n\n`;
    } else {
      activeTests.forEach((t, i) => {
        const dStr = t.date ? formatDateDMY(t.date) : 'Belum diisi tgl';
        const mat = t.materi ? ` (${t.materi})` : '';
        text += `${i + 1}. *${t.shortLabel}* - Tgl: ${dStr}${mat}\n`;
      });
      text += `\n`;
    }

    text += `📊 *RINGKASAN KEIKUTSERTAAN KELAS:*\n`;
    text += `• Total Siswa: ${summaryStats.total} orang\n`;
    text += `• Sudah Mengikuti Semua Ujian: ${summaryStats.lengkap} orang (${summaryStats.participationRate}%)\n`;
    text += `• Belum Mengikuti (Wajib Susulan): ${summaryStats.susulan} orang\n\n`;

    // Siswa Perlu Susulan
    const needSusulanList = studentParticipationList.filter(s => s.hasMissing);
    text += `⚠️ *DAFTAR SISWA YANG BELUM MENGIKUTI UJIAN (PERLU SUSULAN):*\n`;
    if (needSusulanList.length === 0) {
      text += `✅ Nihil (Alhamdulillah, seluruh siswa di kelas ${selectedClass} sudah mengikuti semua ulangan yang terlaksana).\n\n`;
    } else {
      needSusulanList.forEach((s, i) => {
        const missing = s.missingAssessments.map(m => m.shortLabel).join(', ');
        text += `${i + 1}. *${s.student.name}* -> Belum: *${missing}*\n`;
      });
      text += `\n`;
    }

    text += `Mohon bantuan Bapak/Ibu Wali Kelas untuk mengingatkan peserta didik di atas agar segera berkoordinasi dengan guru mata pelajaran guna mengikuti ujian susulan. Terima kasih atas kerja samanya. 🙏`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedWA(true);
      showToast('Ringkasan Susulan untuk Wali Kelas berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopiedWA(false), 3000);
    }).catch(() => {
      showToast('Gagal menyalin ringkasan WhatsApp.', 'error');
    });
  };

  // Export CSV for Homeroom Teacher (strictly without raw grades)
  const handleExportCSV = () => {
    if (classStudents.length === 0) {
      showToast('Tidak ada data siswa untuk diekspor.', 'warning');
      return;
    }

    let csv = `LAPORAN KEIKUTSERTAAN PENILAIAN HARIAN KE WALI KELAS\n`;
    csv += `Sekolah,${settings.sekolah}\n`;
    csv += `Kelas,${selectedClass}\n`;
    csv += `Mata Pelajaran,${mapel}\n`;
    csv += `Guru Pengampu,${settings.namaGuru || '-'}\n`;
    csv += `Wali Kelas,${waliKelasName || '-'}${waliKelasNip ? ` (${waliKelasNip.toUpperCase().startsWith('NIP') ? waliKelasNip : `NIP. ${waliKelasNip}`})` : ''}\n`;
    csv += `Semester,${semester}\n`;
    csv += `Tahun Ajaran,${tahunAjaran}\n`;
    csv += `Keterangan,Status Keikutsertaan Ujian (Kerahasiaan Nilai Tetap Terjaga)\n\n`;

    // Headers with active assessments only
    const headerCols = ['NO', 'NAMA SISWA', 'NISN', 'L/P'];
    visibleAssessments.forEach(a => {
      headerCols.push(`"${a.shortLabel} (${formatDateDMY(a.date) || '-'})"`);
    });
    headerCols.push('STATUS UJIAN', 'CATATAN SUSULAN WALI KELAS');
    csv += headerCols.join(',') + '\n';

    studentParticipationList.forEach((item, idx) => {
      const row = [
        idx + 1,
        `"${item.student.name}"`,
        `'${item.student.nisn || ''}`,
        item.student.gender || 'L'
      ];

      visibleAssessments.forEach(a => {
        const isAttended = item.attendanceMap[a.key];
        row.push(isAttended ? 'Sudah' : 'Belum (Susulan)');
      });

      row.push(
        item.statusUjianText,
        `"${item.himbauanSusulan}"`
      );

      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Keikutsertaan_Ujian_${selectedClass.replace(/\s+/g, '_')}_${semester}_${tahunAjaran.replace('/', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV Keikutsertaan Ujian berhasil diunduh.', 'success');
  };

  // Print Document Trigger
  const handleTriggerPrint = () => {
    showToast('Menyiapkan dokumen Laporan Wali Kelas...', 'info');
    printElementById('printable-laporan-wali-kelas', {
      title: `Laporan Keikutsertaan Ujian Siswa - ${selectedClass}`,
      orientation: 'landscape',
      pageMargin: '8mm'
    });
  };

  const dayDate = formatIndonesianDayAndDate(today);
  const signatureDate = `${customKotaTandaTangan || settings.kotaTandaTangan || 'Bula'}, ${dayDate.fullString.split(', ')[1] || today}`;

  return (
    <div className="space-y-6">
      
      {/* 1. Fast Class Selection Bar (Purged of all dummy classes) */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Pilih Kelas Penerima Laporan:
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Hanya kelas resmi dari data siswa yang muncul (kelas dummy/siluman telah dibersihkan permanen)
          </span>
        </div>

        {cleanAvailableClasses.length === 0 ? (
          <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-2xl text-center space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">Belum ada kelas siswa terdaftar</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Silakan tambahkan data peserta didik atau impor CSV di menu <strong>Data Siswa &rarr; Tambah Siswa</strong>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
            {cleanAvailableClasses.map(cls => {
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
                  <div className={`text-[10px] ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                    {count} Peserta Didik
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Intelligence & Control Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-4 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left Settings: Confidentiality Mode Badge & Smart Column Switch */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Confidentiality Badge */}
            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-2 rounded-2xl text-xs text-emerald-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Kerahasiaan Nilai Aktif (Nilai Angka Dirahasiakan)</span>
            </div>

            {/* Smart Column Filter Switch */}
            <button
              type="button"
              onClick={() => setOnlyActiveAssessments(!onlyActiveAssessments)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                onlyActiveAssessments
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Jika aktif, kolom UH yang belum diisi tanggal pelaksanaan akan disembunyikan otomatis"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {onlyActiveAssessments 
                  ? 'Filter Kolom: AKTIF (Hanya UH Terlaksana)' 
                  : 'Filter Kolom: NONAKTIF (Tampilkan UH 1-6)'}
              </span>
            </button>

            {/* Nama Wali Kelas Input */}
            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Wali Kelas:</span>
              <input
                type="text"
                value={waliKelasName}
                onChange={(e) => setWaliKelasName(e.target.value)}
                placeholder="Nama Wali Kelas"
                className="bg-transparent text-white text-xs w-36 focus:outline-none placeholder-slate-600"
              />
            </div>

            {/* NIP Wali Kelas Input (Dapat Diedit Manual Sebelum Dicetak) */}
            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">NIP:</span>
              <input
                type="text"
                value={waliKelasNip}
                onChange={(e) => setWaliKelasNip(e.target.value)}
                placeholder="NIP Wali Kelas / -"
                className="bg-transparent text-white text-xs w-36 font-mono focus:outline-none placeholder-slate-600"
                title="Nomor Induk Pegawai (NIP/NUPTK) Wali Kelas untuk pengesahan tanda tangan"
              />
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Salin WA Button */}
            <button
              type="button"
              onClick={handleCopyWhatsAppBrief}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                copiedWA
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
              }`}
              title="Salin daftar siswa yang belum ujian dalam format WhatsApp untuk dikirim langsung ke grup / chat Wali Kelas"
            >
              {copiedWA ? <Check className="w-4 h-4 stroke-[3]" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedWA ? 'Tersalin!' : 'Salin Himbauan Susulan WA'}</span>
            </button>

            {/* CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-2xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Unduh CSV</span>
            </button>

            {/* Cetak PDF Button */}
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Cetak Laporan Wali Kelas</span>
            </button>
          </div>
        </div>

        {/* Info Banner on Active Compilation */}
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Ulangan yang Terlaksana di Kelas {selectedClass || '-'}:</strong> {summaryStats.activeTestsCount} Asesmen (
              {visibleAssessments.map(a => a.shortLabel).join(', ') || 'Belum ada ulangan berjadwal'}
              ).
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToInputNilai && (
              <button
                type="button"
                onClick={onNavigateToInputNilai}
                className="text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
              >
                Input Nilai Matriks &rarr;
              </button>
            )}
            {onNavigateToStatusPenilaian && (
              <button
                type="button"
                onClick={onNavigateToStatusPenilaian}
                className="text-sky-400 hover:text-sky-300 underline font-semibold cursor-pointer ml-2"
              >
                Update Status Partisipasi &rarr;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Executive Metric Cards for Wali Kelas (Focused on Participation & Susulan) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-medium">TOTAL SISWA KELAS</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{summaryStats.total}</span>
            <span className="text-xs text-slate-500">Siswa</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-medium">ULANGAN TERLAKSANA</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-indigo-400">{summaryStats.activeTestsCount}</span>
            <span className="text-xs text-slate-500">Asesmen</span>
          </div>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl">
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SUDAH MENGIKUTI SEMUA</span>
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-400">{summaryStats.lengkap}</span>
            <span className="text-xs text-emerald-300/70 font-semibold">{summaryStats.participationRate}%</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          summaryStats.susulan > 0 
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' 
            : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}>
          <span className="text-[11px] font-medium flex items-center gap-1">
            <XCircle className={`w-3.5 h-3.5 ${summaryStats.susulan > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
            <span>BELUM UJIAN / SUSULAN</span>
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-2xl font-black ${summaryStats.susulan > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {summaryStats.susulan}
            </span>
            <span className="text-xs font-semibold">
              {summaryStats.susulan > 0 ? 'Wajib Diingatkan' : 'Nihil'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-medium">TINGKAT PARTISIPASI</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-sky-400 font-mono">{summaryStats.participationRate}%</span>
            <span className="text-xs text-slate-500">Tuntas Ujian</span>
          </div>
        </div>
      </div>

      {/* 4. On-Screen Dynamic Table with Dedicated 'Status Ujian' Visual Indicators */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <h4 className="font-extrabold text-sm text-white">
              Tabel Keikutsertaan Ujian Siswa Kelas {selectedClass}
            </h4>
            <span className="text-xs text-slate-400">
              ({filteredStudents.length} dari {classStudents.length} siswa)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter buttons */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua Siswa ({studentParticipationList.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('BELUM_UJIAN')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'BELUM_UJIAN' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-rose-300'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Belum Ujian / Susulan ({summaryStats.susulan})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('SUDAH_UJIAN')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'SUDAH_UJIAN' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sudah Ujian Lengkap ({summaryStats.lengkap})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama / NISN..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 text-center w-12 font-bold">NO</th>
                <th className="py-3 px-4 font-bold min-w-[190px]">NAMA SISWA</th>
                <th className="py-3 px-2 text-center w-12 font-bold">L/P</th>
                
                {/* Dynamically Rendered Active Assessment Columns with Visual Indicators */}
                {visibleAssessments.map(a => (
                  <th key={a.key} className="py-2.5 px-3 text-center border-l border-slate-800/80 min-w-[100px]">
                    <div className="font-extrabold text-emerald-400">{a.shortLabel}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {a.date ? formatDateDMY(a.date) : 'Tgl: -'}
                    </div>
                  </th>
                ))}

                {/* Kolom Khusus: STATUS UJIAN (Dengan Indikator Visual Ceklis/Silang) */}
                <th className="py-3 px-4 text-center font-bold border-l border-slate-800 min-w-[140px] bg-slate-950/90 text-amber-300">
                  STATUS UJIAN
                </th>

                {/* Catatan Tindak Lanjut Wali Kelas */}
                <th className="py-3 px-4 font-bold border-l border-slate-800 min-w-[190px]">
                  CATATAN / TINDAK LANJUT WALI KELAS
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5 + visibleAssessments.length} className="text-center py-8 text-slate-500">
                    Tidak ada siswa yang sesuai dengan filter atau kelas ini belum memiliki siswa.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((item, idx) => {
                  return (
                    <tr key={item.student.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        <div>{item.student.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          NISN: {item.student.nisn || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-400 font-medium">
                        {item.student.gender || 'L'}
                      </td>

                      {/* Active assessment indicators: Ceklis Hijau jika sudah, Silang Merah jika belum */}
                      {visibleAssessments.map(a => {
                        const isAttended = item.attendanceMap[a.key];

                        return (
                          <td 
                            key={a.key} 
                            className={`py-2.5 px-3 text-center border-l border-slate-800/60 ${
                              isAttended ? 'bg-emerald-950/15' : 'bg-rose-950/20'
                            }`}
                          >
                            {isAttended ? (
                              <span 
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30"
                                title={`${item.student.name} sudah mengikuti ${a.shortLabel}`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Sudah</span>
                              </span>
                            ) : (
                              <span 
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/30 animate-pulse"
                                title={`${item.student.name} belum mengikuti ${a.shortLabel} (Perlu Susulan)`}
                              >
                                <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Susulan</span>
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Dedicated 'STATUS UJIAN' Column (Visual Ceklis / Silang Ringkasan) */}
                      <td className="py-3 px-4 text-center border-l border-slate-800">
                        {item.statusUjianText === 'SUDAH UJIAN' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                            <span>Sudah Ujian</span>
                          </span>
                        )}
                        {item.statusUjianText === 'BELUM UJIAN' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black text-rose-300 bg-rose-500/15 border border-rose-500/30 shadow-sm animate-pulse">
                            <XCircle className="w-4 h-4 text-rose-400 stroke-[2.5]" />
                            <span>Belum Ujian</span>
                          </span>
                        )}
                        {item.statusUjianText === 'BELUM ADA UJIAN' && (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>

                      {/* Notes / Action for Wali Kelas */}
                      <td className="py-3 px-4 border-l border-slate-800 text-xs">
                        {item.hasMissing ? (
                          <span className="font-bold text-rose-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>{item.himbauanSusulan}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{item.himbauanSusulan}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Official Print Layout (Ready for Print / PDF with Ceklis & Silang) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Pratinjau Lembar Cetak Dokumen Resmi Keikutsertaan Ujian untuk Wali Kelas:
            </h4>
          </div>
          <button
            type="button"
            onClick={handleTriggerPrint}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
          >
            Cetak Sekarang &rarr;
          </button>
        </div>

        {/* Printable Canvas with Standard School Letterhead */}
        <div className="bg-white text-black p-6 sm:p-10 rounded-2xl shadow-2xl border border-slate-200 overflow-x-auto font-serif leading-tight">
          <div 
            id="printable-laporan-wali-kelas" 
            className="min-w-[850px] w-full text-black bg-white mx-auto font-serif text-[11px] leading-tight"
          >
            {/* Kop Surat Resmi */}
            <OfficialKopSurat settings={settings} />

            {/* Document Title */}
            <div style={{ textAlign: 'center', marginTop: '12px', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '15px', fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase', margin: 0 }}>
                LAPORAN KEIKUTSERTAAN PENILAIAN HARIAN SISWA KEPADA WALI KELAS
              </h1>
              <p style={{ fontSize: '11px', color: '#334155', marginTop: '4px', fontStyle: 'italic' }}>
                Rekapitulasi Partisipasi Ujian Peserta Didik untuk Tindak Lanjut & Jadwal Susulan
              </p>
            </div>

            {/* Metadata Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginBottom: '14px', fontSize: '11px' }}>
              <tbody>
                <tr>
                  {/* Left Column */}
                  <td style={{ width: '50%', verticalAlign: 'top', border: 'none', padding: 0 }}>
                    <table style={{ borderCollapse: 'collapse', border: 'none', width: 'auto' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '110px', border: 'none', padding: '2px 0', fontWeight: 'bold' }}>Kelas</td>
                          <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                          <td style={{ border: 'none', padding: '2px 0 2px 4px', fontWeight: 'bold' }}>{selectedClass}</td>
                        </tr>
                        <tr>
                          <td style={{ width: '110px', border: 'none', padding: '2px 0', fontWeight: 'bold' }}>Semester</td>
                          <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                          <td style={{ border: 'none', padding: '2px 0 2px 4px' }}>{semester}</td>
                        </tr>
                        <tr>
                          <td style={{ width: '110px', border: 'none', padding: '2px 0', fontWeight: 'bold' }}>Wali Kelas</td>
                          <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                          <td style={{ border: 'none', padding: '2px 0 2px 4px', fontWeight: 'bold' }}>
                            {waliKelasName || '-'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>

                  {/* Right Column */}
                  <td style={{ width: '50%', verticalAlign: 'top', border: 'none', padding: 0 }}>
                    <table style={{ borderCollapse: 'collapse', border: 'none', width: 'auto', marginLeft: 'auto' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '110px', border: 'none', padding: '2px 0', fontWeight: 'bold' }}>Mata Pelajaran</td>
                          <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                          <td style={{ border: 'none', padding: '2px 0 2px 4px', fontWeight: 'bold' }}>{mapel}</td>
                        </tr>
                        <tr>
                          <td style={{ width: '110px', border: 'none', padding: '2px 0', fontWeight: 'bold' }}>Tahun Ajaran</td>
                          <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                          <td style={{ border: 'none', padding: '2px 0 2px 4px' }}>{tahunAjaran}</td>
                        </tr>
                        <tr>
                          <td style={{ width: '110px', border: 'none', padding: '2px 0', fontWeight: 'bold' }}>Guru Pengampu</td>
                          <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                          <td style={{ border: 'none', padding: '2px 0 2px 4px' }}>{settings.namaGuru || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Dynamic Grid Table (Ceklis / Silang Only, No Numerical Scores!) */}
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', marginBottom: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th rowSpan={2} style={{ border: '1px solid #000', padding: '4px', width: '30px', verticalAlign: 'middle' }}>NO</th>
                  <th rowSpan={2} style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left', width: '180px', verticalAlign: 'middle' }}>NAMA SISWA</th>
                  <th rowSpan={2} style={{ border: '1px solid #000', padding: '4px', width: '32px', verticalAlign: 'middle' }}>L/P</th>
                  
                  {/* Dynamic Assessment Columns with Date Subheader */}
                  {visibleAssessments.map(a => (
                    <th key={a.key} style={{ border: '1px solid #000', padding: '4px', minWidth: '60px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>{a.shortLabel}</div>
                      <div style={{ fontSize: '8px', color: '#475569', fontWeight: 'normal', marginTop: '1px' }}>
                        {a.date ? formatDateDMY(a.date) : '-'}
                      </div>
                    </th>
                  ))}

                  <th rowSpan={2} style={{ border: '1px solid #000', padding: '4px', width: '90px', verticalAlign: 'middle' }}>STATUS UJIAN</th>
                  <th rowSpan={2} style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left', width: '180px', verticalAlign: 'middle' }}>CATATAN TINDAK LANJUT WALI KELAS</th>
                </tr>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {visibleAssessments.map(a => (
                    <th key={a.key} style={{ border: '1px solid #000', padding: '2px', fontSize: '8px', fontWeight: 'normal', color: '#64748b' }}>
                      Status
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {studentParticipationList.map((item, idx) => (
                  <tr key={item.student.id} style={{ height: '22px' }}>
                    <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '2px 6px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      {item.student.name}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>
                      {item.student.gender || 'L'}
                    </td>

                    {/* Active Tests Ceklis/Silang Visuals */}
                    {visibleAssessments.map(a => {
                      const isAttended = item.attendanceMap[a.key];
                      return (
                        <td 
                          key={a.key} 
                          style={{ 
                            border: '1px solid #000', 
                            padding: '2px', 
                            textAlign: 'center',
                            fontWeight: 'bold',
                            backgroundColor: isAttended ? '#f0fdf4' : '#fff1f2',
                            color: isAttended ? '#15803d' : '#b91c1c'
                          }}
                        >
                          {isAttended ? '✔ Sudah' : '✘ Susulan'}
                        </td>
                      );
                    })}

                    {/* Status Ujian Column */}
                    <td 
                      style={{ 
                        border: '1px solid #000', 
                        padding: '2px 4px', 
                        textAlign: 'center',
                        fontSize: '9.5px',
                        fontWeight: 'bold',
                        backgroundColor: item.statusUjianText === 'SUDAH UJIAN' ? '#f0fdf4' : '#fff1f2',
                        color: item.statusUjianText === 'SUDAH UJIAN' ? '#15803d' : '#b91c1c'
                      }}
                    >
                      {item.statusUjianText === 'SUDAH UJIAN' ? '✔ SUDAH UJIAN' : '✘ BELUM UJIAN'}
                    </td>

                    {/* Catatan Himbauan Susulan */}
                    <td style={{ border: '1px solid #000', padding: '2px 6px', textAlign: 'left', fontSize: '9px', fontWeight: item.hasMissing ? 'bold' : 'normal', color: item.hasMissing ? '#b91c1c' : '#000' }}>
                      {item.himbauanSusulan}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Recapitulation Summary Box for Wali Kelas */}
            <div style={{ border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '4px', marginBottom: '16px', fontSize: '10px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                REKAPITULASI KEIKUTSERTAAN UNTUK TINDAK LANJUT WALI KELAS:
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>1. Total Siswa Kelas: <strong>{summaryStats.total} orang</strong></div>
                <div>2. Sudah Mengikuti Semua Ujian: <strong style={{ color: '#15803d' }}>{summaryStats.lengkap} orang ({summaryStats.participationRate}%)</strong></div>
                <div>3. Belum Ujian / Wajib Susulan: <strong style={{ color: '#b91c1c' }}>{summaryStats.susulan} orang</strong></div>
                <div>4. Tingkat Partisipasi Ujian: <strong>{summaryStats.participationRate}%</strong></div>
              </div>
            </div>

            {/* Triple Official Signature Block: Kepala Sekolah, Wali Kelas, Guru Mapel */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '24px', fontSize: '11px', textAlign: 'center' }}>
              
              {/* Left: Kepala Sekolah */}
              <div style={{ width: '30%' }}>
                <p style={{ margin: '2px 0' }}>Mengetahui,</p>
                <p style={{ fontWeight: 'bold', margin: '2px 0' }}>{settings.jabatanKepalaSekolah || 'Kepala Sekolah'}</p>
                <div style={{ height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {settings.ttdKepalaSekolahUrl && (
                    <img src={settings.ttdKepalaSekolahUrl} alt="TTD Kepala Sekolah" style={{ maxHeight: '50px', maxWidth: '140px', objectFit: 'contain' }} />
                  )}
                </div>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: '2px 0' }}>
                  {settings.namaKepalaSekolah || 'Drs. H. Ahmad Dahlan, M.Pd'}
                </p>
                <p style={{ fontFamily: 'monospace', fontSize: '10px', margin: '2px 0' }}>
                  NIP. {settings.nipKepalaSekolah || '19700101 199503 1 001'}
                </p>
              </div>

              {/* Center: Wali Kelas */}
              <div style={{ width: '30%' }}>
                <p style={{ margin: '2px 0' }}>Diterima / Mengetahui,</p>
                <p style={{ fontWeight: 'bold', margin: '2px 0' }}>Wali Kelas {selectedClass}</p>
                <div style={{ height: '55px' }}></div>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: '2px 0' }}>
                  {waliKelasName || '( .................................................... )'}
                </p>
                <p style={{ fontFamily: 'monospace', fontSize: '10px', margin: '2px 0' }}>
                  {waliKelasNip 
                    ? (waliKelasNip.toUpperCase().startsWith('NIP') ? waliKelasNip : `NIP. ${waliKelasNip}`)
                    : 'NIP. -'}
                </p>
              </div>

              {/* Right: Guru Mata Pelajaran */}
              <div style={{ width: '30%' }}>
                <p style={{ margin: '2px 0' }}>{signatureDate}</p>
                <p style={{ fontWeight: 'bold', margin: '2px 0' }}>Guru Mata Pelajaran</p>
                <div style={{ height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {settings.ttdGuruUrl && (
                    <img src={settings.ttdGuruUrl} alt="TTD Guru" style={{ maxHeight: '50px', maxWidth: '140px', objectFit: 'contain' }} />
                  )}
                </div>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: '2px 0' }}>
                  {settings.namaGuru || 'Puput Eka Bajuri, S. Pd'}
                </p>
                <p style={{ fontFamily: 'monospace', fontSize: '10px', margin: '2px 0' }}>
                  NIP. {settings.nip || '198810052020121003'}
                </p>
              </div>

            </div>

          </div>
        </div>
      </div>

    </div>
  );
};
