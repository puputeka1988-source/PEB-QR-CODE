import React from 'react';
import { 
  Building, GraduationCap, Upload, X, Image as ImageIcon, 
  UserCheck, User, Award, BookOpen, ShieldCheck, Phone, 
  Trash2, Save
} from 'lucide-react';

interface ProfilSekolahTabProps {
  instansiProvinsi: string;
  setInstansiProvinsi: (val: string) => void;
  instansiKabupaten: string;
  setInstansiKabupaten: (val: string) => void;
  sekolah: string;
  setSekolah: (val: string) => void;
  npsn: string;
  setNpsn: (val: string) => void;
  alamat: string;
  setAlamat: (val: string) => void;
  
  logoKiriUrl: string;
  setLogoKiriUrl: (val: string) => void;
  handleLogoKiriUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  logoKananUrl: string;
  setLogoKananUrl: (val: string) => void;
  handleLogoKananUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  namaGuru: string;
  setNamaGuru: (val: string) => void;
  nip: string;
  setNip: (val: string) => void;
  mataPelajaran: string;
  setMataPelajaran: (val: string) => void;
  jabatan: string;
  setJabatan: (val: string) => void;
  guruPhone: string;
  setGuruPhone: (val: string) => void;
  guruBio: string;
  setGuruBio: (val: string) => void;
  guruPhotoUrl: string;
  setGuruPhotoUrl: (val: string) => void;
  handleGuruPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  ttdGuruUrl: string;
  setTtdGuruUrl: (val: string) => void;
  handleTtdGuruUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  namaKepalaSekolah: string;
  setNamaKepalaSekolah: (val: string) => void;
  nipKepalaSekolah: string;
  setNipKepalaSekolah: (val: string) => void;
  jabatanKepalaSekolah: string;
  setJabatanKepalaSekolah: (val: string) => void;
  ttdKepalaSekolahUrl: string;
  setTtdKepalaSekolahUrl: (val: string) => void;
  handleTtdKepalaSekolahUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  kotaTandaTangan: string;
  setKotaTandaTangan: (val: string) => void;

  onSave: (e?: React.FormEvent) => void;
}

export const ProfilSekolahTab: React.FC<ProfilSekolahTabProps> = ({
  instansiProvinsi, setInstansiProvinsi,
  instansiKabupaten, setInstansiKabupaten,
  sekolah, setSekolah,
  npsn, setNpsn,
  alamat, setAlamat,
  
  logoKiriUrl, setLogoKiriUrl, handleLogoKiriUpload,
  logoKananUrl, setLogoKananUrl, handleLogoKananUpload,

  namaGuru, setNamaGuru,
  nip, setNip,
  mataPelajaran, setMataPelajaran,
  jabatan, setJabatan,
  guruPhone, setGuruPhone,
  guruBio, setGuruBio,
  guruPhotoUrl, setGuruPhotoUrl, handleGuruPhotoUpload,
  ttdGuruUrl, setTtdGuruUrl, handleTtdGuruUpload,

  namaKepalaSekolah, setNamaKepalaSekolah,
  nipKepalaSekolah, setNipKepalaSekolah,
  jabatanKepalaSekolah, setJabatanKepalaSekolah,
  ttdKepalaSekolahUrl, setTtdKepalaSekolahUrl, handleTtdKepalaSekolahUpload,
  kotaTandaTangan, setKotaTandaTangan,

  onSave
}) => {
  return (
    <form onSubmit={onSave} className="space-y-6 animate-in fade-in duration-150">
      
      {/* Section 1: Identitas Instansi Pembina, Sekolah & Kop Laporan */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-400" />
            Identitas Sekolah, Instansi Pembina & Kop Laporan Resmi
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Atur lambang instansi/pemerintah daerah pada <strong>Kop Sebelah Kiri</strong> dan logo sekolah pada <strong>Kop Sebelah Kanan</strong>. Format kop resmi bergaris ganda ini akan otomatis diterapkan pada seluruh laporan cetak.
          </p>
        </div>

        {/* Dual Logo Upload Grid (Kop Kiri & Kop Kanan) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Logo Kop Kiri - Lambang Daerah / Kementerian / Tut Wuri Handayani */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden group">
                {logoKiriUrl ? (
                  <img src={logoKiriUrl} alt="Logo Kop Kiri" className="w-full h-full object-contain p-1.5" />
                ) : (
                  <div className="text-center p-2">
                    <Building className="w-6 h-6 text-slate-600 mx-auto" />
                    <span className="text-[9px] text-slate-500 font-medium block mt-1">Kop Kiri</span>
                  </div>
                )}
              </div>
              {logoKiriUrl && (
                <button
                  type="button"
                  onClick={() => setLogoKiriUrl('')}
                  className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-lg transition-colors cursor-pointer"
                  title="Hapus Logo Kop Kiri"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                  Kop Kiri
                </span>
                <p className="text-xs font-bold text-white truncate">Logo Instansi / Pemda</p>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-tight">
                Lambang Provinsi/Kabupaten/Kemenag/Tut Wuri Handayani (Format PNG/JPG/WEBP, Maks. 500 KB).
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <label className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-blue-600/20">
                  <Upload className="w-3 h-3 stroke-[2.5]" />
                  <span>Upload Logo Kiri</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoKiriUpload}
                    className="hidden"
                  />
                </label>
                {logoKiriUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoKiriUrl('')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2.5 py-1.5 rounded-xl text-[10.5px] border border-slate-700 cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Logo Kop Kanan - Logo Resmi Sekolah */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden group">
                {logoKananUrl ? (
                  <img src={logoKananUrl} alt="Logo Sekolah (Kanan)" className="w-full h-full object-contain p-1.5" />
                ) : (
                  <div className="text-center p-2">
                    <GraduationCap className="w-6 h-6 text-emerald-500/70 mx-auto" />
                    <span className="text-[9px] text-slate-500 font-medium block mt-1">Kop Kanan</span>
                  </div>
                )}
              </div>
              {logoKananUrl && (
                <button
                  type="button"
                  onClick={() => setLogoKananUrl('')}
                  className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-lg transition-colors cursor-pointer"
                  title="Hapus Logo Sekolah"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                  Kop Kanan
                </span>
                <p className="text-xs font-bold text-white truncate">Logo Sekolah / Madrasah</p>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-tight">
                Logo resmi satuan pendidikan untuk kop kanan, kartu QR, dan identitas aplikasi (Maks. 500 KB).
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <label className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-500/20">
                  <Upload className="w-3 h-3 stroke-[2.5]" />
                  <span>Upload Logo Sekolah</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoKananUpload}
                    className="hidden"
                  />
                </label>
                {logoKananUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoKananUrl('')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2.5 py-1.5 rounded-xl text-[10.5px] border border-slate-700 cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Instansi & School Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Instansi Tingkat Provinsi / Pusat (Kop Baris 1):
            </label>
            <input
              type="text"
              value={instansiProvinsi}
              onChange={(e) => setInstansiProvinsi(e.target.value)}
              placeholder="Contoh: PEMERINTAH PROVINSI JAWA BARAT atau KEMENTERIAN AGAMA RI"
              className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
            />
            <p className="text-[10px] text-slate-500 mt-1">Baris teratas pada Kop Surat resmi.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Instansi Tingkat Kabupaten / Kota / Cabdin (Kop Baris 2):
            </label>
            <input
              type="text"
              value={instansiKabupaten}
              onChange={(e) => setInstansiKabupaten(e.target.value)}
              placeholder="Contoh: DINAS PENDIDIKAN atau CABANG DINAS WILAYAH VII"
              className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
            />
            <p className="text-[10px] text-slate-500 mt-1">Baris kedua pada Kop Surat resmi.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Satuan Pendidikan / Sekolah (Kop Baris 3): *</label>
            <input
              type="text"
              required
              value={sekolah}
              onChange={(e) => setSekolah(e.target.value)}
              placeholder="Contoh: SMA Negeri 1 Kita / MAN 1 Model"
              className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">NPSN / Kode Sekolah:</label>
            <input
              type="text"
              value={npsn}
              onChange={(e) => setNpsn(e.target.value)}
              placeholder="Contoh: 20261988"
              className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Lengkap, Kontak & Telepon Sekolah:</label>
            <input
              type="text"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Contoh: Jl. Pendidikan No. 45, Telp. (022) 123456, Email: info@sekolah.sch.id"
              className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Live Preview Kop Surat */}
        <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Pratinjau Kop Surat Resmi Laporan Cetak (Kiri & Kanan)
            </span>
            <span className="text-[10px] text-slate-500">Otomatis Diterapkan pada Semua Cetakan</span>
          </div>

          <div className="bg-white text-black p-4 rounded-xl border border-slate-200 shadow-inner font-serif">
            <div className="flex items-center justify-between gap-4 relative pb-2.5 border-b-[3px] border-double border-black text-center">
              {/* Logo Kiri */}
              <div className="w-14 h-14 flex items-center justify-center shrink-0">
                {logoKiriUrl ? (
                  <img src={logoKiriUrl} alt="Logo Kop Kiri" className="max-h-14 max-w-14 object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[9px] font-sans font-bold">
                    [Kop Kiri]
                  </div>
                )}
              </div>

              {/* Teks Kop Tengah */}
              <div className="flex-1 px-2">
                {instansiProvinsi && (
                  <div className="text-[10.5px] font-bold uppercase tracking-wider leading-tight">
                    {instansiProvinsi}
                  </div>
                )}
                {instansiKabupaten && (
                  <div className="text-[10.5px] font-bold uppercase tracking-wider leading-tight">
                    {instansiKabupaten}
                  </div>
                )}
                <div className="text-[13px] font-black uppercase tracking-wider leading-snug mt-0.5">
                  {sekolah || 'NAMA SEKOLAH / SATUAN PENDIDIKAN'}
                </div>
                {alamat && (
                  <div className="text-[8.5px] text-slate-700 font-sans mt-0.5 leading-tight">
                    {alamat}
                  </div>
                )}
              </div>

              {/* Logo Kanan */}
              <div className="w-14 h-14 flex items-center justify-center shrink-0">
                {logoKananUrl ? (
                  <img src={logoKananUrl} alt="Logo Kop Kanan" className="max-h-14 max-w-14 object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[9px] font-sans font-bold">
                    [Kop Kanan]
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Profil Guru / Admin & Mata Pelajaran */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Profil Guru / Admin & Mata Pelajaran yang Diampu
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Informasi identitas guru/admin ini akan dicantumkan pada kartu QR, laporan cetak presensi, dan sidebar aplikasi.
            </p>
          </div>
        </div>

        {/* Foto Profil Guru Upload Box */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden group">
              {guruPhotoUrl ? (
                <img src={guruPhotoUrl} alt="Foto Guru" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-2">
                  <User className="w-8 h-8 text-slate-600 mx-auto" />
                  <span className="text-[10px] text-slate-500 font-medium block mt-1">Belum Ada Foto</span>
                </div>
              )}
            </div>
            {guruPhotoUrl && (
              <button
                type="button"
                onClick={() => setGuruPhotoUrl('')}
                className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-lg transition-colors cursor-pointer"
                title="Hapus Foto"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <p className="text-xs font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
              <ImageIcon className="w-4 h-4 text-emerald-400" /> Upload Foto Profil Guru
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Foto akan ditampilkan di pojok kiri bawah sidebar profil aplikasi dan laporan cetak jurnal (Format PNG/JPG/WEBP, <span className="text-emerald-400 font-semibold">Maksimal 500 KB</span>).
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <label className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-emerald-500/20">
                <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Pilih Foto Guru</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGuruPhotoUpload}
                  className="hidden"
                />
              </label>
              {guruPhotoUrl && (
                <button
                  type="button"
                  onClick={() => setGuruPhotoUrl('')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs border border-slate-700 cursor-pointer"
                >
                  Hapus Foto
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nama Lengkap & Gelar Guru:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4 text-emerald-400" />
              </div>
              <input
                type="text"
                value={namaGuru}
                onChange={(e) => setNamaGuru(e.target.value)}
                placeholder="Contoh: Budi Santoso, S.Pd., M.Kom"
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              NIP / NUPTK Guru:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="Contoh: 19850723 201001 1 012"
                className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mata Pelajaran yang Diampu:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <BookOpen className="w-4 h-4 text-emerald-400" />
              </div>
              <input
                type="text"
                value={mataPelajaran}
                onChange={(e) => setMataPelajaran(e.target.value)}
                placeholder="Contoh: Informatika & Pemrograman"
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Jabatan / Peran di Sekolah:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <input
                type="text"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Contoh: Guru Mata Pelajaran & Admin Presensi"
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Kota / Tempat / Kecamatan Tanda Tangan:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Building className="w-4 h-4 text-emerald-400" />
              </div>
              <input
                type="text"
                value={kotaTandaTangan}
                onChange={(e) => setKotaTandaTangan(e.target.value)}
                placeholder="Contoh: Bula, Kec. Bula, atau Ambon"
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              No. WhatsApp / Telepon Guru:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={guruPhone}
                onChange={(e) => setGuruPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Catatan / Bio Guru:
            </label>
            <textarea
              rows={2}
              value={guruBio}
              onChange={(e) => setGuruBio(e.target.value)}
              placeholder="Catatan singkat atau sambutan guru..."
              className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Upload File Tanda Tangan Digital Guru Mata Pelajaran */}
          <div className="md:col-span-2 bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Upload Tanda Tangan Digital Guru Mata Pelajaran</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    PNG, JPEG, JPG
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tanda tangan ini akan otomatis dicetak pada blok tanda tangan (Guru Mata Pelajaran) di seluruh lembar laporan. Format PNG transparan direkomendasikan.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 pt-1">
              <div className="w-full md:w-56 h-28 bg-white/95 rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center p-2 relative shrink-0 shadow-inner overflow-hidden">
                {ttdGuruUrl ? (
                  <>
                    <img 
                      src={ttdGuruUrl} 
                      alt="Preview Tanda Tangan Guru" 
                      className="max-h-20 max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setTtdGuruUrl('')}
                      className="absolute top-1 right-1 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-lg transition-colors cursor-pointer shadow"
                      title="Hapus Tanda Tangan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-1">
                    <ImageIcon className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-[10px] font-medium text-slate-500">Belum Ada Tanda Tangan</p>
                    <p className="text-[9px] text-slate-400">Kosong (Tanda Tangan Manual)</p>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-center">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Pilih File Tanda Tangan Guru (PNG / JPG)</span>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg" 
                      onChange={handleTtdGuruUpload}
                      className="hidden" 
                    />
                  </label>

                  {ttdGuruUrl && (
                    <button
                      type="button"
                      onClick={() => setTtdGuruUrl('')}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold whitespace-nowrap"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  💡 <strong>Tips:</strong> Gunakan foto/scan tanda tangan pada kertas putih bersih atau gambar berlatar belakang transparan (PNG). Ukuran maksimal file: 1 MB.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2.5: Profil Kepala Sekolah */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            Profil Kepala Sekolah (Atasan & Pengesahan Laporan)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Data Kepala Sekolah ini akan terintegrasi secara otomatis pada blok tanda tangan pengesahan (Mengetahui, Kepala Sekolah) di seluruh lembar cetak laporan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nama Lengkap & Gelar Kepala Sekolah:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4 text-emerald-400" />
              </div>
              <input
                type="text"
                value={namaKepalaSekolah}
                onChange={(e) => setNamaKepalaSekolah(e.target.value)}
                placeholder="Contoh: Drs. H. Ahmad Dahlan, M.Pd"
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              NIP Kepala Sekolah:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <input
                type="text"
                value={nipKepalaSekolah}
                onChange={(e) => setNipKepalaSekolah(e.target.value)}
                placeholder="Contoh: 19700101 199503 1 001"
                className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Jabatan / Sebutan Pengesah (Sesuai Nomenklatur):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <input
                type="text"
                value={jabatanKepalaSekolah}
                onChange={(e) => setJabatanKepalaSekolah(e.target.value)}
                placeholder="Contoh: Kepala Sekolah / Kepala SMA Negeri 1 Kita"
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Upload File Tanda Tangan Digital Kepala Sekolah */}
          <div className="md:col-span-2 bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Upload Tanda Tangan Digital Kepala Sekolah</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    PNG, JPEG, JPG
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tanda tangan ini akan otomatis muncul pada blok dokumen cetak laporan. Format PNG transparan direkomendasikan.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 pt-1">
              <div className="w-full md:w-56 h-28 bg-white/95 rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center p-2 relative shrink-0 shadow-inner overflow-hidden">
                {ttdKepalaSekolahUrl ? (
                  <>
                    <img 
                      src={ttdKepalaSekolahUrl} 
                      alt="Preview Tanda Tangan Kepala Sekolah" 
                      className="max-h-20 max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setTtdKepalaSekolahUrl('')}
                      className="absolute top-1 right-1 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-lg transition-colors cursor-pointer shadow"
                      title="Hapus Tanda Tangan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-1">
                    <ImageIcon className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-[10px] font-medium text-slate-500">Belum Ada Tanda Tangan</p>
                    <p className="text-[9px] text-slate-400">Kosong (Tanda Tangan Manual)</p>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-center">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Pilih File Tanda Tangan (PNG / JPG)</span>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg" 
                      onChange={handleTtdKepalaSekolahUpload}
                      className="hidden" 
                    />
                  </label>

                  {ttdKepalaSekolahUrl && (
                    <button
                      type="button"
                      onClick={() => setTtdKepalaSekolahUrl('')}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold whitespace-nowrap"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  💡 <strong>Tips:</strong> Gunakan foto/scan tanda tangan pada kertas putih bersih atau gambar berlatar belakang transparan (PNG). Ukuran maksimal file: 1 MB.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Profil & Sekolah</span>
        </button>
      </div>

    </form>
  );
};
