'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SiteSettings } from '@/lib/types';

interface BrandContextType {
  settings: SiteSettings;
  updateLocalSettings: (newSettings: Partial<SiteSettings>) => void;
}

const BrandContext = createContext<BrandContextType | null>(null);

export function BrandProvider({
  initialSettings,
  children,
}: {
  initialSettings: SiteSettings;
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);

  useEffect(() => {
    // Inject custom colors into root if configured
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--brand-primary', settings.primaryColor);
    }
    if (settings.secondaryColor) {
      document.documentElement.style.setProperty('--brand-bg', settings.secondaryColor);
    }
  }, [settings.primaryColor, settings.secondaryColor]);

  const updateLocalSettings = (newSettings: Partial<SiteSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <BrandContext.Provider value={{ settings, updateLocalSettings }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand deve ser utilizado dentro de um BrandProvider');
  }
  return context;
}
