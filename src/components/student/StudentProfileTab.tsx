import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { 
  User, Phone, MapPin, Calendar, 
  Lock, Save, CheckCircle2, ShieldCheck, Heart,
  Sparkles, KeyRound, AlertCircle, RefreshCw, Info, HelpCircle
} from 'lucide-react';
import { getStudentInitials } from '../../utils/formatters';

interface StudentProfileTabProps {
  student: Student;
}

export const StudentProfileTab: React.FC<StudentProfileTabProps> = ({ student }) => {
  const { updateStudentProfile, showToast } = useApp();

  // Form states initialized with current student data
  const [phone, setPhone] = useState<string>(student.phone || '');
  const [parentPhone, setParentPhone] = useState<string>(student.parentPhone || '');
  const [email, setEmail] = useState<string>(student.email || '');
  const [address, setAddress] = useState<string>(student.address || '');
  const [birthPlace, setBirthPlace] = useState<string>(student.birthPlace || '');
  const [birthDate, setBirthDate] = useState<string>(student.birthDate || '');
  const [bloodType, setBloodType] = useState<string>(student.bloodType || '');
  const [guardianName, setGuardianName] = useState<string>(student.guardianName || '');

  const [isSaving, setIsSaving] = useState(false);

  // Submit Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);

    const updatedData: Partial<Student> = {
      phone: phone.trim(),
      parentPhone: parentPhone.trim(),
      email: email.trim(),
      address: address.trim(),
      birthPlace: birthPlace.trim(),
      birthDate: birthDate.trim(),
      bloodType: bloodType.trim(),
      guardianName: guardianName.trim()
    };

    const success = await updateStudentProfile(student.id, updatedData);

    setIsSaving(false);
    if (success) {
      showToast?.('Profil Anda berhasil diperbarui dan disinkronkan ke database sekolah!', 'success');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      {/* Header Info with Initials Avatar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
        {/* Student Initials Avatar Badge (Matching Web App) */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-600/30 to-teal-700/20 text-emerald-400 font-black text-xl sm:text-2xl flex items-center justify-center border-2 border-emerald-500/40 shadow-lg shrink-0 tracking-tight">
          {getStudentInitials(student.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              Profil & Berkas Siswa
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-medium">{student.gender === 'P' ? 'Perempuan' : 'Laki-Laki'}</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white truncate mt-1">
            {student.name}
          </h2>
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30">
              Kelas {student.class}
            </span>
            <span>•</span>
            <span className="font-mono text-slate-300">NISN: {student.nisn}</span>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-5">
        {/* Bagian 1: Kontak & Komunikasi */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>Kontak & WhatsApp</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                No. WhatsApp Siswa
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-emerald-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                No. WhatsApp Orang Tua / Wali <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="Contoh: 081987654321"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-emerald-500 outline-none transition-colors"
              />
              <p className="text-[10px] text-slate-500 mt-1">Digunakan untuk informasi kehadiran otomatis oleh guru.</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Siswa (Opsional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama.siswa@gmail.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-emerald-500 outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Bagian 2: Data Pribadi Lengkap */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-4 h-4 text-emerald-400" />
            <span>Data Pribadi Lengkap</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nama Orang Tua / Wali
              </label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="Nama Bapak / Ibu Wali"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-emerald-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Golongan Darah
              </label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-emerald-500 outline-none transition-colors"
              >
                <option value="">Pilih Golongan Darah</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tempat Lahir
              </label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="Kota / Tempat Lahir"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-emerald-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-emerald-500 outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Alamat Tempat Tinggal
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nama jalan, RT/RW, Dusun/Kelurahan, Kecamatan"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-emerald-500 outline-none transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Bagian 3: Keamanan & Reset PIN (Hanya oleh Guru / Admin Web) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Keamanan & PIN Akun Siswa</span>
            </h3>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
              Terkontrol Admin
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-start gap-3.5">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1.5">
              <p className="font-semibold text-slate-200">
                Pusat Pengaturan PIN Akun Siswa
              </p>
              <p className="text-slate-400 leading-relaxed">
                Untuk menjamin keamanan akun siswa, penggantian dan <strong className="text-white">reset PIN hanya dapat dilakukan oleh Guru / Admin Sekolah</strong> melalui aplikasi Web Presensi.
              </p>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 text-[11px] text-emerald-300 flex items-center gap-2 mt-2">
                <HelpCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  <strong>Lupa PIN?</strong> Silakan hubungi Guru Kelas / Admin Sekolah Anda untuk mereset PIN akun Anda (default: 6 digit terakhir NISN).
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyimpan Perubahan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Profil Saya</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
