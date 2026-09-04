import cors from "cors";
import express, { type Express } from "express";
import { TaskStore, ValidationError, type CreateTaskInput } from "./store.js";

const DEFAULT_SEED: CreateTaskInput[] = [
  { title: "Set up the Cloud Agent environment", status: "done" },
  { title: "Wire the API to the web client", status: "in_progress" },
  { title: "Ship the first feature", status: "todo" },
];

export function createApp(store: TaskStore = new TaskStore(DEFAULT_SEED)): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.get("/api/tasks", (_req, res) => {
    res.json(store.list());
  });

  app.post("/api/tasks", (req, res) => {
    try {
      const task = store.create({
        title: req.body?.title,
        status: req.body?.status,
      });
      res.status(201).json(task);
    } catch (err) {
      handleError(res, err);
    }
  });

  app.patch("/api/tasks/:id", (req, res) => {
    try {
      const task = store.update(req.params.id, {
        title: req.body?.title,
        status: req.body?.status,
      });
      if (!task) {
        res.status(404).json({ error: "task not found" });
        return;
      }
      res.json(task);
    } catch (err) {
      handleError(res, err);
    }
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const removed = store.remove(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "task not found" });
      return;
    }
    res.status(204).end();
  });

  return app;
}

function handleError(res: express.Response, err: unknown): void {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "internal server error" });
}
