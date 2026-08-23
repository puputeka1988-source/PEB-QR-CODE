import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Save, Layers, BookOpen, Check } from 'lucide-react';
import { ClassKokurikulerP5 } from '../../../../types';

interface P5KokurikulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ClassKokurikulerP5 | null;
  targetKelas: string;
  allClassNames: string[];
  onSave: (data: ClassKokurikulerP5, applyToAll?: boolean) => void;
}

export const P5_THEMES = [
  'Gaya Hidup Berkelanjutan',
  'Kearifan Lokal',
  'Bhinneka Tunggal Ika',
  'Bangunlah Jiwa dan Raganya',
  'Suara Demokrasi',
  'Rekayasa dan Teknologi',
  'Kewirausahaan',
  'Kebekerjaan (SMK)',
  'P5RA: Berkeadaban (Ta’addub) & Keteladanan',
  'P5RA: Kewarganegaraan & Kebangsaan (Muwatanah)',
  'P5RA: Mengambil Jalan Tengah (Tawassut)',
  'P5RA: Musyawarah (Syura) & Toleransi (Tasamuh)',
  'P5RA: Dinamis dan Inovatif (Tatawwur wa Ibtikar)'
];

export const P5KokurikulerModal: React.FC<P5KokurikulerModalProps> = ({
  isOpen,
  onClose,
  initialData,
  targetKelas,
  allClassNames,
  onSave
}) => {
  const [kelas, setKelas] = useState(targetKelas);
  const [jp, setJp] = useState<number>(initialData?.jp ?? 1);
  const [category, setCategory] = useState<'P5' | 'P5P2RA' | 'Kokurikuler'>(initialData?.category ?? 'P5');
  const [theme, setTheme] = useState<string>(initialData?.theme ?? 'Gaya Hidup Berkelanjutan');
  const [projectName, setProjectName] = useState<string>(initialData?.projectName ?? '');
  const [role, setRole] = useState<string>(initialData?.role ?? 'Fasilitator Utama');
  const [notes, setNotes] = useState<string>(initialData?.notes ?? '');
  const [applyToAll, setApplyToAll] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setKelas(initialData.kelas || targetKelas);
      setJp(initialData.jp ?? 1);
      setCategory(initialData.category ?? 'P5');
      setTheme(initialData.theme ?? 'Gaya Hidup Berkelanjutan');
      setProjectName(initialData.projectName ?? '');
      setRole(initialData.role ?? 'Fasilitator Utama');
      setNotes(initialData.notes ?? '');
    } else {
      setKelas(targetKelas);
      setJp(1);
      setCategory('P5');
      setTheme('Gaya Hidup Berkelanjutan');
      setProjectName('');
      setRole('Fasilitator Utama');
      setNotes('');
    }
    setApplyToAll(false);
  }, [initialData, targetKelas, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: ClassKokurikulerP5 = {
      kelas: kelas || targetKelas,
      jp: Number(jp) || 0,
      category,
      theme,
      projectName: projectName.trim() || `Projek ${category} - Tema ${theme}`,
      role,
      notes: notes.trim(),
      isEnabled: (Number(jp) || 0) > 0
    };
    onSave(data, applyToAll);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Pengaturan Kokurikuler / P5 / P5P2RA
                </h3>
                <p className="text-xs text-slate-400">
                  Ekuivalensi beban mengajar projek per kelas (diisi manual sesuai pembagian tugas)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Target Kelas & Kategori Projek */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Kelas / Rombel *</label>
                <select
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {allClassNames.map(c => (
                    <option key={c} value={c}>Kelas {c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Kategori Kurikulum</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="P5">P5 (Kurikulum Merdeka - Kemdikbud)</option>
                  <option value="P5P2RA">P5-PPRA / P5P2RA (Kemenag)</option>
                  <option value="Kokurikuler">Kokurikuler Tematik Mandiri</option>
                </select>
              </div>
            </div>

            {/* Alokasi JP & Peran Guru */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Alokasi Beban JP *</span>
                  <span className="text-[10px] text-teal-400 font-mono">Beban Mengajar</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={jp}
                    onChange={(e) => setJp(Math.max(0, Number(e.target.value) || 0))}
                    min={0}
                    max={10}
                    step={1}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-teal-500"
                    required
                  />
                  <span className="text-xs font-bold text-slate-400 shrink-0">JP / Pekan</span>
                </div>
                <span className="text-[10px] text-slate-500">Umumnya 1 s.d. 2 JP per rombel</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Peran / Tugas Guru</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="Fasilitator Utama">Fasilitator Utama</option>
                  <option value="Koordinator Projek">Koordinator Projek (P5)</option>
                  <option value="Anggota Tim Fasilitator">Anggota Tim Fasilitator</option>
                  <option value="Guru Pembimbing Projek">Guru Pembimbing Projek</option>
                </select>
              </div>
            </div>

            {/* Tema Projek */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Tema Projek {category}</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                {P5_THEMES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Judul / Topik Projek */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Judul / Topik Projek (Opsional)</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Contoh: Pengelolaan Sampah Organik Madrasah / Budaya Lokal"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Catatan / Jadwal Pelaksanaan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Catatan / Model Pelaksanaan (Opsional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Sistem Blok pada akhir semester / 1 JP setiap hari Jumat..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>

            {/* Bulk Apply Option */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyToAll}
                  onChange={(e) => setApplyToAll(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-900 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-teal-300">Terapkan alokasi ({jp} JP) ke semua rombel</span>
                  <p className="text-[11px] text-slate-400">Salin pengaturan JP dan tema ini ke seluruh kelas yang diampu.</p>
                </div>
              </label>
            </div>

            {/* Modal Actions */}
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
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Alokasi</span>
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
