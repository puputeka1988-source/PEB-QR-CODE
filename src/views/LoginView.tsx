import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GraduationCap, Lock, User, Eye, EyeOff, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, settings } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('Harap isi username dan password!');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const success = login(username, password);
      if (!success) {
        setErrorMsg('Username atau password yang Anda masukkan salah.');
      }
      setLoading(false);
    }, 300);
  };

  const handleFillDefault = () => {
    setUsername(settings.adminUsername || 'admin');
    setPassword(settings.adminPassword || 'admin123');
    setErrorMsg('');
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

        {/* Login Card Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              Login Administrator
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Silakan masukkan username dan password secara manual untuk mengakses sistem.
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
                  placeholder="Masukkan username admin..."
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600"
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
                  placeholder="Masukkan password..."
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm rounded-2xl pl-10 pr-11 py-3 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600"
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
              <span>{loading ? 'Memproses...' : 'Masuk ke Sistem'}</span>
            </button>

          </form>

          {/* Quick Default Credentials Banner */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-400 flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Default Credentials:
                </p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  User: <span className="text-emerald-400 font-bold">{settings.adminUsername || 'admin'}</span> | Pass: <span className="text-emerald-400 font-bold">{settings.adminPassword || 'admin123'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleFillDefault}
                className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-2.5 py-1 rounded-xl whitespace-nowrap cursor-pointer transition-colors"
              >
                Isi Otomatis
              </button>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 font-medium">
          QR-Presensi Digital &copy; {new Date().getFullYear()} &bull; Fitur Keamanan Terintegrasi
        </p>

      </div>
    </div>
  );
};
