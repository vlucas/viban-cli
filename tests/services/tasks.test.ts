import { describe, expect, test, beforeEach } from 'bun:test';
import { db } from '../../src/db.ts';
import { createProject } from '../../src/services/projects.ts';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTasksByStatus,
  archiveTasks,
} from '../../src/services/tasks.ts';
import { taskTypeId } from '../../src/utils/typeid.ts';

beforeEach(() => {
  db.run('DELETE FROM tasks');
  db.run('DELETE FROM projects');
});

describe('createTask', () => {
  test('creates a task in the default project with minimal options', () => {
    const task = createTask({ name: 'My Task' });
    expect(task.name).toBe('My Task');
    expect(task.status).toBe('ready');
    expect(task.description).toBeNull();
    expect(task.project_id).toBeTruthy();
  });

  test('creates a task with all options', () => {
    const proj = createProject('Alpha');
    const task = createTask({
      name: 'Full Task',
      description: 'Some description',
      status: 'todo',
      projectIdOrName: 'Alpha',
    });
    expect(task.name).toBe('Full Task');
    expect(task.description).toBe('Some description');
    expect(task.status).toBe('todo');
    expect(task.project_id).toBe(proj.id);
  });

  test('creates task with all valid statuses', () => {
    for (const status of ['ready', 'todo', 'in_progress', 'in_review', 'done'] as const) {
      const task = createTask({ name: `Task ${status}`, status });
      expect(task.status).toBe(status);
    }
  });

  test('returns task with id, created_at, updated_at set', () => {
    const task = createTask({ name: 'Timestamped' });
    expect(task.id).toBeTruthy();
    expect(task.created_at).toBeTruthy();
    expect(task.updated_at).toBeTruthy();
  });

  test('throws when project does not exist', () => {
    expect(() => createTask({ name: 'Orphan', projectIdOrName: 'nonexistent' })).toThrow(
      'Project not found'
    );
  });
});

describe('getTask', () => {
  test('returns null for a nonexistent UUID', () => {
    expect(getTask('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  test('finds task by UUID', () => {
    const task = createTask({ name: 'Find Me' });
    expect(getTask(task.id)?.name).toBe('Find Me');
  });

  test('finds task by TypeID string', () => {
    const task = createTask({ name: 'By TypeId' });
    expect(getTask(taskTypeId(task.id))?.name).toBe('By TypeId');
  });
});

describe('listTasks', () => {
  test('returns all tasks when no filter given', () => {
    createTask({ name: 'A' });
    createTask({ name: 'B' });
    expect(listTasks()).toHaveLength(2);
  });

  test('returns tasks ordered by updated_at descending', async () => {
    createTask({ name: 'First' });
    await Bun.sleep(5);
    createTask({ name: 'Second' });
    const tasks = listTasks();
    expect(tasks[0].name).toBe('Second');
    expect(tasks[1].name).toBe('First');
  });

  test('excludes archived tasks by default', () => {
    createTask({ name: 'Active' });
    const archived = createTask({ name: 'Archived', status: 'done' });
    db.run(`UPDATE tasks SET status = 'archived' WHERE id = ?`, [archived.id]);
    expect(listTasks()).toHaveLength(1);
    expect(listTasks()[0].name).toBe('Active');
  });

  test('returns only archived tasks when archivedOnly is true', () => {
    createTask({ name: 'Active' });
    const archived = createTask({ name: 'Archived', status: 'done' });
    db.run(`UPDATE tasks SET status = 'archived' WHERE id = ?`, [archived.id]);
    const tasks = listTasks(undefined, true);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].name).toBe('Archived');
  });

  test('filters to only tasks in the given project', () => {
    createProject('Filtered');
    createTask({ name: 'In Filtered', projectIdOrName: 'Filtered' });
    createTask({ name: 'Default Task' });
    const tasks = listTasks('Filtered');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].name).toBe('In Filtered');
  });

  test('returns empty array for a project with no tasks', () => {
    createProject('Empty');
    expect(listTasks('Empty')).toHaveLength(0);
  });

  test('returns only default project tasks when "default" is passed', () => {
    createProject('Other');
    createTask({ name: 'Default Task' });
    createTask({ name: 'Other Task', projectIdOrName: 'Other' });
    expect(listTasks('default')).toHaveLength(1);
  });

  test('throws when filtering by a nonexistent project', () => {
    expect(() => listTasks('nonexistent-xyz')).toThrow('Project not found');
  });
});

describe('updateTask', () => {
  test('updates task name', () => {
    const task = createTask({ name: 'Original' });
    const updated = updateTask(task.id, { name: 'Updated' });
    expect(updated.name).toBe('Updated');
  });

  test('updates task description', () => {
    const task = createTask({ name: 'Task' });
    const updated = updateTask(task.id, { description: 'New desc' });
    expect(updated.description).toBe('New desc');
  });

  test('updates task status', () => {
    const task = createTask({ name: 'Task' });
    const updated = updateTask(task.id, { status: 'in_progress' });
    expect(updated.status).toBe('in_progress');
  });

  test('moves task to a different project', () => {
    const proj = createProject('Destination');
    const task = createTask({ name: 'Movable' });
    const updated = updateTask(task.id, { projectIdOrName: 'Destination' });
    expect(updated.project_id).toBe(proj.id);
  });

  test('preserves fields that are not specified in the update', () => {
    const task = createTask({ name: 'Stable', description: 'Keep me', status: 'todo' });
    const updated = updateTask(task.id, { name: 'New Name' });
    expect(updated.description).toBe('Keep me');
    expect(updated.status).toBe('todo');
  });

  test('sets description to null when explicitly passed as empty string', () => {
    const task = createTask({ name: 'HasDesc', description: 'Remove me' });
    const updated = updateTask(task.id, { description: '' });
    expect(updated.description).toBe('');
  });

  test('updated_at is refreshed after update', async () => {
    const task = createTask({ name: 'Timing' });
    await Bun.sleep(5);
    const updated = updateTask(task.id, { name: 'New' });
    expect(updated.updated_at >= task.updated_at).toBe(true);
  });

  test('throws for a nonexistent task ID', () => {
    expect(() =>
      updateTask('00000000-0000-0000-0000-000000000000', { name: 'X' })
    ).toThrow('Task not found');
  });
});

describe('deleteTask', () => {
  test('deletes an existing task and returns true', () => {
    const task = createTask({ name: 'Delete Me' });
    expect(deleteTask(task.id)).toBe(true);
    expect(getTask(task.id)).toBeNull();
  });

  test('returns false for a nonexistent task ID', () => {
    expect(deleteTask('00000000-0000-0000-0000-000000000000')).toBe(false);
  });
});

describe('archiveTasks', () => {
  test('archives done tasks older than the cutoff and returns count', () => {
    const task = createTask({ name: 'Old done task', status: 'done' });
    // Backdate updated_at to 20 days ago
    const old = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    db.run('UPDATE tasks SET updated_at = ? WHERE id = ?', [old, task.id]);

    const count = archiveTasks(14);
    expect(count).toBe(1);
    expect(getTask(task.id)?.status).toBe('archived');
  });

  test('does not archive done tasks newer than the cutoff', () => {
    createTask({ name: 'Recent done task', status: 'done' });
    const count = archiveTasks(14);
    expect(count).toBe(0);
  });

  test('does not archive tasks that are not done', () => {
    const task = createTask({ name: 'In progress task', status: 'in_progress' });
    const old = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    db.run('UPDATE tasks SET updated_at = ? WHERE id = ?', [old, task.id]);

    const count = archiveTasks(14);
    expect(count).toBe(0);
    expect(getTask(task.id)?.status).toBe('in_progress');
  });

  test('scopes archiving to a specific project', () => {
    const proj = createProject('ArchiveProj');
    const inProj = createTask({ name: 'In project', status: 'done', projectIdOrName: proj.name });
    const other = createTask({ name: 'Other project', status: 'done' });

    const old = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    db.run('UPDATE tasks SET updated_at = ? WHERE id = ?', [old, inProj.id]);
    db.run('UPDATE tasks SET updated_at = ? WHERE id = ?', [old, other.id]);

    const count = archiveTasks(14, proj.name);
    expect(count).toBe(1);
    expect(getTask(inProj.id)?.status).toBe('archived');
    expect(getTask(other.id)?.status).toBe('done');
  });

  test('archives everything done when days is 0', () => {
    createTask({ name: 'Just done', status: 'done' });
    createTask({ name: 'Also done', status: 'done' });
    const count = archiveTasks(0);
    expect(count).toBe(2);
  });

  test('returns 0 when there are no done tasks', () => {
    createTask({ name: 'Ready task', status: 'ready' });
    expect(archiveTasks(0)).toBe(0);
  });
});

describe('getTasksByStatus', () => {
  test('groups tasks into a map by status', () => {
    createTask({ name: 'A', status: 'ready' });
    createTask({ name: 'B', status: 'ready' });
    createTask({ name: 'C', status: 'in_progress' });
    const map = getTasksByStatus();
    expect(map.get('ready')).toHaveLength(2);
    expect(map.get('in_progress')).toHaveLength(1);
    expect(map.get('todo')).toBeUndefined();
  });

  test('returns an empty map when there are no tasks', () => {
    expect(getTasksByStatus().size).toBe(0);
  });

  test('filters by project', () => {
    createProject('StatusProj');
    createTask({ name: 'P1', status: 'done', projectIdOrName: 'StatusProj' });
    createTask({ name: 'Other', status: 'done' }); // default project
    const map = getTasksByStatus('StatusProj');
    expect(map.get('done')).toHaveLength(1);
    expect(map.get('done')![0].name).toBe('P1');
  });
});
