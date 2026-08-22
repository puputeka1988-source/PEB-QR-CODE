import React from 'react';
import { AppSettings } from '../../types';

interface OfficialSignatureBlockProps {
  settings: AppSettings;
  customDate?: string;
  customTeacherTitle?: string;
  className?: string;
}

export const OfficialSignatureBlock: React.FC<OfficialSignatureBlockProps> = ({
  settings,
  customDate,
  customTeacherTitle = 'Guru Mata Pelajaran',
  className = ''
}) => {
  const defaultCity = settings.kotaTandaTangan || 'Bula';
  const defaultDateStr = customDate || `${defaultCity}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  return (
    <div
      style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '32px' }}
      className={`signature-container mt-8 flex justify-between w-full font-serif ${className}`}
    >
      {/* Left: Mengetahui Kepala Sekolah */}
      <div
        style={{ textAlign: 'center', fontSize: '12px', minWidth: '220px', display: 'inline-block' }}
        className="text-center text-xs space-y-1 min-w-[220px]"
      >
        <p style={{ margin: '2px 0' }}>Mengetahui,</p>
        <p style={{ fontWeight: 'bold', margin: '2px 0' }} className="font-bold">
          {settings.jabatanKepalaSekolah || 'Kepala Sekolah'}
        </p>

        {settings.ttdKepalaSekolahUrl ? (
          <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="h-16 flex items-center justify-center">
            <img
              src={settings.ttdKepalaSekolahUrl}
              alt="Tanda Tangan Kepala Sekolah"
              style={{ maxHeight: '58px', maxWidth: '180px', objectFit: 'contain' }}
            />
          </div>
        ) : (
          <div style={{ height: '60px' }} className="h-16"></div>
        )}

        <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: '2px 0' }} className="font-bold underline text-slate-950">
          {settings.namaKepalaSekolah || settings.kepalaSekolah || 'Drs. H. Ahmad Dahlan, M.Pd'}
        </p>
        <p style={{ fontFamily: 'monospace', fontSize: '11px', margin: '2px 0' }} className="font-mono text-[11px] text-slate-700">
          {settings.nipKepalaSekolah ? `NIP. ${settings.nipKepalaSekolah}` : 'NIP. 19700101 199503 1 001'}
        </p>
      </div>

      {/* Right: Guru Mata Pelajaran / Wali Kelas */}
      <div
        style={{ textAlign: 'center', fontSize: '12px', minWidth: '220px', display: 'inline-block' }}
        className="text-center text-xs space-y-1 min-w-[220px]"
      >
        <p style={{ margin: '2px 0' }}>{defaultDateStr}</p>
        <p style={{ fontWeight: 'bold', margin: '2px 0' }} className="font-bold">{customTeacherTitle}</p>

        {settings.ttdGuruUrl ? (
          <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="h-16 flex items-center justify-center">
            <img
              src={settings.ttdGuruUrl}
              alt="Tanda Tangan Guru"
              style={{ maxHeight: '58px', maxWidth: '180px', objectFit: 'contain' }}
            />
          </div>
        ) : (
          <div style={{ height: '60px' }} className="h-16"></div>
        )}

        <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: '2px 0' }} className="font-bold underline text-slate-950">
          {settings.namaGuru || settings.guru || 'Puput Eka Bajuri, S. Pd'}
        </p>
        <p style={{ fontFamily: 'monospace', fontSize: '11px', margin: '2px 0' }} className="font-mono text-[11px] text-slate-700">
          {settings.nip ? `NIP. ${settings.nip}` : 'NIP. 198810052020121003'}
        </p>
      </div>
    </div>
  );
};
