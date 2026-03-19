export const TASK_STATUSES = ['ready', 'todo', 'in_progress', 'in_review', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number] | 'archived';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  ready: 'READY',
  todo: 'TO DO',
  in_progress: 'IN PROGRESS',
  in_review: 'IN REVIEW',
  done: 'DONE',
  archived: 'ARCHIVED',
};

export interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

/** Normalise user-supplied status strings to a valid TaskStatus */
export function parseStatus(input: string): TaskStatus {
  const normalized = input.toLowerCase().replace(/[\s-]+/g, '_');
  if ((TASK_STATUSES as readonly string[]).includes(normalized)) {
    return normalized as TaskStatus;
  }
  // Some friendly aliases
  const aliases: Record<string, TaskStatus> = {
    'in progress': 'in_progress',
    'in review': 'in_review',
    'inprogress': 'in_progress',
    'inreview': 'in_review',
    'wip': 'in_progress',
    'review': 'in_review',
  };
  const aliased = aliases[input.toLowerCase()];
  if (aliased) return aliased;

  if (input.toLowerCase() === 'archived') return 'archived';

  throw new Error(
    `Invalid status "${input}". Valid statuses: ${TASK_STATUSES.join(', ')}, archived`
  );
}
