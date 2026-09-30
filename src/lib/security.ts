import bcrypt from 'bcryptjs';

// Pre-computed dummy bcrypt hash for timing attack mitigation during login
// (Prevents timing discrepancies when an email does not exist)
export const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

// ============================================================================
// IN-MEMORY RATE LIMITER
// ============================================================================
interface RateLimitRecord {
  count: number;
  firstRequest: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup to avoid memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      if (record.blockedUntil && record.blockedUntil < now) {
        rateLimitStore.delete(key);
      } else if (now - record.firstRequest > 3600000) {
        // Remove records older than 1 hour
        rateLimitStore.delete(key);
      }
    });
  }, 300000); // Every 5 minutes
}

export interface RateLimitOptions {
  keyPrefix: string;
  limit: number;
  windowMs: number;
  blockDurationMs?: number;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const key = `${options.keyPrefix}:${identifier}`;
  const record = rateLimitStore.get(key);

  if (!record) {
    rateLimitStore.set(key, { count: 1, firstRequest: now });
    return { allowed: true, remaining: options.limit - 1 };
  }

  // Check if currently blocked
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  // Check if the current window has expired
  if (now - record.firstRequest > options.windowMs) {
    // Reset window
    record.count = 1;
    record.firstRequest = now;
    delete record.blockedUntil;
    return { allowed: true, remaining: options.limit - 1 };
  }

  // Increment count
  record.count += 1;

  if (record.count > options.limit) {
    const blockDuration = options.blockDurationMs || options.windowMs;
    record.blockedUntil = now + blockDuration;
    const retryAfterSeconds = Math.ceil(blockDuration / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return { allowed: true, remaining: options.limit - record.count };
}

export function resetRateLimit(keyPrefix: string, identifier: string): void {
  const key = `${keyPrefix}:${identifier}`;
  rateLimitStore.delete(key);
}

// ============================================================================
// CLIENT IP EXTRACTION
// ============================================================================
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // The first IP in the list is the client IP
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

// ============================================================================
// OPEN REDIRECT SANITIZATION
// ============================================================================
export function sanitizeRedirectUrl(rawUrl: string | null | undefined, defaultUrl: string = '/admin'): string {
  if (!rawUrl) return defaultUrl;

  const trimmed = rawUrl.trim();

  // Must start with a single slash
  if (!trimmed.startsWith('/')) {
    return defaultUrl;
  }

  // Reject protocol-relative URLs like '//evil.com'
  if (trimmed.startsWith('//')) {
    return defaultUrl;
  }

  // Reject backslash tricks like '/\evil.com'
  if (trimmed.startsWith('/\\')) {
    return defaultUrl;
  }

  // Reject anything containing colon before slash to prevent javascript: or http: bypasses
  const firstSlashIndex = trimmed.indexOf('/', 1);
  const colonIndex = trimmed.indexOf(':');
  if (colonIndex !== -1 && (firstSlashIndex === -1 || colonIndex < firstSlashIndex)) {
    return defaultUrl;
  }

  return trimmed;
}

// ============================================================================
// SVG SANITIZATION & SECURITY
// ============================================================================
export function sanitizeSvgContent(svgString: string): { isSafe: boolean; sanitizedSvg: string; reason?: string } {
  // Check for dangerous scripts or active execution vectors
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /data:image\/svg\+xml;base64/gi,
    /<foreignObject\b/gi,
    /\bon\w+\s*=/gi, // event handlers like onload=, onerror=, onclick=
    /<iframe\b/gi,
    /<embed\b/gi,
    /<object\b/gi,
    /<link\b/gi,
    /<meta\b/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(svgString)) {
      return {
        isSafe: false,
        sanitizedSvg: '',
        reason: 'O arquivo SVG contém elementos ou scripts não permitidos por motivos de segurança.',
      };
    }
  }

  // Ensure it is a valid SVG root
  if (!svgString.includes('<svg') || !svgString.includes('</svg>')) {
    return {
      isSafe: false,
      sanitizedSvg: '',
      reason: 'Estrutura SVG inválida.',
    };
  }

  return { isSafe: true, sanitizedSvg: svgString };
}

// ============================================================================
// SECURITY AUDIT LOGGING (SAFE - NEVER LOGS SENSITIVE CREDENTIALS)
// ============================================================================
export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'RATE_LIMIT_TRIGGERED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'FORBIDDEN_ACTION_ATTEMPT'
  | 'PASSWORD_CHANGE'
  | 'USER_CREATED'
  | 'SETTINGS_UPDATED'
  | 'FILE_UPLOAD';

export interface SecurityEventData {
  type: SecurityEventType;
  ip?: string;
  userEmail?: string;
  userId?: string;
  details?: Record<string, any>;
}

export function logSecurityEvent(data: SecurityEventData): void {
  const timestamp = new Date().toISOString();
  const safeData = {
    timestamp,
    type: data.type,
    ip: data.ip || 'unknown',
    user: data.userEmail || data.userId || 'anonymous',
    details: data.details || {},
  };

  // Safe structured output for server audit logs
  console.info(`[SECURITY_AUDIT] ${JSON.stringify(safeData)}`);
}

// ============================================================================
// SAFE URL VALIDATION (blocks javascript:, vbscript:, data:text/html, etc.)
// ============================================================================
export function isSafeUrl(url?: string | null): boolean {
  if (!url) return true; // empty is allowed if optional
  const trimmed = url.trim();
  if (trimmed === '') return true;

  // Relative URLs starting with /
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return true;
  }

  // Absolute URLs starting with http:// or https://
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
