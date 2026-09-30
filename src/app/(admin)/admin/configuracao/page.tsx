import React from 'react';
import { getSettings } from '@/lib/db';
import { ConfiguracaoClient } from './ConfiguracaoClient';

export const revalidate = 0;

export default async function AdminConfiguracaoPage() {
  const settings = await getSettings();
  return <ConfiguracaoClient initialSettings={settings} />;
}
