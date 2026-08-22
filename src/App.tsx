import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ScannerModal } from './components/modals/ScannerModal';
import { ChangelogModal } from './components/modals/ChangelogModal';
import { KioskMode } from './components/presensi/KioskMode';
import { Toast } from './components/ui/Toast';
import { CURRENT_APP_VERSION } from './config/changelog';
import { motion, AnimatePresence } from 'motion/react';

import { DashboardView } from './views/DashboardView';
import { SiswaView } from './views/SiswaView';
import { KartuQrView } from './views/KartuQrView';
import { RiwayatView } from './views/RiwayatView';
import { JadwalMengajarView } from './views/JadwalMengajarView';
import { JurnalMengajarView } from './views/JurnalMengajarView';
import { PenilaianHarianView } from './views/PenilaianHarianView';
import { PengaturanView } from './views/PengaturanView';
import { LoginView } from './views/LoginView';

const MainContent: React.FC = () => {
  const { activeTab, setActiveSubTab, setActiveTab, cameraModalOpen, setCameraModalOpen, isKioskMode, setIsKioskMode } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [changelogModalOpen, setChangelogModalOpen] = useState(false);

  // Auto-detect new app version on startup and show What's New modal once per version
  useEffect(() => {
    try {
      const lastSeen = localStorage.getItem('qr_presensi_last_seen_version');
      if (lastSeen !== CURRENT_APP_VERSION) {
        // If it's a new version or user hasn't seen it yet, trigger popup smoothly
        const timer = setTimeout(() => {
          setChangelogModalOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('Storage check error', e);
    }
  }, []);

  const handleNavigateToChangelog = () => {
    setActiveTab('Pengaturan');
    setActiveSubTab('Pengaturan', 'changelog');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Sidebar Component */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed(prev => !prev)}
        onOpenChangelog={() => setChangelogModalOpen(true)}
      />

      {/* Main Wrapper */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}>
        
        {/* Header Component */}
        <Header 
          onToggleMobileMenu={() => setMobileMenuOpen(true)} 
          onOpenChangelog={() => setChangelogModalOpen(true)}
        />

        {/* Dynamic Main View with smooth Page Transitions */}
        <main className="p-4 sm:p-8 flex-1 max-w-7xl w-full mx-auto space-y-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.995 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {activeTab === 'Dashboard' && <DashboardView />}
              {activeTab === 'Siswa' && <SiswaView />}
              {activeTab === 'Kartu QR' && <KartuQrView />}
              {activeTab === 'Riwayat' && <RiwayatView />}
              {activeTab === 'Jadwal Mengajar' && <JadwalMengajarView />}
              {activeTab === 'Jurnal Mengajar' && <JurnalMengajarView />}
              {activeTab === 'Penilaian Harian' && <PenilaianHarianView />}
              {activeTab === 'Pengaturan' && <PengaturanView />}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* Global Camera Scanner Modal */}
      {cameraModalOpen && (
        <ScannerModal onClose={() => setCameraModalOpen(false)} />
      )}

      {/* Fullscreen Kiosk Mode (Lobby / Gate Presence) */}
      {isKioskMode && (
        <KioskMode onClose={() => setIsKioskMode(false)} />
      )}

      {/* What's New & Changelog Modal */}
      <ChangelogModal
        isOpen={changelogModalOpen}
        onClose={() => setChangelogModalOpen(false)}
        onNavigateToSettings={handleNavigateToChangelog}
      />

      {/* Toast Notification Container */}
      <Toast />

    </div>
  );
};

const AppContent: React.FC = () => {
  const { isLoggedIn } = useApp();

  if (!isLoggedIn) {
    return (
      <>
        <LoginView />
        <Toast />
      </>
    );
  }

  return <MainContent />;
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
