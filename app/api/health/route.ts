import { NextResponse } from 'next/server';
import { checkOllamaHealth } from '@/lib/ai/providers';

export async function GET() {
  const ollama = await checkOllamaHealth();
  return NextResponse.json({
    success: true,
    ollama,
    storage: 'local-sqlite',
    simulatorAvailable: true,
  });
}
