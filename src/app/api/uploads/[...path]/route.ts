import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

// Serves files from public/uploads at request time.
// `next start` only serves public/ files that existed when the server booted,
// so anything uploaded through the admin panel afterwards would return 404.
// next.config.mjs rewrites /uploads/* to this route.

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.ogv': 'video/ogg',
};

function notFound() {
  return new NextResponse('Not found', { status: 404 });
}

export async function GET(request: Request, { params }: { params: { path: string[] } }) {
  const filePath = path.resolve(UPLOADS_DIR, ...(params.path || []));

  // Block path traversal (../../etc/passwd)
  if (!filePath.startsWith(UPLOADS_DIR + path.sep)) {
    return notFound();
  }

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()];
  if (!contentType) {
    return notFound();
  }

  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(filePath);
  } catch {
    return notFound();
  }
  if (!stat.isFile()) {
    return notFound();
  }

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
  };

  // Range requests are needed for video seeking (and Safari playback)
  const range = request.headers.get('range');
  const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null;
  if (match && (match[1] || match[2])) {
    let start = match[1] ? parseInt(match[1], 10) : stat.size - parseInt(match[2], 10);
    let end = match[1] && match[2] ? parseInt(match[2], 10) : stat.size - 1;
    start = Math.max(0, start);
    end = Math.min(end, stat.size - 1);

    if (start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${stat.size}` },
      });
    }

    const stream = fs.createReadStream(filePath, { start, end });
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        ...headers,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Content-Length': String(end - start + 1),
      },
    });
  }

  const stream = fs.createReadStream(filePath);
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    headers: { ...headers, 'Content-Length': String(stat.size) },
  });
}
