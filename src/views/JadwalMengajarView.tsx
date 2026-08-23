import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TeachingScheduleItem, Student, AttendanceStatus } from '../types';
import { SubNavHeader } from '../components/layout/SubNavHeader';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CalendarDays, Clock, Plus, Trash2, Edit3, CheckCircle, 
  Printer, Search, UserCheck, BookOpen, Award, Sparkles, 
  MapPin, X, Save, RefreshCw, ChevronRight, User, AlertCircle,
  Layers, Check, Eye
} from 'lucide-react';
import { formatIndonesianDayAndDate } from '../utils/formatters';
import { printElementById } from '../utils/printHelper';
import { JadwalModalForm } from './jadwal/components/JadwalModalForm';
import { JadwalDeleteModal } from './jadwal/components/JadwalDeleteModal';
import { JadwalPrintDocument } from './jadwal/components/JadwalPrintDocument';

const DAYS_OF_WEEK = [
  { name: 'Senin', index: 1 },
  { name: 'Selasa', index: 2 },
  { name: 'Rabu', index: 3 },
  { name: 'Kamis', index: 4 },
  { name: 'Jumat', index: 5 },
  { name: 'Sabtu', index: 6 },
];

const COLOR_OPTIONS = [
  { label: 'Emerald', value: 'emerald', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  { label: 'Blue', value: 'blue', bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400', badge: 'bg-blue-500/20 text-blue-300' },
  { label: 'Indigo', value: 'indigo', bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400', badge: 'bg-indigo-500/20 text-indigo-300' },
  { label: 'Amber', value: 'amber', bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
  { label: 'Rose', value: 'rose', bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400', badge: 'bg-rose-500/20 text-rose-300' },
  { label: 'Purple', value: 'purple', bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
];

export const JadwalMengajarView: React.FC = () => {
  const {
    today,
    students,
    attendance,
    teachingSchedules,
    addTeachingSchedule,
    updateTeachingSchedule,
    deleteTeachingSchedule,
    resetTeachingSchedules,
    settings,
    updateSettings,
    openJournalForClass,
    navigateToSubTab,
    markAttendanceByNisn,
    getActiveSubTab,
    setActiveSubTab,
    showToast
  } = useApp();

  const currentTimezone = (settings.timezone as 'WIB' | 'WITA' | 'WIT') || 'WIB';

  const handleTimezoneChange = (newTz: 'WIB' | 'WITA' | 'WIT') => {
    updateSettings({ timezone: newTz });
    showToast(`Zona waktu diatur ke ${newTz} (${newTz === 'WIB' ? 'UTC+7' : newTz === 'WITA' ? 'UTC+8' : 'UTC+9'})`, 'success');
  };

  const activeSubTab = getActiveSubTab('Jadwal Mengajar') || 'jadwal-hari-ini';

  // Determine current day name (Indonesian)
  const currentDayName = useMemo(() => {
    const d = new Date();
    const dayNum = d.getDay(); // 0 = Sunday, 1 = Monday, ...
    const map: Record<number, string> = {
      1: 'Senin',
      2: 'Selasa',
      3: 'Rabu',
      4: 'Kamis',
      5: 'Jumat',
      6: 'Sabtu',
      0: 'Minggu'
    };
    return map[dayNum] || 'Senin';
  }, []);

  // Selected Day in "Jadwal Hari Ini" Submenu
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    return currentDayName === 'Minggu' ? 'Senin' : currentDayName;
  });

  // Selected schedule class for student synchronization panel
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');

  // Weekly manager filters & view mode
  const [managerDayFilter, setManagerDayFilter] = useState<string>('Semua');
  const [managerClassFilter, setManagerClassFilter] = useState<string>('Semua');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TeachingScheduleItem | null>(null);

  // Delete & Reset Confirmation Modals (Custom in-app to avoid iframe window.confirm blocks)
  const [deleteTarget, setDeleteTarget] = useState<TeachingScheduleItem | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // Form fields
  const [formDay, setFormDay] = useState<string>('Senin');
  const [formJamKe, setFormJamKe] = useState<string>('1 - 2');
  const [formStartTime, setFormStartTime] = useState<string>('07:30');
  const [formEndTime, setFormEndTime] = useState<string>('09:00');
  const [formKelas, setFormKelas] = useState<string>('');
  const [formMapel, setFormMapel] = useState<string>(settings.mataPelajaran || 'Matematika');
  const [formRoom, setFormRoom] = useState<string>('Ruang Kelas');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formColor, setFormColor] = useState<string>('emerald');

  // Unique classes from students
  const availableClasses = useMemo(() => {
    const setCls = new Set<string>();
    students.forEach(s => {
      if (s.class) setCls.add(s.class.trim());
    });
    return Array.from(setCls).sort();
  }, [students]);

  // Schedules filtered by selected day in Submenu 1
  const daySchedules = useMemo(() => {
    return teachingSchedules
      .filter(s => s.day === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [teachingSchedules, selectedDay]);

  // Today's specific schedules count for badge
  const todaySchedulesCount = useMemo(() => {
    const target = currentDayName === 'Minggu' ? 'Senin' : currentDayName;
    return teachingSchedules.filter(s => s.day === target).length;
  }, [teachingSchedules, currentDayName]);

  // Auto select first schedule if current selected is invalid
  const activeSchedule = useMemo(() => {
    if (daySchedules.length === 0) return null;
    if (selectedScheduleId) {
      const found = daySchedules.find(s => s.id === selectedScheduleId);
      if (found) return found;
    }
    return daySchedules[0];
  }, [daySchedules, selectedScheduleId]);

  // Students in selected schedule's class
  const classStudents = useMemo(() => {
    if (!activeSchedule || !activeSchedule.kelas) return [];
    return students
      .filter(s => s.class && s.class.trim() === activeSchedule.kelas.trim())
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, activeSchedule]);

  // Filtered class students by search
  const filteredClassStudents = useMemo(() => {
    if (!studentSearchTerm.trim()) return classStudents;
    const q = studentSearchTerm.toLowerCase();
    return classStudents.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.nisn && s.nisn.includes(q))
    );
  }, [classStudents, studentSearchTerm]);

  // Attendance status mapping for class students today
  const studentAttendanceMap = useMemo(() => {
    const map = new Map<string, { status: AttendanceStatus; time?: string; method?: string }>();
    attendance.forEach(att => {
      if (att.date === today) {
        if (att.studentId) {
          map.set(att.studentId, { status: att.status, time: att.time, method: att.method });
        }
        if (att.nisn) {
          map.set(att.nisn, { status: att.status, time: att.time, method: att.method });
        }
      }
    });
    return map;
  }, [attendance, today]);

  // Summary statistics for selected class today
  const classAttendanceStats = useMemo(() => {
    let hadir = 0;
    let terlambat = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    let belum = 0;

    classStudents.forEach(st => {
      const record = studentAttendanceMap.get(st.id) || studentAttendanceMap.get(st.nisn);
      if (!record) {
        belum++;
      } else {
        if (record.status === 'Hadir') hadir++;
        else if (record.status === 'Terlambat') terlambat++;
        else if (record.status === 'Sakit') sakit++;
        else if (record.status === 'Izin') izin++;
        else if (record.status === 'Alpa') alpa++;
      }
    });

    return { total: classStudents.length, hadir, terlambat, sakit, izin, alpa, belum };
  }, [classStudents, studentAttendanceMap]);

  // Modal open handlers
  const handleOpenAddModal = (defaultDay?: string) => {
    setEditingItem(null);
    setFormDay(defaultDay || selectedDay || 'Senin');
    setFormJamKe('1 - 2');
    setFormStartTime('07:30');
    setFormEndTime('09:00');
    setFormKelas(availableClasses[0] || 'X IPA 2');
    setFormMapel(settings.mataPelajaran || 'Matematika');
    setFormRoom('Ruang Kelas');
    setFormNotes('');
    setFormColor('emerald');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: TeachingScheduleItem) => {
    setEditingItem(item);
    setFormDay(item.day);
    setFormJamKe(item.jamKe);
    setFormStartTime(item.startTime);
    setFormEndTime(item.endTime);
    setFormKelas(item.kelas);
    setFormMapel(item.mapel);
    setFormRoom(item.room || 'Ruang Kelas');
    setFormNotes(item.notes || '');
    setFormColor(item.color || 'emerald');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKelas.trim()) {
      showToast('Mohon pilih atau isi kelas.', 'error');
      return;
    }

    const dayObj = DAYS_OF_WEEK.find(d => d.name === formDay);
    const dayIndex = dayObj ? dayObj.index : 1;

    if (editingItem) {
      updateTeachingSchedule(editingItem.id, {
        day: formDay,
        dayIndex,
        jamKe: formJamKe,
        startTime: formStartTime,
        endTime: formEndTime,
        kelas: formKelas.trim(),
        mapel: formMapel.trim(),
        room: formRoom.trim(),
        notes: formNotes.trim(),
        color: formColor
      });
    } else {
      addTeachingSchedule({
        day: formDay,
        dayIndex,
        jamKe: formJamKe,
        startTime: formStartTime,
        endTime: formEndTime,
        kelas: formKelas.trim(),
        mapel: formMapel.trim(),
        room: formRoom.trim(),
        notes: formNotes.trim(),
        color: formColor
      });
    }
    setIsModalOpen(false);
  };

  // Quick mark attendance directly from schedule
  const handleQuickMark = (student: Student, status: AttendanceStatus) => {
    const res = markAttendanceByNisn(student.nisn, 'Manual', status, undefined, undefined, today, true);
    if (res.success) {
      showToast(`${student.name}: ${status}`, 'success');
    }
  };

  // Weekly filtered schedules for Submenu 2
  const weeklyFilteredSchedules = useMemo(() => {
    return teachingSchedules.filter(item => {
      const matchDay = managerDayFilter === 'Semua' || item.day === managerDayFilter;
      const matchClass = managerClassFilter === 'Semua' || item.kelas === managerClassFilter;
      return matchDay && matchClass;
    });
  }, [teachingSchedules, managerDayFilter, managerClassFilter]);

  // Total JP stats
  const totalWeeklySchedules = teachingSchedules.length;
  const distinctClassesCount = useMemo(() => {
    const s = new Set(teachingSchedules.map(t => t.kelas));
    return s.size;
  }, [teachingSchedules]);

  return (
    <div className="space-y-6">
      {/* SubNavHeader */}
      <SubNavHeader
        currentTab="Jadwal Mengajar"
        activeSubTab={activeSubTab}
        onSelectSubTab={(id) => setActiveSubTab('Jadwal Mengajar', id)}
        badgeCounts={{
          'jadwal-hari-ini': todaySchedulesCount,
          'kelola-jadwal': totalWeeklySchedules,
          'cetak-jadwal': 'Doc'
        }}
        extraActions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Timezone Switcher Pills */}
            <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 px-2 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                Zona:
              </span>
              {(['WIB', 'WITA', 'WIT'] as const).map((tz) => (
                <button
                  key={tz}
                  type="button"
                  id={`btn-tz-switch-${tz.toLowerCase()}`}
                  onClick={() => handleTimezoneChange(tz)}
                  className={`px-2 py-1 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    currentTimezone === tz
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={tz === 'WIB' ? 'Waktu Indonesia Barat (UTC+7)' : tz === 'WITA' ? 'Waktu Indonesia Tengah (UTC+8)' : 'Waktu Indonesia Timur (UTC+9)'}
                >
                  {tz}
                </button>
              ))}
            </div>

            <button
              id="btn-tambah-jadwal-quick"
              onClick={() => handleOpenAddModal()}
              className="px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal</span>
            </button>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* SUBMENU 1: JADWAL HARI INI & DATA KELAS / SISWA TERSINKRON               */}
      {/* ========================================================================= */}
      {activeSubTab === 'jadwal-hari-ini' && (
        <div className="space-y-6">
          {/* Day Selector Pills Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Pilih Hari Pembelajaran</h3>
                  <p className="text-xs text-slate-400">
                    Hari ini: <strong className="text-emerald-400 font-bold">{formatIndonesianDayAndDate(today).fullString}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {daySchedules.length} Kelas Terjadwal di Hari {selectedDay}
                </span>
              </div>
            </div>

            {/* Day Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {DAYS_OF_WEEK.map(d => {
                const isSelected = selectedDay === d.name;
                const isToday = currentDayName === d.name;
                const count = teachingSchedules.filter(s => s.day === d.name).length;

                return (
                  <button
                    key={d.name}
                    id={`btn-day-${d.name}`}
                    onClick={() => {
                      setSelectedDay(d.name);
                      setSelectedScheduleId(null);
                    }}
                    className={`relative px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-lg shadow-emerald-500/20'
                        : isToday
                        ? 'bg-slate-800/90 text-emerald-400 border-emerald-500/40 hover:bg-slate-800'
                        : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{d.name}</span>
                    {isToday && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                        isSelected ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        Hari Ini
                      </span>
                    )}
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main 2-Column Section: Schedule Cards (Left) & Synchronized Student Roster (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN (5 Cols): Class Schedule Cards */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Jadwal Sesi Hari {selectedDay}
                </h4>
                <button
                  id="btn-tambah-sesi-hari"
                  onClick={() => handleOpenAddModal(selectedDay)}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Sesi
                </button>
              </div>

              {daySchedules.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Tidak Ada Jadwal di Hari {selectedDay}</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Anda tidak memiliki jadwal mengajar tatap muka pada hari ini.
                  </p>
                  <button
                    onClick={() => handleOpenAddModal(selectedDay)}
                    className="px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Tambah Jadwal Hari {selectedDay}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {daySchedules.map((sch) => {
                    const isSelected = activeSchedule?.id === sch.id;
                    const studentCount = students.filter(s => s.class && s.class.trim() === sch.kelas.trim()).length;

                    return (
                      <motion.div
                        key={sch.id}
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.15 }}
                        id={`card-schedule-${sch.id}`}
                        onClick={() => setSelectedScheduleId(sch.id)}
                        className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                            : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        {/* Header: Jam Ke & Time */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl bg-slate-950 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Jam Ke-{sch.jamKe}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-300">
                              {sch.startTime} - {sch.endTime} {currentTimezone}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              id={`btn-edit-sch-${sch.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(sch);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                              title="Edit Jadwal"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-delete-sch-${sch.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(sch);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                              title="Hapus Jadwal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title: Kelas & Mapel */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-black text-white tracking-tight">{sch.kelas}</h4>
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                {sch.mapel}
                              </span>
                            </div>
                            {sch.room && (
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-500" /> {sch.room}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-bold text-slate-400 block">
                              {studentCount} Siswa
                            </span>
                          </div>
                        </div>

                        {sch.notes && (
                          <p className="text-[11px] text-slate-400 italic bg-slate-950/50 p-2 rounded-xl mb-3 border border-slate-800/60">
                            {sch.notes}
                          </p>
                        )}

                        {/* Action Buttons row */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                          <span className={`text-[11px] font-bold flex items-center gap-1 ${
                            isSelected ? 'text-emerald-400' : 'text-slate-400'
                          }`}>
                            {isSelected ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Kelas Terpilih (Live Roster)</span>
                              </>
                            ) : (
                              <span>Klik untuk lihat siswa</span>
                            )}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              id={`btn-open-jurnal-${sch.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openJournalForClass(sch.kelas);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-all border border-slate-700"
                              title="Tulis Jurnal Mengajar untuk kelas ini"
                            >
                              <BookOpen className="w-3 h-3 text-emerald-400" />
                              <span>Isi Jurnal</span>
                            </button>
                            <button
                              id={`btn-open-nilai-${sch.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToSubTab('Penilaian Harian', 'input-nilai');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-all border border-slate-700"
                              title="Buka Penilaian Harian"
                            >
                              <Award className="w-3 h-3 text-amber-400" />
                              <span>Nilai</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN (7 Cols): Synchronized Live Student Attendance & Roster */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-5 shadow-sm">
                
                {/* Header of Student Panel */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black">
                        {activeSchedule ? activeSchedule.kelas : 'Pilih Kelas'}
                      </span>
                      <h3 className="text-base font-black text-white">Daftar Siswa & Presensi Hari Ini</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {activeSchedule 
                        ? `Mata Pelajaran: ${activeSchedule.mapel} | Jam Ke-${activeSchedule.jamKe} (${activeSchedule.startTime} - ${activeSchedule.endTime} ${currentTimezone})`
                        : 'Pilih jadwal di sebelah kiri untuk melihat daftar siswa'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="btn-nav-presensi-cepat"
                      onClick={() => navigateToSubTab('Dashboard', 'manual')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Presensi Grid</span>
                    </button>
                    {activeSchedule && (
                      <button
                        id="btn-nav-jurnal-kelas"
                        onClick={() => openJournalForClass(activeSchedule.kelas)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Isi Jurnal Kelas Ini</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Class Attendance Summary Counter */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <div className="bg-slate-950/70 border border-slate-800/80 p-2.5 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Total</span>
                    <span className="text-lg font-black text-white">{classAttendanceStats.total}</span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-emerald-400 block uppercase">Hadir</span>
                    <span className="text-lg font-black text-emerald-400">{classAttendanceStats.hadir}</span>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-amber-400 block uppercase">Telat</span>
                    <span className="text-lg font-black text-amber-400">{classAttendanceStats.terlambat}</span>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-blue-400 block uppercase">Sakit</span>
                    <span className="text-lg font-black text-blue-400">{classAttendanceStats.sakit}</span>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 p-2.5 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-purple-400 block uppercase">Izin</span>
                    <span className="text-lg font-black text-purple-400">{classAttendanceStats.izin}</span>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-rose-400 block uppercase">Alpa/Blm</span>
                    <span className="text-lg font-black text-rose-400">{classAttendanceStats.alpa + classAttendanceStats.belum}</span>
                  </div>
                </div>

                {/* Search Bar for Class Roster */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-cari-siswa-jadwal"
                    type="text"
                    placeholder={`Cari nama atau NISN di kelas ${activeSchedule?.kelas || ''}...`}
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {studentSearchTerm && (
                    <button
                      onClick={() => setStudentSearchTerm('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Student List Table */}
                {filteredClassStudents.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <User className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="text-xs">
                      {activeSchedule 
                        ? `Tidak ada data siswa yang terdaftar di kelas ${activeSchedule.kelas}.` 
                        : 'Pilih jadwal mengajar untuk menampilkan siswa.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                    {filteredClassStudents.map((student, idx) => {
                      const record = studentAttendanceMap.get(student.id) || studentAttendanceMap.get(student.nisn);
                      const currentStatus = record?.status;

                      let statusBadge = (
                        <span className="px-2 py-1 rounded-xl bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700">
                          Belum Presensi
                        </span>
                      );

                      if (currentStatus === 'Hadir') {
                        statusBadge = (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Hadir {record.time ? `(${record.time})` : ''}
                          </span>
                        );
                      } else if (currentStatus === 'Terlambat') {
                        statusBadge = (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                            Terlambat {record.time ? `(${record.time})` : ''}
                          </span>
                        );
                      } else if (currentStatus === 'Sakit') {
                        statusBadge = (
                          <span className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-300 text-[10px] font-black border border-blue-500/30">
                            Sakit
                          </span>
                        );
                      } else if (currentStatus === 'Izin') {
                        statusBadge = (
                          <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 text-[10px] font-black border border-purple-500/30">
                            Izin
                          </span>
                        );
                      } else if (currentStatus === 'Alpa') {
                        statusBadge = (
                          <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 text-[10px] font-black border border-rose-500/30">
                            Alpa
                          </span>
                        );
                      }

                      return (
                        <div
                          key={student.id}
                          id={`row-student-schedule-${student.id}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 text-center text-[11px] font-mono font-bold text-slate-500">
                              {idx + 1}
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-black text-xs text-slate-300 shrink-0 border border-slate-700/60">
                              {student.gender === 'P' ? '♀' : '♂'}
                            </div>
                            <div className="min-w-0 truncate">
                              <h5 className="text-xs font-bold text-white truncate">{student.name}</h5>
                              <p className="text-[10px] font-mono text-slate-400">
                                NISN: {student.nisn || '-'} • {student.gender === 'P' ? 'Perempuan' : 'Laki-laki'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                            {statusBadge}

                            {/* Quick Attendance action buttons */}
                            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                              <button
                                id={`quick-h-${student.id}`}
                                onClick={() => handleQuickMark(student, 'Hadir')}
                                className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center transition-all ${
                                  currentStatus === 'Hadir' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                                }`}
                                title="Set Hadir"
                              >
                                H
                              </button>
                              <button
                                id={`quick-t-${student.id}`}
                                onClick={() => handleQuickMark(student, 'Terlambat')}
                                className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center transition-all ${
                                  currentStatus === 'Terlambat' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                                }`}
                                title="Set Terlambat"
                              >
                                T
                              </button>
                              <button
                                id={`quick-s-${student.id}`}
                                onClick={() => handleQuickMark(student, 'Sakit')}
                                className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center transition-all ${
                                  currentStatus === 'Sakit' ? 'bg-blue-500 text-slate-950' : 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10'
                                }`}
                                title="Set Sakit"
                              >
                                S
                              </button>
                              <button
                                id={`quick-i-${student.id}`}
                                onClick={() => handleQuickMark(student, 'Izin')}
                                className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center transition-all ${
                                  currentStatus === 'Izin' ? 'bg-purple-500 text-slate-950' : 'text-slate-400 hover:text-purple-400 hover:bg-purple-500/10'
                                }`}
                                title="Set Izin"
                              >
                                I
                              </button>
                              <button
                                id={`quick-a-${student.id}`}
                                onClick={() => handleQuickMark(student, 'Alpa')}
                                className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center transition-all ${
                                  currentStatus === 'Alpa' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                }`}
                                title="Set Alpa"
                              >
                                A
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMENU 2: KELOLA JADWAL MINGGUAN (MATRIKS & EDIT MASTER)                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'kelola-jadwal' && (
        <div className="space-y-6">
          {/* Top Control bar with stats */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white">Matriks Jadwal Mengajar Mingguan</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total beban mengajar: <strong className="text-emerald-400 font-bold">{totalWeeklySchedules} sesi</strong> di <strong className="text-emerald-400 font-bold">{distinctClassesCount} kelas</strong> berbeda
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="btn-tambah-jadwal-modal"
                  onClick={() => handleOpenAddModal()}
                  className="px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Jadwal</span>
                </button>
                <button
                  id="btn-reset-jadwal"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                  title="Reset data contoh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-400 shrink-0">Filter Hari:</span>
                <select
                  id="filter-hari-jadwal"
                  value={managerDayFilter}
                  onChange={(e) => setManagerDayFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Semua">Semua Hari (Senin - Sabtu)</option>
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>

                <span className="text-xs font-bold text-slate-400 shrink-0 ml-2">Kelas:</span>
                <select
                  id="filter-kelas-jadwal"
                  value={managerClassFilter}
                  onChange={(e) => setManagerClassFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Semua">Semua Kelas</option>
                  {availableClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-end sm:self-auto">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    viewMode === 'cards' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Kolom Hari
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    viewMode === 'table' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tabel Rinci
                </button>
              </div>
            </div>
          </div>

          {/* Cards Day Column View */}
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DAYS_OF_WEEK.filter(d => managerDayFilter === 'Semua' || d.name === managerDayFilter).map(d => {
                const dayItems = weeklyFilteredSchedules
                  .filter(s => s.day === d.name)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div
                    key={d.name}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 flex flex-col"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                        <h4 className="text-sm font-black text-white">{d.name}</h4>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                        {dayItems.length} Sesi
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {dayItems.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-xs italic">
                          Tidak ada jadwal
                        </div>
                      ) : (
                        dayItems.map(item => (
                          <div
                            key={item.id}
                            className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 space-y-2 transition-all"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                Jam {item.jamKe}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {item.startTime} - {item.endTime}
                              </span>
                            </div>

                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-sm font-black text-white">{item.kelas}</h5>
                                <p className="text-xs font-bold text-slate-300">{item.mapel}</p>
                                {item.room && (
                                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5" /> {item.room}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleOpenEditModal(item)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                                  title="Edit"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget(item);
                                  }}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenAddModal(d.name)}
                      className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center gap-1 border border-slate-700/60 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tambah di {d.name}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                      <th className="py-3 px-3">Hari</th>
                      <th className="py-3 px-3">Jam Ke</th>
                      <th className="py-3 px-3">Waktu</th>
                      <th className="py-3 px-3">Kelas</th>
                      <th className="py-3 px-3">Mata Pelajaran</th>
                      <th className="py-3 px-3">Ruang</th>
                      <th className="py-3 px-3">Catatan</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {weeklyFilteredSchedules.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-white">{item.day}</td>
                        <td className="py-3 px-3 font-mono text-emerald-400 font-bold">{item.jamKe}</td>
                        <td className="py-3 px-3 font-mono text-slate-300">{item.startTime} - {item.endTime}</td>
                        <td className="py-3 px-3 font-black text-white">{item.kelas}</td>
                        <td className="py-3 px-3 font-medium text-slate-300">{item.mapel}</td>
                        <td className="py-3 px-3 text-slate-400">{item.room || '-'}</td>
                        <td className="py-3 px-3 text-slate-400 italic max-w-xs truncate">{item.notes || '-'}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMENU 3: CETAK JADWAL PELAJARAN (FORMAT RESMI DINAS)                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'cetak-jadwal' && (
        <JadwalPrintDocument
          settings={settings}
          teachingSchedules={teachingSchedules}
          allSchedulesSorted={teachingSchedules.slice().sort((a, b) => (a.dayIndex - b.dayIndex) || a.startTime.localeCompare(b.startTime))}
          currentTimezone={currentTimezone}
          totalWeeklyHours={teachingSchedules.length}
          uniqueClassesCount={availableClasses.length}
          today={today}
          onPrint={() => {
            showToast('Menyiapkan dokumen Jadwal Mengajar untuk dicetak...', 'info');
            printElementById('printable-jadwal-area', {
              title: `Jadwal Mengajar - ${settings.sekolah || 'Sekolah'}`,
              orientation: 'portrait',
              pageMargin: '8mm'
            });
          }}
          onExportExcel={() => {
            if (teachingSchedules.length === 0) {
              showToast('Belum ada jadwal mengajar untuk diekspor.', 'error');
              return;
            }
            let csvContent = 'data:text/csv;charset=utf-8,';
            csvContent += 'No,Hari,Jam Ke,Waktu Mulai,Waktu Selesai,Kelas,Mata Pelajaran,Ruang/Lab,Keterangan\n';
            const sorted = teachingSchedules.slice().sort((a, b) => (a.dayIndex - b.dayIndex) || a.startTime.localeCompare(b.startTime));
            sorted.forEach((item, idx) => {
              const row = [
                idx + 1,
                `"${item.day}"`,
                `"${item.jamKe}"`,
                `"${item.startTime}"`,
                `"${item.endTime}"`,
                `"${item.kelas}"`,
                `"${item.mapel}"`,
                `"${item.room || '-'}"`,
                `"${(item.notes || '-').replace(/"/g, '""')}"`
              ];
              csvContent += row.join(',') + '\n';
            });
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `Jadwal_Mengajar_${(settings.tahunAjaran || '2024-2025').replace(/\//g, '-')}_${today}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('File CSV Jadwal Mengajar berhasil diunduh.', 'success');
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT MODAL                                                          */}
      {/* ========================================================================= */}
      <JadwalModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveModal}
        editingItem={editingItem}
        formDay={formDay}
        setFormDay={setFormDay}
        formJamKe={formJamKe}
        setFormJamKe={setFormJamKe}
        formStartTime={formStartTime}
        setFormStartTime={setFormStartTime}
        formEndTime={formEndTime}
        setFormEndTime={setFormEndTime}
        formKelas={formKelas}
        setFormKelas={setFormKelas}
        formMapel={formMapel}
        setFormMapel={setFormMapel}
        formRoom={formRoom}
        setFormRoom={setFormRoom}
        formNotes={formNotes}
        setFormNotes={setFormNotes}
        availableClasses={availableClasses}
        currentTimezone={currentTimezone}
        daysOfWeek={DAYS_OF_WEEK}
      />

      {/* Delete Confirmation Modal */}
      <JadwalDeleteModal
        deleteTarget={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteTeachingSchedule(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        currentTimezone={currentTimezone}
      />

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {isResetConfirmOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Reset ke Jadwal Contoh?</h3>
                  <p className="text-xs text-slate-400">Seluruh jadwal yang Anda ubah akan dikembalikan ke data default.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  id="btn-confirm-reset-sch"
                  onClick={() => {
                    resetTeachingSchedules();
                    setIsResetConfirmOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ya, Reset Default</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
