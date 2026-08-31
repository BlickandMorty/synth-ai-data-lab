export type ResearchProject = {
  name: string;
  role: string;
  status: string;
  description: string;
  url: string;
};

// This is intentionally a small map of the projects that still represent the
// current public direction. It is not a claim that every repository is equally
// mature or that every experiment has a result.
export const CANON_RESEARCH_PROJECTS: ResearchProject[] = [
  {
    name: 'Epistemos',
    role: 'Research workspace',
    status: 'Paused / v0.9.5 direction',
    description: 'The graph-first research environment. SYNTH is its local data, annotation, and experiment companion rather than a replacement.',
    url: 'https://github.com/BlickandMorty/Epistemos',
  },
  {
    name: 'SYNTH',
    role: 'Data and evaluation lab',
    status: 'Active local V1',
    description: 'The central packet ledger for model runs, human review, exports, and replayable experiments across the research work.',
    url: 'https://github.com/BlickandMorty/synth-ai-data-lab',
  },
  {
    name: 'Unified Address Space',
    role: 'Provenance idea',
    status: 'Research module',
    description: 'The address-and-integrity idea used in SYNTH to keep a prompt, output, annotation, or external context traceable.',
    url: 'https://github.com/BlickandMorty/unified-address-space-reasoning-lab',
  },
  {
    name: 'Scientific Reasoning Audit Loops',
    role: 'Evaluation practice',
    status: 'Research module',
    description: 'A place for testing whether a model states assumptions, preserves uncertainty, and can be checked instead of merely sounding confident.',
    url: 'https://github.com/BlickandMorty/scientific-reasoning-audit-loops',
  },
  {
    name: 'LivingBrain',
    role: 'Memory experiment',
    status: 'Independent project',
    description: 'A separate AI-assisted memory experiment. Its experiments can be documented in SYNTH without claiming SYNTH built the project itself.',
    url: 'https://github.com/BlickandMorty/LivingBrain',
  },
  {
    name: 'Instant Recall',
    role: 'Local retrieval',
    status: 'Independent project',
    description: 'A local-first retrieval project. SYNTH can retain evaluation packets for it when you are testing retrieval quality or errors.',
    url: 'https://github.com/BlickandMorty/epistemos-instant-recall',
  },
  {
    name: 'Security Operations Lab',
    role: 'Security practice',
    status: 'Research module',
    description: 'A safe place for synthetic security evaluation and operational-analysis exercises, not real sensitive operations data.',
    url: 'https://github.com/BlickandMorty/security-operations-lab',
  },
];
