import { describe, expect, test } from 'bun:test';
import {
  newProjectId,
  newTaskId,
  projectTypeId,
  taskTypeId,
  inputToUUID,
} from '../../src/utils/typeid.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('newProjectId', () => {
  test('returns a valid UUID', () => {
    expect(newProjectId()).toMatch(UUID_RE);
  });

  test('generates unique IDs', () => {
    expect(newProjectId()).not.toBe(newProjectId());
  });
});

describe('newTaskId', () => {
  test('returns a valid UUID', () => {
    expect(newTaskId()).toMatch(UUID_RE);
  });

  test('generates unique IDs', () => {
    expect(newTaskId()).not.toBe(newTaskId());
  });
});

describe('projectTypeId', () => {
  test('converts UUID to a proj_ prefixed TypeID string', () => {
    const uuid = newProjectId();
    expect(projectTypeId(uuid)).toMatch(/^proj_/);
  });

  test('round-trips through inputToUUID', () => {
    const uuid = newProjectId();
    expect(inputToUUID(projectTypeId(uuid))).toBe(uuid);
  });
});

describe('taskTypeId', () => {
  test('converts UUID to a task_ prefixed TypeID string', () => {
    const uuid = newTaskId();
    expect(taskTypeId(uuid)).toMatch(/^task_/);
  });

  test('round-trips through inputToUUID', () => {
    const uuid = newTaskId();
    expect(inputToUUID(taskTypeId(uuid))).toBe(uuid);
  });
});

describe('inputToUUID', () => {
  test('returns the UUID unchanged for a plain UUID input', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(inputToUUID(uuid)).toBe(uuid);
  });

  test('is case-insensitive for plain UUID input', () => {
    const uuid = '550E8400-E29B-41D4-A716-446655440000';
    expect(inputToUUID(uuid)).toBe(uuid.toLowerCase());
  });

  test('converts a proj_ TypeID string to its UUID', () => {
    const uuid = newProjectId();
    expect(inputToUUID(projectTypeId(uuid))).toBe(uuid);
  });

  test('converts a task_ TypeID string to its UUID', () => {
    const uuid = newTaskId();
    expect(inputToUUID(taskTypeId(uuid))).toBe(uuid);
  });

  test('returns null for a plain name string', () => {
    expect(inputToUUID('my-project')).toBeNull();
  });

  test('returns null for an invalid TypeID string', () => {
    expect(inputToUUID('invalid_!!!')).toBeNull();
  });

  test('returns null for an empty string', () => {
    expect(inputToUUID('')).toBeNull();
  });
});
