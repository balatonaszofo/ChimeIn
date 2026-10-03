import { MODEL, DEFAULTS, REPLY_MODES, replyMode, threadId, cleanPost, requestBody, parseSuggestions } from "./core.js";
const pending = new Map();
let quotaQueue = Promise.resolve();
let cacheQueue = Promise.resolve();
const ready = chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());
chrome.runtime.onInstalled.addListener(({ reason }) => { if (reason === "install") chrome.runtime.openOptionsPage(); });
async function reserve(limit) {
  const task = quotaQueue.then(async () => {
    const { usage } = await chrome.storage.local.get("usage");
    const date = new Date().toISOString().slice(0, 10);
    const count = usage?.date === date ? usage.count : 0;
    if (count >= limit) throw new Error("Daily request limit reached. Suggestions resume tomorrow (UTC).");
    await chrome.storage.local.set({ usage: { date, count: count + 1 } });
  });
  quotaQueue = task.catch(() => {});
  return task;
}
async function generate(message, sender) {
  await ready;
  const id = threadId(sender.url);
  if (!sender.tab || !id || id !== message.id) throw new Error("Open a Reddit comment thread first.");
  const stored = await chrome.storage.local.get(["settings", "cache"]);
  const settings = { ...DEFAULTS, ...stored.settings };
  if (!settings.enabled) return { disabled: true };
  if (!settings.apiKey) return { setup: true };
  const post = cleanPost(message.post);
  const mode = replyMode(settings.mode);
  const labels = REPLY_MODES[mode].labels;
  const signature = JSON.stringify([MODEL, post, settings.tone, mode, 2]);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(signature))))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  const key = id + ":" + hash;
  if (pending.has(key)) return pending.get(key);
  const task = (async () => {
    const { cache: freshCache, failures } = await chrome.storage.local.get(["cache", "failures"]);
    const cached = freshCache?.[key];
    if (cached && Date.now() - cached.at < 7 * 86400000) return { suggestions: cached.suggestions, cached: true, mode, labels };
    if (failures?.[key] && Date.now() - failures[key] < 60000) throw new Error("Please wait a minute before retrying this thread.");
    await reserve(Math.max(1, Math.min(500, Number(settings.dailyLimit) || 100)));
    let response;
    try {
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent", {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": settings.apiKey },
        body: JSON.stringify(requestBody(post, settings.tone, mode)), signal: AbortSignal.timeout(25000)
      });
      if (!response.ok) {
        if ([400, 401, 403].includes(response.status)) throw new Error("Check your Gemini API key, billing and model access in settings.");
        if (response.status === 429) throw new Error("Gemini is rate limiting requests. Try again later.");
        throw new Error("Gemini is unavailable right now. Try again later.");
      }
      const data = await response.json();
      const suggestions = parseSuggestions(data);
      const write = cacheQueue.then(async () => {
        const latest = await chrome.storage.local.get("cache");
        const cache = Object.fromEntries(Object.entries(latest.cache || {}).filter(([, v]) => Date.now() - v.at < 7 * 86400000));
        cache[key] = { at: Date.now(), suggestions };
        const bounded = Object.fromEntries(Object.entries(cache).sort((a,b) => b[1].at - a[1].at).slice(0, 150));
        await chrome.storage.local.set({ cache: bounded });
      });
      cacheQueue = write.catch(() => {});
      await write;
      return { suggestions, cached: false, mode, labels, tokens: data.usageMetadata?.totalTokenCount };
    } catch (error) {
      const latest = await chrome.storage.local.get("failures");
      const failures = Object.fromEntries(Object.entries(latest.failures || {}).filter(([, at]) => Date.now() - at < 60000));
      failures[key] = Date.now();
      await chrome.storage.local.set({ failures });
      if (error.name === "TimeoutError" || error.name === "AbortError") throw new Error("That took too long. Try again in a minute.");
      if (error instanceof TypeError) throw new Error("Couldn't reach Gemini. Check your connection.");
      throw error;
    }
  })();
  pending.set(key, task);
  try { return await task; } finally { pending.delete(key); }
}
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message?.type === "OPEN_SETTINGS") { chrome.runtime.openOptionsPage(); reply({ ok: true }); return; }
  if (message?.type !== "SUGGEST") return;
  generate(message, sender).then(reply).catch(error => reply({ error: error.message || "Something went wrong." }));
  return true;
});
