import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, X, Save } from 'lucide-react';
import { TeacherAdditionalDuty } from '../../../../types';

interface DutyModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDuty: TeacherAdditionalDuty | null;
  onSave: (duty: Omit<TeacherAdditionalDuty, 'id'>, id?: string) => void;
}

export const DutyModal: React.FC<DutyModalProps> = ({
  isOpen,
  onClose,
  editingDuty,
  onSave
}) => {
  const [name, setName] = useState('');
  const [jtmEquivalent, setJtmEquivalent] = useState<number>(2);
  const [skNumber, setSkNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (editingDuty) {
      setName(editingDuty.name);
      setJtmEquivalent(editingDuty.jtmEquivalent);
      setSkNumber(editingDuty.skNumber || '');
      setNotes(editingDuty.notes || '');
      setIsActive(editingDuty.isActive ?? true);
    } else {
      setName('');
      setJtmEquivalent(2);
      setSkNumber('');
      setNotes('');
      setIsActive(true);
    }
  }, [editingDuty, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      jtmEquivalent: Number(jtmEquivalent) || 1,
      skNumber: skNumber.trim(),
      notes: notes.trim(),
      isActive
    }, editingDuty?.id);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {editingDuty ? 'Edit Tugas Tambahan' : 'Tambah Tugas Tambahan Guru'}
                </h3>
                <p className="text-xs text-slate-400">Ekuivalensi jam tatap muka berdasarkan SK resmi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Nama Tugas Tambahan *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Wali Kelas X IPA 1 / Pembina OSIS / Ka. Lab"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Ekuivalensi JP / Minggu *</label>
                <input
                  type="number"
                  value={jtmEquivalent}
                  onChange={(e) => setJtmEquivalent(Number(e.target.value) || 1)}
                  min={1}
                  max={24}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
                <span className="text-[10px] text-slate-500">Standar: Wali (2 JP), Ka.Lab/Waka (12 JP), Piket (1 JP)</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Nomor SK Penugasan (Opsional)</label>
                <input
                  type="text"
                  value={skNumber}
                  onChange={(e) => setSkNumber(e.target.value)}
                  placeholder="Contoh: SK.421/012/SMK/2025"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Catatan / Uraian Tugas (Opsional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Rincian deskripsi tugas atau pembagian jadwal..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Tugas</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
