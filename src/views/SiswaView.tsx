import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import { sortStudents, getStudentInitials } from '../utils/formatters';
import { StudentDetailModal } from '../components/StudentDetailModal';
import { SubNavHeader } from '../components/SubNavHeader';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { 
  Users, UserPlus, Search, Filter, Edit3, Trash2, QrCode, FileSpreadsheet, 
  RefreshCw, Upload, Download, FileUp, X, CheckCircle2, AlertCircle, FileText, 
  Printer, Eye, Save, Plus, HelpCircle, Check, Sparkles, Phone, GraduationCap
} from 'lucide-react';

export const SiswaView: React.FC = () => {
  const { 
    students, settings, addStudent, addStudentsBulk, updateStudent, 
    deleteStudent, resetToSampleData, showToast,
    getActiveSubTab, setActiveSubTab, navigateToSubTab 
  } = useApp();

  const activeSubTab = getActiveSubTab('Siswa') || 'daftar';

  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('SEMUA');
  
  // Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State (used for both modal and dedicated 'tambah' submenu)
  const [formName, setFormName] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formClass, setFormClass] = useState('X IPA 2');
  const [formGender, setFormGender] = useState<'L' | 'P'>('L');
  const [formPhone, setFormPhone] = useState('');

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

  const filteredStudents = sortStudents(
    students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.nisn.includes(search);
      const matchClass = selectedClass === 'SEMUA' || s.class === selectedClass;
      return matchSearch && matchClass;
    })
  );

  const openAddModal = () => {
    setEditingStudent(null);
    setFormName('');
    setFormNisn('');
    setFormClass(availableClasses[0] || 'X IPA 1');
    setFormGender('L');
    setFormPhone('');
    setActiveSubTab('Siswa', 'tambah');
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormNisn(student.nisn);
    setFormClass(student.class);
    setFormGender(student.gender || 'L');
    setFormPhone(student.phone || '');
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
        phone: formPhone.trim()
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
        phone: formPhone.trim()
      });
      showToast(`Siswa "${formName.trim()}" berhasil ditambahkan!`, 'success');
      
      // Reset form
      setFormName('');
      setFormNisn('');
      setFormPhone('');
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

          {/* Student Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">No</th>
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
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        Tidak ada data siswa yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-500">{idx + 1}</td>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-150">
          
          {/* Card 1: Impor Data Massal dari CSV / Excel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Impor Massal Siswa (CSV / Excel)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Unggah berkas CSV untuk mendaftarkan ratusan siswa dalam hitungan detik.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">1. Unduh Template Format CSV:</span>
                <button
                  type="button"
                  onClick={downloadTemplateCSV}
                  className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Upload Drop Area */}
              <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                <FileUp className="w-10 h-10 text-emerald-400 mb-2" />
                <span className="text-xs font-bold text-white">
                  {fileName ? `File terpilih: ${fileName}` : 'Klik atau Tarik File CSV ke sini'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">Mendukung format .csv (Koma atau Titik Koma)</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {importError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview Table */}
              {previewData.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Pratinjau Data ({previewData.length} Siswa Terdeteksi):</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-[11px] text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                        <tr>
                          <th className="p-2">Nama</th>
                          <th className="p-2">NISN</th>
                          <th className="p-2">Kelas</th>
                          <th className="p-2">JK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {previewData.slice(0, 8).map((p, i) => (
                          <tr key={i}>
                            <td className="p-2 font-semibold text-white">{p.name}</td>
                            <td className="p-2 font-mono text-emerald-400">{p.nisn}</td>
                            <td className="p-2">{p.class}</td>
                            <td className="p-2">{p.gender}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Konfirmasi & Simpan {previewData.length} Siswa</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Ekspor Data & Pemulihan Sampel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ekspor & Cadangan Data Siswa</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Unduh data seluruh siswa aktif untuk pencatatan offline.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Ekspor Data Lengkap Siswa:</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    File CSV mencakup ID Siswa, NISN, Nama Lengkap, Rombel/Kelas, Jenis Kelamin, dan Nomor HP Wali.
                  </p>
                  <button
                    onClick={exportStudentsCSV}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Unduh File CSV ({students.length} Siswa)</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                    <span>Muat Ulang Data Sampel Madrasah:</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Mengembalikan data siswa ke sampel awal lengkap (Kelas X IPA 1, X IPA 2, X IPS 1, XI IPA 1).
                  </p>
                  <button
                    onClick={() => {
                      if (window.confirm('Reset data siswa ke sampel awal? Data yang belum dicadangkan akan ditimpa.')) {
                        resetToSampleData();
                      }
                    }}
                    className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs py-2.5 rounded-xl border border-amber-500/30 transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset ke Sampel Default</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 text-center">
              Perubahan data siswa disinkronkan secara realtime ke penyimpanan awan Firestore.
            </div>
          </div>

        </div>
      )}

        </motion.div>
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: EDIT DATA SISWA                                                    */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <span>Edit Data Siswa</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">NISN *</label>
                <input
                  type="text"
                  value={formNisn}
                  onChange={(e) => setFormNisn(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-mono rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 font-bold text-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kelas *</label>
                  <input
                    type="text"
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Kelamin</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as 'L' | 'P')}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor HP / WhatsApp Wali</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-mono rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HAPUS SISWA                                                        */}
      {/* ========================================================================= */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Hapus Data Siswa?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Apakah Anda yakin ingin menghapus <strong>"{deletingStudent.name}"</strong> (NISN: {deletingStudent.nisn})?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteStudent(deletingStudent.id);
                  setDeletingStudent(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-400 cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QR CODE POPUP                                                      */}
      {/* ========================================================================= */}
      {qrModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xs w-full p-6 space-y-4 shadow-2xl text-center animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-emerald-400">QR Code Pelajar</span>
              <button onClick={() => setQrModalStudent(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="font-black text-sm text-white">{qrModalStudent.name}</p>
              <p className="text-xs text-slate-400 font-mono">Kelas {qrModalStudent.class} • NISN: {qrModalStudent.nisn}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl mx-auto w-48 h-48 flex items-center justify-center shadow-md">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-16 h-16 text-slate-400 animate-spin" />
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadQrImage}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PNG</span>
              </button>
              <button
                onClick={() => {
                  setQrModalStudent(null);
                  navigateToSubTab('Kartu QR', 'pratinjau-individu');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 px-3 rounded-xl cursor-pointer"
              >
                Kartu Lengkap
              </button>
            </div>
          </div>
        </div>
      )}

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
