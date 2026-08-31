import { NextResponse } from 'next/server';
import { getAnnotationQueue } from '@/lib/packets/logger';

export async function GET(request: Request) {
  const requested = Number(new URL(request.url).searchParams.get('limit') || '30');
  const limit = Number.isFinite(requested) ? Math.max(1, Math.min(Math.floor(requested), 100)) : 30;
  return NextResponse.json({ success: true, items: getAnnotationQueue(limit) });
}
