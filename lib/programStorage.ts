// Program progress storage — extracted from lib/storage.ts

import { getDB } from './db';
import type { ProgramProgress } from './program';

export type { ProgramProgress } from './program';

let programProgressCache: Map<string, ProgramProgress> | null = null;

async function ensureProgramProgressCache(): Promise<
  Map<string, ProgramProgress>
> {
  if (programProgressCache) return programProgressCache;
  const db = await getDB();
  const all = await db.getAll('program_progress');
  programProgressCache = new Map(
    all.map((p) => [p.programId, p as ProgramProgress]),
  );
  return programProgressCache;
}

export async function getProgramProgress(
  programId: string,
): Promise<ProgramProgress | undefined> {
  const cache = await ensureProgramProgressCache();
  return cache.get(programId);
}

export async function getAllProgramProgress(): Promise<ProgramProgress[]> {
  const cache = await ensureProgramProgressCache();
  return Array.from(cache.values());
}

export async function saveProgramProgress(
  progress: ProgramProgress,
): Promise<void> {
  const cache = await ensureProgramProgressCache();
  cache.set(progress.programId, progress);
  const db = await getDB();
  await db.put('program_progress', progress);
}

export async function deleteProgramProgress(programId: string): Promise<void> {
  const cache = await ensureProgramProgressCache();
  cache.delete(programId);
  const db = await getDB();
  await db.delete('program_progress', programId);
}
