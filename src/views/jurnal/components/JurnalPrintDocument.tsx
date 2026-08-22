import React from 'react';
import { Printer, Download, Sparkles } from 'lucide-react';
import { AppSettings, TeachingJournal } from '../../../types';
import { OfficialKopSurat } from '../../../components/print/OfficialKopSurat';
import { OfficialSignatureBlock } from '../../../components/print/OfficialSignatureBlock';
import { formatIndonesianDayAndDate } from '../../../utils/formatters';

interface JurnalPrintDocumentProps {
  settings: AppSettings;
  printJournals: TeachingJournal[];
  filterClass: string;
  onPrint: () => void;
  onExportExcel: () => void;
}

export const JurnalPrintDocument: React.FC<JurnalPrintDocumentProps> = ({
  settings,
  printJournals,
  filterClass,
  onPrint,
  onExportExcel
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner Actions */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            Format Cetak Standar Dinas Pendidikan / Kementerian
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Menampilkan {printJournals.length} rekaman jurnal mengajar kelas <strong className="text-emerald-400">{filterClass === 'ALL' ? 'Semua Kelas' : filterClass}</strong> dalam format tabel resmi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExportExcel}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Document Preview Area */}
      <div className="bg-white text-black p-8 sm:p-12 rounded-3xl shadow-2xl border border-slate-200 overflow-x-auto font-serif leading-snug">
        <div id="printable-jurnal-area" className="min-w-[800px] w-full text-black bg-white mx-auto font-serif">
          
          {/* Kop Sekolah Resmi (Dual Logo) */}
          <OfficialKopSurat settings={settings} />

          {/* Header Information */}
          <div className="text-center mb-4">
            <h1 className="text-base font-bold uppercase tracking-wider underline">JURNAL MENGAJAR GURU</h1>
            <p className="text-[11px] font-bold text-slate-700 mt-0.5">
              REKAPAN PERTEMUAN KE-1 S.D. PERTEMUAN KE-{printJournals.length || 1}
            </p>
          </div>

          <div className="flex justify-between items-end mb-2 text-xs font-bold">
            <div>
              <span>KELAS: </span>
              <span className="font-mono">{filterClass === 'ALL' ? 'SEMUA KELAS' : filterClass}</span>
            </div>
            <div>
              <span>TAHUN AJARAN: </span>
              <span>{settings.tahunAjaran || '2024/2025'}</span>
              <span className="ml-3">SEMESTER: </span>
              <span className="uppercase">{settings.semester || 'GANJIL'}</span>
            </div>
          </div>

          {/* Tabel Jurnal Mengajar */}
          <table className="w-full text-[10.5px] border-collapse border border-black mb-4">
            <thead>
              <tr className="bg-slate-100 text-center font-bold">
                <th className="border border-black p-1.5 w-8">NO</th>
                <th className="border border-black p-1.5 w-24">HARI / TANGGAL</th>
                <th className="border border-black p-1.5 w-16">JAM KE-</th>
                <th className="border border-black p-1.5 w-16">KELAS</th>
                <th className="border border-black p-1.5 w-28">MATA PELAJARAN</th>
                <th className="border border-black p-1.5">POKOK BAHASAN / MATERI</th>
                <th className="border border-black p-1.5 w-28">KEGIATAN / METODE</th>
                <th className="border border-black p-1.5 w-24">PRESENSI SISWA</th>
                <th className="border border-black p-1.5 w-32">KETERANGAN ABSENSI</th>
              </tr>
            </thead>
            <tbody>
              {printJournals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-black p-4 text-center italic text-slate-500">
                    Tidak ada rekaman data jurnal mengajar untuk dicetak.
                  </td>
                </tr>
              ) : (
                printJournals.map((jurnal, index) => {
                  const dayDate = formatIndonesianDayAndDate(jurnal.date);
                  return (
                    <tr key={jurnal.id} className="align-top">
                      <td className="border border-black p-1 text-center font-mono">{index + 1}</td>
                      <td className="border border-black p-1 text-center">
                        <div className="font-bold">{dayDate.day}</div>
                        <div className="text-[9.5px]">{dayDate.formattedDate}</div>
                      </td>
                      <td className="border border-black p-1 text-center font-mono font-bold">{jurnal.jamKe}</td>
                      <td className="border border-black p-1 text-center font-bold">{jurnal.kelas}</td>
                      <td className="border border-black p-1">{jurnal.mapel}</td>
                      <td className="border border-black p-1 leading-tight">{jurnal.materi}</td>
                      <td className="border border-black p-1 text-center leading-tight">{jurnal.metode || '-'}</td>
                      <td className="border border-black p-1 text-center font-mono">
                        <div className="font-bold text-[10px] text-emerald-800">
                          H:{jurnal.hadir} | S:{jurnal.sakit}
                        </div>
                        <div className="text-[9.5px] text-slate-700">
                          I:{jurnal.izin} | A:{jurnal.alpa}
                        </div>
                      </td>
                      <td className="border border-black p-1 text-[9.5px] leading-tight">
                        {jurnal.keterangan || (jurnal.sakit === 0 && jurnal.izin === 0 && jurnal.alpa === 0 ? 'Nihil' : '-')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Lembar Pengesahan */}
          <OfficialSignatureBlock settings={settings} />

        </div>
      </div>
    </div>
  );
};
