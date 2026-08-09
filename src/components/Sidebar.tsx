import React from 'react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';
import { LayoutDashboard, Users, QrCode, History, Database, Settings, X, GraduationCap, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, students, attendance, filterDate } = useApp();

  const todayLogsCount = attendance.filter(a => a.date === filterDate).length;

  const menuItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'Siswa', label: 'Data Siswa', icon: <Users className="w-5 h-5" />, badge: students.length },
    { id: 'Kartu QR', label: 'Kartu QR Siswa', icon: <QrCode className="w-5 h-5" /> },
    { id: 'Riwayat', label: 'Riwayat Presensi', icon: <History className="w-5 h-5" />, badge: todayLogsCount },
    { id: 'Integrasi Sheets', label: 'Google Sheets API', icon: <Database className="w-5 h-5" /> },
    { id: 'Pengaturan', label: 'Pengaturan', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleSelect = (tab: TabType) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Overlay Background */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
                <GraduationCap className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white italic">QR-PRESENSI</h1>
                <p className="text-[11px] font-semibold text-emerald-400">Sistem Absensi Digital</p>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {menuItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-slate-950' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive
                          ? 'bg-slate-950/20 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Card Footer */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
            <ShieldCheck className="w-4 h-4" /> Mode Offline & Cloud Ready
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Data tersimpan lokal di browser & dapat disinkronkan ke Google Sheets.
          </p>
        </div>

      </aside>
    </>
  );
};
