#!/usr/bin/env bun
import { Command } from 'commander';
import chalk from 'chalk';
import { registerInitCommand } from './commands/init.ts';
import { registerProjectCommands } from './commands/projects.ts';
import { registerTaskCommands } from './commands/tasks.ts';
import { registerBoardCommand } from './commands/board.ts';

process.on('uncaughtException', (err) => {
  console.error(chalk.red('Error: ') + (err.message ?? String(err)));
  process.exit(1);
});

const program = new Command();

program
  .name('viban')
  .description('A Kanban-style board in your CLI')
  .version('0.1.0');

registerInitCommand(program);
registerProjectCommands(program);
registerTaskCommands(program);
registerBoardCommand(program);

program.parse(process.argv);
