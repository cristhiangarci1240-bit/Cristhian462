import React from 'react';
import { notFound } from 'next/navigation';
import { getProductById, getCategories } from '@/lib/db';
import { ProductForm } from '@/components/admin/ProductForm';

export const revalidate = 0;

export default async function EditarProdutoPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, categories] = await Promise.all([
    getProductById(params.id),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return <ProductForm categories={categories} initialProduct={product} />;
}
