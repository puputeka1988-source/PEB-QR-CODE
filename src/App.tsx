import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ScannerModal } from './components/ScannerModal';
import { Toast } from './components/Toast';

import { DashboardView } from './views/DashboardView';
import { SiswaView } from './views/SiswaView';
import { KartuQrView } from './views/KartuQrView';
import { RiwayatView } from './views/RiwayatView';
import { IntegrasiSheetsView } from './views/IntegrasiSheetsView';
import { PengaturanView } from './views/PengaturanView';
import { LoginView } from './views/LoginView';

const MainContent: React.FC = () => {
  const { activeTab, cameraModalOpen, setCameraModalOpen } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Sidebar Component */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Wrapper */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        
        {/* Header Component */}
        <Header onToggleMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Dynamic Main View */}
        <main className="p-4 sm:p-8 flex-1 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'Dashboard' && <DashboardView />}
          {activeTab === 'Siswa' && <SiswaView />}
          {activeTab === 'Kartu QR' && <KartuQrView />}
          {activeTab === 'Riwayat' && <RiwayatView />}
          {activeTab === 'Integrasi Sheets' && <IntegrasiSheetsView />}
          {activeTab === 'Pengaturan' && <PengaturanView />}
        </main>

      </div>

      {/* Global Camera Scanner Modal */}
      {cameraModalOpen && (
        <ScannerModal onClose={() => setCameraModalOpen(false)} />
      )}

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
