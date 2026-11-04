import React, { useMemo } from 'react';
import { useApp, getGradeSheetDocId } from '../../context/AppContext';
import { Student, ClassGradeSheet, AssessmentType, AssessmentParticipationStatus } from '../../types';
import { 
  Award, Calendar, CheckCircle2, AlertTriangle, Clock, 
  HelpCircle, Printer, BookOpen, ShieldCheck, FileCheck, Check,
  AlertCircle, Lock, Info, ExternalLink
} from 'lucide-react';
import { formatIndonesianDayAndDate, generateOfficialKopHtml } from '../../utils/formatters';
import { printHtmlDocument } from '../../utils/printHelper';

interface StudentAssessmentTabProps {
  student: Student;
}

interface AssessmentItemDisplay {
  key: AssessmentType;
  title: string;
  shortTitle: string;
  date: string;
  formattedDate: string;
  materi: string;
  status: AssessmentParticipationStatus | 'Belum Dilaksanakan';
  notes?: string;
  isConducted: boolean;
}

export const StudentAssessmentTab: React.FC<StudentAssessmentTabProps> = ({ student }) => {
  const { gradeSheets, settings, activeAcademicYear } = useApp();

  const semester = activeAcademicYear?.semester || settings.semester || '1 (Ganjil)';
  const tahunAjaran = activeAcademicYear?.name || settings.tahunAjaran || '2025/2026';
  const mapel = settings.mataPelajaran || 'Informatika';

  // Find grade sheet for student's class, semester, and academic year
  const gradeSheet = useMemo<ClassGradeSheet | undefined>(() => {
    const docId = getGradeSheetDocId(student.class, semester, tahunAjaran);
    const legacyKey = `qr_presensi_grades_${student.class}_${semester}_${tahunAjaran.replace('/', '-')}`;
    
    const found = gradeSheets.find(g => 
      g.id === docId || 
      g.id === legacyKey || 
      (g.kelas === student.class && g.semester === semester && g.tahunAjaran === tahunAjaran)
    );
    if (found) return found;

    try {
      const local = localStorage.getItem(legacyKey) || localStorage.getItem(docId);
      if (local) return JSON.parse(local);
    } catch (e) {}

    return undefined;
  }, [gradeSheets, student.class, semester, tahunAjaran]);

  // Build the 8 assessment components list with their participation statuses
  const assessmentList = useMemo<AssessmentItemDisplay[]>(() => {
    const studentGrades = gradeSheet?.studentGrades?.[student.id];
    const uhMeta = gradeSheet?.uhMeta || {};
    const statusMap = gradeSheet?.studentAssessmentStatus || {};

    const items: { key: AssessmentType; title: string; shortTitle: string; defaultMateri: string; uhIndex?: number }[] = [
      { key: 'uh1', title: 'Ulangan Harian 1 (Formatif 1)', shortTitle: 'UH 1', defaultMateri: 'Materi Pokok Bahasan 1', uhIndex: 1 },
      { key: 'uh2', title: 'Ulangan Harian 2 (Formatif 2)', shortTitle: 'UH 2', defaultMateri: 'Materi Pokok Bahasan 2', uhIndex: 2 },
      { key: 'uh3', title: 'Ulangan Harian 3 (Formatif 3)', shortTitle: 'UH 3', defaultMateri: 'Materi Pokok Bahasan 3', uhIndex: 3 },
      { key: 'uh4', title: 'Ulangan Harian 4 (Formatif 4)', shortTitle: 'UH 4', defaultMateri: 'Materi Pokok Bahasan 4', uhIndex: 4 },
      { key: 'uh5', title: 'Ulangan Harian 5 (Formatif 5)', shortTitle: 'UH 5', defaultMateri: 'Materi Pokok Bahasan 5', uhIndex: 5 },
      { key: 'uh6', title: 'Ulangan Harian 6 (Formatif 6)', shortTitle: 'UH 6', defaultMateri: 'Materi Pokok Bahasan 6', uhIndex: 6 },
      { key: 'uts', title: 'Penilaian Tengah Semester (PTS / UTS)', shortTitle: 'PTS / UTS', defaultMateri: 'Materi Tengah Semester (Sumatif Tengah Semester)' },
      { key: 'uas', title: 'Penilaian Akhir Semester (PAS / SAS)', shortTitle: 'PAS / SAS', defaultMateri: 'Materi Akhir Semester (Sumatif Akhir Semester)' },
    ];

    return items.map(item => {
      let rawDate = '';
      let materi = item.defaultMateri;

      if (item.uhIndex && uhMeta[item.uhIndex]) {
        rawDate = uhMeta[item.uhIndex].date || '';
        if (uhMeta[item.uhIndex].materi) {
          materi = uhMeta[item.uhIndex].materi;
        }
      } else if (item.key === 'uts' && gradeSheet?.ptsDate) {
        rawDate = gradeSheet.ptsDate;
      } else if (item.key === 'uas' && gradeSheet?.pasDate) {
        rawDate = gradeSheet.pasDate;
      }

      // Check explicit status record
      const explicitEntry = statusMap[`${student.id}_${item.key}`];
      if (explicitEntry && explicitEntry.date) {
        rawDate = explicitEntry.date;
      }

      const isConducted = Boolean(rawDate && rawDate.trim() !== '');

      let status: AssessmentParticipationStatus | 'Belum Dilaksanakan' = 'Belum Dilaksanakan';
      let notes = explicitEntry?.notes || '';

      if (explicitEntry && explicitEntry.status) {
        status = explicitEntry.status;
      } else if (isConducted) {
        // Auto deduction: if score is entered in grade sheet, consider followed
        const rawScore = studentGrades?.[item.key];
        if (rawScore !== undefined && rawScore !== null && rawScore.trim() !== '') {
          status = 'Sudah Mengikuti';
        } else {
          status = 'Belum Mengikuti';
        }
      } else {
        status = 'Belum Dilaksanakan';
      }

      let formattedDate = '-';
      if (rawDate) {
        const dInfo = formatIndonesianDayAndDate(rawDate);
        formattedDate = dInfo?.fullString || rawDate;
      }

      return {
        key: item.key,
        title: item.title,
        shortTitle: item.shortTitle,
        date: rawDate,
        formattedDate,
        materi,
        status,
        notes,
        isConducted
      };
    });
  }, [gradeSheet, student.id]);

  // Analytics summary for student clearance
  const summary = useMemo(() => {
    const conducted = assessmentList.filter(a => a.isConducted);
    const sudah = assessmentList.filter(a => a.status === 'Sudah Mengikuti');
    const belum = assessmentList.filter(a => a.status === 'Belum Mengikuti' || a.status === 'Perlu Susulan');
    const izinSakit = assessmentList.filter(a => a.status === 'Izin / Sakit');
    const belumDilaksanakan = assessmentList.filter(a => a.status === 'Belum Dilaksanakan');

    const totalConducted = conducted.length;
    const isAllClear = totalConducted > 0 && belum.length === 0;

    return {
      totalConducted,
      sudahCount: sudah.length,
      belumCount: belum.length,
      izinSakitCount: izinSakit.length,
      belumDilaksanakanCount: belumDilaksanakan.length,
      isAllClear,
      clearancePercentage: totalConducted > 0 ? Math.round((sudah.length / totalConducted) * 100) : 100
    };
  }, [assessmentList]);

  // Print Official Assessment Clearance Card (Kartu Kendali Ulangan Bebas Nilai Angka)
  const handlePrintClearanceCard = () => {
    const printableHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Kartu Kendali Partisipasi Ulangan & Penilaian - ${student.name}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              font-size: 10pt;
              line-height: 1.4;
              background: #fff;
            }
            .title-box {
              text-align: center;
              background: #F8F6F0;
              border: 1.5px solid #0F3B2E;
              border-radius: 8px;
              padding: 10px;
              margin: 15px 0;
            }
            .title {
              font-size: 12pt;
              font-weight: 900;
              color: #0F3B2E;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .subtitle {
              font-size: 8.5pt;
              color: #475569;
              margin-top: 3px;
              font-weight: 600;
            }
            .meta-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 9.5pt;
            }
            .meta-table td {
              padding: 4px 6px;
              vertical-align: top;
            }
            .label-col { width: 130px; font-weight: 700; color: #475569; }
            .val-col { font-weight: 700; color: #0F3B2E; }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 9pt;
            }
            .data-table th, .data-table td {
              border: 1px solid #cbd5e1;
              padding: 7px 8px;
            }
            .data-table th {
              background: #0F3B2E;
              color: #ffffff;
              font-weight: 800;
              text-transform: uppercase;
              font-size: 8pt;
              text-align: center;
            }
            .badge-sudah {
              color: #047857;
              font-weight: 900;
              background: #d1fae5;
              padding: 3px 6px;
              border-radius: 4px;
              display: inline-block;
            }
            .badge-belum {
              color: #b91c1c;
              font-weight: 900;
              background: #fee2e2;
              padding: 3px 6px;
              border-radius: 4px;
              display: inline-block;
            }
            .badge-wait {
              color: #64748b;
              font-weight: 700;
              background: #f1f5f9;
              padding: 3px 6px;
              border-radius: 4px;
              display: inline-block;
            }
            .notice-box {
              margin-top: 15px;
              border: 1px dashed #94a3b8;
              padding: 8px 12px;
              font-size: 8pt;
              color: #475569;
              border-radius: 6px;
              background: #f8fafc;
            }
            .sig-section {
              margin-top: 25px;
              display: flex;
              justify-content: space-between;
              font-size: 9pt;
            }
            .sig-col {
              width: 200px;
              text-align: center;
            }
            .sig-space {
              height: 50px;
            }
            .sig-name {
              font-weight: 800;
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          ${generateOfficialKopHtml(settings, { marginBottom: '10px' })}

          <div class="title-box">
            <div class="title">KARTU KENDALI KELENGKAPAN ULANGAN & PENILAIAN</div>
            <div class="subtitle">Surat Keterangan Partisipasi Asesmen Semester - Standar Blind Score Protocol</div>
          </div>

          <table class="meta-table">
            <tr>
              <td class="label-col">Nama Siswa</td>
              <td style="width: 10px;">:</td>
              <td class="val-col" style="text-transform: uppercase;">${student.name}</td>
              <td class="label-col">Mata Pelajaran</td>
              <td style="width: 10px;">:</td>
              <td class="val-col">${mapel}</td>
            </tr>
            <tr>
              <td class="label-col">NISN / No. Induk</td>
              <td>:</td>
              <td class="val-col">${student.nisn}</td>
              <td class="label-col">Kelas / Rombel</td>
              <td>:</td>
              <td class="val-col">${student.class}</td>
            </tr>
            <tr>
              <td class="label-col">Tahun Ajaran / Sem</td>
              <td>:</td>
              <td class="val-col">${tahunAjaran} • Semester ${semester}</td>
              <td class="label-col">Guru Pengampu</td>
              <td>:</td>
              <td class="val-col">${settings.namaGuru || 'Ahmad Subagja, S.Kom'}</td>
            </tr>
          </table>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 35px;">No</th>
                <th>Jenis Penilaian / Ulangan</th>
                <th>Materi Pokok / KD</th>
                <th style="width: 110px;">Tanggal Pelaksanaan</th>
                <th style="width: 130px;">Status Partisipasi</th>
              </tr>
            </thead>
            <tbody>
              ${assessmentList.map((item, idx) => {
                let badgeHtml = '<span class="badge-wait">Belum Dilaksanakan</span>';
                if (item.status === 'Sudah Mengikuti') {
                  badgeHtml = '<span class="badge-sudah">SUDAH MENGIKUTI</span>';
                } else if (item.status === 'Belum Mengikuti' || item.status === 'Perlu Susulan') {
                  badgeHtml = '<span class="badge-belum">BELUM MENGIKUTI</span>';
                } else if (item.status === 'Izin / Sakit') {
                  badgeHtml = '<span class="badge-belum" style="background: #fef3c7; color: #b45309;">IZIN / SAKIT (SUSULAN)</span>';
                }

                return `
                  <tr>
                    <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                    <td><strong>${item.title}</strong></td>
                    <td style="font-size: 8.5pt;">${item.materi || '-'}</td>
                    <td style="text-align: center; font-size: 8.5pt;">${item.formattedDate}</td>
                    <td style="text-align: center;">${badgeHtml}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="notice-box">
            <strong>Catatan Kerahasiaan Nilai:</strong> Dokumen ini merupakan bukti resmi rekam jejak partisipasi dan kelengkapan asesmen siswa. Sesuai etika dan tata tertib akademik sekolah, nilai angka murni bersifat rahasia dan baru disahkan serta diumumkan bersamaan dengan pembagian buku Rapor Semester resmi.
          </div>

          <div class="sig-section">
            <div class="sig-col">
              <div>Mengetahui,</div>
              <div>Orang Tua / Wali Siswa</div>
              <div class="sig-space"></div>
              <div class="sig-name">( ........................................ )</div>
            </div>

            <div class="sig-col">
              <div>${settings.kotaTandaTangan || 'Bula'}, ${formatIndonesianDayAndDate(new Date().toISOString().split('T')[0]).fullString}</div>
              <div>Guru Pengampu Mata Pelajaran</div>
              <div class="sig-space"></div>
              <div class="sig-name">${settings.namaGuru || 'Ahmad Subagja, S.Kom'}</div>
              <div style="font-size: 8pt; color: #475569;">${settings.nip ? `NIP. ${settings.nip}` : ''}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printHtmlDocument(printableHtml);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-950/90 border border-emerald-500/40 px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kendali Penilaian Siswa</span>
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-semibold">{mapel}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-1.5 flex items-center gap-2">
              <span>Status Partisipasi & Kelengkapan Ulangan</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Pantau kelengkapan ulangan harian (UH 1–6), PTS, dan PAS semester ini sesuai tanggal pelaksanaan yang telah diinput guru pengampu.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrintClearanceCard}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kartu Kendali</span>
            </button>
          </div>
        </div>

        {/* Confidentiality Notice Bar (Blind Score Protocol) */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-bold text-white">Prinsip Kerahasiaan Nilai (Blind Score): </span>
            Nilai angka murni bersifat rahasia sampai guru menyetorkan ke wali kelas dan diserahkan resmi melalui Buku Rapor. Halaman ini hanya memverifikasi apakah Anda sudah mengikuti ulangan atau memerlukan jadwal susulan.
          </div>
        </div>
      </div>

      {/* QUICK STATUS METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-medium">TOTAL DILAKSANAKAN</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{summary.totalConducted}</span>
            <span className="text-xs text-slate-400">dari 8 Asesmen</span>
          </div>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SUDAH DIIKUTI</span>
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-400">{summary.sudahCount}</span>
            <span className="text-xs text-emerald-300/70 font-semibold">Tuntas</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
          summary.belumCount > 0 
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' 
            : 'bg-slate-900/90 border-slate-800 text-slate-400'
        }`}>
          <span className="text-[11px] font-medium flex items-center gap-1">
            <AlertTriangle className={`w-3.5 h-3.5 ${summary.belumCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
            <span>BELUM MENGIKUTI</span>
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-2xl font-black ${summary.belumCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {summary.belumCount}
            </span>
            <span className="text-xs font-semibold">
              {summary.belumCount > 0 ? 'Perlu Susulan!' : 'Nihil'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-medium">TINGKAT KELENGKAPAN</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{summary.clearancePercentage}%</span>
            <span className="text-xs text-slate-400">Semester Ini</span>
          </div>
        </div>
      </div>

      {/* ALERT IF ANY ASSESSMENT IS MISSED */}
      {summary.belumCount > 0 && (
        <div className="bg-rose-500/10 border-2 border-rose-500/40 rounded-2xl p-4 flex items-start gap-3.5 shadow-lg animate-in fade-in duration-150">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-rose-300 text-sm">
              Pemberitahuan: Anda Memiliki {summary.belumCount} Ulangan Yang Belum Diikuti!
            </p>
            <p className="text-slate-200 leading-relaxed">
              Segera hubungi Guru Mata Pelajaran (<span className="font-bold text-white">{settings.namaGuru || 'Ahmad Subagja, S.Kom'}</span>) untuk konfirmasi jadwal ulangan susulan sebelum masa akhir semester dan penyetoran nilai ke wali kelas ditutup.
            </p>
          </div>
        </div>
      )}

      {/* ALL CLEAR SUCCESS BANNER */}
      {summary.isAllClear && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-emerald-300">
              Selamat! Semua Ulangan Yang Telah Diselenggarakan Berhasil Anda Ikuti.
            </p>
            <p className="text-slate-300 mt-0.5">
              Partisipasi asesmen Anda lengkap ({summary.sudahCount} dari {summary.totalConducted} ulangan terlaksana). Tunggu pengumuman resmi pembagian buku rapor.
            </p>
          </div>
        </div>
      )}

      {/* LIST OF ASSESSMENTS (CARDS) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400" />
          <span>Rincian Partisipasi Tiap Ulangan & Asesmen</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assessmentList.map((item) => {
            const isSudah = item.status === 'Sudah Mengikuti';
            const isBelum = item.status === 'Belum Mengikuti' || item.status === 'Perlu Susulan';
            const isIzin = item.status === 'Izin / Sakit';
            const isWait = item.status === 'Belum Dilaksanakan';

            return (
              <div 
                key={item.key}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 shadow-sm ${
                  isSudah
                    ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/40'
                    : isBelum
                    ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500'
                    : isIzin
                    ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border bg-slate-950 border-slate-800 text-slate-400">
                      {item.shortTitle}
                    </span>

                    {/* STATUS BADGE */}
                    {isSudah && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>SUDAH MENGIKUTI</span>
                      </span>
                    )}

                    {isBelum && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>BELUM MENGIKUTI</span>
                      </span>
                    )}

                    {isIzin && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>IZIN / SAKIT (SUSULAN)</span>
                      </span>
                    )}

                    {isWait && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>BELUM DILAKSANAKAN</span>
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug">
                    {item.title}
                  </h4>

                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    <span className="text-slate-400">Materi: </span>{item.materi}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.isConducted ? item.formattedDate : 'Jadwal belum ditentukan'}</span>
                  </div>

                  {item.notes ? (
                    <span className="text-[11px] font-medium text-amber-300 max-w-[150px] truncate" title={item.notes}>
                      Ket: {item.notes}
                    </span>
                  ) : isBelum ? (
                    <span className="text-[11px] font-bold text-rose-400">
                      Butuh Susulan
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
