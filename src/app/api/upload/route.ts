import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { verifyToken, AUTH_COOKIE_NAME, isUserAdmin } from '@/lib/auth';
import { checkRateLimit, getClientIp, sanitizeSvgContent, logSecurityEvent } from '@/lib/security';
import { cookies } from 'next/headers';

// Allowed MIME types and their corresponding allowed file extensions
const ALLOWED_MIME_MAP: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov'],
  'video/ogg': ['.ogv'],
};

// Strict folder whitelist to prevent arbitrary directory creation
const ALLOWED_FOLDERS = [
  'geral',
  'produtos',
  'categorias',
  'clientes',
  'videos',
  'avaliacoes',
  'branding',
  'marca',
  'thumbnails',
];

// Dangerous file extensions that must NEVER be written to the server
const DANGEROUS_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.ps1',
  '.php',
  '.phtml',
  '.php5',
  '.js',
  '.mjs',
  '.cjs',
  '.html',
  '.htm',
  '.asp',
  '.aspx',
  '.jsp',
  '.sh',
  '.bash',
  '.vbs',
  '.cgi',
  '.pl',
  '.py',
  '.jar',
];

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  const clientIp = getClientIp(request);

  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Rate limiting: max 30 uploads per minute per user/IP
  const rateLimit = checkRateLimit(`${clientIp}:${session.userId}`, {
    keyPrefix: 'upload_rate',
    limit: 30,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Limite de uploads por minuto excedido. Aguarde alguns instantes.' },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const requestedFolder = ((formData.get('folder') as string) || 'geral').toLowerCase().trim();

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // 1. Strict Folder Validation
    const safeFolder = ALLOWED_FOLDERS.includes(requestedFolder) ? requestedFolder : 'geral';

    // 2. MIME Type Validation
    const allowedExtensions = ALLOWED_MIME_MAP[file.type];
    if (!allowedExtensions) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Formatos aceitos: JPG, PNG, WEBP, SVG e vídeos MP4, WEBM, MOV.' },
        { status: 400 }
      );
    }

    // 3. File Extension Matching
    const rawExt = path.extname(file.name || '').toLowerCase();
    
    // Explicit blacklist check
    if (DANGEROUS_EXTENSIONS.includes(rawExt)) {
      logSecurityEvent({
        type: 'FORBIDDEN_ACTION_ATTEMPT',
        ip: clientIp,
        userId: session.userId,
        userEmail: session.email,
        details: { action: 'upload dangerous extension', filename: file.name },
      });
      return NextResponse.json(
        { error: 'Tipo de extensão proibida por segurança.' },
        { status: 400 }
      );
    }

    // Must match the approved extensions for the declared MIME type
    const validExt = allowedExtensions.includes(rawExt) ? rawExt : allowedExtensions[0];

    // 4. File Size Limits
    const isVideo = file.type.startsWith('video/');
    const isSvg = file.type === 'image/svg+xml' || validExt === '.svg';
    const maxSize = isVideo ? 100 * 1024 * 1024 : (isSvg ? 5 * 1024 * 1024 : 15 * 1024 * 1024);

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Tamanho excede o limite permitido (${isVideo ? '100MB' : isSvg ? '5MB' : '15MB'}).` },
        { status: 400 }
      );
    }

    let buffer = Buffer.from(await file.arrayBuffer());

    // 5. SVG Security & Role Check
    if (isSvg) {
      // SVG upload restricted strictly to ADMINISTRADOR
      if (!isUserAdmin(session.role)) {
        logSecurityEvent({
          type: 'FORBIDDEN_ACTION_ATTEMPT',
          ip: clientIp,
          userId: session.userId,
          userEmail: session.email,
          details: { action: 'upload SVG as non-admin', role: session.role },
        });
        return NextResponse.json(
          { error: 'Apenas administradores têm permissão para enviar arquivos SVG.' },
          { status: 403 }
        );
      }

      // Sanitize SVG text
      const svgText = buffer.toString('utf-8');
      const { isSafe, reason } = sanitizeSvgContent(svgText);
      if (!isSafe) {
        logSecurityEvent({
          type: 'FORBIDDEN_ACTION_ATTEMPT',
          ip: clientIp,
          userId: session.userId,
          userEmail: session.email,
          details: { action: 'upload unsafe SVG', reason },
        });
        return NextResponse.json(
          { error: reason || 'Arquivo SVG não aprovado pelas diretrizes de segurança.' },
          { status: 400 }
        );
      }
    }

    // 6. Safe Path Resolution & Directory Traversal Prevention
    const uploadsBaseDir = path.resolve(process.cwd(), 'public', 'uploads');
    const uploadDir = path.resolve(uploadsBaseDir, safeFolder);

    // Verify the resolved folder is strictly inside public/uploads
    if (!uploadDir.startsWith(uploadsBaseDir)) {
      return NextResponse.json({ error: 'Diretório de destino inválido.' }, { status: 400 });
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 7. Safe Server-Side Unique Filename Generation
    const safeUniqueName = `${crypto.randomUUID()}${validExt}`;
    const filePath = path.resolve(uploadDir, safeUniqueName);

    // Verify the resolved file path is strictly inside uploadDir
    if (!filePath.startsWith(uploadDir)) {
      return NextResponse.json({ error: 'Caminho de arquivo inválido.' }, { status: 400 });
    }

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeFolder}/${safeUniqueName}`;

    logSecurityEvent({
      type: 'FILE_UPLOAD',
      ip: clientIp,
      userId: session.userId,
      userEmail: session.email,
      details: { folder: safeFolder, fileName: safeUniqueName, mimeType: file.type, size: file.size },
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: safeUniqueName,
    });
  } catch (error) {
    // Return generic error message in production
    return NextResponse.json(
      { error: 'Erro no processamento do upload. Verifique o arquivo e tente novamente.' },
      { status: 500 }
    );
  }
}
