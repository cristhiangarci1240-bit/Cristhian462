import React from 'react';
import { getSettings, getWhatsAppInquiries } from '@/lib/db';
import { WhatsAppAdminClient } from './WhatsAppAdminClient';

export const revalidate = 0;

export default async function AdminWhatsAppPage() {
  const [settings, inquiries] = await Promise.all([
    getSettings(),
    getWhatsAppInquiries(),
  ]);

  return <WhatsAppAdminClient initialSettings={settings} inquiries={inquiries} />;
}
