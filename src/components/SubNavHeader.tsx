import React from 'react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';
import { getMenuConfig } from '../config/menuStructure';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, QrCode, History, BookOpen, Award, Settings,
  BarChart3, UserCheck, Monitor, UserPlus, FileSpreadsheet, Printer,
  Palette, Eye, Clock, Sliders, FileText, Percent, GraduationCap,
  CalendarDays, ShieldCheck, HardDrive, Sparkles, ChevronRight
} from 'lucide-react';

interface SubNavHeaderProps {
  currentTab: TabType;
  activeSubTab: string;
  onSelectSubTab: (subTabId: string) => void;
  badgeCounts?: Record<string, string | number>;
  extraActions?: React.ReactNode;
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

export const SubNavHeader: React.FC<SubNavHeaderProps> = ({
  currentTab,
  activeSubTab,
  onSelectSubTab,
  badgeCounts = {},
  extraActions
}) => {
  const menuConfig = getMenuConfig(currentTab);
  const activeSubMenu = menuConfig.subMenus.find(s => s.id === activeSubTab) || menuConfig.subMenus[0];

  const MenuIcon = ICON_MAP[menuConfig.iconName] || LayoutDashboard;
  const ActiveSubIcon = ICON_MAP[activeSubMenu.iconName] || Sparkles;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm relative overflow-hidden">
      
      {/* Top Breadcrumb & Heading row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-inner"
          >
            <MenuIcon className="w-5 h-5" />
          </motion.div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
              <span>{menuConfig.label}</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeSubMenu.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 4 }}
                  transition={{ duration: 0.15 }}
                  className="text-emerald-400 font-extrabold flex items-center gap-1"
                >
                  <ActiveSubIcon className="w-3 h-3 inline" />
                  {activeSubMenu.label}
                </motion.span>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.h2
                key={activeSubMenu.id}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.18 }}
                className="text-lg font-black text-white tracking-tight mt-0.5"
              >
                {activeSubMenu.label}
              </motion.h2>
            </AnimatePresence>
          </div>
        </div>

        {extraActions && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {extraActions}
          </div>
        )}
      </div>

      {/* Submenu Pill Tabs Navigation Bar with sliding active indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
        {menuConfig.subMenus.map(sub => {
          const isActive = sub.id === activeSubTab;
          const SubIcon = ICON_MAP[sub.iconName] || Sparkles;
          const badgeValue = badgeCounts[sub.id] ?? sub.badge;

          return (
            <motion.button
              key={sub.id}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.15 }}
              onClick={() => onSelectSubTab(sub.id)}
              title={sub.description}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer whitespace-nowrap border shrink-0 transition-colors ${
                isActive
                  ? 'text-slate-950 border-emerald-400 font-black shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-950/70 text-slate-300 border-slate-800/90 hover:border-slate-700 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId={`active-subnav-pill-${currentTab}`}
                  className="absolute inset-0 bg-emerald-500 rounded-2xl -z-0"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <span className="relative z-10 flex items-center gap-2">
                <SubIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{sub.label}</span>

                {badgeValue !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
                      isActive
                        ? 'bg-slate-950/25 text-slate-950'
                        : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    {badgeValue}
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Submenu Short Description Banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubMenu.id}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.18 }}
          className="bg-slate-950/50 border border-slate-800/60 rounded-2xl px-3.5 py-2 text-[11px] text-slate-400 flex items-center justify-between gap-2"
        >
          <span className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-400"></span>
            <span className="truncate">{activeSubMenu.description}</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500 shrink-0 hidden md:inline">
            Submenu {menuConfig.subMenus.findIndex(s => s.id === activeSubTab) + 1} dari {menuConfig.subMenus.length}
          </span>
        </motion.div>
      </AnimatePresence>

    </div>
  );
};
