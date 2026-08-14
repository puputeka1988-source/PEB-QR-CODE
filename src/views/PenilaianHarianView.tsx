import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Student, DailyGradeItem, ClassGradeSheet } from '../types';
import { formatIndonesianDayAndDate } from '../utils/formatters';
import { 
  Award, Printer, Download, Save, RefreshCw, ExternalLink, X, 
  Calendar, BookOpen, Check, FileSpreadsheet, Calculator
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const PenilaianHarianView: React.FC = () => {
  const { students, settings, showToast, today, academicYears, activeAcademicYear } = useApp();

  // Get available classes from student list
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();
    students.forEach(s => {
      if (s.class) classSet.add(s.class);
    });
    const arr = Array.from(classSet).sort();
    return arr.length > 0 ? arr : ['X IPA 1', 'X IPA 2', 'XI IPA 1', 'XII IPA 1'];
  }, [students]);

  // Selected filters
  const [selectedClass, setSelectedClass] = useState<string>(availableClasses[0] || 'X IPA 1');
  const [semester, setSemester] = useState<string>(() => activeAcademicYear?.semester || settings.semester || '1 (Ganjil)');
  const [tahunAjaran, setTahunAjaran] = useState<string>(() => activeAcademicYear?.name || settings.tahunAjaran || '2025/2026');
  const [mapel, setMapel] = useState<string>(settings.mataPelajaran || 'Informatika');
  const [customKotaTandaTangan, setCustomKotaTandaTangan] = useState<string>(settings.kotaTandaTangan || 'Bula');

  // Keep synced with activeAcademicYear if it updates
  useEffect(() => {
    if (activeAcademicYear) {
      setTahunAjaran(activeAcademicYear.name);
      setSemester(activeAcademicYear.semester);
    }
  }, [activeAcademicYear?.id]);

  // UH Metadata (Date & Materi for UH 1..6)
  const [uhMeta, setUhMeta] = useState<{ [key: number]: { date: string; materi: string } }>({
    1: { date: '', materi: '' },
    2: { date: '', materi: '' },
    3: { date: '', materi: '' },
    4: { date: '', materi: '' },
    5: { date: '', materi: '' },
    6: { date: '', materi: '' },
  });

  // Student Grades state map: { studentId: DailyGradeItem }
  const [studentGrades, setStudentGrades] = useState<{ [studentId: string]: DailyGradeItem }>({});

  // Modals & UI states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
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

  // Unique storage key for class + semester + tahunAjaran
  const storageKey = useMemo(() => {
    return `qr_presensi_grades_${selectedClass}_${semester}_${tahunAjaran.replace('/', '-')}`;
  }, [selectedClass, semester, tahunAjaran]);

  // Load saved grade sheet from LocalStorage & Firebase Firestore real-time listener
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsed: ClassGradeSheet = JSON.parse(savedData);
        if (parsed.uhMeta) setUhMeta(parsed.uhMeta);
        if (parsed.studentGrades) setStudentGrades(parsed.studentGrades);
        if (parsed.mapel) setMapel(parsed.mapel);
      } else {
        setUhMeta({
          1: { date: '', materi: '' },
          2: { date: '', materi: '' },
          3: { date: '', materi: '' },
          4: { date: '', materi: '' },
          5: { date: '', materi: '' },
          6: { date: '', materi: '' },
        });
        setStudentGrades({});
      }
      setHasUnsavedChanges(false);
    } catch (e) {
      console.error('Failed to load grades from LocalStorage:', e);
    }

    const unsub = onSnapshot(doc(db, 'gradeSheets', storageKey), snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data() as ClassGradeSheet;
        if (data.uhMeta) setUhMeta(data.uhMeta);
        if (data.studentGrades) setStudentGrades(data.studentGrades);
        if (data.mapel) setMapel(data.mapel);
        setHasUnsavedChanges(false);
      }
    }, err => console.error('Firestore gradeSheet sync error:', err));

    return () => unsub();
  }, [storageKey]);

  // Filter students by selected class
  const classStudents = useMemo(() => {
    return students
      .filter(s => s.class === selectedClass)
      .sort((a, b) => a.name.localeCompare(b.name, 'id'));
  }, [students, selectedClass]);

  // Handle grade change for individual student
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

  // Auto calculate final grade for all students
  const handleAutoCalculateFinalGrades = () => {
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

          if (uhValues.length > 0) {
            totalScore += avgUH * 2; // UH weight 2
            sumWeights += 2;
          }
          if (utsVal !== null) {
            totalScore += utsVal * 1; // UTS weight 1
            sumWeights += 1;
          }
          if (uasVal !== null) {
            totalScore += uasVal * 1; // UAS weight 1
            sumWeights += 1;
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
    showToast('Nilai akhir otomatis berhasil dikalkulasi.', 'success');
  };

  // Save grade sheet to LocalStorage & Firebase Firestore
  const handleSaveGrades = () => {
    try {
      const gradeSheetData: ClassGradeSheet = {
        id: storageKey,
        kelas: selectedClass,
        semester,
        tahunAjaran,
        mapel,
        uhMeta,
        studentGrades,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(gradeSheetData));
      setDoc(doc(db, 'gradeSheets', storageKey), gradeSheetData).catch(console.error);
      setHasUnsavedChanges(false);
      showToast(`Data Nilai Harian Kelas ${selectedClass} berhasil disimpan ke Cloud & Lokal!`, 'success');
    } catch (e) {
      console.error('Failed to save grades:', e);
      showToast('Gagal menyimpan data nilai.', 'error');
    }
  };

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
    csv += `,,TANGGAL,${uhMeta[1].date || '-'},${uhMeta[2].date || '-'},${uhMeta[3].date || '-'},${uhMeta[4].date || '-'},${uhMeta[5].date || '-'},${uhMeta[6].date || '-'}\n`;
    csv += `,,MATERI,${uhMeta[1].materi || '-'},${uhMeta[2].materi || '-'},${uhMeta[3].materi || '-'},${uhMeta[4].materi || '-'},${uhMeta[5].materi || '-'},${uhMeta[6].materi || '-'}\n`;

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

  // Print Action (With Pop-up Window Fallback and 100% iframe unblock support)
  const handleTriggerPrint = () => {
    const printableElement = document.getElementById('printable-nilai-area');
    if (!printableElement) {
      window.focus();
      window.print();
      return;
    }

    try {
      const printWin = window.open('', '_blank', 'width=1150,height=850,scrollbars=yes');
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Daftar Nilai Harian Siswa - ${selectedClass}</title>
              <style>
                @page {
                  size: A4 landscape;
                  margin: 8mm;
                }
                body {
                  font-family: 'Times New Roman', Times, serif;
                  margin: 0;
                  padding: 8mm;
                  color: #000;
                  background: #fff;
                  font-size: 11px;
                  line-height: 1.2;
                }
                h1 { text-align: center; font-size: 15px; margin: 0 0 12px 0; text-transform: uppercase; font-weight: bold; text-decoration: underline; }
                table { width: 100%; border-collapse: collapse; text-align: center; margin-top: 6px; margin-bottom: 16px; }
                th, td { border: 1px solid #000; padding: 3px 2px; font-size: 10px; }
                th { background-color: #f3f4f6; font-weight: bold; }
                .meta-table { width: 100%; margin-bottom: 8px; border: none; font-size: 11px; text-align: left; }
                .meta-table td { border: none; padding: 2px 4px; text-align: left; }
                .signature-container {
                  display: flex !important;
                  justify-content: flex-end !important;
                  width: 100% !important;
                  margin-top: 24px !important;
                }
                @media print {
                  body { padding: 0; }
                  .signature-container {
                    display: flex !important;
                    justify-content: flex-end !important;
                    width: 100% !important;
                  }
                }
              </style>
            </head>
            <body>
              ${printableElement.innerHTML}
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 300);
                };
              </script>
            </body>
          </html>
        `);
        printWin.document.close();
        showToast('Menyiapkan dokumen cetak Nilai Harian...', 'info');
        return;
      }
    } catch (e) {
      console.warn('Pop-up print failed, fallback to window print:', e);
    }

    window.focus();
    window.print();
  };

  // Render padded rows up to 30 matching the image format
  const tableRows = useMemo(() => {
    const minRows = 30;
    const rows = [...classStudents];
    return { rows, totalDisplay: Math.max(minRows, rows.length) };
  }, [classStudents]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>Rekapitulasi Penilaian Harian</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white italic tracking-tight">Daftar Nilai Harian Siswa</h1>
          <p className="text-xs text-slate-400">
            Format resmi sesuai standar rekapitulasi nilai Ulangan Harian (UH 1-6), UTS, UAS, dan Nilai Akhir.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleAutoCalculateFinalGrades}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 px-3.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
            title="Kalkulasi otomatis Nilai Akhir berdasarkan rata-rata UH, UTS, dan UAS"
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Hitung Nilai Akhir</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 px-3.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak / PDF</span>
          </button>

          <button
            onClick={handleSaveGrades}
            className={`flex items-center gap-1.5 text-xs font-black py-2.5 px-4 rounded-xl shadow-lg transition-all cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{hasUnsavedChanges ? 'Simpan Perubahan' : 'Tersimpan'}</span>
          </button>
        </div>
      </div>

      {/* Filter Options Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 font-bold mb-1">Pilih Kelas:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {availableClasses.map(cls => (
              <option key={cls} value={cls}>Kelas {cls}</option>
            ))}
          </select>
        </div>

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
        
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Input Nilai Siswa Kelas {selectedClass}</h2>
            <span className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
              {classStudents.length} Siswa
            </span>
          </div>

          <span className="text-[11px] text-slate-400 italic hidden md:inline">
            *Ketik nilai secara manual di kolom UH 1-6, UTS, & UAS.
          </span>
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
                  NILAI HARIAN
                </th>
                <th className="p-3 text-center border-r border-slate-800 w-16" rowSpan={3}>NILAI UTS</th>
                <th className="p-3 text-center border-r border-slate-800 w-16" rowSpan={3}>NILAI UAS</th>
                <th className="p-3 text-center w-20 bg-emerald-500/10 text-emerald-300" rowSpan={3}>NILAI AKHIR</th>
              </tr>

              {/* UH Meta Row: Tanggal & Materi */}
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px]">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <th key={i} className="p-1.5 border-r border-slate-800 min-w-[110px] space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-[10px] w-12">Tgl:</span>
                      <input
                        type="text"
                        value={uhMeta[i]?.date || ''}
                        onChange={(e) => handleUhMetaChange(i, 'date', e.target.value)}
                        placeholder="dd/mm"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded text-[11px] px-1 py-0.5 text-center text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-[10px] w-12">Materi:</span>
                      <input
                        type="text"
                        value={uhMeta[i]?.materi || ''}
                        onChange={(e) => handleUhMetaChange(i, 'materi', e.target.value)}
                        placeholder="Judul Materi"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded text-[11px] px-1 py-0.5 text-center text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </th>
                ))}
              </tr>

              {/* UH Sub-headers */}
              <tr className="bg-slate-950 border-b border-slate-800 text-center font-bold text-slate-300">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <th key={i} className="p-2 border-r border-slate-800 bg-slate-900/60">
                    UH {i}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    Belum ada siswa di kelas <strong className="text-white">{selectedClass}</strong>. Silakan tambahkan siswa di menu Data Siswa.
                  </td>
                </tr>
              ) : (
                classStudents.map((student, index) => {
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
            Disimpan secara lokal untuk Kelas <strong className="text-emerald-400">{selectedClass}</strong> • {semester} • TA {tahunAjaran}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveGrades}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              Simpan Data Nilai
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* PRINT PREVIEW MODAL - FULL A4 LANDSCAPE OFFICIAL STANDARD AS IN IMAGE */}
      {/* ======================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white text-black w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Top Bar */}
            <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <Printer className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold">Pratinjau Cetak Daftar Nilai Harian Siswa</h3>
                  <p className="text-[11px] text-slate-400">Format tabel resmi sesuai standar daftar nilai sekolah.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                {/* Kota/Kec Tanda Tangan */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">Kota/Kec Tanda Tangan:</span>
                  <input
                    type="text"
                    value={customKotaTandaTangan}
                    onChange={(e) => setCustomKotaTandaTangan(e.target.value)}
                    placeholder="Contoh: Bula"
                    className="bg-slate-900 text-emerald-400 font-bold text-xs px-2 py-1 rounded-lg border border-slate-700 w-28 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-3 py-2 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  title="Buka aplikasi di tab baru agar cetak/PDF berjalan 100% tanpa hambatan iframe"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden md:inline">Buka di Tab Baru</span>
                </button>

                <button
                  onClick={handleTriggerPrint}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Cetak PDF</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Area Scroll Wrapper */}
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              
              <div 
                id="printable-nilai-area" 
                className="bg-white text-black font-serif text-[11px] leading-tight max-w-[1100px] mx-auto p-4 border border-slate-200 rounded shadow-sm"
              >
                
                {/* Title Centered */}
                <h1 className="text-center font-bold text-base uppercase tracking-wider mb-4 underline">
                  DAFTAR NILAI HARIAN SISWA
                </h1>

                {/* Header Information matching the uploaded image */}
                <table className="meta-table w-full mb-3 text-xs border-none" style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '120px', border: 'none', padding: '2px 0' }} className="font-semibold">Kelas</td>
                      <td style={{ width: '10px', border: 'none', padding: '2px 0' }}>:</td>
                      <td style={{ border: 'none', padding: '2px 0' }} className="font-bold">{selectedClass}</td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', padding: '2px 0' }} className="font-semibold">Semester</td>
                      <td style={{ border: 'none', padding: '2px 0' }}>:</td>
                      <td style={{ border: 'none', padding: '2px 0' }}>{semester}</td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', padding: '2px 0' }} className="font-semibold">Tahun Ajaran</td>
                      <td style={{ border: 'none', padding: '2px 0' }}>:</td>
                      <td style={{ border: 'none', padding: '2px 0' }}>{tahunAjaran}</td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', padding: '2px 0' }} className="font-semibold">Mata Pelajaran</td>
                      <td style={{ border: 'none', padding: '2px 0' }}>:</td>
                      <td style={{ border: 'none', padding: '2px 0' }}>{mapel}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Main Print Grid Table matching Image structure */}
                <table 
                  style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'center', marginTop: '8px', marginBottom: '16px' }}
                  className="w-full text-center border-collapse border border-black"
                >
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th rowSpan={3} style={{ border: '1px solid #000', padding: '4px', width: '32px' }}>NO</th>
                      <th rowSpan={3} style={{ border: '1px solid #000', padding: '4px 6px', width: '200px', textAlign: 'center', whiteSpace: 'nowrap' }}>NAMA SISWA</th>
                      <th rowSpan={3} style={{ border: '1px solid #000', padding: '4px', width: '35px' }}>L/P</th>
                      <th colSpan={6} style={{ border: '1px solid #000', padding: '4px' }}>NILAI HARIAN</th>
                      <th rowSpan={3} style={{ border: '1px solid #000', padding: '4px', width: '50px' }}>NILAI UTS</th>
                      <th rowSpan={3} style={{ border: '1px solid #000', padding: '4px', width: '50px' }}>NILAI UAS</th>
                      <th rowSpan={3} style={{ border: '1px solid #000', padding: '4px', width: '60px' }}>NILAI AKHIR</th>
                    </tr>

                    <tr>
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <th key={i} style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '9px', textAlign: 'left', fontWeight: 'normal' }}>
                          <div>Tanggal: {uhMeta[i]?.date || ''}</div>
                          <div>Materi: {uhMeta[i]?.materi || ''}</div>
                        </th>
                      ))}
                    </tr>

                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <th key={i} style={{ border: '1px solid #000', padding: '3px' }}>
                          UH {i}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {Array.from({ length: tableRows.totalDisplay }).map((_, idx) => {
                      const student: Student | undefined = tableRows.rows[idx];
                      const grades = student ? (studentGrades[student.id] || {}) : {};

                      return (
                        <tr key={idx} style={{ height: '22px' }}>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #000', padding: '2px 6px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {student ? student.name : ''}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>
                            {student ? (student.gender || 'L') : ''}
                          </td>
                          
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{grades.uh1 || ''}</td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{grades.uh2 || ''}</td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{grades.uh3 || ''}</td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{grades.uh4 || ''}</td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{grades.uh5 || ''}</td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{grades.uh6 || ''}</td>
                          
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{grades.uts || ''}</td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{grades.uas || ''}</td>
                          <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center', fontWeight: 'bold' }}>{grades.finalGrade || ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Signature Block with Principal & Teacher Signatures */}
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '28px' }} 
                  className="signature-container"
                >
                  {/* Left: Mengetahui, Kepala Sekolah */}
                  <div style={{ textAlign: 'center', fontSize: '11px', minWidth: '220px', display: 'inline-block' }}>
                    <p style={{ margin: '2px 0' }}>Mengetahui,</p>
                    <p style={{ fontWeight: 'bold', margin: '2px 0' }}>
                      {settings.jabatanKepalaSekolah || 'Kepala Sekolah'}
                    </p>
                    
                    {/* Space for Signature */}
                    {settings.ttdKepalaSekolahUrl ? (
                      <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                          src={settings.ttdKepalaSekolahUrl} 
                          alt="Tanda Tangan Kepala Sekolah" 
                          style={{ maxHeight: '58px', maxWidth: '180px', objectFit: 'contain' }} 
                        />
                      </div>
                    ) : (
                      <div style={{ height: '60px' }}></div>
                    )}

                    <p style={{ fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase', margin: '2px 0' }}>
                      {settings.namaKepalaSekolah || 'Drs. H. Ahmad Dahlan, M.Pd'}
                    </p>
                    <p style={{ fontFamily: 'monospace', fontSize: '11px', margin: '2px 0' }}>
                      {settings.nipKepalaSekolah ? `NIP. ${settings.nipKepalaSekolah}` : 'NIP. 19700101 199503 1 001'}
                    </p>
                  </div>

                  {/* Right: Tempat/Tanggal, Guru Mata Pelajaran */}
                  <div style={{ textAlign: 'center', fontSize: '11px', minWidth: '220px', display: 'inline-block' }}>
                    <p style={{ margin: '2px 0' }}>
                      {customKotaTandaTangan || 'Bula'}, {formatIndonesianDayAndDate(today).fullString.split(', ')[1] || today}
                    </p>
                    <p style={{ fontWeight: 'bold', margin: '2px 0' }}>Guru Mata Pelajaran</p>
                    
                    {/* Space for Signature */}
                    {settings.ttdGuruUrl ? (
                      <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                          src={settings.ttdGuruUrl} 
                          alt="Tanda Tangan Guru" 
                          style={{ maxHeight: '58px', maxWidth: '180px', objectFit: 'contain' }} 
                        />
                      </div>
                    ) : (
                      <div style={{ height: '60px' }}></div>
                    )}

                    <p style={{ fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase', margin: '2px 0' }}>
                      {settings.namaGuru || 'Puput Eka Bajuri, S. Pd'}
                    </p>
                    <p style={{ fontFamily: 'monospace', fontSize: '11px', margin: '2px 0' }}>
                      {settings.nip ? `NIP. ${settings.nip}` : 'NIP. 198810052020121003'}
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
