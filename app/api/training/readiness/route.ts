import { NextResponse } from 'next/server';
import { getDatasetSummary } from '@/lib/packets/logger';

export async function GET() {
  const summary = getDatasetSummary();
  const engineUrl = process.env.SYNTH_ENGINE_URL || 'http://127.0.0.1:8020';
  try {
    const response = await fetch(`${engineUrl}/v1/training-readiness`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preference_pairs: summary.eligiblePreferencePairs }),
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json();
    if (!response.ok) return NextResponse.json({ success: false, error: result.detail || 'Training readiness could not run.' }, { status: response.status });
    return NextResponse.json({ success: true, result });
  } catch {
    return NextResponse.json({ success: false, error: 'The Python engine is not running.' }, { status: 503 });
  }
}
