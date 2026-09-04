export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
}

export interface CreateTaskInput {
  title: string;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  status?: TaskStatus;
}

const VALID_STATUSES: readonly TaskStatus[] = ["todo", "in_progress", "done"];

export function isValidStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value);
}

/**
 * A tiny in-memory task store. Kept dependency-free so the environment can be
 * demonstrated end-to-end without provisioning an external database.
 */
export class TaskStore {
  private tasks = new Map<string, Task>();
  private counter = 0;

  constructor(seed: CreateTaskInput[] = []) {
    for (const item of seed) {
      this.create(item);
    }
  }

  list(): Task[] {
    // Map preserves insertion order; reverse it so newest tasks come first.
    return [...this.tasks.values()].reverse();
  }

  get(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  create({ title, status = "todo" }: CreateTaskInput): Task {
    const trimmed = title.trim();
    if (!trimmed) {
      throw new ValidationError("title is required");
    }
    if (!isValidStatus(status)) {
      throw new ValidationError(`status must be one of: ${VALID_STATUSES.join(", ")}`);
    }
    this.counter += 1;
    const task: Task = {
      id: `t${this.counter}`,
      title: trimmed,
      status,
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  update(id: string, patch: UpdateTaskInput): Task | undefined {
    const existing = this.tasks.get(id);
    if (!existing) {
      return undefined;
    }
    if (patch.title !== undefined) {
      const trimmed = patch.title.trim();
      if (!trimmed) {
        throw new ValidationError("title cannot be empty");
      }
      existing.title = trimmed;
    }
    if (patch.status !== undefined) {
      if (!isValidStatus(patch.status)) {
        throw new ValidationError(`status must be one of: ${VALID_STATUSES.join(", ")}`);
      }
      existing.status = patch.status;
    }
    this.tasks.set(id, existing);
    return existing;
  }

  remove(id: string): boolean {
    return this.tasks.delete(id);
  }
}

export class ValidationError extends Error {}
