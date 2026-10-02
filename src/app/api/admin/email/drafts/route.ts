import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { getDrafts, upsertDraft, deleteDraft } from '@/lib/emailDb';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });

  try {
    const drafts = await getDrafts();
    return NextResponse.json(drafts);
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar rascunhos.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });

  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });

    const draft = await upsertDraft({
      id: body.id,
      to: String(body.to || '').slice(0, 1000),
      cc: body.cc ? String(body.cc).slice(0, 1000) : undefined,
      bcc: body.bcc ? String(body.bcc).slice(0, 1000) : undefined,
      subject: String(body.subject || '').slice(0, 500),
      bodyHtml: String(body.bodyHtml || '').slice(0, 200000),
      bodyText: body.bodyText ? String(body.bodyText).slice(0, 50000) : undefined,
      inReplyToUid: body.inReplyToUid ? parseInt(body.inReplyToUid, 10) : undefined,
      inReplyToFolder: body.inReplyToFolder || undefined,
      isForward: Boolean(body.isForward),
    });

    return NextResponse.json(draft, { status: body.id ? 200 : 201 });
  } catch {
    return NextResponse.json({ error: 'Erro ao salvar rascunho.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID do rascunho não informado.' }, { status: 400 });

    const deleted = await deleteDraft(id);
    if (!deleted) return NextResponse.json({ error: 'Rascunho não encontrado.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir rascunho.' }, { status: 500 });
  }
}
