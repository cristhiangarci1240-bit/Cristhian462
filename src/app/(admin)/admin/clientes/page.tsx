import React from 'react';
import { getClients } from '@/lib/db';
import { ClientesClient } from './ClientesClient';

export const revalidate = 0;

export default async function AdminClientesPage() {
  const clients = await getClients();
  return <ClientesClient initialClients={clients} />;
}
