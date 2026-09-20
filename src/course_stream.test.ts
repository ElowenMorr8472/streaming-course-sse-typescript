import assert from "node:assert/strict";
import { deadlineState } from "./course_stream.js";

const now = new Date("2026-09-10T12:00:00.000Z");
assert.equal(deadlineState(new Date("2026-09-11T11:59:00.000Z"), now), "due");
assert.equal(deadlineState(new Date("2026-09-11T12:01:00.000Z"), now), "open");
assert.equal(deadlineState(new Date("2026-09-10T11:59:00.000Z"), now), "late");
console.log("deadline decision checks passed");
