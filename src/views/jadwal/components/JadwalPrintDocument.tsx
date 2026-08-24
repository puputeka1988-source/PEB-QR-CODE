import React, { useState, useMemo } from 'react';
import { Printer, Download, Filter, Layers, BookOpen, CheckCircle2, Sparkles, Award } from 'lucide-react';
import { AppSettings, TeachingScheduleItem, ClassKokurikulerP5 } from '../../../types';
import { OfficialKopSurat } from '../../../components/print/OfficialKopSurat';
import { OfficialSignatureBlock } from '../../../components/print/OfficialSignatureBlock';
import { parseJp } from '../../../utils/scheduleHelper';

interface JadwalPrintDocumentProps {
  settings: AppSettings;
  teachingSchedules: TeachingScheduleItem[];
  allSchedulesSorted: TeachingScheduleItem[];
  currentTimezone: string;
  totalWeeklyHours?: number;
  totalIntrakurikulerJp: number;
  totalP5Jp: number;
  totalTugasTambahanJp: number;
  totalBebanMengajar: number;
  p5ConfigMap: { [kelas: string]: ClassKokurikulerP5 };
  distinctClasses: string[];
  uniqueClassesCount: number;
  today: string;
  onPrint: () => void;
  onExportExcel: (selectedClass?: string) => void;
}

export const JadwalPrintDocument: React.FC<JadwalPrintDocumentProps> = ({
  settings,
  teachingSchedules,
  allSchedulesSorted,
  currentTimezone,
  totalIntrakurikulerJp,
  totalP5Jp,
  totalTugasTambahanJp,
  totalBebanMengajar,
  p5ConfigMap,
  distinctClasses,
  uniqueClassesCount,
  onPrint,
  onExportExcel
}) => {
  // State for filtering by selected class or all classes
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('Semua');

  // Filtered schedules based on user selection
  const displayedSchedules = useMemo(() => {
    if (selectedClassFilter === 'Semua') {
      return allSchedulesSorted;
    }
    return allSchedulesSorted.filter(s => s.kelas && s.kelas.trim() === selectedClassFilter.trim());
  }, [allSchedulesSorted, selectedClassFilter]);

  // Filtered workload calculations
  const filteredIntraJp = useMemo(() => {
    return displayedSchedules.reduce((acc, curr) => acc + parseJp(curr.jamKe, curr.jtm), 0);
  }, [displayedSchedules]);

  const filteredP5Jp = useMemo(() => {
    if (selectedClassFilter !== 'Semua') {
      const p5 = p5ConfigMap[selectedClassFilter];
      if (p5 && p5.isEnabled !== false) {
        return p5.jp || 0;
      }
      return 0;
    }
    return distinctClasses.reduce((acc, cls) => {
      const p5 = p5ConfigMap[cls];
      if (p5 && p5.isEnabled !== false) {
        return acc + (p5.jp || 0);
      }
      return acc;
    }, 0);
  }, [selectedClassFilter, p5ConfigMap, distinctClasses]);

  const filteredTotalJp = filteredIntraJp + filteredP5Jp;

  // Selected class P5 details (if a specific class is selected)
  const selectedP5Info = useMemo(() => {
    if (selectedClassFilter === 'Semua') return null;
    return p5ConfigMap[selectedClassFilter] || {
      kelas: selectedClassFilter,
      jp: 1,
      category: 'P5',
      theme: 'Gaya Hidup Berkelanjutan',
      projectName: `Projek P5 Kelas ${selectedClassFilter}`,
      role: 'Fasilitator Utama',
      isEnabled: true
    };
  }, [selectedClassFilter, p5ConfigMap]);

  return (
    <div className="space-y-6">
      {/* Action Header Banner & Live Workload Synchronizer */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-emerald-400" />
              Format Cetak Jadwal Mengajar & Beban Kerja Resmi (DINAS / KEMDIKBUD)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Dokumen resmi siap cetak dan tanda tangan dengan KOP Surat, kolom beban Intrakurikuler, Kokurikuler (P5/P5P2RA), dan sinkronisasi total beban mengajar.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              id="btn-export-excel-jadwal"
              onClick={() => onExportExcel(selectedClassFilter)}
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

        {/* Live Synchronized Workload Metrics & Class Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
          {/* Class Filter Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              Filter / Pilih Kelas:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                id="filter-class-all"
                onClick={() => setSelectedClassFilter('Semua')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedClassFilter === 'Semua'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                Semua Kelas ({distinctClasses.length})
              </button>
              {distinctClasses.map(cls => {
                const isSelected = selectedClassFilter === cls;
                const p5 = p5ConfigMap[cls];
                const hasP5 = p5 && p5.isEnabled !== false && (p5.jp || 0) > 0;
                return (
                  <button
                    key={cls}
                    type="button"
                    id={`filter-class-${cls.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => setSelectedClassFilter(cls)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    <span>{cls}</span>
                    {hasP5 && (
                      <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isSelected ? 'bg-slate-950 text-emerald-300 font-bold' : 'bg-teal-950/80 text-teal-300 border border-teal-800/60'}`}>
                        +{p5.jp} P5
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Synchronized Workload Summary Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Total Beban Mengajar:</span>
              <strong className="text-emerald-400 font-black font-mono">{totalBebanMengajar} JP</strong>
            </div>
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Intrakurikuler:</span>
              <strong className="text-slate-200 font-bold font-mono">{totalIntrakurikulerJp} JP</strong>
            </div>
            <div className="bg-teal-950/60 px-3 py-1.5 rounded-xl border border-teal-800/60 flex items-center gap-1.5 text-xs">
              <span className="text-teal-300">Kokurikuler P5:</span>
              <strong className="text-teal-400 font-black font-mono">+{totalP5Jp} JP</strong>
            </div>
            {totalTugasTambahanJp > 0 && (
              <div className="bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-800/60 flex items-center gap-1.5 text-xs">
                <span className="text-purple-300">Tugas Tambahan:</span>
                <strong className="text-purple-400 font-black font-mono">+{totalTugasTambahanJp} JP</strong>
              </div>
            )}
          </div>
        </div>

        {/* Selected Class Highlight Info Card */}
        {selectedClassFilter !== 'Semua' && selectedP5Info && (
          <div className="bg-emerald-950/30 border border-emerald-800/60 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white flex items-center gap-2">
                  <span>Alokasi Beban Mengajar Kelas: <strong className="text-emerald-400">{selectedClassFilter}</strong></span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[10px] font-bold">
                    {selectedP5Info.category || 'P5'} ({selectedP5Info.isEnabled !== false ? `+${selectedP5Info.jp || 1} JP` : 'Nonaktif'})
                  </span>
                </p>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Tema: <span className="font-semibold text-slate-100">{selectedP5Info.theme || 'Gaya Hidup Berkelanjutan'}</span> • Projek: <span className="text-slate-300">{selectedP5Info.projectName || `Projek P5 Kelas ${selectedClassFilter}`}</span> • Peran: <span className="text-slate-300">{selectedP5Info.role || 'Fasilitator Utama'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
              <span className="text-slate-400">{filteredIntraJp} JP Intra</span>
              <span className="text-teal-400">+{filteredP5Jp} JP P5</span>
              <span className="text-white font-bold">=</span>
              <span className="text-emerald-400 font-black">{filteredTotalJp} JP Beban Kelas</span>
            </div>
          </div>
        )}
      </div>

      {/* Printable White Paper Simulation */}
      <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-3xl shadow-2xl max-w-4xl mx-auto border border-slate-300 font-serif printable-document overflow-x-auto">
        <div id="printable-jadwal-area" className="w-full text-slate-900 bg-white mx-auto font-serif">
          {/* KOP Surat Instansi Resmi (Dual Logo) */}
          <OfficialKopSurat settings={settings} />

          {/* Document Title */}
          <div className="text-center mb-5">
            <h3 className="text-base font-black uppercase tracking-wide underline decoration-2">
              JADWAL MENGAJAR GURU & ALOKASI BEBAN KERJA TAHUN AJARAN {settings.tahunAjaran || '2025/2026'}
            </h3>
            <p className="text-xs text-slate-700 font-sans mt-0.5">
              {selectedClassFilter !== 'Semua' ? (
                <>CAKUPAN: <strong className="text-slate-900 uppercase font-bold">KELAS {selectedClassFilter}</strong> • </>
              ) : null}
              SEMESTER: <strong className="text-slate-900 uppercase font-bold">{settings.semester || '1 (GANJIL)'}</strong> • ZONA WAKTU: <strong className="text-slate-900 font-mono font-bold">{currentTimezone}</strong>
            </p>
          </div>

          {/* Teacher & Subject Metadata Table */}
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
                        <td style={{ width: '115px', border: 'none', padding: '2px 0', textAlign: 'left', fontWeight: 'bold' }}>Nama Guru</td>
                        <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                        <td style={{ border: 'none', padding: '2px 0 2px 4px', textAlign: 'left', fontWeight: 'bold' }}>{settings.namaGuru || settings.guru || 'Guru Pengampu'}</td>
                      </tr>
                      <tr>
                        <td style={{ width: '115px', border: 'none', padding: '2px 0', textAlign: 'left', fontWeight: 'bold' }}>NIP / NUPTK</td>
                        <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                        <td style={{ border: 'none', padding: '2px 0 2px 4px', textAlign: 'left', fontFamily: 'monospace' }}>{settings.nip || '-'}</td>
                      </tr>
                      <tr>
                        <td style={{ width: '115px', border: 'none', padding: '2px 0', textAlign: 'left', fontWeight: 'bold' }}>Mata Pelajaran</td>
                        <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                        <td style={{ border: 'none', padding: '2px 0 2px 4px', textAlign: 'left', fontWeight: 'bold' }}>{settings.mataPelajaran || 'Matematika'}</td>
                      </tr>
                      <tr>
                        <td style={{ width: '115px', border: 'none', padding: '2px 0', textAlign: 'left', fontWeight: 'bold' }}>Cakupan Kelas</td>
                        <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                        <td style={{ border: 'none', padding: '2px 0 2px 4px', textAlign: 'left', fontWeight: 'bold' }}>
                          {selectedClassFilter === 'Semua' ? `Semua Rombel (${distinctClasses.join(', ') || `${uniqueClassesCount} Kelas`})` : `Kelas ${selectedClassFilter}`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>

                {/* Kolom Kanan - Mentok ke Batas Kanan Tabel */}
                <td style={{ width: '50%', verticalAlign: 'top', border: 'none', padding: 0, textAlign: 'right' }}>
                  <table className="meta-table meta-table-right" style={{ width: 'auto', borderCollapse: 'collapse', border: 'none', marginLeft: 'auto', marginRight: 0, display: 'table' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '135px', border: 'none', padding: '2px 0', textAlign: 'left', fontWeight: 'bold' }}>Total Beban Mengajar</td>
                        <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                        <td style={{ border: 'none', padding: '2px 0 2px 4px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                          {selectedClassFilter === 'Semua' ? `${totalBebanMengajar} JP / Minggu` : `${filteredTotalJp} JP (${selectedClassFilter})`}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ width: '135px', border: 'none', padding: '2px 0', textAlign: 'left', fontWeight: 'bold' }}>Rincian Alokasi JP</td>
                        <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                        <td style={{ border: 'none', padding: '2px 0 2px 4px', textAlign: 'left', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          {selectedClassFilter === 'Semua' ? (
                            <span>{totalIntrakurikulerJp} JP Intra + {totalP5Jp} JP P5{totalTugasTambahanJp > 0 ? ` + ${totalTugasTambahanJp} JP Tugas` : ''}</span>
                          ) : (
                            <span>{filteredIntraJp} JP Intrakurikuler + {filteredP5Jp} JP P5</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ width: '135px', border: 'none', padding: '2px 0', textAlign: 'left', fontWeight: 'bold' }}>Jumlah Rombel</td>
                        <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                        <td style={{ border: 'none', padding: '2px 0 2px 4px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                          {selectedClassFilter === 'Semua' ? `${uniqueClassesCount} Kelas` : `1 Rombel Terpilih`}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ width: '135px', border: 'none', padding: '2px 0', textAlign: 'left', fontWeight: 'bold' }}>Total Sesi Pertemuan</td>
                        <td style={{ width: '12px', border: 'none', padding: '2px 0', textAlign: 'center' }}>:</td>
                        <td style={{ border: 'none', padding: '2px 0 2px 4px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                          {displayedSchedules.length} Sesi Pertemuan
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Schedule & Workload Table with Kokurikuler / P5 / P5P2RA Columns */}
          <table className="w-full text-xs font-sans border-collapse border border-slate-900 mb-6">
            <thead>
              <tr className="bg-slate-100 text-slate-950 font-bold">
                <th style={{ textAlign: 'center', verticalAlign: 'middle', border: '1px solid #000', padding: '6px 4px', width: '32px' }}>No</th>
                <th style={{ textAlign: 'center', verticalAlign: 'middle', border: '1px solid #000', padding: '6px 4px', width: '70px' }}>Hari</th>
                <th style={{ textAlign: 'center', verticalAlign: 'middle', border: '1px solid #000', padding: '6px 4px', width: '55px' }}>Jam Ke</th>
                <th style={{ textAlign: 'center', verticalAlign: 'middle', border: '1px solid #000', padding: '6px 4px', width: '90px' }}>Waktu ({currentTimezone})</th>
                <th style={{ textAlign: 'center', verticalAlign: 'middle', border: '1px solid #000', padding: '6px 4px', width: '75px' }}>Kelas</th>
                <th style={{ textAlign: 'center', verticalAlign: 'middle', border: '1px solid #000', padding: '6px 6px' }}>Mata Pelajaran</th>
                <th style={{ textAlign: 'center', verticalAlign: 'middle', border: '1px solid #000', padding: '6px 4px', width: '55px' }}>Intra (JP)</th>
                <th style={{ textAlign: 'center', verticalAlign: 'middle', border: '1px solid #000', padding: '6px 6px', width: '175px' }}>Beban Kokurikuler / P5 / P5P2RA</th>
                <th style={{ textAlign: 'center', verticalAlign: 'middle', border: '1px solid #000', padding: '6px 4px', width: '60px' }}>Total JP</th>
                <th style={{ textAlign: 'center', verticalAlign: 'middle', border: '1px solid #000', padding: '6px 4px', width: '80px' }}>Ruang / Lab</th>
                <th style={{ textAlign: 'center', verticalAlign: 'middle', border: '1px solid #000', padding: '6px 6px' }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {displayedSchedules.length === 0 ? (
                <tr>
                  <td colSpan={11} className="border border-slate-900 p-6 text-center text-slate-500 italic">
                    {selectedClassFilter === 'Semua'
                      ? 'Belum ada jadwal mengajar yang diatur.'
                      : `Tidak ada jadwal mengajar untuk kelas ${selectedClassFilter}.`}
                  </td>
                </tr>
              ) : (
                displayedSchedules.map((item, idx) => {
                  const intraJp = parseJp(item.jamKe, item.jtm);
                  const p5 = p5ConfigMap[item.kelas] || {
                    kelas: item.kelas,
                    jp: 1,
                    category: 'P5',
                    theme: 'Gaya Hidup Berkelanjutan',
                    projectName: `Projek P5 Kelas ${item.kelas}`,
                    role: 'Fasilitator Utama',
                    isEnabled: true
                  };
                  const isP5Active = p5.isEnabled !== false && (p5.jp || 0) > 0;
                  const classP5Jp = isP5Active ? (p5.jp || 0) : 0;
                  const rowTotalJp = intraJp + classP5Jp;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px' }} className="font-mono">
                        {idx + 1}
                      </td>
                      <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>
                        {item.day}
                      </td>
                      <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px' }} className="font-mono">
                        {item.jamKe}
                      </td>
                      <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px' }} className="font-mono">
                        {item.startTime} - {item.endTime}
                      </td>
                      <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>
                        {item.kelas}
                      </td>
                      <td style={{ textAlign: 'left', border: '1px solid #000', padding: '4px 6px' }}>
                        {item.mapel}
                      </td>
                      <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>
                        {intraJp} JP
                      </td>
                      <td style={{ textAlign: 'left', border: '1px solid #000', padding: '4px 6px' }}>
                        {isP5Active ? (
                          <div className="leading-tight">
                            <span className="font-bold">+{classP5Jp} JP [{p5.category || 'P5'}]</span>
                            <span className="text-[10px] text-slate-700 block">{p5.theme || 'Gaya Hidup Berkelanjutan'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">0 JP (-)</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f9fafb' }}>
                        {rowTotalJp} JP
                      </td>
                      <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px' }}>
                        {item.room || item.ruang || '-'}
                      </td>
                      <td style={{ textAlign: 'left', border: '1px solid #000', padding: '4px 6px', color: '#4b5563' }}>
                        {item.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {displayedSchedules.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
                  <td colSpan={6} style={{ textAlign: 'right', border: '1px solid #000', padding: '6px 8px' }}>
                    SUBTOTAL BEBAN MENGAJAR ({displayedSchedules.length} SESI {selectedClassFilter !== 'Semua' ? `KELAS ${selectedClassFilter}` : ''})
                  </td>
                  <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px 4px', fontWeight: 'bold' }}>
                    {filteredIntraJp} JP
                  </td>
                  <td style={{ textAlign: 'left', border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>
                    +{filteredP5Jp} JP (Kokurikuler P5)
                  </td>
                  <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px 4px', fontWeight: 'bold', backgroundColor: '#e5e7eb' }}>
                    {filteredTotalJp} JP
                  </td>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', fontSize: '11px', textAlign: 'center', fontStyle: 'italic', color: '#374151' }}>
                    Tersinkronisasi Regulasi Permendikbud
                  </td>
                </tr>
                {selectedClassFilter === 'Semua' && totalTugasTambahanJp > 0 && (
                  <tr style={{ backgroundColor: '#faf5ff', fontWeight: 'bold' }}>
                    <td colSpan={6} style={{ textAlign: 'right', border: '1px solid #000', padding: '4px 8px', color: '#6b21a8' }}>
                      EKUIVALENSI TUGAS TAMBAHAN RESMI
                    </td>
                    <td colSpan={2} style={{ textAlign: 'left', border: '1px solid #000', padding: '4px 8px', color: '#6b21a8' }}>
                      +{totalTugasTambahanJp} JP (Tugas Tambahan Aktif)
                    </td>
                    <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px', color: '#6b21a8', backgroundColor: '#f3e8ff' }}>
                      +{totalTugasTambahanJp} JP
                    </td>
                    <td colSpan={2} style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '10px', color: '#6b21a8' }}>
                      SK Penugasan Kepala Sekolah
                    </td>
                  </tr>
                )}
                {selectedClassFilter === 'Semua' && (
                  <tr style={{ backgroundColor: '#ecfdf5', fontWeight: 'bold', fontSize: '12px' }}>
                    <td colSpan={6} style={{ textAlign: 'right', border: '1px solid #000', padding: '8px', color: '#065f46' }}>
                      TOTAL KUMULATIF BEBAN MENGAJAR GURU (INTRA + P5 + TUGAS TAMBAHAN)
                    </td>
                    <td colSpan={5} style={{ textAlign: 'left', border: '1px solid #000', padding: '8px', color: '#065f46', fontSize: '13px' }}>
                      <strong>{totalBebanMengajar} JP / Minggu</strong> <span className="font-normal text-xs text-slate-700">({totalIntrakurikulerJp} JP Intrakurikuler + {totalP5Jp} JP P5{totalTugasTambahanJp > 0 ? ` + ${totalTugasTambahanJp} JP Tugas Tambahan` : ''})</span>
                    </td>
                  </tr>
                )}
              </tfoot>
            )}
          </table>

          {/* Rincian P5 Per Rombel Box (Muncul bila mencetak semua kelas) */}
          {selectedClassFilter === 'Semua' && distinctClasses.length > 0 && (
            <div className="mb-6 p-4 border border-slate-900 rounded-sm bg-slate-50 font-sans text-xs">
              <h4 className="font-bold uppercase mb-2 flex items-center gap-1.5 text-slate-900">
                <Award className="w-4 h-4 text-emerald-700" />
                Rincian Alokasi Beban Kokurikuler / P5 / P5P2RA Per Rombel Kelas:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {distinctClasses.map(cls => {
                  const p5 = p5ConfigMap[cls] || {
                    kelas: cls,
                    jp: 1,
                    category: 'P5',
                    theme: 'Gaya Hidup Berkelanjutan',
                    projectName: `Projek P5 Kelas ${cls}`,
                    role: 'Fasilitator Utama',
                    isEnabled: true
                  };
                  const isP5Active = p5.isEnabled !== false && (p5.jp || 0) > 0;
                  return (
                    <div key={cls} className="bg-white border border-slate-300 p-2 rounded text-[11px] leading-tight">
                      <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1">
                        <span>Kelas {cls}</span>
                        <span className={isP5Active ? 'text-emerald-700 font-black' : 'text-slate-400'}>
                          {isP5Active ? `+${p5.jp} JP [${p5.category || 'P5'}]` : '0 JP'}
                        </span>
                      </div>
                      <p className="text-slate-600 truncate">Tema: <span className="font-semibold text-slate-800">{p5.theme || 'Gaya Hidup Berkelanjutan'}</span></p>
                      <p className="text-slate-500 truncate text-[10px]">Peran: {p5.role || 'Fasilitator Utama'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Signature Section */}
          <OfficialSignatureBlock settings={settings} />

        </div>
      </div>
    </div>
  );
};
