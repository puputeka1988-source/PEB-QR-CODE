import React, { useState, useEffect, useMemo } from 'react';
import { Student, AttendanceRecord, AttendanceStatus, AppSettings, DailyGradeItem, ClassGradeSheet } from '../../types';
import { useApp } from '../../context/AppContext';
import QRCode from 'qrcode';
import { 
  X, Printer, User, Award, Calendar, CheckCircle2, AlertTriangle, 
  Clock, BookOpen, QrCode as QrIcon, Heart, TrendingUp, Sparkles,
  Phone, Building2, ShieldCheck, FileSpreadsheet, Star, FileText, Check, AlertCircle
} from 'lucide-react';
import { formatIndonesianDayAndDate, getStudentInitials } from '../../utils/formatters';

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, onClose }) => {
  const { 
    attendance, settings, activeAcademicYear, academicYears, setSelectedStudentForCard, setActiveTab,
    markAttendanceByNisn
  } = useApp();

  const [activeTabSub, setActiveTabSub] = useState<'ringkasan' | 'presensi' | 'nilai' | 'sikap'>('ringkasan');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  // Custom teacher notes state (persisted locally per student)
  const [customTeacherNote, setCustomTeacherNote] = useState<string>('');
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
  const [tempNote, setTempNote] = useState<string>('');

  // Manual attendance input form inside modal
  const [quickStatus, setQuickStatus] = useState<AttendanceStatus>('Hadir');
  const [quickDate, setQuickDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [quickTime, setQuickTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [quickNote, setQuickNote] = useState<string>('');
  const [isMarkingAttendance, setIsMarkingAttendance] = useState<boolean>(false);

  // Load custom notes from localStorage
  useEffect(() => {
    if (student) {
      const saved = localStorage.getItem(`student_custom_notes_${student.id}`);
      if (saved) {
        setCustomTeacherNote(saved);
        setTempNote(saved);
      } else {
        setCustomTeacherNote('');
        setTempNote('');
      }
    }
  }, [student?.id]);

  const saveCustomNote = () => {
    if (!student) return;
    localStorage.setItem(`student_custom_notes_${student.id}`, tempNote);
    setCustomTeacherNote(tempNote);
    setIsEditingNote(false);
  };

  // Generate QR Code URL
  useEffect(() => {
    if (student) {
      QRCode.toDataURL(student.nisn, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0F3B2E',
          light: '#FFFFFF'
        }
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Gagal generate QR modal detail:', err));
    } else {
      setQrDataUrl('');
    }
  }, [student?.nisn]);

  // Current academic year display
  const currentTa = useMemo(() => {
    if (activeAcademicYear) {
      const yearName = activeAcademicYear.name || '2025/2026';
      const sem = activeAcademicYear.semester ? ` (${activeAcademicYear.semester})` : '';
      return `${yearName}${sem}`;
    }
    const yearStr = settings.tahunAjaran || '2025/2026';
    const semStr = settings.semester ? ` (${settings.semester})` : '';
    return `${yearStr}${semStr}`;
  }, [activeAcademicYear, settings.tahunAjaran, settings.semester]);

  // Attendance Records for this student (matching by ID, NISN, or Student Name & Class for maximum robustness)
  const studentAttendance = useMemo(() => {
    if (!student) return [];
    const cleanStudentId = String(student.id || '').trim().toLowerCase();
    const cleanStudentNisn = String(student.nisn || '').trim();
    const cleanStudentName = String(student.name || '').trim().toLowerCase();
    const cleanStudentClass = String(student.class || '').trim().toLowerCase();

    return attendance
      .filter(a => {
        const aStudentId = String(a.studentId || '').trim().toLowerCase();
        const aNisn = String(a.nisn || '').trim();
        const aName = String(a.studentName || '').trim().toLowerCase();
        const aClass = String(a.class || '').trim().toLowerCase();

        return (
          (cleanStudentId && aStudentId === cleanStudentId) ||
          (cleanStudentNisn && aNisn === cleanStudentNisn) ||
          (cleanStudentName && aName === cleanStudentName)
        );
      })
      .sort((a, b) => (b.date + ' ' + (b.time || '')).localeCompare(a.date + ' ' + (a.time || '')));
  }, [attendance, student]);

  // Calculate Attendance Stats (Siswa terlambat tetap dihitung Hadir dalam akumulasi kehadiran fisik)
  const attendanceStats = useMemo(() => {
    const total = studentAttendance.length;
    const hadir = studentAttendance.filter(a => a.status === 'Hadir').length;
    const terlambat = studentAttendance.filter(a => a.status === 'Terlambat').length;
    const izin = studentAttendance.filter(a => a.status === 'Izin').length;
    const sakit = studentAttendance.filter(a => a.status === 'Sakit').length;
    const alpa = studentAttendance.filter(a => a.status === 'Alpa').length;

    // Akumulasi: Siswa yang datang Terlambat tetap dihitung sebagai Hadir (100% kehadiran fisik)
    const totalHadir = hadir + terlambat;
    const percentage = total > 0 ? Math.round((totalHadir / total) * 100) : 100;

    return {
      total,
      hadir, // Hadir tepat waktu
      terlambat, // Datang terlambat (tetap dihitung Hadir)
      totalHadir, // Total akumulasi hadir
      izin,
      sakit,
      alpa,
      percentage
    };
  }, [studentAttendance]);

  // Fetch student grade sheet from localStorage
  const studentGrades = useMemo(() => {
    if (!student) return null;
    const sem = activeAcademicYear?.semester || settings.semester || '1 (Ganjil)';
    const ta = (activeAcademicYear?.name || settings.tahunAjaran || '2025/2026').replace('/', '-');
    const storageKey = `qr_presensi_grades_${student.class}_${sem}_${ta}`;
    
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const sheet: ClassGradeSheet = JSON.parse(raw);
        return {
          mapel: sheet.mapel || settings.mataPelajaran || 'Informatika',
          grades: sheet.studentGrades?.[student.id] || null,
          uhMeta: sheet.uhMeta || {},
          weights: sheet.weights || settings.weights || { uh: 40, uts: 30, uas: 30 }
        };
      }
    } catch (e) {
      console.error('Error loading grade sheet for student modal:', e);
    }
    return {
      mapel: settings.mataPelajaran || 'Informatika',
      grades: null,
      uhMeta: {},
      weights: settings.weights || { uh: 40, uts: 30, uas: 30 }
    };
  }, [student, activeAcademicYear, settings]);

  // Calculate Numerical Grade Average with configured weights
  const gradeAnalytics = useMemo(() => {
    if (!studentGrades?.grades) {
      return {
        avgUh: null,
        uts: null,
        uas: null,
        finalGrade: null,
        weights: studentGrades?.weights || { uh: 40, uts: 30, uas: 30 },
        predikat: 'Belum Dinilai',
        catatanNilai: 'Data nilai harian belum diinput di modul Penilaian Harian.'
      };
    }
    const g = studentGrades.grades;
    const weightsConfig = studentGrades.weights || { uh: 40, uts: 30, uas: 30 };
    const wUH = Math.max(0, Number(weightsConfig.uh) || 0);
    const wUTS = Math.max(0, Number(weightsConfig.uts) || 0);
    const wUAS = Math.max(0, Number(weightsConfig.uas) || 0);

    const uhs = [g.uh1, g.uh2, g.uh3, g.uh4, g.uh5, g.uh6]
      .map(v => (v ? parseFloat(v) : null))
      .filter((v): v is number => v !== null && !isNaN(v));
    
    const avgUh = uhs.length > 0 ? Math.round(uhs.reduce((a, b) => a + b, 0) / uhs.length) : null;
    const uts = g.uts ? parseFloat(g.uts) : null;
    const uas = g.uas ? parseFloat(g.uas) : null;

    let finalGradeNum: number | null = null;
    if (g.finalGrade && !isNaN(parseFloat(g.finalGrade))) {
      finalGradeNum = parseFloat(g.finalGrade);
    } else if (avgUh !== null || uts !== null || uas !== null) {
      let totalScore = 0;
      let sumWeights = 0;

      if (avgUh !== null) {
        totalScore += avgUh * wUH;
        sumWeights += wUH;
      }
      if (uts !== null) {
        totalScore += uts * wUTS;
        sumWeights += wUTS;
      }
      if (uas !== null) {
        totalScore += uas * wUAS;
        sumWeights += wUAS;
      }

      if (sumWeights > 0) {
        finalGradeNum = Math.round(totalScore / sumWeights);
      }
    }

    let predikat = 'Cukup';
    let catatanNilai = 'Perlu ditingkatkan partisipasi dan ketuntasan tugas harian.';
    if (finalGradeNum !== null) {
      if (finalGradeNum >= 90) {
        predikat = 'Sangat Baik (A)';
        catatanNilai = 'Menunjukkan penguasaan materi yang sangat istimewa, aktif, dan konsisten tuntas belajar.';
      } else if (finalGradeNum >= 80) {
        predikat = 'Baik (B)';
        catatanNilai = 'Menunjukkan pemahaman materi yang baik dan mampu menyelesaikan tugas dengan mandiri.';
      } else if (finalGradeNum >= 70) {
        predikat = 'Cukup (C)';
        catatanNilai = 'Telah mencapai kriteria ketuntasan minimal, disarankan memperbanyak latihan soal mandiri.';
      } else {
        predikat = 'Perlu Bimbingan (D)';
        catatanNilai = 'Perlu bimbingan remedial khusus dan peningkatan disiplin pengumpulan tugas.';
      }
    }

    return {
      avgUh,
      uts,
      uas,
      finalGrade: finalGradeNum,
      weights: weightsConfig,
      predikat,
      catatanNilai
    };
  }, [studentGrades]);

  // Automated Attitude & Behavior Synthesis based on attendance + grades
  const attitudeAnalysis = useMemo(() => {
    const p = attendanceStats.percentage;
    const alpaCount = attendanceStats.alpa;
    const terlambatCount = attendanceStats.terlambat;
    const totalHadir = attendanceStats.totalHadir;

    let disiplin = 'Sangat Baik';
    let kedisiplinanDesc = 'Siswa sangat disiplin hadir tepat waktu dan mematuhi seluruh tata tertib kehadiran madrasah/sekolah.';
    
    if (alpaCount > 2 || p < 75) {
      disiplin = 'Perlu Pembinaan';
      kedisiplinanDesc = `Terdapat ${alpaCount} ketidakhadiran tanpa keterangan (Alpa). Memerlukan koordinasi dengan orang tua/wali serta konseling wali kelas.`;
    } else if (terlambatCount > 3) {
      disiplin = 'Cukup';
      kedisiplinanDesc = `Siswa tercatat aktif hadir (${totalHadir} kali hadir), namun mengalami keterlambatan sebanyak ${terlambatCount} kali. Diperlukan pembiasaan manajemen waktu di pagi hari.`;
    } else if (terlambatCount > 0) {
      disiplin = 'Baik';
      kedisiplinanDesc = `Kehadiran terpantau teratur (${totalHadir} kali hadir, termasuk ${terlambatCount} kali kedatangan terlambat). Perlu konsistensi jam kedatangan di pagi hari.`;
    } else if (p >= 95) {
      disiplin = 'Sangat Baik';
      kedisiplinanDesc = 'Tingkat kehadiran luar biasa (di atas 95%), selalu hadir tepat waktu dan menjadi teladan bagi teman sekelas.';
    } else {
      disiplin = 'Baik';
      kedisiplinanDesc = 'Kehadiran terpantau teratur dan mengikuti kegiatan belajar mengajar dengan tertib.';
    }

    let keaktifan = 'Aktif & Kooperatif';
    let keaktifanDesc = 'Menunjukkan sikap santun, kooperatif dalam diskusi kelompok, serta memiliki motivasi belajar yang tinggi.';
    if (gradeAnalytics.finalGrade && gradeAnalytics.finalGrade < 70) {
      keaktifan = 'Cukup / Perlu Dorongan';
      keaktifanDesc = 'Perlu didorong lebih aktif bertanya saat pembelajaran berlangsung dan membangun rasa percaya diri.';
    }

    return {
      disiplin,
      kedisiplinanDesc,
      keaktifan,
      keaktifanDesc,
      rekomendasiUmum: alpaCount > 2 
        ? 'Perlu pemanggilan orang tua dan bimbingan konseling terkait absensi.'
        : 'Pertahankan prestasi belajar dan kebiasaan baik yang sudah terbentuk.'
    };
  }, [attendanceStats, gradeAnalytics]);

  // Print Comprehensive Student Dossier / Report
  const handlePrintDossier = () => {
    if (!student) return;

    const schoolName = settings.sekolah || 'SMA NEGERI 1 KITA';
    const schoolNpsn = settings.npsn ? `NPSN: ${settings.npsn}` : '';
    const schoolAddress = settings.alamat || 'Jl. Pendidikan No. 45, Kota Edukasi';
    const instansiProv = settings.instansiProvinsi || '';
    const instansiKab = settings.instansiKabupaten || '';
    const logoKiri = settings.logoKiriUrl || '';
    const logoKanan = settings.logoKananUrl || settings.logoUrl || '';
    const printDateInfo = formatIndonesianDayAndDate(new Date().toISOString().split('T')[0]);
    const printDateStr = printDateInfo.fullString;
    const teacherName = settings.namaGuru || 'Ahmad Subagja, S.Kom';
    const teacherNip = settings.nip ? `NIP. ${settings.nip}` : '';
    const principalName = settings.namaKepalaSekolah || 'Drs. H. Ahmad Dahlan, M.Pd';
    const principalNip = settings.nipKepalaSekolah ? `NIP. ${settings.nipKepalaSekolah}` : '';
    const city = settings.kotaTandaTangan || 'Bula';

    const printableHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Rapor Portofolio & Rekam Jejak Siswa - ${student.name}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              font-size: 10pt;
              line-height: 1.4;
              background: #fff;
            }
            .kop-container {
              display: flex;
              align-items: center;
              gap: 15px;
              border-bottom: 2.5px solid #0F3B2E;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .kop-logo {
              width: 65px;
              height: 65px;
              object-fit: contain;
            }
            .kop-text {
              flex: 1;
              text-align: center;
            }
            .kop-instansi {
              font-size: 10pt;
              font-weight: 700;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .kop-school {
              font-size: 14pt;
              font-weight: 900;
              color: #0F3B2E;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 2px 0;
            }
            .kop-address {
              font-size: 8pt;
              color: #64748b;
            }
            .dossier-title-box {
              text-align: center;
              background: #F8F6F0;
              border: 1px solid #D4AF37;
              border-radius: 6px;
              padding: 8px;
              margin-bottom: 15px;
            }
            .dossier-title {
              font-size: 12pt;
              font-weight: 900;
              color: #0F3B2E;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .dossier-sub {
              font-size: 8.5pt;
              color: #64748b;
              font-weight: 600;
              margin-top: 2px;
            }
            .identity-section {
              display: flex;
              gap: 15px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 15px;
            }
            .identity-qr {
              width: 85px;
              text-align: center;
              border-right: 1px dashed #cbd5e1;
              padding-right: 12px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .identity-qr img {
              width: 75px;
              height: 75px;
              object-fit: contain;
            }
            .identity-table {
              flex: 1;
              width: 100%;
              font-size: 9pt;
              border-collapse: collapse;
            }
            .identity-table td {
              padding: 3px 4px;
              vertical-align: top;
            }
            .label-col { width: 110px; font-weight: 700; color: #475569; }
            .val-col { font-weight: 700; color: #0F3B2E; }
            
            .section-header {
              font-size: 10pt;
              font-weight: 800;
              color: #0F3B2E;
              border-bottom: 1.5px solid #D4AF37;
              padding-bottom: 3px;
              margin: 15px 0 8px 0;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            
            .stats-grid {
              display: flex;
              gap: 8px;
              margin-bottom: 12px;
            }
            .stat-card {
              flex: 1;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 6px;
              text-align: center;
              background: #fff;
            }
            .stat-val {
              font-size: 12pt;
              font-weight: 900;
              color: #0F3B2E;
            }
            .stat-lbl {
              font-size: 7pt;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
            }
            
            table.data-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8pt;
              margin-bottom: 10px;
            }
            table.data-table th, table.data-table td {
              border: 1px solid #cbd5e1;
              padding: 5px 6px;
              text-align: left;
            }
            table.data-table th {
              background: #f1f5f9;
              font-weight: 800;
              color: #334155;
            }
            
            .narrative-box {
              background: #fff;
              border: 1px solid #e2e8f0;
              border-left: 3.5px solid #0F3B2E;
              border-radius: 4px;
              padding: 8px 10px;
              margin-bottom: 8px;
              font-size: 8.5pt;
            }
            .narrative-title {
              font-weight: 800;
              color: #0F3B2E;
              margin-bottom: 2px;
            }
            
            .sig-container {
              display: flex;
              justify-content: space-between;
              margin-top: 25px;
              page-break-inside: avoid;
            }
            .sig-box {
              width: 200px;
              text-align: center;
              font-size: 9pt;
            }
            .sig-space {
              height: 45px;
            }
            .sig-name {
              font-weight: 800;
              color: #0f172a;
              text-decoration: underline;
            }
            .sig-nip {
              font-size: 8pt;
              color: #475569;
            }
          </style>
        </head>
        <body>
          
          <!-- KOP SURAT RESMI -->
          <div class="kop-container">
            ${logoKiri ? `<img src="${logoKiri}" class="kop-logo" alt="Logo Kop Kiri" />` : (logoKanan ? `<div style="width: 65px; visibility: hidden;"></div>` : '')}
            <div class="kop-text">
              ${instansiProv ? `<div class="kop-instansi">${instansiProv}</div>` : ''}
              ${instansiKab ? `<div class="kop-instansi">${instansiKab}</div>` : ''}
              <div class="kop-school">${schoolName}</div>
              <div class="kop-address">${schoolAddress} ${schoolNpsn ? `• ${schoolNpsn}` : ''}</div>
            </div>
            ${logoKanan ? `<img src="${logoKanan}" class="kop-logo" alt="Logo Sekolah" />` : (logoKiri ? `<div style="width: 65px; visibility: hidden;"></div>` : '')}
          </div>

          <!-- JUDUL LAPORAN -->
          <div class="dossier-title-box">
            <div class="dossier-title">LEMBAR REKAM JEJAK & PORTOFOLIO SISWA</div>
            <div class="dossier-sub">Laporan Komprehensif Presensi, Nilai Pembelajaran, dan Evaluasi Karakter Sikap</div>
          </div>

          <!-- IDENTITAS SISWA LENGKAP -->
          <div class="identity-section">
            <div class="identity-qr">
              ${qrDataUrl ? `<img src="${qrDataUrl}" />` : ''}
              <span style="font-size: 7.5pt; font-family: monospace; font-weight: bold; margin-top: 2px;">${student.nisn}</span>
            </div>
            <table class="identity-table">
              <tr>
                <td class="label-col">Nama Siswa</td>
                <td style="width: 10px;">:</td>
                <td class="val-col" style="font-size: 10pt; text-transform: uppercase;">${student.name}</td>
                <td class="label-col">Kelas / Rombel</td>
                <td style="width: 10px;">:</td>
                <td class="val-col">${student.class}</td>
              </tr>
              <tr>
                <td class="label-col">NISN / ID</td>
                <td>:</td>
                <td class="val-col font-mono">${student.nisn}</td>
                <td class="label-col">Jenis Kelamin</td>
                <td>:</td>
                <td class="val-col">${student.gender === 'P' ? 'Perempuan (P)' : 'Laki-Laki (L)'}</td>
              </tr>
              <tr>
                <td class="label-col">Tahun Ajaran / Sem</td>
                <td>:</td>
                <td class="val-col">${currentTa}</td>
                <td class="label-col">Kontak / No. HP</td>
                <td>:</td>
                <td class="val-col">${student.phone || '-'}</td>
              </tr>
            </table>
          </div>

          <!-- 1. REKAPITULASI PRESENSI & KEHADIRAN -->
          <div class="section-header">
            <span>1. REKAPITULASI KEHADIRAN & DISIPLIN PRESENSI</span>
            <span style="font-size: 8pt; color: #D4AF37;">Persentase: ${attendanceStats.percentage}%</span>
          </div>

          <div class="stats-grid">
            <div class="stat-card" style="background: #F8F6F0; border-color: #0F3B2E;">
              <div class="stat-val" style="color: #0F3B2E;">${attendanceStats.totalHadir}</div>
              <div class="stat-lbl">Total Hadir</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #059669;">${attendanceStats.hadir}</div>
              <div class="stat-lbl">Hadir Tepat</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #d97706;">${attendanceStats.terlambat}</div>
              <div class="stat-lbl">Terlambat*</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #2563eb;">${attendanceStats.izin}</div>
              <div class="stat-lbl">Izin</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #7c3aed;">${attendanceStats.sakit}</div>
              <div class="stat-lbl">Sakit</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #dc2626;">${attendanceStats.alpa}</div>
              <div class="stat-lbl">Alpa</div>
            </div>
          </div>
          <div style="font-size: 7.5pt; color: #64748b; margin-top: 3px; margin-bottom: 8px; font-style: italic;">
            * Catatan: Siswa yang terlambat tetap diakumulasikan sebagai Hadir, dengan catatan kedisiplinan ketepatan waktu.
          </div>

          <!-- 2. CATATAN PENILAIAN HARIAN & KEMAJUAN BELAJAR -->
          <div class="section-header">
            <span>2. NILAI HARIAN & KEMAJUAN BELAJAR (${studentGrades?.mapel || 'Mata Pelajaran'})</span>
            <span style="font-size: 8pt; color: #D4AF37;">Predikat: ${gradeAnalytics.predikat}</span>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">UH 1</th>
                <th style="width: 40px; text-align: center;">UH 2</th>
                <th style="width: 40px; text-align: center;">UH 3</th>
                <th style="width: 40px; text-align: center;">UH 4</th>
                <th style="width: 40px; text-align: center;">UH 5</th>
                <th style="width: 40px; text-align: center;">UH 6</th>
                <th style="width: 50px; text-align: center;">Rata UH</th>
                <th style="width: 45px; text-align: center;">UTS</th>
                <th style="width: 45px; text-align: center;">UAS</th>
                <th style="width: 60px; text-align: center; background: #0F3B2E; color: #fff;">Nilai Akhir</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center; font-weight: bold;">${studentGrades?.grades?.uh1 || '-'}</td>
                <td style="text-align: center; font-weight: bold;">${studentGrades?.grades?.uh2 || '-'}</td>
                <td style="text-align: center; font-weight: bold;">${studentGrades?.grades?.uh3 || '-'}</td>
                <td style="text-align: center; font-weight: bold;">${studentGrades?.grades?.uh4 || '-'}</td>
                <td style="text-align: center; font-weight: bold;">${studentGrades?.grades?.uh5 || '-'}</td>
                <td style="text-align: center; font-weight: bold;">${studentGrades?.grades?.uh6 || '-'}</td>
                <td style="text-align: center; font-weight: 800; color: #0F3B2E;">${gradeAnalytics.avgUh ?? '-'}</td>
                <td style="text-align: center; font-weight: bold;">${studentGrades?.grades?.uts || '-'}</td>
                <td style="text-align: center; font-weight: bold;">${studentGrades?.grades?.uas || '-'}</td>
                <td style="text-align: center; font-weight: 900; font-size: 10pt; background: #f8fafc; color: #0F3B2E;">${gradeAnalytics.finalGrade ?? '-'}</td>
              </tr>
            </tbody>
          </table>

          <!-- 3. DESKRIPSI EVALUASI SIKAP & KARAKTER -->
          <div class="section-header">
            <span>3. DESKRIPSI EVALUASI SIKAP, KARAKTER & KEMAJUAN BELAJAR</span>
          </div>

          <div class="narrative-box">
            <div class="narrative-title">A. Sikap Kedisiplinan & Ketaatan Tata Tertib: [${attitudeAnalysis.disiplin}]</div>
            <div>${attitudeAnalysis.kedisiplinanDesc}</div>
          </div>

          <div class="narrative-box">
            <div class="narrative-title">B. Capaian Akademik & Kemajuan Belajar: [${gradeAnalytics.predikat}]</div>
            <div>${gradeAnalytics.catatanNilai}</div>
          </div>

          <div class="narrative-box">
            <div class="narrative-title">C. Sikap Sosial, Kerjasama & Perilaku: [${attitudeAnalysis.keaktifan}]</div>
            <div>${attitudeAnalysis.keaktifanDesc}</div>
          </div>

          ${customTeacherNote ? `
            <div class="narrative-box" style="border-left-color: #D4AF37; background: #fffcf0;">
              <div class="narrative-title" style="color: #92400e;">D. Catatan Khusus Guru / Wali Kelas:</div>
              <div>${customTeacherNote}</div>
            </div>
          ` : ''}

          <!-- TANDA TANGAN -->
          <div class="sig-container">
            <div class="sig-box">
              <div>Mengetahui,</div>
              <div>Kepala Sekolah</div>
              <div class="sig-space"></div>
              <div class="sig-name">${principalName}</div>
              <div class="sig-nip">${principalNip}</div>
            </div>

            <div class="sig-box">
              <div>${city}, ${printDateStr}</div>
              <div>Guru Pengampu / Wali Kelas</div>
              <div class="sig-space"></div>
              <div class="sig-name">${teacherName}</div>
              <div class="sig-nip">${teacherNip}</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          </script>
        </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=980,height=800');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printableHtml);
      printWin.document.close();
      printWin.focus();
    } else {
      window.print();
    }
  };

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-base shadow-inner tracking-tight">
              {getStudentInitials(student.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  REKAM JEJAK SISWA
                </span>
                <span className="text-xs text-slate-400 font-mono">NISN: {student.nisn}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                {student.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintDossier}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak Laporan Lengkap</span>
              <span className="sm:hidden">Cetak</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL TABS NAVIGATION */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-slate-950/60 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTabSub('ringkasan')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTabSub === 'ringkasan'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil & Barcode</span>
          </button>

          <button
            onClick={() => setActiveTabSub('presensi')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTabSub === 'presensi'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Presensi ({studentAttendance.length})</span>
          </button>

          <button
            onClick={() => setActiveTabSub('nilai')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTabSub === 'nilai'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Nilai Harian</span>
          </button>

          <button
            onClick={() => setActiveTabSub('sikap')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTabSub === 'sikap'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Catatan Sikap & Evaluasi</span>
          </button>
        </div>

        {/* MODAL BODY CONTENT (SCROLLABLE) */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">

          {/* TAB 1: RINGKASAN PROFIL & BARCODE */}
          {activeTabSub === 'ringkasan' && (
            <div className="space-y-4">
              
              {/* Profile Card & QR Barcode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Left: QR Barcode Card */}
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-300 shadow-lg flex items-center justify-center">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />
                    ) : (
                      <QrIcon className="w-8 h-8 text-slate-400 animate-pulse" />
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 mt-2.5">
                    NISN: {student.nisn}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Scan untuk presensi otomatis
                  </p>

                  <button
                    onClick={() => {
                      setSelectedStudentForCard(student);
                      setActiveTab('Kartu QR');
                      onClose();
                    }}
                    className="mt-3 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold py-1.5 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cetak Kartu Siswa (PVC/A4)</span>
                  </button>
                </div>

                {/* Right: Detailed Student Metadata */}
                <div className="md:col-span-2 bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>Data Pokok Siswa</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">NAMA LENGKAP</span>
                        <span className="font-bold text-white uppercase">{student.name}</span>
                      </div>

                      <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">KELAS / ROMBEL</span>
                        <span className="font-bold text-emerald-300">{student.class}</span>
                      </div>

                      <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">JENIS KELAMIN (JK)</span>
                        <span className="font-bold text-white">
                          {student.gender === 'P' ? 'Perempuan (P)' : 'Laki-Laki (L)'}
                        </span>
                      </div>

                      <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">TAHUN AJARAN</span>
                        <span className="font-bold text-emerald-400">{currentTa}</span>
                      </div>

                      <div className="col-span-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">NO. WHATSAPP / HP ORANG TUA</span>
                          <span className="font-mono font-bold text-slate-200">{student.phone || 'Belum diisi'}</span>
                        </div>
                        {student.phone && (
                          <a
                            href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Hubungi WA</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Summary Pill Banner */}
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-[10px] text-slate-400">Tingkat Kehadiran:</p>
                        <p className="text-xs font-bold text-emerald-300">
                          {attendanceStats.percentage}% ({attendanceStats.totalHadir} Hadir{attendanceStats.terlambat > 0 ? ` • ${attendanceStats.terlambat} Terlambat` : ''})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <p className="text-[10px] text-slate-400">Nilai Akhir:</p>
                        <p className="text-xs font-bold text-white">{gradeAnalytics.finalGrade ?? '-'} ({gradeAnalytics.predikat})</p>
                      </div>
                      <Award className="w-4 h-4 text-amber-400" />
                    </div>
                  </div>

                </div>

              </div>

              {/* Quick Assessment Synthesis */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Rangkuman Evaluasi Belajar & Sikap Siswa</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Otomatis Terintegrasi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400">Disiplin & Presensi</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        {attitudeAnalysis.disiplin}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {attitudeAnalysis.kedisiplinanDesc}
                    </p>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-400">Kemajuan Belajar</span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                        {gradeAnalytics.predikat}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {gradeAnalytics.catatanNilai}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DATA PRESENSI / KEHADIRAN */}
          {activeTabSub === 'presensi' && (
            <div className="space-y-4">
              
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                <div className="bg-slate-950/80 border border-emerald-500/30 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block">Total Hadir</span>
                  <span className="text-lg font-black text-white">{attendanceStats.totalHadir}</span>
                  <span className="text-[9px] text-emerald-400/80 block font-medium">Akumulasi</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-teal-400 font-bold uppercase block">Hadir Tepat</span>
                  <span className="text-lg font-black text-white">{attendanceStats.hadir}</span>
                  <span className="text-[9px] text-slate-500 block">Tepat Waktu</span>
                </div>
                <div className="bg-slate-950/80 border border-amber-500/30 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-amber-400 font-bold uppercase block">Terlambat</span>
                  <span className="text-lg font-black text-amber-400">{attendanceStats.terlambat}</span>
                  <span className="text-[9px] text-amber-400/80 block font-medium">Tetap Hadir</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-blue-400 font-bold uppercase block">Izin</span>
                  <span className="text-lg font-black text-blue-400">{attendanceStats.izin}</span>
                  <span className="text-[9px] text-slate-500 block">Surat Izin</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-purple-400 font-bold uppercase block">Sakit</span>
                  <span className="text-lg font-black text-purple-400">{attendanceStats.sakit}</span>
                  <span className="text-[9px] text-slate-500 block">Keterangan</span>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-rose-400 font-bold uppercase block">Alpa</span>
                  <span className="text-lg font-black text-rose-400">{attendanceStats.alpa}</span>
                  <span className="text-[9px] text-slate-500 block">Tanpa Ket</span>
                </div>
              </div>

              {/* Form Input / Edit Presensi Cepat Siswa Ini */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Input / Perbarui Presensi Siswa</span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full font-mono">
                    NISN: {student.nisn}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Status Kehadiran</label>
                    <select
                      value={quickStatus}
                      onChange={e => setQuickStatus(e.target.value as AttendanceStatus)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="Hadir">Hadir (Tepat Waktu)</option>
                      <option value="Terlambat">Terlambat</option>
                      <option value="Izin">Izin</option>
                      <option value="Sakit">Sakit</option>
                      <option value="Alpa">Alpa / Tanpa Keterangan</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={quickDate}
                      onChange={e => setQuickDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Waktu (Jam:Menit)</label>
                    <input
                      type="time"
                      value={quickTime}
                      onChange={e => setQuickTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Catatan / Alasan</label>
                    <input
                      type="text"
                      placeholder="Opsional (contoh: Surat dokter)"
                      value={quickNote}
                      onChange={e => setQuickNote(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    disabled={isMarkingAttendance}
                    onClick={() => {
                      setIsMarkingAttendance(true);
                      const res = markAttendanceByNisn(
                        student.nisn,
                        'Manual',
                        quickStatus,
                        quickNote.trim() || undefined,
                        quickTime,
                        quickDate,
                        true // allow overwrite
                      );
                      setTimeout(() => {
                        setIsMarkingAttendance(false);
                      }, 400);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isMarkingAttendance ? 'Menyimpan...' : 'Simpan Presensi Siswa'}</span>
                  </button>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Riwayat Kehadiran Siswa</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Total: {studentAttendance.length} catatan
                  </span>
                </div>

                {studentAttendance.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                    <p>Belum ada riwayat kehadiran tercatat untuk siswa ini.</p>
                    <p className="text-[11px] text-slate-600">Gunakan form di atas untuk menandai presensi atau lakukan scan kartu barcode siswa.</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase font-semibold border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="px-4 py-2.5">Tanggal</th>
                          <th className="px-4 py-2.5">Waktu</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5">Metode</th>
                          <th className="px-4 py-2.5">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {studentAttendance.map(item => {
                          const dateObj = formatIndonesianDayAndDate(item.date);
                          return (
                            <tr key={item.id} className="hover:bg-slate-900/60">
                              <td className="px-4 py-2 font-mono text-slate-200">
                                <span className="font-semibold text-white block">{dateObj.day}, {dateObj.formattedDate}</span>
                                <span className="text-[10px] text-slate-500">{item.date}</span>
                              </td>
                              <td className="px-4 py-2 font-mono text-slate-400">
                                {item.time || '-'}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.status === 'Hadir' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  item.status === 'Terlambat' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  item.status === 'Izin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                  item.status === 'Sakit' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-[11px] text-slate-400">
                                {item.method}
                              </td>
                              <td className="px-4 py-2 text-[11px] text-slate-400 italic">
                                {item.note || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: NILAI HARIAN */}
          {activeTabSub === 'nilai' && (
            <div className="space-y-4">
              
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Rekapitulasi Nilai Harian ({studentGrades?.mapel || settings.mataPelajaran || 'Mata Pelajaran'})</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Kelas {student.class} • Semester {activeAcademicYear?.semester || settings.semester || '1'} • Tahun Ajaran {activeAcademicYear?.name || settings.tahunAjaran || '2025/2026'}
                    </p>
                  </div>

                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto font-mono">
                    Nilai Akhir: {gradeAnalytics.finalGrade ?? '-'} ({gradeAnalytics.predikat})
                  </span>
                </div>

                {/* UH Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {[1, 2, 3, 4, 5, 6].map(num => {
                    const key = `uh${num}` as keyof DailyGradeItem;
                    const val = studentGrades?.grades?.[key] || '-';
                    const meta = studentGrades?.uhMeta?.[num];
                    return (
                      <div key={num} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">UH {num}</span>
                        <span className="text-base font-black text-white block my-0.5">{val}</span>
                        <span className="text-[9px] text-slate-500 truncate block" title={meta?.materi || 'Materi'}>
                          {meta?.materi || '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* UTS, UAS, & Final Grade Summary Table */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Rata-rata UH</span>
                      <span className="text-sm font-bold text-slate-200">Bobot 40%</span>
                    </div>
                    <span className="text-lg font-black text-emerald-400">{gradeAnalytics.avgUh ?? '-'}</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Nilai UTS</span>
                      <span className="text-sm font-bold text-slate-200">Bobot 30%</span>
                    </div>
                    <span className="text-lg font-black text-amber-400">{studentGrades?.grades?.uts || '-'}</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Nilai UAS</span>
                      <span className="text-sm font-bold text-slate-200">Bobot 30%</span>
                    </div>
                    <span className="text-lg font-black text-blue-400">{studentGrades?.grades?.uas || '-'}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Deskripsi Kemajuan Belajar:</span>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {gradeAnalytics.catatanNilai}
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: CATATAN SIKAP & EVALUASI KHUSUS */}
          {activeTabSub === 'sikap' && (
            <div className="space-y-4">
              
              {/* Automated Evaluation Cards */}
              <div className="space-y-3">
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Evaluasi Sikap Spiritual & Disiplin</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {attitudeAnalysis.disiplin}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {attitudeAnalysis.kedisiplinanDesc}
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <span>Evaluasi Sikap Sosial & Keaktifan Belajar</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {attitudeAnalysis.keaktifan}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {attitudeAnalysis.keaktifanDesc}
                  </p>
                </div>
              </div>

              {/* Custom Teacher Note Box (Editable & Persisted) */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Catatan Khusus Wali Kelas / Guru Pengampu</span>
                  </h4>
                  
                  {!isEditingNote ? (
                    <button
                      onClick={() => {
                        setTempNote(customTeacherNote);
                        setIsEditingNote(true);
                      }}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                    >
                      {customTeacherNote ? 'Edit Catatan' : '+ Tambah Catatan Khusus'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={saveCustomNote}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setIsEditingNote(false)}
                        className="bg-slate-800 text-slate-400 hover:text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>

                {isEditingNote ? (
                  <textarea
                    value={tempNote}
                    onChange={(e) => setTempNote(e.target.value)}
                    placeholder="Tuliskan catatan khusus perkembangan belajar, bimbingan konseling, atau pesan untuk orang tua siswa di sini..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                ) : (
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 min-h-[50px] flex items-center">
                    {customTeacherNote ? (
                      <p className="italic text-slate-200">"{customTeacherNote}"</p>
                    ) : (
                      <p className="text-slate-500 italic">Belum ada catatan manual. Klik "+ Tambah Catatan Khusus" untuk menambahkan catatan khusus pada siswa ini.</p>
                    )}
                  </div>
                )}
                
                <p className="text-[10px] text-slate-500">
                  * Catatan ini otomatis tercantum saat Anda mencetak <strong>Lembar Rekam Jejak Portofolio Siswa</strong>.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <span>Sistem Portofolio Digital • {settings.sekolah || 'Madrasah'}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrintDossier}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekam Jejak Siswa (PDF / Print)</span>
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
