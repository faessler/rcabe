import { describe, expect, it } from "vitest";
import { TaskStore, ValidationError } from "./store.js";

describe("TaskStore", () => {
  it("creates tasks with defaults and trims titles", () => {
    const store = new TaskStore();
    const task = store.create({ title: "  write docs  " });
    expect(task.title).toBe("write docs");
    expect(task.status).toBe("todo");
    expect(task.id).toBe("t1");
  });

  it("rejects empty titles", () => {
    const store = new TaskStore();
    expect(() => store.create({ title: "   " })).toThrow(ValidationError);
  });

  it("rejects invalid statuses", () => {
    const store = new TaskStore();
    // @ts-expect-error deliberately invalid status
    expect(() => store.create({ title: "x", status: "nope" })).toThrow(ValidationError);
  });

  it("lists newest first", () => {
    const store = new TaskStore();
    store.create({ title: "first" });
    store.create({ title: "second" });
    const titles = store.list().map((t) => t.title);
    expect(titles).toEqual(["second", "first"]);
  });

  it("updates status and title", () => {
    const store = new TaskStore();
    const created = store.create({ title: "task" });
    const updated = store.update(created.id, { status: "done", title: "renamed" });
    expect(updated?.status).toBe("done");
    expect(updated?.title).toBe("renamed");
  });

  it("returns undefined when updating a missing task", () => {
    const store = new TaskStore();
    expect(store.update("missing", { status: "done" })).toBeUndefined();
  });

  it("removes tasks", () => {
    const store = new TaskStore();
    const created = store.create({ title: "task" });
    expect(store.remove(created.id)).toBe(true);
    expect(store.get(created.id)).toBeUndefined();
    expect(store.remove(created.id)).toBe(false);
  });
});
