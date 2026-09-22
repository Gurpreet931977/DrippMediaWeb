"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const GenzContext = createContext();

export function GenzProvider({ children }) {
  const [isGenz, setIsGenzState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Mobile check to completely disable Gen-Z mode on mobile devices
    const isMobileDevice = typeof window !== 'undefined' && (
      window.innerWidth <= 1024 || 
      (window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches))
    );

    // Load preference from local storage on mount if not mobile
    const saved = localStorage.getItem('dripp_genz_mode');
    if (!isMobileDevice && saved === 'true') {
      setIsGenzState(true);
      document.body.classList.add('genz-mode');
    } else {
      setIsGenzState(false);
      document.body.classList.remove('genz-mode');
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isMobileDevice = typeof window !== 'undefined' && (
        window.innerWidth <= 1024 || 
        (window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches))
      );
      if (isGenz && !isMobileDevice) {
        document.body.classList.add('genz-mode');
      } else {
        document.body.classList.remove('genz-mode');
      }
    }
  }, [isGenz]);

  const setIsGenz = (value) => {
    const isMobileDevice = typeof window !== 'undefined' && (
      window.innerWidth <= 1024 || 
      (window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches))
    );
    if (isMobileDevice) {
      setIsGenzState(false);
      if (typeof document !== 'undefined') {
        document.body.classList.remove('genz-mode');
      }
      return;
    }
    setIsGenzState(value);
    localStorage.setItem('dripp_genz_mode', String(value));
    if (typeof document !== 'undefined') {
      if (value) {
        document.body.classList.add('genz-mode');
      } else {
        document.body.classList.remove('genz-mode');
      }
    }
  };

  return (
    <GenzContext.Provider value={{ isGenz, setIsGenz, isLoaded }}>
      {children}
    </GenzContext.Provider>
  );
}

export function useGenz() {
  return useContext(GenzContext);
}
