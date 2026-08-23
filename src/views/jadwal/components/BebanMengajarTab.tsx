import React, { useState, useMemo } from 'react';
import { TeachingScheduleItem, Student, AppSettings, TeacherAdditionalDuty, ClassKokurikulerP5 } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, Scale, Clock, CheckCircle2, AlertTriangle, AlertCircle,
  Plus, Trash2, Edit3, Save, Printer, FileSpreadsheet, Calculator,
  Layers, Users, BookOpen, ChevronRight, Check, X, Sparkles,
  CalendarDays, TrendingUp, Info, HelpCircle, ExternalLink, Settings2
} from 'lucide-react';
import { formatIndonesianDayAndDate } from '../../../utils/formatters';
import { printElementById } from '../../../utils/printHelper';
import { P5KokurikulerModal } from './beban/P5KokurikulerModal';
import { P5KokurikulerSection } from './beban/P5KokurikulerSection';
import { DutyModal } from './beban/DutyModal';
import { BebanPrintDocument } from './beban/BebanPrintDocument';

interface BebanMengajarTabProps {
  teachingSchedules: TeachingScheduleItem[];
  students: Student[];
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  currentTimezone: 'WIB' | 'WITA' | 'WIT';
  today: string;
  onOpenAddSchedule?: (defaultDay?: string) => void;
  onNavigateToTab?: (tab: string, subTab?: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

// Preset Tugas Tambahan Guru standar Permendikbud No. 15 Tahun 2018 & KMA Kemenag
const DEFAULT_PRESET_DUTIES: Omit<TeacherAdditionalDuty, 'id' | 'isActive'>[] = [
  { name: 'Wali Kelas', jtmEquivalent: 2, notes: 'Pengelolaan kelas, pembinaan siswa & pengisian rapor' },
  { name: 'Pembina OSIS / Ekstrakurikuler', jtmEquivalent: 2, notes: 'Pembimbingan kegiatan kesiswaan & ekstrakurikuler' },
  { name: 'Guru Piket', jtmEquivalent: 1, notes: 'Pengawasan ketertiban, absensi & KBM harian madrasah' },
  { name: 'Kepala Laboratorium / Bengkel', jtmEquivalent: 12, notes: 'Pengelolaan laboratorium, inventaris & praktikum' },
  { name: 'Kepala Perpustakaan', jtmEquivalent: 12, notes: 'Pengelolaan pustaka, literasi & peminjaman buku' },
  { name: 'Wakil Kepala Sekolah / Madrasah', jtmEquivalent: 12, notes: 'Membantu kepala sekolah dalam bidang kurikulum/kesiswaan/sarpras' },
  { name: 'Koordinator PKG / Tim Pengembang Kurikulum', jtmEquivalent: 2, notes: 'Penyusunan KOSP/Kurikulum Merdeka & evaluasi guru' },
  { name: 'Guru Pamong / Pembimbing Magang', jtmEquivalent: 2, notes: 'Pembimbingan mahasiswa PPL atau magang industri' },
];

export const parseJp = (jamKe?: string, jtm?: number): number => {
  if (typeof jtm === 'number' && jtm > 0) return jtm;
  if (!jamKe) return 2; // Default 2 JP
  
  // Format "1 - 2", "3 - 4", "1 - 4"
  const rangeMatch = jamKe.match(/(\d+)\s*[-–—]\s*(\d+)/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      return (end - start) + 1;
    }
  }
  
  // Format single number "2", "3"
  const singleMatch = jamKe.match(/^(\d+)$/);
  if (singleMatch) {
    const num = parseInt(singleMatch[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }
  
  return 2;
};

export const BebanMengajarTab: React.FC<BebanMengajarTabProps> = ({
  teachingSchedules,
  students,
  settings,
  updateSettings,
  currentTimezone,
  today,
  onOpenAddSchedule,
  showToast
}) => {
  // Active sub-section within Beban Mengajar tab
  const [activeSection, setActiveSection] = useState<'analisis' | 'p5-kokurikuler' | 'tugas-tambahan' | 'kalkulator-honor' | 'cetak-skbk'>('analisis');

  // Duty Form Modal State
  const [isDutyModalOpen, setIsDutyModalOpen] = useState(false);
  const [editingDuty, setEditingDuty] = useState<TeacherAdditionalDuty | null>(null);

  // P5 / Kokurikuler Modal State
  const [isP5ModalOpen, setIsP5ModalOpen] = useState(false);
  const [selectedP5Kelas, setSelectedP5Kelas] = useState<string>('');

  // Honorarium simulation rate
  const [ratePerJp, setRatePerJp] = useState<number>(settings.hourlyRatePerJp || 35000);
  const [isCustomRateEditing, setIsCustomRateEditing] = useState(false);

  // Group schedules by Class (Rombel)
  const rombelList = useMemo(() => {
    const map = new Map<string, {
      kelas: string;
      mapel: string;
      totalJp: number;
      schedules: TeachingScheduleItem[];
      studentsCount: number;
      rooms: string[];
    }>();

    teachingSchedules.forEach(item => {
      const clsKey = item.kelas.trim();
      const jp = parseJp(item.jamKe, item.jtm);
      if (!map.has(clsKey)) {
        const clsStudents = students.filter(s => s.class && s.class.trim() === clsKey);
        map.set(clsKey, {
          kelas: clsKey,
          mapel: item.mapel || settings.mataPelajaran || 'Mata Pelajaran',
          totalJp: jp,
          schedules: [item],
          studentsCount: clsStudents.length,
          rooms: item.room ? [item.room] : []
        });
      } else {
        const existing = map.get(clsKey)!;
        existing.totalJp += jp;
        existing.schedules.push(item);
        if (item.room && !existing.rooms.includes(item.room)) {
          existing.rooms.push(item.room);
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.kelas.localeCompare(b.kelas));
  }, [teachingSchedules, students, settings.mataPelajaran]);

  const rombelClassNames = useMemo(() => {
    return rombelList.map(r => r.kelas);
  }, [rombelList]);

  // Kokurikuler / P5 / P5P2RA Map configuration
  const p5ConfigMap: { [kelas: string]: ClassKokurikulerP5 } = useMemo(() => {
    return settings.classKokurikulerP5Map || {};
  }, [settings.classKokurikulerP5Map]);

  // Total Intrakurikuler Tatap Muka JTM
  const totalIntrakurikulerJp = useMemo(() => {
    return teachingSchedules.reduce((acc, curr) => acc + parseJp(curr.jamKe, curr.jtm), 0);
  }, [teachingSchedules]);

  // Total Kokurikuler / P5 / P5P2RA JTM
  const totalP5Jp = useMemo(() => {
    return rombelClassNames.reduce((acc, cls) => {
      const p5 = p5ConfigMap[cls];
      if (p5 && p5.isEnabled !== false) {
        return acc + (p5.jp || 0);
      }
      return acc;
    }, 0);
  }, [rombelClassNames, p5ConfigMap]);

  // Direct Teaching Total (Intra + P5)
  const totalTatapMukaPlusP5Jp = totalIntrakurikulerJp + totalP5Jp;

  // Initialize and get additional duties
  const additionalDuties: TeacherAdditionalDuty[] = useMemo(() => {
    if (settings.additionalDuties && settings.additionalDuties.length > 0) {
      return settings.additionalDuties;
    }
    return [
      { id: 'duty-1', name: 'Wali Kelas', jtmEquivalent: 2, skNumber: 'SK.421/015/SMK/2025', notes: 'Wali Kelas', isActive: true },
      { id: 'duty-2', name: 'Pembina OSIS / Ekstrakurikuler', jtmEquivalent: 2, skNumber: 'SK.421/018/SMK/2025', notes: 'Pembina Kesiswaan', isActive: false },
      { id: 'duty-3', name: 'Guru Piket', jtmEquivalent: 1, skNumber: 'SK.421/020/SMK/2025', notes: 'Piket Harian', isActive: false },
    ];
  }, [settings.additionalDuties]);

  // Active additional duties & sum
  const activeDuties = useMemo(() => {
    return additionalDuties.filter(d => d.isActive);
  }, [additionalDuties]);

  const totalTugasTambahanJp = useMemo(() => {
    return activeDuties.reduce((acc, curr) => acc + curr.jtmEquivalent, 0);
  }, [activeDuties]);

  // Total Cumulative JTM (Intrakurikuler + Kokurikuler P5 + Tugas Tambahan)
  const totalKumulatifJp = totalIntrakurikulerJp + totalP5Jp + totalTugasTambahanJp;

  // Linear / Certification Standard calculation (Permendikbud & KMA: 24 - 40 JP)
  const minStandardJp = 24;
  const maxStandardJp = 40;
  const certificationPercentage = Math.min(100, Math.round((totalKumulatifJp / minStandardJp) * 100));
  const isEligibleForCertification = totalKumulatifJp >= minStandardJp && totalKumulatifJp <= maxStandardJp;
  const isOverload = totalKumulatifJp > maxStandardJp;
  const jpDeficit = Math.max(0, minStandardJp - totalKumulatifJp);

  // Total unique students in taught classes
  const totalStudentsTaught = useMemo(() => {
    const taughtClassNames = new Set(teachingSchedules.map(s => s.kelas.trim()));
    return students.filter(s => s.class && taughtClassNames.has(s.class.trim())).length;
  }, [students, teachingSchedules]);

  // Group schedules by Day (Senin - Sabtu)
  const DAYS_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dailyWorkload = useMemo(() => {
    return DAYS_LIST.map(dayName => {
      const dayItems = teachingSchedules
        .filter(s => s.day === dayName)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      const dayJp = dayItems.reduce((acc, curr) => acc + parseJp(curr.jamKe, curr.jtm), 0);
      const uniqueClasses = Array.from(new Set(dayItems.map(s => s.kelas)));
      const startTime = dayItems.length > 0 ? dayItems[0].startTime : '-';
      const endTime = dayItems.length > 0 ? dayItems[dayItems.length - 1].endTime : '-';

      let density: 'Libur' | 'Ringan' | 'Optimal' | 'Padat' = 'Libur';
      if (dayJp > 0) {
        if (dayJp <= 3) density = 'Ringan';
        else if (dayJp <= 6) density = 'Optimal';
        else density = 'Padat';
      }

      return {
        day: dayName,
        totalJp: dayJp,
        classesCount: uniqueClasses.length,
        classes: uniqueClasses,
        sessionsCount: dayItems.length,
        timeSpan: dayItems.length > 0 ? `${startTime} - ${endTime}` : 'Tidak Ada KBM',
        density
      };
    });
  }, [teachingSchedules]);

  // Handlers for Duty
  const handleOpenAddDuty = () => {
    setEditingDuty(null);
    setIsDutyModalOpen(true);
  };

  const handleOpenEditDuty = (duty: TeacherAdditionalDuty) => {
    setEditingDuty(duty);
    setIsDutyModalOpen(true);
  };

  const handleToggleDuty = (dutyId: string) => {
    const updated = additionalDuties.map(d => {
      if (d.id === dutyId) {
        return { ...d, isActive: !d.isActive };
      }
      return d;
    });
    updateSettings({ additionalDuties: updated });
    showToast('Status tugas tambahan diperbarui', 'info');
  };

  const handleDeleteDuty = (dutyId: string) => {
    const updated = additionalDuties.filter(d => d.id !== dutyId);
    updateSettings({ additionalDuties: updated });
    showToast('Tugas tambahan berhasil dihapus', 'success');
  };

  const handleSaveDuty = (dutyData: Omit<TeacherAdditionalDuty, 'id'>, id?: string) => {
    let updated: TeacherAdditionalDuty[];
    if (id) {
      updated = additionalDuties.map(d => (d.id === id ? { ...dutyData, id } : d));
      showToast('Tugas tambahan berhasil diperbarui', 'success');
    } else {
      const newDuty: TeacherAdditionalDuty = {
        ...dutyData,
        id: `duty-${Date.now()}`
      };
      updated = [...additionalDuties, newDuty];
      showToast('Tugas tambahan berhasil ditambahkan', 'success');
    }
    updateSettings({ additionalDuties: updated });
    setIsDutyModalOpen(false);
  };

  // Handlers for P5 / Kokurikuler
  const handleOpenP5Modal = (kelas: string) => {
    setSelectedP5Kelas(kelas);
    setIsP5ModalOpen(true);
  };

  const handleSaveP5 = (data: ClassKokurikulerP5, applyToAll?: boolean) => {
    const newMap = { ...p5ConfigMap };
    if (applyToAll) {
      rombelClassNames.forEach(c => {
        newMap[c] = {
          ...data,
          kelas: c,
          projectName: data.projectName ? data.projectName.replace(data.kelas, c) : `Projek ${data.category} Kelas ${c}`
        };
      });
      showToast(`Alokasi Kokurikuler/P5 (${data.jp} JP) diterapkan ke seluruh kelas`, 'success');
    } else {
      newMap[data.kelas] = data;
      showToast(`Kokurikuler/P5 Kelas ${data.kelas} (${data.jp} JP) berhasil disimpan`, 'success');
    }
    updateSettings({ classKokurikulerP5Map: newMap });
    setIsP5ModalOpen(false);
  };

  const handleUpdateP5ConfigDirect = (newMap: { [kelas: string]: ClassKokurikulerP5 }) => {
    updateSettings({ classKokurikulerP5Map: newMap });
  };

  // Rate Saver
  const handleSaveHourlyRate = () => {
    updateSettings({ hourlyRatePerJp: ratePerJp });
    setIsCustomRateEditing(false);
    showToast('Tarif honor per JP berhasil disimpan', 'success');
  };

  // Currency helper
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'No',
      'Kelas / Rombel',
      'Mata Pelajaran',
      'Intrakurikuler (JP)',
      'Kokurikuler P5 (JP)',
      'Total Beban Kelas (JP)',
      'Tema Projek P5',
      'Jumlah Siswa',
      'Jadwal Hari & Sesi'
    ];

    const rows = rombelList.map((r, idx) => {
      const p5 = p5ConfigMap[r.kelas];
      const p5Jp = (p5 && p5.isEnabled !== false) ? (p5.jp || 0) : 0;
      const totalClassJp = r.totalJp + p5Jp;
      const p5Theme = p5?.theme || '-';
      const scheduleSummary = r.schedules.map(s => `${s.day} Jam ${s.jamKe}`).join('; ');

      return [
        idx + 1,
        `"${r.kelas}"`,
        `"${r.mapel}"`,
        r.totalJp,
        p5Jp,
        totalClassJp,
        `"${p5Theme}"`,
        r.studentsCount,
        `"${scheduleSummary}"`
      ].join(',');
    });

    // Summary lines
    rows.push('');
    rows.push(`"TOTAL INTRAKURIKULER","${totalIntrakurikulerJp} JP"`);
    rows.push(`"TOTAL KOKURIKULER P5","${totalP5Jp} JP"`);
    rows.push(`"TOTAL TUGAS TAMBAHAN","${totalTugasTambahanJp} JP"`);
    rows.push(`"TOTAL KUMULATIF BEBAN KERJA","${totalKumulatifJp} JP"`);
    rows.push(`"STATUS SERTIFIKASI TPG","${isEligibleForCertification ? 'MEMENUHI SYARAT (>=24 JP)' : 'BELUM MEMENUHI'}"`);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Beban_Mengajar_P5_${settings.namaGuru || 'Guru'}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Data beban mengajar & P5 berhasil diekspor ke CSV', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Sub Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-2.5 flex items-center justify-between gap-2 overflow-x-auto shadow-sm">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            id="subtab-analisis-beban"
            onClick={() => setActiveSection('analisis')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'analisis'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Analisis Beban Kerja</span>
          </button>

          <button
            id="subtab-p5-kokurikuler"
            onClick={() => setActiveSection('p5-kokurikuler')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'p5-kokurikuler'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span>Kokurikuler / P5 / P5P2RA</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
              activeSection === 'p5-kokurikuler' ? 'bg-slate-950 text-teal-300' : 'bg-teal-500/20 text-teal-300'
            }`}>
              +{totalP5Jp} JP
            </span>
          </button>

          <button
            id="subtab-tugas-tambahan"
            onClick={() => setActiveSection('tugas-tambahan')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'tugas-tambahan'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Tugas Tambahan</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
              activeSection === 'tugas-tambahan' ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-slate-300'
            }`}>
              +{totalTugasTambahanJp} JP
            </span>
          </button>

          <button
            id="subtab-kalkulator-honor"
            onClick={() => setActiveSection('kalkulator-honor')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'kalkulator-honor'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Kalkulator Honor</span>
          </button>

          <button
            id="subtab-cetak-skbk"
            onClick={() => setActiveSection('cetak-skbk')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'cetak-skbk'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Cetak SKBK / SKMT</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pr-1">
          <button
            id="btn-export-beban-csv"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Ekspor Rekapitulasi ke Excel/CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ANALISIS UTAMA BEBAN MENGAJAR                                  */}
      {/* ========================================================================= */}
      {activeSection === 'analisis' && (
        <div className="space-y-6">
          
          {/* 4 Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Tatap Muka Intrakurikuler */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Intrakurikuler (KBM)</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white font-mono">{totalIntrakurikulerJp}</span>
                  <span className="text-xs font-bold text-slate-400">JP / Pekan</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{rombelList.length} Rombel • {teachingSchedules.length} Sesi KBM</p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Rata-rata per hari:</span>
                <span className="font-mono text-emerald-400 font-bold">{(totalIntrakurikulerJp / 5).toFixed(1)} JP/Hari</span>
              </div>
            </div>

            {/* Card 2: Kokurikuler P5 / P5P2RA */}
            <div className="bg-slate-900 border border-teal-500/30 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden bg-gradient-to-b from-teal-950/20 to-transparent">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Kokurikuler (P5/P5RA)</span>
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-300 flex items-center justify-center border border-teal-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-teal-300 font-mono">+{totalP5Jp}</span>
                  <span className="text-xs font-bold text-teal-400">JP / Pekan</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Ekuivalensi Pembimbingan Projek</p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => setActiveSection('p5-kokurikuler')}
                  className="text-teal-300 hover:text-teal-200 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Sesuaikan per kelas</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Card 3: Tugas Tambahan */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tugas Tambahan</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-amber-400 font-mono">+{totalTugasTambahanJp}</span>
                  <span className="text-xs font-bold text-slate-400">JP / Pekan</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{activeDuties.length} Tugas Tambahan Aktif</p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => setActiveSection('tugas-tambahan')}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Kelola tugas SK</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Card 4: Total Kumulatif & Status Sertifikasi */}
            <div className={`rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden border ${
              isEligibleForCertification
                ? 'bg-emerald-950/30 border-emerald-500/40 text-white'
                : isOverload
                ? 'bg-amber-950/30 border-amber-500/40 text-white'
                : 'bg-rose-950/30 border-rose-500/40 text-white'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Beban Kerja</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isEligibleForCertification 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : isOverload 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black font-mono">{totalKumulatifJp}</span>
                  <span className="text-xs font-bold text-slate-300">JP / Pekan</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
                  {isEligibleForCertification ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Standar Sertifikasi Terpenuhi</span>
                    </span>
                  ) : isOverload ? (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Melebihi Batas Maksimal (40 JP)</span>
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Kurang {jpDeficit} JP dari batas 24 JP</span>
                    </span>
                  )}
                </div>
              </div>
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isEligibleForCertification ? 'bg-emerald-500' : isOverload ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, certificationPercentage)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0 JP</span>
                  <span>Min: 24 JP</span>
                  <span>Maks: 40 JP</span>
                </div>
              </div>
            </div>

          </div>

          {/* Banner: Regulasi Linieritas & Komposisi Beban */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h5 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Komposisi Jam: Intrakurikuler ({totalIntrakurikulerJp} JP) + P5/P5P2RA ({totalP5Jp} JP) + Tugas Tambahan ({totalTugasTambahanJp} JP)</span>
                </h5>
                <p className="text-[11px] text-slate-400">
                  Perhitungan: <span className="text-teal-300 font-semibold">(JP Intrakurikuler/kelas + JP P5/kelas) × Jumlah Kelas yang diampu</span>. Contoh Penjaskes: (2 JP Intra + 1 JP P5) × 3 kelas = 9 JP total.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveSection('p5-kokurikuler')}
                className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Atur Kokurikuler P5</span>
              </button>
            </div>
          </div>

          {/* Daily Workload Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-400" />
                  <span>Distribusi Beban KBM Harian (Senin - Sabtu)</span>
                </h4>
                <p className="text-xs text-slate-400">Peta kepadatan jam tatap muka harian.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {dailyWorkload.map(day => {
                let badgeClass = 'bg-slate-800 text-slate-400';
                if (day.density === 'Ringan') badgeClass = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                if (day.density === 'Optimal') badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                if (day.density === 'Padat') badgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';

                return (
                  <div
                    key={day.day}
                    className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{day.day}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${badgeClass}`}>
                          {day.density}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-xl font-black text-white font-mono">{day.totalJp}</span>
                        <span className="text-[10px] text-slate-400 ml-1">JP</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-0.5 border-t border-slate-800/80 pt-2">
                      <p className="line-clamp-1">{day.classesCount > 0 ? `${day.classesCount} Kelas (${day.classes.join(', ')})` : 'Libur KBM'}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{day.timeSpan}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table: Rincian Beban Per Rombongan Belajar (Rombel) + Kolom P5 */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Rincian Pembagian Tugas Mengajar Per Rombel</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Alokasi Intrakurikuler, Kokurikuler (P5/P5P2RA), dan Total Beban Kerja per kelas.
                </p>
              </div>

              {onOpenAddSchedule && (
                <button
                  onClick={() => onOpenAddSchedule()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Sesi Kelas</span>
                </button>
              )}
            </div>

            {rombelList.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-bold text-white">Belum Ada Jadwal Mengajar</h5>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Silakan buat jadwal mengajar pada menu &quot;Kelola Jadwal Mingguan&quot; untuk melihat kalkulasi beban mengajar otomatis.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                      <th className="py-3 px-3">No</th>
                      <th className="py-3 px-3">Kelas / Rombel</th>
                      <th className="py-3 px-3">Mata Pelajaran</th>
                      <th className="py-3 px-3 text-center">Intrakurikuler</th>
                      <th className="py-3 px-3 text-center">Kokurikuler (P5)</th>
                      <th className="py-3 px-3 text-center">Total Beban Kelas</th>
                      <th className="py-3 px-3">Jadwal Pertemuan</th>
                      <th className="py-3 px-3 text-center">Jumlah Siswa</th>
                      <th className="py-3 px-3 text-right">Aksi P5</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {rombelList.map((rombel, idx) => {
                      const p5 = p5ConfigMap[rombel.kelas];
                      const p5Jp = (p5 && p5.isEnabled !== false) ? (p5.jp || 0) : 0;
                      const totalClassJp = rombel.totalJp + p5Jp;

                      return (
                        <tr key={rombel.kelas} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-3 font-mono text-slate-500 font-bold">{idx + 1}</td>
                          <td className="py-3.5 px-3 font-black text-white">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              <span>Kelas {rombel.kelas}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-medium text-slate-200">{rombel.mapel}</td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {rombel.totalJp} JP
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold">
                            <span className={`px-2.5 py-1 rounded-lg border ${
                              p5Jp > 0
                                ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                            }`}>
                              +{p5Jp} JP
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-black">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-white border border-slate-700">
                              {totalClassJp} JP
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-300">
                            <div className="space-y-1">
                              {rombel.schedules.map((s, sIdx) => (
                                <div key={s.id || sIdx} className="flex items-center gap-1.5 text-[11px]">
                                  <span className="font-bold text-slate-200">{s.day}:</span>
                                  <span className="text-slate-400 font-mono">Jam {s.jamKe}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-200">
                            {rombel.studentsCount} Siswa
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => handleOpenP5Modal(rombel.kelas)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 border border-slate-700 hover:border-teal-500/30 text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                              title="Sesuaikan JP Kokurikuler/P5 Kelas Ini"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Ubah P5</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-700 bg-slate-950/70 font-bold text-white text-xs">
                      <td colSpan={3} className="py-3.5 px-3 uppercase tracking-wider text-emerald-400">
                        Total Beban Rombel ({rombelList.length} Kelas)
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-sm text-emerald-400 font-black">
                        {totalIntrakurikulerJp} JP
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-sm text-teal-300 font-black">
                        +{totalP5Jp} JP
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-sm text-white font-black">
                        {totalTatapMukaPlusP5Jp} JP
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">
                        {teachingSchedules.length} Sesi KBM
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-sm text-slate-200 font-black">
                        {totalStudentsTaught} Siswa
                      </td>
                      <td className="py-3.5 px-3 text-right text-teal-400 font-mono text-[11px]">
                        +{totalP5Jp} JP P5
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: KOKURIKULER / P5 / P5P2RA PER KELAS                            */}
      {/* ========================================================================= */}
      {activeSection === 'p5-kokurikuler' && (
        <P5KokurikulerSection
          rombelClassNames={rombelClassNames}
          p5ConfigMap={p5ConfigMap}
          onUpdateP5Config={handleUpdateP5ConfigDirect}
          onOpenEditModal={handleOpenP5Modal}
          totalIntrakurikulerJp={totalIntrakurikulerJp}
          totalTugasTambahanJp={totalTugasTambahanJp}
          showToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: KELOLA TUGAS TAMBAHAN & EKUIVALENSI BEBAN KERJA                */}
      {/* ========================================================================= */}
      {activeSection === 'tugas-tambahan' && (
        <div className="space-y-6">
          
          {/* Header Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <span>Daftar Tugas Tambahan Guru & Ekuivalensi JP</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Tugas non-mengajar resmi yang diakui ekuivalensi jam pelajarannya sesuai Permendikbud No. 15 Thn 2018.
                </p>
              </div>

              <button
                id="btn-tambah-tugas-tambahan"
                onClick={handleOpenAddDuty}
                className="px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Tugas Tambahan</span>
              </button>
            </div>

            {/* Total Ekuivalensi Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-bold">Total Tugas Aktif</span>
                <p className="text-lg font-black text-white">{activeDuties.length} Tugas</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-bold">Total Ekuivalensi JP</span>
                <p className="text-lg font-black text-emerald-400">+{totalTugasTambahanJp} JP / Pekan</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-bold">Kumulatif Beban Kerja</span>
                <p className="text-lg font-black text-white">{totalKumulatifJp} JP <span className="text-xs text-slate-400 font-normal">({totalIntrakurikulerJp} TM + {totalP5Jp} P5 + {totalTugasTambahanJp} TT)</span></p>
              </div>
            </div>
          </div>

          {/* Cards List of Additional Duties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {additionalDuties.map(duty => (
              <div
                key={duty.id}
                className={`rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                  duty.isActive
                    ? 'bg-slate-900 border-emerald-500/30 shadow-md shadow-emerald-500/5'
                    : 'bg-slate-900/60 border-slate-800 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border shrink-0 ${
                        duty.isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-white">{duty.name}</h5>
                        {duty.skNumber ? (
                          <p className="text-[11px] font-mono text-slate-400">SK: {duty.skNumber}</p>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic">Belum ada nomor SK</p>
                        )}
                      </div>
                    </div>

                    <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl border ${
                      duty.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      +{duty.jtmEquivalent} JP
                    </span>
                  </div>

                  {duty.notes && (
                    <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      {duty.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={duty.isActive}
                      onChange={() => handleToggleDuty(duty.id)}
                      className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950 cursor-pointer"
                    />
                    <span className={`text-xs font-bold ${duty.isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {duty.isActive ? 'Status: Aktif' : 'Status: Non-Aktif'}
                    </span>
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditDuty(duty)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Tugas"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDuty(duty.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Hapus Tugas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preset Recommendation Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Preset Standar Tugas Tambahan Berdasarkan Regulasi Nasional</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {DEFAULT_PRESET_DUTIES.map((preset, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    setEditingDuty({
                      id: '',
                      name: preset.name,
                      jtmEquivalent: preset.jtmEquivalent,
                      skNumber: `SK.421/0${pIdx + 10}/SMK/2025`,
                      notes: preset.notes,
                      isActive: true
                    });
                    setIsDutyModalOpen(true);
                  }}
                  className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {preset.name}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      +{preset.jtmEquivalent} JP
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{preset.notes}</p>
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: KALKULATOR HONOR & INSENTIF MENGAJAR (OPSIONAL)                */}
      {/* ========================================================================= */}
      {activeSection === 'kalkulator-honor' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>Kalkulator & Estimasi Honorarium Mengajar</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Simulasi perhitungan honor jam tatap muka intrakurikuler, kokurikuler P5, dan tugas tambahan.
                </p>
              </div>

              {/* Rate Editor */}
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-400 px-2">Tarif per JP:</span>
                {isCustomRateEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={ratePerJp}
                      onChange={(e) => setRatePerJp(Number(e.target.value) || 0)}
                      step={5000}
                      min={0}
                      className="w-28 bg-slate-900 border border-emerald-500 rounded-xl px-2.5 py-1 text-xs text-white font-mono focus:outline-none"
                    />
                    <button
                      onClick={handleSaveHourlyRate}
                      className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black cursor-pointer"
                    >
                      Simpan
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-emerald-400">
                      {formatRupiah(ratePerJp)} / JP
                    </span>
                    <button
                      onClick={() => setIsCustomRateEditing(true)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                      title="Ubah Tarif"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 4 Financial KPI Projection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-4.5 space-y-2">
                <span className="text-xs text-slate-400 font-bold">Intrakurikuler</span>
                <p className="text-xl font-black text-white">{formatRupiah(totalIntrakurikulerJp * ratePerJp)}</p>
                <p className="text-[11px] font-mono text-slate-500">{totalIntrakurikulerJp} JP × {formatRupiah(ratePerJp)}</p>
              </div>

              <div className="bg-teal-950/20 border border-teal-500/30 rounded-3xl p-4.5 space-y-2">
                <span className="text-xs text-teal-400 font-bold">Kokurikuler (P5/P5RA)</span>
                <p className="text-xl font-black text-teal-300">{formatRupiah(totalP5Jp * ratePerJp)}</p>
                <p className="text-[11px] font-mono text-teal-500/80">{totalP5Jp} JP × {formatRupiah(ratePerJp)}</p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-4.5 space-y-2">
                <span className="text-xs text-slate-400 font-bold">Tugas Tambahan</span>
                <p className="text-xl font-black text-amber-400">{formatRupiah(totalTugasTambahanJp * ratePerJp)}</p>
                <p className="text-[11px] font-mono text-slate-500">{totalTugasTambahanJp} JP × {formatRupiah(ratePerJp)}</p>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-3xl p-4.5 space-y-2">
                <span className="text-xs text-emerald-400 font-bold">Proyeksi Bulanan (4 Pekan)</span>
                <p className="text-xl font-black text-emerald-300">{formatRupiah(totalKumulatifJp * ratePerJp * 4)}</p>
                <p className="text-[11px] font-mono text-emerald-500/80">{totalKumulatifJp} JP Kumulatif × 4 Pekan</p>
              </div>

            </div>

            {/* Simulation Table Breakdown */}
            <div className="space-y-2 pt-2">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Rincian Proyeksi Honor Per Rombel, P5 & Tugas Tambahan
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                      <th className="py-2.5 px-3">Komponen Beban Kerja</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3 text-center">Alokasi JP</th>
                      <th className="py-2.5 px-3 text-right">Tarif / JP</th>
                      <th className="py-2.5 px-3 text-right">Subtotal / Pekan</th>
                      <th className="py-2.5 px-3 text-right">Subtotal / Bulan (4 Pekan)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {rombelList.map(r => (
                      <tr key={`intra-${r.kelas}`} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-bold text-white">Kelas {r.kelas} ({r.mapel})</td>
                        <td className="py-2.5 px-3 text-slate-400">Intrakurikuler</td>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-400 font-bold">{r.totalJp} JP</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">{formatRupiah(ratePerJp)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">{formatRupiah(r.totalJp * ratePerJp)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">{formatRupiah(r.totalJp * ratePerJp * 4)}</td>
                      </tr>
                    ))}
                    {rombelList.map(r => {
                      const p5 = p5ConfigMap[r.kelas];
                      const p5Jp = (p5 && p5.isEnabled !== false) ? (p5.jp || 0) : 0;
                      if (p5Jp <= 0) return null;

                      return (
                        <tr key={`p5-${r.kelas}`} className="hover:bg-teal-500/5 bg-teal-950/10">
                          <td className="py-2.5 px-3 font-bold text-teal-300">P5 / Kokurikuler Kelas {r.kelas}</td>
                          <td className="py-2.5 px-3 text-teal-400/80">Kokurikuler ({p5?.category || 'P5'})</td>
                          <td className="py-2.5 px-3 text-center font-mono text-teal-300 font-bold">+{p5Jp} JP</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">{formatRupiah(ratePerJp)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-300">{formatRupiah(p5Jp * ratePerJp)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-200">{formatRupiah(p5Jp * ratePerJp * 4)}</td>
                        </tr>
                      );
                    })}
                    {activeDuties.map(d => (
                      <tr key={d.id} className="hover:bg-amber-500/5 bg-amber-950/10">
                        <td className="py-2.5 px-3 font-bold text-amber-300">{d.name}</td>
                        <td className="py-2.5 px-3 text-amber-400/80">Tugas Tambahan</td>
                        <td className="py-2.5 px-3 text-center font-mono text-amber-400 font-bold">+{d.jtmEquivalent} JP</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">{formatRupiah(ratePerJp)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">{formatRupiah(d.jtmEquivalent * ratePerJp)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-200">{formatRupiah(d.jtmEquivalent * ratePerJp * 4)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-700 bg-slate-950 font-bold text-white text-xs">
                      <td colSpan={2} className="py-3 px-3 uppercase text-emerald-400">Total Proyeksi Kumulatif</td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-400 font-black">{totalKumulatifJp} JP</td>
                      <td className="py-3 px-3 text-right text-slate-400">-</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-300 text-sm font-black">{formatRupiah(totalKumulatifJp * ratePerJp)}</td>
                      <td className="py-3 px-3 text-right font-mono text-blue-300 text-sm font-black">{formatRupiah(totalKumulatifJp * ratePerJp * 4)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: PRATINJAU DOKUMEN CETAK RESMI (SKBK / SKMT)                   */}
      {/* ========================================================================= */}
      {activeSection === 'cetak-skbk' && (
        <div className="space-y-6">
          
          {/* Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Dokumen Resmi: Surat Keterangan Beban Kerja (SKBK / SKMT)</span>
              </h4>
              <p className="text-xs text-slate-400">
                Format siap cetak lengkap dengan rincian Intrakurikuler, Kokurikuler (P5/P5RA), dan Ekuivalensi Tugas Tambahan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-print-skbk-direct"
                onClick={() => {
                  printElementById('printable-beban-kerja-area', {
                    title: `SKBK_Beban_Mengajar_P5_${settings.namaGuru || 'Guru'}`,
                    orientation: 'portrait',
                    pageMargin: '8mm'
                  });
                }}
                className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>

          {/* Printable White Paper Document Container */}
          <div className="bg-slate-950 p-4 sm:p-8 rounded-3xl border border-slate-800 flex justify-center overflow-x-auto">
            <BebanPrintDocument
              settings={settings}
              today={today}
              rombelList={rombelList}
              p5ConfigMap={p5ConfigMap}
              activeDuties={activeDuties}
              totalIntrakurikulerJp={totalIntrakurikulerJp}
              totalP5Jp={totalP5Jp}
              totalTugasTambahanJp={totalTugasTambahanJp}
              totalKumulatifJp={totalKumulatifJp}
              totalStudentsTaught={totalStudentsTaught}
              isEligibleForCertification={isEligibleForCertification}
              jpDeficit={jpDeficit}
            />
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL FORM TUGAS TAMBAHAN                                                 */}
      {/* ========================================================================= */}
      <DutyModal
        isOpen={isDutyModalOpen}
        onClose={() => setIsDutyModalOpen(false)}
        editingDuty={editingDuty}
        onSave={handleSaveDuty}
      />

      {/* ========================================================================= */}
      {/* MODAL FORM KOKURIKULER / P5 / P5P2RA                                      */}
      {/* ========================================================================= */}
      <P5KokurikulerModal
        isOpen={isP5ModalOpen}
        onClose={() => setIsP5ModalOpen(false)}
        initialData={p5ConfigMap[selectedP5Kelas] || null}
        targetKelas={selectedP5Kelas || rombelClassNames[0] || 'X'}
        allClassNames={rombelClassNames.length > 0 ? rombelClassNames : ['X-1', 'XI-1', 'XII-1']}
        onSave={handleSaveP5}
      />

    </div>
  );
};
