import React from 'react';
import { getSettings } from '@/lib/db';
import { AparenciaClient } from './AparenciaClient';

export const revalidate = 0;

export default async function AdminAparenciaPage() {
  const settings = await getSettings();
  return <AparenciaClient initialSettings={settings} />;
}
