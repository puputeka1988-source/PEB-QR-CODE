import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useApp } from '../context/AppContext';
import { X, Camera, SwitchCamera, Upload, Keyboard, CheckCircle2, AlertCircle, Clock, Volume2, Filter } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sortStudents } from '../utils/formatters';

interface ScannerModalProps {
  onClose: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ onClose }) => {
  const { markAttendanceByNisn, students } = useApp();
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [selectedClass, setSelectedClass] = useState('SEMUA');
  const [lastScanResult, setLastScanResult] = useState<{
    status: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    time?: string;
  } | null>(null);

  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      stopCamera();
    };
  }, []);

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
          // Ignore frequent scan errors during frame checks
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

  const handleScanSuccess = (rawCode: string) => {
    const cleaned = rawCode.trim();
    if (!cleaned) return;

    const res = markAttendanceByNisn(cleaned, 'QR Code');

    if (res.success && res.student) {
      setLastScanResult({
        status: res.record?.status === 'Terlambat' ? 'warning' : 'success',
        title: `Absen Berhasil: ${res.student.name}`,
        message: `${res.student.class} | Status: ${res.record?.status}`,
        time: res.record?.time
      });

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {}

    } else if (res.student) {
      // Duplicate scan
      setLastScanResult({
        status: 'warning',
        title: 'Sudah Absen',
        message: res.message,
        time: res.record?.time
      });
    } else {
      // Not found
      setLastScanResult({
        status: 'error',
        title: 'QR Code Tidak Dikenal',
        message: `Kode "${cleaned}" tidak terdaftar dalam sistem.`
      });
    }

    // Clear result card after 4 seconds
    setTimeout(() => {
      setLastScanResult(prev => (prev?.title.includes(cleaned) || prev?.title.includes(res.student?.name || '') ? null : prev));
    }, 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5Qrcode = new Html5Qrcode('qr-reader-container-file');
      const result = await html5Qrcode.scanFile(file, true);
      handleScanSuccess(result);
      html5Qrcode.clear();
    } catch (err) {
      setLastScanResult({
        status: 'error',
        title: 'QR Code Tidak Terbaca',
        message: 'Gambar tidak berisi QR Code yang valid.'
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleScanSuccess(manualInput.trim());
    setManualInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Pemindai QR Code Presensi</h3>
              <p className="text-xs text-slate-400">Arahkan QR Code Kartu Siswa ke kamera</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-2 gap-1">
          <button
            onClick={() => setActiveMode('camera')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
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
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeMode === 'upload'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Upload className="w-4 h-4" />
            Unggah File
          </button>

          <button
            onClick={() => setActiveMode('manual')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
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
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          
          {/* CAMERA MODE */}
          {activeMode === 'camera' && (
            <div className="space-y-4">
              {cameras.length > 1 && (
                <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <SwitchCamera className="w-4 h-4 text-emerald-400" /> Pilih Kamera:
                  </span>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="bg-slate-900 text-white border border-slate-700 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {cameras.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 min-h-[280px] flex items-center justify-center">
                <div id="qr-reader-container" className="w-full h-full"></div>
                
                {cameraError && (
                  <div className="p-6 text-center text-rose-400 text-xs space-y-2">
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
                  <p className="text-sm font-semibold text-white">Klik untuk memilih gambar QR Code</p>
                  <p className="text-xs text-slate-400 mt-1">Format gambar JPG, PNG, atau WEBP</p>
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
            <form onSubmit={handleManualSubmit} className="space-y-4 py-4">
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
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-2xl text-sm transition-colors"
                  >
                    Proses
                  </button>
                </div>
              </div>

              {/* Quick Select Student List */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-300">Pilih Cepat Siswa:</p>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-white text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500 font-medium"
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
                      onClick={() => handleScanSuccess(s.nisn)}
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

          {/* SCAN RESULT BANNER */}
          {lastScanResult && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-200 ${
                lastScanResult.status === 'success'
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                  : lastScanResult.status === 'warning'
                  ? 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                  : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
              }`}
            >
              {lastScanResult.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {lastScanResult.status === 'warning' && <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
              {lastScanResult.status === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{lastScanResult.title}</p>
                <p className="text-xs opacity-90 mt-0.5">{lastScanResult.message}</p>
              </div>

              {lastScanResult.time && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/30 shrink-0">
                  {lastScanResult.time}
                </span>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            Audio Beep Aktif
          </span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white font-medium"
          >
            Tutup Pemindai
          </button>
        </div>

      </div>
    </div>
  );
};
