#!/usr/bin/env bun
/**
 * Seed the viban database with demo projects and tasks.
 * Run with: bun run seed
 *
 * WARNING: deletes ALL existing projects and tasks before seeding.
 */
import { db } from '../src/db.ts';
import { createProject } from '../src/services/projects.ts';
import { createTask } from '../src/services/tasks.ts';

db.run('DELETE FROM tasks');
db.run('DELETE FROM projects');

const projects: Array<{
  name: string;
  tasks: Array<{ name: string; description?: string; status: Parameters<typeof createTask>[0]['status'] }>;
}> = [
  {
    name: 'Website Redesign',
    tasks: [
      { name: 'Audit current site for accessibility issues', status: 'done' },
      { name: 'Define new brand color palette', status: 'done' },
      { name: 'Design mobile-first wireframes', status: 'done' },
      { name: 'Build component library in Storybook', status: 'in_review', description: 'Button, Input, Card, Modal, Toast — all variants covered' },
      { name: 'Migrate landing page to new design', status: 'in_progress', description: 'Hero section and nav are done; working on features grid' },
      { name: 'Update pricing page copy', status: 'in_progress' },
      { name: 'Replace all stock photos with custom illustrations', status: 'todo' },
      { name: 'Write new About Us page', status: 'todo' },
      { name: 'SEO meta tag audit and updates', status: 'todo' },
      { name: 'Cross-browser QA pass', status: 'ready' },
      { name: 'Set up redirect map for old URLs', status: 'ready' },
      { name: 'Performance budget and Lighthouse CI check', status: 'ready' },
    ],
  },
  {
    name: 'Mobile App v2',
    tasks: [
      { name: 'Finalize v2 feature scope with product', status: 'done' },
      { name: 'Set up React Native project with Expo', status: 'done' },
      { name: 'Implement push notification permissions flow', status: 'done' },
      { name: 'Build onboarding carousel', status: 'in_review', description: 'Three screens; awaiting design sign-off on copy' },
      { name: 'Integrate payments via Stripe SDK', status: 'in_progress', description: 'Card entry working; Apple Pay and Google Pay still TODO' },
      { name: 'Offline mode with SQLite sync', status: 'todo', description: 'Use WAL mode; resolve conflicts last-write-wins for now' },
      { name: 'Deep link handling for notifications', status: 'todo' },
      { name: 'App Store screenshot generation', status: 'ready' },
      { name: 'Beta TestFlight distribution', status: 'ready' },
    ],
  },
  {
    name: 'API Backend',
    tasks: [
      { name: 'Design REST API contract (OpenAPI spec)', status: 'done' },
      { name: 'Set up Postgres schema and migrations', status: 'done' },
      { name: 'Auth: JWT issue and refresh endpoints', status: 'done' },
      { name: 'Rate limiting middleware', status: 'done' },
      { name: 'User CRUD endpoints', status: 'in_review' },
      { name: 'Webhook delivery with retry queue', status: 'in_progress', description: 'Using BullMQ; exponential backoff up to 5 retries' },
      { name: 'Audit log for all write operations', status: 'in_progress' },
      { name: 'Add cursor-based pagination to list endpoints', status: 'todo' },
      { name: 'Write integration test suite', status: 'todo' },
      { name: 'Set up staging environment on Fly.io', status: 'ready' },
      { name: 'Configure Datadog APM and error tracking', status: 'ready' },
    ],
  },
];

for (const proj of projects) {
  const project = createProject(proj.name);
  for (const task of proj.tasks) {
    createTask({ ...task, projectIdOrName: project.name });
  }
  console.log(`  ✓ ${project.name} — ${proj.tasks.length} tasks`);
}

const total = projects.reduce((n, p) => n + p.tasks.length, 0);
console.log(`\nSeeded ${projects.length} projects and ${total} tasks.\n`);
