import { NextResponse } from 'next/server';
import { getClients, createClient } from '@/lib/db';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { isSafeUrl } from '@/lib/security';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const clients = await getClients();
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao carregar clientes.' }, { status: 500 });
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

    if (!body || !body.name || !body.logo) {
      return NextResponse.json({ error: 'Nome e logo do cliente são obrigatórios.' }, { status: 400 });
    }

    const name = String(body.name).slice(0, 100).trim();
    const logo = String(body.logo).slice(0, 500).trim();
    const website = String(body.website || '').slice(0, 500).trim();

    if (!isSafeUrl(logo)) {
      return NextResponse.json({ error: 'URL do logo inválida.' }, { status: 400 });
    }

    if (website && !isSafeUrl(website)) {
      return NextResponse.json({ error: 'URL do website inválida.' }, { status: 400 });
    }

    const newClient = await createClient({
      name,
      logo,
      website,
      order: Number(body.order) || 0,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    });

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao cadastrar cliente.' }, { status: 500 });
  }
}
