import { NextResponse } from 'next/server';
import { getAllExperiments } from '@/lib/packets/logger';
import { db } from '@/lib/db';
import { experiments } from '@/lib/db/schema';
import { generateId } from '@/lib/utils';

export async function GET() {
  try {
    const list = getAllExperiments();
    return NextResponse.json({ success: true, experiments: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newExp = {
      id: generateId('exp'),
      title: body.title,
      description: body.description || '',
      category: body.category || 'general',
      status: 'active',
      modelTarget: body.modelTarget || 'open-transformer',
      runCount: 0,
      packetCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    db.insert(experiments).values(newExp).run();
    return NextResponse.json({ success: true, experiment: newExp });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
