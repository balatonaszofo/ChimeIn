import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const source = fs.readFileSync(new URL("../composer.js", import.meta.url), "utf8");
function setup() {
  class Textarea {
    constructor(value = "") { this._value = value; this.tagName = "TEXTAREA"; this.events = []; }
    get value() { return this._value; } set value(value) { this._value = value; }
    focus() {} setSelectionRange() {} scrollIntoView() {}
    dispatchEvent(event) { this.events.push(event); }
  }
  class Event { constructor(type, options) { this.type = type; Object.assign(this, options); } }
  const context = { document: { querySelectorAll: () => [] }, HTMLTextAreaElement: Textarea, InputEvent: Event, Event, setTimeout: callback => callback(), window: {} };
  vm.runInNewContext(source, context);
  return { api: context.ChimeInComposer, Textarea, context };
}
test("fills an empty textarea and sends the input event needed by the page", () => {
  const { api, Textarea } = setup();
  const editor = new Textarea();
  api.writeReply(editor, "<b>Plain text</b>");
  assert.equal(editor.value, "<b>Plain text</b>");
  assert.equal(editor.events[0].type, "input");
  assert.equal(editor.events[0].composed, true);
  api.writeReply(editor, "Another suggestion");
  assert.equal(editor.value, "Another suggestion");
});
test("preserves a user's existing draft and edits to an inserted suggestion", () => {
  const { api, Textarea } = setup();
  const editor = new Textarea("My own draft");
  assert.throws(() => api.writeReply(editor, "Suggestion"), /has a draft/);
  assert.equal(editor.value, "My own draft");
  editor.value = "";
  api.writeReply(editor, "Suggestion");
  editor.value = "Suggestion with my edits";
  assert.throws(() => api.writeReply(editor, "Replacement"), /has a draft/);
  assert.equal(editor.value, "Suggestion with my edits");
});
test("uses the rich text editor's text insertion command", () => {
  const { api, context } = setup();
  const editor = { tagName: "DIV", innerText: "", focus() {}, scrollIntoView() {} };
  context.window.getSelection = () => ({ removeAllRanges() {}, addRange() {} });
  context.document.createRange = () => ({ selectNodeContents() {} });
  context.document.execCommand = (command, ui, text) => { assert.equal(command, "insertText"); editor.innerText = text; return true; };
  api.writeReply(editor, "A reply");
  assert.equal(editor.innerText, "A reply");
});
test("does not write after navigation, and handles an unavailable composer", async () => {
  const { api } = setup();
  await assert.rejects(api.fillReply("A reply", () => false), /thread changed/);
  await assert.rejects(api.fillReply("A reply"), /main comment box/);
});

