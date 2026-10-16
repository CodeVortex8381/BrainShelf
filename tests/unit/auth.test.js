const { describe, it } = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcryptjs");
const User = require("../../src/models/User");
const { generateToken, verifyToken } = require("../../src/utils/jwt.utils");

describe("Auth & User Model Unit Tests", () => {
  it("should hash passwords securely with bcrypt", async () => {
    const plaintext = "SecretPassword123!";
    const hash = await User.hashPassword(plaintext);

    assert.notStrictEqual(hash, plaintext);
    assert.strictEqual(typeof hash, "string");
    assert.match(hash, /^\$2[aby]\$/); // Valid bcrypt hash prefix

    const isMatch = await bcrypt.compare(plaintext, hash);
    assert.strictEqual(isMatch, true);

    const isWrong = await bcrypt.compare("WrongPassword", hash);
    assert.strictEqual(isWrong, false);
  });

  it("should reject short passwords less than 6 characters", async () => {
    await assert.rejects(
      async () => {
        await User.hashPassword("12345");
      },
      {
        message: /at least 6 characters/i,
      }
    );
  });

  it("should never expose passwordHash in toJSON()", () => {
    const userDoc = new User({
      name: "Alice Smith",
      email: "Alice.Smith@College.Edu",
      passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890",
      semester: "Semester 1",
      college: "City Tech",
      role: "student",
    });

    const json = userDoc.toJSON();
    assert.strictEqual(json.name, "Alice Smith");
    assert.strictEqual(json.passwordHash, undefined);
    assert.strictEqual(json.__v, undefined);
  });

  it("should normalize email to lowercase in Mongoose schema", () => {
    const userDoc = new User({
      name: "Bob Jones",
      email: "BOB.JONES@Domain.Com",
      passwordHash: "dummyHashForTestingPurposes123456",
      role: "student",
    });

    assert.strictEqual(userDoc.email, "bob.jones@domain.com");
  });

  it("should generate and verify valid JWT tokens", () => {
    const payload = {
      userId: "user_test_123",
      email: "test@example.com",
      role: "student",
    };

    const token = generateToken(payload);
    assert.strictEqual(typeof token, "string");

    const decoded = verifyToken(token);
    assert.strictEqual(decoded.userId, payload.userId);
    assert.strictEqual(decoded.email, payload.email);
    assert.strictEqual(decoded.role, payload.role);
  });

  it("should return null when verifying a malformed or invalid JWT token", () => {
    const invalidResult = verifyToken("this.is.not.a.valid.jwt");
    assert.strictEqual(invalidResult, null);
  });
});
