import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { fetchMessage } from '@/lib/mailService';

export async function GET(
  request: Request,
  { params }: { params: { uid: string } }
) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  const uid = parseInt(params.uid, 10);
  if (isNaN(uid) || uid <= 0) {
    return NextResponse.json({ error: 'UID inválido.' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'INBOX';
    const message = await fetchMessage(uid, folder);
    if (!message) {
      return NextResponse.json({ error: 'Mensagem não encontrada.' }, { status: 404 });
    }
    return NextResponse.json(message);
  } catch (error: any) {
    console.error('[Email Message] Erro:', error?.message || error);
    return NextResponse.json(
      { error: 'Não foi possível carregar a mensagem.' },
      { status: 503 }
    );
  }
}
