(() => {
  let current = "", host, root, list, status, retry, dismissed = "", lastAttempt = "";
  const currentId = () => location.pathname.match(/\/comments\/([a-z0-9]+)(?:\/|$)/i)?.[1]?.toLowerCase() || "";
  const visible = el => !!el && el.getClientRects().length > 0;
  function readPost(id) {
    const modern = [...document.querySelectorAll("shreddit-post")].find(el => {
      const ownId = el.getAttribute("id") || "";
      const link = el.getAttribute("permalink") || "";
      return visible(el) && (ownId === "t3_" + id || link.includes("/comments/" + id + "/"));
    });
    if (modern) {
      const title = modern.getAttribute("post-title") || modern.querySelector('[slot="title"]')?.textContent || "";
      const body = modern.querySelector('[slot="text-body"]')?.innerText || "";
      return { title: title.trim(), body: body.trim(), subreddit: modern.getAttribute("subreddit-prefixed-name") || modern.getAttribute("subreddit-name") || "" };
    }
    const old = [...document.querySelectorAll(".thing.link")].find(el => visible(el) && el.getAttribute("data-fullname") === "t3_" + id);
    if (old) return { title: old.querySelector("a.title")?.textContent?.trim() || "", body: old.querySelector(".usertext-body .md")?.innerText || "", subreddit: old.querySelector("a.subreddit")?.textContent || "" };
    return null;
  }
  function button(text, fn, className = "") {
    const b = document.createElement("button"); b.textContent = text; b.className = className; b.addEventListener("click", fn); return b;
  }
  function mount(id) {
    host?.remove();
    host = document.createElement("div"); host.id = "chime-in-extension";
    root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = `
      :host{all:initial;font-family:system-ui,sans-serif;color:#f4f0e9;font-size:14px}
      *{box-sizing:border-box} .panel{position:fixed;right:22px;bottom:22px;width:340px;max-width:calc(100vw - 32px);max-height:75vh;overflow:auto;z-index:2147483647;background:#222720;border:1px solid #515947;border-radius:18px;box-shadow:0 12px 48px #0006}
      header{display:flex;align-items:center;gap:8px;padding:16px} .brand{font-weight:750;font-size:17px;flex:1;display:flex;align-items:center;gap:8px}.brand img{width:32px;height:32px}.tagline{font-size:12px;color:#c8ec91;margin:0 0 8px}.dot{color:#c8ec91}
      button{font:inherit;cursor:pointer;color:inherit;background:transparent;border:0;border-radius:8px;padding:7px 10px}button:hover{background:#ffffff12}button:focus-visible{outline:2px solid #c8ec91;outline-offset:2px}
      .body{padding:0 16px 16px} .status{font-size:12px;line-height:1.5;color:#bac1b2;margin:0 0 12px} .card{background:#30372c;border:1px solid #454e3d;border-radius:12px;padding:12px;margin-top:9px}
      .label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#c8ec91}.reply{white-space:pre-wrap;line-height:1.5;margin:8px 0} .copy{background:#c8ec91;color:#20271a;font-weight:650;font-size:12px}
      footer{display:flex;align-items:center;justify-content:space-between;margin-top:12px;font-size:11px;color:#bac1b2}.hidden{display:none}.panel.collapsed .body{display:none} .panel.collapsed{width:190px}
      @media(max-width:600px){.panel{right:12px;bottom:12px}}
    `;
    const panel = document.createElement("section"); panel.className = "panel"; panel.setAttribute("aria-label", "Chime In reply suggestions");
    const header = document.createElement("header");
    const brand = document.createElement("span"); brand.className = "brand"; const logo = document.createElement("img"); logo.src = chrome.runtime.getURL("assets/icon-32.png"); logo.alt = "";
    brand.append(logo, document.createTextNode("Chime In"));
    const collapse = button("-", () => { const c = panel.classList.toggle("collapsed"); collapse.textContent = c ? "+" : "-"; collapse.setAttribute("aria-expanded", String(!c)); });
    collapse.setAttribute("aria-label", "Collapse or expand suggestions"); collapse.setAttribute("aria-expanded", "true");
    const close = button("x", () => { dismissed = id; host.remove(); }); close.setAttribute("aria-label", "Dismiss for this thread");
    header.append(brand, collapse, close);
    const body = document.createElement("div"); body.className = "body";
    status = document.createElement("p"); status.className = "status"; status.setAttribute("role", "status"); status.textContent = "Finding your opening line...";
    list = document.createElement("div");
    retry = button("Try again", () => { lastAttempt = ""; run(id, true); }); retry.className = "hidden";
    const footer = document.createElement("footer");
    const note = document.createElement("span"); note.textContent = "Drafts to make your own";
    footer.append(note, button("Settings", () => chrome.runtime.sendMessage({ type: "OPEN_SETTINGS" })));
    const tagline = document.createElement("p"); tagline.className = "tagline"; tagline.textContent = "Less lurking. More chiming in.";
    body.append(tagline, status, list, retry, footer); panel.append(header, body); root.append(style, panel); document.documentElement.append(host);
  }
  async function run(id, force = false) {
    if (document.hidden || !id || id === dismissed || (!force && lastAttempt === id)) return;
    const post = readPost(id);
    if (!post?.title) return;
    lastAttempt = id;
    mount(id);
    try {
      const result = await chrome.runtime.sendMessage({ type: "SUGGEST", id, post });
      if (currentId() !== id || dismissed === id) return;
      if (result.disabled) { host.remove(); return; }
      if (result.setup) {
        status.textContent = "Add your Gemini key once to get automatic suggestions.";
        list.append(button("Set up Chime In", () => chrome.runtime.sendMessage({ type: "OPEN_SETTINGS" }), "copy")); return;
      }
      if (result.error) throw new Error(result.error);
      status.textContent = result.cached ? "A few ways to join in ? saved for this post" : "A few ways to join in";
      (result.labels || ["Ask a question", "Add an observation", "Another angle"]).forEach((label, i) => {
        const card = document.createElement("article"); card.className = "card";
        const tag = document.createElement("span"); tag.className = "label"; tag.textContent = label;
        const text = document.createElement("p"); text.className = "reply"; text.textContent = result.suggestions[i];
        const useReply = button("Insert", async () => {
          useReply.disabled = true;
          try {
            await ChimeInComposer.fillReply(result.suggestions[i], () => currentId() === id);
            if (currentId() === id) {
              useReply.textContent = "Insert";
              status.textContent = "Look at you, joining the conversation. The lurker council will miss you. Make it yours, then hit Comment.";
            }
          } catch (error) { if (currentId() === id) status.textContent = error.message; }
          finally { useReply.disabled = false; }
        }, "copy");
        card.append(tag, text, useReply); list.append(card);
      });
    } catch (error) {
      if (currentId() !== id || dismissed === id) return;
      status.textContent = error.message.includes("Extension context") ? "Extension updated. Refresh this tab." : error.message;
      retry.className = "";
    }
  }
  // Polling handles Reddit's client-side navigation without touching its own scripts.
  function tick() {
    const id = currentId();
    if (id !== current) { current = id; host?.remove(); host = null; lastAttempt = ""; dismissed = ""; }
    if (id) run(id);
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.settings) { lastAttempt = ""; tick(); }
  });
  tick(); setInterval(tick, 1500);
})();
