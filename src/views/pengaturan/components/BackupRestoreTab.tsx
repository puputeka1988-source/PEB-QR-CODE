import React from 'react';
import { 
  Monitor, Maximize2, Database, HardDrive, Download, 
  UploadCloud, AlertCircle, RotateCcw, Trash2, RefreshCw,
  Wifi, WifiOff, CloudUpload
} from 'lucide-react';
import { Student, AttendanceRecord, TeachingJournal, AppSettings } from '../../../types';
import { FullBackupPayload } from '../../../utils/backupRestore';
import { useApp } from '../../../context/AppContext';

interface BackupRestoreTabProps {
  students: Student[];
  attendance: AttendanceRecord[];
  journals: TeachingJournal[];
  settings: AppSettings;

  exportBackupJson: () => void;
  handleJsonDrop: (e: React.DragEvent) => void;
  handleJsonFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDraggingJson: boolean;
  setIsDraggingJson: (val: boolean) => void;
  fileError: string | null;
  jsonFileInputRef: React.RefObject<HTMLInputElement>;

  autoSnapshot: FullBackupPayload | null;
  downloadBackupJson: (payload: FullBackupPayload, filename: string) => void;
  handleRestoreAutoSnapshot: () => void;

  setIsKioskMode: (val: boolean) => void;
  setConfirmResetOpen: (val: boolean) => void;
  setConfirmClearLogsOpen: (val: boolean) => void;
}

export const BackupRestoreTab: React.FC<BackupRestoreTabProps> = ({
  students,
  attendance,
  journals,
  settings,

  exportBackupJson,
  handleJsonDrop,
  handleJsonFileInputChange,
  isDraggingJson,
  setIsDraggingJson,
  fileError,
  jsonFileInputRef,

  autoSnapshot,
  downloadBackupJson,
  handleRestoreAutoSnapshot,

  setIsKioskMode,
  setConfirmResetOpen,
  setConfirmClearLogsOpen
}) => {
  const { isOnline, offlineQueue, isQueueSyncing, syncOfflineQueue, setIsOfflineQueueModalOpen } = useApp();

  const pendingCount = offlineQueue.filter(q => q.status === 'pending' || q.status === 'failed').length;
  const syncedCount = offlineQueue.filter(q => q.status === 'synced').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">

      {/* Antrean Presensi Offline & Sinkronisasi Card */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border ${
              !isOnline
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : pendingCount > 0
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              {!isOnline ? (
                <WifiOff className="w-6 h-6" />
              ) : pendingCount > 0 ? (
                <CloudUpload className="w-6 h-6 animate-pulse" />
              ) : (
                <Wifi className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  !isOnline 
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                  {isOnline ? 'JARINGAN TERHUBUNG (ONLINE)' : 'MODE TANPA INTERNET (OFFLINE)'}
                </span>
                {pendingCount > 0 && (
                  <span className="text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 px-2 py-0.5 rounded-full">
                    {pendingCount} Menunggu Sinkronisasi
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-white tracking-tight mt-1">
                Antrean & Pemindai Presensi Offline (Sync Queue)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed max-w-xl">
                Memungkinkan pemindaian QR absensi tetap berjalan cepat saat internet mati atau lambat. Data otomatis diantrekan secara lokal dan dikirim ke Firestore & Google Sheets begitu koneksi pulih.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            {isOnline && pendingCount > 0 && (
              <button
                type="button"
                onClick={() => syncOfflineQueue()}
                disabled={isQueueSyncing}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isQueueSyncing ? 'animate-spin' : ''}`} />
                <span>{isQueueSyncing ? 'Menyinkronkan...' : 'Sinkronkan Antrean'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsOfflineQueueModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <CloudUpload className="w-4 h-4 text-emerald-400" />
              <span>Buka Pengelola Antrean ({offlineQueue.length})</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mode Kiosk Lobi / Gerbang Quick Launcher Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-lg">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                  TAMPILAN GERBANG & LOBI SEKOLAH
                </span>
              </div>
              <h3 className="text-base font-black text-white tracking-tight">
                Mode Kiosk Layar Penuh (Fullscreen Kiosk)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed max-w-xl">
                Buka layar presensi mandiri khusus untuk dipasang pada monitor/TV gerbang sekolah, lobi utama, atau meja piket dengan jam digital raksasa, pemindai QR ultra-cepat, dan sapaan suara.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsKioskMode(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0 self-start sm:self-center"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Buka Mode Kiosk</span>
          </button>
        </div>
      </div>

      {/* Backup & Restore 1-Klik JSON Zone */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Pencadangan & Pemulihan Data (Backup & Restore 1-Klik)
              </h3>
              <p className="text-xs text-slate-400">
                Amankan seluruh data siswa, riwayat absensi, jurnal mengajar, dan tahun ajaran dalam format JSON portabel
              </p>
            </div>
          </div>

          {/* Quick stats badge */}
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 self-start sm:self-auto">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>{students.length} Siswa • {attendance.length} Log • {journals.length} Jurnal</span>
          </div>
        </div>

        {/* Action Grid: Export & Import Dropzone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: 1-Klik Ekspor JSON */}
          <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl space-y-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Download className="w-4 h-4" />
                <span>1-Klik Unduh Cadangan (Ekspor JSON)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Unduh seluruh isi database aplikasi (Data Siswa, Absensi, Jurnal Mengajar, Master Tahun Ajaran, Pengaturan Profil) ke dalam satu file berkas <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">.JSON</code> yang aman dan rapi.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={exportBackupJson}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Cadangan Lengkap (.JSON)</span>
              </button>
            </div>
          </div>

          {/* Card 2: 1-Klik Pulihkan / Impor JSON */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDraggingJson(true); }}
            onDragLeave={() => setIsDraggingJson(false)}
            onDrop={handleJsonDrop}
            className={`border-2 border-dashed p-5 rounded-2xl space-y-3 flex flex-col justify-between transition-all ${
              isDraggingJson 
                ? 'bg-purple-950/30 border-purple-500' 
                : 'bg-slate-950/70 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                <UploadCloud className="w-4 h-4" />
                <span>1-Klik Pulihkan Data (Impor JSON)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tarik & lepas file <code className="text-purple-400 bg-slate-900 px-1 py-0.5 rounded">.JSON</code> hasil cadangan ke area ini atau klik tombol di bawah untuk memilih file dari komputer.
              </p>

              {fileError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <input
                type="file"
                ref={jsonFileInputRef}
                accept=".json,application/json"
                onChange={handleJsonFileInputChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => jsonFileInputRef.current?.click()}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Pilih & Pulihkan File JSON</span>
              </button>
            </div>
          </div>

        </div>

        {/* Auto-Snapshot Disaster Recovery Card */}
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">Cadangan Otomatis Lokal (Auto-Snapshot)</h4>
                <span className="text-[10px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.2 rounded-full">
                  Lokal Browser
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {autoSnapshot ? (
                  <>
                    Tersimpan otomatis: <strong className="text-slate-200">{new Date(autoSnapshot.exportedTimestamp).toLocaleString('id-ID')}</strong> ({autoSnapshot.summary.totalStudents} Siswa, {autoSnapshot.summary.totalAttendanceRecords} Presensi)
                  </>
                ) : (
                  'Sistem otomatis memperbarui snapshot cadangan darurat di memori browser secara berkala.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {autoSnapshot && (
              <button
                type="button"
                onClick={() => downloadBackupJson(autoSnapshot, `${settings.sekolah}_AutoSnapshot`)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                title="Unduh file snapshot"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Snapshot</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRestoreAutoSnapshot}
              disabled={!autoSnapshot}
              className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Pulihkan Snapshot</span>
            </button>
          </div>
        </div>

      </div>

      {/* Danger Zone */}
      <div className="bg-rose-950/20 border border-rose-500/20 p-6 rounded-3xl space-y-4 mt-8">
        <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Zona Pemeliharaan Data
        </h3>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>Muat Ulang Data Sample</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmClearLogsOpen(true)}
            className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 border border-rose-500/30 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Kosongkan Seluruh Log Absensi</span>
          </button>
        </div>
      </div>

    </div>
  );
};
