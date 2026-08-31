export type ResearchProject = {
  name: string;
  role: string;
  status: string;
  description: string;
  url: string;
  connection: string;
  useInSynth: string;
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
    connection: 'Research workspace → SYNTH experiment evidence',
    useInSynth: 'Keep a replayable record when you test a prompt, workflow, retrieval idea, or research claim from Epistemos.',
  },
  {
    name: 'SYNTH',
    role: 'Data and evaluation lab',
    status: 'Active local V1',
    description: 'The central packet ledger for model runs, human review, exports, and replayable experiments across the research work.',
    url: 'https://github.com/BlickandMorty/synth-ai-data-lab',
    connection: 'Central evidence and annotation layer',
    useInSynth: 'This is the active lab: run a model, compare answers, review them, then export the resulting dataset with its provenance.',
  },
  {
    name: 'Unified Address Space',
    role: 'Provenance idea',
    status: 'Research module',
    description: 'The address-and-integrity idea used in SYNTH to keep a prompt, output, annotation, or external context traceable.',
    url: 'https://github.com/BlickandMorty/unified-address-space-reasoning-lab',
    connection: 'Provenance principle → packet address fields',
    useInSynth: 'Each packet gets a content digest and lineage fields so an output can be traced back to the prompt or context it came from.',
  },
  {
    name: 'Scientific Reasoning Audit Loops',
    role: 'Evaluation practice',
    status: 'Research module',
    description: 'A place for testing whether a model states assumptions, preserves uncertainty, and can be checked instead of merely sounding confident.',
    url: 'https://github.com/BlickandMorty/scientific-reasoning-audit-loops',
    connection: 'Evaluation practice → experiment rubric',
    useInSynth: 'Use it as an experiment frame: ask the same question across models, inspect assumptions, and save a human review rather than trusting fluency.',
  },
  {
    name: 'LivingBrain',
    role: 'Memory experiment',
    status: 'Independent project',
    description: 'A separate AI-assisted memory experiment. Its experiments can be documented in SYNTH without claiming SYNTH built the project itself.',
    url: 'https://github.com/BlickandMorty/LivingBrain',
    connection: 'Independent project → optional evaluation subject',
    useInSynth: 'Record tests of recall, memory prompts, or failure cases here only when you are actually evaluating LivingBrain behavior.',
  },
  {
    name: 'Instant Recall',
    role: 'Local retrieval',
    status: 'Independent project',
    description: 'A local-first retrieval project. SYNTH can retain evaluation packets for it when you are testing retrieval quality or errors.',
    url: 'https://github.com/BlickandMorty/epistemos-instant-recall',
    connection: 'Independent project → optional evaluation subject',
    useInSynth: 'Use a retrieval question as the prompt, retain the retrieved context as a packet, then review whether the answer stayed grounded.',
  },
  {
    name: 'Security Operations Lab',
    role: 'Security practice',
    status: 'Research module',
    description: 'A safe place for synthetic security evaluation and operational-analysis exercises, not real sensitive operations data.',
    url: 'https://github.com/BlickandMorty/security-operations-lab',
    connection: 'Synthetic security practice → safe evaluation set',
    useInSynth: 'Log only synthetic, non-sensitive security scenarios and use the annotation rubric to mark helpfulness, caution, and instruction-following.',
  },
];
