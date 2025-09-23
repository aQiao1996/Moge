'use client';

import { useRef } from 'react';
import { useSettings } from '@/stores/settingStore';

type Theme = 'light' | 'dark';

function StoreInitializer({ theme }: { theme: Theme }) {
  const initialized = useRef(false);
  if (!initialized.current) {
    useSettings.setState({ theme });
    initialized.current = true;
  }
  return null;
}

export default StoreInitializer;
