"use strict";

const express = require("express");
const request = require("supertest");
const recurringDonationsRouter = require("./recurring-donations");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/recurring-donations", recurringDonationsRouter);
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: err.message || "Internal server error" });
  });
  return app;
}

describe("POST /api/recurring-donations", () => {
  let app;

  beforeEach(() => {
    app = buildApp();
  });

  test("accepts donation at exactly 1 XLM", async () => {
    const res = await request(app)
      .post("/api/recurring-donations")
      .send({
        projectId: "proj-1",
        projectName: "Test Project",
        amountXLM: "1",
        startDate: "2026-08-01",
        durationMonths: 3,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.amountXLM).toBe("1.0000000");
  });

  test("accepts donation at 1.0 XLM", async () => {
    const res = await request(app)
      .post("/api/recurring-donations")
      .send({
        projectId: "proj-1",
        projectName: "Test Project",
        amountXLM: 1.0,
        startDate: "2026-08-01",
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.amountXLM).toBe("1.0000000");
  });

  test("accepts donation at 1.5 XLM", async () => {
    const res = await request(app)
      .post("/api/recurring-donations")
      .send({
        projectId: "proj-1",
        projectName: "Test Project",
        amountXLM: "1.5",
        startDate: "2026-08-01",
        durationMonths: 6,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.amountXLM).toBe("1.5000000");
  });

  test("accepts donation at 5 XLM", async () => {
    const res = await request(app)
      .post("/api/recurring-donations")
      .send({
        projectId: "proj-1",
        projectName: "Test Project",
        amountXLM: "5",
        startDate: "2026-08-01",
        durationMonths: 12,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.amountXLM).toBe("5.0000000");
  });

  test("accepts donation with large amount", async () => {
    const res = await request(app)
      .post("/api/recurring-donations")
      .send({
        projectId: "proj-1",
        projectName: "Test Project",
        amountXLM: "1000",
        startDate: "2026-08-01",
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.amountXLM).toBe("1000.0000000");
  });

  test("rejects donation at 0 XLM", async () => {
    const res = await request(app)
      .post("/api/recurring-donations")
      .send({
        projectId: "proj-1",
        projectName: "Test Project",
        amountXLM: "0",
        startDate: "2026-08-01",
      })
      .expect(422);

    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details.amountXLM).toBe("Recurring donation must be at least 1 XLM");
  });

  test("rejects donation at 0.5 XLM", async () => {
    const res = await request(app)
      .post("/api/recurring-donations")
      .send({
        projectId: "proj-1",
        projectName: "Test Project",
        amountXLM: "0.5",
        startDate: "2026-08-01",
      })
      .expect(422);

    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details.amountXLM).toBe("Recurring donation must be at least 1 XLM");
  });

  test("rejects negative amount", async () => {
    const res = await request(app)
      .post("/api/recurring-donations")
      .send({
        projectId: "proj-1",
        projectName: "Test Project",
        amountXLM: "-5",
        startDate: "2026-08-01",
      })
      .expect(422);

    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details.amountXLM).toBe("Recurring donation must be at least 1 XLM");
  });

  test("rejects empty amountXLM", async () => {
    const res = await request(app)
      .post("/api/recurring-donations")
      .send({
        projectId: "proj-1",
        projectName: "Test Project",
        amountXLM: "",
        startDate: "2026-08-01",
      })
      .expect(422);

    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details.amountXLM).toBeDefined();
  });

  test("rejects missing projectId", async () => {
    const res = await request(app)
      .post("/api/recurring-donations")
      .send({
        projectName: "Test Project",
        amountXLM: "5",
        startDate: "2026-08-01",
      })
      .expect(422);

    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details.projectId).toBeDefined();
  });

  test("rejects HTML in projectName", async () => {
    const res = await request(app)
      .post("/api/recurring-donations")
      .send({
        projectId: "proj-1",
        projectName: "<script>alert('xss')</script>",
        amountXLM: "5",
        startDate: "2026-08-01",
      })
      .expect(422);

    expect(res.body.error).toBe("Validation failed");
  });

  test("returns 404 for unknown route", async () => {
    const res = await request(app)
      .get("/api/recurring-donations/unknown")
      .expect(404);

    expect(res.body.error).toBeDefined();
  });
});
