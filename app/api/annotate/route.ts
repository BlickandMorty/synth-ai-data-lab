import { NextResponse } from 'next/server';
import { getPacketById, saveAnnotation } from '@/lib/packets/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.comparisonPairId) {
      const primary = getPacketById(body.packetId);
      const comparison = getPacketById(body.comparisonPairId);
      const primaryInput = primary ? (typeof primary.input === 'string' ? primary.input : JSON.stringify(primary.input)) : '';
      const comparisonInput = comparison ? (typeof comparison.input === 'string' ? comparison.input : JSON.stringify(comparison.input)) : '';
      if (!primary || !comparison || primary.id === comparison.id) {
        return NextResponse.json({ success: false, error: 'Choose two different existing packets.' }, { status: 400 });
      }
      if (primary.type !== 'completion' || comparison.type !== 'completion' || !primary.output || !comparison.output) {
        return NextResponse.json({ success: false, error: 'Preference review requires two completion packets.' }, { status: 400 });
      }
      if (primaryInput !== comparisonInput) {
        return NextResponse.json({ success: false, error: 'Preference review requires the exact same prompt on both packets.' }, { status: 400 });
      }
      if (primary.provider === 'simulator' || comparison.provider === 'simulator') {
        return NextResponse.json({ success: false, error: 'Simulator output cannot be saved as a preference pair.' }, { status: 400 });
      }
    }
    const annotation = saveAnnotation(body);
    return NextResponse.json({ success: true, annotation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
