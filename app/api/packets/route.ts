import { NextResponse } from 'next/server';
import { getAllPackets, logPacket } from '@/lib/packets/logger';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const packets = getAllPackets(limit);
    return NextResponse.json({ success: true, packets });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const packet = await logPacket(body);
    return NextResponse.json({ success: true, packet });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
