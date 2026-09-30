import { NextResponse } from 'next/server';
import { updateClient, deleteClient } from '@/lib/db';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { isSafeUrl } from '@/lib/security';
import { cookies } from 'next/headers';

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

    if (body.logo && !isSafeUrl(body.logo)) {
      return NextResponse.json({ error: 'URL do logo inválida.' }, { status: 400 });
    }

    if (body.website && !isSafeUrl(body.website)) {
      return NextResponse.json({ error: 'URL do website inválida.' }, { status: 400 });
    }

    const updated = await updateClient(params.id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar cliente.' }, { status: 500 });
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
    const success = await deleteClient(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Cliente removido com sucesso.' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover cliente.' }, { status: 500 });
  }
}
