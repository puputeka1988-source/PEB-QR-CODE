import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import QRCode from 'qrcode';
import { 
  QrCode as QrIcon, Sun, Download, ShieldCheck, 
  Sparkles, CheckCircle2, Clock, AlertTriangle, 
  Smartphone, User, RefreshCw, Maximize2, X, Eye
} from 'lucide-react';
import { cleanDateFormat, getCurrentTimeInTimezone } from '../../utils/formatters';

interface StudentQrCardTabProps {
  student: Student;
}

export const StudentQrCardTab: React.FC<StudentQrCardTabProps> = ({ student }) => {
  const { settings, attendance, today, showToast } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isMaxBrightness, setIsMaxBrightness] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Live Digital Clock in configured timezone
  useEffect(() => {
    const tz = settings.timezone || 'WIB';
    const updateTime = () => {
      setCurrentTime(getCurrentTimeInTimezone(tz, true));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [settings.timezone]);

  // Generate QR Code matching student NISN
  useEffect(() => {
    if (student.nisn) {
      QRCode.toDataURL(student.nisn, {
        width: 400,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#0F291E',
          light: '#FFFFFF'
        }
      }).then(url => {
        setQrDataUrl(url);
      }).catch(err => {
        console.error('Failed to generate student QR:', err);
      });
    }
  }, [student.nisn]);

  // Check student attendance status for today
  const todayRecord = attendance.find(
    a => (a.studentId === student.id || a.nisn === student.nisn) && cleanDateFormat(a.date) === cleanDateFormat(today)
  );

  // Helper to download digital student card as PNG
  const handleDownloadCard = async () => {
    if (!qrDataUrl) return;
    setIsDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Card dimensions: 600 x 950 px
      canvas.width = 600;
      canvas.height = 950;

      // Background Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 950);
      gradient.addColorStop(0, '#064e3b');
      gradient.addColorStop(0.3, '#042f2e');
      gradient.addColorStop(1, '#021815');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 600, 950);

      // Decorative Header Bar
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 0, 600, 12);

      // School Name Header
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((settings.instansiKabupaten || 'DINAS PENDIDIKAN DAN KEBUDAYAAN').toUpperCase(), 300, 50);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText((settings.sekolah || 'SMA NEGERI 1 KITA').toUpperCase(), 300, 85);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px sans-serif';
      ctx.fillText(settings.alamat || 'KARTU IDENTITAS & PRESENSI DIGITAL SISWA', 300, 110);

      // Divider line
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 130);
      ctx.lineTo(560, 130);
      ctx.stroke();

      // Card Title Badge
      ctx.fillStyle = '#065f46';
      ctx.roundRect(170, 150, 260, 36, 18);
      ctx.fill();
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('KARTU PRESENSI SISWA', 300, 174);

      // Draw QR Code in white container box
      ctx.fillStyle = '#ffffff';
      ctx.roundRect(140, 210, 320, 320, 16);
      ctx.fill();

      // Draw QR Code Image
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise((resolve) => {
        qrImg.onload = resolve;
      });
      ctx.drawImage(qrImg, 155, 225, 290, 290);

      // Student Info Box
      ctx.fillStyle = 'rgba(15, 41, 30, 0.8)';
      ctx.roundRect(40, 560, 520, 280, 16);
      ctx.fill();
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Student Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(student.name.toUpperCase(), 300, 610);

      // Class & NISN
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`KELAS: ${student.class}`, 300, 645);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`NISN: ${student.nisn}`, 300, 680);

      if (student.phone) {
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`No. HP: ${student.phone}`, 300, 715);
      }

      // Security Hash/Footer text
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('Tunjukkan barcode ini ke pemindai guru untuk mencatat presensi', 300, 765);
      ctx.fillText(`Tahun Ajaran: ${settings.tahunAjaran || '2025/2026'} | Terverifikasi Resmi`, 300, 790);

      // Bottom Footer Bar
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 890, 600, 60);
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('SISTEM PRESENSI QR DIGITAL RESMI SEKOLAH', 300, 925);

      // Export to PNG & download
      const dataUri = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Kartu_Presensi_${student.name.replace(/\s+/g, '_')}_${student.nisn}.png`;
      link.href = dataUri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast?.('Kartu presensi digital berhasil diunduh ke galeri perangkat Anda.', 'success');
    } catch (e) {
      console.error(e);
      showToast?.('Gagal mengunduh kartu presensi.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Today Attendance Status Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              todayRecord 
                ? (todayRecord.status === 'Hadir' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                   : todayRecord.status === 'Terlambat' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                   : 'bg-blue-500/20 text-blue-400 border border-blue-500/40')
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {todayRecord ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6 animate-pulse" />}
            </div>

            <div>
              <div className="text-xs text-slate-400 font-medium">Status Kehadiran Hari Ini ({today})</div>
              <div className="flex items-center gap-2 mt-0.5">
                {todayRecord ? (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    todayRecord.status === 'Hadir' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : todayRecord.status === 'Terlambat' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {todayRecord.status.toUpperCase()} ({todayRecord.time} {settings.timezone || 'WIB'})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Belum Melakukan Presensi
                  </span>
                )}
                <span className="text-xs text-slate-500 font-mono hidden xs:inline">• {currentTime} {settings.timezone || 'WIB'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaxBrightness(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <Sun className="w-4 h-4" />
              <span>Maksimalkan Barcode</span>
            </button>

            <button
              onClick={handleDownloadCard}
              disabled={isDownloading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Menyimpan...' : 'Unduh Kartu'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Digital ID Card Preview */}
      <div className="flex justify-center">
        <div 
          ref={cardRef}
          className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-emerald-800/40 bg-gradient-to-b from-emerald-950/80 via-slate-900 to-slate-950 text-white relative transition-transform"
        >
          {/* Card Top Accent Bar */}
          <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          {/* Card Header */}
          <div className="p-5 pb-3 text-center border-b border-emerald-900/30">
            <div className="flex items-center justify-center gap-2 mb-1">
              {settings.logoUrl || settings.logoKiriUrl ? (
                <img 
                  src={settings.logoUrl || settings.logoKiriUrl} 
                  alt="Logo" 
                  className="w-8 h-8 object-contain rounded-lg p-0.5 bg-white/10" 
                />
              ) : null}
              <div>
                <h3 className="text-xs font-bold tracking-wider uppercase text-emerald-300">
                  {settings.sekolah || 'SMA NEGERI 1 KITA'}
                </h3>
                <p className="text-[10px] text-slate-400">KARTU PRESENSI DIGITAL SISWA</p>
              </div>
            </div>
          </div>

          {/* Card Body - QR Code Section */}
          <div className="p-6 flex flex-col items-center">
            {/* High-Resolution QR Container */}
            <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-emerald-500/20 relative group">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt={`QR Code ${student.name}`} 
                  className="w-56 h-56 object-contain rounded-lg" 
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              )}

              {/* Tap to maximize hint */}
              <button
                onClick={() => setIsMaxBrightness(true)}
                className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center text-white text-xs font-semibold gap-1.5 cursor-pointer backdrop-blur-[2px]"
              >
                <Maximize2 className="w-6 h-6 text-emerald-400" />
                <span>Perbesar & Terangkan Layar</span>
              </button>
            </div>

            {/* Student Details */}
            <div className="mt-5 text-center space-y-1 w-full">
              <div className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {student.class}
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {student.name}
              </h2>
              <p className="text-xs font-mono font-medium text-slate-300">
                NISN: <span className="text-emerald-400 tracking-wider font-bold">{student.nisn}</span>
              </p>
              {student.gender && (
                <p className="text-[11px] text-slate-400">
                  Jenis Kelamin: {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </p>
              )}
            </div>
          </div>

          {/* Card Footer Bar */}
          <div className="p-4 bg-emerald-950/60 border-t border-emerald-900/40 text-center">
            <p className="text-[11px] text-emerald-300 font-medium">
              Arahkan layar HP ke kamera guru saat presensi
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
              Tahun Ajaran {settings.tahunAjaran || '2025/2026'}
            </p>
          </div>
        </div>
      </div>

      {/* Fullscreen High-Contrast QR Code Booster Modal */}
      {isMaxBrightness && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setIsMaxBrightness(false)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center mb-6 max-w-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 mb-2">
              <Sun className="w-3.5 h-3.5" /> Mode Kecerahan Tinggi
            </span>
            <h3 className="text-xl font-bold text-white">Tunjukkan ke Kamera Guru</h3>
            <p className="text-xs text-slate-400 mt-1">
              Layar dibuat kontras tinggi agar kamera pemindai guru dapat mendeteksi dengan instan.
            </p>
          </div>

          {/* Full-width Pure White QR Container */}
          <div className="p-6 bg-white rounded-3xl shadow-2xl border-4 border-white max-w-[320px] w-full flex flex-col items-center">
            {qrDataUrl && (
              <img 
                src={qrDataUrl} 
                alt="Barcode Siswa" 
                className="w-full aspect-square object-contain" 
              />
            )}
            <div className="mt-4 text-center">
              <div className="text-slate-900 font-bold text-base">{student.name}</div>
              <div className="text-slate-600 font-mono text-xs font-semibold tracking-wider">
                {student.class} • {student.nisn}
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsMaxBrightness(false)}
              className="px-6 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              Tutup Tampilan Penuh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
