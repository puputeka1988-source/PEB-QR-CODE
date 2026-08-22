import React from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Save } from 'lucide-react';
import { TeachingScheduleItem } from '../../../types';

interface JadwalModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingItem: TeachingScheduleItem | null;
  formDay: string;
  setFormDay: (day: string) => void;
  formJamKe: string;
  setFormJamKe: (jam: string) => void;
  formStartTime: string;
  setFormStartTime: (time: string) => void;
  formEndTime: string;
  setFormEndTime: (time: string) => void;
  formKelas: string;
  setFormKelas: (kelas: string) => void;
  formMapel: string;
  setFormMapel: (mapel: string) => void;
  formRoom: string;
  setFormRoom: (room: string) => void;
  formNotes: string;
  setFormNotes: (notes: string) => void;
  availableClasses: string[];
  currentTimezone: string;
  daysOfWeek: { name: string; index: number }[];
}

export const JadwalModalForm: React.FC<JadwalModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingItem,
  formDay,
  setFormDay,
  formJamKe,
  setFormJamKe,
  formStartTime,
  setFormStartTime,
  formEndTime,
  setFormEndTime,
  formKelas,
  setFormKelas,
  formMapel,
  setFormMapel,
  formRoom,
  setFormRoom,
  formNotes,
  setFormNotes,
  availableClasses,
  currentTimezone,
  daysOfWeek
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {editingItem ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Mengajar'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {editingItem ? 'Perbarui rincian sesi mengajar kelas' : 'Masukkan jadwal mengajar baru'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-modal-sch"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Hari</label>
              <select
                id="modal-form-day"
                value={formDay}
                onChange={(e) => setFormDay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                {daysOfWeek.map(d => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Jam Ke-</label>
              <input
                id="modal-form-jamke"
                type="text"
                placeholder="Contoh: 1 - 2 atau 3 - 4"
                value={formJamKe}
                onChange={(e) => setFormJamKe(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Jam Mulai ({currentTimezone})</label>
              <input
                id="modal-form-starttime"
                type="time"
                value={formStartTime}
                onChange={(e) => setFormStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Jam Selesai ({currentTimezone})</label>
              <input
                id="modal-form-endtime"
                type="time"
                value={formEndTime}
                onChange={(e) => setFormEndTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Kelas yang Diajar</label>
              {availableClasses.length > 0 ? (
                <select
                  id="modal-form-kelas-select"
                  value={formKelas}
                  onChange={(e) => setFormKelas(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">-- Pilih Kelas --</option>
                  {availableClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  id="modal-form-kelas-input"
                  type="text"
                  placeholder="Contoh: X IPA 2"
                  value={formKelas}
                  onChange={(e) => setFormKelas(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Mata Pelajaran</label>
              <input
                id="modal-form-mapel"
                type="text"
                placeholder="Contoh: Matematika Wajib"
                value={formMapel}
                onChange={(e) => setFormMapel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Ruang / Laboratorium</label>
            <input
              id="modal-form-room"
              type="text"
              placeholder="Contoh: Ruang R-102 / Lab Komputer"
              value={formRoom}
              onChange={(e) => setFormRoom(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Catatan Tambahan (Opsional)</label>
            <textarea
              id="modal-form-notes"
              rows={2}
              placeholder="Contoh: Bawa alat peraga jangka & busur"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              id="btn-cancel-modal-sch"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-submit-modal-sch"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingItem ? 'Simpan Perubahan' : 'Tambahkan Jadwal'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
