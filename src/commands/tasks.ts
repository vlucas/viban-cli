import { Command } from 'commander';
import chalk from 'chalk';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../services/tasks.ts';
import { getProject } from '../services/projects.ts';
import { inferTitle } from '../utils/infer.ts';
import { parseStatus, TASK_STATUSES, STATUS_LABELS } from '../types.ts';
import { taskTypeId, projectTypeId } from '../utils/typeid.ts';

const STATUS_COLORS: Record<string, chalk.Chalk> = {
  ready: chalk.white,
  todo: chalk.blue,
  in_progress: chalk.yellow,
  in_review: chalk.magenta,
  done: chalk.green,
};

function colorStatus(status: string): string {
  const color = STATUS_COLORS[status] ?? chalk.white;
  return color(STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status);
}

export function registerTaskCommands(program: Command) {
  // ── tasks:list ──────────────────────────────────────────────────────────────
  program
    .command('tasks:list')
    .description('List tasks (all projects by default)')
    .option('-p, --project <project>', 'Filter by project name or ID')
    .option('-s, --status <status>', 'Filter by status')
    .action((opts: { project?: string; status?: string }) => {
      let tasks = listTasks(opts.project);

      if (opts.status) {
        const filterStatus = parseStatus(opts.status);
        tasks = tasks.filter((t) => t.status === filterStatus);
      }

      if (tasks.length === 0) {
        console.log(chalk.dim('No tasks found.'));
        return;
      }

      console.log('');
      console.log(chalk.bold('  Tasks'));
      console.log(chalk.dim('  ' + '─'.repeat(80)));
      console.log(
        chalk.dim(
          `  ${'ID'.padEnd(31)}  ${'Status'.padEnd(14)}  ${'Project'.padEnd(12)}  Name`
        )
      );
      console.log(chalk.dim('  ' + '─'.repeat(80)));
      for (const task of tasks) {
        const project = getProject(task.project_id);
        const projectName = (project?.name ?? '?').substring(0, 12);
        const statusLabel = (STATUS_LABELS[task.status] ?? task.status).padEnd(14);
        console.log(
          `  ${chalk.cyan(taskTypeId(task.id).padEnd(31))}  ${colorStatus(task.status).padEnd(14 + (colorStatus(task.status).length - statusLabel.trimEnd().length))}  ${chalk.dim(projectName.padEnd(12))}  ${task.name}`
        );
      }
      console.log('');
    });

  // ── tasks:new ───────────────────────────────────────────────────────────────
  program
    .command('tasks:new')
    .description('Create a new task')
    .option('-n, --name <name>', 'Task name/title')
    .option('-d, --description <description>', 'Task description')
    .option('-p, --project <project>', 'Project name or ID (default: "default")')
    .option('-s, --status <status>', 'Initial status (default: ready)')
    .action(
      (opts: { name?: string; description?: string; project?: string; status?: string }) => {
        if (!opts.name && !opts.description) {
          console.error(chalk.red('Provide at least --name or --description.'));
          process.exit(1);
        }

        const name = opts.name ?? inferTitle(opts.description!);
        const status = opts.status ? parseStatus(opts.status) : 'ready';

        const task = createTask({
          name,
          description: opts.description,
          status,
          projectIdOrName: opts.project,
        });

        console.log(chalk.green('✓') + ` Created task ${chalk.cyan(taskTypeId(task.id))}`);
        console.log(`  ${chalk.bold(task.name)}`);
        if (task.description) console.log(`  ${chalk.dim(task.description)}`);
        console.log(`  Status: ${colorStatus(task.status)}`);
      }
    );

  // ── tasks:show ──────────────────────────────────────────────────────────────
  program
    .command('tasks:show <id>')
    .description('Show details for a task')
    .action((id: string) => {
      const task = getTask(id);
      if (!task) {
        console.error(chalk.red(`Task not found: "${id}"`));
        process.exit(1);
      }
      const project = getProject(task.project_id);
      console.log('');
      console.log(`  ${chalk.bold(task.name)}`);
      console.log(`  ${chalk.dim('─'.repeat(50))}`);
      console.log(`  ID:          ${chalk.cyan(taskTypeId(task.id))}`);
      console.log(`  Project:     ${chalk.cyan(project?.name ?? projectTypeId(task.project_id))}`);
      console.log(`  Status:      ${colorStatus(task.status)}`);
      if (task.description) console.log(`  Description: ${task.description}`);
      console.log(`  Created:     ${chalk.dim(task.created_at)}`);
      console.log(`  Updated:     ${chalk.dim(task.updated_at)}`);
      console.log('');
    });

  // ── tasks:update ────────────────────────────────────────────────────────────
  program
    .command('tasks:update <id>')
    .description('Update a task')
    .option('-n, --name <name>', 'New name')
    .option('-d, --description <description>', 'New description')
    .option('-s, --status <status>', 'New status')
    .option('-p, --project <project>', 'Move to project')
    .action(
      (
        id: string,
        opts: { name?: string; description?: string; status?: string; project?: string }
      ) => {
        if (!opts.name && !opts.description && !opts.status && !opts.project) {
          console.error(chalk.red('Provide at least one option to update.'));
          process.exit(1);
        }

        const status = opts.status ? parseStatus(opts.status) : undefined;
        const task = updateTask(id, {
          name: opts.name,
          description: opts.description,
          status,
          projectIdOrName: opts.project,
        });

        console.log(chalk.green('✓') + ` Updated task ${chalk.cyan(taskTypeId(task.id))}: ${chalk.bold(task.name)}`);
        console.log(`  Status: ${colorStatus(task.status)}`);
      }
    );

  // ── tasks:move ───────────────────────────────────────────────────────────────
  program
    .command('tasks:move <id> <status>')
    .description(`Move a task to a new status. Valid: ${TASK_STATUSES.join(', ')}`)
    .action((id: string, statusInput: string) => {
      const status = parseStatus(statusInput);
      const task = updateTask(id, { status });
      console.log(
        chalk.green('✓') +
          ` Moved ${chalk.cyan(taskTypeId(task.id))} → ${colorStatus(task.status)}`
      );
    });

  // ── tasks:delete ─────────────────────────────────────────────────────────────
  program
    .command('tasks:delete <id>')
    .description('Delete a task')
    .action((id: string) => {
      const task = getTask(id);
      if (!task) {
        console.error(chalk.red(`Task not found: "${id}"`));
        process.exit(1);
      }
      deleteTask(id);
      console.log(chalk.green('✓') + ` Deleted task ${chalk.cyan(taskTypeId(task.id))}: ${chalk.bold(task.name)}`);
    });
}
