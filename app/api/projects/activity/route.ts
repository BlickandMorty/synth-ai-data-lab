import { NextResponse } from 'next/server';
import { CANON_RESEARCH_PROJECTS } from '@/lib/research/catalog';

type RepositoryActivity = {
  repository: string;
  available: boolean;
  pushedAt?: string;
  defaultBranch?: string;
  error?: string;
};

export async function GET() {
  const projects = await Promise.all(CANON_RESEARCH_PROJECTS.map(async (project): Promise<RepositoryActivity> => {
    try {
      const response = await fetch(`https://api.github.com/repos/${project.repository}`, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'SYNTH-local-research-map' },
        next: { revalidate: 300 },
      });
      if (!response.ok) return { repository: project.repository, available: false, error: response.status === 404 ? 'Repository is private or unavailable to the public API.' : `GitHub returned ${response.status}.` };
      const payload = await response.json() as { pushed_at?: string; default_branch?: string };
      return { repository: project.repository, available: true, pushedAt: payload.pushed_at, defaultBranch: payload.default_branch };
    } catch {
      return { repository: project.repository, available: false, error: 'GitHub activity could not be reached from this local app.' };
    }
  }));
  return NextResponse.json({ success: true, checkedAt: new Date().toISOString(), projects });
}
