import React from 'react';
import { AlertCircle, Check, Download, FileSpreadsheet, FileUp, RefreshCw, Upload } from 'lucide-react';
import { Student } from '../../../types';

interface SiswaImporEksporProps {
  fileName: string;
  importError: string | null;
  previewData: Omit<Student, 'id'>[];
  studentsCount: number;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplateCSV: () => void;
  onConfirmImport: () => void;
  onExportCSV: () => void;
  onResetToSampleData: () => void;
}

export const SiswaImporEkspor: React.FC<SiswaImporEksporProps> = ({
  fileName,
  importError,
  previewData,
  studentsCount,
  onFileUpload,
  onDownloadTemplateCSV,
  onConfirmImport,
  onExportCSV,
  onResetToSampleData
}) => {
  return (
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
              onClick={onDownloadTemplateCSV}
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
              onChange={onFileUpload}
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
                onClick={onConfirmImport}
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
                type="button"
                onClick={onExportCSV}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Unduh File CSV ({studentsCount} Siswa)</span>
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
                type="button"
                onClick={onResetToSampleData}
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
  );
};
