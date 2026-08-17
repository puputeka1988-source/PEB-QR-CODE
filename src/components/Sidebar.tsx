import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';
import { MENU_STRUCTURE, MenuItemConfig } from '../config/menuStructure';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, QrCode, History, BookOpen, Settings, X, 
  GraduationCap, Award, ChevronDown, ChevronRight, BarChart3, UserCheck, 
  Monitor, UserPlus, FileSpreadsheet, Printer, Palette, Eye, Clock, 
  Sliders, FileText, Percent, CalendarDays, ShieldCheck, HardDrive, Sparkles,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({ 
  mobileOpen, 
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapsed
}) => {
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

  // Semua dropdown sub-menu selalu dalam posisi tertutup / tidak dropdown secara default
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Dashboard: false,
    Siswa: false,
    'Kartu QR': false,
    Riwayat: false,
    'Jurnal Mengajar': false,
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
    // Navigasi langsung tanpa membuka dropdown sub-menu (posisi tetap ramping)
    navigateToSubTab(item.id, curSub);
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
        className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between transition-all duration-300 ease-out lg:translate-x-0 ${
          isCollapsed ? 'lg:w-20 w-64' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full min-h-0">
          
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 shrink-0 mb-3">
            <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
              {settings.logoUrl ? (
                <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 p-1 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/10">
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20 shrink-0">
                  <GraduationCap className="w-4.5 h-4.5 stroke-[2.5]" />
                </div>
              )}
              
              {!isCollapsed && (
                <div className="truncate">
                  <h1 className="text-xs font-black tracking-tight text-white italic truncate">QR-PRESENSI</h1>
                  <p className="text-[10px] font-bold text-emerald-400 truncate">{settings.sekolah || 'Sistem Sekolah'}</p>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg shrink-0"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu with Clean Slim Structure */}
          <nav className="flex-1 overflow-y-auto pr-0.5 space-y-1 scrollbar-thin">
            {MENU_STRUCTURE.map(item => {
              const isActiveParent = activeTab === item.id;
              const isExpanded = Boolean(expandedMenus[item.id]);
              const ParentIcon = ICON_MAP[item.iconName] || LayoutDashboard;
              const badge = getBadgeForMenu(item.id);
              const currentSubTab = getActiveSubTab(item.id);

              return (
                <div key={item.id} className="space-y-1">
                  
                  {/* Parent Menu Item */}
                  <div className="flex items-center justify-between group relative">
                    <motion.button
                      type="button"
                      whileHover={{ x: isCollapsed ? 0 : 2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      onClick={() => handleSelectParent(item)}
                      title={isCollapsed ? `${item.label} (${item.description})` : item.description}
                      className={`flex-1 flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer relative overflow-hidden ${
                        isCollapsed ? 'justify-center px-2' : ''
                      } ${
                        isActiveParent
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className={`flex items-center gap-2.5 truncate z-10 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                        <ParentIcon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                          isActiveParent ? 'text-slate-950 scale-105' : 'text-slate-400 group-hover:text-emerald-400'
                        }`} />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isCollapsed && badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-mono font-bold shrink-0 ml-1 z-10 ${
                            isActiveParent
                              ? 'bg-slate-950/20 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                    </motion.button>

                    {/* Expand/Collapse Chevron Button (Only when not in ultra-collapsed mode) */}
                    {!isCollapsed && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(item.id);
                        }}
                        title={isExpanded ? 'Tutup Submenu' : 'Buka Submenu'}
                        className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors ml-0.5 cursor-pointer shrink-0 ${
                          isActiveParent ? 'text-emerald-400' : ''
                        }`}
                      >
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.18 }}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </motion.div>
                      </button>
                    )}
                  </div>

                  {/* Submenu Children Items (Only opens if explicitly toggled by user) */}
                  {!isCollapsed && (
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="ml-3.5 pl-2.5 border-l border-slate-800 space-y-0.5 py-1">
                            {item.subMenus.map(sub => {
                              const isSubActive = isActiveParent && currentSubTab === sub.id;
                              const SubIcon = ICON_MAP[sub.iconName] || Sparkles;

                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => handleSelectChild(item.id, sub.id)}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer text-left ${
                                    isSubActive
                                      ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <SubIcon className={`w-3 h-3 shrink-0 ${isSubActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                                    <span className="truncate">{sub.shortLabel || sub.label}</span>
                                  </div>

                                  {isSubActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-sm" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}

                </div>
              );
            })}
          </nav>

          {/* Sidebar Footer with Collapse/Ramping Toggle */}
          <div className="pt-2 border-t border-slate-800/80 shrink-0 mt-2 space-y-1.5">
            {onToggleCollapsed && (
              <button
                type="button"
                onClick={onToggleCollapsed}
                title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar (Mode Ramping)'}
                className="hidden lg:flex w-full items-center justify-center gap-2 px-2 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors text-[11px] font-semibold cursor-pointer"
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
                ) : (
                  <>
                    <PanelLeftClose className="w-4 h-4 text-slate-400" />
                    <span>Mode Ramping</span>
                  </>
                )}
              </button>
            )}

            {!isCollapsed && (
              <div className="bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800/80 text-[10.5px] text-slate-500 flex items-center justify-between shrink-0">
                <span className="font-semibold text-slate-400 truncate">QR-Presensi v2.5</span>
                <span className="font-mono text-[9.5px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                  Online
                </span>
              </div>
            )}
          </div>

        </div>
      </aside>
    </>
  );
};
