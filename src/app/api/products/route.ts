import { NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/db';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { isSafeUrl } from '@/lib/security';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId') || undefined;
    const brand = searchParams.get('brand') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = (searchParams.get('sortBy') as any) || undefined;
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam !== null ? isActiveParam === 'true' : undefined;

    const products = await getProducts({
      categoryId,
      brand,
      search,
      sortBy,
      isActive,
    });

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar produtos.' }, { status: 500 });
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

    if (!body || !body.name || !body.sku || !body.categoryId) {
      return NextResponse.json(
        { error: 'Nome, SKU e Categoria são obrigatórios.' },
        { status: 400 }
      );
    }

    const name = String(body.name).slice(0, 150).trim();
    const sku = String(body.sku).slice(0, 50).trim();
    const categoryId = String(body.categoryId).trim();
    const brand = String(body.brand || 'TECH7').slice(0, 80).trim();
    const model = String(body.model || '').slice(0, 80).trim();
    const shortDesc = String(body.shortDesc || '').slice(0, 500).trim();
    const description = String(body.description || '').slice(0, 10000).trim();
    const mainImage = String(body.mainImage || '/brand/logo.svg').slice(0, 500).trim();

    if (!isSafeUrl(mainImage)) {
      return NextResponse.json({ error: 'URL da imagem principal inválida.' }, { status: 400 });
    }

    const galleryImages = Array.isArray(body.galleryImages)
      ? body.galleryImages.filter((img: any) => typeof img === 'string' && isSafeUrl(img)).slice(0, 10)
      : [];

    // Gerar slug seguro
    const slug = (body.slug ? String(body.slug) : name)
      .slice(0, 100)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newProduct = await createProduct({
      name,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      sku,
      brand,
      model,
      categoryId,
      shortDesc,
      description,
      features: Array.isArray(body.features)
        ? body.features.map((f: any) => String(f).slice(0, 200).trim()).slice(0, 20)
        : [],
      specs: typeof body.specs === 'object' && body.specs !== null ? body.specs : {},
      mainImage,
      galleryImages,
      order: Number(body.order) || 0,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar produto.' }, { status: 500 });
  }
}
