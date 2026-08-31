import { exportDatasetManifest, exportPacketsAsJsonl, exportPreferencePairsAsJsonl } from '@/lib/packets/logger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'packets';
  if (format === 'manifest') {
    return new Response(JSON.stringify(exportDatasetManifest(), null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="synth-dataset-manifest.json"',
      },
    });
  }
  const content = format === 'preferences' ? exportPreferencePairsAsJsonl() : exportPacketsAsJsonl();
  const filename = format === 'preferences' ? 'synth-preference-pairs.jsonl' : 'synth-packets.jsonl';

  return new Response(content, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
