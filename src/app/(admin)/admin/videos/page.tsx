import React from 'react';
import { getVideos } from '@/lib/db';
import { VideosClient } from './VideosClient';

export const revalidate = 0;

export default async function AdminVideosPage() {
  const videos = await getVideos({ sortBy: 'order' });
  return <VideosClient initialVideos={videos} />;
}
