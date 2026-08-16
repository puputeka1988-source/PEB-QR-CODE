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
  Sparkles
} from 'lucide-react';
import { authenticateBiometric, isBiometricAvailable } from '../utils/biometricAuth';

export const LoginView: React.FC = () => {
  const { login, verify2FA, cancel2FA, is2FAPending, settings } = useApp();

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

  // Step 1: Submit username & password manually
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          {settings.logoUrl ? (
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 p-2 shadow-2xl shadow-emerald-500/20 mb-1">
              <img src={settings.logoUrl} alt="Logo Sekolah" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-2xl shadow-emerald-500/30 mb-1">
              <GraduationCap className="w-9 h-9 stroke-[2.2]" />
            </div>
          )}
          <h1 className="text-2xl font-black italic tracking-tight text-white">QR-PRESENSI</h1>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{settings.sekolah}</p>
          {settings.mataPelajaran && (
            <p className="text-[11px] font-semibold text-slate-400">Pengampu: {settings.mataPelajaran}</p>
          )}
        </div>

        {/* Dynamic Card Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          {/* VIEW MODE 1: USERNAME & PASSWORD (MANUAL INPUT) */}
          {!is2FAPending ? (
            <>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  Login Administrator
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Silakan masukkan username dan password administrator secara manual.
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
                  <span>{loading ? 'Memverifikasi Akun...' : 'Lanjutkan Masuk'}</span>
                </button>

              </form>
            </>
          ) : (
            /* VIEW MODE 2: STEP 2 VERIFICATION (PRIORITY 1: BIOMETRIC, PRIORITY 2: PIN) */
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={cancel2FA}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer py-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Login</span>
                </button>
                
                <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {active2FAMethod === 'biometric' ? 'Prioritas 1: Biometrik' : 'Prioritas 2: PIN 6-Digit'}
                </span>
              </div>

              {/* TAMPILAN PRIORITAS 1: BIOMETRIK / SIDIK JARI */}
              {active2FAMethod === 'biometric' && settings.biometricEnabled ? (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="text-center space-y-2">
                    <div className="relative inline-flex items-center justify-center">
                      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${
                        isBiometricPrompting 
                          ? 'bg-emerald-500 text-slate-950 shadow-2xl shadow-emerald-500/50 scale-105 animate-pulse' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xl shadow-emerald-500/10'
                      }`}>
                        <Fingerprint className="w-10 h-10 stroke-[2.2]" />
                      </div>
                      {isBiometricPrompting && (
                        <div className="absolute inset-0 rounded-3xl border-2 border-emerald-400 animate-ping opacity-25 pointer-events-none" />
                      )}
                    </div>
                    
                    <h2 className="text-lg font-black text-white">
                      {isBiometricPrompting ? 'Menunggu Sensor Biometrik...' : 'Sentuh Sensor Sidik Jari'}
                    </h2>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Prioritas 1: Tempelkan sidik jari atau gunakan kunci layar perangkat Anda untuk menyelesaikan login.
                    </p>
                  </div>

                  {/* Device Info Badge */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{settings.biometricDeviceName || 'Sensor Biometrik Terdaftar'}</p>
                        <p className="text-[11px] text-slate-500">Status: Siap diverifikasi</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        biometricFailCount > 0 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        Gagal: {biometricFailCount}/2
                      </span>
                    </div>
                  </div>

                  {/* Biometric Error Alert */}
                  {biometricError && (
                    <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium">{biometricError}</p>
                        <p className="text-[11px] text-rose-400/80">
                          {biometricFailCount < 2 
                            ? 'Jika gagal 2 kali, sistem akan mengalihkan ke input 6-Digit PIN Keamanan.' 
                            : 'Beralih ke input PIN Keamanan...'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons for Biometric */}
                  <div className="space-y-3 pt-1">
                    <button
                      type="button"
                      onClick={handleRetryBiometric}
                      disabled={isBiometricPrompting}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-60 text-slate-950 font-black text-sm py-3.5 rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Fingerprint className="w-4 h-4 stroke-[2.5]" />
                      <span>{isBiometricPrompting ? 'Memindai Sensor...' : 'Pindai Sidik Jari Sekarang'}</span>
                    </button>

                    {/* Manual Fallback Option */}
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
          QR-Presensi Digital &copy; {new Date().getFullYear()} &bull; Keamanan 2 Langkah Terverifikasi
        </p>

      </div>
    </div>
  );
};

