import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getClientIp, peekIPLimitRemaining } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  if (request.method !== 'POST' || request.nextUrl.pathname !== '/api/analyze') {
    return NextResponse.next();
  }

  try {
    const ip = getClientIp(request);
    const { remaining, reset } = await peekIPLimitRemaining(ip);

    if (remaining <= 0) {
      return NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          message: 'Has alcanzado el límite de 3 CVs por día. Vuelve mañana.',
          reset,
        },
        { status: 429 }
      );
    }
  } catch (e) {
    console.error('middleware rate limit error:', e);
    return NextResponse.json(
      {
        error: 'service_unavailable',
        message: 'No se pudo verificar el límite de uso. Inténtalo más tarde.',
      },
      { status: 503 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/analyze',
};
