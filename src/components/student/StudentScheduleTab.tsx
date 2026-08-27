import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, TeachingScheduleItem, TeachingJournal } from '../../types';
import { 
  Calendar, BookOpen, Clock, MapPin, 
  FileText, Sparkles, CheckCircle2, ChevronRight,
  UserCheck, AlertCircle, Bookmark, Layers
} from 'lucide-react';
import { cleanDateFormat } from '../../utils/formatters';

interface StudentScheduleTabProps {
  student: Student;
}

export const StudentScheduleTab: React.FC<StudentScheduleTabProps> = ({ student }) => {
  const { teachingSchedules = [], journals = [], settings } = useApp();
  
  const [activeSubView, setActiveSubView] = useState<'jadwal' | 'materi'>(() => {
    try {
      const saved = localStorage.getItem('qr_presensi_student_schedule_subview');
      if (saved === 'jadwal' || saved === 'materi') return saved;
    } catch (e) {}
    return 'jadwal';
  });

  const [selectedDay, setSelectedDay] = useState<string>(() => {
    try {
      return localStorage.getItem('qr_presensi_student_schedule_day') || 'SEMUA';
    } catch (e) {
      return 'SEMUA';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('qr_presensi_student_schedule_subview', activeSubView);
    } catch (e) {}
  }, [activeSubView]);

  useEffect(() => {
    try {
      localStorage.setItem('qr_presensi_student_schedule_day', selectedDay);
    } catch (e) {}
  }, [selectedDay]);

  const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const getDayIndex = (dayName?: string): number => {
    switch (dayName?.toLowerCase()) {
      case 'senin': return 1;
      case 'selasa': return 2;
      case 'rabu': return 3;
      case 'kamis': return 4;
      case 'jumat': return 5;
      case 'sabtu': return 6;
      case 'minggu': return 7;
      default: return 99;
    }
  };

  // Normalize and filter schedules for this student's class
  const classSchedules = useMemo(() => {
    const rawClass = (student?.class || '').trim().toLowerCase();
    const cleanClass = rawClass.replace(/[\s-_]/g, '');

    return (teachingSchedules || []).filter(s => {
      if (!s) return false;
      const schClass = (s.kelas || s.className || '').trim().toLowerCase();
      const cleanSchClass = schClass.replace(/[\s-_]/g, '');

      // Direct match or sanitized substring match
      return schClass === rawClass ||
             cleanSchClass === cleanClass ||
             schClass.includes(rawClass) ||
             rawClass.includes(schClass);
    }).map(s => ({
      id: s.id || Math.random().toString(),
      day: s.day || s.dayName || 'Senin',
      dayIndex: s.dayIndex !== undefined ? s.dayIndex : getDayIndex(s.day || s.dayName),
      startTime: s.startTime || '07:00',
      endTime: s.endTime || '08:00',
      jamKe: s.jamKe || '',
      kelas: s.kelas || s.className || student?.class || '',
      mapel: s.mapel || s.subject || 'Mata Pelajaran',
      ruang: s.ruang || s.room || '',
      teacherName: s.teacherName || settings?.namaGuru || '',
      notes: s.notes || ''
    })).sort((a, b) => {
      const dayDiff = a.dayIndex - b.dayIndex;
      if (dayDiff !== 0) return dayDiff;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
  }, [teachingSchedules, student?.class, settings?.namaGuru]);

  // Filter by selected day if any
  const displayedSchedules = useMemo(() => {
    if (selectedDay === 'SEMUA') return classSchedules;
    return classSchedules.filter(s => s.day.toLowerCase() === selectedDay.toLowerCase());
  }, [classSchedules, selectedDay]);

  // Filter journals / materi pembelajaran for this student's class
  const classJournals = useMemo(() => {
    const rawClass = (student?.class || '').trim().toLowerCase();
    const cleanClass = rawClass.replace(/[\s-_]/g, '');

    return (journals || []).filter(j => {
      if (!j) return false;
      const jClass = (j.kelas || '').trim().toLowerCase();
      const cleanJClass = jClass.replace(/[\s-_]/g, '');

      return jClass === rawClass || 
             cleanJClass === cleanClass ||
             jClass.includes(rawClass) ||
             rawClass.includes(jClass);
    }).map(j => ({
      id: j.id || Math.random().toString(),
      date: j.date ? cleanDateFormat(j.date) : new Date().toISOString().split('T')[0],
      day: j.day || 'Senin',
      kelas: j.kelas || student?.class || '',
      mapel: j.mapel || 'Mata Pelajaran',
      materi: j.materi || 'Materi Pembelajaran',
      metode: j.metode || '',
      catatan: j.catatan || '',
      paraf: j.paraf || ''
    })).sort((a, b) => {
      const dateA = cleanDateFormat(a.date);
      const dateB = cleanDateFormat(b.date);
      return dateB.localeCompare(dateA);
    });
  }, [journals, student?.class]);

  return (
    <div className="space-y-6 pb-8">
      {/* Sub-view switcher */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 max-w-md mx-auto shadow-md">
        <button
          onClick={() => setActiveSubView('jadwal')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubView === 'jadwal'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Jadwal Pelajaran</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-mono">
            {classSchedules.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubView('materi')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubView === 'materi'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Materi & Catatan Guru</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-mono">
            {classJournals.length}
          </span>
        </button>
      </div>

      {activeSubView === 'jadwal' && (
        <div className="space-y-4">
          {/* Day Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedDay('SEMUA')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                selectedDay === 'SEMUA'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              Semua Hari ({classSchedules.length})
            </button>
            {DAYS.map(day => {
              const count = classSchedules.filter(s => s.day.toLowerCase() === day.toLowerCase()).length;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                    selectedDay === day
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {day} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>

          {/* Schedule List */}
          {displayedSchedules.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 shadow-sm space-y-2">
              <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-1" />
              <p className="text-sm font-bold text-slate-200">
                {selectedDay === 'SEMUA' 
                  ? `Belum ada jadwal tersusun untuk kelas ${student?.class || 'ini'}`
                  : `Tidak ada jadwal pelajaran di hari ${selectedDay}`}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Jadwal KBM yang dimasukkan oleh guru di aplikasi web akan otomatis tampil dan terupdate di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {displayedSchedules.map((sch) => (
                <div 
                  key={sch.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-sm transition-all flex items-start justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        {sch.day}
                      </span>
                      <span className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {sch.startTime} - {sch.endTime}
                      </span>
                      {sch.jamKe && (
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                          Jam Ke: {sch.jamKe}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white truncate">
                      {sch.mapel}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      {sch.ruang && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{sch.ruang}</span>
                        </div>
                      )}
                      {sch.teacherName && (
                        <div className="text-[11px] text-slate-400">
                          Guru: <span className="text-slate-300 font-medium">{sch.teacherName}</span>
                        </div>
                      )}
                    </div>

                    {sch.notes && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        {sch.notes}
                      </p>
                    )}
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0 border border-slate-700">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubView === 'materi' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-emerald-400" />
                <span>Materi & Agenda Pembelajaran Kelas {student?.class}</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {classJournals.length} Agenda
              </span>
            </div>

            {classJournals.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <BookOpen className="w-10 h-10 mx-auto text-slate-600 mb-1" />
                <p className="text-sm font-bold text-slate-200">Belum ada catatan materi pembelajaran.</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Jurnal dan materi pembelajaran yang diinput guru saat KBM akan otomatis disinkronkan ke portal siswa ini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {classJournals.map((jrn) => (
                  <div key={jrn.id} className="p-5 hover:bg-slate-800/30 transition-colors space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          {jrn.mapel}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {jrn.day}, {jrn.date}
                        </span>
                      </div>
                      {jrn.paraf && (
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3" /> Terverifikasi KBM
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-100">
                      {jrn.materi}
                    </h4>

                    {jrn.metode && (
                      <p className="text-xs text-slate-400">
                        <span className="text-slate-500 font-medium">Metode / Kegiatan: </span>
                        {jrn.metode}
                      </p>
                    )}

                    {jrn.catatan && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                        <span className="text-emerald-400 font-semibold">Catatan / Tugas dari Guru: </span>
                        {jrn.catatan}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
