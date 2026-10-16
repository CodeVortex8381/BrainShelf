const { describe, it } = require("node:test");
const assert = require("node:assert");
const { validatePdf } = require("../../src/utils/pdfValidator");

describe("PDF Validator Unit Tests", () => {
  it("should accept a valid PDF buffer with %PDF header and .pdf extension", () => {
    const validBuffer = Buffer.from("%PDF-1.4 sample content here");
    const result = validatePdf(validBuffer, "notes.pdf", "application/pdf");
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.error, undefined);
  });

  it("should reject an empty buffer", () => {
    const emptyBuffer = Buffer.alloc(0);
    const result = validatePdf(emptyBuffer, "empty.pdf", "application/pdf");
    assert.strictEqual(result.valid, false);
    assert.match(result.error, /empty/i);
  });

  it("should reject a file with non-pdf extension", () => {
    const buffer = Buffer.from("%PDF-1.4 content");
    const result = validatePdf(buffer, "malicious.exe", "application/pdf");
    assert.strictEqual(result.valid, false);
    assert.match(result.error, /\.pdf extension/i);
  });

  it("should reject a renamed file whose magic bytes are not %PDF", () => {
    const fakeBuffer = Buffer.from("MZThisIsAnExecutableFileNotAPdf");
    const result = validatePdf(fakeBuffer, "fake.pdf", "application/pdf");
    assert.strictEqual(result.valid, false);
    assert.match(result.error, /signature mismatch/i);
  });

  it("should reject a file exceeding max size limit", () => {
    const largeBuffer = Buffer.concat([Buffer.from("%PDF"), Buffer.alloc(11 * 1024 * 1024)]);
    const result = validatePdf(largeBuffer, "huge.pdf", "application/pdf", 10);
    assert.strictEqual(result.valid, false);
    assert.match(result.error, /exceeds the maximum limit/i);
  });

  it("should reject invalid MIME types", () => {
    const buffer = Buffer.from("%PDF-1.4 valid content");
    const result = validatePdf(buffer, "note.pdf", "text/plain");
    assert.strictEqual(result.valid, false);
    assert.match(result.error, /application\/pdf/i);
  });
});
