import React from 'react';
import { AppSettings, TeacherAdditionalDuty, ClassKokurikulerP5 } from '../../../../types';

interface BebanPrintDocumentProps {
  settings: AppSettings;
  today: string;
  rombelList: {
    kelas: string;
    mapel: string;
    totalJp: number;
    schedules: any[];
    studentsCount: number;
    rooms: string[];
  }[];
  p5ConfigMap: { [kelas: string]: ClassKokurikulerP5 };
  activeDuties: TeacherAdditionalDuty[];
  totalIntrakurikulerJp: number;
  totalP5Jp: number;
  totalTugasTambahanJp: number;
  totalKumulatifJp: number;
  totalStudentsTaught: number;
  isEligibleForCertification: boolean;
  jpDeficit: number;
}

export const BebanPrintDocument: React.FC<BebanPrintDocumentProps> = ({
  settings,
  today,
  rombelList,
  p5ConfigMap,
  activeDuties,
  totalIntrakurikulerJp,
  totalP5Jp,
  totalTugasTambahanJp,
  totalKumulatifJp,
  totalStudentsTaught,
  isEligibleForCertification,
  jpDeficit
}) => {
  // Format Indonesian date
  const formatIndoDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      id="printable-beban-kerja-area"
      className="bg-white text-black p-8 sm:p-10 rounded-sm shadow-xl max-w-4xl w-full"
      style={{
        fontFamily: '"Times New Roman", Times, serif',
        color: '#000000',
        backgroundColor: '#ffffff'
      }}
    >
      {/* KOP SURAT SEKOLAH */}
      <div className="border-b-[3px] border-double border-black pb-3 mb-6 text-center relative">
        <div className="flex items-center justify-between gap-4">
          {settings.logoKiriUrl ? (
            <img
              src={settings.logoKiriUrl}
              alt="Logo Instansi"
              className="w-20 h-20 object-contain shrink-0"
            />
          ) : (
            <div className="w-16 h-16 shrink-0" />
          )}

          <div className="flex-1 text-center space-y-0.5">
            {settings.instansiProvinsi && (
              <h4 className="text-xs uppercase font-bold tracking-wider leading-tight">
                {settings.instansiProvinsi}
              </h4>
            )}
            {settings.instansiKabupaten && (
              <h4 className="text-xs uppercase font-bold tracking-wider leading-tight">
                {settings.instansiKabupaten}
              </h4>
            )}
            <h2 className="text-lg font-bold uppercase tracking-tight leading-tight">
              {settings.sekolah || 'SEKOLAH / MADRASAH'}
            </h2>
            {settings.npsn && (
              <p className="text-[10px] font-sans font-semibold">NPSN: {settings.npsn}</p>
            )}
            {settings.alamat && (
              <p className="text-[10px] leading-tight text-gray-700 font-sans">
                {settings.alamat} {settings.kontakSekolah ? `| Telp: ${settings.kontakSekolah}` : ''}
              </p>
            )}
          </div>

          {settings.logoKananUrl || settings.logoUrl ? (
            <img
              src={settings.logoKananUrl || settings.logoUrl}
              alt="Logo Sekolah"
              className="w-20 h-20 object-contain shrink-0"
            />
          ) : (
            <div className="w-16 h-16 shrink-0" />
          )}
        </div>
      </div>

      {/* JUDUL DOKUMEN */}
      <div className="text-center mb-5 space-y-1">
        <h3 className="text-base font-bold uppercase underline tracking-wide">
          SURAT KETERANGAN BEBAN KERJA GURU (SKBK / SKMT)
        </h3>
        <p className="text-xs font-sans">
          Nomor: {settings.tahunAjaran ? `421.3 / SKBK / ${settings.tahunAjaran.replace(/\//g, '-')}` : '421.3 / SKBK / 2025-2026'}
        </p>
      </div>

      {/* IDENTITAS GURU & SEKOLAH */}
      <div className="mb-5">
        <p className="text-xs leading-relaxed mb-2">
          Yang bertanda tangan di bawah ini, Kepala {settings.sekolah || 'Sekolah / Madrasah'}, menerangkan bahwa:
        </p>
        <table className="meta-table meta-table-left" style={{ width: 'auto', borderCollapse: 'collapse', border: 'none', marginLeft: 0, marginRight: 'auto', display: 'table' }}>
          <tbody>
            <tr>
              <td style={{ width: '160px', border: 'none', padding: '2px 0', fontWeight: 'bold', fontSize: '12px' }}>Nama Guru</td>
              <td style={{ width: '15px', border: 'none', padding: '2px 0', fontSize: '12px' }}>:</td>
              <td style={{ border: 'none', padding: '2px 0', fontWeight: 'bold', fontSize: '12px' }}>{settings.namaGuru || 'Guru Pengampu'}</td>
            </tr>
            <tr>
              <td style={{ border: 'none', padding: '2px 0', fontWeight: 'bold', fontSize: '12px' }}>NIP / NUPTK</td>
              <td style={{ border: 'none', padding: '2px 0', fontSize: '12px' }}>:</td>
              <td style={{ border: 'none', padding: '2px 0', fontSize: '12px' }}>{settings.nip || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: 'none', padding: '2px 0', fontWeight: 'bold', fontSize: '12px' }}>Mata Pelajaran Pokok</td>
              <td style={{ border: 'none', padding: '2px 0', fontSize: '12px' }}>:</td>
              <td style={{ border: 'none', padding: '2px 0', fontSize: '12px' }}>{settings.mataPelajaran || 'Semua Mata Pelajaran'}</td>
            </tr>
            <tr>
              <td style={{ border: 'none', padding: '2px 0', fontWeight: 'bold', fontSize: '12px' }}>Tahun Ajaran / Semester</td>
              <td style={{ border: 'none', padding: '2px 0', fontSize: '12px' }}>:</td>
              <td style={{ border: 'none', padding: '2px 0', fontSize: '12px' }}>{settings.tahunAjaran || '2025/2026'} / {settings.semester || '1 (Ganjil)'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* TABEL I: PEMBAGIAN TUGAS MENGAJAR INTRAKURIKULER */}
      <div className="mb-4 space-y-1">
        <h4 className="text-xs font-bold">I. RINCIAN TUGAS MENGAJAR INTRAKURIKULER (TATAP MUKA POKOK)</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ border: '1px solid #000', padding: '4px 3px', width: '28px' }}>No</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>Kelas / Rombel</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>Mata Pelajaran</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px' }}>Hari Mengajar</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px' }}>Jam Ke</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', width: '65px' }}>Beban JP</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', width: '70px' }}>Jml Siswa</th>
            </tr>
          </thead>
          <tbody>
            {rombelList.map((r, idx) => {
              const days = Array.from(new Set(r.schedules.map((s: any) => s.day))).join(', ');
              const jamKes = r.schedules.map((s: any) => s.jamKe).join('; ');
              return (
                <tr key={r.kelas}>
                  <td style={{ border: '1px solid #000', padding: '3px' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left', fontWeight: 'bold' }}>{r.kelas}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>{r.mapel}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px' }}>{days}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px' }}>{jamKes}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', fontWeight: 'bold' }}>{r.totalJp} JP</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px' }}>{r.studentsCount}</td>
                </tr>
              );
            })}
            <tr style={{ backgroundColor: '#f9fafb', fontWeight: 'bold' }}>
              <td colSpan={5} style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>
                SUBTOTAL INTRAKURIKULER ({rombelList.length} ROMBEL)
              </td>
              <td style={{ border: '1px solid #000', padding: '4px 6px' }}>{totalIntrakurikulerJp} JP</td>
              <td style={{ border: '1px solid #000', padding: '4px 6px' }}>{totalStudentsTaught}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* TABEL II: KOKURIKULER / P5 / P5P2RA PER KELAS */}
      <div className="mb-4 space-y-1">
        <h4 className="text-xs font-bold">II. TUGAS KOKURIKULER (P5 / P5P2RA) DIEKUIVALENKAN BEBAN MENGAJAR</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ border: '1px solid #000', padding: '4px 3px', width: '28px' }}>No</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left', width: '110px' }}>Kelas / Rombel</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>Kategori & Tema Projek</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>Topik / Uraian Projek</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left', width: '120px' }}>Peran Fasilitator</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', width: '65px' }}>Beban JP</th>
            </tr>
          </thead>
          <tbody>
            {rombelList.map((r, idx) => {
              const p5 = p5ConfigMap[r.kelas] || {
                kelas: r.kelas,
                jp: 1,
                category: 'P5',
                theme: 'Gaya Hidup Berkelanjutan',
                projectName: `Projek P5 Kelas ${r.kelas}`,
                role: 'Fasilitator Utama',
                isEnabled: true
              };
              const isEnabled = p5.isEnabled !== false && (p5.jp || 0) > 0;

              return (
                <tr key={r.kelas}>
                  <td style={{ border: '1px solid #000', padding: '3px' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left', fontWeight: 'bold' }}>Kelas {r.kelas}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>
                    <span style={{ fontWeight: 'bold' }}>[{p5.category || 'P5'}]</span> {p5.theme || 'Gaya Hidup Berkelanjutan'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>
                    {p5.projectName || `Projek ${p5.category || 'P5'} Kelas ${r.kelas}`}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>
                    {p5.role || 'Fasilitator Utama'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', fontWeight: 'bold' }}>
                    {isEnabled ? `+${p5.jp} JP` : '0 JP'}
                  </td>
                </tr>
              );
            })}
            <tr style={{ backgroundColor: '#f9fafb', fontWeight: 'bold' }}>
              <td colSpan={5} style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>
                SUBTOTAL KOKURIKULER (P5 / P5P2RA)
              </td>
              <td style={{ border: '1px solid #000', padding: '4px 6px' }}>+{totalP5Jp} JP</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* TABEL III: TUGAS TAMBAHAN & EKUIVALENSI */}
      <div className="mb-4 space-y-1">
        <h4 className="text-xs font-bold">III. TUGAS TAMBAHAN YANG DIAKUI EKUIVALENSI JP</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ border: '1px solid #000', padding: '4px 3px', width: '28px' }}>No</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>Nama Tugas Tambahan</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>Nomor SK Penugasan</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>Keterangan / Tugas</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', width: '85px' }}>Ekuivalensi JP</th>
            </tr>
          </thead>
          <tbody>
            {activeDuties.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ border: '1px solid #000', padding: '6px', fontStyle: 'italic', color: '#666' }}>
                  Tidak ada tugas tambahan yang aktif
                </td>
              </tr>
            ) : (
              activeDuties.map((d, idx) => (
                <tr key={d.id}>
                  <td style={{ border: '1px solid #000', padding: '3px' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left', fontWeight: 'bold' }}>{d.name}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>{d.skNumber || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>{d.notes || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', fontWeight: 'bold' }}>+{d.jtmEquivalent} JP</td>
                </tr>
              ))
            )}
            <tr style={{ backgroundColor: '#f9fafb', fontWeight: 'bold' }}>
              <td colSpan={4} style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>
                SUBTOTAL EKUIVALENSI TUGAS TAMBAHAN
              </td>
              <td style={{ border: '1px solid #000', padding: '4px 6px' }}>+{totalTugasTambahanJp} JP</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* TABEL IV: REKAPITULASI AKHIR & STATUS SERTIFIKASI */}
      <div className="mb-5 space-y-1">
        <h4 className="text-xs font-bold">IV. REKAPITULASI KUMULATIF BEBAN KERJA GURU</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px 8px', width: '70%' }}>
                1. Jam Mengajar Tatap Muka Intrakurikuler
              </td>
              <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                {totalIntrakurikulerJp} JP / Minggu
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
                2. Jam Kokurikuler / Projek Penguatan Profil (P5 / P5P2RA)
              </td>
              <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                +{totalP5Jp} JP / Minggu
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
                3. Ekuivalensi Tugas Tambahan Resmi
              </td>
              <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                +{totalTugasTambahanJp} JP / Minggu
              </td>
            </tr>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold', fontSize: '12px' }}>
                TOTAL KUMULATIF BEBAN KERJA (1 + 2 + 3)
              </td>
              <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>
                {totalKumulatifJp} JP / Minggu
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px 8px', fontStyle: 'italic' }}>
                Status Kelayakan Beban Kerja Sertifikasi Guru (24 - 40 JP)
              </td>
              <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                {isEligibleForCertification ? 'MEMENUHI SYARAT BEBAN MINIMAL (TERPENUHI)' : `BELUM MEMENUHI (KURANG ${jpDeficit} JP)`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* KOLOM TANDA TANGAN (KIRI: GURU, KANAN: KEPALA SEKOLAH) */}
      <div className="pt-3" style={{ pageBreakInside: 'avoid' }}>
        <table style={{ width: '100%', border: 'none', borderCollapse: 'collapse', textAlign: 'center' }}>
          <tbody>
            <tr>
              <td style={{ width: '45%', border: 'none', verticalAlign: 'top', padding: 0 }}>
                <p style={{ fontSize: '11px', margin: '0 0 4px 0' }}>Guru Yang Bersangkutan,</p>
                <div style={{ height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {settings.ttdGuruUrl ? (
                    <img
                      src={settings.ttdGuruUrl}
                      alt="Tanda Tangan Guru"
                      style={{ maxHeight: '55px', maxWidth: '130px', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ height: '45px' }} />
                  )}
                </div>
                <p style={{ fontSize: '12px', fontWeight: 'bold', textDecoration: 'underline', margin: '0' }}>
                  {settings.namaGuru || 'Nama Guru'}
                </p>
                <p style={{ fontSize: '11px', margin: '2px 0 0 0' }}>
                  NIP: {settings.nip || '-'}
                </p>
              </td>

              <td style={{ width: '10%', border: 'none' }} />

              <td style={{ width: '45%', border: 'none', verticalAlign: 'top', padding: 0 }}>
                <p style={{ fontSize: '11px', margin: '0 0 2px 0' }}>
                  {settings.kotaTandaTangan || 'Kota Sekolah'}, {formatIndoDate(today)}
                </p>
                <p style={{ fontSize: '11px', margin: '0 0 4px 0' }}>
                  Kepala {settings.sekolah || 'Sekolah'},
                </p>
                <div style={{ height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {settings.ttdKepalaSekolahUrl ? (
                    <img
                      src={settings.ttdKepalaSekolahUrl}
                      alt="Tanda Tangan Kepala Sekolah"
                      style={{ maxHeight: '55px', maxWidth: '130px', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ height: '45px' }} />
                  )}
                </div>
                <p style={{ fontSize: '12px', fontWeight: 'bold', textDecoration: 'underline', margin: '0' }}>
                  {settings.namaKepalaSekolah || 'Nama Kepala Sekolah'}
                </p>
                <p style={{ fontSize: '11px', margin: '2px 0 0 0' }}>
                  NIP: {settings.nipKepalaSekolah || '-'}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
};
