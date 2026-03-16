#!/usr/bin/env bun
import { Command } from 'commander';
import { registerInitCommand } from './commands/init.ts';
import { registerProjectCommands } from './commands/projects.ts';
import { registerTaskCommands } from './commands/tasks.ts';
import { registerBoardCommand } from './commands/board.ts';

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
