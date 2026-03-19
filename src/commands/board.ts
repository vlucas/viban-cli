import { Command } from 'commander';
import chalk from 'chalk';
import { getTasksByStatus } from '../services/tasks.ts';
import { listProjects, getProject } from '../services/projects.ts';
import { TASK_STATUSES, STATUS_LABELS, type Task, type TaskStatus } from '../types.ts';
import { taskTypeId } from '../utils/typeid.ts';

const STATUS_COLORS: Record<TaskStatus, (s: string) => string> = {
  ready:       (s) => chalk.white.bold(s),
  todo:        (s) => chalk.blue.bold(s),
  in_progress: (s) => chalk.yellow.bold(s),
  in_review:   (s) => chalk.magenta.bold(s),
  done:        (s) => chalk.green.bold(s),
};

const STATUS_BG: Record<TaskStatus, (s: string) => string> = {
  ready:       (s) => chalk.bgWhite.black(s),
  todo:        (s) => chalk.bgBlue.white(s),
  in_progress: (s) => chalk.bgYellow.black(s),
  in_review:   (s) => chalk.bgMagenta.white(s),
  done:        (s) => chalk.bgGreen.black(s),
};

function wrapText(text: string, width: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const w = word.length > width ? word.substring(0, width) : word;
    if (current.length === 0) {
      current = w;
    } else if (current.length + 1 + w.length <= width) {
      current += ' ' + w;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);

  // Limit card height
  if (lines.length > 3) {
    const truncated = lines[2].substring(0, width - 1) + '…';
    return [lines[0], lines[1], truncated];
  }
  return lines;
}

function pad(s: string, width: number): string {
  if (s.length >= width) return s.substring(0, width);
  return s + ' '.repeat(width - s.length);
}

function center(s: string, width: number): string {
  if (s.length >= width) return s.substring(0, width);
  const total = width - s.length;
  const left = Math.floor(total / 2);
  const right = total - left;
  return ' '.repeat(left) + s + ' '.repeat(right);
}

function buildColumn(status: TaskStatus, tasks: Task[], W: number): string[] {
  const label = STATUS_LABELS[status];
  const colorHeader = STATUS_BG[status];
  const colorTitle = STATUS_COLORS[status];
  const lines: string[] = [];

  // Top border  (W + 2 dashes gives total width W+4)
  lines.push('╭' + '─'.repeat(W + 2) + '╮');
  // Header  — colorHeader must cover exactly W+2 chars (space + W + space)
  lines.push('│' + colorHeader(' ' + center(label, W) + ' ') + '│');
  // Separator
  lines.push('├' + '─'.repeat(W + 2) + '┤');

  if (tasks.length === 0) {
    lines.push('│ ' + chalk.dim(pad('(empty)', W)) + ' │');
  } else {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];

      if (i > 0) {
        lines.push('│ ' + chalk.dim('·'.repeat(W)) + ' │');
      }

      // Short TypeID
      const tid = taskTypeId(task.id);
      const shortId = tid.length > W ? tid.substring(0, W) : tid;
      lines.push('│ ' + chalk.dim(pad(shortId, W)) + ' │');

      // Task name, possibly wrapped
      const nameLines = wrapText(task.name, W);
      for (const nl of nameLines) {
        lines.push('│ ' + colorTitle(pad(nl, W)) + ' │');
      }
    }
  }

  // Bottom border
  lines.push('╰' + '─'.repeat(W + 2) + '╯');
  return lines;
}

/** Pad a column with blank interior lines before the closing border. */
function equalizeColumns(columns: string[][], W: number): string[][] {
  const maxLines = Math.max(...columns.map((c) => c.length));

  return columns.map((col) => {
    // Insert blank lines just before the last line (bottom border)
    const filled = [...col];
    while (filled.length < maxLines) {
      filled.splice(filled.length - 1, 0, '│ ' + ' '.repeat(W) + ' │');
    }
    return filled;
  });
}

function renderBoard(
  projectName: string,
  tasksByStatus: Map<TaskStatus, Task[]>,
  W: number,
  GAP: number,
  boardWidth: number
) {
  const columns = TASK_STATUSES.map((status) =>
    buildColumn(status, tasksByStatus.get(status) ?? [], W)
  );
  const equalized = equalizeColumns(columns, W);

  // Sum only workflow statuses — excludes 'archived' which is not in TASK_STATUSES
  const total = TASK_STATUSES.reduce((acc, s) => acc + (tasksByStatus.get(s)?.length ?? 0), 0);
  const done = tasksByStatus.get('done')?.length ?? 0;

  // Project heading
  console.log('  ' + chalk.bold.cyan(projectName) + chalk.dim('  ' + done + '/' + total + ' tasks done'));
  console.log('  ' + chalk.dim('─'.repeat(boardWidth)));

  // Board rows
  const height = equalized[0].length;
  for (let row = 0; row < height; row++) {
    console.log('  ' + equalized.map((col) => col[row]).join(' '.repeat(GAP)));
  }
}

export function registerBoardCommand(program: Command) {
  program
    .command('board')
    .description('Display the Kanban board, one board per project')
    .option('-p, --project <project>', 'Show only the board for a specific project')
    .action((opts: { project?: string }) => {
      // Determine column width from terminal
      const termWidth = process.stdout.columns || 120;
      const GAP = 2;
      const BORDERS = 4; // '│  ' + ' │'
      const INDENT = 2; // leading '  ' on each printed row
      const W = Math.max(14, Math.floor((termWidth - INDENT - TASK_STATUSES.length * BORDERS - (TASK_STATUSES.length - 1) * GAP) / TASK_STATUSES.length));
      const boardWidth = TASK_STATUSES.length * (W + BORDERS) + (TASK_STATUSES.length - 1) * GAP;

      if (opts.project) {
        // Single-project mode
        const project = getProject(opts.project);
        if (!project) {
          console.error(chalk.red(`Project not found: "${opts.project}"`));
          process.exit(1);
        }
        console.log('');
        renderBoard(project.name, getTasksByStatus(project.name), W, GAP, boardWidth);
        console.log('');
        return;
      }

      // All-projects mode: sort by most recent task activity
      const projects = listProjects();
      if (projects.length === 0) {
        console.log(chalk.dim('No projects yet. Create one with: viban projects:new <name>'));
        return;
      }

      const entries = projects.map((proj) => {
        const tasksByStatus = getTasksByStatus(proj.name);
        const allTasks = [...tasksByStatus.values()].flat();
        const latestTs = allTasks.reduce(
          (max, t) => (t.updated_at > max ? t.updated_at : max),
          proj.created_at
        );
        return { proj, tasksByStatus, latestTs };
      });

      entries.sort((a, b) => b.latestTs.localeCompare(a.latestTs));

      console.log('');
      for (const { proj, tasksByStatus } of entries) {
        renderBoard(proj.name, tasksByStatus, W, GAP, boardWidth);
        console.log('');
      }
    });
}
