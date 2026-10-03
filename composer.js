(() => {
  const inserted = new WeakMap();
  const scopeSelector = 'shreddit-composer, shreddit-comment-composer, comment-composer-host, [slot="comment-composer"], [data-testid="post-comment-input"]';
  function roots(base = document) {
    const found = [base];
    for (let i = 0; i < found.length; i++) {
      for (const element of found[i].querySelectorAll("*")) if (element.shadowRoot) found.push(element.shadowRoot);
    }
    return found;
  }
  function inComment(element) {
    for (let node = element; node; node = node.parentElement || node.getRootNode?.().host) {
      if (node.matches?.('shreddit-comment, .thing.comment, [data-testid="comment"]')) return true;
    }
    return false;
  }
  const visible = element => element.getClientRects().length > 0;
  function editors(scope) {
    return roots(scope).flatMap(root => [...root.querySelectorAll('textarea, [contenteditable="true"]')])
      .filter(element => visible(element) && !element.disabled && !element.readOnly && !inComment(element));
  }
  function scopes() {
    const candidates = [...document.querySelectorAll(".commentarea > .usertext"), ...roots().flatMap(root => [...root.querySelectorAll(scopeSelector)])];
    return [...new Set(candidates)].filter(scope => !inComment(scope));
  }
  function findEditor() {
    return scopes().flatMap(editors)[0] || null;
  }
  function read(editor) {
    return editor.tagName === "TEXTAREA" ? editor.value : (editor.innerText || editor.textContent || "");
  }
  function writeReply(editor, text) {
    const previous = read(editor);
    if (previous.trim() && previous !== inserted.get(editor)) {
      throw new Error("Your comment box has a draft. Clear it first to use a suggestion.");
    }
    editor.focus();
    if (editor.tagName === "TEXTAREA") {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");
      descriptor.set.call(editor, text);
      editor.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true, inputType: "insertText", data: text }));
      editor.dispatchEvent(new Event("change", { bubbles: true }));
      editor.setSelectionRange(text.length, text.length);
    } else {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor);
      selection.removeAllRanges(); selection.addRange(range);
      if (!document.execCommand("insertText", false, text)) {
        selection.removeAllRanges();
        throw new Error("Reddit's editor did not accept the reply. Open the main comment box and try again.");
      }
    }
    if (read(editor).trim() !== text.trim()) throw new Error("Reddit's editor did not keep the reply. Try again.");
    inserted.set(editor, text);
    editor.scrollIntoView({ behavior: "auto", block: "center" });
  }
  async function fillReply(text, isCurrent = () => true) {
    let editor = findEditor();
    if (!editor) {
      // Expand only the main post composer, never a comment's Reply or Submit button.
      for (const scope of scopes()) {
        const trigger = roots(scope).flatMap(root => [...root.querySelectorAll('button, [role="button"], [role="textbox"]')])
          .find(element => visible(element) && !inComment(element) && /^(add a comment|join the conversation|write a comment)$/i.test((element.getAttribute("aria-label") || element.textContent || "").trim()));
        if (trigger) { trigger.click(); break; }
      }
      for (let attempt = 0; attempt < 12 && !editor; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 150));
        if (!isCurrent()) throw new Error("The thread changed. Choose a suggestion on the current post.");
        editor = findEditor();
      }
    }
    if (!isCurrent()) throw new Error("The thread changed. Choose a suggestion on the current post.");
    if (!editor) throw new Error("Open Reddit's main comment box, then click Insert again.");
    writeReply(editor, text);
  }
  globalThis.ChimeInComposer = { fillReply, writeReply, findEditor };
})();

