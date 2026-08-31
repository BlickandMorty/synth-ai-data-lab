import { NextResponse } from 'next/server';
import { saveAnnotation } from '@/lib/packets/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const annotation = saveAnnotation(body);
    return NextResponse.json({ success: true, annotation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
