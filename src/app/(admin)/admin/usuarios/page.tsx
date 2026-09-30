import React from 'react';
import { getUsers } from '@/lib/db';
import { UsuariosClient } from './UsuariosClient';

export const revalidate = 0;

export default async function AdminUsuariosPage() {
  const users = await getUsers();
  return <UsuariosClient initialUsers={users} />;
}
