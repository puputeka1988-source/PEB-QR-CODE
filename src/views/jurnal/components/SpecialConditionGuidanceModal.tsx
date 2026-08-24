import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, BookOpen, Calendar, HelpCircle, Check, Sparkles, 
  AlertCircle, FileText, CheckCircle2, UserCheck, ShieldAlert, Award
} from 'lucide-react';

export interface SpecialPreset {
  id: string;
  scenarioNumber: 1 | 2 | 3 | 4;
  title: string;
  shortTitle: string;
  badge: string;
  badgeColor: string;
  icon: string;
  materiTemplate: string;
  metodeTemplate: string;
  catatanTemplate: string;
  presensiStatus: 'empty' | 'normal' | 'optional';
  presensiExplanation: string;
  jurnalExplanation: string;
  contohContoh: string[];
}

export const SPECIAL_PRESETS: SpecialPreset[] = [
  {
    id: 'kondisi-1-libur',
    scenarioNumber: 1,
    title: 'Kondisi 1: Hari Libur Nasional / Cuti Bersama / Libur Semester',
    shortTitle: 'Hari Libur Resmi',
    badge: 'Libur Nasional / Semester',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: '🏖️',
    materiTemplate: 'Hari Libur Nasional: [Nama Hari Libur / Cuti Bersama]',
    metodeTemplate: 'Tidak ada kegiatan KBM (Libur Resmi Sesuai Kalender Pendidikan)',
    catatanTemplate: 'Sesuai SKB 3 Menteri / Kalender Pendidikan Resmi.',
    presensiStatus: 'empty',
    presensiExplanation: 'Presensi siswa DIKOSONGKAN (tidak diinput) agar persentase kehadiran siswa tidak bias/terganggu.',
    jurnalExplanation: 'Catat nama hari libur resmi pada materi dan keterangan tidak ada KBM pada metode/catatan.',
    contohContoh: ['Libur Hari Raya Idul Fitri', 'Libur Tahun Baru Masehi / Imlek / Nyepi', 'Cuti Bersama Hari Raya', 'Libur Akhir Semester Gasal/Genap']
  },
  {
    id: 'kondisi-2-kegiatan',
    scenarioNumber: 2,
    title: 'Kondisi 2: Kegiatan Sekolah Non-KBM (Upacara/Classmeeting/Lomba/Peringatan)',
    shortTitle: 'Kegiatan Sekolah (Non-KBM)',
    badge: 'Agenda Sekolah Non-KBM',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: '🎪',
    materiTemplate: 'Kegiatan Sekolah: [Nama Agenda, misal: Peringatan Hari Besar / Classmeeting / Lomba]',
    metodeTemplate: 'Pendampingan siswa dalam agenda kegiatan bersama sekolah di aula/lapangan',
    catatanTemplate: 'KBM reguler di kelas ditiadakan dan dialihkan ke agenda kegiatan sekolah.',
    presensiStatus: 'empty',
    presensiExplanation: 'Presensi KBM di kelas DIKOSONGKAN karena pembelajaran reguler ditiadakan.',
    jurnalExplanation: 'Isi Jurnal Mengajar dengan judul dan deskripsi agenda kegiatan yang diikuti siswa dan guru.',
    contohContoh: ['Peringatan Hari Pahlawan / Hari Guru', 'Classmeeting Semester Gasal', 'Peringatan Maulid Nabi / Isra Miraj', 'Porseni / Lomba Antar Kelas / Gladi ANBK']
  },
  {
    id: 'kondisi-3-asinkron',
    scenarioNumber: 3,
    title: 'Kondisi 3: Pembelajaran Mandiri / Daring Terencana (Asynchronous / Penugasan)',
    shortTitle: 'Belajar Mandiri / Daring',
    badge: 'Asynchronous / Tugas Mandiri',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    icon: '💻',
    materiTemplate: '[Nama Materi Pokok] (Penugasan Mandiri Terstruktur / Asynchronous)',
    metodeTemplate: 'Pemberian modul materi & penugasan terstruktur via LMS / Google Classroom / LKS',
    catatanTemplate: 'Guru melaksanakan tugas dinas luar/rapat. Pemantauan dan presensi tugas siswa dilakukan secara daring.',
    presensiStatus: 'normal',
    presensiExplanation: 'Presensi diisi sesuai pengumpulan tugas / konfirmasi kehadiran daring siswa.',
    jurnalExplanation: 'Catat pokok materi yang ditugaskan serta metode distribusi modul/tugas mandiri.',
    contohContoh: ['Guru dinas luar / pelatihan / rapat dinas', 'Penugasan lembar kerja mandiri terstruktur', 'Pembelajaran daring karena cuaca ekstrem / renovasi']
  },
  {
    id: 'kondisi-4-ujian',
    scenarioNumber: 4,
    title: 'Kondisi 4: Pekan Ujian / Asesmen Sumatif (STS / SAS / PAS / PAT)',
    shortTitle: 'Pekan Ujian / Asesmen',
    badge: 'Ujian / Asesmen Sumatif',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: '📝',
    materiTemplate: 'Pelaksanaan Asesmen Sumatif / Ujian: [Nama Mapel]',
    metodeTemplate: 'Pengawasan pelaksanaan ujian tulis / Asesmen Berbasis Komputer (CBT)',
    catatanTemplate: 'Ujian berlangsung dengan tertib dan kondusif, seluruh peserta ujian terdata.',
    presensiStatus: 'normal',
    presensiExplanation: 'Presensi diisi sesuai kehadiran fisik siswa saat mengikuti ujian/asesmen di ruang kelas.',
    jurnalExplanation: 'Catat judul asesmen/ujian, mata pelajaran yang diujikan, serta jalannya pengawasan.',
    contohContoh: ['Sumatif Tengah Semester (STS)', 'Sumatif Akhir Semester (SAS / PAS)', 'Asesmen Akhir Tahun (PAT)', 'Try Out / Ujian Sekolah']
  }
];

interface SpecialConditionGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset?: (preset: SpecialPreset) => void;
}

export const SpecialConditionGuidanceModal: React.FC<SpecialConditionGuidanceModalProps> = ({
  isOpen,
  onClose,
  onApplyPreset
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-8 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                    Panduan & Rekomendasi Resmi
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                    4 Kondisi Khusus
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Panduan Pengisian Kehadiran & Jurnal Mengajar
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pedoman praktis saat pembelajaran tidak efektif, hari libur, kegiatan sekolah non-KBM, atau penugasan mandiri.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Tutup Panduan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-300 text-xs">
            
            {/* Quick Summary Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Matriks Rekomendasi Pengisian Presensi & Jurnal</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2 px-2.5">Kondisi / Skenario</th>
                      <th className="py-2 px-2.5">Status Presensi Siswa</th>
                      <th className="py-2 px-2.5">Isi Jurnal Mengajar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    <tr className="hover:bg-slate-900/50">
                      <td className="py-2.5 px-2.5 font-bold text-rose-300 flex items-center gap-1.5">
                        <span>🏖️</span>
                        <span>1. Libur Nasional / Semester</span>
                      </td>
                      <td className="py-2.5 px-2.5 font-semibold text-slate-300">
                        <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                          Dikosongkan (Tidak Diisi)
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-300">
                        Tidak perlu diisi (atau catat keterangan Libur Resmi SKB)
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-900/50">
                      <td className="py-2.5 px-2.5 font-bold text-amber-300 flex items-center gap-1.5">
                        <span>🎪</span>
                        <span>2. Kegiatan Sekolah Non-KBM</span>
                      </td>
                      <td className="py-2.5 px-2.5 font-semibold text-slate-300">
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                          Dikosongkan (Presensi Kosong)
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-300">
                        Isi Jurnal sesuai deskripsi agenda kegiatan sekolah yang berlangsung
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-900/50">
                      <td className="py-2.5 px-2.5 font-bold text-sky-300 flex items-center gap-1.5">
                        <span>💻</span>
                        <span>3. Tugas Mandiri / Daring (Asinkron)</span>
                      </td>
                      <td className="py-2.5 px-2.5 font-semibold text-slate-300">
                        <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                          Diisi Berdasarkan Tugas / Respon
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-300">
                        Isi topik materi pokok + metode penugasan mandiri terstruktur via LMS
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-900/50">
                      <td className="py-2.5 px-2.5 font-bold text-emerald-300 flex items-center gap-1.5">
                        <span>📝</span>
                        <span>4. Pekan Ujian / Asesmen Sumatif</span>
                      </td>
                      <td className="py-2.5 px-2.5 font-semibold text-slate-300">
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                          Diisi Sesuai Kehadiran Ujian
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-300">
                        Isi judul asesmen/ujian + keterangan pelaksanaan pengawasan ujian
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Cards for 4 Conditions */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                Rincian Panduan & Template Langsung
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SPECIAL_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{preset.icon}</span>
                          <div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${preset.badgeColor}`}>
                              {preset.badge}
                            </span>
                            <h5 className="text-sm font-black text-white mt-1">
                              {preset.title}
                            </h5>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-[11px] bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <div>
                          <span className="font-bold text-slate-400 block text-[10px] uppercase">Presensi Siswa:</span>
                          <p className="text-slate-200 mt-0.5">{preset.presensiExplanation}</p>
                        </div>
                        <div className="pt-1 border-t border-slate-800">
                          <span className="font-bold text-slate-400 block text-[10px] uppercase">Jurnal Mengajar:</span>
                          <p className="text-slate-200 mt-0.5">{preset.jurnalExplanation}</p>
                        </div>
                      </div>

                      <div className="text-[11px] space-y-1">
                        <span className="font-bold text-slate-400 block text-[10px] uppercase">Template Isi Jurnal:</span>
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[10.5px] space-y-1">
                          <div><strong className="text-emerald-400">Materi:</strong> <span className="text-slate-300">"{preset.materiTemplate}"</span></div>
                          <div><strong className="text-sky-400">Metode:</strong> <span className="text-slate-300">"{preset.metodeTemplate}"</span></div>
                          <div><strong className="text-amber-400">Catatan:</strong> <span className="text-slate-300">"{preset.catatanTemplate}"</span></div>
                        </div>
                      </div>
                    </div>

                    {onApplyPreset && (
                      <button
                        type="button"
                        onClick={() => {
                          onApplyPreset(preset);
                          onClose();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Terapkan Template {preset.shortTitle}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950">
            <span className="text-[11px] text-slate-400">
              💡 Rekomendasi di atas memastikan laporan bulanan dan rekap dinas tetap rapi dan akurat.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
            >
              Tutup Panduan
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
