'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type DistanceUnit = 'mi' | 'km';

interface PreferencesContextValue {
  distanceUnit: DistanceUnit;
  setDistanceUnit: (unit: DistanceUnit) => void;
}

const PreferencesContext = createContext<PreferencesContextValue>({
  distanceUnit: 'mi',
  setDistanceUnit: () => {},
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [distanceUnit, setDistanceUnitState] = useState<DistanceUnit>('mi');

  useEffect(() => {
    const stored = localStorage.getItem('agili-distance-unit') as DistanceUnit | null;
    if (stored === 'mi' || stored === 'km') {
      setDistanceUnitState(stored);
    }
  }, []);

  const setDistanceUnit = (unit: DistanceUnit) => {
    setDistanceUnitState(unit);
    localStorage.setItem('agili-distance-unit', unit);
  };

  return (
    <PreferencesContext.Provider value={{ distanceUnit, setDistanceUnit }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);
