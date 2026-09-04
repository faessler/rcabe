import { useEffect, useMemo, useState } from "react";
import { api, type Task, type TaskStatus } from "./api.js";

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setTasks(await api.listTasks());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      const created = await api.createTask(trimmed);
      setTasks((prev) => [created, ...prev]);
      setTitle("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to create task");
    }
  }

  async function advance(task: Task) {
    const status = NEXT_STATUS[task.status];
    const updated = await api.updateTask(task.id, { status });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  }

  async function remove(task: Task) {
    await api.deleteTask(task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  }

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const task of tasks) map[task.status].push(task);
    return map;
  }, [tasks]);

  return (
    <div className="app">
      <header className="hero">
        <h1>rcabe</h1>
        <p>A tiny full-stack task board proving the Cloud Agent environment runs end to end.</p>
      </header>

      <form className="composer" onSubmit={handleAdd}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task and press Enter…"
          aria-label="New task title"
        />
        <button type="submit">Add task</button>
      </form>

      {error && <div className="banner error">{error}</div>}
      {loading ? (
        <div className="banner">Loading…</div>
      ) : (
        <main className="board">
          {COLUMNS.map((col) => (
            <section className="column" key={col.key}>
              <h2>
                {col.label} <span className="count">{grouped[col.key].length}</span>
              </h2>
              <ul>
                {grouped[col.key].map((task) => (
                  <li className={`card status-${task.status}`} key={task.id}>
                    <span className="card-title">{task.title}</span>
                    <div className="card-actions">
                      <button onClick={() => void advance(task)} title="Advance status">
                        →
                      </button>
                      <button
                        className="danger"
                        onClick={() => void remove(task)}
                        title="Delete task"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
                {grouped[col.key].length === 0 && <li className="empty">Nothing here yet</li>}
              </ul>
            </section>
          ))}
        </main>
      )}
    </div>
  );
}
