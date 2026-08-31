import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useApp } from '../../context/AppContext';
import { 
  X, Camera, SwitchCamera, Maximize2, Minimize2, Volume2, VolumeX, 
  CheckCircle2, Clock, AlertCircle, Users, UserCheck, 
  TrendingUp, QrCode, Keyboard, Zap, RefreshCw, LogOut,
  Check, BellRing, Wifi, WifiOff, CloudUpload, Sun, Moon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getStudentInitials } from '../../utils/formatters';
import { audioFeedback } from '../../utils/audio';
import { AttendanceRecord, Student } from '../../types';

interface KioskModeProps {
  onClose: () => void;
}

export const KioskMode: React.FC<KioskModeProps> = ({ onClose }) => {
  const { 
    students, 
    attendance, 
    settings, 
    today, 
    markAttendanceByNisn, 
    activeAcademicYear,
    isOnline,
    offlineQueue,
    isQueueSyncing,
    setIsOfflineQueueModalOpen,
    effectiveTheme,
    updateSettings,
    showToast
  } = useApp();

  const isDark = effectiveTheme === 'dark';

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.enableSound !== false);
  const [voiceGreetingEnabled, setVoiceGreetingEnabled] = useState<boolean>(true);

  // Time & Live Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateLabel, setCurrentDateLabel] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours} : ${minutes} : ${seconds}`);

      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      
      const dayName = days[now.getDay()];
      const day = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      setCurrentDateLabel(`${dayName}, ${day} ${monthName} ${year}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fullscreen Handlers
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard shortcut: ESC to exit kiosk
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Camera Scanner States
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Cooldown / Jeda Pindai
  const cooldownDuration = 2.5; // 2.5 detik
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [isCooldownActive, setIsCooldownActive] = useState<boolean>(false);

  // USB Barcode Scanner & Manual Keypad
  const [usbInput, setUsbInput] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadInput, setKeypadInput] = useState('');
  const usbInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus USB scanner input periodically so physical barcode scanners work without click
  useEffect(() => {
    const focusUsb = () => {
      if (!showKeypad && usbInputRef.current) {
        usbInputRef.current.focus();
      }
    };
    focusUsb();
    const interval = setInterval(focusUsb, 2000);
    return () => clearInterval(interval);
  }, [showKeypad]);

  // Last Recognized Student Popup Card
  const [scanPopup, setScanPopup] = useState<{
    status: 'success' | 'warning' | 'error';
    student?: Student;
    record?: AttendanceRecord;
    title: string;
    message: string;
    isDuplicate?: boolean;
    greeting?: string;
    timestamp: string;
  } | null>(null);

  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearCooldownTimers = useCallback(() => {
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
  }, []);

  const stopCamera = async () => {
    if (html5QrcodeRef.current) {
      try {
        const state = html5QrcodeRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await html5QrcodeRef.current.stop();
        }
        await html5QrcodeRef.current.clear();
      } catch (e) {
        console.warn('Stop kiosk camera notice:', e);
      }
      html5QrcodeRef.current = null;
    }
  };

  const startCamera = async (cameraId?: string) => {
    setCameraError(null);
    await stopCamera();

    const element = document.getElementById('kiosk-qr-reader');
    if (!element) return;

    try {
      const html5Qrcode = new Html5Qrcode('kiosk-qr-reader');
      html5QrcodeRef.current = html5Qrcode;

      const targetCamera = cameraId 
        ? { deviceId: { exact: cameraId } } 
        : { facingMode: 'environment' };

      await html5Qrcode.start(
        targetCamera,
        {
          fps: 20,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            if (minEdge <= 50) return { width: 180, height: 180 };
            const size = Math.max(160, Math.floor(minEdge * 0.75));
            return { width: size, height: size };
          }
        },
        (decodedText) => {
          handleScanProcess(decodedText);
        },
        () => {
          // background scanning frame loop
        }
      );
      setIsScanning(true);

      // Refresh camera device list if not yet populated
      Html5Qrcode.getCameras()
        .then(devices => {
          if (devices && devices.length > 0) {
            const formatted = devices.map((dev, idx) => ({
              id: dev.id,
              label: dev.label || `Kamera ${idx + 1}`
            }));
            setCameras(formatted);
            if (!cameraId && formatted.length > 0) {
              const backCam = formatted.find(c => 
                c.label.toLowerCase().includes('back') || 
                c.label.toLowerCase().includes('belakang') || 
                c.label.toLowerCase().includes('environment')
              );
              setSelectedCameraId(backCam ? backCam.id : formatted[0].id);
            }
          }
        })
        .catch(() => {});
    } catch (err: any) {
      console.error('Kiosk camera start error:', err);
      setCameraError(err?.message || 'Gagal menyalakan kamera scanner.');
      setIsScanning(false);
    }
  };

  // Initialize Cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          const formatted = devices.map((dev, idx) => ({
            id: dev.id,
            label: dev.label || `Kamera ${idx + 1}`
          }));
          setCameras(formatted);
          // Prefer back camera if available
          const backCam = formatted.find(c => 
            c.label.toLowerCase().includes('back') || 
            c.label.toLowerCase().includes('belakang') || 
            c.label.toLowerCase().includes('environment')
          );
          const defaultCamId = backCam ? backCam.id : formatted[0].id;
          setSelectedCameraId(defaultCamId);
          startCamera(defaultCamId);
        } else {
          setCameraError('Tidak ada kamera terdeteksi di perangkat.');
        }
      })
      .catch(err => {
        console.warn('Gagal memuat daftar kamera kiosk:', err);
        // Fallback start with default facing mode
        startCamera();
      });

    return () => {
      clearCooldownTimers();
      stopCamera();
    };
  }, [clearCooldownTimers]);

  // Main Scan Processing Engine (Keeps camera continuous, zero pause)
  const handleScanProcess = (rawCode: string, force = false) => {
    const cleaned = rawCode.trim();
    if (!cleaned) return;

    const now = Date.now();

    if (!force) {
      if (isProcessingRef.current) return;
      if (cleaned === lastScannedCodeRef.current && (now - lastScannedTimeRef.current < cooldownDuration * 1000)) {
        return;
      }
    }

    // Activate Cooldown
    isProcessingRef.current = true;
    lastScannedCodeRef.current = cleaned;
    lastScannedTimeRef.current = now;

    setIsCooldownActive(true);
    setCooldownRemaining(cooldownDuration);

    clearCooldownTimers();

    const startTime = Date.now();
    cooldownIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const rem = Math.max(0, cooldownDuration - elapsed);
      setCooldownRemaining(Math.round(rem * 10) / 10);
    }, 100);

    cooldownTimeoutRef.current = setTimeout(() => {
      setIsCooldownActive(false);
      setCooldownRemaining(0);
      isProcessingRef.current = false;
      clearCooldownTimers();
    }, cooldownDuration * 1000);

    // Process attendance in context
    const result = markAttendanceByNisn(cleaned, 'QR Code');
    const matchedStudent = result.student || students.find(s => s.nisn === cleaned || s.id === cleaned);

    const nowTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (result.success) {
      const isLate = result.record?.status === 'Terlambat';
      const statusType = isLate ? 'warning' : 'success';
      const greetingMsg = isLate
        ? 'Tetap semangat! Jangan lupa perhatikan ketertiban jam masuk sekolah.'
        : 'Selamat pagi! Semangat belajar dan raih prestasi terbaik hari ini 🌟';

      setScanPopup({
        status: statusType,
        student: matchedStudent,
        record: result.record,
        title: isLate ? 'PRESENSI: TERLAMBAT' : 'PRESENSI: HADIR TEPAT WAKTU',
        message: result.message,
        isDuplicate: false,
        greeting: greetingMsg,
        timestamp: nowTimeStr
      });

      if (!isLate) {
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.6 },
            disableForReducedMotion: true,
            zIndex: 100
          });
        } catch {}
      }

      if (soundEnabled) {
        if (isLate) {
          audioFeedback.playWarning();
        } else {
          audioFeedback.playSuccess();
        }
      }

      if (voiceGreetingEnabled && matchedStudent) {
        const voiceText = isLate
          ? `${matchedStudent.name}, Anda tercatat terlambat.`
          : `Selamat datang, ${matchedStudent.name}! Presensi hadir Anda berhasil tercatat.`;
        audioFeedback.speak(voiceText);
      }
    } else if (result.isDuplicate) {
      setScanPopup({
        status: 'warning',
        student: matchedStudent,
        record: result.record,
        title: 'SUDAH TERCATAT HARI INI',
        message: result.message,
        isDuplicate: true,
        greeting: 'Presensi Anda untuk hari ini sudah tersimpan di sistem.',
        timestamp: nowTimeStr
      });

      if (soundEnabled) audioFeedback.playAlreadyScanned();
      if (voiceGreetingEnabled && matchedStudent) {
        audioFeedback.speak(`${matchedStudent.name}, Anda sudah melakukan presensi hari ini.`);
      }
    } else {
      setScanPopup({
        status: 'error',
        title: 'KARTU QR TIDAK DIKENAL',
        message: result.message,
        isDuplicate: false,
        greeting: 'Pastikan kartu QR siswa terdaftar di database sekolah.',
        timestamp: nowTimeStr
      });

      if (soundEnabled) audioFeedback.playError();
      if (voiceGreetingEnabled) {
        audioFeedback.speak('Maaf, kartu QR tidak dikenali.');
      }
    }

    // Auto-dismiss popup after 5 seconds
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    popupTimeoutRef.current = setTimeout(() => {
      setScanPopup(null);
    }, 5000);
  };

  // Handle USB Barcode scanner keystroke enter
  const handleUsbKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (usbInput.trim()) {
        handleScanProcess(usbInput.trim(), true);
        setUsbInput('');
      }
    }
  };

  // Handle Numeric Keypad Submit
  const handleKeypadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keypadInput.trim()) {
      handleScanProcess(keypadInput.trim(), true);
      setKeypadInput('');
      setShowKeypad(false);
    }
  };

  // Live Today's Attendance Analytics
  const todayLogs = useMemo(() => {
    return attendance.filter(a => a.date === today);
  }, [attendance, today]);

  const totalRegistered = students.length;
  const totalPresentToday = todayLogs.length;
  const onTimeCount = todayLogs.filter(a => a.status === 'Hadir').length;
  const lateCount = todayLogs.filter(a => a.status === 'Terlambat').length;
  const attendanceRate = totalRegistered > 0 ? Math.round((totalPresentToday / totalRegistered) * 100) : 0;

  // Recent 8 Scans
  const recentLogs = useMemo(() => {
    return [...todayLogs].slice(0, 8);
  }, [todayLogs]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col select-none overflow-hidden font-sans transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
      }`}
    >
      
      {/* Hidden input for external USB Barcode / RFID Gun Scanners */}
      <input
        ref={usbInputRef}
        type="text"
        value={usbInput}
        onChange={(e) => setUsbInput(e.target.value)}
        onKeyDown={handleUsbKeyDown}
        className="opacity-0 absolute top-0 left-0 h-0 w-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Lobby Bar (Adapts smoothly to Dark & Light theme) */}
      <header className={`px-6 py-3 flex items-center justify-between shrink-0 transition-colors ${
        isDark 
          ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg' 
          : 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm'
      }`}>
        
        {/* Left: School Identity & Kiosk Status */}
        <div className="flex items-center gap-4 min-w-0">
          {settings.logoUrl ? (
            <div className={`w-12 h-12 rounded-2xl border p-1 flex items-center justify-center shrink-0 shadow-sm ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black shrink-0 shadow-sm">
              <QrCode className="w-7 h-7" />
            </div>
          )}

          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className={`text-[11px] font-mono font-black tracking-wider uppercase ${
                isDark ? 'text-emerald-400' : 'text-emerald-700'
              }`}>
                KIOSK LOBI / GERBANG UTAMA
              </span>
              {activeAcademicYear && (
                <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full hidden sm:inline-block ${
                  isDark 
                    ? 'bg-purple-950/60 text-purple-300 border-purple-800/80' 
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  TA {activeAcademicYear.name} ({activeAcademicYear.semester})
                </span>
              )}
            </div>
            <h1 className={`text-base sm:text-xl font-extrabold tracking-tight truncate ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {settings.sekolah || 'MAN 2 SERAM BAGIAN TIMUR'}
            </h1>
          </div>
        </div>

        {/* Center: Giant Digital Clock */}
        <div className={`hidden md:flex flex-col items-center justify-center border px-7 py-1.5 rounded-2xl transition-colors ${
          isDark 
            ? 'bg-slate-800/90 border-slate-700/80 shadow-md' 
            : 'bg-white border-slate-200/90 shadow-sm'
        }`}>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-2xl lg:text-3xl font-black tracking-wider ${
              isDark ? 'text-white' : 'text-slate-800'
            }`}>
              {currentTime || '07 : 00 : 00'}
            </span>
            <span className={`text-[10px] font-bold font-mono ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {settings.timezone || 'WIT'}
            </span>
          </div>
          <span className={`text-[11px] font-medium ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {currentDateLabel}
          </span>
        </div>

        {/* Right: Kiosk Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Offline Queue / Network Status Button */}
          {(() => {
            const pendingCount = offlineQueue.filter(q => q.status === 'pending' || q.status === 'failed').length;
            return (
              <button
                type="button"
                onClick={() => setIsOfflineQueueModalOpen(true)}
                className={`p-2.5 sm:px-3 sm:py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm ${
                  !isOnline
                    ? isDark 
                      ? 'bg-amber-950/60 text-amber-300 border-amber-800 hover:bg-amber-900/60' 
                      : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                    : pendingCount > 0
                    ? isDark 
                      ? 'bg-orange-950/60 text-orange-300 border-orange-800 hover:bg-orange-900/60 animate-pulse' 
                      : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100 animate-pulse'
                    : isDark 
                      ? 'bg-slate-800/90 text-emerald-400 border-slate-700 hover:bg-slate-750' 
                      : 'bg-white text-emerald-700 border-slate-200 hover:bg-slate-50'
                }`}
                title={
                  !isOnline
                    ? `Mode Offline: ${pendingCount} presensi tersimpan lokal`
                    : pendingCount > 0
                    ? `${pendingCount} antrean presensi menunggu sinkronisasi`
                    : 'Online: Terhubung ke Cloud'
                }
              >
                {isQueueSyncing ? (
                  <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                ) : !isOnline ? (
                  <WifiOff className="w-4 h-4 text-amber-500" />
                ) : pendingCount > 0 ? (
                  <CloudUpload className="w-4 h-4 text-orange-500" />
                ) : (
                  <Wifi className="w-4 h-4 text-emerald-500" />
                )}
                <span className="hidden lg:inline">
                  {isQueueSyncing ? 'Sinkron...' : !isOnline ? 'Offline' : pendingCount > 0 ? `Antrean (${pendingCount})` : 'Online'}
                </span>
              </button>
            );
          })()}

          {/* Voice Greeting Toggle */}
          <button
            type="button"
            onClick={() => setVoiceGreetingEnabled(!voiceGreetingEnabled)}
            className={`p-2.5 sm:px-3 sm:py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm ${
              voiceGreetingEnabled
                ? isDark 
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : isDark 
                  ? 'bg-slate-800/90 text-slate-400 border-slate-700 hover:bg-slate-750' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Sapaan Suara Otomatis"
          >
            <BellRing className="w-4 h-4" />
            <span className="hidden lg:inline">{voiceGreetingEnabled ? 'Suara Aktif' : 'Suara Mati'}</span>
          </button>

          {/* Sound Effect Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
              isDark 
                ? 'bg-slate-800/90 border-slate-700 hover:bg-slate-750 text-slate-300' 
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            } ${soundEnabled ? 'text-emerald-500' : 'text-slate-400'}`}
            title="Efek Audio Beep"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Touch Keypad Toggle */}
          <button
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            className={`p-2.5 sm:px-3 sm:py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm ${
              showKeypad
                ? isDark 
                  ? 'bg-purple-950/60 text-purple-300 border-purple-800' 
                  : 'bg-purple-50 text-purple-700 border-purple-200'
                : isDark 
                  ? 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-750' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Keypad Input Manual NISN"
          >
            <Keyboard className="w-4 h-4" />
            <span className="hidden xl:inline">Keypad NISN</span>
          </button>

          {/* Theme Mode Toggle (Light/Dark Switch in Kiosk) */}
          <button
            type="button"
            onClick={() => {
              const nextMode = isDark ? 'light' : 'dark';
              updateSettings({ themeMode: nextMode });
              showToast?.(`Tema Kiosk & Web diubah ke Mode ${nextMode === 'light' ? 'Terang (Light)' : 'Gelap (Dark)'}`, 'info');
            }}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
              isDark 
                ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-amber-300' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-indigo-600'
            }`}
            title={isDark ? 'Ganti ke Mode Terang (Light)' : 'Ganti ke Mode Gelap (Dark)'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
              isDark 
                ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Fullscreen)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit Kiosk */}
          <button
            type="button"
            onClick={onClose}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-rose-600/20 cursor-pointer"
            title="Keluar dari Mode Kiosk"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar Kiosk</span>
          </button>
        </div>

      </header>

      {/* Main Kiosk Body (Split Stage) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden p-4 sm:p-6 gap-4 sm:gap-6">
        
        {/* Left Main Column: Live Camera Scanner & Recognition Display */}
        <div className={`flex-1 flex flex-col min-w-0 rounded-3xl border overflow-hidden relative transition-colors ${
          isDark 
            ? 'bg-slate-900 border-slate-800 shadow-xl' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          
          {/* Scanner Stage Top Status Header */}
          <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 transition-colors ${
            isDark 
              ? 'bg-slate-900 border-slate-800' 
              : 'bg-white border-slate-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                isDark 
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}>
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-xs font-black tracking-wide uppercase ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Pindai Kartu QR Siswa
                </h3>
                <p className={`text-[11px] ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Arahkan QR Code ke kamera atau tempelkan barcode ke scanner
                </p>
              </div>
            </div>

            {/* Camera Switcher & Cooldown Indicator */}
            <div className="flex items-center gap-2">
              {isCooldownActive && (
                <div className={`flex items-center gap-1.5 border px-3 py-1 rounded-full text-xs font-mono font-bold animate-pulse ${
                  isDark 
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Jeda {cooldownRemaining.toFixed(1)}s</span>
                </div>
              )}

              {cameras.length > 1 && (
                <select
                  value={selectedCameraId}
                  onChange={(e) => {
                    setSelectedCameraId(e.target.value);
                    startCamera(e.target.value);
                  }}
                  className={`text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[150px] truncate shadow-sm border ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-slate-200' 
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {cameras.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Live Scanner Viewport Stage */}
          <div className="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden min-h-[380px] lg:min-h-[500px] w-full">
            
            {/* HTML5 QR Container */}
            <div 
              id="kiosk-qr-reader" 
              className="w-full h-full min-h-full flex items-center justify-center relative z-0"
            />

            {/* Custom Focus Overlay matching user screenshot */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 p-4">
              
              {/* Outer Amber Frame */}
              <div className="w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] md:w-[440px] md:h-[440px] border-2 border-orange-500/80 rounded-3xl relative flex flex-col justify-between p-4 shadow-[0_0_60px_rgba(249,115,22,0.2)]">
                
                {/* Outer Orange Bracket Corners */}
                <div className="absolute -top-1.5 -left-1.5 w-10 h-10 border-t-4 border-l-4 border-orange-500 rounded-tl-2xl" />
                <div className="absolute -top-1.5 -right-1.5 w-10 h-10 border-t-4 border-r-4 border-orange-500 rounded-tr-2xl" />
                <div className="absolute -bottom-1.5 -left-1.5 w-10 h-10 border-b-4 border-l-4 border-orange-500 rounded-bl-2xl" />
                <div className="absolute -bottom-1.5 -right-1.5 w-10 h-10 border-b-4 border-r-4 border-orange-500 rounded-br-2xl" />

                {/* Inner White Target Focus Corners */}
                <div className="w-56 h-36 sm:w-64 sm:h-40 mx-auto my-auto relative border-0 flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-md shadow-md" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-md shadow-md" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-md shadow-md" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-md shadow-md" />
                  
                  {/* Glowing Laser Scan Beam */}
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#34d399] animate-bounce duration-1000 my-auto" />
                </div>

                {/* Bottom Pill Badge matching screenshot */}
                <div className="text-center mt-auto">
                  <span className="bg-white/95 text-teal-800 border border-teal-200/60 px-3.5 py-1 rounded-full text-[10px] font-mono font-black tracking-wider uppercase shadow-md inline-block">
                    AREA FOKUS QR
                  </span>
                </div>
              </div>
            </div>

            {/* Camera Error / Re-init Warning Message */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                <AlertCircle className="w-12 h-12 text-rose-500 animate-pulse" />
                <h4 className="text-base font-bold text-white">Kendala Akses Kamera</h4>
                <p className="text-xs text-slate-300 max-w-sm">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => startCamera(selectedCameraId)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Nyalakan Ulang Kamera</span>
                </button>
              </div>
            )}

            {/* Instant Student Recognition Popup Banner */}
            {scanPopup && (
              <div className="absolute inset-x-4 bottom-4 z-20 animate-in slide-in-from-bottom-6 duration-200">
                <div className={`p-5 rounded-3xl border shadow-2xl backdrop-blur-xl transition-all ${
                  scanPopup.status === 'success'
                    ? 'bg-slate-900/95 border-emerald-500/50 shadow-emerald-500/20 text-white'
                    : scanPopup.status === 'warning'
                    ? 'bg-slate-900/95 border-amber-500/50 shadow-amber-500/20 text-white'
                    : 'bg-slate-900/95 border-rose-500/50 shadow-rose-500/20 text-white'
                }`}>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    
                    {/* Student Photo / Avatar */}
                    {scanPopup.student ? (
                      <div className="relative shrink-0">
                        {scanPopup.student.photoUrl ? (
                          <img
                            src={scanPopup.student.photoUrl}
                            alt={scanPopup.student.name}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-400 shadow-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black text-2xl border-2 border-white/20 shadow-lg tracking-tight">
                            {getStudentInitials(scanPopup.student.name)}
                          </div>
                        )}
                        <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-xl ${
                          scanPopup.status === 'success' ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                        }`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                    )}

                    {/* Recognition Details */}
                    <div className="flex-1 text-center sm:text-left min-w-0 space-y-1">
                      
                      {/* Status Banner */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow ${
                          scanPopup.status === 'success'
                            ? 'bg-emerald-500 text-slate-950'
                            : scanPopup.status === 'warning'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-rose-500 text-white'
                        }`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          {scanPopup.title}
                        </span>

                        <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-800">
                          {scanPopup.timestamp}
                        </span>
                      </div>

                      {scanPopup.student ? (
                        <>
                          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate pt-0.5">
                            {scanPopup.student.name}
                          </h2>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-slate-300">
                            <span className="bg-slate-800 text-emerald-400 px-2.5 py-0.5 rounded-lg border border-slate-700">
                              Kelas: {scanPopup.student.class}
                            </span>
                            <span className="font-mono text-slate-400">
                              NISN: {scanPopup.student.nisn}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm font-bold text-slate-200">
                          {scanPopup.message}
                        </p>
                      )}

                      {scanPopup.greeting && (
                        <p className="text-xs text-slate-400 pt-1 italic">
                          "{scanPopup.greeting}"
                        </p>
                      )}
                    </div>

                    {/* Close notification button */}
                    <button
                      type="button"
                      onClick={() => setScanPopup(null)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 self-start cursor-pointer shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Touch Keypad Modal / Overlay for manual NISN input */}
          {showKeypad && (
            <div className={`absolute inset-0 z-30 flex flex-col p-6 overflow-y-auto animate-in fade-in duration-150 transition-colors ${
              isDark ? 'bg-slate-900/98 text-white' : 'bg-white/95 text-slate-900'
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 mb-4 ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Keyboard className="w-5 h-5 text-emerald-500" />
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Input Manual NISN Siswa
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeypad(false)}
                  className={`p-1.5 rounded-xl cursor-pointer ${
                    isDark 
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleKeypadSubmit} className="max-w-md w-full mx-auto space-y-4 my-auto">
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    value={keypadInput}
                    onChange={(e) => setKeypadInput(e.target.value)}
                    placeholder="Ketik NISN (contoh: 0081234567)"
                    className={`w-full border-2 font-mono text-xl sm:text-2xl text-center font-black rounded-2xl py-4 px-4 focus:outline-none focus:border-emerald-500 shadow-inner ${
                      isDark 
                        ? 'bg-slate-950 border-emerald-500/50 text-white placeholder-slate-600' 
                        : 'bg-slate-50 border-emerald-500/50 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  {keypadInput && (
                    <button
                      type="button"
                      onClick={() => setKeypadInput('')}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 ${
                        isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* On-screen number buttons for Touchscreens */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(btn => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => {
                        if (btn === 'C') setKeypadInput('');
                        else if (btn === '⌫') setKeypadInput(prev => prev.slice(0, -1));
                        else setKeypadInput(prev => prev + btn);
                      }}
                      className={`h-14 font-mono text-xl font-black rounded-2xl border transition-colors flex items-center justify-center cursor-pointer ${
                        isDark 
                          ? 'bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 active:text-white text-white border-slate-700 shadow-sm' 
                          : 'bg-white hover:bg-slate-50 active:bg-emerald-600 active:text-white text-slate-800 border-slate-200 shadow-sm'
                      }`}
                    >
                      {btn}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowKeypad(false)}
                    className={`flex-1 font-bold py-3.5 rounded-2xl text-sm cursor-pointer transition-colors ${
                      isDark 
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-2xl text-sm transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    Proses Presensi
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Right Column: Live Gate Analytics & Realtime Scan Activity Feed */}
        <div className="w-full lg:w-96 xl:w-[420px] flex flex-col gap-4 shrink-0 overflow-hidden">
          
          {/* Real-time 4 Counter Cards */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            
            {/* Total Siswa */}
            <div className={`border p-4 rounded-3xl space-y-1 transition-colors ${
              isDark 
                ? 'bg-slate-900 border-slate-800 shadow-md' 
                : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span className="text-xs font-bold uppercase tracking-wider">TOTAL SISWA</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {totalRegistered}
                </span>
                <span className={`text-[11px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Siswa
                </span>
              </div>
            </div>

            {/* Hadir Hari Ini */}
            <div className={`border p-4 rounded-3xl space-y-1 transition-colors ${
              isDark 
                ? 'bg-slate-900 border-slate-800 shadow-md' 
                : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span className="text-xs font-bold uppercase tracking-wider">HADIR HARI INI</span>
                <UserCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-500 font-mono">
                  {totalPresentToday}
                </span>
                <span className={`text-[11px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  / {totalRegistered}
                </span>
              </div>
            </div>

            {/* Tepat Waktu */}
            <div className={`border p-4 rounded-3xl space-y-1 transition-colors ${
              isDark 
                ? 'bg-slate-900 border-slate-800 shadow-md' 
                : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span className="text-xs font-bold uppercase tracking-wider">TEPAT WAKTU</span>
                <CheckCircle2 className="w-4 h-4 text-teal-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-teal-500 font-mono">
                  {onTimeCount}
                </span>
                <span className={`text-[11px] font-bold ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>
                  Siswa
                </span>
              </div>
            </div>

            {/* Terlambat */}
            <div className={`border p-4 rounded-3xl space-y-1 transition-colors ${
              isDark 
                ? 'bg-slate-900 border-slate-800 shadow-md' 
                : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span className="text-xs font-bold uppercase tracking-wider">TERLAMBAT</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-amber-500 font-mono">
                  {lateCount}
                </span>
                <span className={`text-[11px] font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  Siswa
                </span>
              </div>
            </div>

          </div>

          {/* Progress Bar Persentase Hadir */}
          <div className={`border p-4 rounded-3xl space-y-2 shrink-0 transition-colors ${
            isDark 
              ? 'bg-slate-900 border-slate-800 shadow-md' 
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Tingkat Kehadiran Hari Ini
              </span>
              <span className="text-emerald-500 font-mono font-black text-sm">
                {attendanceRate}%
              </span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden border p-0.5 ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, attendanceRate))}%` }}
              />
            </div>
          </div>

          {/* Live Activity Stream (Recent Scans Feed) */}
          <div className={`flex-1 rounded-3xl border p-4 flex flex-col min-h-0 overflow-hidden transition-colors ${
            isDark 
              ? 'bg-slate-900 border-slate-800 shadow-md' 
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 mb-3 shrink-0 ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <h3 className={`text-xs font-black uppercase tracking-wider ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Log Masuk Terkini
                </h3>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                isDark 
                  ? 'text-slate-400 bg-slate-800 border-slate-700' 
                  : 'text-slate-600 bg-slate-100 border-slate-200'
              }`}>
                {todayLogs.length} Scan
              </span>
            </div>

            {/* Scrollable Feed Items */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => {
                  const studentObj = students.find(s => s.nisn === log.nisn || s.id === log.studentId);
                  const isLate = log.status === 'Terlambat';
                  return (
                    <div
                      key={log.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all animate-in fade-in slide-in-from-right-4 duration-150 ${
                        isDark 
                          ? 'bg-slate-800/80 border-slate-700/70 hover:bg-slate-800' 
                          : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {studentObj?.photoUrl ? (
                          <img
                            src={studentObj.photoUrl}
                            alt={log.studentName}
                            className={`w-10 h-10 rounded-xl object-cover border shrink-0 ${
                              isDark ? 'border-slate-700' : 'border-slate-200'
                            }`}
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 tracking-tight ${
                            isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {getStudentInitials(log.studentName)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold truncate ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            {log.studentName}
                          </h4>
                          <div className={`flex items-center gap-2 text-[10px] ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            <span className={isDark ? 'text-slate-300 font-semibold' : 'text-slate-700 font-semibold'}>
                              {log.class}
                            </span>
                            <span>•</span>
                            <span className="font-mono">{log.time}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono whitespace-nowrap shrink-0 ${
                        isLate
                          ? isDark 
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/80' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                          : isDark 
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className={`h-full flex flex-col items-center justify-center text-center p-6 space-y-2 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <Clock className="w-8 h-8 opacity-50" />
                  <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Belum ada scan presensi hari ini
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Arahkan kartu QR siswa ke kamera untuk memulai presensi
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Information Bar */}
      <footer className={`border-t px-6 py-2 flex items-center justify-between shrink-0 text-xs shadow-sm transition-colors ${
        isDark 
          ? 'bg-slate-900 border-slate-800 text-slate-400' 
          : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full uppercase shrink-0 ${
            isDark 
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            INFO LOBI
          </span>
          <div className={`truncate text-[11px] font-medium ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Selamat Datang di <strong>{settings.sekolah}</strong> • Batas Masuk: <strong>{settings.jamMasuk}</strong> • Batas Terlambat: <strong>{settings.jamTerlambat}</strong> • Tertib, Disiplin & Berkarakter
          </div>
        </div>

        <div className={`hidden sm:flex items-center gap-3 shrink-0 text-[11px] font-mono ${
          isDark ? 'text-slate-500' : 'text-slate-500'
        }`}>
          <span>Tekan <strong>ESC</strong> untuk keluar</span>
        </div>
      </footer>

    </div>
  );
};
