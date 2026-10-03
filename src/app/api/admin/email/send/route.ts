import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import path from 'path';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { sendMail } from '@/lib/mailService';
import { checkRateLimit, getClientIp } from '@/lib/security';

const MAIL_USER = process.env.MAIL_USER || 'comercial@tech7electronics.com';

// Dangerous file extensions that must NEVER be accepted as attachments
const DANGEROUS_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.ps1',
  '.scr',
  '.msi',
  '.com',
  '.vbs',
  '.js',
  '.mjs',
  '.cjs',
  '.sh',
  '.bash',
  '.php',
  '.phtml',
  '.py',
  '.jar',
  '.dll',
  '.vbe',
  '.jse',
  '.wsf',
  '.wsh',
  '.msc',
  '.reg',
  '.hta',
  '.cpl',
]);

// Allowed file extensions whitelist
const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.zip',
  '.txt',
  '.csv',
  '.odt',
  '.ods',
  '.odp',
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_TOTAL_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB total
const MAX_FILES_COUNT = 10;

function sanitizeSubject(subject: string): string {
  return subject.replace(/[\r\n]/g, ' ').slice(0, 500).trim();
}

function sanitizeAddress(addr: string): string {
  return addr.replace(/[\r\n]/g, '').slice(0, 320).trim();
}

function sanitizeFilename(filename: string): string {
  // Strip path traversal attempts and sanitize characters
  const basename = path.basename(filename).replace(/[\/\\]/g, '');
  return basename.replace(/[^a-zA-Z0-9._\- ]/g, '_').slice(0, 200);
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`${ip}:${session.userId}`, {
    keyPrefix: 'email_send',
    limit: 20,
    windowMs: 60 * 1000,
    blockDurationMs: 2 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Limite de envios por minuto atingido. Aguarde alguns instantes.' },
      { status: 429 }
    );
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let to = '';
    let subject = '';
    let html = '';
    let text = '';
    let cc: string | undefined;
    let bcc: string | undefined;
    let inReplyTo: string | undefined;
    let references: string | undefined;
    const attachmentsToProcess: Array<{ filename: string; content: Buffer; contentType: string }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      to = sanitizeAddress(String(formData.get('to') || ''));
      subject = sanitizeSubject(String(formData.get('subject') || ''));
      html = String(formData.get('html') || formData.get('bodyHtml') || '');
      text = String(formData.get('text') || '');
      cc = formData.get('cc') ? sanitizeAddress(String(formData.get('cc'))) : undefined;
      bcc = formData.get('bcc') ? sanitizeAddress(String(formData.get('bcc'))) : undefined;
      inReplyTo = formData.get('inReplyTo') ? String(formData.get('inReplyTo')).slice(0, 500) : undefined;
      references = formData.get('references') ? String(formData.get('references')).slice(0, 1000) : undefined;

      const rawFiles = formData.getAll('attachments') as File[];
      if (rawFiles.length > MAX_FILES_COUNT) {
        return NextResponse.json(
          { error: `Limite máximo de ${MAX_FILES_COUNT} arquivos por e-mail excedido.` },
          { status: 400 }
        );
      }

      let totalBytes = 0;

      for (const file of rawFiles) {
        if (!file || typeof file.size !== 'number' || file.size === 0) continue;

        // Individual size limit
        if (file.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            { error: `O arquivo "${file.name}" excede o tamanho máximo permitido de 10 MB.` },
            { status: 400 }
          );
        }

        totalBytes += file.size;
        if (totalBytes > MAX_TOTAL_SIZE_BYTES) {
          return NextResponse.json(
            { error: 'O tamanho total dos anexos excede o limite máximo permitido de 25 MB.' },
            { status: 400 }
          );
        }

        const ext = path.extname(file.name).toLowerCase();

        // Strict blacklist
        if (DANGEROUS_EXTENSIONS.has(ext)) {
          return NextResponse.json(
            { error: `O arquivo "${file.name}" possui formato executável ou potencialmente perigoso não permitido.` },
            { status: 400 }
          );
        }

        // Whitelist validation
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          return NextResponse.json(
            { error: `Extensão de arquivo não permitida (${ext}). Permitidos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, WEBP, ZIP.` },
            { status: 400 }
          );
        }

        const safeFilename = sanitizeFilename(file.name || 'anexo');
        const arrayBuffer = await file.arrayBuffer();
        const content = Buffer.from(arrayBuffer);

        attachmentsToProcess.push({
          filename: safeFilename,
          content,
          contentType: file.type || 'application/octet-stream',
        });
      }
    } else {
      // Standard JSON
      const body = await request.json().catch(() => null);
      if (!body) {
        return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
      }

      to = sanitizeAddress(String(body.to || ''));
      subject = sanitizeSubject(String(body.subject || ''));
      html = String(body.html || body.bodyHtml || '');
      text = String(body.text || '');
      cc = body.cc ? sanitizeAddress(String(body.cc)) : undefined;
      bcc = body.bcc ? sanitizeAddress(String(body.bcc)) : undefined;
      inReplyTo = body.inReplyTo ? String(body.inReplyTo).slice(0, 500) : undefined;
      references = body.references ? String(body.references).slice(0, 1000) : undefined;
    }

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Destinatário, assunto e corpo são obrigatórios.' },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const toEmails = to.split(',').map((e) => e.trim());
    for (const addr of toEmails) {
      if (addr && !emailRegex.test(addr)) {
        return NextResponse.json(
          { error: `Endereço de e-mail inválido: ${addr}` },
          { status: 400 }
        );
      }
    }

    await sendMail({
      to,
      cc,
      bcc,
      subject,
      html,
      text,
      replyTo: MAIL_USER,
      inReplyTo,
      references,
      attachments: attachmentsToProcess.length > 0 ? attachmentsToProcess : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Email Send] Erro:', error?.message || error);
    return NextResponse.json(
      { error: 'Não foi possível enviar o e-mail. Verifique as configurações do servidor de e-mail.' },
      { status: 503 }
    );
  }
}
