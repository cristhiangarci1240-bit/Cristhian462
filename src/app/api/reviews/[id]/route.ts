import { NextResponse } from 'next/server';
import { getReviewById, updateReview, deleteReview } from '@/lib/db';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { isSafeUrl } from '@/lib/security';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const review = await getReviewById(params.id);
    if (!review) {
      return NextResponse.json({ error: 'Avaliação não encontrada.' }, { status: 404 });
    }
    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar avaliação.' },
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

    if (body.rating !== undefined) {
      body.rating = Math.min(5, Math.max(1, Math.round(Number(body.rating) || 5)));
    }

    if (body.avatarUrl && !isSafeUrl(body.avatarUrl)) {
      return NextResponse.json({ error: 'URL da imagem do avatar inválida.' }, { status: 400 });
    }

    const updated = await updateReview(params.id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Avaliação não encontrada.' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar avaliação.' },
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
    const success = await deleteReview(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Avaliação não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Avaliação removida com sucesso.' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir avaliação.' },
      { status: 500 }
    );
  }
}
