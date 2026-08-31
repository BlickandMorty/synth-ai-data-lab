import { NextResponse } from 'next/server';
import { getAllExperiments, getExperimentEvaluationSummary, getPacketsForExperiment, getRunsForExperiment } from '@/lib/packets/logger';

function markdownEscape(value: string) {
  return value.replace(/\r?\n/g, ' ').trim();
}

export async function GET(request: Request) {
  const experimentId = new URL(request.url).searchParams.get('experimentId');
  if (!experimentId) return NextResponse.json({ success: false, error: 'experimentId is required' }, { status: 400 });

  const experiment = getAllExperiments().find((item) => item.id === experimentId);
  if (!experiment) return NextResponse.json({ success: false, error: 'Experiment not found' }, { status: 404 });

  const packets = getPacketsForExperiment(experimentId, 10000);
  const runs = getRunsForExperiment(experimentId);
  const evaluation = getExperimentEvaluationSummary(experimentId);
  const byType = Object.entries(packets.reduce<Record<string, number>>((counts, packet) => {
    counts[packet.type] = (counts[packet.type] || 0) + 1;
    return counts;
  }, {}));
  const rubricLines = Object.entries(evaluation.rubricAverages).map(([name, value]) => `- ${name}: ${value ?? 'no score'}`);
  const preferenceLines = Object.entries(evaluation.preferences).map(([name, count]) => `- ${name}: ${count}`);
  const created = new Date(experiment.createdAt).toISOString();
  const report = `# ${markdownEscape(experiment.title)}\n\n` +
    `Generated locally by SYNTH on ${new Date().toISOString()}.\n\n` +
    `## Question and scope\n\n` +
    `${markdownEscape(experiment.description || 'No description was recorded for this experiment.')}\n\n` +
    `- Category: ${experiment.category}\n- Target: ${experiment.modelTarget}\n- Status: ${experiment.status}\n- Journal created: ${created}\n\n` +
    `## Recorded evidence\n\n` +
    `- Formal runs: ${runs.length}\n- Packets: ${packets.length}\n` +
    (byType.length ? byType.map(([type, count]) => `- ${type} packets: ${count}`).join('\n') + '\n' : '') +
    `\n## Human review signal\n\n` +
    `- Local reviews: ${evaluation.annotations}\n` +
    (preferenceLines.length ? `${preferenceLines.join('\n')}\n` : '- No preference decisions have been saved.\n') +
    `\n### Rubric averages\n\n` +
    (rubricLines.length ? rubricLines.join('\n') : '- No rubric scores have been saved.') +
    `\n\n## Reproducibility notes\n\n` +
    `- The packet timeline in the local SYNTH journal retains model, provider, input/output, UAS-style address, and integrity digest for each packet.\n` +
    `- This report summarizes what was saved locally. It does not establish factual correctness, model capability, causality, or a trained-model result.\n` +
    `- Reviewer averages are human judgments from this local dataset, not a benchmark score.\n`;

  const filename = `synth-${experiment.id}-report.md`;
  return new NextResponse(report, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
