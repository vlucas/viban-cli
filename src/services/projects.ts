import { db } from '../db.ts';
import { newProjectId, inputToUUID } from '../utils/typeid.ts';
import type { Project } from '../types.ts';

function now(): string {
  return new Date().toISOString();
}

export function listProjects(): Project[] {
  return db.query('SELECT * FROM projects ORDER BY name ASC').all() as Project[];
}

export function getProject(idOrName: string): Project | null {
  // 1. Exact ID match — accepts TypeID string or plain UUID
  const uuid = inputToUUID(idOrName);
  if (uuid) {
    const byId = db
      .query('SELECT * FROM projects WHERE id = ? LIMIT 1')
      .get(uuid) as Project | null;
    if (byId) return byId;
  }

  // 2. Case-insensitive exact name match
  const byName = db
    .query('SELECT * FROM projects WHERE LOWER(name) = ? LIMIT 1')
    .get(idOrName.toLowerCase()) as Project | null;
  if (byName) return byName;

  // 3. Fuzzy: name contains the input as a substring (case-insensitive)
  const lower = idOrName.toLowerCase();
  const all = listProjects();
  const matches = all.filter((p) => p.name.toLowerCase().includes(lower));
  if (matches.length > 0) {
    // Prefer the shortest name (most specific match)
    return matches.sort((a, b) => a.name.length - b.name.length)[0];
  }

  return null;
}

export function createProject(name: string): Project {
  const id = newProjectId();
  const ts = now();
  db.run('INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)', [
    id,
    name,
    ts,
    ts,
  ]);
  return getProject(id)!;
}

export function deleteProject(idOrName: string): boolean {
  const project = getProject(idOrName);
  if (!project) return false;
  db.run('DELETE FROM projects WHERE id = ?', [project.id]);
  return true;
}

/** Return the "default" project, creating it if it does not exist. */
export function getOrCreateDefault(): Project {
  const existing = getProject('default');
  if (existing) return existing;
  return createProject('default');
}
