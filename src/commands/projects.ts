import { Command } from 'commander';
import chalk from 'chalk';
import { listProjects, createProject, deleteProject, getProject } from '../services/projects.ts';
import { projectTypeId } from '../utils/typeid.ts';

export function registerProjectCommands(program: Command) {
  program
    .command('projects:list')
    .description('List all projects')
    .action(() => {
      const projects = listProjects();
      if (projects.length === 0) {
        console.log(chalk.dim('No projects yet. Create one with: viban projects:new <name>'));
        return;
      }
      console.log('');
      console.log(chalk.bold('  Projects'));
      console.log(chalk.dim('  ' + '─'.repeat(50)));
      for (const p of projects) {
        console.log(`  ${chalk.cyan(projectTypeId(p.id).padEnd(31))}  ${chalk.white(p.name)}`);
      }
      console.log('');
    });

  program
    .command('projects:new <name>')
    .description('Create a new project')
    .action((name: string) => {
      if (getProject(name)) {
        console.error(chalk.red(`Project "${name}" already exists.`));
        process.exit(1);
      }
      const project = createProject(name);
      console.log(chalk.green('✓') + ` Created project ${chalk.cyan(projectTypeId(project.id))} ${chalk.bold(project.name)}`);
    });

  program
    .command('projects:delete <id-or-name>')
    .description('Delete a project and all its tasks')
    .option('-f, --force', 'Skip confirmation')
    .action(async (idOrName: string, opts: { force?: boolean }) => {
      const project = getProject(idOrName);
      if (!project) {
        console.error(chalk.red(`Project not found: "${idOrName}"`));
        process.exit(1);
      }
      if (project.name === 'default') {
        console.error(chalk.red('Cannot delete the "default" project.'));
        process.exit(1);
      }
      if (!opts.force) {
        process.stdout.write(
          chalk.yellow(`Delete project "${project.name}" and all its tasks? (y/N) `)
        );
        const answer = await readLine();
        if (answer.toLowerCase() !== 'y') {
          console.log('Aborted.');
          return;
        }
      }
      deleteProject(idOrName);
      console.log(chalk.green('✓') + ` Deleted project ${chalk.bold(project.name)}`);
    });
}

function readLine(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (chunk) => {
      data += chunk;
      resolve(data.trim());
    });
  });
}
