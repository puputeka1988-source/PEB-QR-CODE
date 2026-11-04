import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { IdleTimeoutModal } from '../modals/IdleTimeoutModal';
import { audioFeedback } from '../../utils/audio';

export const IdleTimeoutGuard: React.FC = () => {
  const {
    isLoggedIn,
    logout,
    isStudentLoggedIn,
    loggedInStudent,
    studentLogout,
    isKioskMode,
    settings,
    showToast
  } = useApp();

  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [activeRole, setActiveRole] = useState<'admin' | 'student'>('admin');

  const lastActivityRef = useRef<number>(Date.now());
  const soundPlayedRef = useRef<boolean>(false);

  // Update activity timestamp (throttled to at most once per 1000ms)
  const registerActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current > 1000) {
      lastActivityRef.current = now;
      // If modal was not open, ensure sound flag is reset
      if (!isWarningOpen) {
        soundPlayedRef.current = false;
      }
    }
  }, [isWarningOpen]);

  // Attach global DOM listeners for user input
  useEffect(() => {
    // Only listen if someone is logged in and not in kiosk mode
    if ((!isLoggedIn && !isStudentLoggedIn) || isKioskMode) {
      return;
    }

    const events: (keyof WindowEventMap)[] = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'wheel'
    ];

    const handleEvent = () => {
      // If warning modal is open, user interaction through mouse movements outside buttons shouldn't silently reset without them clicking "Tetap Masuk"
      // But if warning is NOT open, reset the activity timestamp!
      if (!isWarningOpen) {
        registerActivity();
      }
    };

    events.forEach(eventName => {
      window.addEventListener(eventName, handleEvent, { passive: true });
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isWarningOpen) {
        registerActivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(eventName => {
        window.removeEventListener(eventName, handleEvent);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn, isStudentLoggedIn, isKioskMode, isWarningOpen, registerActivity]);

  // Timer evaluation interval (checks every 1000ms)
  useEffect(() => {
    // Skip if Kiosk mode is active (unattended school lobby gate display)
    if (isKioskMode) {
      if (isWarningOpen) setIsWarningOpen(false);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();

      // Case 1: Admin is logged in
      if (isLoggedIn) {
        const timeoutMinutes = settings.idleTimeoutAdminMinutes !== undefined 
          ? settings.idleTimeoutAdminMinutes 
          : 20;

        // If configured as 0, timeout is disabled
        if (timeoutMinutes <= 0) {
          if (isWarningOpen) setIsWarningOpen(false);
          return;
        }

        const totalAllowedMs = timeoutMinutes * 60 * 1000;
        const warningDurationSec = settings.idleTimeoutWarningSeconds || 60;
        const warningThresholdMs = warningDurationSec * 1000;
        const elapsed = now - lastActivityRef.current;

        if (elapsed >= totalAllowedMs) {
          // Time expired! Log out Admin
          setIsWarningOpen(false);
          soundPlayedRef.current = false;
          logout();
          showToast(
            `Sesi Administrator telah berakhir otomatis karena tidak ada aktivitas selama ${timeoutMinutes} menit demi keamanan data sekolah.`,
            'warning'
          );
        } else if (elapsed >= (totalAllowedMs - warningThresholdMs)) {
          // Warning threshold reached!
          const remaining = Math.max(1, Math.ceil((totalAllowedMs - elapsed) / 1000));
          setSecondsRemaining(remaining);
          setActiveRole('admin');
          setIsWarningOpen(true);

          if (!soundPlayedRef.current && settings.enableSound) {
            audioFeedback.playWarning();
            soundPlayedRef.current = true;
          }
        } else {
          // Still active, hide warning if it was previously visible
          if (isWarningOpen) {
            setIsWarningOpen(false);
            soundPlayedRef.current = false;
          }
        }
        return;
      }

      // Case 2: Student is logged in
      if (isStudentLoggedIn && loggedInStudent) {
        const timeoutMinutes = settings.idleTimeoutStudentMinutes !== undefined 
          ? settings.idleTimeoutStudentMinutes 
          : 10;

        // If configured as 0, timeout is disabled
        if (timeoutMinutes <= 0) {
          if (isWarningOpen) setIsWarningOpen(false);
          return;
        }

        const totalAllowedMs = timeoutMinutes * 60 * 1000;
        // For students, give 30-45 seconds warning
        const warningDurationSec = Math.min(45, (settings.idleTimeoutWarningSeconds || 60));
        const warningThresholdMs = warningDurationSec * 1000;
        const elapsed = now - lastActivityRef.current;

        if (elapsed >= totalAllowedMs) {
          // Time expired! Log out Student
          setIsWarningOpen(false);
          soundPlayedRef.current = false;
          studentLogout();
          showToast(
            `Sesi Portal Siswa telah berakhir otomatis demi keamanan dan privasi data akun Anda.`,
            'info'
          );
        } else if (elapsed >= (totalAllowedMs - warningThresholdMs)) {
          const remaining = Math.max(1, Math.ceil((totalAllowedMs - elapsed) / 1000));
          setSecondsRemaining(remaining);
          setActiveRole('student');
          setIsWarningOpen(true);

          if (!soundPlayedRef.current && settings.enableSound) {
            audioFeedback.playWarning();
            soundPlayedRef.current = true;
          }
        } else {
          if (isWarningOpen) {
            setIsWarningOpen(false);
            soundPlayedRef.current = false;
          }
        }
        return;
      }

      // Case 3: Neither logged in
      if (isWarningOpen) {
        setIsWarningOpen(false);
        soundPlayedRef.current = false;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isLoggedIn, 
    logout, 
    isStudentLoggedIn, 
    loggedInStudent, 
    studentLogout, 
    isKioskMode, 
    settings.idleTimeoutAdminMinutes, 
    settings.idleTimeoutStudentMinutes, 
    settings.idleTimeoutWarningSeconds, 
    settings.enableSound, 
    showToast, 
    isWarningOpen
  ]);

  // Reset timer when user explicitly chooses to stay logged in
  const handleStayLoggedIn = useCallback(() => {
    lastActivityRef.current = Date.now();
    soundPlayedRef.current = false;
    setIsWarningOpen(false);
    if (settings.enableSound) {
      audioFeedback.playSuccess();
    }
    showToast('Sesi Anda telah diperpanjang. Selamat melanjutkan aktivitas.', 'success');
  }, [settings.enableSound, showToast]);

  // Handle immediate logout request from modal
  const handleLogout = useCallback(() => {
    setIsWarningOpen(false);
    soundPlayedRef.current = false;
    if (activeRole === 'student') {
      studentLogout();
    } else {
      logout();
    }
  }, [activeRole, studentLogout, logout]);

  // Reset timestamp whenever a login occurs
  useEffect(() => {
    lastActivityRef.current = Date.now();
    soundPlayedRef.current = false;
    setIsWarningOpen(false);
  }, [isLoggedIn, isStudentLoggedIn]);

  return (
    <IdleTimeoutModal
      isOpen={isWarningOpen}
      role={activeRole}
      userName={activeRole === 'student' ? loggedInStudent?.name : settings.namaGuru}
      secondsRemaining={secondsRemaining}
      totalWarningSeconds={activeRole === 'admin' ? (settings.idleTimeoutWarningSeconds || 60) : Math.min(45, (settings.idleTimeoutWarningSeconds || 60))}
      onStayLoggedIn={handleStayLoggedIn}
      onLogout={handleLogout}
    />
  );
};
