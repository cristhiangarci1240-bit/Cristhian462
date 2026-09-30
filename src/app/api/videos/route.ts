import { NextResponse } from 'next/server';
import { getVideos, createVideo } from '@/lib/db';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { isSafeUrl } from '@/lib/security';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    // If requesting all (including inactive), check for valid admin session
    if (showAll) {
      const cookieStore = cookies();
      const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyToken(token) : null;
      if (session) {
        const allVideos = await getVideos({ sortBy: 'order' });
        return NextResponse.json(allVideos);
      }
    }

    // Public endpoint: only active videos, ordered by order ASC then createdAt DESC
    const activeVideos = await getVideos({ isActive: true, sortBy: 'order' });
    return NextResponse.json(activeVideos);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao carregar vídeos.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.title || !body.videoUrl) {
      return NextResponse.json(
        { error: 'Título e URL do vídeo são obrigatórios.' },
        { status: 400 }
      );
    }

    const title = String(body.title).slice(0, 200).trim();
    const description = String(body.description || '').slice(0, 2000).trim();
    const videoUrl = String(body.videoUrl).slice(0, 1000).trim();
    const thumbnailUrl = String(body.thumbnailUrl || '').slice(0, 1000).trim();
    const category = String(body.category || 'LANÇAMENTO').slice(0, 50).trim().toUpperCase();

    if (!isSafeUrl(videoUrl)) {
      return NextResponse.json(
        { error: 'URL do vídeo inválida ou protocolo não permitido.' },
        { status: 400 }
      );
    }

    if (thumbnailUrl && !isSafeUrl(thumbnailUrl)) {
      return NextResponse.json(
        { error: 'URL da miniatura inválida ou protocolo não permitido.' },
        { status: 400 }
      );
    }

    const newVideo = await createVideo({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      category,
      order: Number(body.order) || 0,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    });

    return NextResponse.json(newVideo, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar registro de vídeo.' },
      { status: 500 }
    );
  }
}
