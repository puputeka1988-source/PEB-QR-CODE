import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';
import { MENU_STRUCTURE, MenuItemConfig } from '../config/menuStructure';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, QrCode, History, BookOpen, Settings, X, 
  GraduationCap, Award, ChevronDown, ChevronRight, BarChart3, UserCheck, 
  Monitor, UserPlus, FileSpreadsheet, Printer, Palette, Eye, Clock, 
  Sliders, FileText, Percent, CalendarDays, ShieldCheck, HardDrive, Sparkles 
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  QrCode,
  History,
  BookOpen,
  Award,
  Settings,
  BarChart3,
  UserCheck,
  Monitor,
  UserPlus,
  FileSpreadsheet,
  Printer,
  Palette,
  Eye,
  Clock,
  Sliders,
  FileText,
  Percent,
  GraduationCap,
  CalendarDays,
  ShieldCheck,
  HardDrive,
  Sparkles
};

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { 
    activeTab, 
    getActiveSubTab, 
    navigateToSubTab, 
    students, 
    attendance, 
    journals, 
    filterDate, 
    settings 
  } = useApp();

  const todayLogsCount = attendance.filter(a => a.date === filterDate).length;

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Dashboard: true,
    Siswa: true,
    'Kartu QR': false,
    Riwayat: true,
    'Jurnal Mengajar': true,
    'Penilaian Harian': false,
    Pengaturan: false
  });

  const toggleExpand = (menuId: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const handleSelectParent = (item: MenuItemConfig) => {
    const curSub = getActiveSubTab(item.id) || item.defaultSubTab;
    navigateToSubTab(item.id, curSub);
    setExpandedMenus(prev => ({ ...prev, [item.id]: true }));
    onCloseMobile();
  };

  const handleSelectChild = (parentTab: TabType, subTabId: string) => {
    navigateToSubTab(parentTab, subTabId);
    onCloseMobile();
  };

  const getBadgeForMenu = (id: TabType) => {
    if (id === 'Siswa') return students.length;
    if (id === 'Riwayat') return todayLogsCount;
    if (id === 'Jurnal Mengajar') return journals.length;
    return undefined;
  };

  return (
    <>
      {/* Mobile Overlay Background */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCloseMobile}
            className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-72 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between transition-transform duration-300 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full min-h-0">
          
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              {settings.logoUrl ? (
                <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 p-1.5 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 shrink-0">
                  <GraduationCap className="w-5 h-5 stroke-[2.5]" />
                </div>
              )}
              <div className="truncate">
                <h1 className="text-sm font-black tracking-tight text-white italic truncate">QR-PRESENSI</h1>
                <p className="text-[10px] font-bold text-emerald-400 truncate">{settings.sekolah || 'Sistem Sekolah'}</p>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu with Accordion Submenus */}
          <nav className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
            {MENU_STRUCTURE.map(item => {
              const isActiveParent = activeTab === item.id;
              const isExpanded = expandedMenus[item.id] ?? isActiveParent;
              const ParentIcon = ICON_MAP[item.iconName] || LayoutDashboard;
              const badge = getBadgeForMenu(item.id);
              const currentSubTab = getActiveSubTab(item.id);

              return (
                <div key={item.id} className="space-y-1">
                  
                  {/* Parent Menu Item */}
                  <div className="flex items-center justify-between group">
                    <motion.button
                      type="button"
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => handleSelectParent(item)}
                      className={`flex-1 flex items-center justify-between p-2.5 rounded-2xl font-bold text-xs transition-colors cursor-pointer relative overflow-hidden ${
                        isActiveParent
                          ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate z-10">
                        <ParentIcon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActiveParent ? 'text-slate-950 scale-110' : 'text-slate-400 group-hover:text-emerald-400 group-hover:scale-105'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {badge !== undefined && (
                        <motion.span
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ml-1.5 z-10 ${
                            isActiveParent
                              ? 'bg-slate-950/20 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {badge}
                        </motion.span>
                      )}
                    </motion.button>

                    {/* Expand/Collapse Chevron Button */}
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(item.id);
                      }}
                      title={isExpanded ? 'Tutup Submenu' : 'Buka Submenu'}
                      className={`p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors ml-1 cursor-pointer shrink-0 ${
                        isActiveParent ? 'text-emerald-400' : ''
                      }`}
                    >
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </motion.div>
                    </motion.button>
                  </div>

                  {/* Submenu Children Items with AnimatePresence Accordion */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 pl-3 border-l border-slate-800/80 space-y-1 py-1">
                          {item.subMenus.map(sub => {
                            const isSubActive = isActiveParent && currentSubTab === sub.id;
                            const SubIcon = ICON_MAP[sub.iconName] || Sparkles;

                            return (
                              <motion.button
                                key={sub.id}
                                type="button"
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.97 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => handleSelectChild(item.id, sub.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer text-left ${
                                  isSubActive
                                    ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <SubIcon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isSubActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                                  <span className="truncate">{sub.shortLabel || sub.label}</span>
                                </div>

                                {isSubActive && (
                                  <motion.span
                                    layoutId={`active-dot-${item.id}`}
                                    className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-400"
                                  />
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              );
            })}
          </nav>

          {/* Clean Minimal Sidebar Footer */}
          <div className="bg-slate-950/70 px-3 py-2.5 rounded-2xl border border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between shrink-0 mt-3">
            <span className="font-semibold text-slate-400">QR-Presensi v2.5</span>
            <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Online</span>
          </div>

        </div>
      </aside>
    </>
  );
};

