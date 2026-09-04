import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { TaskStore } from "./store.js";

function appWithEmptyStore() {
  return createApp(new TaskStore());
}

describe("task API", () => {
  it("reports health", async () => {
    const res = await request(appWithEmptyStore()).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("creates and lists tasks", async () => {
    const app = appWithEmptyStore();
    const create = await request(app).post("/api/tasks").send({ title: "demo task" });
    expect(create.status).toBe(201);
    expect(create.body.title).toBe("demo task");

    const list = await request(app).get("/api/tasks");
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].title).toBe("demo task");
  });

  it("validates request bodies", async () => {
    const res = await request(appWithEmptyStore()).post("/api/tasks").send({ title: "" });
    expect(res.status).toBe(400);
  });

  it("updates a task status", async () => {
    const app = appWithEmptyStore();
    const created = await request(app).post("/api/tasks").send({ title: "x" });
    const patched = await request(app)
      .patch(`/api/tasks/${created.body.id}`)
      .send({ status: "done" });
    expect(patched.status).toBe(200);
    expect(patched.body.status).toBe("done");
  });

  it("returns 404 for unknown tasks", async () => {
    const res = await request(appWithEmptyStore()).delete("/api/tasks/nope");
    expect(res.status).toBe(404);
  });
});
