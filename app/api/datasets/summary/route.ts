import { NextResponse } from 'next/server';
import { getDatasetSummary } from '@/lib/packets/logger';

export async function GET() {
  return NextResponse.json({ success: true, summary: getDatasetSummary() });
}
