'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const ErrorLogContext = createContext();

// Helper to sanitize error messages
const formatLogArg = (a) => {
  if (a instanceof Error) {
    return a.message || a.toString();
  }
  if (typeof a === 'object' && a !== null) {
    try {
      const json = JSON.stringify(a);
      if (json === '{}' && (a.message || a.name || a.stack)) {
        return `${a.name || 'Error'}: ${a.message || ''}`.trim();
      }
      return json;
    } catch {
      return String(a);
    }
  }
  return String(a);
};

const extractDetails = (args, defaultLabel) => {
  const errWithStack = args.find(a => a instanceof Error || (a && typeof a === 'object' && a.stack));
  if (errWithStack?.stack) {
    return `${defaultLabel}\n\nStack:\n${errWithStack.stack}`;
  }
  return defaultLabel;
};

// Transmit error payload to the server backend
function transmitToServer(logObj) {
  if (typeof window === 'undefined') return;
  try {
    const payload = JSON.stringify(logObj);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const sent = navigator.sendBeacon('/api/admin/errors', payload);
      if (!sent) {
        fetch('/api/admin/errors', {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true
        }).catch(() => {});
      }
    } else {
      fetch('/api/admin/errors', {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      }).catch(() => {});
    }
  } catch (e) {
    // Fail silently so logger never throws
  }
}

export function ErrorLogProvider({ children }) {
  const [logs, setLogs] = useState([]);
  const logsRef = useRef([]);
  logsRef.current = logs;

  // Synchronously append to localStorage and transmit to server
  const addLog = useCallback((level, message, source, details) => {
    if (!message) return;
    const cleanMsg = String(message).trim();
    if (!cleanMsg) return;

    // Ignore known noisy browser extension errors
    if (
      cleanMsg.includes('chrome-extension://') ||
      cleanMsg.includes('moz-extension://') ||
      cleanMsg.includes('ResizeObserver loop completed with undelivered notifications')
    ) {
      return;
    }

    const newLog = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      level: level || 'error',
      message: cleanMsg,
      source: source || (typeof window !== 'undefined' ? window.location.href : 'server'),
      details: details || null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    // 1. Synchronously save to localStorage immediately to survive crashes
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('dripp_error_logs');
        let current = [];
        if (raw) {
          try { current = JSON.parse(raw) || []; } catch {}
        }
        // Deduplicate rapid identical error spam (same message within 3 seconds)
        if (
          current.length > 0 &&
          current[0].message === newLog.message &&
          (Date.now() - new Date(current[0].timestamp).getTime() < 3000)
        ) {
          return;
        }

        const updated = [newLog, ...current].slice(0, 500);
        localStorage.setItem('dripp_error_logs', JSON.stringify(updated));
      }
    } catch (e) {
      // Storage quota or privacy mode error
    }

    // 2. Transmit to server backend API
    transmitToServer(newLog);

    // 3. Update React state
    setLogs(prev => {
      if (
        prev.length > 0 &&
        prev[0].message === newLog.message &&
        (Date.now() - new Date(prev[0].timestamp).getTime() < 3000)
      ) {
        return prev;
      }
      return [newLog, ...prev].slice(0, 500);
    });
  }, []);

  // Expose global hook for immediate error capture
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__dripp_report_error = (err) => {
        addLog(err.level || 'error', err.message, err.source, err.details);
      };
    }
  }, [addLog]);

  // Initial load: read localStorage immediately, then fetch from server API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Instant local read
    try {
      const stored = localStorage.getItem('dripp_error_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLogs(parsed);
        }
      }
    } catch (e) {}

    // 2. Fetch from centralized server API to pull errors from other users/sessions
    fetch('/api/admin/errors', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.logs)) {
          setLogs(prev => {
            const map = new Map();
            // Merge both server logs and current state logs
            [...prev, ...data.logs].forEach(item => {
              if (item && item.id && !map.has(item.id)) {
                map.set(item.id, item);
              }
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            ).slice(0, 500);

            try {
              localStorage.setItem('dripp_error_logs', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      })
      .catch(() => {});

    // 3. Multi-tab real-time sync via storage event
    const handleStorageChange = (e) => {
      if (e.key === 'dripp_error_logs' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) {
            setLogs(updated);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const clearLogs = useCallback(async () => {
    setLogs([]);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('dripp_error_logs');
      }
    } catch (e) {}

    // Clear server side
    try {
      await fetch('/api/admin/errors', { method: 'DELETE' });
    } catch (e) {}
  }, []);

  const refreshLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/errors', { cache: 'no-store' });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
        try {
          localStorage.setItem('dripp_error_logs', JSON.stringify(data.logs));
        } catch {}
      }
    } catch (e) {
      // Fallback to local storage if offline
      try {
        const stored = localStorage.getItem('dripp_error_logs');
        if (stored) setLogs(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // Set up browser-level error interceptors
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Capture Resource Loading Failures
    const handleResourceError = (e) => {
      if (e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) {
        addLog(
          'error',
          `Resource Failed to Load: <${e.target.tagName.toLowerCase()}>`,
          e.target.src || e.target.href || window.location.href,
          `A resource requested by the page failed to load from the network.`
        );
      }
    };
    window.addEventListener('error', handleResourceError, true);

    // 2. Capture Uncaught Global Exceptions
    const handleGlobalError = (event) => {
      const msg = event.message || (event.error && event.error.message) || 'Uncaught Exception';
      const stack = event.error?.stack || 'No stack trace available';
      addLog(
        'fatal',
        msg,
        event.filename || window.location.href,
        `Line: ${event.lineno}, Col: ${event.colno}\n\nStack Trace:\n${stack}`
      );
    };
    window.addEventListener('error', handleGlobalError);

    // 3. Capture Unhandled Promise Rejections
    const handlePromiseRejection = (event) => {
      const reason = event.reason;
      let msg = 'Unhandled Promise Rejection';
      let stack = '';
      if (reason instanceof Error) {
        msg = reason.message || msg;
        stack = reason.stack || '';
      } else if (typeof reason === 'string') {
        msg = reason;
      } else if (reason && typeof reason === 'object') {
        msg = reason.message || JSON.stringify(reason);
      }
      addLog(
        'error',
        msg,
        window.location.href,
        stack ? `Stack Trace:\n${stack}` : `Reason:\n${String(reason)}`
      );
    };
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    // 4. Intercept console.error
    const originalConsoleError = console.error;
    console.error = (...args) => {
      try {
        const formattedMessage = args.map(formatLogArg).join(' ') || 'Unknown Error';
        // Avoid capturing our own internal logs or React warning noise
        if (!formattedMessage.includes('[errors-api]') && !formattedMessage.includes('Warning: ')) {
          const details = extractDetails(args, 'Logged via console.error');
          addLog('error', formattedMessage, window.location.href, details);
        }
      } catch {}
      originalConsoleError.apply(console, args);
    };

    // 5. Intercept console.warn
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      try {
        const formattedMessage = args.map(formatLogArg).join(' ') || 'Unknown Warning';
        if (!formattedMessage.includes('[errors-api]')) {
          const details = extractDetails(args, 'Logged via console.warn');
          addLog('warn', formattedMessage, window.location.href, details);
        }
      } catch {}
      originalConsoleWarn.apply(console, args);
    };

    return () => {
      window.removeEventListener('error', handleResourceError, true);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, [addLog]);

  return (
    <ErrorLogContext.Provider value={{ logs, clearLogs, addLog, refreshLogs }}>
      {children}
    </ErrorLogContext.Provider>
  );
}

export function useErrorLog() {
  return useContext(ErrorLogContext);
}
