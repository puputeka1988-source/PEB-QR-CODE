import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StudentHeader } from '../components/student/StudentHeader';
import { StudentQrCardTab } from '../components/student/StudentQrCardTab';
import { StudentAttendanceTab } from '../components/student/StudentAttendanceTab';
import { StudentScheduleTab } from '../components/student/StudentScheduleTab';
import { StudentProfileTab } from '../components/student/StudentProfileTab';
import { StudentInstallPwaTab } from '../components/student/StudentInstallPwaTab';
import { StudentAnnouncementTab } from '../components/student/StudentAnnouncementTab';
import { AnnouncementPopupModal } from '../components/modals/AnnouncementPopupModal';
import { 
  QrCode as QrIcon, FileText, Calendar, 
  User, Smartphone, Sparkles, LogOut, Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type StudentTab = 'kartu' | 'pengumuman' | 'riwayat' | 'jadwal' | 'profil' | 'pasang';

export const StudentPortalView: React.FC = () => {
  const { loggedInStudent, studentLogout, getUnreadAnnouncementsForStudent } = useApp();
  
  // Persist active tab across reloads (default: 'kartu')
  const [activeTab, setActiveTab] = useState<StudentTab>(() => {
    try {
      const saved = localStorage.getItem('qr_presensi_student_active_tab') as StudentTab;
      const validTabs: StudentTab[] = ['kartu', 'pengumuman', 'riwayat', 'jadwal', 'profil', 'pasang'];
      if (saved && validTabs.includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.error('Failed to parse student active tab from localStorage:', e);
    }
    return 'kartu';
  });

  // Popup logic saat login pertama kali jika ada pengumuman belum dibaca
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [unreadForPopup, setUnreadForPopup] = useState<any[]>([]);

  useEffect(() => {
    if (loggedInStudent) {
      const unreadList = getUnreadAnnouncementsForStudent(loggedInStudent);
      if (unreadList.length > 0) {
        setUnreadForPopup(unreadList);
        setIsPopupOpen(true);
      }
    }
  }, [loggedInStudent, getUnreadAnnouncementsForStudent]);

  useEffect(() => {
    try {
      localStorage.setItem('qr_presensi_student_active_tab', activeTab);
    } catch (e) {
      console.error('Failed to save student active tab to localStorage:', e);
    }
  }, [activeTab]);

  if (!loggedInStudent) {
    return null;
  }

  const unreadCount = getUnreadAnnouncementsForStudent(loggedInStudent).length;

  const TABS: { id: StudentTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'kartu', label: 'Kartu QR', icon: QrIcon },
    { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone, badge: unreadCount },
    { id: 'riwayat', label: 'Riwayat Presensi', icon: FileText },
    { id: 'jadwal', label: 'Jadwal & Agenda', icon: Calendar },
    { id: 'profil', label: 'Profil Saya', icon: User },
    { id: 'pasang', label: 'Pasang App', icon: Smartphone },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 pb-20 sm:pb-8">
      {/* Auto Popup Modal on Login if there are unread announcements */}
      <AnnouncementPopupModal
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        announcements={unreadForPopup}
        currentStudent={loggedInStudent}
      />

      {/* Top Student Header */}
      <StudentHeader 
        student={loggedInStudent}
        onOpenProfile={() => setActiveTab('profil')}
        onOpenInstall={() => setActiveTab('pasang')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Desktop / Tablet Navigation Pills */}
        <div className="hidden sm:flex items-center justify-center">
          <div className="flex bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-md gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {Boolean(tab.badge && tab.badge > 0) && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content with Motion transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'kartu' && <StudentQrCardTab student={loggedInStudent} />}
            {activeTab === 'pengumuman' && <StudentAnnouncementTab student={loggedInStudent} />}
            {activeTab === 'riwayat' && <StudentAttendanceTab student={loggedInStudent} />}
            {activeTab === 'jadwal' && <StudentScheduleTab student={loggedInStudent} />}
            {activeTab === 'profil' && <StudentProfileTab student={loggedInStudent} />}
            {activeTab === 'pasang' && <StudentInstallPwaTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation Bar (App Experience) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-2 flex items-center justify-around shadow-2xl">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
                isActive 
                  ? 'text-emerald-400 font-bold scale-105' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg relative ${isActive ? 'bg-emerald-500/20 text-emerald-400' : ''}`}>
                <Icon className="w-5 h-5" />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-slate-900 animate-pulse" />
                )}
              </div>
              <span className="mt-0.5 leading-tight">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
