import React from 'react';
import { Printer, Download, RefreshCw } from 'lucide-react';
import { AppSettings, TeachingScheduleItem } from '../../../types';
import { OfficialKopSurat } from '../../../components/print/OfficialKopSurat';
import { OfficialSignatureBlock } from '../../../components/print/OfficialSignatureBlock';

interface JadwalPrintDocumentProps {
  settings: AppSettings;
  teachingSchedules: TeachingScheduleItem[];
  allSchedulesSorted: TeachingScheduleItem[];
  currentTimezone: string;
  totalWeeklyHours: number;
  uniqueClassesCount: number;
  today: string;
  onPrint: () => void;
  onExportExcel: () => void;
}

export const JadwalPrintDocument: React.FC<JadwalPrintDocumentProps> = ({
  settings,
  teachingSchedules,
  allSchedulesSorted,
  currentTimezone,
  totalWeeklyHours,
  uniqueClassesCount,
  onPrint,
  onExportExcel
}) => {
  return (
    <div className="space-y-6">
      {/* Action Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl shadow-xl">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            Format Cetak Jadwal Mengajar Resmi (DINAS / KEMDIKBUD)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Dokumen resmi siap cetak dan tanda tangan dengan KOP Surat, rincian beban JP, dan lembar pengesahan.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="btn-export-excel-jadwal"
            onClick={onExportExcel}
            className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            id="btn-print-jadwal-doc"
            onClick={onPrint}
            className="px-5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Printable White Paper Simulation */}
      <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-3xl shadow-2xl max-w-4xl mx-auto border border-slate-300 font-serif printable-document">
        
        {/* KOP Surat Instansi Resmi (Dual Logo) */}
        <OfficialKopSurat settings={settings} />

        {/* Document Title */}
        <div className="text-center mb-5">
          <h3 className="text-base font-black uppercase tracking-wide underline decoration-2">
            JADWAL MENGAJAR GURU TAHUN AJARAN {settings.tahunAjaran || '2024/2025'}
          </h3>
          <p className="text-xs text-slate-700 font-sans mt-0.5">
            SEMESTER: <strong className="text-slate-900 uppercase font-bold">{settings.semester || 'GANJIL'}</strong> • ZONA WAKTU: <strong className="text-slate-900 font-mono font-bold">{currentTimezone}</strong>
          </p>
        </div>

        {/* Teacher & Subject Metadata */}
        <div className="grid grid-cols-2 gap-4 text-xs font-sans mb-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="space-y-1">
            <p><span className="text-slate-500 w-28 inline-block">Nama Guru</span>: <strong className="text-slate-900">{settings.namaGuru || settings.guru || 'Guru Pengampu'}</strong></p>
            <p><span className="text-slate-500 w-28 inline-block">NIP / NUPTK</span>: <span className="font-mono">{settings.nip || '-'}</span></p>
            <p><span className="text-slate-500 w-28 inline-block">Mata Pelajaran</span>: <strong className="text-slate-900">{settings.mataPelajaran || 'Matematika'}</strong></p>
          </div>
          <div className="space-y-1">
            <p><span className="text-slate-500 w-28 inline-block">Beban Mengajar</span>: <strong className="text-slate-900">{totalWeeklyHours} Jam Pelajaran (JP)</strong></p>
            <p><span className="text-slate-500 w-28 inline-block">Jumlah Rombel</span>: <strong className="text-slate-900">{uniqueClassesCount} Kelas</strong></p>
            <p><span className="text-slate-500 w-28 inline-block">Total Sesi</span>: <strong className="text-slate-900">{teachingSchedules.length} Sesi Pertemuan</strong></p>
          </div>
        </div>

        {/* Schedule Table */}
        <table className="w-full text-xs font-sans border-collapse border border-slate-900 mb-6">
          <thead>
            <tr className="bg-slate-100 text-slate-950 font-bold">
              <th className="border border-slate-900 p-2 w-12 text-center">No</th>
              <th className="border border-slate-900 p-2 w-24 text-center">Hari</th>
              <th className="border border-slate-900 p-2 w-20 text-center">Jam Ke</th>
              <th className="border border-slate-900 p-2 w-28 text-center">Waktu ({currentTimezone})</th>
              <th className="border border-slate-900 p-2 w-24 text-center">Kelas</th>
              <th className="border border-slate-900 p-2 text-left">Mata Pelajaran</th>
              <th className="border border-slate-900 p-2 w-28 text-center">Ruang / Lab</th>
              <th className="border border-slate-900 p-2 text-left">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {allSchedulesSorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-slate-900 p-6 text-center text-slate-500 italic">
                  Belum ada jadwal mengajar yang diatur.
                </td>
              </tr>
            ) : (
              allSchedulesSorted.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="border border-slate-900 p-2 text-center font-mono">{idx + 1}</td>
                  <td className="border border-slate-900 p-2 text-center font-bold">{item.day}</td>
                  <td className="border border-slate-900 p-2 text-center font-mono">{item.jamKe}</td>
                  <td className="border border-slate-900 p-2 text-center font-mono">{item.startTime} - {item.endTime}</td>
                  <td className="border border-slate-900 p-2 text-center font-bold">{item.kelas}</td>
                  <td className="border border-slate-900 p-2">{item.mapel}</td>
                  <td className="border border-slate-900 p-2 text-center">{item.room || '-'}</td>
                  <td className="border border-slate-900 p-2 text-slate-600">{item.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Signature Section */}
        <OfficialSignatureBlock settings={settings} />

      </div>
    </div>
  );
};
