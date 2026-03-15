'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';

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
    const stored = localStorage.getItem(STORAGE_KEYS.DISTANCE_UNIT) as DistanceUnit | null;
    if (stored === 'mi' || stored === 'km') {
      setDistanceUnitState(stored);
    }
  }, []);

  const setDistanceUnit = (unit: DistanceUnit) => {
    setDistanceUnitState(unit);
    localStorage.setItem(STORAGE_KEYS.DISTANCE_UNIT, unit);
  };

  return (
    <PreferencesContext.Provider value={{ distanceUnit, setDistanceUnit }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);
