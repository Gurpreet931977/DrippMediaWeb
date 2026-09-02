"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const GenzContext = createContext();

export function GenzProvider({ children }) {
  const [isGenz, setIsGenzState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load preference from local storage on mount
    const saved = localStorage.getItem('dripp_genz_mode');
    if (saved === 'true') {
      setIsGenzState(true);
      document.body.classList.add('genz-mode');
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isGenz) {
        document.body.classList.add('genz-mode');
      } else {
        document.body.classList.remove('genz-mode');
      }
    }
  }, [isGenz]);

  const setIsGenz = (value) => {
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
