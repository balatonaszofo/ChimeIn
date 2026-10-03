import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const state = {};
let listener;
let calls = 0;
globalThis.chrome = {
  storage: { local: {
    setAccessLevel: async () => {},
    get: async keys => Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(k => [k, structuredClone(state[k])])),
    set: async values => Object.assign(state, structuredClone(values))
  }},
  action: { onClicked: { addListener() {} } },
  runtime: { onInstalled: { addListener() {} }, onMessage: { addListener(fn) { listener = fn; } }, openOptionsPage() {} }
};
globalThis.fetch = async () => { calls++; return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '["Question?", "Observation.", "Another angle."]' }] } }] }) }; };
await import("../background.js");
const sender = { url: "https://www.reddit.com/r/test/comments/abc123/title/", tab: { id: 1 } };
const message = { type: "SUGGEST", id: "abc123", post: { title: "A post", body: "Some context", subreddit: "r/test" } };
const send = (msg = message, from = sender) => new Promise(resolve => listener(msg, from, resolve));
test("worker safeguards, deduplication, cache and limits", async () => {
  assert.equal((await send()).setup, true);
  state.settings = { apiKey: "test-key", enabled: true, dailyLimit: 1 };
  assert.match((await send(message, { ...sender, url: "https://evil.com/comments/abc123/" })).error, /Reddit/);
  assert.equal(calls, 0);
  const results = await Promise.all([send(), send()]);
  assert.equal(calls, 1);
  assert.deepEqual(results[0].suggestions, results[1].suggestions);
  assert.equal(state.usage.count, 1);
  assert.equal((await send()).cached, true);
  assert.equal(calls, 1);
  const other = { ...message, post: { ...message.post, title: "Another post" } };
  assert.match((await send(other)).error, /Daily request limit/);
  state.settings.enabled = false;
  assert.equal((await send()).disabled, true);
});
test("rate errors are safe and retries are throttled", async () => {
  state.settings = { apiKey: "test-key", dailyLimit: 100, enabled: true };
  globalThis.fetch = async () => { calls++; return { ok: false, status: 429 }; };
  const msg = { ...message, post: { title: "Rate limited post" } };
  const before = calls;
  assert.match((await send(msg)).error, /rate limiting/);
  assert.match((await send(msg)).error, /wait a minute/);
  assert.equal(calls, before + 1);
});



test("changing mode generates fresh replies and returning to it uses its cache", async () => {
  state.settings = { apiKey: "test-key", dailyLimit: 100, enabled: true, mode: "mom" };
  const observed = [];
  globalThis.fetch = async (url, options) => {
    calls++; observed.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '["One.", "Two.", "Three."]' }] } }] }) };
  };
  const msg = { ...message, post: { title: "Personality switching" } };
  const before = calls;
  const mom = await send(msg);
  assert.equal(mom.mode, "mom");
  assert.equal(mom.labels[0], "A little reassurance");
  state.settings.mode = "byzantine";
  const history = await send(msg);
  assert.equal(history.mode, "byzantine");
  assert.equal(calls, before + 2);
  assert.ok(JSON.parse(observed[1].contents[0].parts[0].text).historyFacts.length);
  state.settings.mode = "mom";
  assert.equal((await send(msg)).cached, true);
  assert.equal(calls, before + 2);
});
