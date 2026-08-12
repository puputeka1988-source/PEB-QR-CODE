import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import { sortStudents } from '../utils/formatters';
import { Users, UserPlus, Search, Filter, Edit3, Trash2, QrCode, FileSpreadsheet, RefreshCw, Upload, Download, FileUp, X, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

export const SiswaView: React.FC = () => {
  const { students, addStudent, addStudentsBulk, updateStudent, deleteStudent, resetToSampleData, setActiveTab, setSelectedStudentForCard } = useApp();

  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('SEMUA');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [formName, setFormName] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formClass, setFormClass] = useState('');
  const [formGender, setFormGender] = useState<'L' | 'P'>('L');
  const [formPhone, setFormPhone] = useState('');

  // Import CSV Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<Omit<Student, 'id'>[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  // Delete Confirmation Modal State
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  const classes = ['SEMUA', ...Array.from(new Set(students.map(s => s.class))).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }))];

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
    setFormClass('X IPA 1');
    setFormGender('L');
    setFormPhone('');
    setModalOpen(true);
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formNisn.trim() || !formClass.trim()) return;

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        name: formName.trim(),
        nisn: formNisn.trim(),
        class: formClass.trim(),
        gender: formGender,
        phone: formPhone.trim()
      });
    } else {
      addStudent({
        name: formName.trim(),
        nisn: formNisn.trim(),
        class: formClass.trim(),
        gender: formGender,
        phone: formPhone.trim()
      });
    }

    setModalOpen(false);
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

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());

    let nisnIdx = headers.findIndex(h => h.includes('nisn') || h.includes('induk') || h.includes('id'));
    let nameIdx = headers.findIndex(h => h.includes('nama') || h.includes('name') || h.includes('siswa'));
    let classIdx = headers.findIndex(h => h.includes('kelas') || h.includes('class') || h.includes('rombel'));
    let genderIdx = headers.findIndex(h => h.includes('kelamin') || h.includes('gender') || h === 'jk' || h === 'l/p');
    let phoneIdx = headers.findIndex(h => h.includes('telepon') || h.includes('phone') || h.includes('hp') || h.includes('wa'));

    // Fallbacks if headers not detected
    if (nisnIdx === -1) nisnIdx = 0;
    if (nameIdx === -1) nameIdx = 1;
    if (classIdx === -1) classIdx = 2;

    const results: Omit<Student, 'id'>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length < 2) continue;

      const nisn = (cols[nisnIdx] || '').trim();
      const name = (cols[nameIdx] || '').trim();
      const cls = (cols[classIdx] || 'X IPA 1').trim();
      const rawGender = genderIdx !== -1 ? (cols[genderIdx] || '').trim().toUpperCase() : 'L';
      const phone = phoneIdx !== -1 ? (cols[phoneIdx] || '').trim() : '';

      let gender: 'L' | 'P' = 'L';
      if (rawGender.startsWith('P') || rawGender.includes('PEREMPUAN') || rawGender.includes('FEMALE')) {
        gender = 'P';
      }

      if (name && nisn) {
        results.push({
          name,
          nisn,
          class: cls,
          gender,
          phone
        });
      }
    }

    return sortStudents(results);
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
        const parsed = parseStudentCSV(text);
        if (parsed.length === 0) {
          setImportError('File CSV tidak berisi data siswa valid. Pastikan header CSV memuat NISN, Nama, dan Kelas.');
          setPreviewData([]);
        } else {
          setPreviewData(parsed);
        }
      } catch (err) {
        setImportError('Gagal membaca file CSV. Pastikan file berformat .csv yang valid.');
        setPreviewData([]);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (previewData.length === 0) return;
    addStudentsBulk(previewData);
    setImportModalOpen(false);
    setPreviewData([]);
    setFileName('');
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Manajemen Data Siswa ({students.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola data siswa, nomor NISN, dan generate kartu ID QR Code secara otomatis
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Tambah Siswa Single */}
          <button
            onClick={openAddModal}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>

          {/* Import CSV Button */}
          <button
            onClick={() => {
              setImportModalOpen(true);
              setPreviewData([]);
              setImportError(null);
              setFileName('');
            }}
            className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-colors cursor-pointer"
            title="Import banyak data siswa sekaligus dari file CSV / Excel"
          >
            <Upload className="w-4 h-4 text-teal-200" />
            <span>Import CSV</span>
          </button>

          {/* Ekspor CSV Button */}
          <button
            onClick={exportStudentsCSV}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2.5 rounded-2xl text-xs border border-slate-700 transition-colors cursor-pointer flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={resetToSampleData}
            title="Reset ke data contoh"
            className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2.5 rounded-2xl border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama siswa atau NISN..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
          >
            {classes.map(c => (
              <option key={c} value={c}>Kelas: {c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="p-4">Siswa</th>
                <th className="p-4">NISN</th>
                <th className="p-4">Kelas</th>
                <th className="p-4">Gender</th>
                <th className="p-4">Telepon</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 text-xs italic">
                    Tidak ada siswa yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-slate-700">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{student.name}</p>
                          <p className="text-[11px] text-slate-500">ID: {student.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      {student.nisn}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                        {student.class}
                      </span>
                    </td>
                    <td className="p-4">
                      {student.gender === 'P' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 shadow-sm" title="Perempuan">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                          P
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm" title="Laki-Laki">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                          L
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {student.phone || '-'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedStudentForCard(student);
                            setActiveTab('Kartu QR');
                          }}
                          title="Cetak Kartu QR"
                          className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openEditModal(student)}
                          title="Edit Data"
                          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingStudent(student)}
                          title="Hapus Data Siswa"
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
      </div>

      {/* Add / Edit Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap Siswa:</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Ahmad Rizky"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Induk Siswa Nasional (NISN):</label>
                <input
                  type="text"
                  required
                  value={formNisn}
                  onChange={(e) => setFormNisn(e.target.value)}
                  placeholder="Contoh: 0051234001"
                  className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kelas:</label>
                  <input
                    type="text"
                    required
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    placeholder="Contoh: X IPA 1"
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Kelamin:</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as 'L' | 'P')}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="L">L (Laki-Laki)</option>
                    <option value="P">P (Perempuan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">No. WhatsApp / HP Orang Tua:</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Import Data Siswa dari CSV</h3>
                  <p className="text-xs text-slate-400">Upload file CSV untuk mengunggah banyak siswa & kelas sekaligus</p>
                </div>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Download Template */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-400" />
                  Format File CSV
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pastikan susunan kolom memuat: <span className="font-mono text-teal-300">NISN, Nama Siswa, Kelas, Jenis Kelamin, Telepon</span>
                </p>
              </div>
              <button
                type="button"
                onClick={downloadTemplateCSV}
                className="bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template Contoh</span>
              </button>
            </div>

            {/* Step 2: Select File */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Pilih File CSV (.csv):</label>
              <div className="relative border-2 border-dashed border-slate-700 hover:border-teal-500/50 rounded-2xl p-6 text-center bg-slate-950/40 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileUp className="w-8 h-8 text-teal-400 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-200">
                  {fileName ? `File Terpilih: ${fileName}` : 'Klik atau geser file CSV Anda ke sini'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">File diproses secara lokal di browser Anda</p>
              </div>
            </div>

            {/* Error Message */}
            {importError && (
              <div className="bg-rose-950/50 border border-rose-800/80 p-3 rounded-2xl flex items-center gap-2.5 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Preview Parsed Data */}
            {previewData.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Berhasil Membaca {previewData.length} Data Siswa
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono">Pratinjau Data</span>
                </div>

                <div className="bg-slate-950 rounded-2xl border border-slate-800 max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 sticky top-0 font-mono text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">No</th>
                        <th className="p-2.5">NISN</th>
                        <th className="p-2.5">Nama Siswa</th>
                        <th className="p-2.5">Kelas</th>
                        <th className="p-2.5">JK</th>
                        <th className="p-2.5">Telepon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {previewData.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="p-2.5 text-slate-500">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-white">{s.nisn}</td>
                          <td className="p-2.5 text-slate-200">{s.name}</td>
                          <td className="p-2.5 text-teal-400">{s.class}</td>
                          <td className="p-2.5 text-slate-300">{s.gender}</td>
                          <td className="p-2.5 text-slate-400">{s.phone || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={previewData.length === 0}
                onClick={handleConfirmImport}
                className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Konfirmasi Import ({previewData.length} Siswa)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Konfirmasi Hapus Siswa</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus data siswa <strong className="text-white">{deletingStudent.name}</strong> (NISN: <span className="font-mono text-emerald-400">{deletingStudent.nisn}</span>, Kelas: {deletingStudent.class})?
            </p>
            <p className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
              <strong>Pemberitahuan Sinkronisasi:</strong> Menghapus data siswa ini juga akan menghapus seluruh catatan riwayat presensi siswa tersebut secara lokal dan di Google Sheets Anda.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteStudent(deletingStudent.id);
                  setDeletingStudent(null);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Ya, Hapus Siswa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
