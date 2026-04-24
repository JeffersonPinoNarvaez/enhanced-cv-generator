import { NextResponse } from 'next/server';
import { getLlmClientMeta } from '@/lib/llm';

export const runtime = 'nodejs';

/** Expone proveedor y etiqueta del modelo (sin claves API) para mensajes en el cliente. */
export async function GET() {
  return NextResponse.json(getLlmClientMeta());
}
