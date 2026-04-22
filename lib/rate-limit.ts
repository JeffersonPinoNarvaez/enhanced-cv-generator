import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

const GLOBAL_MONTHLY_KEY = 'cv_craft:monthly_count';
const MONTHLY_CAP = 180;

const ipRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '24 h'),
  prefix: 'cv_craft:ip',
});

export function getClientIp(request: NextRequest): string {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) {
    return xf.split(',')[0].trim();
  }
  if (request.ip) {
    return request.ip;
  }
  return '127.0.0.1';
}

/** Segundos hasta el inicio del mes siguiente (contador mensual por calendario). */
function getSecondsUntilEndOfCalendarMonth(): number {
  const now = new Date();
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  return Math.max(1, Math.ceil((startOfNextMonth.getTime() - now.getTime()) / 1000));
}

/**
 * Consumo del cupo por IP (3 generaciones / 24 h, ventana deslizante).
 * Usar una vez por solicitud que debe contar (p. ej. en el handler de /api/analyze).
 */
export async function checkIPLimit(
  ip: string
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const result = await ipRatelimit.limit(ip);
  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Comprueba cuota restante sin consumir (para middleware antes del route handler).
 */
export async function peekIPLimitRemaining(ip: string): Promise<{ remaining: number; reset: number }> {
  return await ipRatelimit.getRemaining(ip);
}

export async function checkGlobalLimit(): Promise<{ allowed: boolean; count: number }> {
  const raw = await redis.get(GLOBAL_MONTHLY_KEY);
  const count = raw == null ? 0 : Number(raw);
  const safe = Number.isFinite(count) ? count : 0;
  if (safe >= MONTHLY_CAP) {
    return { allowed: false, count: safe };
  }
  return { allowed: true, count: safe };
}

export async function incrementGlobalCount(): Promise<void> {
  const ttlSeconds = getSecondsUntilEndOfCalendarMonth();
  await redis.incr(GLOBAL_MONTHLY_KEY);
  const ttl = await redis.ttl(GLOBAL_MONTHLY_KEY);
  if (ttl === -1) {
    await redis.expire(GLOBAL_MONTHLY_KEY, ttlSeconds);
  }
}
