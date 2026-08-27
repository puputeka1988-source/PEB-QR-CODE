import React from 'react';
import { Trash2, AlertTriangle, Users } from 'lucide-react';
import { Student } from '../../../types';

interface SiswaDeleteModalProps {
  deletingStudent?: Student | null;
  bulkStudents?: Student[];
  onClose: () => void;
  onConfirm: () => void;
}

export const SiswaDeleteModal: React.FC<SiswaDeleteModalProps> = ({
  deletingStudent,
  bulkStudents,
  onClose,
  onConfirm
}) => {
  const isBulk = Boolean(bulkStudents && bulkStudents.length > 0);
  if (!deletingStudent && !isBulk) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          {isBulk ? <Users className="w-7 h-7" /> : <Trash2 className="w-7 h-7" />}
        </div>
        
        <div>
          <h3 className="text-base font-bold text-white">
            {isBulk ? `Hapus Masal ${bulkStudents?.length} Data Siswa?` : 'Hapus Data Siswa?'}
          </h3>
          
          {isBulk ? (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-slate-300">
                Apakah Anda yakin ingin menghapus <strong>{bulkStudents?.length} siswa terpilih</strong> secara permanen?
              </p>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-left max-h-36 overflow-y-auto space-y-1">
                {bulkStudents?.slice(0, 6).map(s => (
                  <div key={s.id} className="text-[11px] text-slate-300 flex items-center justify-between">
                    <span className="font-semibold text-white truncate max-w-[200px]">{s.name}</span>
                    <span className="font-mono text-emerald-400 text-[10px]">{s.nisn} ({s.class})</span>
                  </div>
                ))}
                {(bulkStudents?.length || 0) > 6 && (
                  <div className="text-[10px] text-slate-500 italic pt-1 text-center">
                    ... dan {(bulkStudents?.length || 0) - 6} siswa lainnya
                  </div>
                )}
              </div>
              <p className="text-[11px] text-rose-400/90 flex items-center justify-center gap-1.5 pt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Seluruh riwayat presensi siswa terpilih juga akan ikut terhapus.</span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-1">
              Apakah Anda yakin ingin menghapus <strong>"{deletingStudent?.name}"</strong> (NISN: {deletingStudent?.nisn})? Riwayat presensi siswa ini juga akan dihapus.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-400 cursor-pointer transition-all shadow-md shadow-rose-500/20"
          >
            {isBulk ? `Ya, Hapus ${bulkStudents?.length} Siswa` : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
};
