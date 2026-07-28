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
    }
    setIsLoaded(true);
  }, []);

  const setIsGenz = (value) => {
    setIsGenzState(value);
    localStorage.setItem('dripp_genz_mode', String(value));
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
