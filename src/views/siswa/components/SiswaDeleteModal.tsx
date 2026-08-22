import React from 'react';
import { Trash2 } from 'lucide-react';
import { Student } from '../../../types';

interface SiswaDeleteModalProps {
  deletingStudent: Student | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const SiswaDeleteModal: React.FC<SiswaDeleteModalProps> = ({
  deletingStudent,
  onClose,
  onConfirm
}) => {
  if (!deletingStudent) return null;

  return (
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
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-400 cursor-pointer"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
};
