import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_SESSION_MAX_AGE, checkAdminPassword, createAdminSession, isAdminConfigured, verifyAdminSession } from "../lib/admin-session.ts";

const oldPassword = process.env.ADMIN_PASSWORD;
const oldSecret = process.env.ADMIN_SESSION_SECRET;
const restore = () => {
  if (oldPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = oldPassword;
  if (oldSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = oldSecret;
};

test("no default, missing or short admin password", () => {
  try {
    delete process.env.ADMIN_PASSWORD;
    assert.equal(isAdminConfigured(), false);
    assert.equal(createAdminSession(), null);
    assert.equal(checkAdminPassword("1111"), false);
    process.env.ADMIN_PASSWORD = "1111";
    assert.equal(isAdminConfigured(), false);
  } finally { restore(); }
});

test("password check and short-lived signed session", () => {
  try {
    process.env.ADMIN_PASSWORD = "change-this-to-a-long-private-passphrase";
    process.env.ADMIN_SESSION_SECRET = "a-really-long-session-secret-not-for-clients";
    const now = Date.UTC(2026, 10, 13, 0, 0, 0);
    assert.equal(isAdminConfigured(), true);
    assert.equal(checkAdminPassword("change-this-to-a-long-private-passphrase"), true);
    assert.equal(checkAdminPassword("incorrect"), false);
    const token = createAdminSession(now);
    assert.ok(token);
    assert.equal(verifyAdminSession(token, now), true);
    assert.equal(verifyAdminSession(token, now + ADMIN_SESSION_MAX_AGE * 1000), false);
    assert.equal(verifyAdminSession(token.replace(/.$/, "X"), now), false);
    process.env.ADMIN_SESSION_SECRET = "rotated-session-secret-32-or-more-characters";
    assert.equal(verifyAdminSession(token, now), false);
  } finally { restore(); }
});
