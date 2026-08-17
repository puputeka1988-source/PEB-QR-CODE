import React from 'react';
import { Clock, Sparkles, Volume2, VolumeX, Save } from 'lucide-react';

interface JamAbsensiTabProps {
  jamMasuk: string;
  setJamMasuk: (val: string) => void;
  jamTerlambat: string;
  setJamTerlambat: (val: string) => void;
  enableSound: boolean;
  setEnableSound: (val: boolean) => void;
  cleanTimeFormat: (val: string) => string;
  onSave: (e?: React.FormEvent) => void;
}

export const JamAbsensiTab: React.FC<JamAbsensiTabProps> = ({
  jamMasuk,
  setJamMasuk,
  jamTerlambat,
  setJamTerlambat,
  enableSound,
  setEnableSound,
  cleanTimeFormat,
  onSave
}) => {
  return (
    <form onSubmit={onSave} className="space-y-6 animate-in fade-in duration-150">
      
      {/* Section 3: Batas Waktu Absensi */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          Batas Waktu Presensi
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Jam Masuk Sekolah (HH:mm):</label>
            <div className="flex gap-2">
              <input
                type="time"
                value={cleanTimeFormat(jamMasuk).slice(0, 5) || '07:00'}
                onChange={(e) => setJamMasuk(e.target.value)}
                className="w-28 bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 shrink-0"
              />
              <input
                type="text"
                placeholder="07:00"
                value={jamMasuk}
                onChange={(e) => setJamMasuk(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Dapat memilih jam atau mengetik manual (contoh: 07:00).</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Batas Jam Terlambat (HH:mm):</label>
            <div className="flex gap-2">
              <input
                type="time"
                value={cleanTimeFormat(jamTerlambat).slice(0, 5) || '07:15'}
                onChange={(e) => setJamTerlambat(e.target.value)}
                className="w-28 bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 shrink-0"
              />
              <input
                type="text"
                placeholder="07:15"
                value={jamTerlambat}
                onChange={(e) => setJamTerlambat(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Dapat memilih jam atau mengetik manual (contoh: 07:15).</p>
          </div>
        </div>
      </div>

      {/* Section 4: Audio & Preferensi */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Preferensi Suara & Feedback
        </h3>

        <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              {enableSound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-bold text-white">Audio Beep Feedback</p>
              <p className="text-[11px] text-slate-400">Bunyi sinyal tinggi untuk scan sukses, sinyal rendah untuk error</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEnableSound(!enableSound)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              enableSound ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
              enableSound ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Waktu & Suara</span>
        </button>
      </div>

    </form>
  );
};
