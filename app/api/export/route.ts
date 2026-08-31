import { exportPacketsAsJsonl, exportPreferencePairsAsJsonl } from '@/lib/packets/logger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'packets';
  const content = format === 'preferences' ? exportPreferencePairsAsJsonl() : exportPacketsAsJsonl();
  const filename = format === 'preferences' ? 'synth-preference-pairs.jsonl' : 'synth-packets.jsonl';

  return new Response(content, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
