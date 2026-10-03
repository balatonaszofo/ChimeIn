import { DEFAULTS, REPLY_MODES, replyMode } from "./core.js";
const form = document.querySelector("form");
const status = document.querySelector("#status");
const stored = await chrome.storage.local.get(["settings", "usage"]);
const settings = { ...DEFAULTS, ...stored.settings };
const picker = form.elements.mode;
for (const [value, mode] of Object.entries(REPLY_MODES)) {
  const option = document.createElement("option");
  option.value = value; option.textContent = mode.label; picker.append(option);
}
picker.value = replyMode(settings.mode);
const describeMode = () => {
  document.querySelector("#modeDescription").textContent = REPLY_MODES[replyMode(picker.value)].description;
  document.querySelector("#historyNote").hidden = picker.value !== "byzantine";
};
picker.addEventListener("change", describeMode);
describeMode();
for (const name of ["apiKey", "tone", "dailyLimit"]) form.elements[name].value = settings[name];
form.elements.enabled.checked = settings.enabled;
document.querySelector("#usage").textContent = "Requests today (UTC): " + (stored.usage?.date === new Date().toISOString().slice(0, 10) ? stored.usage.count : 0);
form.addEventListener("submit", async event => {
  event.preventDefault();
  try {
    const apiKey = form.elements.apiKey.value.trim();
    if (!apiKey || /\s/.test(apiKey)) throw new Error("Paste a valid API key without spaces.");
    const dailyLimit = Number(form.elements.dailyLimit.value);
    if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 500) throw new Error("Choose a daily limit between 1 and 500.");
    await chrome.storage.local.set({ settings: { apiKey, mode: replyMode(picker.value), tone: form.elements.tone.value.trim().slice(0, 300), dailyLimit, enabled: form.elements.enabled.checked } });
    status.textContent = "Saved. Open a Reddit comment thread to try it.";
  } catch (error) { status.textContent = error.message; }
});
document.querySelector("#clear").addEventListener("click", async () => {
  await chrome.storage.local.remove(["cache", "failures"]);
  status.textContent = "Saved drafts cleared.";
});
