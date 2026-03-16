import type { Command } from 'commander';
import { db } from '../db.ts';
import { getOrCreateDefault } from '../services/projects.ts';
import { projectTypeId } from '../utils/typeid.ts';

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize the viban database and create the default project')
    .action(() => {
      // Verify DB connection with a trivial query
      try {
        db.query('SELECT 1').get();
      } catch (err) {
        console.error('Failed to connect to the database:', err);
        process.exit(1);
      }
      console.log('Database ready.');

      const project = getOrCreateDefault();
      console.log(`Default project ready: ${project.name} (${projectTypeId(project.id)})`);
    });
}
