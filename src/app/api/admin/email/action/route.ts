import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { markMessage, moveToTrash } from '@/lib/mailService';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });

    const { action, uid, folder } = body;
    const parsedUid = parseInt(String(uid), 10);

    if (!parsedUid || parsedUid <= 0) {
      return NextResponse.json({ error: 'UID inválido.' }, { status: 400 });
    }

    if (!folder || typeof folder !== 'string') {
      return NextResponse.json({ error: 'Pasta inválida.' }, { status: 400 });
    }

    switch (action) {
      case 'mark-read':
        await markMessage(parsedUid, folder, 'read');
        break;
      case 'mark-unread':
        await markMessage(parsedUid, folder, 'unread');
        break;
      case 'trash':
        await moveToTrash(parsedUid, folder);
        break;
      default:
        return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Email Action] Erro:', error?.message || error);
    return NextResponse.json(
      { error: 'Não foi possível executar a ação no servidor de e-mail.' },
      { status: 503 }
    );
  }
}
