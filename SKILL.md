# Skill: Task Tracking with viban

AI agents should use `viban` to record and track their work in real time so human owners can see what is happening on the Kanban board at any point.

## Setup

Before using viban for the first time in a project, initialize it:

```bash
viban init
```

This creates the local SQLite database and a default project. Only needs to be done once.

## Core Workflow

### 1. Create a task when starting a unit of work

As soon as you identify a discrete piece of work, create a task for it:

```bash
viban tasks:new -n "Refactor authentication middleware" -d "Extract JWT validation into its own module"
```

- Use `-n` for a short, human-readable title
- Use `-d` to add context about what you are doing and why
- Use `-p <project>` to scope the task to a specific project (defaults to "default")
- Capture the returned task ID — you will need it for subsequent commands

### 2. Move the task to `in_progress` when you start

```bash
viban tasks:move <task-id> in_progress
```

Do this immediately before you begin the work, not after. This lets the human owner see what you are actively working on right now.

### 3. Move to `in_review` when complete but awaiting validation

If the work produces output that needs human review (a PR, a generated file, a query result, etc.), move the task to `in_review`:

```bash
viban tasks:move <task-id> in_review
```

### 4. Mark `done` when the work is fully complete

```bash
viban tasks:move <task-id> done
```

## Guidelines

**Create tasks at the right granularity.** One task per logical unit of work — not one task for an entire session, and not a separate task for every shell command. A task should map to something a human would care to track (e.g., "Fix failing tests", "Migrate users table", "Generate monthly report").

**Keep names and descriptions human-readable.** The board is for the human owner. Write task names as if you were handing them a sticky note.

**Use projects to group related work.** If working across multiple concerns in one session, create or reuse a named project:

```bash
viban projects:new myproject
viban tasks:new -n "Update dependencies" -p myproject
```

**Update descriptions when scope changes.** If what you are doing turns out to be different from what you recorded, update the task before continuing:

```bash
viban tasks:update <task-id> -d "Scope expanded to include integration tests after discovering coverage gap"
```

**Do not batch tasks retroactively.** Create and move tasks in real time. A board that only reflects completed work is not useful for oversight.

## Status Reference

| Status        | When to use                                          |
| ------------- | ---------------------------------------------------- |
| `ready`       | Task identified but not yet started                  |
| `todo`        | Planned for this session but not started yet         |
| `in_progress` | Actively being worked on right now                   |
| `in_review`   | Work done; awaiting human review or external process |
| `done`        | Fully complete                                       |

## Checking Tasks

You can use `viban tasks:list` to get a tabular list of tasks, ids, and current statuses.

```bash
viban tasks:list
```

Scoped to a particulat project:

```bash
viban tasks:list -p <project_id>
```

## Quick Reference

```bash
viban tasks:new -n "Task name" -d "What and why" -p myproject
viban tasks:move <task-id> in_progress
viban tasks:move <task-id> in_review
viban tasks:move <task-id> done
viban tasks:show <task-id>
viban tasks:list
```

## Full Docs

If needed, full docs describing all commands are in the README.md file
