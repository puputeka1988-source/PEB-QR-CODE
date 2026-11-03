import React, { useState, useEffect } from 'react';
import { X, UserCheck, UserMinus, UserX, Calendar, FileText, CheckCircle2, AlertTriangle, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { Student, StudentStatus } from '../../../types';

interface SiswaStatusModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveStatus: (studentId: string, status: StudentStatus, statusReason?: string, statusDate?: string) => void;
}

export const SiswaStatusModal: React.FC<SiswaStatusModalProps> = ({
  student,
  isOpen,
  onClose,
  onSaveStatus
}) => {
  const [selectedStatus, setSelectedStatus] = useState<StudentStatus>('Aktif');
  const [statusDate, setStatusDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [statusReason, setStatusReason] = useState<string>('');

  useEffect(() => {
    if (student) {
      setSelectedStatus(student.status || 'Aktif');
      setStatusDate(student.statusDate || new Date().toISOString().split('T')[0]);
      setStatusReason(student.statusReason || '');
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const currentStatus = student.status || 'Aktif';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveStatus(
      student.id,
      selectedStatus,
      selectedStatus === 'Aktif' ? undefined : statusReason.trim(),
      selectedStatus === 'Aktif' ? undefined : statusDate
    );
    onClose();
  };

  const handleQuickRestoreActive = () => {
    onSaveStatus(student.id, 'Aktif');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Kelola Status Siswa</h3>
              <p className="text-xs text-slate-400">Mutasi, pengunduran diri, atau aktivasi siswa</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student Info Card */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-white truncate">{student.name}</h4>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
              <span>NISN: <strong className="text-emerald-400">{student.nisn}</strong></span>
              <span>•</span>
              <span className="text-slate-300 font-semibold">{student.class}</span>
            </div>
          </div>
          
          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Status Saat Ini:</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold mt-0.5 border ${
              currentStatus === 'Aktif'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : currentStatus === 'Mutasi'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              {currentStatus === 'Aktif' ? 'Aktif' : currentStatus === 'Mutasi' ? 'Mutasi / Pindah' : 'Keluar / DO'}
            </span>
          </div>
        </div>

        {/* Quick Restore Button if currently non-active */}
        {currentStatus !== 'Aktif' && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3">
            <div className="text-xs text-emerald-200">
              <span className="font-bold block">Siswa ini saat ini non-aktif.</span>
              <span className="text-[11px] text-emerald-400/90">Batal mutasi atau ingin aktifkan kembali?</span>
            </div>
            <button
              type="button"
              onClick={handleQuickRestoreActive}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Aktifkan Kembali</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Status Options Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Pilih Status Baru Siswa *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Option 1: Aktif */}
              <button
                type="button"
                onClick={() => setSelectedStatus('Aktif')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedStatus === 'Aktif'
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <UserCheck className="w-4 h-4" />
                  {selectedStatus === 'Aktif' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Aktif</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">Belajar aktif & presensi normal</div>
                </div>
              </button>

              {/* Option 2: Mutasi */}
              <button
                type="button"
                onClick={() => setSelectedStatus('Mutasi')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedStatus === 'Mutasi'
                    ? 'bg-amber-950/40 border-amber-500 text-amber-400 shadow-md shadow-amber-950/30 ring-1 ring-amber-500/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <UserMinus className="w-4 h-4" />
                  {selectedStatus === 'Mutasi' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Mutasi / Pindah</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">Pindah ke sekolah lain</div>
                </div>
              </button>

              {/* Option 3: Keluar */}
              <button
                type="button"
                onClick={() => setSelectedStatus('Keluar')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedStatus === 'Keluar'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-400 shadow-md shadow-rose-950/30 ring-1 ring-rose-500/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <UserX className="w-4 h-4" />
                  {selectedStatus === 'Keluar' && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Keluar / DO</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">Berhenti / mengundurkan diri</div>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Fields for Mutasi or Keluar */}
          {selectedStatus !== 'Aktif' && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tanggal Efektif {selectedStatus === 'Mutasi' ? 'Mutasi / Pindah' : 'Keluar'} *</span>
                </label>
                <input
                  type="date"
                  value={statusDate}
                  onChange={(e) => setStatusDate(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>{selectedStatus === 'Mutasi' ? 'Sekolah Tujuan / Alasan Pindah' : 'Alasan Pengunduran Diri'}</span>
                </label>
                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder={selectedStatus === 'Mutasi' ? 'Contoh: Pindah ke SMA Negeri 1 Malang (Ikut Orang Tua)' : 'Contoh: Mengundurkan diri karena bekerja'}
                  className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-[11px] text-amber-300/90 leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Siswa yang berstatus <strong>{selectedStatus}</strong> otomatis disembunyikan dari daftar presensi harian agar data tetap rapi, tetapi <strong>seluruh arsip presensi dan nilai masa lalunya tetap utuh 100%</strong>.
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Status</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
