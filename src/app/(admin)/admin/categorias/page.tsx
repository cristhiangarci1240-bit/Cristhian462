import React from 'react';
import { getCategories } from '@/lib/db';
import { CategoriasClient } from './CategoriasClient';

export const revalidate = 0;

export default async function AdminCategoriasPage() {
  const categories = await getCategories();
  return <CategoriasClient initialCategories={categories} />;
}
