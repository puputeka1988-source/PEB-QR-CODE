import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  GraduationCap, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  KeyRound, 
  AlertCircle, 
  ShieldCheck, 
  Fingerprint, 
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  QrCode as QrIcon,
  Search,
  Check
} from 'lucide-react';
import { authenticateBiometric, isBiometricAvailable } from '../utils/biometricAuth';

export const LoginView: React.FC = () => {
  const { login, verify2FA, cancel2FA, is2FAPending, settings, students, studentLogin } = useApp();

  // Role portal switcher: 'student' or 'admin'
  const [authRole, setAuthRole] = useState<'student' | 'admin'>('student');

  // Student Login states
  const [studentNisn, setStudentNisn] = useState('');
  const [studentPin, setStudentPin] = useState('');
  const [showStudentPin, setShowStudentPin] = useState(false);
  const [studentError, setStudentError] = useState('');
  const [studentLoading, setStudentLoading] = useState(false);
  const [showNisnHelper, setShowNisnHelper] = useState(false);
  const [isNisnHelperHidden, setIsNisnHelperHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('qr_hide_student_nisn_helper') === 'true';
    } catch {
      return false;
    }
  });
  const [showStudentForgotPinModal, setShowStudentForgotPinModal] = useState(false);
  const [helperSearch, setHelperSearch] = useState('');

  // Step 1 states (Username & Password) - Strictly Manual Input
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 2 states (PIN & Biometric 2FA) - Biometric Priority 1, PIN Priority 2
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [isBiometricPrompting, setIsBiometricPrompting] = useState(false);
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);
  const [biometricFailCount, setBiometricFailCount] = useState(0);
  const [biometricError, setBiometricError] = useState('');
  const [active2FAMethod, setActive2FAMethod] = useState<'biometric' | 'pin'>('biometric');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check biometric support on mount
  useEffect(() => {
    let mounted = true;
    isBiometricAvailable().then((supported) => {
      if (mounted) {
        setHasBiometricHardware(supported);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // When 2FA becomes pending, prioritize Biometric if enabled
  useEffect(() => {
    if (is2FAPending) {
      setPinDigits(['', '', '', '', '', '']);
      setPinError('');
      setBiometricError('');
      setBiometricFailCount(0);

      if (settings.biometricEnabled) {
        setActive2FAMethod('biometric');
        // Automatically prompt biometric scan as Priority 1
        setTimeout(() => {
          triggerBiometricAuth(0);
        }, 300);
      } else {
        setActive2FAMethod('pin');
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 150);
      }
    }
  }, [is2FAPending, settings.biometricEnabled]);

  // Focus PIN inputs when switching to PIN method
  useEffect(() => {
    if (is2FAPending && active2FAMethod === 'pin') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [active2FAMethod, is2FAPending]);

  // Student login submission
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    if (!studentNisn.trim()) {
      setStudentError('Harap masukkan Nomor Induk Siswa Nasional (NISN).');
      return;
    }

    setStudentLoading(true);
    setTimeout(() => {
      const res = studentLogin(studentNisn.trim(), studentPin.trim());
      if (!res.success) {
        setStudentError(res.message);
      }
      setStudentLoading(false);
    }, 250);
  };

  // Step 1: Submit username & password manually (Admin)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('Harap isi username dan password!');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const result = login(username, password);
      if (typeof result === 'boolean') {
        if (!result) {
          setErrorMsg('Username atau password yang Anda masukkan salah.');
        }
      } else if (result && result.requires2FA) {
        // Successfully passed Step 1, now in 2FA mode
        setErrorMsg('');
      }
      setLoading(false);
    }, 300);
  };

  // Step 2: Handle 6-digit PIN manual input
  const handlePinChange = (index: number, val: string) => {
    setPinError('');
    // Only allow single digit
    const cleaned = val.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const next = [...pinDigits];
      next[index] = '';
      setPinDigits(next);
      return;
    }

    const next = [...pinDigits];
    next[index] = cleaned[cleaned.length - 1];
    setPinDigits(next);

    // Auto focus next input
    if (index < 5 && cleaned) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete 6 digits entered
    const completePin = next.join('');
    if (completePin.length === 6 && !next.includes('')) {
      submitPin(completePin);
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const next = [...pinDigits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || '';
    }
    setPinDigits(next);

    if (pasted.length === 6) {
      submitPin(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const submitPin = (pinValue: string) => {
    setIsVerifyingPin(true);
    setTimeout(() => {
      const success = verify2FA(pinValue, false);
      if (!success) {
        setPinError('PIN Keamanan salah. Silakan masukkan PIN 6-digit yang sesuai.');
        setPinDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
      setIsVerifyingPin(false);
    }, 250);
  };

  // Step 2: Trigger WebAuthn Biometric verification
  const triggerBiometricAuth = async (currentFails = biometricFailCount) => {
    if (isBiometricPrompting) return;
    setIsBiometricPrompting(true);
    setBiometricError('');

    try {
      const result = await authenticateBiometric(settings.biometricCredentialId);
      if (result.success) {
        verify2FA(undefined, true);
      } else {
        const nextFailCount = currentFails + 1;
        setBiometricFailCount(nextFailCount);

        if (nextFailCount >= 2) {
          // Fallback to Priority 2: PIN
          setActive2FAMethod('pin');
          setPinError('Biometrik telah gagal 2 kali. Silakan masukkan 6-Digit PIN Keamanan Anda secara manual.');
        } else {
          setBiometricError(
            result.error && !result.error.includes('dibatalkan')
              ? `${result.error} (Percobaan ${nextFailCount}/2)`
              : `Verifikasi biometrik belum berhasil (Percobaan ${nextFailCount}/2). Silakan sentuh sensor lagi.`
          );
        }
      }
    } catch (err: any) {
      const nextFailCount = currentFails + 1;
      setBiometricFailCount(nextFailCount);
      if (nextFailCount >= 2) {
        setActive2FAMethod('pin');
        setPinError('Biometrik gagal 2 kali. Silakan masukkan 6-Digit PIN Keamanan Anda secara manual.');
      } else {
        setBiometricError(`Gagal membaca sensor biometrik (Percobaan ${nextFailCount}/2). Coba lagi.`);
      }
    } finally {
      setIsBiometricPrompting(false);
    }
  };

  const handleRetryBiometric = () => {
    triggerBiometricAuth(biometricFailCount);
  };

  const handleResetToBiometric = () => {
    setBiometricFailCount(0);
    setBiometricError('');
    setPinError('');
    setActive2FAMethod('biometric');
    setTimeout(() => {
      triggerBiometricAuth(0);
    }, 200);
  };

  // Filter students for helper modal
  const helperStudents = students.filter(s => 
    s.name.toLowerCase().includes(helperSearch.toLowerCase()) || 
    s.nisn.includes(helperSearch) ||
    s.class.toLowerCase().includes(helperSearch.toLowerCase())
  ).slice(0, 20);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-5">
        
        {/* Header Branding */}
        <div className="text-center space-y-2.5">
          {settings.logoUrl ? (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 p-2 shadow-2xl shadow-emerald-500/20 mb-1">
              <img src={settings.logoUrl} alt="Logo Sekolah" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-2xl shadow-emerald-500/30 mb-1">
              <GraduationCap className="w-8 h-8 stroke-[2.2]" />
            </div>
          )}
          <h1 className="text-2xl font-black italic tracking-tight text-white">QR-PRESENSI DIGITAL</h1>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{settings.sekolah || 'Sistem Presensi Sekolah'}</p>
        </div>

        {/* Portal Role Selector Tab */}
        {!is2FAPending && (
          <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-700/80 shadow-lg gap-1.5">
            <button
              type="button"
              onClick={() => {
                setAuthRole('student');
                setErrorMsg('');
                setStudentError('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authRole === 'student'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Portal Siswa</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthRole('admin');
                setErrorMsg('');
                setStudentError('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authRole === 'admin'
                  ? 'bg-slate-800 text-white shadow-md border border-slate-600'
                  : 'text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Guru / Admin</span>
            </button>
          </div>
        )}

        {/* Dynamic Card Container */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          {/* ================= PORTAL SISWA VIEW ================= */}
          {authRole === 'student' && !is2FAPending && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <QrIcon className="w-5 h-5 text-emerald-400" />
                  <span>Masuk Portal Siswa</span>
                </h2>
                <p className="text-xs text-slate-300 font-medium mt-1">
                  Akses kartu barcode presensi, riwayat kehadiran, jadwal & pengaturan profil Anda.
                </p>
              </div>

              {/* Student Error Box */}
              {studentError && (
                <div className="bg-rose-950 border border-rose-500/50 text-rose-200 text-xs p-3.5 rounded-2xl flex items-center gap-3 animate-in fade-in duration-200 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span className="font-bold">{studentError}</span>
                </div>
              )}

              <form onSubmit={handleStudentSubmit} className="space-y-4">
                {/* NISN Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      NISN Siswa:
                    </label>
                    {!isNisnHelperHidden && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowNisnHelper(true);
                          try {
                            localStorage.setItem('qr_hide_student_nisn_helper', 'true');
                            setIsNisnHelperHidden(true);
                          } catch (e) {}
                        }}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer underline underline-offset-2"
                      >
                        Lupa / Cari NISN?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={studentNisn}
                      onChange={(e) => {
                        setStudentNisn(e.target.value.replace(/[^0-9]/g, ''));
                        if (studentError) setStudentError('');
                      }}
                      placeholder="Masukkan 10 Digit NISN..."
                      className="w-full bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500 font-mono tracking-wider font-bold shadow-sm"
                    />
                  </div>
                </div>

                {/* PIN / Password Siswa (Opsional) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      PIN Akun Siswa:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowStudentForgotPinModal(true)}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer underline underline-offset-2"
                    >
                      Lupa PIN?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showStudentPin ? 'text' : 'password'}
                      value={studentPin}
                      onChange={(e) => {
                        setStudentPin(e.target.value);
                        if (studentError) setStudentError('');
                      }}
                      placeholder="Masukkan 6 Digit PIN atau kosongkan jika baru"
                      className="w-full bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm rounded-2xl pl-10 pr-11 py-3 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500 font-medium shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPin(!showStudentPin)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showStudentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-1.5">
                    Default PIN adalah 6 digit terakhir NISN Anda. Jika lupa PIN, hubungi Guru / Admin Sekolah.
                  </p>
                </div>

                {/* Submit Student Button */}
                <button
                  type="submit"
                  disabled={studentLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
                >
                  <QrIcon className="w-4 h-4 stroke-[2.5]" />
                  <span>{studentLoading ? 'Memeriksa Data Siswa...' : 'Buka Portal & Barcode Siswa'}</span>
                </button>
              </form>
            </div>
          )}

          {/* ================= ADMIN LOGIN VIEW ================= */}
          {authRole === 'admin' && !is2FAPending && (
            <>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  <span>Login Administrator / Guru</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Masukkan akun pengelola presensi dan guru mata pelajaran.
                </p>
              </div>

              {/* Error Alert Box */}
              {errorMsg && (
                <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-2xl flex items-center gap-3 animate-in fade-in duration-200">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Username Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Username Administrator:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Ketik username admin..."
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600 font-medium"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Ketik password admin..."
                      className="w-full bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm rounded-2xl pl-10 pr-11 py-3 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600 font-medium"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
                >
                  <Lock className="w-4 h-4 stroke-[2.5]" />
                  <span>{loading ? 'Memverifikasi Akun...' : 'Lanjutkan Masuk Guru'}</span>
                </button>
              </form>
            </>
          )}

          {/* VIEW MODE 2: TWO-FACTOR AUTHENTICATION (2FA) STEP 2 */}
          {is2FAPending && (
            <div className="space-y-6">
              
              {/* Back to Step 1 button */}
              <button
                type="button"
                onClick={cancel2FA}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Login</span>
              </button>

              {/* TAMPILAN PRIORITAS 1: SIDIK JARI / BIOMETRIK */}
              {active2FAMethod === 'biometric' && settings.biometricEnabled ? (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xl shadow-emerald-500/10 relative">
                      <Fingerprint className="w-10 h-10 animate-pulse stroke-[2]" />
                      <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                        Prioritas 1
                      </div>
                    </div>
                    <h2 className="text-lg font-black text-white">Sentuh Sensor Sidik Jari</h2>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Tempelkan jari Anda pada sensor biometrik perangkat HP atau laptop untuk melanjutkan.
                    </p>
                  </div>

                  {/* Biometric Error message */}
                  {biometricError && (
                    <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-2xl flex items-center gap-3 animate-in fade-in duration-200">
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      <span>{biometricError}</span>
                    </div>
                  )}

                  {/* Actions for Biometrics */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={handleRetryBiometric}
                      disabled={isBiometricPrompting}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Fingerprint className="w-4 h-4 stroke-[2.5]" />
                      <span>{isBiometricPrompting ? 'Menunggu Sensor...' : 'Pindai Sidik Jari Ulang'}</span>
                    </button>

                    {/* Switch to Priority 2: PIN */}
                    <button
                      type="button"
                      onClick={() => {
                        setActive2FAMethod('pin');
                        setPinError('');
                      }}
                      className="w-full bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold py-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pilihan Kedua: Gunakan 6-Digit PIN Keamanan</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* TAMPILAN PRIORITAS 2: 6-DIGIT PIN KEAMANAN */
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xl shadow-emerald-500/10">
                      <Lock className="w-8 h-8 stroke-[2.2]" />
                    </div>
                    <h2 className="text-lg font-black text-white">Masukkan PIN Keamanan</h2>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      {biometricFailCount >= 2 
                        ? 'Biometrik gagal 2 kali. Silakan masukkan 6-Digit PIN Keamanan Anda secara manual.' 
                        : 'Prioritas 2: Masukkan 6-Digit PIN Keamanan Administrator secara manual.'}
                    </p>
                  </div>

                  {/* Notification badge if failed 2x biometrics */}
                  {biometricFailCount >= 2 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs p-3 rounded-2xl flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Verifikasi biometrik telah mencapai batas (2x gagal). Dialihkan ke PIN Keamanan.</span>
                    </div>
                  )}

                  {/* PIN 6 Digits Keypad / Manual Input Box */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ketik 6-Digit PIN Keamanan:</span>
                      </label>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {pinDigits.filter(d => d !== '').length}/6
                      </span>
                    </div>

                    {/* 6 Digit Inputs */}
                    <div className="flex justify-between gap-2 sm:gap-2.5">
                      {pinDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handlePinChange(index, e.target.value)}
                          onKeyDown={(e) => handlePinKeyDown(index, e)}
                          onPaste={index === 0 ? handlePinPaste : undefined}
                          className={`w-11 sm:w-12 h-14 text-center font-mono text-xl font-black rounded-2xl bg-slate-950 border transition-all focus:outline-none ${
                            digit
                              ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                              : 'border-slate-800 text-white focus:border-emerald-500 focus:bg-slate-900'
                          }`}
                        />
                      ))}
                    </div>

                    {/* PIN Error message */}
                    {pinError && (
                      <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{pinError}</span>
                      </div>
                    )}

                    {/* PIN Verification Submit button */}
                    <button
                      type="button"
                      onClick={() => submitPin(pinDigits.join(''))}
                      disabled={isVerifyingPin || pinDigits.includes('')}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-black text-xs sm:text-sm py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>{isVerifyingPin ? 'Memverifikasi...' : 'Konfirmasi PIN & Masuk'}</span>
                    </button>

                    {/* Option to retry biometric if device has biometric enabled */}
                    {settings.biometricEnabled && (
                      <button
                        type="button"
                        onClick={handleResetToBiometric}
                        className="w-full text-slate-400 hover:text-emerald-400 text-xs font-semibold py-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Fingerprint className="w-3.5 h-3.5" />
                        <span>Kembali ke Verifikasi Sidik Jari (Prioritas 1)</span>
                      </button>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 font-medium">
          Sistem Presensi QR Terpadu &copy; {new Date().getFullYear()} &bull; Akses Terintegrasi Siswa & Guru
        </p>

      </div>

      {/* Helper Modal to search NISN for students */}
      {showNisnHelper && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <span>Cari NISN Berdasarkan Nama</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNisnHelper(false)}
                className="text-slate-200 hover:text-white text-xs font-bold px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={helperSearch}
                onChange={(e) => setHelperSearch(e.target.value)}
                placeholder="Ketik nama atau kelas siswa..."
                className="w-full bg-slate-950 border border-slate-700 text-xs rounded-xl px-3.5 py-2.5 text-white focus:border-emerald-500 outline-none"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 rounded-xl border border-slate-700 bg-slate-950">
              {helperStudents.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-300 font-medium">
                  Nama siswa tidak ditemukan.
                </div>
              ) : (
                helperStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setStudentNisn(s.nisn);
                      setShowNisnHelper(false);
                      try {
                        localStorage.setItem('qr_hide_student_nisn_helper', 'true');
                        setIsNisnHelperHidden(true);
                      } catch (e) {}
                    }}
                    className="w-full p-3 text-left hover:bg-slate-850 hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{s.name}</div>
                      <div className="text-[11px] text-slate-300 font-semibold">{s.class}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/50 shadow-sm">
                        {s.nisn}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Panduan Reset Lupa PIN Siswa */}
      {showStudentForgotPinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Informasi Reset PIN Siswa</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowStudentForgotPinModal(false)}
                className="text-slate-200 hover:text-white text-xs font-bold px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-200">
              <div className="bg-emerald-950 border border-emerald-500/40 p-4 rounded-2xl space-y-1 shadow-sm">
                <span className="font-bold text-emerald-300 block text-xs">PIN Default Siswa:</span>
                <p className="text-slate-200 text-xs font-medium">
                  PIN awal untuk login siswa adalah <strong className="text-white font-bold">6 digit terakhir NISN</strong> Anda.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-700 space-y-2">
                <span className="font-bold text-white block text-xs">Ketentuan Keamanan:</span>
                <p className="text-xs text-slate-200 font-medium">
                  Untuk menjaga integritas dan keamanan data akademik, permohonan reset PIN hanya dapat dilakukan langsung oleh <strong className="text-amber-300 font-bold">Guru Mata Pelajaran, Wali Kelas, atau Administrator Sekolah</strong> melalui aplikasi Web Presensi.
                </p>
                <p className="text-xs text-slate-300 font-medium">
                  Silakan temui atau hubungi guru Anda untuk mereset PIN akun Anda kembali ke default atau PIN baru.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStudentForgotPinModal(false)}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-md shadow-emerald-950/40"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
