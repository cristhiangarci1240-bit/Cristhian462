import { NextResponse } from 'next/server';
import { getCategoryById, updateCategory, deleteCategory } from '@/lib/db';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { isSafeUrl } from '@/lib/security';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const category = await getCategoryById(params.id);
    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar categoria.' }, { status: 500 });
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

    if (body.image && !isSafeUrl(body.image)) {
      return NextResponse.json({ error: 'URL da imagem inválida.' }, { status: 400 });
    }

    const updated = await updateCategory(params.id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar categoria.' }, { status: 500 });
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
    const success = await deleteCategory(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Categoria removida com sucesso.' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover categoria.' }, { status: 500 });
  }
}
