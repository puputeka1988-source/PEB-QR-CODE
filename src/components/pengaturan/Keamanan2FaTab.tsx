import React from 'react';
import { 
  KeyRound, User, ShieldCheck, Lock, Fingerprint, 
  Shield, Save
} from 'lucide-react';

interface Keamanan2FaTabProps {
  adminUsername: string;
  setAdminUsername: (val: string) => void;
  adminPassword: string;
  setAdminPassword: (val: string) => void;

  twoFactorEnabled: boolean;
  setTwoFactorEnabled: (val: boolean) => void;
  securityPin: string;
  setSecurityPin: (val: string) => void;

  biometricEnabled: boolean;
  setBiometricEnabled: (val: boolean) => void;
  biometricCredentialId: string;
  setBiometricCredentialId: (val: string) => void;
  biometricDeviceName: string;
  setBiometricDeviceName: (val: string) => void;
  isBiometricSupported: boolean;
  isRegisteringBiometric: boolean;
  handleRegisterDeviceBiometric: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;

  onSave: (e?: React.FormEvent) => void;
}

export const Keamanan2FaTab: React.FC<Keamanan2FaTabProps> = ({
  adminUsername,
  setAdminUsername,
  adminPassword,
  setAdminPassword,

  twoFactorEnabled,
  setTwoFactorEnabled,
  securityPin,
  setSecurityPin,

  biometricEnabled,
  setBiometricEnabled,
  biometricCredentialId,
  setBiometricCredentialId,
  biometricDeviceName,
  setBiometricDeviceName,
  isBiometricSupported,
  isRegisteringBiometric,
  handleRegisterDeviceBiometric,
  showToast,

  onSave
}) => {
  return (
    <form onSubmit={onSave} className="space-y-6 animate-in fade-in duration-150">
      
      {/* Section 5: Akun & Password Administrator */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-400" />
          Akun & Password Administrator
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Username Admin:</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password Admin:</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="admin123"
                className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          Username dan password ini digunakan saat login kembali setelah Anda melakukan Logout.
        </p>
      </div>

      {/* Section 5.5: Keamanan 2 Langkah */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Keamanan 2 Langkah Saat Login (2FA / Biometrik & PIN)
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  twoFactorEnabled 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {twoFactorEnabled ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Proteksi ganda saat login menggunakan sensor biometrik (sidik jari/kunci layar perangkat) dan 6-digit PIN keamanan layaknya keamanan mobile banking.
              </p>
            </div>
          </div>

          {/* Toggle 2FA switch */}
          <button
            type="button"
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          >
            <div className={`w-6 h-6 rounded-full bg-slate-950 transition-transform ${
              twoFactorEnabled ? 'translate-x-7' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {twoFactorEnabled ? (
          <div className="space-y-4 pt-1 animate-in fade-in duration-200">
            
            {/* Option 1: 6-Digit Security PIN */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>6-Digit PIN Keamanan Admin:</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">PIN Utama / Cadangan</span>
              </div>
              <div className="flex gap-3 items-center">
                <input
                  type="password"
                  maxLength={6}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={securityPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                    setSecurityPin(val);
                  }}
                  placeholder="123456"
                  className="w-40 bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-base tracking-widest font-black rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 text-center"
                />
                <p className="text-xs text-slate-400">
                  Masukkan 6 angka PIN yang akan diminta saat login (Langkah ke-2).
                </p>
              </div>
            </div>

            {/* Option 2: Device Biometric / Fingerprint Registration */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Biometrik Perangkat (Sidik Jari / Kunci Layar)</span>
                      {biometricEnabled && biometricCredentialId && (
                        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.2 rounded-full">
                          Terhubung
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {biometricDeviceName || (isBiometricSupported ? 'Sensor perangkat didukung oleh browser Anda' : 'Daftarkan sidik jari atau kunci layar perangkat ini')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {biometricEnabled && biometricCredentialId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setBiometricEnabled(false);
                        setBiometricCredentialId('');
                        setBiometricDeviceName('');
                        showToast('Sensor biometrik perangkat dinonaktifkan.', 'info');
                      }}
                      className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-2 rounded-xl transition-all cursor-pointer font-semibold"
                    >
                      Hapus Biometrik
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRegisterDeviceBiometric}
                        disabled={isRegisteringBiometric}
                        className="text-xs bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Fingerprint className="w-3.5 h-3.5" />
                        <span>{isRegisteringBiometric ? 'Menghubungkan Sensor...' : 'Daftarkan Biometrik'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-900 pt-2 space-y-1.5">
                <p className="text-slate-300 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Panduan Biometrik & Keamanan 2 Langkah:</span>
                </p>
                <p className="text-slate-400 text-[11px]">
                  1. <strong>6-Digit PIN Keamanan (Wajib Diatur):</strong> Selalu berfungsi sebagai autentikasi 2FA utama & cadangan tanpa batasan browser.
                </p>
                <p className="text-slate-400 text-[11px]">
                  2. <strong>Sensor Biometrik (Opsional):</strong> Menggunakan fitur WebAuthn browser. Jika Anda berada di iframe preview, buka tautan aplikasi di <strong>Tab Baru (New Tab)</strong> browser agar izin sensor perangkat diberikan penuh oleh OS/Browser.
                </p>
              </div>
            </div>

          </div>
        ) : (
          <div className="p-3.5 bg-slate-950/40 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Saat ini login hanya memerlukan Username dan Password (1 Langkah). Aktifkan switch di atas untuk mengaktifkan Kunci 2 Langkah.</span>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Keamanan Admin</span>
        </button>
      </div>

    </form>
  );
};
