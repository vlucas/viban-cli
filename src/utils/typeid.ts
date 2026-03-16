import { TypeID } from 'typeid-js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Generate a new project UUID (stored in DB). */
export function newProjectId(): string {
  return new TypeID('proj').toUUID();
}

/** Generate a new task UUID (stored in DB). */
export function newTaskId(): string {
  return new TypeID('task').toUUID();
}

/** Convert a stored project UUID to a TypeID string for display. */
export function projectTypeId(uuid: string): string {
  return TypeID.fromUUID('proj', uuid).toString();
}

/** Convert a stored task UUID to a TypeID string for display. */
export function taskTypeId(uuid: string): string {
  return TypeID.fromUUID('task', uuid).toString();
}

/**
 * Convert user-supplied ID input to the underlying UUID for DB lookup.
 * Accepts a TypeID string (e.g. proj_xxx / task_xxx) or a plain UUID.
 * Returns null if the input is neither.
 */
export function inputToUUID(input: string): string | null {
  if (UUID_RE.test(input)) return input.toLowerCase();
  if (input.includes('_')) {
    try {
      return TypeID.fromString(input).toUUID();
    } catch {
      return null;
    }
  }
  return null;
}
