import React from 'react';
import { Edit3, X } from 'lucide-react';
import { Student } from '../../../types';

interface SiswaModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formName: string;
  setFormName: (val: string) => void;
  formNisn: string;
  setFormNisn: (val: string) => void;
  formClass: string;
  setFormClass: (val: string) => void;
  formGender: 'L' | 'P';
  setFormGender: (val: 'L' | 'P') => void;
  formPhone: string;
  setFormPhone: (val: string) => void;
}

export const SiswaModalForm: React.FC<SiswaModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formName,
  setFormName,
  formNisn,
  setFormNisn,
  formClass,
  setFormClass,
  formGender,
  setFormGender,
  formPhone,
  setFormPhone
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-emerald-400" />
            <span>Edit Data Siswa</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
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
              onClick={onClose}
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
  );
};
