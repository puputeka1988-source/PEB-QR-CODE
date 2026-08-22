import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { TeachingScheduleItem } from '../../../types';

interface JadwalDeleteModalProps {
  deleteTarget: TeachingScheduleItem | null;
  onClose: () => void;
  onConfirm: () => void;
  currentTimezone: string;
}

export const JadwalDeleteModal: React.FC<JadwalDeleteModalProps> = ({
  deleteTarget,
  onClose,
  onConfirm,
  currentTimezone
}) => {
  return (
    <AnimatePresence>
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Hapus Jadwal Mengajar?</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Hari & Sesi:</span>
                <span className="font-bold text-white">{deleteTarget.day}, Jam Ke-{deleteTarget.jamKe}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Waktu:</span>
                <span className="font-mono text-emerald-400 font-bold">{deleteTarget.startTime} - {deleteTarget.endTime} {currentTimezone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Kelas:</span>
                <span className="font-black text-white">{deleteTarget.kelas}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Mata Pelajaran:</span>
                <span className="font-medium text-slate-300">{deleteTarget.mapel}</span>
              </div>
              {deleteTarget.room && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Ruang:</span>
                  <span className="text-slate-400">{deleteTarget.room}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                id="btn-cancel-delete-sch"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-delete-sch"
                onClick={onConfirm}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Sekarang</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
