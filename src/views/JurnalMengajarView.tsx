import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TeachingJournal } from '../types';
import { formatIndonesianDayAndDate } from '../utils/formatters';
import { SubNavHeader } from '../components/SubNavHeader';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Plus, Printer, Download, Search, Trash2, Edit3, 
  CheckCircle, Calendar, UserCheck, FileText, X, Sparkles, Filter, Check, Clock, ExternalLink,
  Layers, Save, ShieldCheck
} from 'lucide-react';

export const JurnalMengajarView: React.FC = () => {
  const { 
    today, 
    students, 
    attendance, 
    journals, 
    settings, 
    addJournal, 
    updateJournal, 
    deleteJournal, 
    showToast,
    targetJournalClass,
    setTargetJournalClass,
    getActiveSubTab,
    setActiveSubTab
  } = useApp();

  const activeSubTab = getActiveSubTab('Jurnal Mengajar') || 'daftar-jurnal';

  // Filters for Daftar Submenu
  const [selectedClass, setSelectedClass] = useState<string>('Semua Kelas');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('');

  // Editing state
  const [editingJournal, setEditingJournal] = useState<TeachingJournal | null>(null);

  // Form State
  const [formDate, setFormDate] = useState<string>(today);
  const [formKelas, setFormKelas] = useState<string>('');
  const [formMapel, setFormMapel] = useState<string>('');
  const [formMateri, setFormMateri] = useState<string>('');
  const [formMetode, setFormMetode] = useState<string>('Diskusi Kelompok & Ceramah');
  const [formSiswaTidakHadirNama, setFormSiswaTidakHadirNama] = useState<string>('-');
  const [formSiswaTidakHadirKet, setFormSiswaTidakHadirKet] = useState<string>('-');
  const [formSiswaTidakHadirJml, setFormSiswaTidakHadirJml] = useState<number>(0);
  const [formTotalSiswa, setFormTotalSiswa] = useState<number>(30);
  const [formParaf, setFormParaf] = useState<string>('Paraf');
  const [formCatatan, setFormCatatan] = useState<string>('-');
  const [customKotaTandaTangan, setCustomKotaTandaTangan] = useState<string>(settings.kotaTandaTangan || 'Bula');
  
  // Integration Settings & Status
  const [countUnrecordedAsAlpa, setCountUnrecordedAsAlpa] = useState<boolean>(true);
  const [integrationInfo, setIntegrationInfo] = useState<{
    totalClassCount: number;
    totalScanned: number;
    hadir: number;
    terlambat: number;
    sakit: number;
    izin: number;
    alpa: number;
    belumAbsen: number;
  } | null>(null);

  // Print Filter & Sorting State (Submenu 3)
  const [printClassFilter, setPrintClassFilter] = useState<string>('Semua Kelas');
  const [printSortOrder, setPrintSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (settings.kotaTandaTangan) {
      setCustomKotaTandaTangan(settings.kotaTandaTangan);
    }
  }, [settings.kotaTandaTangan]);

  // Get unique student classes
  const availableClasses = useMemo(() => {
    const setCls = new Set<string>();
    students.forEach(s => {
      if (s.class) setCls.add(s.class.trim());
    });
    const arr = Array.from(setCls).sort();
    return arr.length > 0 ? arr : ['X IPA 1', 'X IPA 2', 'X IPS 1', 'XI IPA 1'];
  }, [students]);

  // Set default form class
  useEffect(() => {
    if (availableClasses.length > 0 && !formKelas) {
      setFormKelas(availableClasses[0]);
    }
  }, [availableClasses, formKelas]);

  // Set default mapel from settings
  useEffect(() => {
    if (settings.mataPelajaran) {
      setFormMapel(settings.mataPelajaran);
    } else {
      setFormMapel('Matematika');
    }
  }, [settings.mataPelajaran]);

  // Auto Lookup Attendance for Selected Date & Class
  const handleAutoLookupAttendance = (
    targetDate: string, 
    targetKelas: string, 
    includeUnrecordedAsAlpa: boolean = countUnrecordedAsAlpa,
    notifyUser: boolean = false
  ) => {
    if (!targetKelas) return;

    // Filter students in this class
    const classStudents = students.filter(s => s.class && s.class.trim() === targetKelas.trim());
    const totalClassCount = classStudents.length || 30;

    // Filter attendance records for target date (QR code or Manual)
    const dateLogs = attendance.filter(a => 
      a.date === targetDate && (
        (a.class && a.class.trim() === targetKelas.trim()) || 
        classStudents.some(s => s.id === a.studentId || s.nisn === a.nisn)
      )
    );

    const absentList: string[] = [];
    let hadirCount = 0;
    let terlambatCount = 0;
    let sakitCount = 0;
    let izinCount = 0;
    let alpaCount = 0;
    let belumAbsenCount = 0;

    classStudents.forEach(s => {
      const record = dateLogs.find(a => a.studentId === s.id || a.nisn === s.nisn);
      if (record) {
        if (record.status === 'Hadir') {
          hadirCount++;
        } else if (record.status === 'Terlambat') {
          terlambatCount++;
        } else if (record.status === 'Sakit') {
          sakitCount++;
          absentList.push(`${s.name} (Sakit)`);
        } else if (record.status === 'Izin') {
          izinCount++;
          absentList.push(`${s.name} (Izin)`);
        } else if (record.status === 'Alpa') {
          alpaCount++;
          absentList.push(`${s.name} (Alpa)`);
        }
      } else {
        belumAbsenCount++;
        if (includeUnrecordedAsAlpa) {
          alpaCount++;
          absentList.push(`${s.name} (Alpa/Belum Scan)`);
        }
      }
    });

    const totalAbsent = absentList.length;
    const ketParts: string[] = [];
    if (sakitCount > 0) ketParts.push(`S:${sakitCount}`);
    if (izinCount > 0) ketParts.push(`I:${izinCount}`);
    if (alpaCount > 0) ketParts.push(`A:${alpaCount}`);

    setFormSiswaTidakHadirNama(totalAbsent > 0 ? absentList.join(', ') : 'Nihil (Hadir Semua)');
    setFormSiswaTidakHadirKet(ketParts.length > 0 ? ketParts.join(', ') : 'Nihil');
    setFormSiswaTidakHadirJml(totalAbsent);
    setFormTotalSiswa(totalClassCount);

    const info = {
      totalClassCount,
      totalScanned: dateLogs.length,
      hadir: hadirCount,
      terlambat: terlambatCount,
      sakit: sakitCount,
      izin: izinCount,
      alpa: alpaCount,
      belumAbsen: belumAbsenCount
    };

    setIntegrationInfo(info);

    if (notifyUser) {
      const dayInfo = formatIndonesianDayAndDate(targetDate);
      showToast(
        `✓ Data presensi [QR & Manual] tanggal ${dayInfo.day}, ${dayInfo.formattedDate} (${targetKelas}) berhasil diintegrasikan! (Hadir: ${hadirCount}, Terlambat: ${terlambatCount}, Sakit: ${sakitCount}, Izin: ${izinCount}, Alpa: ${alpaCount})`,
        'success'
      );
    }
  };

  // Handle trigger from Dashboard 1-Click shortcut
  useEffect(() => {
    if (targetJournalClass) {
      setSelectedClass(targetJournalClass);
      setFormKelas(targetJournalClass);
      setEditingJournal(null);
      setFormDate(today);
      setFormMapel(settings.mataPelajaran || 'Matematika');
      setFormMateri('');
      setFormMetode('Diskusi Kelompok & Penugasan');
      setFormParaf('Paraf');
      setFormCatatan('Siswa mengikuti pembelajaran dengan tertib.');
      handleAutoLookupAttendance(today, targetJournalClass, countUnrecordedAsAlpa, false);
      setActiveSubTab('Jurnal Mengajar', 'isi-jurnal');
      setTargetJournalClass(null);
    }
  }, [targetJournalClass, today, settings.mataPelajaran, setTargetJournalClass, setActiveSubTab]);

  // Open Form for Creating New Journal
  const handleOpenCreateForm = () => {
    setEditingJournal(null);
    setFormDate(today);
    const defaultCls = selectedClass !== 'Semua Kelas' ? selectedClass : (availableClasses[0] || 'X IPA 1');
    setFormKelas(defaultCls);
    setFormMapel(settings.mataPelajaran || 'Matematika');
    setFormMateri('');
    setFormMetode('Diskusi Kelompok & Penugasan');
    setFormParaf('Paraf');
    setFormCatatan('Siswa mengikuti pembelajaran dengan tertib.');
    
    handleAutoLookupAttendance(today, defaultCls, countUnrecordedAsAlpa, false);
    setActiveSubTab('Jurnal Mengajar', 'isi-jurnal');
  };

  // Open Form for Editing Existing Journal
  const handleOpenEditForm = (j: TeachingJournal) => {
    setEditingJournal(j);
    setFormDate(j.date);
    setFormKelas(j.kelas);
    setFormMapel(j.mapel);
    setFormMateri(j.materi);
    setFormMetode(j.metode);
    setFormSiswaTidakHadirNama(j.siswaTidakHadirNama || '-');
    setFormSiswaTidakHadirKet(j.siswaTidakHadirKet || '-');
    setFormSiswaTidakHadirJml(j.siswaTidakHadirJml || 0);
    setFormTotalSiswa(j.totalSiswa || 30);
    setFormParaf(j.paraf || 'Paraf');
    setFormCatatan(j.catatan || '-');
    handleAutoLookupAttendance(j.date, j.kelas, countUnrecordedAsAlpa, false);
    setActiveSubTab('Jurnal Mengajar', 'isi-jurnal');
  };

  // Handle Form Submit
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMateri.trim()) {
      showToast('Pokok bahasan / materi tidak boleh kosong.', 'warning');
      return;
    }

    const dayInfo = formatIndonesianDayAndDate(formDate);

    const payload = {
      date: formDate,
      day: dayInfo.day,
      kelas: formKelas,
      mapel: formMapel,
      materi: formMateri.trim(),
      metode: formMetode.trim(),
      siswaTidakHadirNama: formSiswaTidakHadirNama.trim() || '-',
      siswaTidakHadirKet: formSiswaTidakHadirKet.trim() || '-',
      siswaTidakHadirJml: formSiswaTidakHadirJml,
      totalSiswa: formTotalSiswa,
      paraf: formParaf.trim() || 'Paraf',
      catatan: formCatatan.trim() || '-'
    };

    if (editingJournal) {
      updateJournal(editingJournal.id, payload);
      showToast('Jurnal mengajar berhasil diperbarui!', 'success');
    } else {
      addJournal(payload);
      showToast('Jurnal mengajar baru berhasil disimpan!', 'success');
    }

    setEditingJournal(null);
    setActiveSubTab('Jurnal Mengajar', 'daftar-jurnal');
  };

  // Filtered Journals List for Main Screen View
  const filteredJournals = useMemo(() => {
    return journals.filter(j => {
      const matchClass = selectedClass === 'Semua Kelas' || j.kelas === selectedClass;
      const matchMonth = !monthFilter || j.date.startsWith(monthFilter);
      const matchSearch = !searchTerm || 
        j.materi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.mapel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.day.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.catatan?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchClass && matchMonth && matchSearch;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [journals, selectedClass, monthFilter, searchTerm]);

  // Journals List Filtered & Sorted for Print Preview
  const printJournals = useMemo(() => {
    const list = journals.filter(j => {
      const matchClass = printClassFilter === 'Semua Kelas' || j.kelas === printClassFilter;
      const matchMonth = !monthFilter || j.date.startsWith(monthFilter);
      return matchClass && matchMonth;
    });

    return list.sort((a, b) => {
      if (printSortOrder === 'asc') {
        return a.date.localeCompare(b.date);
      } else {
        return b.date.localeCompare(a.date);
      }
    });
  }, [journals, printClassFilter, monthFilter, printSortOrder]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredJournals.length === 0) {
      showToast('Tidak ada data jurnal untuk diekspor.', 'warning');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'No,Hari/Tanggal,Kelas,Mata Pelajaran,Pokok Bahasan Materi,Metode Pembelajaran,Siswa Tidak Hadir,Keterangan,Jumlah Tidak Hadir,Total Siswa,Paraf,Catatan\n';

    filteredJournals.forEach((j, index) => {
      const dayDate = `${j.day}, ${j.date}`;
      const row = [
        index + 1,
        `"${dayDate}"`,
        `"${j.kelas}"`,
        `"${j.mapel}"`,
        `"${j.materi.replace(/"/g, '""')}"`,
        `"${j.metode.replace(/"/g, '""')}"`,
        `"${(j.siswaTidakHadirNama || '-').replace(/"/g, '""')}"`,
        `"${j.siswaTidakHadirKet || '-'}"`,
        j.siswaTidakHadirJml || 0,
        j.totalSiswa || 0,
        `"${j.paraf || 'Paraf'}"`,
        `"${(j.catatan || '-').replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Jurnal_Mengajar_Guru_${selectedClass !== 'Semua Kelas' ? selectedClass : 'Semua'}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('File CSV Jurnal Mengajar berhasil diunduh.', 'success');
  };

  // Print Action with Pop-up Window Fallback
  const handleTriggerPrint = () => {
    const printableElement = document.getElementById('printable-jurnal-area');
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
              <title>Jurnal Mengajar Guru - ${selectedClass}</title>
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
                  line-height: 1.3;
                }
                h1 { text-align: center; font-size: 16px; margin: 0 0 4px 0; text-transform: uppercase; text-decoration: underline; font-weight: bold; }
                p { margin: 2px 0; }
                table { width: 100%; border-collapse: collapse; text-align: center; margin-top: 8px; margin-bottom: 16px; }
                th, td { border: 1px solid #000; padding: 4px; font-size: 10px; }
                th { background-color: #f3f4f6; font-weight: bold; }
                .font-bold { font-weight: bold; }
                .font-mono { font-family: monospace; }
                .uppercase { text-transform: uppercase; }
                .underline { text-decoration: underline; }
                .italic { font-style: italic; }
                .text-left { text-align: left; }
                .flex { display: flex !important; }
                .justify-end { justify-content: flex-end !important; }
                .justify-between { justify-content: space-between !important; }
                .items-end { align-items: flex-end !important; }
                .w-full { width: 100% !important; }
                .text-center { text-align: center !important; }
                .signature-container {
                  display: flex !important;
                  justify-content: space-between !important;
                  width: 100% !important;
                  margin-top: 32px !important;
                }
                @media print {
                  body { padding: 0; }
                  .signature-container {
                    display: flex !important;
                    justify-content: space-between !important;
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
        showToast('Menyiapkan dokumen cetak / PDF...', 'info');
        return;
      }
    } catch (e) {
      console.warn('Pop-up failed, falling back to direct window print:', e);
    }

    window.focus();
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Submenu Navigation Header */}
      <SubNavHeader
        currentTab="Jurnal Mengajar"
        activeSubTab={activeSubTab}
        onSelectSubTab={(id) => setActiveSubTab('Jurnal Mengajar', id)}
        badgeCounts={{
          'daftar-jurnal': `${journals.length} Catatan`,
          'isi-jurnal': editingJournal ? 'Edit Jurnal' : '+ Baru',
          'cetak-laporan': 'Format Dinas'
        }}
        extraActions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateForm}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Isi Jurnal Baru</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={filteredJournals.length === 0}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ekspor</span>
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
          {/* SUBMENU 1: DAFTAR & REKAP JURNAL                                          */}
          {/* ========================================================================= */}
          {activeSubTab === 'daftar-jurnal' && (
            <div className="space-y-6">
          
          {/* Filter & Search Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari materi, mapel, catatan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Kelas */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-2xl">
              <Filter className="w-4 h-4 text-emerald-400 shrink-0" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="Semua Kelas" className="bg-slate-900 text-white">Semua Kelas</option>
                {availableClasses.map(cls => (
                  <option key={cls} value={cls} className="bg-slate-900 text-white">Kelas {cls}</option>
                ))}
              </select>
            </div>

            {/* Filter Bulan */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-2xl">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
              />
              {monthFilter && (
                <button 
                  onClick={() => setMonthFilter('')} 
                  className="text-slate-400 hover:text-white p-1"
                  title="Reset Bulan"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Teacher Info Card */}
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl flex items-center justify-between">
              <div className="truncate">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guru Pengajar</p>
                <p className="text-xs font-bold text-emerald-400 truncate">{settings.namaGuru || 'Puput Eka Bajuri, S. Pd'}</p>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded-lg shrink-0">
                {settings.nip ? `NIP. ${settings.nip}` : 'NIP. -'}
              </span>
            </div>
          </div>

          {/* Main Journal Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Daftar Agenda Mengajar</h2>
              </div>
              <p className="text-xs text-slate-400">
                {selectedClass !== 'Semua Kelas' ? `Menampilkan Kelas ${selectedClass}` : 'Seluruh Kelas'}
              </p>
            </div>

            {filteredJournals.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-3 stroke-[1.5]" />
                <h3 className="text-sm font-bold text-slate-300">Belum Ada Catatan Jurnal Mengajar</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Silakan klik tombol "Isi Jurnal Baru" untuk mencatat agenda pembelajaran kelas hari ini.
                </p>
                <button
                  onClick={handleOpenCreateForm}
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Isi Jurnal Mengajar</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4 w-32">Hari/Tanggal</th>
                      <th className="py-3 px-4 w-28">Kelas & Mapel</th>
                      <th className="py-3 px-4 min-w-[200px]">Pokok Bahasan KD / Judul Materi</th>
                      <th className="py-3 px-4 w-40">Metode Pemb.</th>
                      <th className="py-3 px-4 w-48">Siswa Tidak Hadir</th>
                      <th className="py-3 px-4 w-24">Catatan</th>
                      <th className="py-3 px-4 w-20 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredJournals.map((j, idx) => {
                      const dayInfo = formatIndonesianDayAndDate(j.date);
                      return (
                        <tr key={j.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                            {idx + 1}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{dayInfo.day}</div>
                            <div className="font-mono text-[11px] text-slate-400">{dayInfo.formattedDate}</div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-md text-[11px]">
                              {j.kelas}
                            </span>
                            <div className="text-[11px] text-slate-400 font-medium mt-0.5">{j.mapel}</div>
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-100 line-clamp-2">{j.materi}</p>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-slate-300 text-[11px] bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/50 inline-block">
                              {j.metode}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="text-[11px]">
                              {j.siswaTidakHadirJml && j.siswaTidakHadirJml > 0 ? (
                                <div>
                                  <span className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-[10px] mr-1">
                                    {j.siswaTidakHadirKet || `${j.siswaTidakHadirJml} orang`}
                                  </span>
                                  <div className="text-slate-400 line-clamp-2 text-[10px] mt-0.5">
                                    {j.siswaTidakHadirNama}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-emerald-400 font-medium text-[11px]">✓ Nihil (Hadir Semua)</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <p className="text-slate-400 text-[11px] line-clamp-2 italic">{j.catatan || '-'}</p>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditForm(j)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Edit Jurnal"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Hapus jurnal mengajar kelas ${j.kelas} tanggal ${j.date}?`)) {
                                    deleteJournal(j.id);
                                    showToast('Jurnal berhasil dihapus.', 'info');
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Hapus Jurnal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMENU 2: ISI JURNAL BARU / EDIT JURNAL                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'isi-jurnal' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl p-6 space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingJournal ? 'Edit Agenda Jurnal Mengajar' : 'Pengisian Jurnal Mengajar Harian'}
                </h3>
                <p className="text-xs text-slate-400">
                  Mencatat materi pembelajaran & rekap presensi kelas otomatis.
                </p>
              </div>
            </div>
            {editingJournal && (
              <button
                type="button"
                onClick={() => {
                  setEditingJournal(null);
                  handleOpenCreateForm();
                }}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                + Buat Catatan Baru
              </button>
            )}
          </div>

          <form onSubmit={handleSaveForm} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tanggal Pertemuan:</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => {
                    const newD = e.target.value;
                    setFormDate(newD);
                    handleAutoLookupAttendance(newD, formKelas);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  required
                />
                <span className="text-[11px] text-emerald-400 mt-1 block font-medium">
                  {formatIndonesianDayAndDate(formDate).day}
                </span>
              </div>

              {/* Kelas */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kelas yang Diajar:</label>
                <select
                  value={formKelas}
                  onChange={(e) => {
                    const newK = e.target.value;
                    setFormKelas(newK);
                    handleAutoLookupAttendance(formDate, newK);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  required
                >
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls} className="bg-slate-900 text-white">Kelas {cls}</option>
                  ))}
                </select>
              </div>

              {/* Mata Pelajaran */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mata Pelajaran:</label>
                <input
                  type="text"
                  placeholder="Contoh: Matematika"
                  value={formMapel}
                  onChange={(e) => setFormMapel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Pokok Bahasan Materi */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pokok Bahasan KD / Judul Materi:</label>
              <textarea
                rows={2}
                placeholder="Tuliskan pokok bahasan atau indikator materi yang diajarkan..."
                value={formMateri}
                onChange={(e) => setFormMateri(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3.5 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* Jenis Kegiatan / Metode Pembelajaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Jenis Kegiatan / Metode Pembelajaran:</label>
              <input
                type="text"
                placeholder="Contoh: Diskusi Kelompok, Ceramah, Latihan Soal, Presentasi"
                value={formMetode}
                onChange={(e) => setFormMetode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* Box Auto-lookup Presensi Siswa */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Integrasi Presensi Siswa (QR Code & Manual)</span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Otomatis
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Terintegrasi langsung dengan presensi tanggal <strong className="text-emerald-400">{formatIndonesianDayAndDate(formDate).day}, {formatIndonesianDayAndDate(formDate).formattedDate}</strong> & kelas <strong className="text-emerald-400">{formKelas}</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAutoLookupAttendance(formDate, formKelas, countUnrecordedAsAlpa, true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/20 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Integrasikan Presensi QR/Manual</span>
                </button>
              </div>

              {/* Integration Status Breakdown */}
              {integrationInfo && (
                <div className="bg-slate-900 border border-emerald-500/30 p-3 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Status Presensi Tanggal <span className="font-mono text-emerald-400">{formDate}</span> (Kelas {formKelas}):
                    </span>
                    <span className="text-slate-400 text-[10px] font-mono">
                      {integrationInfo.totalScanned} siswa tercatat absen
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-extrabold">
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      Hadir: {integrationInfo.hadir}
                    </span>
                    <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md">
                      Terlambat: {integrationInfo.terlambat}
                    </span>
                    <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md">
                      Sakit: {integrationInfo.sakit}
                    </span>
                    <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-md">
                      Izin: {integrationInfo.izin}
                    </span>
                    <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-md">
                      Alpa: {integrationInfo.alpa}
                    </span>
                    {integrationInfo.belumAbsen > 0 && (
                      <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-md">
                        Belum Scan: {integrationInfo.belumAbsen}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={countUnrecordedAsAlpa}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setCountUnrecordedAsAlpa(val);
                      handleAutoLookupAttendance(formDate, formKelas, val, false);
                    }}
                    className="w-3.5 h-3.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 cursor-pointer"
                  />
                  <span>Sertakan siswa yang belum scan/absen sebagai Alpa</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Nama Siswa Tidak Hadir:</label>
                  <input
                    type="text"
                    value={formSiswaTidakHadirNama}
                    onChange={(e) => setFormSiswaTidakHadirNama(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Keterangan (S/I/A):</label>
                  <input
                    type="text"
                    placeholder="Contoh: S:1, A:1"
                    value={formSiswaTidakHadirKet}
                    onChange={(e) => setFormSiswaTidakHadirKet(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Jumlah Tidak Hadir:</label>
                  <input
                    type="number"
                    min={0}
                    value={formSiswaTidakHadirJml}
                    onChange={(e) => setFormSiswaTidakHadirJml(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Total Siswa di Kelas:</label>
                  <input
                    type="number"
                    min={1}
                    value={formTotalSiswa}
                    onChange={(e) => setFormTotalSiswa(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Catatan / Kejadian di Kelas */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Catatan / Kejadian Khusus di Kelas:</label>
              <textarea
                rows={2}
                placeholder="Contoh: Siswa aktif bertanya, suasana kelas tertib..."
                value={formCatatan}
                onChange={(e) => setFormCatatan(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3.5 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveSubTab('Jurnal', 'daftar-jurnal')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{editingJournal ? 'Simpan Perubahan' : 'Simpan Jurnal Mengajar'}</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMENU 3: CETAK & FORMAT RESMI DINAS                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'cetak-laporan' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Controls Bar for Printable Report */}
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Kelas Cetak */}
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">Kelas:</span>
                <select
                  value={printClassFilter}
                  onChange={(e) => setPrintClassFilter(e.target.value)}
                  className="bg-transparent text-emerald-400 font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="Semua Kelas" className="bg-slate-900 text-white">Semua Kelas</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls} className="bg-slate-900 text-white">Kelas {cls}</option>
                  ))}
                </select>
              </div>

              {/* Urutan Pertemuan */}
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">Urutan:</span>
                <select
                  value={printSortOrder}
                  onChange={(e) => setPrintSortOrder(e.target.value as 'asc' | 'desc')}
                  className="bg-transparent text-emerald-400 font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="asc" className="bg-slate-900 text-white">Pertemuan 1 → Terakhir</option>
                  <option value="desc" className="bg-slate-900 text-white">Pertemuan Terakhir → 1</option>
                </select>
              </div>

              {/* Tempat TTD */}
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">Kota TTD:</span>
                <input
                  type="text"
                  value={customKotaTandaTangan}
                  onChange={(e) => setCustomKotaTandaTangan(e.target.value)}
                  placeholder="Bula"
                  className="bg-transparent text-emerald-400 font-bold text-xs w-24 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleTriggerPrint}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 stroke-[2.5]" />
                <span>Cetak / PDF Dokumen</span>
              </button>
            </div>
          </div>

          {/* Printable Document Preview Area */}
          <div className="bg-white text-black p-8 sm:p-12 rounded-3xl shadow-2xl border border-slate-200 overflow-x-auto font-serif leading-snug">
            
            <div id="printable-jurnal-area" className="min-w-[800px] w-full text-black bg-white mx-auto">
              
              {/* Header Information */}
              <div className="text-center mb-4">
                <h1 className="text-base font-bold uppercase tracking-wider underline">JURNAL MENGAJAR GURU</h1>
                {settings.sekolah && (
                  <p className="text-xs font-bold uppercase mt-0.5">{settings.sekolah}</p>
                )}
                <p className="text-[11px] font-bold text-slate-700 mt-0.5">
                  REKAPAN PERTEMUAN KE-1 S.D. PERTEMUAN KE-{printJournals.length || 1}
                </p>
              </div>

              <div className="flex justify-between items-end mb-2 text-xs font-bold">
                <div>
                  <span>KELAS: </span>
                  <span className="border-b border-black font-mono px-2 uppercase">
                    {printClassFilter}
                  </span>
                </div>
                <div>
                  <span>MATA PELAJARAN: </span>
                  <span className="border-b border-black font-mono px-2">
                    {settings.mataPelajaran || 'Matematika'}
                  </span>
                </div>
                <div>
                  <span>JUMLAH PERTEMUAN: </span>
                  <span className="border-b border-black font-mono px-2">
                    {printJournals.length} Pertemuan
                  </span>
                </div>
              </div>

              {/* Exact Table Layout */}
              <table className="w-full border-collapse border border-black text-[10px] text-center">
                <thead>
                  <tr className="border-b border-black bg-slate-100 font-bold">
                    <th rowSpan={2} className="border border-black px-1.5 py-1.5 w-7">No</th>
                    <th rowSpan={2} className="border border-black px-2 py-1.5 w-24">Hari/Tanggal</th>
                    <th rowSpan={2} className="border border-black px-2 py-1.5 w-24">Mata Pelajaran</th>
                    <th rowSpan={2} className="border border-black px-2 py-1.5 min-w-[150px]">Pokok Bahasan KD/Judul Materi</th>
                    <th rowSpan={2} className="border border-black px-2 py-1.5 w-28">Jenis Kegiatan/Metode Pemb</th>
                    <th colSpan={3} className="border border-black px-2 py-1">Siswa Tidak Hadir</th>
                    <th rowSpan={2} className="border border-black px-1 py-1.5 w-10">Jml Siswa</th>
                    <th rowSpan={2} className="border border-black px-1.5 py-1.5 w-12">Paraf</th>
                    <th rowSpan={2} className="border border-black px-2 py-1.5 w-28">Catatan</th>
                  </tr>
                  <tr className="border-b border-black bg-slate-100 font-bold">
                    <th className="border border-black px-1 py-1 min-w-[100px]">Nama</th>
                    <th className="border border-black px-1 py-1 w-10">Ket</th>
                    <th className="border border-black px-1 py-1 w-8">Jml</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(12, printJournals.length) }).map((_, idx) => {
                    const item = printJournals[idx];
                    if (item) {
                      const dayInfo = formatIndonesianDayAndDate(item.date);
                      return (
                        <tr key={item.id || idx} className="border-b border-black h-7">
                          <td className="border border-black font-mono font-bold">{idx + 1}</td>
                          <td className="border border-black text-left px-1.5">{dayInfo.day}, {dayInfo.formattedDate}</td>
                          <td className="border border-black text-left px-1.5">{item.mapel} {printClassFilter === 'Semua Kelas' ? `(${item.kelas})` : ''}</td>
                          <td className="border border-black text-left px-1.5 font-sans leading-tight">{item.materi}</td>
                          <td className="border border-black text-left px-1.5">{item.metode}</td>
                          <td className="border border-black text-left px-1 text-[9px]">{item.siswaTidakHadirNama || '-'}</td>
                          <td className="border border-black font-mono text-[9px]">{item.siswaTidakHadirKet || '-'}</td>
                          <td className="border border-black font-mono">{item.siswaTidakHadirJml || 0}</td>
                          <td className="border border-black font-mono">{item.totalSiswa || '-'}</td>
                          <td className="border border-black italic text-[9px]">{item.paraf || 'Paraf'}</td>
                          <td className="border border-black text-left px-1 text-[9px] italic">{item.catatan || '-'}</td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={`empty-${idx}`} className="border-b border-black h-6">
                        <td className="border border-black font-mono">{idx + 1}</td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Footer Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '32px' }} className="signature-container mt-8 flex justify-between w-full">
                {/* Left: Mengetahui Kepala Sekolah */}
                <div style={{ textAlign: 'center', fontSize: '12px', minWidth: '220px', display: 'inline-block' }} className="text-center text-xs space-y-1 min-w-[220px]">
                  <p style={{ margin: '2px 0' }}>Mengetahui,</p>
                  <p style={{ fontWeight: 'bold', margin: '2px 0' }} className="font-bold">
                    {settings.jabatanKepalaSekolah || 'Kepala Sekolah'}
                  </p>
                  
                  {settings.ttdKepalaSekolahUrl ? (
                    <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="h-16 flex items-center justify-center">
                      <img 
                        src={settings.ttdKepalaSekolahUrl} 
                        alt="Tanda Tangan Kepala Sekolah" 
                        style={{ maxHeight: '58px', maxWidth: '180px', objectFit: 'contain' }} 
                      />
                    </div>
                  ) : (
                    <div style={{ height: '60px' }} className="h-16"></div>
                  )}

                  <p style={{ fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase', margin: '2px 0' }} className="font-bold underline uppercase">
                    {settings.namaKepalaSekolah || 'Drs. H. Ahmad Dahlan, M.Pd'}
                  </p>
                  <p style={{ fontFamily: 'monospace', fontSize: '11px', margin: '2px 0' }} className="font-mono text-[11px]">
                    {settings.nipKepalaSekolah ? `NIP. ${settings.nipKepalaSekolah}` : 'NIP. 19700101 199503 1 001'}
                  </p>
                </div>

                {/* Right: Guru Mata Pelajaran */}
                <div style={{ textAlign: 'center', fontSize: '12px', minWidth: '220px', display: 'inline-block' }} className="text-center text-xs space-y-1 min-w-[220px]">
                  <p style={{ margin: '2px 0' }}>
                    {customKotaTandaTangan || 'Bula'}, {formatIndonesianDayAndDate(today).fullString.split(', ')[1] || today}
                  </p>
                  <p style={{ fontWeight: 'bold', margin: '2px 0' }} className="font-bold">Guru Mata Pelajaran</p>
                  
                  {settings.ttdGuruUrl ? (
                    <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="h-16 flex items-center justify-center">
                      <img 
                        src={settings.ttdGuruUrl} 
                        alt="Tanda Tangan Guru" 
                        style={{ maxHeight: '58px', maxWidth: '180px', objectFit: 'contain' }} 
                      />
                    </div>
                  ) : (
                    <div style={{ height: '60px' }} className="h-16"></div>
                  )}

                  <p style={{ fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase', margin: '2px 0' }} className="font-bold underline uppercase">
                    {settings.namaGuru || 'Puput Eka Bajuri, S. Pd'}
                  </p>
                  <p style={{ fontFamily: 'monospace', fontSize: '11px', margin: '2px 0' }} className="font-mono text-[11px]">
                    {settings.nip ? `NIP. ${settings.nip}` : 'NIP. 198810052020121003'}
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
};
