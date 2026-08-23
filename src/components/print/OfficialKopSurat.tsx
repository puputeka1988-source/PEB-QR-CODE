import React from 'react';
import { AppSettings } from '../../types';

interface OfficialKopSuratProps {
  settings: Partial<AppSettings>;
  className?: string;
  showDoubleLine?: boolean;
  showPlaceholders?: boolean;
}

export const OfficialKopSurat: React.FC<OfficialKopSuratProps> = ({ 
  settings, 
  className = '',
  showDoubleLine = true,
  showPlaceholders = false
}) => {
  const logoKiriUrl = settings.logoKiriUrl?.trim();
  const logoKananUrl = settings.logoKananUrl?.trim() || settings.logoUrl?.trim();

  const instansiProvinsi = settings.instansiProvinsi?.trim();
  const instansiKabupaten = settings.instansiKabupaten?.trim();
  const sekolah = settings.sekolah?.trim() || 'NAMA SEKOLAH / SATUAN PENDIDIKAN';
  const alamat = settings.alamat?.trim();

  return (
    <div 
      className={`official-kop-surat text-center text-black pb-2.5 mb-4 ${
        showDoubleLine ? 'border-b-[3px] border-double border-black' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-4 min-h-[64px]">
        {/* Logo Kop Kiri (Pemerintah Daerah / Dinas / Kementerian / Tut Wuri Handayani) */}
        <div 
          style={{ width: '56px', height: '56px', minWidth: '56px', maxWidth: '56px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          className="w-14 h-14 min-w-14 max-w-14 flex items-center justify-center shrink-0 logo-container"
        >
          {logoKiriUrl ? (
            <img 
              src={logoKiriUrl} 
              alt="Logo Kop Kiri" 
              width={54}
              height={54}
              style={{ width: '54px', height: '54px', maxWidth: '54px', maxHeight: '54px', objectFit: 'contain', display: 'block' }}
              className="w-14 h-14 max-h-14 max-w-14 object-contain kop-img" 
            />
          ) : showPlaceholders ? (
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[9px] font-sans font-bold">
              [Kop Kiri]
            </div>
          ) : (
            <div style={{ width: '56px', height: '56px' }} className="w-14 h-14"></div>
          )}
        </div>
        
        {/* Teks Kop Tengah */}
        <div className="flex-1 px-2 text-center font-serif">
          {instansiProvinsi && (
            <div className="text-[11px] font-bold uppercase tracking-wider leading-tight text-slate-900">
              {instansiProvinsi}
            </div>
          )}
          {instansiKabupaten && (
            <div className="text-[11px] font-bold uppercase tracking-wider leading-tight text-slate-900">
              {instansiKabupaten}
            </div>
          )}
          <div className="text-[14px] font-black uppercase tracking-wider leading-snug mt-0.5 text-black">
            {sekolah}
          </div>
          {alamat && (
            <div className="text-[9px] text-slate-700 font-sans mt-0.5 leading-tight">
              {alamat} {settings.kontakSekolah ? `• Telp: ${settings.kontakSekolah}` : ''}
            </div>
          )}
        </div>

        {/* Logo Kop Kanan (Logo Resmi Sekolah) */}
        <div 
          style={{ width: '56px', height: '56px', minWidth: '56px', maxWidth: '56px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          className="w-14 h-14 min-w-14 max-w-14 flex items-center justify-center shrink-0 logo-container"
        >
          {logoKananUrl ? (
            <img 
              src={logoKananUrl} 
              alt="Logo Kop Kanan" 
              width={54}
              height={54}
              style={{ width: '54px', height: '54px', maxWidth: '54px', maxHeight: '54px', objectFit: 'contain', display: 'block' }}
              className="w-14 h-14 max-h-14 max-w-14 object-contain kop-img" 
            />
          ) : showPlaceholders ? (
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[9px] font-sans font-bold">
              [Kop Kanan]
            </div>
          ) : (
            <div style={{ width: '56px', height: '56px' }} className="w-14 h-14"></div>
          )}
        </div>
      </div>
    </div>
  );
};

