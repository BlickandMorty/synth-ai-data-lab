import { NextResponse } from 'next/server';
import { getExperimentEvaluationSummary } from '@/lib/packets/logger';

export async function GET(request: Request) {
  const experimentId = new URL(request.url).searchParams.get('experimentId');
  if (!experimentId) return NextResponse.json({ success: false, error: 'experimentId is required' }, { status: 400 });
  return NextResponse.json({ success: true, evaluation: getExperimentEvaluationSummary(experimentId) });
}
