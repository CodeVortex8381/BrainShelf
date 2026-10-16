const { describe, it } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const { Note, VALID_CATEGORIES, VALID_SEMESTERS, VALID_STATUSES } = require("../../src/models/Note");

describe("Note Model Unit Tests", () => {
  it("should validate all required categories and semesters", () => {
    assert.deepStrictEqual(VALID_CATEGORIES, [
      "Programming",
      "Database",
      "AI",
      "Web Development",
      "Other",
    ]);

    assert.ok(VALID_SEMESTERS.includes("Semester 1"));
    assert.ok(VALID_SEMESTERS.includes("Semester 8"));
    assert.ok(VALID_SEMESTERS.includes("All Semesters"));

    assert.deepStrictEqual(VALID_STATUSES, ["pending", "approved", "rejected"]);
  });

  it("should default note status to 'pending'", () => {
    const dummyId = new mongoose.Types.ObjectId();
    const note = new Note({
      title: "Clean Code Principles",
      subject: "Software Engineering",
      category: "Programming",
      semester: "Semester 3",
      description: "Best practices for writing maintainable software.",
      uploader: dummyId,
      storagePublicId: "test_pub_123",
      secureUrl: "https://example.com/test.pdf",
      fileSizeBytes: 102400,
      originalFileName: "clean_code.pdf",
    });

    assert.strictEqual(note.status, "pending");
  });

  it("should fail validation if category is invalid", async () => {
    const dummyId = new mongoose.Types.ObjectId();
    const note = new Note({
      title: "Some Note",
      subject: "Math",
      category: "InvalidCategoryNotListed",
      semester: "Semester 1",
      description: "Sample description here",
      uploader: dummyId,
      storagePublicId: "pub_123",
      secureUrl: "https://example.com/test.pdf",
      fileSizeBytes: 1000,
      originalFileName: "test.pdf",
    });

    await assert.rejects(
      async () => {
        await note.validate();
      },
      (err) => Boolean(err.errors["category"])
    );
  });

  it("should fail validation if semester is invalid", async () => {
    const dummyId = new mongoose.Types.ObjectId();
    const note = new Note({
      title: "Some Note",
      subject: "Math",
      category: "Programming",
      semester: "Semester 99",
      description: "Sample description here",
      uploader: dummyId,
      storagePublicId: "pub_123",
      secureUrl: "https://example.com/test.pdf",
      fileSizeBytes: 1000,
      originalFileName: "test.pdf",
    });

    await assert.rejects(
      async () => {
        await note.validate();
      },
      (err) => Boolean(err.errors["semester"])
    );
  });

  it("should fail validation if title is shorter than 3 characters", async () => {
    const dummyId = new mongoose.Types.ObjectId();
    const note = new Note({
      title: "AB",
      subject: "Math",
      category: "Programming",
      semester: "Semester 1",
      description: "Sample description here",
      uploader: dummyId,
      storagePublicId: "pub_123",
      secureUrl: "https://example.com/test.pdf",
      fileSizeBytes: 1000,
      originalFileName: "test.pdf",
    });

    await assert.rejects(
      async () => {
        await note.validate();
      },
      (err) => Boolean(err.errors["title"])
    );
  });
});
