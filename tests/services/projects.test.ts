import { describe, expect, test, beforeEach } from 'bun:test';
import { db } from '../../src/db.ts';
import { projectTypeId } from '../../src/utils/typeid.ts';
import {
  listProjects,
  getProject,
  createProject,
  deleteProject,
  getOrCreateDefault,
} from '../../src/services/projects.ts';

beforeEach(() => {
  db.run('DELETE FROM tasks');
  db.run('DELETE FROM projects');
});

describe('listProjects', () => {
  test('returns empty array when no projects exist', () => {
    expect(listProjects()).toEqual([]);
  });

  test('returns all projects sorted by name ascending', () => {
    createProject('Zebra');
    createProject('Alpha');
    createProject('Middle');
    expect(listProjects().map((p) => p.name)).toEqual(['Alpha', 'Middle', 'Zebra']);
  });

  test('returns projects with all expected fields', () => {
    createProject('Test');
    const [p] = listProjects();
    expect(p.id).toBeTruthy();
    expect(p.name).toBe('Test');
    expect(p.created_at).toBeTruthy();
    expect(p.updated_at).toBeTruthy();
  });
});

describe('getProject', () => {
  test('returns null for a name that does not exist', () => {
    expect(getProject('nonexistent')).toBeNull();
  });

  test('finds by exact UUID', () => {
    const created = createProject('ByUUID');
    expect(getProject(created.id)?.name).toBe('ByUUID');
  });

  test('finds by TypeID string', () => {
    const created = createProject('ByTypeId');
    expect(getProject(projectTypeId(created.id))?.name).toBe('ByTypeId');
  });

  test('finds by exact name (case-insensitive)', () => {
    createProject('MyProject');
    expect(getProject('myproject')?.name).toBe('MyProject');
    expect(getProject('MYPROJECT')?.name).toBe('MyProject');
  });

  test('finds by substring match', () => {
    createProject('Frontend App');
    expect(getProject('Frontend')?.name).toBe('Frontend App');
  });

  test('prefers shortest name on fuzzy substring match', () => {
    createProject('App');
    createProject('App Extended');
    expect(getProject('App')?.name).toBe('App');
  });
});

describe('createProject', () => {
  test('creates a project and returns it', () => {
    const p = createProject('New Project');
    expect(p.name).toBe('New Project');
    expect(p.id).toBeTruthy();
    expect(p.created_at).toBeTruthy();
    expect(p.updated_at).toBeTruthy();
  });

  test('created project is retrievable', () => {
    const p = createProject('Retrievable');
    expect(getProject(p.id)).not.toBeNull();
  });

  test('throws on duplicate name', () => {
    createProject('Duplicate');
    expect(() => createProject('Duplicate')).toThrow();
  });
});

describe('deleteProject', () => {
  test('deletes an existing project and returns true', () => {
    const p = createProject('ToDelete');
    expect(deleteProject(p.id)).toBe(true);
    expect(getProject(p.id)).toBeNull();
  });

  test('deletes by name', () => {
    createProject('ByName');
    expect(deleteProject('ByName')).toBe(true);
    expect(getProject('ByName')).toBeNull();
  });

  test('returns false for a nonexistent project', () => {
    expect(deleteProject('does-not-exist')).toBe(false);
  });
});

describe('getOrCreateDefault', () => {
  test('creates a "default" project when none exists', () => {
    const p = getOrCreateDefault();
    expect(p.name).toBe('default');
  });

  test('returns the same project on repeated calls', () => {
    const p1 = getOrCreateDefault();
    const p2 = getOrCreateDefault();
    expect(p1.id).toBe(p2.id);
  });

  test('only one default project exists after multiple calls', () => {
    getOrCreateDefault();
    getOrCreateDefault();
    const all = listProjects().filter((p) => p.name === 'default');
    expect(all).toHaveLength(1);
  });
});
