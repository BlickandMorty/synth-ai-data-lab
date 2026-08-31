import { NextResponse } from 'next/server';
import { exportPacketsAsJsonl } from '@/lib/packets/logger';

export async function POST() {
  const records = exportPacketsAsJsonl().split('\n').filter(Boolean).map((line) => JSON.parse(line));
  const engineUrl = process.env.SYNTH_ENGINE_URL || 'http://127.0.0.1:8020';
  try {
    const response = await fetch(`${engineUrl}/v1/validate-packets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (!response.ok) return NextResponse.json({ success: false, error: result.detail || 'Python preflight failed.' }, { status: response.status });
    return NextResponse.json({ success: true, result });
  } catch {
    return NextResponse.json({ success: false, error: 'The Python engine is not running. Start SYNTH with scripts\\start-synth.ps1.' }, { status: 503 });
  }
}
