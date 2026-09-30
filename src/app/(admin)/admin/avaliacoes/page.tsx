import React from 'react';
import { getReviews } from '@/lib/db';
import { ReviewsClient } from './ReviewsClient';

export const revalidate = 0;

export default async function AdminAvaliacoesPage() {
  const reviews = await getReviews({ sortBy: 'order' });
  return <ReviewsClient initialReviews={reviews} />;
}
