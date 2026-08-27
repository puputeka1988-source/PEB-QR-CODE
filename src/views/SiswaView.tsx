import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import { sortStudents, getStudentInitials } from '../utils/formatters';
import { StudentDetailModal } from '../components/modals/StudentDetailModal';
import { SubNavHeader } from '../components/layout/SubNavHeader';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { 
  Users, UserPlus, Search, Filter, Edit3, Trash2, QrCode, FileSpreadsheet, 
  RefreshCw, Upload, Download, FileUp, X, CheckCircle2, AlertCircle, FileText, 
  Printer, Eye, Save, Plus, HelpCircle, Check, Sparkles, Phone, GraduationCap,
  ChevronLeft, ChevronRight, CheckSquare, Square, MinusSquare
} from 'lucide-react';
import { SiswaModalForm } from './siswa/components/SiswaModalForm';
import { SiswaDeleteModal } from './siswa/components/SiswaDeleteModal';
import { SiswaQrModal } from './siswa/components/SiswaQrModal';
import { SiswaImporEkspor } from './siswa/components/SiswaImporEkspor';

export const SiswaView: React.FC = () => {
  const { 
    students, settings, addStudent, addStudentsBulk, updateStudent, 
    deleteStudent, deleteStudentsBulk, resetToSampleData, showToast,
    getActiveSubTab, setActiveSubTab, navigateToSubTab 
  } = useApp();

  const activeSubTab = getActiveSubTab('Siswa') || 'daftar';

  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('SEMUA');

  // Multi-Selection State for Bulk Deletion and Actions
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  // Pagination for Student Directory
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  
  // Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State (used for both modal and dedicated 'tambah' submenu)
  const [formName, setFormName] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formClass, setFormClass] = useState('X IPA 2');
  const [formGender, setFormGender] = useState<'L' | 'P'>('L');
  const [formPhone, setFormPhone] = useState('');
  const [formPin, setFormPin] = useState('');

  // Import CSV State
  const [previewData, setPreviewData] = useState<Omit<Student, 'id'>[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  // Delete Confirmation Modal State
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Student Detail & Dossier Modal State
  const [detailModalStudent, setDetailModalStudent] = useState<Student | null>(null);

  // QR Code Popup Modal State
  const [qrModalStudent, setQrModalStudent] = useState<Student | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (qrModalStudent) {
      QRCode.toDataURL(qrModalStudent.nisn, {
        width: 300,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Gagal membuat QR Code:', err));
    } else {
      setQrDataUrl('');
    }
  }, [qrModalStudent]);

  const classes = ['SEMUA', ...Array.from(new Set(students.map(s => s.class))).sort((a: string, b: string) => (a || '').localeCompare(b || '', 'id', { numeric: true }))];
  const availableClasses = classes.filter(c => c !== 'SEMUA');

  // Reset pagination to page 1 on filter change
  useEffect(() => {
    setPage(1);
  }, [search, selectedClass]);

  const filteredStudents = useMemo(() => {
    return sortStudents(
      students.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.nisn.includes(search);
        const matchClass = selectedClass === 'SEMUA' || s.class === selectedClass;
        return matchSearch && matchClass;
      })
    );
  }, [students, search, selectedClass]);

  const paginatedStudents = useMemo(() => {
    if (pageSize <= 0) return filteredStudents;
    const start = (page - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, page, pageSize]);

  const totalPages = useMemo(() => {
    if (pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  }, [filteredStudents.length, pageSize]);

  // Derived Selected Students
  const selectedStudents = useMemo(() => {
    return students.filter(s => selectedStudentIds.includes(s.id));
  }, [students, selectedStudentIds]);

  const isAllPageSelected = useMemo(() => {
    if (paginatedStudents.length === 0) return false;
    return paginatedStudents.every(s => selectedStudentIds.includes(s.id));
  }, [paginatedStudents, selectedStudentIds]);

  const isSomePageSelected = useMemo(() => {
    if (paginatedStudents.length === 0) return false;
    const countOnPage = paginatedStudents.filter(s => selectedStudentIds.includes(s.id)).length;
    return countOnPage > 0 && countOnPage < paginatedStudents.length;
  }, [paginatedStudents, selectedStudentIds]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredStudents.length === 0) return false;
    return filteredStudents.length === selectedStudentIds.length && filteredStudents.every(s => selectedStudentIds.includes(s.id));
  }, [filteredStudents, selectedStudentIds]);

  // Sync indeterminate state of header checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomePageSelected;
    }
  }, [isSomePageSelected]);

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageIdSet = new Set(paginatedStudents.map(s => s.id));
      setSelectedStudentIds(prev => prev.filter(id => !pageIdSet.has(id)));
    } else {
      const pageIds = paginatedStudents.map(s => s.id);
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedStudentIds([]);
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setFormName('');
    setFormNisn('');
    setFormClass(availableClasses[0] || 'X IPA 1');
    setFormGender('L');
    setFormPhone('');
    setFormPin('');
    setActiveSubTab('Siswa', 'tambah');
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormNisn(student.nisn);
    setFormClass(student.class);
    setFormGender(student.gender || 'L');
    setFormPhone(student.phone || '');
    setFormPin(student.studentPin || '');
    setModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formNisn.trim() || !formClass.trim()) {
      showToast('Mohon lengkapi Nama, NISN, dan Kelas siswa.', 'error');
      return;
    }

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        name: formName.trim(),
        nisn: formNisn.trim(),
        class: formClass.trim(),
        gender: formGender,
        phone: formPhone.trim(),
        studentPin: formPin.trim() || undefined
      });
      setModalOpen(false);
      setEditingStudent(null);
    } else {
      // Check duplicate NISN
      if (students.some(s => s.nisn === formNisn.trim())) {
        showToast('NISN sudah terdaftar pada siswa lain!', 'error');
        return;
      }

      addStudent({
        name: formName.trim(),
        nisn: formNisn.trim(),
        class: formClass.trim(),
        gender: formGender,
        phone: formPhone.trim(),
        studentPin: formPin.trim() || undefined
      });
      showToast(`Siswa "${formName.trim()}" berhasil ditambahkan!`, 'success');
      
      // Reset form
      setFormName('');
      setFormNisn('');
      setFormPhone('');
      setFormPin('');
      setActiveSubTab('Siswa', 'daftar');
    }
  };

  // CSV Parsing Helper
  const parseStudentCSV = (text: string): Omit<Student, 'id'>[] => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === ',' || char === ';') && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const header = parseLine(lines[0]).map(h => h.toLowerCase().trim());
    const nisnIdx = header.findIndex(h => h.includes('nisn') || h.includes('nomor') || h.includes('nis'));
    const nameIdx = header.findIndex(h => h.includes('nama') || h.includes('name') || h.includes('siswa'));
    const classIdx = header.findIndex(h => h.includes('kelas') || h.includes('class') || h.includes('rombel'));
    const genderIdx = header.findIndex(h => h.includes('gender') || h.includes('jenis kelamin') || h.includes('jk') || h.includes('sex'));
    const phoneIdx = header.findIndex(h => h.includes('telepon') || h.includes('telp') || h.includes('hp') || h.includes('wa') || h.includes('phone'));

    if (nisnIdx === -1 || nameIdx === -1 || classIdx === -1) {
      throw new Error('Format CSV tidak valid! Header harus memiliki kolom NISN, Nama, dan Kelas.');
    }

    const parsedStudents: Omit<Student, 'id'>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = parseLine(lines[i]);
      if (row.length < 3) continue;

      const nisn = row[nisnIdx] || '';
      const name = row[nameIdx] || '';
      const cls = row[classIdx] || '';
      
      let gender: 'L' | 'P' = 'L';
      if (genderIdx !== -1 && row[genderIdx]) {
        const gVal = row[genderIdx].toUpperCase().trim();
        if (gVal.startsWith('P') || gVal.includes('PEREMPUAN') || gVal.includes('FEMALE')) {
          gender = 'P';
        }
      }

      const phone = phoneIdx !== -1 ? (row[phoneIdx] || '') : '';

      if (nisn && name && cls) {
        parsedStudents.push({
          nisn,
          name,
          class: cls,
          gender,
          phone
        });
      }
    }

    return parsedStudents;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = parseStudentCSV(text);
        if (data.length === 0) {
          setImportError('Tidak ditemukan baris data siswa yang valid dalam file CSV.');
          setPreviewData([]);
        } else {
          setPreviewData(data);
          setImportError(null);
        }
      } catch (err: any) {
        setImportError(err.message || 'Gagal membaca file CSV.');
        setPreviewData([]);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (previewData.length === 0) return;
    addStudentsBulk(previewData);
    setPreviewData([]);
    setFileName('');
    setActiveSubTab('Siswa', 'daftar');
  };

  const downloadTemplateCSV = () => {
    const templateContent = "NISN,Nama Siswa,Kelas,Jenis Kelamin,Telepon\n" +
      "1234567801,Ahmad Rizky,X IPA 1,L,081234567891\n" +
      "1234567802,Siti Nurhaliza,X IPA 1,P,081234567892\n" +
      "1234567803,Budi Santoso,X IPA 2,L,081234567893\n" +
      "1234567804,Dewi Lestari,X IPS 1,P,081234567894\n";

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Template_Import_Siswa.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportStudentsCSV = () => {
    const headers = ['ID', 'NISN', 'Nama Siswa', 'Kelas', 'Jenis Kelamin', 'Telepon'];
    const rows = sortStudents(students).map(s => [
      s.id,
      `"${s.nisn}"`,
      `"${s.name}"`,
      `"${s.class}"`,
      s.gender || 'L',
      `"${s.phone || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Data_Siswa_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSelectedStudentsCSV = () => {
    if (selectedStudents.length === 0) return;
    const headers = ['ID', 'NISN', 'Nama Siswa', 'Kelas', 'Jenis Kelamin', 'Telepon'];
    const rows = sortStudents(selectedStudents).map(s => [
      s.id,
      `"${s.nisn}"`,
      `"${s.name}"`,
      `"${s.class}"`,
      s.gender || 'L',
      `"${s.phone || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Data_Siswa_Terpilih_${selectedStudents.length}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadQrImage = () => {
    if (!qrDataUrl || !qrModalStudent) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_NISN_${qrModalStudent.nisn}_${qrModalStudent.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const totalMale = students.filter(s => s.gender === 'L').length;
  const totalFemale = students.filter(s => s.gender === 'P').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Submenu Navigation Header */}
      <SubNavHeader
        currentTab="Siswa"
        activeSubTab={activeSubTab}
        onSelectSubTab={(id) => setActiveSubTab('Siswa', id)}
        badgeCounts={{
          daftar: `${students.length} Siswa`,
          tambah: '+ Baru',
          'impor-ekspor': 'CSV'
        }}
        extraActions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('Siswa', 'tambah')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Siswa</span>
            </button>
            <button
              onClick={exportStudentsCSV}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
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
          {/* SUBMENU 1: DAFTAR & DIREKTORI SISWA                                       */}
          {/* ========================================================================= */}
          {activeSubTab === 'daftar' && (
            <div className="space-y-6">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Siswa</span>
              <p className="text-2xl font-black text-white mt-1">{students.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Laki-Laki (L)</span>
              <p className="text-2xl font-black text-sky-400 mt-1">{totalMale}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Perempuan (P)</span>
              <p className="text-2xl font-black text-pink-400 mt-1">{totalFemale}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Jumlah Rombel</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{availableClasses.length}</p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau NISN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Class Pill Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-thin">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1 mr-0.5" />
              {classes.map(cls => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                    selectedClass === cls
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {cls === 'SEMUA' ? `Semua (${students.length})` : cls}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Action Toolbar Banner */}
          {selectedStudentIds.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-emerald-950/20"
            >
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{selectedStudentIds.length} Siswa Terpilih</span>
                </div>
                
                {filteredStudents.length > paginatedStudents.length && !isAllFilteredSelected && (
                  <button
                    type="button"
                    onClick={toggleSelectAllFiltered}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 cursor-pointer transition-colors"
                  >
                    Pilih Semua ({filteredStudents.length}) Siswa Terfilter
                  </button>
                )}

                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer transition-colors"
                >
                  Batal Pilih
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={exportSelectedStudentsCSV}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  title="Ekspor Data Siswa yang Dipilih ke CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ekspor CSV ({selectedStudentIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-500/20 cursor-pointer"
                  title="Hapus Semua Siswa Terpilih"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Masal ({selectedStudentIds.length})</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Student Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 w-10 text-center">
                      <input
                        ref={selectAllCheckboxRef}
                        type="checkbox"
                        checked={isAllPageSelected}
                        onChange={toggleSelectAllPage}
                        title={isAllPageSelected ? "Batalkan pilihan halaman ini" : "Pilih semua di halaman ini"}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer accent-emerald-500"
                      />
                    </th>
                    <th className="py-3.5 px-3">No</th>
                    <th className="py-3.5 px-4">Siswa</th>
                    <th className="py-3.5 px-4">NISN</th>
                    <th className="py-3.5 px-4">Kelas</th>
                    <th className="py-3.5 px-4">Gender</th>
                    <th className="py-3.5 px-4">Telepon / WA</th>
                    <th className="py-3.5 px-4 text-center">Aksi & Rekam Jejak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-500">
                        Tidak ada data siswa yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student, idx) => {
                      const actualIdx = pageSize <= 0 ? idx + 1 : (page - 1) * pageSize + idx + 1;
                      const isSelected = selectedStudentIds.includes(student.id);
                      return (
                        <tr 
                          key={student.id} 
                          className={`transition-colors ${
                            isSelected 
                              ? 'bg-emerald-950/25 hover:bg-emerald-950/35 border-l-2 border-l-emerald-400' 
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectStudent(student.id)}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer accent-emerald-500"
                            />
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-500">{actualIdx}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {student.photoUrl ? (
                                <img 
                                  src={student.photoUrl} 
                                  alt={student.name} 
                                  className="w-8 h-8 rounded-xl object-cover border border-slate-700 shrink-0" 
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 font-black text-xs flex items-center justify-center border border-slate-700/80 shrink-0 tracking-tight">
                                  {getStudentInitials(student.name)}
                                </div>
                              )}
                              <div className="font-bold text-white text-sm truncate">{student.name}</div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">{student.nisn}</td>
                          <td className="py-3.5 px-4">
                            <span className="bg-slate-950 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg font-semibold">
                              {student.class}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              student.gender === 'P' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            }`}>
                              {student.gender === 'P' ? 'Perempuan' : 'Laki-Laki'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">{student.phone || '-'}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Rekam Jejak / Detail */}
                              <button
                                onClick={() => setDetailModalStudent(student)}
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-colors cursor-pointer"
                                title="Buka Rekam Jejak & Berkas Siswa"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* QR Code */}
                              <button
                                onClick={() => setQrModalStudent(student)}
                                className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer"
                                title="Lihat QR Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => openEditModal(student)}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                                title="Edit Data Siswa"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => setDeletingStudent(student)}
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            {filteredStudents.length > 0 && (
              <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <span>Tampilkan:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value={15}>15 baris</option>
                    <option value={25}>25 baris</option>
                    <option value={50}>50 baris</option>
                    <option value={100}>100 baris</option>
                    <option value={-1}>Semua ({filteredStudents.length})</option>
                  </select>
                  <span className="text-slate-500">
                    Menampilkan {pageSize <= 0 ? filteredStudents.length : Math.min(filteredStudents.length, (page - 1) * pageSize + 1)} - {pageSize <= 0 ? filteredStudents.length : Math.min(filteredStudents.length, page * pageSize)} dari {filteredStudents.length} siswa
                  </span>
                </div>

                {pageSize > 0 && totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono px-2 text-slate-300 font-semibold">
                      Hal {page} dari {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
      {/* SUBMENU 2: TAMBAH SISWA BARU                                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'tambah' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Formulir Pendaftaran Siswa Baru</h3>
              <p className="text-xs text-slate-400 mt-0.5">Isi data lengkap siswa untuk membuat profil & QR Code otomatis.</p>
            </div>
          </div>

          <form onSubmit={handleSaveStudent} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap Siswa *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Muhammad Farhan Al-Fatih"
                required
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Induk Siswa Nasional (NISN) *</label>
                <input
                  type="text"
                  value={formNisn}
                  onChange={(e) => setFormNisn(e.target.value)}
                  placeholder="Contoh: 0081234567"
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-mono rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kelas / Rombongan Belajar *</label>
                <input
                  type="text"
                  value={formClass}
                  onChange={(e) => setFormClass(e.target.value)}
                  placeholder="Contoh: X IPA 1"
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Kelamin</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormGender('L')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formGender === 'L'
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>Laki-Laki (L)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormGender('P')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formGender === 'P'
                        ? 'bg-pink-500/20 text-pink-400 border-pink-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>Perempuan (P)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor HP / WhatsApp Wali</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-mono rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveSubTab('Data Siswa', 'daftar')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Batal / Kembali
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Siswa Baru</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMENU 3: IMPOR & EKSPOR DATA                                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'impor-ekspor' && (
        <SiswaImporEkspor
          fileName={fileName}
          importError={importError}
          previewData={previewData}
          studentsCount={students.length}
          onFileUpload={handleFileUpload}
          onDownloadTemplateCSV={downloadTemplateCSV}
          onConfirmImport={handleConfirmImport}
          onExportCSV={exportStudentsCSV}
          onResetToSampleData={() => {
            if (window.confirm('Reset data siswa ke sampel awal? Data yang belum dicadangkan akan ditimpa.')) {
              resetToSampleData();
            }
          }}
        />
      )}

        </motion.div>
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: EDIT DATA SISWA                                                    */}
      {/* ========================================================================= */}
      <SiswaModalForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveStudent}
        formName={formName}
        setFormName={setFormName}
        formNisn={formNisn}
        setFormNisn={setFormNisn}
        formClass={formClass}
        setFormClass={setFormClass}
        formGender={formGender}
        setFormGender={setFormGender}
        formPhone={formPhone}
        setFormPhone={setFormPhone}
        formPin={formPin}
        setFormPin={setFormPin}
      />

      {/* ========================================================================= */}
      {/* MODAL: HAPUS SISWA (TUNGGAL ATAU MASAL)                                   */}
      {/* ========================================================================= */}
      <SiswaDeleteModal
        deletingStudent={deletingStudent}
        bulkStudents={isBulkDeleteModalOpen ? selectedStudents : []}
        onClose={() => {
          setDeletingStudent(null);
          setIsBulkDeleteModalOpen(false);
        }}
        onConfirm={() => {
          if (isBulkDeleteModalOpen && selectedStudentIds.length > 0) {
            deleteStudentsBulk(selectedStudentIds);
            setSelectedStudentIds([]);
            setIsBulkDeleteModalOpen(false);
          } else if (deletingStudent) {
            deleteStudent(deletingStudent.id);
            setSelectedStudentIds(prev => prev.filter(id => id !== deletingStudent.id));
            setDeletingStudent(null);
          }
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL: QR CODE POPUP                                                      */}
      {/* ========================================================================= */}
      <SiswaQrModal
        qrModalStudent={qrModalStudent}
        qrDataUrl={qrDataUrl}
        onClose={() => setQrModalStudent(null)}
        onDownloadQr={handleDownloadQrImage}
        onOpenCardDetail={() => {
          setQrModalStudent(null);
          navigateToSubTab('Kartu QR', 'pratinjau-individu');
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL: REKAM JEJAK & DOSSIER SISWA                                        */}
      {/* ========================================================================= */}
      {detailModalStudent && (
        <StudentDetailModal
          student={detailModalStudent}
          onClose={() => setDetailModalStudent(null)}
        />
      )}

    </div>
  );
};
