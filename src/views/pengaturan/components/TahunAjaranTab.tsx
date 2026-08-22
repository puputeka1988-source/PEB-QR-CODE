import React from 'react';
import { AcademicYear } from '../../../types';
import { 
  Calendar, Plus, CheckCircle2, Archive, ArchiveRestore, 
  Layers, Edit3, Trash2
} from 'lucide-react';

interface TahunAjaranTabProps {
  academicYears: AcademicYear[];
  activeAcademicYear: AcademicYear | null;
  openAddAyModal: () => void;
  openEditAyModal: (ay: AcademicYear) => void;
  setActiveAcademicYear: (id: string) => void;
  toggleArchiveAcademicYear: (id: string) => void;
  setConfirmDeleteAyId: (id: string | null) => void;
  ayFilterTab: 'ALL' | 'ACTIVE' | 'ARCHIVED';
  setAyFilterTab: (tab: 'ALL' | 'ACTIVE' | 'ARCHIVED') => void;
  activeYearsCount: number;
  archivedYearsCount: number;
  filteredAcademicYears: AcademicYear[];
}

export const TahunAjaranTab: React.FC<TahunAjaranTabProps> = ({
  academicYears,
  activeAcademicYear,
  openAddAyModal,
  openEditAyModal,
  setActiveAcademicYear,
  toggleArchiveAcademicYear,
  setConfirmDeleteAyId,
  ayFilterTab,
  setAyFilterTab,
  activeYearsCount,
  archivedYearsCount,
  filteredAcademicYears
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Section: Pengelompokan & Manajemen Arsip Tahun Ajaran / Semester */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Pengelompokan & Manajemen Arsip Tahun Ajaran
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Atur tahun ajaran aktif berjalan, kelola riwayat tahun lampau dalam arsip, dan buat periode baru.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddAyModal}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tahun Ajaran</span>
          </button>
        </div>

        {/* Current Active Year Highlight Card */}
        {activeAcademicYear ? (
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Sedang Digunakan
                  </span>
                  <span className="text-xs font-bold text-white">Tahun Ajaran Aktif</span>
                </div>
                <h4 className="text-base font-black text-white mt-0.5">
                  T.A. {activeAcademicYear.name} • Semester {activeAcademicYear.semester}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {activeAcademicYear.startDate && activeAcademicYear.endDate 
                    ? `Periode: ${activeAcademicYear.startDate} s/d ${activeAcademicYear.endDate}`
                    : (activeAcademicYear.notes || 'Semua pencatatan absensi dan jurnal berjalan pada periode ini.')
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => openEditAyModal(activeAcademicYear)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                Edit Periode
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-950/30 border border-amber-500/30 p-4 rounded-2xl text-xs text-amber-200 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span>Belum ada Tahun Ajaran yang diatur sebagai aktif. Silakan pilih salah satu dari daftar di bawah.</span>
          </div>
        )}

        {/* Filter Tab & List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAyFilterTab('ALL')}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  ayFilterTab === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Semua ({academicYears.length})
              </button>

              <button
                type="button"
                onClick={() => setAyFilterTab('ACTIVE')}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  ayFilterTab === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Aktif ({activeYearsCount})
              </button>

              <button
                type="button"
                onClick={() => setAyFilterTab('ARCHIVED')}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  ayFilterTab === 'ARCHIVED'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Arsip ({archivedYearsCount})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {filteredAcademicYears.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                Tidak ada data tahun ajaran pada kategori ini.
              </div>
            ) : (
              filteredAcademicYears.map(ay => (
                <div 
                  key={ay.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    ay.isCurrent
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                      : ay.isArchived
                        ? 'bg-slate-950/40 border-slate-800/80 opacity-75'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      ay.isCurrent 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : ay.isArchived
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      {ay.isArchived ? <Archive className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm">
                          T.A. {ay.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          Semester {ay.semester}
                        </span>
                        {ay.isCurrent && (
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            Aktif
                          </span>
                        )}
                        {ay.isArchived && (
                          <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            Arsip
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {ay.startDate && ay.endDate ? `${ay.startDate} s/d ${ay.endDate}` : 'Periode fleksibel'}
                        {ay.notes ? ` • ${ay.notes}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
                    {!ay.isCurrent && (
                      <button
                        type="button"
                        onClick={() => setActiveAcademicYear(ay.id)}
                        className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs border border-emerald-500/20 transition-colors cursor-pointer"
                      >
                        Jadikan Aktif
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleArchiveAcademicYear(ay.id)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl text-xs border border-slate-700 transition-colors cursor-pointer"
                      title={ay.isArchived ? 'Pulihkan dari Arsip' : 'Pindahkan ke Arsip'}
                    >
                      {ay.isArchived ? <ArchiveRestore className="w-3.5 h-3.5 text-emerald-400" /> : <Archive className="w-3.5 h-3.5 text-amber-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditAyModal(ay)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl text-xs border border-slate-700 transition-colors cursor-pointer"
                      title="Edit Tahun Ajaran"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {!ay.isCurrent && (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAyId(ay.id)}
                        className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white p-2 rounded-xl text-xs border border-rose-500/20 transition-colors cursor-pointer"
                        title="Hapus Tahun Ajaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
