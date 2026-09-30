import { NextResponse } from 'next/server';
import { getVideoById, updateVideo, deleteVideo } from '@/lib/db';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { isSafeUrl } from '@/lib/security';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const video = await getVideoById(params.id);
    if (!video) {
      return NextResponse.json({ error: 'Vídeo não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(video);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar vídeo.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    if (body.videoUrl && !isSafeUrl(body.videoUrl)) {
      return NextResponse.json({ error: 'URL do vídeo inválida.' }, { status: 400 });
    }
    if (body.thumbnailUrl && !isSafeUrl(body.thumbnailUrl)) {
      return NextResponse.json({ error: 'URL da miniatura inválida.' }, { status: 400 });
    }

    const updated = await updateVideo(params.id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Vídeo não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar vídeo.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const success = await deleteVideo(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Vídeo não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Vídeo removido com sucesso.' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir vídeo.' },
      { status: 500 }
    );
  }
}
