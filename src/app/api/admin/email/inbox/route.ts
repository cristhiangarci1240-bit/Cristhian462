import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { listMessages } from '@/lib/mailService';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'inbox';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);
    const search = searchParams.get('search') || undefined;

    const result = await listMessages({ folder, page, pageSize, search });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Email Inbox] Erro:', error?.message || error);
    return NextResponse.json(
      { error: 'Não foi possível carregar os e-mails. Verifique a configuração da conta de e-mail.' },
      { status: 503 }
    );
  }
}
