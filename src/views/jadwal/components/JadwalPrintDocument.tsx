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
      <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-3xl shadow-2xl max-w-4xl mx-auto border border-slate-300 font-serif printable-document overflow-x-auto">
        <div id="printable-jadwal-area" className="w-full text-slate-900 bg-white mx-auto font-serif">
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

        {/* Teacher & Subject Metadata Table (Left and Right aligned to page edges) */}
        <table 
          className="meta-container-table w-full mb-4 text-xs font-sans" 
          style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginBottom: '16px' }}
        >
          <tbody>
            <tr>
              {/* Kolom Kiri - Rata Kiri */}
              <td style={{ width: '50%', verticalAlign: 'top', border: 'none', padding: 0, textAlign: 'left' }}>
                <table className="meta-table meta-table-left" style={{ width: 'auto', borderCollapse: 'collapse', border: 'none', marginLeft: 0, marginRight: 'auto', display: 'table' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '105px', border: 'none', padding: '2px 0', textAlign: 'left', fontWeight: 'bold' }}>Nama Guru</td>
                      <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                      <td style={{ border: 'none', padding: '2px 0 2px 4px', textAlign: 'left', fontWeight: 'bold' }}>{settings.namaGuru || settings.guru || 'Guru Pengampu'}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '105px', border: 'none', padding: '2px 0', textAlign: 'left', fontWeight: 'bold' }}>NIP / NUPTK</td>
                      <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                      <td style={{ border: 'none', padding: '2px 0 2px 4px', textAlign: 'left', fontFamily: 'monospace' }}>{settings.nip || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '105px', border: 'none', padding: '2px 0', textAlign: 'left', fontWeight: 'bold' }}>Mata Pelajaran</td>
                      <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                      <td style={{ border: 'none', padding: '2px 0 2px 4px', textAlign: 'left', fontWeight: 'bold' }}>{settings.mataPelajaran || 'Matematika'}</td>
                    </tr>
                  </tbody>
                </table>
              </td>

              {/* Kolom Kanan - Mentok ke Batas Kanan Tabel */}
              <td style={{ width: '50%', verticalAlign: 'top', border: 'none', padding: 0, textAlign: 'right' }}>
                <table className="meta-table meta-table-right" style={{ width: 'auto', borderCollapse: 'collapse', border: 'none', marginLeft: 'auto', marginRight: 0, display: 'table' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '115px', border: 'none', padding: '2px 0', textAlign: 'left', fontWeight: 'bold' }}>Beban Mengajar</td>
                      <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                      <td style={{ border: 'none', padding: '2px 0 2px 4px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{totalWeeklyHours} Jam Pelajaran (JP)</td>
                    </tr>
                    <tr>
                      <td style={{ width: '115px', border: 'none', padding: '2px 0', textAlign: 'left', fontWeight: 'bold' }}>Jumlah Rombel</td>
                      <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                      <td style={{ border: 'none', padding: '2px 0 2px 4px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{uniqueClassesCount} Kelas</td>
                    </tr>
                    <tr>
                      <td style={{ width: '115px', border: 'none', padding: '2px 0', textAlign: 'left', fontWeight: 'bold' }}>Total Sesi</td>
                      <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                      <td style={{ border: 'none', padding: '2px 0 2px 4px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{teachingSchedules.length} Sesi Pertemuan</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Schedule Table */}
        <table className="w-full text-xs font-sans border-collapse border border-slate-900 mb-6">
          <thead>
            <tr className="bg-slate-100 text-slate-950 font-bold">
              <th style={{ textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-2 w-12 text-center">No</th>
              <th style={{ textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-2 w-24 text-center">Hari</th>
              <th style={{ textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-2 w-20 text-center">Jam Ke</th>
              <th style={{ textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-2 w-28 text-center">Waktu ({currentTimezone})</th>
              <th style={{ textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-2 w-24 text-center">Kelas</th>
              <th style={{ textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-2 text-center">Mata Pelajaran</th>
              <th style={{ textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-2 w-28 text-center">Ruang / Lab</th>
              <th style={{ textAlign: 'center', verticalAlign: 'middle' }} className="border border-slate-900 p-2 text-center">Keterangan</th>
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
                  <td style={{ textAlign: 'center' }} className="border border-slate-900 p-2 text-center font-mono">{idx + 1}</td>
                  <td style={{ textAlign: 'center' }} className="border border-slate-900 p-2 text-center font-bold">{item.day}</td>
                  <td style={{ textAlign: 'center' }} className="border border-slate-900 p-2 text-center font-mono">{item.jamKe}</td>
                  <td style={{ textAlign: 'center' }} className="border border-slate-900 p-2 text-center font-mono">{item.startTime} - {item.endTime}</td>
                  <td style={{ textAlign: 'center' }} className="border border-slate-900 p-2 text-center font-bold">{item.kelas}</td>
                  <td style={{ textAlign: 'left' }} className="border border-slate-900 p-2 text-left">{item.mapel}</td>
                  <td style={{ textAlign: 'center' }} className="border border-slate-900 p-2 text-center">{item.room || '-'}</td>
                  <td style={{ textAlign: 'left' }} className="border border-slate-900 p-2 text-left text-slate-600">{item.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Signature Section */}
        <OfficialSignatureBlock settings={settings} />

        </div>
      </div>
    </div>
  );
};
