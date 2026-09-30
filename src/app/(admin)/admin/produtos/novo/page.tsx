import React from 'react';
import { getCategories } from '@/lib/db';
import { ProductForm } from '@/components/admin/ProductForm';

export const revalidate = 0;

export default async function NovoProdutoPage() {
  const categories = await getCategories();
  return <ProductForm categories={categories} />;
}
