import React from 'react';
import { AppSettings } from '../../types';

interface OfficialKopSuratProps {
  settings: AppSettings;
  className?: string;
}

export const OfficialKopSurat: React.FC<OfficialKopSuratProps> = ({ settings, className = '' }) => {
  return (
    <div className={`official-kop-surat text-center text-black pb-2.5 mb-4 border-b-[3px] border-double border-black ${className}`}>
      <div className="flex items-center justify-between gap-4 min-h-[65px]">
        {/* Logo Kop Kiri (Pemda / Dinas / Provinsi) */}
        <div className="w-16 flex items-center justify-center shrink-0">
          {settings.logoKiriUrl ? (
            <img src={settings.logoKiriUrl} alt="Logo Kop Kiri" className="max-h-16 max-w-16 object-contain" />
          ) : (
            <div className="w-16"></div>
          )}
        </div>
        
        {/* Teks Tengah Instansi */}
        <div className="flex-1 px-2 text-center font-serif">
          {settings.instansiProvinsi && (
            <div className="text-[11px] font-bold uppercase tracking-wider leading-tight text-slate-900">
              {settings.instansiProvinsi}
            </div>
          )}
          {settings.instansiKabupaten && (
            <div className="text-[11px] font-bold uppercase tracking-wider leading-tight text-slate-900">
              {settings.instansiKabupaten}
            </div>
          )}
          <div className="text-[15px] font-black uppercase tracking-wider leading-snug mt-0.5 text-black">
            {settings.sekolah || 'SEKOLAH DIGITAL'}
          </div>
          {settings.alamat && (
            <div className="text-[9.5px] text-slate-700 font-sans mt-0.5 leading-tight">
              {settings.alamat} {settings.npsn ? `• NPSN: ${settings.npsn}` : ''} {settings.kontakSekolah ? `• Telp: ${settings.kontakSekolah}` : ''}
            </div>
          )}
        </div>

        {/* Logo Kop Kanan (Sekolah / Tut Wuri Handayani) */}
        <div className="w-16 flex items-center justify-center shrink-0">
          {(settings.logoKananUrl || settings.logoUrl) ? (
            <img src={settings.logoKananUrl || settings.logoUrl} alt="Logo Sekolah" className="max-h-16 max-w-16 object-contain" />
          ) : (
            <div className="w-16"></div>
          )}
        </div>
      </div>
    </div>
  );
};
