import React from 'react';
import { Download, Printer } from 'lucide-react';
import { AppSettings, Student, DailyGradeItem } from '../../../types';
import { OfficialKopSurat } from '../../../components/print/OfficialKopSurat';
import { OfficialSignatureBlock } from '../../../components/print/OfficialSignatureBlock';
import { formatIndonesianDayAndDate } from '../../../utils/formatters';

interface PenilaianPrintDocumentProps {
  settings: AppSettings;
  selectedClass: string;
  setSelectedClass: (cls: string) => void;
  availableClasses: string[];
  semester: string;
  tahunAjaran: string;
  mapel: string;
  uhMeta: { [key: number]: { date: string; materi: string } };
  tableRows: { rows: Student[]; totalDisplay: number };
  studentGrades: { [studentId: string]: DailyGradeItem };
  weightPercentages: { uh: number; uts: number; uas: number };
  customKotaTandaTangan: string;
  setCustomKotaTandaTangan: (val: string) => void;
  today: string;
  onExportCSV: () => void;
  onPrint: () => void;
}

export const PenilaianPrintDocument: React.FC<PenilaianPrintDocumentProps> = ({
  settings,
  selectedClass,
  setSelectedClass,
  availableClasses,
  semester,
  tahunAjaran,
  mapel,
  uhMeta,
  tableRows,
  studentGrades,
  weightPercentages,
  customKotaTandaTangan,
  setCustomKotaTandaTangan,
  today,
  onExportCSV,
  onPrint
}) => {
  const dayDate = formatIndonesianDayAndDate(today);
  const signatureDate = `${customKotaTandaTangan || settings.kotaTandaTangan || 'Bula'}, ${dayDate.fullString.split(', ')[1] || today}`;

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-bold mr-1">Kelas Cetak:</span>
            {availableClasses.map(cls => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  selectedClass === cls
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                Kelas {cls}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Kota TTD */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Kota TTD:</span>
              <input
                type="text"
                value={customKotaTandaTangan}
                onChange={(e) => setCustomKotaTandaTangan(e.target.value)}
                placeholder="Bula"
                className="bg-transparent text-emerald-400 font-bold text-xs w-24 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={onExportCSV}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-2xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Unduh CSV</span>
            </button>

            <button
              type="button"
              onClick={onPrint}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Cetak / Cetak PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Canvas */}
      <div className="bg-white text-black p-8 sm:p-12 rounded-3xl shadow-2xl border border-slate-200 overflow-x-auto font-serif leading-tight">
        
        <div 
          id="printable-nilai-area" 
          className="min-w-[850px] w-full text-black bg-white mx-auto font-serif text-[11px] leading-tight"
        >
          {/* Kop Sekolah Resmi (Dual Logo) */}
          <OfficialKopSurat settings={settings} />
          
          {/* Title Centered */}
          <h1 className="text-center font-bold text-base uppercase tracking-wider mb-4 underline">
            DAFTAR NILAI HARIAN SISWA
          </h1>

          {/* Header Information */}
          <table className="meta-table w-full mb-3 text-xs border-none" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ width: '120px', border: 'none', padding: '2px 0' }} className="font-semibold">Kelas</td>
                <td style={{ width: '10px', border: 'none', padding: '2px 0' }}>:</td>
                <td style={{ border: 'none', padding: '2px 0' }} className="font-bold">{selectedClass}</td>
              </tr>
              <tr>
                <td style={{ border: 'none', padding: '2px 0' }} className="font-semibold">Semester</td>
                <td style={{ border: 'none', padding: '2px 0' }}>:</td>
                <td style={{ border: 'none', padding: '2px 0' }}>{semester}</td>
              </tr>
              <tr>
                <td style={{ border: 'none', padding: '2px 0' }} className="font-semibold">Tahun Ajaran</td>
                <td style={{ border: 'none', padding: '2px 0' }}>:</td>
                <td style={{ border: 'none', padding: '2px 0' }}>{tahunAjaran}</td>
              </tr>
              <tr>
                <td style={{ border: 'none', padding: '2px 0' }} className="font-semibold">Mata Pelajaran</td>
                <td style={{ border: 'none', padding: '2px 0' }}>:</td>
                <td style={{ border: 'none', padding: '2px 0' }}>{mapel}</td>
              </tr>
            </tbody>
          </table>

          {/* Main Print Grid Table */}
          <table 
            style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'center', marginTop: '8px', marginBottom: '16px' }}
            className="w-full text-center border-collapse border border-black"
          >
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th rowSpan={3} style={{ border: '1px solid #000', padding: '4px', width: '32px' }}>NO</th>
                <th rowSpan={3} style={{ border: '1px solid #000', padding: '4px 6px', width: '200px', textAlign: 'center', whiteSpace: 'nowrap' }}>NAMA SISWA</th>
                <th rowSpan={3} style={{ border: '1px solid #000', padding: '4px', width: '35px' }}>L/P</th>
                <th colSpan={6} style={{ border: '1px solid #000', padding: '4px' }}>NILAI HARIAN</th>
                <th rowSpan={3} style={{ border: '1px solid #000', padding: '4px', width: '50px' }}>NILAI UTS</th>
                <th rowSpan={3} style={{ border: '1px solid #000', padding: '4px', width: '50px' }}>NILAI UAS</th>
                <th rowSpan={3} style={{ border: '1px solid #000', padding: '4px', width: '60px' }}>NILAI AKHIR</th>
              </tr>

              <tr>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <th key={i} style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '9px', textAlign: 'left', fontWeight: 'normal' }}>
                    <div>Tanggal: {uhMeta[i]?.date || ''}</div>
                    <div>Materi: {uhMeta[i]?.materi || ''}</div>
                  </th>
                ))}
              </tr>

              <tr style={{ backgroundColor: '#f1f5f9' }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <th key={i} style={{ border: '1px solid #000', padding: '3px' }}>
                    UH {i}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: tableRows.totalDisplay }).map((_, idx) => {
                const student: Student | undefined = tableRows.rows[idx];
                const grades = student ? (studentGrades[student.id] || {}) : {};

                return (
                  <tr key={idx} style={{ height: '22px' }}>
                    <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '2px 6px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {student ? student.name : ''}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>
                      {student ? (student.gender || 'L') : ''}
                    </td>
                    
                    <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{grades.uh1 || ''}</td>
                    <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{grades.uh2 || ''}</td>
                    <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{grades.uh3 || ''}</td>
                    <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{grades.uh4 || ''}</td>
                    <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{grades.uh5 || ''}</td>
                    <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{grades.uh6 || ''}</td>
                    
                    <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{grades.uts || ''}</td>
                    <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center' }}>{grades.uas || ''}</td>
                    <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center', fontWeight: 'bold' }}>{grades.finalGrade || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footnote on Applied Weights */}
          <div style={{ marginTop: '6px', marginBottom: '14px', fontSize: '9px', color: '#475569', fontStyle: 'italic' }}>
            *Keterangan Bobot Penilaian: Nilai Harian / UH ({weightPercentages.uh}%), Nilai UTS ({weightPercentages.uts}%), Nilai UAS ({weightPercentages.uas}%). Nilai Akhir dihitung berdasarkan akumulasi pembobotan resmi.
          </div>

          {/* Dual Signatures */}
          <OfficialSignatureBlock settings={settings} customDate={signatureDate} />

        </div>
      </div>
    </div>
  );
};
