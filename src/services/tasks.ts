import { db } from '../db.ts';
import { newTaskId, inputToUUID } from '../utils/typeid.ts';
import { getOrCreateDefault, getProject } from './projects.ts';
import type { Task, TaskStatus } from '../types.ts';

function now(): string {
  return new Date().toISOString();
}

export interface CreateTaskOptions {
  name: string;
  description?: string;
  status?: TaskStatus;
  projectIdOrName?: string;
}

export interface UpdateTaskOptions {
  name?: string;
  description?: string;
  status?: TaskStatus;
  projectIdOrName?: string;
}

function resolveProject(idOrName?: string) {
  if (!idOrName || idOrName === 'default') {
    return getOrCreateDefault();
  }
  const project = getProject(idOrName);
  if (!project) throw new Error(`Project not found: "${idOrName}"`);
  return project;
}

export function listTasks(projectIdOrName?: string): Task[] {
  if (projectIdOrName && projectIdOrName !== 'default') {
    const project = getProject(projectIdOrName);
    if (!project) throw new Error(`Project not found: "${projectIdOrName}"`);
    return db
      .query('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at ASC')
      .all(project.id) as Task[];
  }
  if (!projectIdOrName) {
    return db.query('SELECT * FROM tasks ORDER BY created_at ASC').all() as Task[];
  }
  // "default"
  const project = getProject('default');
  if (!project) return [];
  return db
    .query('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at ASC')
    .all(project.id) as Task[];
}

export function getTask(input: string): Task | null {
  const id = inputToUUID(input) ?? input;
  return (db.query('SELECT * FROM tasks WHERE id = ? LIMIT 1').get(id) as Task | null) ?? null;
}

export function createTask(opts: CreateTaskOptions): Task {
  const project = resolveProject(opts.projectIdOrName);
  const id = newTaskId();
  const ts = now();
  db.run(
    `INSERT INTO tasks (id, project_id, name, description, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, project.id, opts.name, opts.description ?? null, opts.status ?? 'ready', ts, ts]
  );
  return getTask(id)!;
}

export function updateTask(id: string, opts: UpdateTaskOptions): Task {
  const task = getTask(id);
  if (!task) throw new Error(`Task not found: "${id}"`);

  const projectId = opts.projectIdOrName ? resolveProject(opts.projectIdOrName).id : task.project_id;
  const ts = now();

  db.run(
    `UPDATE tasks SET
       project_id  = ?,
       name        = ?,
       description = ?,
       status      = ?,
       updated_at  = ?
     WHERE id = ?`,
    [
      projectId,
      opts.name ?? task.name,
      opts.description !== undefined ? opts.description : task.description,
      opts.status ?? task.status,
      ts,
      task.id,
    ]
  );
  return getTask(task.id)!;
}

export function deleteTask(id: string): boolean {
  const task = getTask(id);
  if (!task) return false;
  db.run('DELETE FROM tasks WHERE id = ?', [id]);
  return true;
}

export function getTasksByStatus(projectIdOrName?: string): Map<TaskStatus, Task[]> {
  const tasks = listTasks(projectIdOrName);
  const map = new Map<TaskStatus, Task[]>();
  for (const task of tasks) {
    const bucket = map.get(task.status) ?? [];
    bucket.push(task);
    map.set(task.status, bucket);
  }
  return map;
}
