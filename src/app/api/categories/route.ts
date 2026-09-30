import { NextResponse } from 'next/server';
import { getCategories, createCategory } from '@/lib/db';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { isSafeUrl } from '@/lib/security';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao carregar categorias.' }, { status: 500 });
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

    if (!body || !body.name) {
      return NextResponse.json({ error: 'Nome da categoria é obrigatório.' }, { status: 400 });
    }

    const name = String(body.name).slice(0, 100).trim();
    const description = String(body.description || '').slice(0, 1000).trim();
    const image = String(body.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80').slice(0, 500).trim();

    if (!isSafeUrl(image)) {
      return NextResponse.json({ error: 'URL da imagem da categoria inválida.' }, { status: 400 });
    }

    const slug = (body.slug ? String(body.slug) : name)
      .slice(0, 100)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newCat = await createCategory({
      name,
      slug: slug || `cat-${Date.now()}`,
      description,
      image,
      order: Number(body.order) || 0,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    });

    return NextResponse.json(newCat, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar categoria.' }, { status: 500 });
  }
}
