import { NextResponse } from 'next/server';
import { getReviews, createReview } from '@/lib/db';
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
        const allReviews = await getReviews({ sortBy: 'order' });
        return NextResponse.json(allReviews);
      }
    }

    // Public endpoint: only active reviews
    const activeReviews = await getReviews({ isActive: true, sortBy: 'order' });
    return NextResponse.json(activeReviews);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao carregar avaliações.' },
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

    if (!body || !body.customerName || !body.comment) {
      return NextResponse.json(
        { error: 'Nome do cliente e comentário são obrigatórios.' },
        { status: 400 }
      );
    }

    const customerName = String(body.customerName).slice(0, 100).trim();
    const companyName = String(body.companyName || '').slice(0, 100).trim();
    const avatarUrl = String(body.avatarUrl || '').slice(0, 500).trim();
    const comment = String(body.comment).slice(0, 2000).trim();
    const reviewDate = String(body.reviewDate || 'Recentemente').slice(0, 50).trim();

    if (avatarUrl && !isSafeUrl(avatarUrl)) {
      return NextResponse.json({ error: 'URL da imagem do avatar inválida.' }, { status: 400 });
    }

    const ratingVal = Math.min(5, Math.max(1, Math.round(Number(body.rating) || 5)));

    const newReview = await createReview({
      customerName,
      companyName,
      avatarUrl,
      rating: ratingVal,
      comment,
      reviewDate,
      isVerified: body.isVerified !== undefined ? Boolean(body.isVerified) : true,
      order: Number(body.order) || 0,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar avaliação.' },
      { status: 500 }
    );
  }
}
