import React from 'react';
import { getClients } from '@/lib/db';
import { EmailClient } from './EmailClient';

export const revalidate = 0;

export default async function AdminEmailPage() {
  const clients = await getClients();
  const mailUser = process.env.MAIL_USER || 'comercial@tech7electronics.com';

  return (
    <React.Suspense fallback={<div style={{ padding: 32, color: '#64748B' }}>Carregando sistema de e-mails...</div>}>
      <EmailClient initialClients={clients} mailUser={mailUser} />
    </React.Suspense>
  );
}
