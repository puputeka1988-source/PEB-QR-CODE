import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowLeftRight, Edit2, Check, RefreshCw, PenTool } from 'lucide-react';
import { AppSettings } from '../../types';

export interface SignatoryItem {
  id: string;
  leadText: string;
  roleTitle: string;
  name: string;
  nip: string;
  signatureUrl?: string;
  useDigitalSignature?: boolean;
}

interface ConfigurableSignatureBlockProps {
  settings: AppSettings;
  signatories: SignatoryItem[];
  setSignatories: React.Dispatch<React.SetStateAction<SignatoryItem[]>>;
  isInteractive?: boolean;
  className?: string;
}

export const createDefaultSignatories = (
  settings: AppSettings, 
  count: 2 | 3 = 2,
  defaultCity?: string,
  waliKelasLabel: string = 'Wali Kelas'
): SignatoryItem[] => {
  const city = defaultCity || settings.kotaTandaTangan || 'Bula';
  const currentDateStr = `${city}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const kepsekSignatory: SignatoryItem = {
    id: 'kepsek',
    leadText: 'Mengetahui,',
    roleTitle: settings.jabatanKepalaSekolah || 'Kepala Sekolah',
    name: settings.namaKepalaSekolah || 'Drs. H. Ahmad Dahlan, M.Pd',
    nip: settings.nipKepalaSekolah ? `NIP. ${settings.nipKepalaSekolah}` : 'NIP. 19700101 199503 1 001',
    signatureUrl: settings.ttdKepalaSekolahUrl || '',
    useDigitalSignature: Boolean(settings.ttdKepalaSekolahUrl)
  };

  const guruSignatory: SignatoryItem = {
    id: 'guru',
    leadText: currentDateStr,
    roleTitle: 'Guru Mata Pelajaran',
    name: settings.namaGuru || 'Puput Eka Bajuri, S. Pd',
    nip: settings.nip ? `NIP. ${settings.nip}` : 'NIP. 198810052020121003',
    signatureUrl: settings.ttdGuruUrl || '',
    useDigitalSignature: Boolean(settings.ttdGuruUrl)
  };

  const waliSignatory: SignatoryItem = {
    id: 'wali',
    leadText: 'Diterima / Mengetahui,',
    roleTitle: waliKelasLabel,
    name: '( .................................................... )',
    nip: 'NIP. -',
    signatureUrl: '',
    useDigitalSignature: false
  };

  if (count === 3) {
    return [kepsekSignatory, waliSignatory, guruSignatory];
  }

  return [kepsekSignatory, guruSignatory];
};

export const ConfigurableSignatureBlock: React.FC<ConfigurableSignatureBlockProps> = ({
  signatories,
  setSignatories,
  isInteractive = true,
  className = ''
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Shift / Move logic
  const handleMoveTo = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= signatories.length) return;
    setSignatories(prev => {
      const next = [...prev];
      const temp = next[fromIndex];
      next[fromIndex] = next[toIndex];
      next[toIndex] = temp;
      return next;
    });
    setEditingIndex(null);
  };

  const handleShift = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    handleMoveTo(index, targetIndex);
  };

  const handleUpdateField = (index: number, field: keyof SignatoryItem, value: any) => {
    setSignatories(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const isThree = signatories.length === 3;
  const colWidth = isThree ? '32%' : '45%';
  const minColWidth = isThree ? '180px' : '220px';

  return (
    <div
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        width: '100%', 
        marginTop: '28px',
        pageBreakInside: 'avoid'
      }}
      className={`signature-container mt-7 flex justify-between w-full font-serif ${className}`}
    >
      {signatories.map((item, idx) => {
        const isEditing = editingIndex === idx && isInteractive;
        const posLabel = isThree 
          ? (idx === 0 ? 'Kiri' : idx === 1 ? 'Tengah' : 'Kanan')
          : (idx === 0 ? 'Kiri' : 'Kanan');

        return (
          <div
            key={item.id + '-' + idx}
            style={{ 
              textAlign: 'center', 
              fontSize: isThree ? '11px' : '12px', 
              width: colWidth,
              minWidth: minColWidth,
              display: 'inline-block',
              verticalAlign: 'top',
              position: 'relative'
            }}
            className="text-center space-y-1 relative group"
          >
            {/* Interactive Control Overlay Bar (Hidden on print) */}
            {isInteractive && (
              <div 
                className="print:hidden mb-2 p-1.5 bg-slate-900/95 text-white border border-slate-700/90 rounded-xl shadow-xl flex flex-wrap items-center justify-between gap-1 text-[10px] font-sans mx-auto max-w-[240px]"
                style={{ position: 'relative', zIndex: 10 }}
              >
                {/* Position Badge */}
                <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-emerald-400 font-bold text-[9px] uppercase tracking-wide border border-slate-700">
                  {posLabel}
                </span>

                {/* Arrow / Shift Buttons */}
                <div className="flex items-center gap-1">
                  {isThree ? (
                    <>
                      {/* For 3 signatories: Kiri, Tengah, Kanan buttons */}
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveTo(idx, 0)}
                          className="px-1.5 py-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 rounded-lg font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                          title="Geser ke Posisi Kiri"
                        >
                          <ArrowLeft className="w-2.5 h-2.5 stroke-[3]" />
                          <span>Kiri</span>
                        </button>
                      )}
                      {idx !== 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveTo(idx, 1)}
                          className="px-1.5 py-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 rounded-lg font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                          title="Geser ke Posisi Tengah"
                        >
                          <span>Tengah</span>
                        </button>
                      )}
                      {idx !== 2 && (
                        <button
                          type="button"
                          onClick={() => handleMoveTo(idx, 2)}
                          className="px-1.5 py-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 rounded-lg font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                          title="Geser ke Posisi Kanan"
                        >
                          <span>Kanan</span>
                          <ArrowRight className="w-2.5 h-2.5 stroke-[3]" />
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {/* For 2 signatories */}
                      {idx === 1 && (
                        <button
                          type="button"
                          onClick={() => handleShift(idx, 'left')}
                          className="px-2 py-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Geser / Tukar ke Posisi Kiri"
                        >
                          <ArrowLeft className="w-2.5 h-2.5 stroke-[3]" />
                          <span>Ke Kiri</span>
                        </button>
                      )}
                      {idx === 0 && (
                        <button
                          type="button"
                          onClick={() => handleShift(idx, 'right')}
                          className="px-2 py-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Geser / Tukar ke Posisi Kanan"
                        >
                          <span>Ke Kanan</span>
                          <ArrowRight className="w-2.5 h-2.5 stroke-[3]" />
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Edit Button */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingIndex(isEditing ? null : idx)}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      isEditing ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                    title={isEditing ? 'Simpan / Selesai Edit' : 'Edit Nama & Jabatan'}
                  >
                    {isEditing ? <Check className="w-3 h-3 stroke-[3]" /> : <Edit2 className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            )}

            {/* Editing Form Inline Popover/Modal */}
            {isEditing ? (
              <div className="print:hidden p-3 bg-slate-900 border border-slate-700 text-left rounded-2xl shadow-xl space-y-2 font-sans text-xs mb-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Teks Pengantar / Tgl:</label>
                  <input
                    type="text"
                    value={item.leadText}
                    onChange={(e) => handleUpdateField(idx, 'leadText', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                    placeholder="Mengetahui, / Kota, Tgl"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Jabatan:</label>
                  <input
                    type="text"
                    value={item.roleTitle}
                    onChange={(e) => handleUpdateField(idx, 'roleTitle', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-bold"
                    placeholder="Kepala Sekolah / Guru Mapel"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Nama Pejabat:</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateField(idx, 'name', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-bold"
                    placeholder="Nama Lengkap & Gelar"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-0.5">NIP / NUPTK:</label>
                  <input
                    type="text"
                    value={item.nip}
                    onChange={(e) => handleUpdateField(idx, 'nip', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-mono"
                    placeholder="NIP. 1988..."
                  />
                </div>
                <div className="pt-1 flex justify-between items-center">
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(item.useDigitalSignature)}
                      onChange={(e) => handleUpdateField(idx, 'useDigitalSignature', e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>Sertakan TTD Gambar</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className="px-2 py-1 bg-emerald-500 text-slate-950 rounded-lg font-bold text-[10px]"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            ) : null}

            {/* Standard Signature Rendered View (Strictly Identical for Print & Canvas) */}
            <p style={{ margin: '2px 0', fontSize: isThree ? '11px' : '12px' }} className="text-slate-800">
              {item.leadText}
            </p>
            <p style={{ fontWeight: 'bold', margin: '2px 0', fontSize: isThree ? '11.5px' : '12.5px' }} className="font-bold text-slate-950">
              {item.roleTitle}
            </p>

            {item.useDigitalSignature && item.signatureUrl ? (
              <div 
                style={{ height: isThree ? '48px' : '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                className="flex items-center justify-center my-1"
              >
                <img
                  src={item.signatureUrl}
                  alt={`Tanda Tangan ${item.roleTitle}`}
                  style={{ maxHeight: isThree ? '46px' : '54px', maxWidth: isThree ? '140px' : '170px', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div style={{ height: isThree ? '48px' : '56px' }} className="h-12 sm:h-14"></div>
            )}

            <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: '2px 0', fontSize: isThree ? '11.5px' : '12.5px' }} className="font-bold underline text-slate-950">
              {item.name}
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: isThree ? '9.5px' : '10.5px', margin: '2px 0' }} className="font-mono text-slate-700">
              {item.nip}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export const generateConfigurableSignatureHtml = (
  signatories: SignatoryItem[]
): string => {
  if (!signatories || signatories.length === 0) return '';
  const isThree = signatories.length === 3;
  const colWidth = isThree ? '32%' : '45%';
  const minColWidth = isThree ? '180px' : '220px';

  return `
    <div style="margin-top: 28px; display: flex; justify-content: space-between; page-break-inside: avoid; width: 100%; font-family: 'Times New Roman', Times, serif;">
      ${signatories.map(item => `
        <div style="text-align: center; width: ${colWidth}; min-width: ${minColWidth}; display: inline-block; vertical-align: top;">
          <p style="margin: 2px 0; font-size: ${isThree ? '10pt' : '10.5pt'};">${item.leadText}</p>
          <p style="margin: 2px 0; font-weight: bold; font-size: ${isThree ? '10.5pt' : '11pt'};">${item.roleTitle}</p>
          ${item.useDigitalSignature && item.signatureUrl 
            ? `<div style="height: 52px; display: flex; align-items: center; justify-content: center;"><img src="${item.signatureUrl}" style="max-height: 50px; max-width: ${isThree ? '130px' : '160px'}; object-fit: contain;" /></div>` 
            : '<div style="height: 52px;"></div>'
          }
          <p style="margin: 2px 0; font-weight: bold; text-decoration: underline; font-size: ${isThree ? '10.5pt' : '11pt'};">${item.name}</p>
          <p style="margin: 2px 0; font-size: ${isThree ? '8.5pt' : '9pt'}; font-family: monospace;">${item.nip}</p>
        </div>
      `).join('')}
    </div>
  `;
};
