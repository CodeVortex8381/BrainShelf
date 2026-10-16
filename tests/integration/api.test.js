const { describe, it } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const app = require("../../server");
const { generateToken } = require("../../src/utils/jwt.utils");

describe("BrainShelf API Integration Tests", () => {
  it("GET /api/health should return safe health status without credentials", async () => {
    const res = await request(app).get("/api/health");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "ok");
    assert.ok(res.body.database);
    assert.ok(res.body.storage);
    // Ensure no secrets are leaked
    const jsonStr = JSON.stringify(res.body);
    assert.strictEqual(jsonStr.includes("mongodb+srv"), false);
    assert.strictEqual(jsonStr.includes("secret"), false);
  });

  it("GET /api/notes should return public approved notes catalogue with search & filter support", async () => {
    const res = await request(app).get("/api/notes");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.notes));
    assert.ok(res.body.notes.length > 0);

    // Filter by Programming
    const filteredRes = await request(app).get("/api/notes?category=Programming");
    assert.strictEqual(filteredRes.status, 200);
    for (const note of filteredRes.body.notes) {
      assert.strictEqual(note.category, "Programming");
    }

    // Search query
    const searchRes = await request(app).get("/api/notes?search=Java");
    assert.strictEqual(searchRes.status, 200);
    assert.ok(searchRes.body.notes.length > 0);
  });

  it("POST /api/auth/register should reject invalid inputs", async () => {
    // Missing name
    const res1 = await request(app).post("/api/auth/register").send({
      email: "test@example.com",
      password: "validPassword123",
    });
    assert.strictEqual(res1.status, 400);
    assert.match(res1.body.error, /name/i);

    // Invalid email
    const res2 = await request(app).post("/api/auth/register").send({
      name: "John Doe",
      email: "not-an-email",
      password: "validPassword123",
    });
    assert.strictEqual(res2.status, 400);
    assert.match(res2.body.error, /email/i);

    // Short password
    const res3 = await request(app).post("/api/auth/register").send({
      name: "John Doe",
      email: "john@example.com",
      password: "123",
    });
    assert.strictEqual(res3.status, 400);
    assert.match(res3.body.error, /password/i);
  });

  it("Protected routes should reject unauthenticated requests with 401", async () => {
    const resMine = await request(app).get("/api/notes/mine");
    assert.strictEqual(resMine.status, 401);
    assert.match(resMine.body.error, /authentication/i);

    const resAdminNotes = await request(app).get("/api/admin/notes");
    assert.strictEqual(resAdminNotes.status, 401);

    const resAdminStats = await request(app).get("/api/admin/stats");
    assert.strictEqual(resAdminStats.status, 401);
  });

  it("Student role cannot access admin endpoints (returns 403 Forbidden)", async () => {
    const studentToken = generateToken({
      userId: "dummy_student_123",
      email: "student@example.com",
      role: "student",
    });

    const res = await request(app)
      .get("/api/admin/notes")
      .set("Cookie", [`token=${studentToken}`]);

    assert.strictEqual(res.status, 403);
    assert.match(res.body.error, /administrator privileges required/i);
  });

  it("Admin role can access admin queue and stats", async () => {
    const adminToken = generateToken({
      userId: "dummy_admin_123",
      email: "admin@brainshelf.edu",
      role: "admin",
    });

    const resNotes = await request(app)
      .get("/api/admin/notes")
      .set("Cookie", [`token=${adminToken}`]);

    assert.strictEqual(resNotes.status, 200);
    assert.strictEqual(resNotes.body.success, true);

    const resStats = await request(app)
      .get("/api/admin/stats")
      .set("Cookie", [`token=${adminToken}`]);

    assert.strictEqual(resStats.status, 200);
    assert.strictEqual(resStats.body.success, true);
    assert.ok(resStats.body.stats !== undefined);
  });

  it("POST /api/notes should reject upload if unauthenticated", async () => {
    const res = await request(app).post("/api/notes");
    assert.strictEqual(res.status, 401);
  });

  it("POST /api/notes should reject upload if non-PDF is attached", async () => {
    const studentToken = generateToken({
      userId: "dummy_student_123",
      email: "student@example.com",
      role: "student",
    });

    const fakeExeBuffer = Buffer.from("MZExecutablePayload");

    const res = await request(app)
      .post("/api/notes")
      .set("Cookie", [`token=${studentToken}`])
      .field("title", "Computer Networks")
      .field("subject", "Networking")
      .field("category", "Web Development")
      .field("semester", "Semester 3")
      .field("description", "Comprehensive notes on OSI and TCP models")
      .attach("pdf", fakeExeBuffer, "virus.exe");

    assert.strictEqual(res.status, 400);
  });
});
