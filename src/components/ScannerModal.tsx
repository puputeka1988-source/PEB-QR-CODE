import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useApp } from '../context/AppContext';
import { 
  X, Camera, SwitchCamera, Upload, Keyboard, CheckCircle2, AlertCircle, 
  Clock, Volume2, VolumeX, ShieldAlert, Zap, RefreshCw, Sparkles, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sortStudents } from '../utils/formatters';
import { audioFeedback } from '../utils/audio';

interface ScannerModalProps {
  onClose: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ onClose }) => {
  const { markAttendanceByNisn, students, settings } = useApp();
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [selectedClass, setSelectedClass] = useState('SEMUA');

  // Cooldown / Jeda Pindai settings (dalam detik)
  const [cooldownDuration, setCooldownDuration] = useState<number>(2.5);
  const [isCooldownActive, setIsCooldownActive] = useState<boolean>(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.enableSound !== false);

  const [lastScanResult, setLastScanResult] = useState<{
    status: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    studentName?: string;
    studentClass?: string;
    time?: string;
    nisn?: string;
    isDuplicate?: boolean;
  } | null>(null);

  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refs for bulletproof scan throttling & preventing rapid multi-triggers
  const isProcessingRef = useRef(false);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear cooldown timers
  const clearCooldownTimers = useCallback(() => {
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
  }, []);

  // Initialize camera list
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          const formatted = devices.map((dev, idx) => ({
            id: dev.id,
            label: dev.label || `Kamera ${idx + 1}`
          }));
          setCameras(formatted);
          setSelectedCameraId(formatted[0].id);
        } else {
          setCameraError('Tidak ada kamera yang terdeteksi di perangkat Anda.');
        }
      })
      .catch(err => {
        console.warn('Gagal memuat kamera:', err);
        setCameraError('Izin akses kamera ditolak atau tidak didukung.');
      });

    return () => {
      clearCooldownTimers();
      stopCamera();
    };
  }, [clearCooldownTimers]);

  const stopCamera = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
          await html5QrcodeRef.current.stop();
        }
      } catch (e) {
        console.warn('Stop camera warning:', e);
      }
    }
  };

  const startCamera = async (cameraId: string) => {
    setCameraError(null);
    await stopCamera();

    const element = document.getElementById('qr-reader-container');
    if (!element) return;

    try {
      const html5Qrcode = new Html5Qrcode('qr-reader-container');
      html5QrcodeRef.current = html5Qrcode;

      await html5Qrcode.start(
        cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Frame scanner loop - intentionally ignored to prevent console noise
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error('Start camera error:', err);
      setCameraError(err?.message || 'Gagal mengaktifkan kamera.');
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (activeMode === 'camera' && selectedCameraId) {
      startCamera(selectedCameraId);
    } else {
      stopCamera();
    }
  }, [activeMode, selectedCameraId]);

  /**
   * Main scan processor with debounce delay & duplicate protection
   */
  const handleScanSuccess = (rawCode: string, forceOverwrite = false) => {
    const cleaned = rawCode.trim();
    if (!cleaned) return;

    const now = Date.now();

    // 1. CEK STATUS COOLDOWN / JEDA
    // Jika masih dalam jeda dan bukan override paksa -> TOLAK/ABAIKAN frame kamera ini
    if (!forceOverwrite) {
      if (isProcessingRef.current) {
        return;
      }
      // Proteksi ganda: cegah kode yang persis sama terpicu berulang dalam jeda waktu
      if (cleaned === lastScannedCodeRef.current && (now - lastScannedTimeRef.current < cooldownDuration * 1000)) {
        return;
      }
    }

    // 2. KUNCI SCANNER (AKTIFKAN COOLDOWN)
    isProcessingRef.current = true;
    lastScannedCodeRef.current = cleaned;
    lastScannedTimeRef.current = now;
    setIsCooldownActive(true);
    setCooldownRemaining(cooldownDuration);

    // Mulai countdown visual timer
    clearCooldownTimers();
    const intervalSteps = 10;
    const intervalMs = 100;
    let remaining = cooldownDuration;

    cooldownIntervalRef.current = setInterval(() => {
      remaining = Math.max(0, remaining - (intervalMs / 1000));
      setCooldownRemaining(Number(remaining.toFixed(1)));
    }, intervalMs);

    cooldownTimeoutRef.current = setTimeout(() => {
      isProcessingRef.current = false;
      setIsCooldownActive(false);
      setCooldownRemaining(0);
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    }, cooldownDuration * 1000);

    // 3. PROSES PRESENSI MELALUI APP CONTEXT
    const res = markAttendanceByNisn(cleaned, 'QR Code', undefined, undefined, undefined, undefined, forceOverwrite);

    // 4. FEEDBACK HASIL & SUARA YANG BERBEDA
    if (res.success && res.student) {
      // KASUS 1: BERHASIL BARU (Belum pernah presensi hari ini)
      if (soundEnabled) {
        audioFeedback.playSuccess(); // Melodi ceria naik (E5-B5-E6)
      }

      setLastScanResult({
        status: res.record?.status === 'Terlambat' ? 'warning' : 'success',
        title: `Presensi Berhasil: ${res.student.name}`,
        message: `Kelas ${res.student.class} • ${res.record?.status?.toUpperCase()} • Jam ${res.record?.time}`,
        studentName: res.student.name,
        studentClass: res.student.class,
        time: res.record?.time,
        nisn: res.student.nisn,
        isDuplicate: false
      });

      try {
        confetti({
          particleCount: 45,
          spread: 65,
          origin: { y: 0.65 }
        });
      } catch (e) {}

    } else if (res.isDuplicate && res.student) {
      // KASUS 2: SUDAH PRESENSI (Peringatan Scan Kedua/Duplikat)
      if (soundEnabled) {
        audioFeedback.playAlreadyScanned(); // Nada peringatan 2 ketukan khas (F#5-D5)
      }

      setLastScanResult({
        status: 'warning',
        title: `⚠️ Siswa Sudah Melakukan Presensi Hari Ini!`,
        message: `${res.student.name} (${res.student.class}) telah tercatat presensi sebelumnya pada pukul ${res.record?.time || '-'} dengan status ${res.record?.status || 'Hadir'}.`,
        studentName: res.student.name,
        studentClass: res.student.class,
        time: res.record?.time,
        nisn: res.student.nisn,
        isDuplicate: true
      });

    } else {
      // KASUS 3: GAGAL / QR CODE TIDAK DIKENAL
      if (soundEnabled) {
        audioFeedback.playError(); // Buzzer nada rendah peringatan
      }

      setLastScanResult({
        status: 'error',
        title: `❌ Barcode / QR Tidak Dikenal`,
        message: `Kode "${cleaned}" tidak ditemukan dalam database siswa aktif.`
      });
    }

    // Auto-clear result card after 6 seconds jika tidak ada scan baru
    setTimeout(() => {
      setLastScanResult(prev => (prev?.nisn === cleaned || prev?.title.includes(cleaned) ? null : prev));
    }, 6000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5Qrcode = new Html5Qrcode('qr-reader-container-file');
      const result = await html5Qrcode.scanFile(file, true);
      handleScanSuccess(result, false);
      html5Qrcode.clear();
    } catch (err) {
      if (soundEnabled) {
        audioFeedback.playError();
      }
      setLastScanResult({
        status: 'error',
        title: 'QR Code Tidak Terbaca',
        message: 'Gambar tidak berisi Barcode / QR Code yang valid.'
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleScanSuccess(manualInput.trim(), false);
    setManualInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Pemindai QR & Barcode Presensi</h3>
              <p className="text-xs text-slate-400">Pindai QR Siswa dengan proteksi jeda & anti-duplikat</p>
            </div>
          </div>

          <button
            onClick={() => {
              clearCooldownTimers();
              stopCamera();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-1.5">
          <button
            onClick={() => setActiveMode('camera')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'camera'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Camera className="w-4 h-4" />
            Kamera Live
          </button>

          <button
            onClick={() => setActiveMode('upload')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'upload'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Upload className="w-4 h-4" />
            Unggah Gambar
          </button>

          <button
            onClick={() => setActiveMode('manual')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'manual'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            Ketik NISN
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* CAMERA MODE */}
          {activeMode === 'camera' && (
            <div className="space-y-3">
              {/* Kamera & Jeda Settings Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> Jeda Scan:
                  </span>
                  <select
                    value={cooldownDuration}
                    onChange={(e) => setCooldownDuration(Number(e.target.value))}
                    className="bg-slate-900 text-emerald-300 font-semibold border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value={1.5}>1.5 Detik (Cepat)</option>
                    <option value={2.5}>2.5 Detik (Ideal / Standar)</option>
                    <option value={3.5}>3.5 Detik (Santai)</option>
                    <option value={5.0}>5.0 Detik (Aman)</option>
                  </select>
                </div>

                {cameras.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <SwitchCamera className="w-3.5 h-3.5 text-emerald-400" />
                    <select
                      value={selectedCameraId}
                      onChange={(e) => setSelectedCameraId(e.target.value)}
                      className="bg-slate-900 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-500 max-w-[140px] truncate"
                    >
                      {cameras.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Viewfinder Container */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 min-h-[260px] flex items-center justify-center shadow-inner">
                <div id="qr-reader-container" className="w-full h-full"></div>
                
                {/* COOLDOWN / JEDA OVERLAY */}
                {isCooldownActive && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 animate-in fade-in duration-150 p-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-2 animate-pulse">
                      <Check className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-white">Scan Berhasil Diproses!</p>
                    <p className="text-xs text-emerald-400 mt-0.5 font-medium">
                      Menunggu giliran siswa berikutnya ({cooldownRemaining}s)...
                    </p>
                    
                    {/* Animated Progress Bar */}
                    <div className="w-48 bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-700">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-100"
                        style={{ width: `${Math.min(100, (cooldownRemaining / cooldownDuration) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="p-6 text-center text-rose-400 text-xs space-y-2 z-10">
                    <AlertCircle className="w-8 h-8 mx-auto opacity-80" />
                    <p className="font-semibold">{cameraError}</p>
                    <p className="text-slate-500">Pastikan Anda telah memberikan izin kamera pada peramban web ini.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* UPLOAD MODE */}
          {activeMode === 'upload' && (
            <div className="space-y-4 text-center py-6">
              <div id="qr-reader-container-file" className="hidden"></div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/40 hover:bg-slate-900/60 p-8 rounded-3xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Klik untuk memilih file foto QR Code</p>
                  <p className="text-xs text-slate-400 mt-1">Mendukung format gambar JPG, PNG, atau WEBP</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* MANUAL MODE */}
          {activeMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Masukkan NISN atau ID Siswa secara manual:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Contoh: 0051234001"
                    className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-2xl text-sm transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    Proses
                  </button>
                </div>
              </div>

              {/* Quick Select Student List */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-300">Pilih Cepat Siswa:</p>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-white text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                  >
                    <option value="SEMUA">Semua Kelas</option>
                    {Array.from(new Set(students.map(s => s.class))).sort((a: string, b: string) => (a || '').localeCompare(b || '', 'id', { numeric: true })).map(cls => (
                      <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                  </select>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {sortStudents(students.filter(s => selectedClass === 'SEMUA' || s.class === selectedClass)).slice(0, 15).map(s => (
                    <div
                      key={s.id}
                      onClick={() => handleScanSuccess(s.nisn, false)}
                      className="p-2.5 bg-slate-950/60 hover:bg-slate-800 rounded-xl border border-slate-800/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="font-medium text-slate-200">{s.name} ({s.class})</span>
                      <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                        {s.nisn}
                      </span>
                    </div>
                  ))}
                  {students.filter(s => selectedClass === 'SEMUA' || s.class === selectedClass).length === 0 && (
                    <p className="text-xs text-slate-500 italic text-center py-2">Tidak ada siswa di kelas ini.</p>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* DYNAMIC SCAN RESULT BANNER */}
          {lastScanResult && (
            <div
              className={`p-4 rounded-2xl border flex flex-col gap-2.5 animate-in slide-in-from-bottom-2 duration-200 ${
                lastScanResult.status === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : lastScanResult.status === 'warning'
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-200 shadow-lg shadow-amber-950/30'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {lastScanResult.status === 'success' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
                {lastScanResult.status === 'warning' && (
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 animate-bounce">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                )}
                {lastScanResult.status === 'error' && (
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-snug">{lastScanResult.title}</p>
                  <p className="text-xs opacity-95 mt-1 leading-relaxed">{lastScanResult.message}</p>
                </div>

                {lastScanResult.time && (
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 shrink-0 font-bold">
                    {lastScanResult.time}
                  </span>
                )}
              </div>

              {/* Action Button for Duplicates: Allow teacher to force-update if desired */}
              {lastScanResult.isDuplicate && lastScanResult.nisn && (
                <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-amber-300/80">Ingin memperbarui jam atau status?</span>
                  <button
                    onClick={() => {
                      if (lastScanResult.nisn) {
                        handleScanSuccess(lastScanResult.nisn, true);
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Tetap Perbarui Sekarang
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer with Audio Toggle & Close */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-800/60 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
            title="Klik untuk menyalakan/mematikan suara beep dan notifikasi"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Suara Audio Aktif' : 'Suara Dimatikan'}</span>
          </button>

          <button
            onClick={() => {
              clearCooldownTimers();
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white font-semibold px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            Tutup Pemindai
          </button>
        </div>

      </div>
    </div>
  );
};

