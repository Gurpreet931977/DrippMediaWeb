'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const ErrorLogContext = createContext();

export function ErrorLogProvider({ children }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Load existing logs from local storage on mount
    try {
      // SMART AUTO-CLEAR: If this is a fresh session/tab, wipe out old ghost errors.
      if (!sessionStorage.getItem('dripp_session_started')) {
        localStorage.removeItem('dripp_error_logs');
        sessionStorage.setItem('dripp_session_started', 'true');
        setLogs([]);
      } else {
        const storedLogs = localStorage.getItem('dripp_error_logs');
        if (storedLogs) {
          setLogs(JSON.parse(storedLogs));
        }
      }
    } catch (e) {
      console.error('Failed to load error logs from local storage', e);
    }
  }, []);

  // Save logs whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('dripp_error_logs', JSON.stringify(logs));
    } catch (e) {
      // Ignore storage errors (e.g., quota exceeded)
    }
  }, [logs]);

  const addLog = (level, message, source, details) => {
    setLogs(prev => {
      const newLog = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        level,
        message,
        source: source || window.location.href,
        details: details || null,
        userAgent: navigator.userAgent
      };
      
      // Keep only the latest 500 errors to prevent local storage quota overflow
      const updatedLogs = [newLog, ...prev].slice(0, 500);
      return updatedLogs;
    });
  };

  const clearLogs = () => {
    setLogs([]);
    localStorage.removeItem('dripp_error_logs');
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Capture Resource Loading Errors (e.g. Images, Scripts failing to load)
    const handleResourceError = (e) => {
      // If it's a resource error, e.target will be the element
      if (e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) {
        addLog(
          'error', 
          `Resource Failed to Load: ${e.target.tagName}`, 
          e.target.src || e.target.href || 'Unknown Source',
          `A resource requested by the page failed to load.`
        );
      }
    };
    window.addEventListener('error', handleResourceError, true); // true = capture phase

    // 2. Capture Uncaught Global Exceptions
    const handleGlobalError = (event) => {
      addLog(
        'fatal',
        event.message || 'Uncaught Exception',
        event.filename || window.location.href,
        `Line: ${event.lineno}, Col: ${event.colno}\n\nStack:\n${event.error?.stack || 'No stack available'}`
      );
    };
    window.addEventListener('error', handleGlobalError); // bubbling phase

    // 3. Capture Unhandled Promise Rejections (e.g. failed fetch requests)
    const handlePromiseRejection = (event) => {
      addLog(
        'error',
        'Unhandled Promise Rejection',
        window.location.href,
        event.reason ? (event.reason.stack || event.reason.toString()) : 'Unknown Reason'
      );
    };
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    // 4. Override console.error
    const originalConsoleError = console.error;
    console.error = (...args) => {
      addLog(
        'error',
        args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '),
        window.location.href,
        'Logged via console.error'
      );
      originalConsoleError.apply(console, args);
    };

    // 5. Override console.warn
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      addLog(
        'warn',
        args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '),
        window.location.href,
        'Logged via console.warn'
      );
      originalConsoleWarn.apply(console, args);
    };

    // Cleanup
    return () => {
      window.removeEventListener('error', handleResourceError, true);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  return (
    <ErrorLogContext.Provider value={{ logs, clearLogs, addLog }}>
      {children}
    </ErrorLogContext.Provider>
  );
}

export function useErrorLog() {
  return useContext(ErrorLogContext);
}
