import React from 'react';
import { Download, QrCode, X } from 'lucide-react';
import { Student } from '../../../types';

interface SiswaQrModalProps {
  qrModalStudent: Student | null;
  qrDataUrl: string;
  onClose: () => void;
  onDownloadQr: () => void;
  onOpenCardDetail: () => void;
}

export const SiswaQrModal: React.FC<SiswaQrModalProps> = ({
  qrModalStudent,
  qrDataUrl,
  onClose,
  onDownloadQr,
  onOpenCardDetail
}) => {
  if (!qrModalStudent) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xs w-full p-6 space-y-4 shadow-2xl text-center animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-emerald-400">QR Code Pelajar</span>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <p className="font-black text-sm text-white">{qrModalStudent.name}</p>
          <p className="text-xs text-slate-400 font-mono">Kelas {qrModalStudent.class} • NISN: {qrModalStudent.nisn}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl mx-auto w-48 h-48 flex items-center justify-center shadow-md">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
          ) : (
            <QrCode className="w-16 h-16 text-slate-400 animate-spin" />
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDownloadQr}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh PNG</span>
          </button>
          <button
            type="button"
            onClick={onOpenCardDetail}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 px-3 rounded-xl cursor-pointer"
          >
            Kartu Lengkap
          </button>
        </div>
      </div>
    </div>
  );
};
