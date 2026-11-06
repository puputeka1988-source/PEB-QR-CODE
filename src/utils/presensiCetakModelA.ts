import { Student, AppSettings } from '../types';
import { generateOfficialKopHtml } from './formatters';

export interface PresensiCetakModelAOptions {
  className: string;
  students: Student[];
  settings: AppSettings;
  meetingCount?: number;
  subjectName?: string;
  signatoriesHtml?: string;
}

export const generatePresensiKelasModelAHtml = ({
  className,
  students,
  settings,
  meetingCount = 16,
  subjectName,
  signatoriesHtml
}: PresensiCetakModelAOptions): string => {
  const targetClassLabel = className === 'SEMUA' ? 'Semua Kelas' : `Kelas ${className}`;
  const subjectLabel = subjectName && subjectName !== 'SEMUA'
    ? subjectName
    : (settings?.mataPelajaran || 'Mata Pelajaran');
  const guruLabel = settings?.namaGuru || 'Guru Pengampu';

  const safeMeetingCount = Math.max(10, Math.min(36, meetingCount));

  // Sort students alphabetically
  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name, 'id'));

  let rowsHtml = '';
  sortedStudents.forEach((st, idx) => {
    let meetingCells = '';
    for (let i = 0; i < safeMeetingCount; i++) {
      meetingCells += `<td style="border: 1px solid #000; text-align: center; height: 21px; padding: 0;"></td>`;
    }

    rowsHtml += `
      <tr style="height: 22px;">
        <td style="border: 1px solid #000; text-align: center; font-size: 8pt;">${idx + 1}</td>
        <td style="border: 1px solid #000; text-align: center; font-family: monospace; font-size: 8pt; white-space: nowrap;">${st.nisn}</td>
        <td style="border: 1px solid #000; text-align: left; padding: 2px 6px; font-weight: bold; white-space: nowrap; font-size: 8.5pt;">${st.name}</td>
        <td style="border: 1px solid #000; text-align: center; font-size: 8pt;">${st.gender || '-'}</td>
        ${meetingCells}
        <td style="border: 1px solid #000; text-align: center; font-size: 8pt;"></td>
        <td style="border: 1px solid #000; text-align: center; font-size: 8pt;"></td>
        <td style="border: 1px solid #000; text-align: center; font-size: 8pt;"></td>
        <td style="border: 1px solid #000; text-align: center; font-size: 8pt;"></td>
        <td style="border: 1px solid #000; text-align: center; font-size: 8pt;"></td>
      </tr>
    `;
  });

  let headerNumbers = '';
  for (let i = 0; i < safeMeetingCount; i++) {
    headerNumbers += `<th style="width: 17px; border: 1px solid #000; text-align: center; font-size: 7.5pt; padding: 2px 0;">${i + 1}</th>`;
  }

  const defaultSignatures = `
    <div style="margin-top: 24px; display: flex; justify-content: space-between; page-break-inside: avoid; width: 100%; font-family: 'Times New Roman', Times, serif; font-size: 9.5pt;">
      <div style="text-align: center; width: 45%; min-width: 200px;">
        <p style="margin: 2px 0;">Mengetahui,</p>
        <p style="margin: 2px 0; font-weight: bold;">${settings?.jabatanKepalaSekolah || 'Kepala Sekolah'}</p>
        ${settings?.ttdKepalaSekolahUrl 
          ? `<div style="height: 48px; display: flex; align-items: center; justify-content: center;"><img src="${settings.ttdKepalaSekolahUrl}" style="max-height: 46px; max-width: 150px; object-fit: contain;" /></div>` 
          : '<div style="height: 48px;"></div>'
        }
        <p style="margin: 2px 0; font-weight: bold; text-decoration: underline;">${settings?.namaKepalaSekolah || 'Drs. H. Ahmad Dahlan, M.Pd'}</p>
        <p style="margin: 2px 0; font-size: 8.5pt; font-family: monospace;">${settings?.nipKepalaSekolah ? `NIP. ${settings.nipKepalaSekolah}` : 'NIP. 19700101 199503 1 001'}</p>
      </div>
      <div style="text-align: center; width: 45%; min-width: 200px;">
        <p style="margin: 2px 0;">${settings?.kotaTandaTangan || 'Bula'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style="margin: 2px 0; font-weight: bold;">Guru Mata Pelajaran</p>
        ${settings?.ttdGuruUrl 
          ? `<div style="height: 48px; display: flex; align-items: center; justify-content: center;"><img src="${settings.ttdGuruUrl}" style="max-height: 46px; max-width: 150px; object-fit: contain;" /></div>` 
          : '<div style="height: 48px;"></div>'
        }
        <p style="margin: 2px 0; font-weight: bold; text-decoration: underline;">${settings?.namaGuru || 'Guru Pengampu'}</p>
        <p style="margin: 2px 0; font-size: 8.5pt; font-family: monospace;">${settings?.nip ? `NIP. ${settings.nip}` : 'NIP. -'}</p>
      </div>
    </div>
  `;

  return `
    <div style="font-family: 'Times New Roman', Times, serif; color: #000; width: 100%;">
      <div style="text-align: center; margin-bottom: 10px;">
        <h2 style="font-size: 13pt; font-weight: bold; text-decoration: underline; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
          DAFTAR HADIR & REKAPITULASI PRESENSI KBM SISWA
        </h2>
        <div style="font-size: 9pt; color: #334155; margin-top: 2px; font-style: italic;">
          Model A: Blangko Presensi Fisik Tatap Muka Semester / Bulanan • Standar Pelaporan Administrasi Nyata
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 9pt; border-bottom: 1px solid #000; padding-bottom: 5px;">
        <div style="line-height: 1.4;">
          <div>Satuan Pendidikan: <strong>${settings?.sekolah || '-'}</strong></div>
          <div>Kelas / Rombel: <strong>${targetClassLabel}</strong></div>
          <div>Semester / T.A: <strong>${settings?.semester || '1 (Ganjil)'} • ${settings?.tahunAjaran || '2025/2026'}</strong></div>
        </div>
        <div style="line-height: 1.4; text-align: right;">
          <div>Mata Pelajaran: <strong>${subjectLabel}</strong></div>
          <div>Guru Pengampu: <strong>${guruLabel}</strong></div>
          <div>Alokasi Pertemuan: <strong>${safeMeetingCount} Kali Tatap Muka</strong></div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 8px;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th rowspan="2" style="width: 24px; border: 1px solid #000; text-align: center; vertical-align: middle;">No</th>
            <th rowspan="2" style="width: 78px; border: 1px solid #000; text-align: center; vertical-align: middle;">NISN</th>
            <th rowspan="2" style="border: 1px solid #000; text-align: left; padding: 4px 6px; vertical-align: middle;">Nama Peserta Didik</th>
            <th rowspan="2" style="width: 26px; border: 1px solid #000; text-align: center; vertical-align: middle;">L/P</th>
            <th colspan="${safeMeetingCount}" style="border: 1px solid #000; text-align: center; background-color: #e2e8f0; font-size: 8pt; padding: 3px 0;">
              Daftar Pertemuan / Tanggal Ke-
            </th>
            <th colspan="4" style="border: 1px solid #000; text-align: center; background-color: #cbd5e1; font-size: 8pt; padding: 3px 0;">
              Rekap
            </th>
            <th rowspan="2" style="width: 48px; border: 1px solid #000; text-align: center; vertical-align: middle;">Paraf /<br/>Ket</th>
          </tr>
          <tr style="background-color: #f8fafc;">
            ${headerNumbers}
            <th style="width: 18px; border: 1px solid #000; text-align: center; font-size: 7.5pt; color: #15803d; background-color: #dcfce7; padding: 2px 0;">H</th>
            <th style="width: 18px; border: 1px solid #000; text-align: center; font-size: 7.5pt; color: #7e22ce; background-color: #f3e8ff; padding: 2px 0;">S</th>
            <th style="width: 18px; border: 1px solid #000; text-align: center; font-size: 7.5pt; color: #0369a1; background-color: #e0f2fe; padding: 2px 0;">I</th>
            <th style="width: 18px; border: 1px solid #000; text-align: center; font-size: 7.5pt; color: #be123c; background-color: #ffe4e6; padding: 2px 0;">A</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="' + (safeMeetingCount + 9) + '" style="border: 1px solid #000; padding: 12px; text-align: center;">Tidak ada data siswa untuk kelas ini.</td></tr>'}
        </tbody>
      </table>

      <div style="font-size: 8pt; color: #334155; margin-top: 4px; line-height: 1.35;">
        <div><strong>Petunjuk Administrasi:</strong> Kotak pertemuan diisi tanda paraf peserta didik atau tanda centang (✓) kehadiran saat KBM berlangsung.</div>
        <div><strong>Keterangan Rekapitulasi:</strong> <strong>H</strong> = Hadir, <strong>S</strong> = Sakit (Ada surat), <strong>I</strong> = Izin Resmi, <strong>A</strong> = Alpa (Tanpa Keterangan).</div>
      </div>

      ${signatoriesHtml || defaultSignatures}
    </div>
  `;
};

export const buildPresensiModelAFullHtml = (options: PresensiCetakModelAOptions): string => {
  const content = generatePresensiKelasModelAHtml(options);
  const kop = generateOfficialKopHtml(options.settings);

  return `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Daftar Presensi Kelas Administrasi Fisik - ${options.className}</title>
        <style>
          @page {
            size: 215mm 330mm; /* F4 / Folio Portrait */
            margin: 10mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0;
            padding: 0;
            font-size: 9pt;
            line-height: 1.25;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        ${kop}
        ${content}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
    </html>
  `;
};
