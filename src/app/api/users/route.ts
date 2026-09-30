import { NextResponse } from 'next/server';
import { getUsers, createUser, updateUserPassword } from '@/lib/db';
import { verifyToken, AUTH_COOKIE_NAME, isUserAdmin } from '@/lib/auth';
import { logSecurityEvent, getClientIp } from '@/lib/security';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  const clientIp = getClientIp(request);

  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Apenas Administradores podem visualizar a lista de usuários do sistema
  if (!isUserAdmin(session.role)) {
    logSecurityEvent({
      type: 'FORBIDDEN_ACTION_ATTEMPT',
      ip: clientIp,
      userId: session.userId,
      userEmail: session.email,
      details: { action: 'GET /api/users', role: session.role },
    });
    return NextResponse.json(
      { error: 'Acesso negado. Apenas administradores podem gerenciar usuários.' },
      { status: 403 }
    );
  }

  const users = await getUsers();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  const clientIp = getClientIp(request);

  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Apenas Administradores podem criar novos usuários
  if (!isUserAdmin(session.role)) {
    logSecurityEvent({
      type: 'FORBIDDEN_ACTION_ATTEMPT',
      ip: clientIp,
      userId: session.userId,
      userEmail: session.email,
      details: { action: 'POST /api/users', role: session.role },
    });
    return NextResponse.json(
      { error: 'Acesso negado. Apenas administradores podem criar usuários.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.name || !body.email || !body.password) {
      return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios.' }, { status: 400 });
    }

    const name = String(body.name).trim();
    const email = String(body.email).trim().toLowerCase();
    const password = String(body.password);
    const roleInput = String(body.role || 'EDITOR').toUpperCase();
    const role = roleInput === 'ADMIN' ? 'ADMIN' : 'EDITOR';

    // Validações de tamanho e formato
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: 'Nome deve ter entre 2 e 100 caracteres.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 150) {
      return NextResponse.json({ error: 'Formato de e-mail inválido.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'A senha deve possuir no mínimo 8 caracteres.' }, { status: 400 });
    }

    if (password.length > 128) {
      return NextResponse.json({ error: 'A senha excede o limite máximo permitido.' }, { status: 400 });
    }

    const newUser = await createUser(name, email, password, role);

    logSecurityEvent({
      type: 'USER_CREATED',
      ip: clientIp,
      userId: session.userId,
      userEmail: session.email,
      details: { newUserId: newUser.id, newUserEmail: newUser.email, role: newUser.role },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar usuário.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  const clientIp = getClientIp(request);

  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.id || !body.newPassword) {
      return NextResponse.json({ error: 'ID e nova senha são obrigatórios.' }, { status: 400 });
    }

    const targetUserId = String(body.id);
    const newPassword = String(body.newPassword);

    // Permissão: Apenas ADMIN pode alterar senhas de outros usuários; usuários comuns só podem alterar a própria senha
    const isTargetingSelf = session.userId === targetUserId;
    if (!isUserAdmin(session.role) && !isTargetingSelf) {
      logSecurityEvent({
        type: 'FORBIDDEN_ACTION_ATTEMPT',
        ip: clientIp,
        userId: session.userId,
        userEmail: session.email,
        details: { action: 'PUT /api/users (updatePassword)', targetUserId },
      });
      return NextResponse.json(
        { error: 'Acesso negado. Você só tem permissão para alterar a sua própria senha.' },
        { status: 403 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'A nova senha deve possuir no mínimo 8 caracteres.' }, { status: 400 });
    }

    if (newPassword.length > 128) {
      return NextResponse.json({ error: 'A nova senha excede o limite permitido.' }, { status: 400 });
    }

    const success = await updateUserPassword(targetUserId, newPassword);
    if (!success) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    logSecurityEvent({
      type: 'PASSWORD_CHANGE',
      ip: clientIp,
      userId: session.userId,
      userEmail: session.email,
      details: { targetUserId },
    });

    return NextResponse.json({ success: true, message: 'Senha atualizada com sucesso.' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao alterar senha.' }, { status: 500 });
  }
}
