import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, Trash2, 
  Download, Clock, ArrowRight, ShieldCheck, Database, Layers,
  Check, X, AlertTriangle, Send, Sparkles, Filter
} from 'lucide-react';
import { OfflineQueueItem } from '../../types';

interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineQueueModal: React.FC<OfflineQueueModalProps> = ({ isOpen, onClose }) => {
  const { 
    isOnline, 
    offlineQueue, 
    isQueueSyncing, 
    syncOfflineQueue, 
    clearSyncedOfflineQueue, 
    removeOfflineQueueItem, 
    retryOfflineQueueItem,
    lastSyncTimestamp
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'synced' | 'failed'>('all');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const pendingItems = offlineQueue.filter(item => item.status === 'pending');
  const failedItems = offlineQueue.filter(item => item.status === 'failed');
  const syncedItems = offlineQueue.filter(item => item.status === 'synced');

  const filteredItems = offlineQueue.filter(item => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  const handleExportQueue = () => {
    setIsExporting(true);
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(offlineQueue, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `antrean-presensi-offline-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error('Failed to export offline queue:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ')';
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${
              isOnline 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base sm:text-lg">Pusat Sinkronisasi Presensi Offline</h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  isOnline 
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {isOnline ? 'Terhubung (Online)' : 'Mode Offline'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manajemen antrean presensi otomatis saat jaringan sekolah terputus
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="btn-close-offline-queue-modal"
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/40 border-b border-slate-800/80 shrink-0">
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total Antrean</p>
              <p className="text-base sm:text-lg font-bold text-white">{offlineQueue.length}</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-amber-400/90 font-semibold">Menunggu Sync</p>
              <p className="text-base sm:text-lg font-bold text-amber-300">{pendingItems.length}</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-400/90 font-semibold">Tersinkron</p>
              <p className="text-base sm:text-lg font-bold text-emerald-400">{syncedItems.length}</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-rose-400/90 font-semibold">Gagal Sync</p>
              <p className="text-base sm:text-lg font-bold text-rose-400">{failedItems.length}</p>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-3 sm:px-4 border-b border-slate-800/80 bg-slate-900/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua ({offlineQueue.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-amber-300'
              }`}
            >
              Menunggu ({pendingItems.length})
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'failed'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-rose-300'
              }`}
            >
              Gagal ({failedItems.length})
            </button>
            <button
              onClick={() => setStatusFilter('synced')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'synced'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-emerald-300'
              }`}
            >
              Tersinkron ({syncedItems.length})
            </button>
          </div>

          {/* Sync & Clear Controls */}
          <div className="flex items-center gap-2">
            {syncedItems.length > 0 && (
              <button
                onClick={clearSyncedOfflineQueue}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700/60"
                title="Hapus riwayat yang sudah berhasil disinkronkan"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Bersihkan Tersinkron</span>
              </button>
            )}

            <button
              onClick={handleExportQueue}
              disabled={offlineQueue.length === 0 || isExporting}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700/60"
              title="Unduh cadangan antrean offline sebagai file JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Ekspor JSON</span>
            </button>

            <button
              onClick={() => syncOfflineQueue()}
              disabled={isQueueSyncing || pendingItems.length === 0}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/30 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isQueueSyncing ? 'animate-spin' : ''}`} />
              <span>{isQueueSyncing ? 'Menyinkronkan...' : `Sinkronkan (${pendingItems.length})`}</span>
            </button>
          </div>
        </div>

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[220px]">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 my-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">Tidak Ada Data Antrean</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                {statusFilter === 'all' 
                  ? 'Semua data presensi offline telah berhasil disinkronkan ke Cloud Firestore dan Google Sheets.'
                  : `Tidak ada item antrean dengan filter "${statusFilter}".`}
              </p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div 
                key={item.id}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                    item.record.status === 'Terlambat'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    {item.record.status === 'Terlambat' ? 'TLB' : 'HDR'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{item.record.studentName}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-700/60">
                        {item.record.class}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">NISN: {item.record.nisn}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {item.record.date} • {item.record.time}
                      </span>
                      <span>•</span>
                      <span>Metode: {item.record.method}</span>
                      <span>•</span>
                      <span>Antrean: {formatDateTime(item.queuedAt)}</span>
                      {item.retryCount > 0 && (
                        <span className="text-amber-400 font-medium">({item.retryCount}x percobaan)</span>
                      )}
                    </div>

                    {item.errorMessage && (
                      <p className="text-[11px] text-rose-400 mt-1 font-medium bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 inline-block">
                        ⚠️ {item.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 shrink-0">
                  {item.status === 'pending' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Menunggu Sync
                    </span>
                  )}

                  {item.status === 'syncing' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Menyinkronkan
                    </span>
                  )}

                  {item.status === 'synced' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      <Check className="w-3 h-3" />
                      Tersinkron
                    </span>
                  )}

                  {item.status === 'failed' && (
                    <button
                      onClick={() => retryOfflineQueueItem(item.id)}
                      className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Coba Lagi
                    </button>
                  )}

                  <button
                    onClick={() => removeOfflineQueueItem(item.id)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Hapus dari antrean"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info & guidelines */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {lastSyncTimestamp 
                ? `Terakhir sinkronisasi: ${lastSyncTimestamp}` 
                : 'Sistem otomatis menyinkronkan data saat jaringan terhubung.'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
};
