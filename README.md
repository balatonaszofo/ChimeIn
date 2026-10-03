# ChimeIn

<img src="assets/icon-128.png" width="96" alt="ChimeIn speech-bubble mascot">

**Less lurking. More chiming in.**

Your tiny anti-lurking sidekick. Three reply ideas, four personalities, and one less lurker. Cloud generation is automatic after one-time setup; no screenshots or invocation button.

## Try the demo

Open `chime-in-demo.html` in a browser for an interactive walkthrough. It uses sample replies and makes no API calls.

## Install

Download this repository as a ZIP from **Code > Download ZIP**, then extract it.

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this directory (the one containing manifest.json).
3. Settings open automatically. Add your own Gemini API key from https://aistudio.google.com/apikey and save.
4. Open a text post's comments on www.reddit.com or old.reddit.com. Suggestions appear in the lower-right corner.
5. Click **Insert** to fill Reddit's main comment box, then edit the draft. The extension never submits comments.

Click the extension toolbar icon to reopen settings. After updating extension files, click Reload on chrome://extensions and refresh Reddit tabs.

## What it does

- Detects full comment pages and Reddit's client-side navigation.
- Reads the matching visible post title, text body and subreddit from the page DOM. No Reddit API or scraping backend.
- Uses Gemini 2.5 Flash-Lite with thinking disabled and a small structured output.
- Caches results by thread, post contents and tone for seven days (max 150 entries).
- Deduplicates simultaneous requests for the same post and limits requests to 100/day by default.
- Allows collapse or dismissal for the current thread.
- Works with current shreddit-post markup and old Reddit's thing.link markup.

## Cost and privacy

At $0.10/M input tokens and $0.40/M output tokens, 2,000 input + 300 output tokens costs about $0.00032 per request. 30 threads/day is roughly $0.29/month in model charges. No backend hosting required. This is an estimate, not a spending guarantee; the daily cap limits attempts, not dollars. Google billing is controlled separately.

Opening threads automatically sends post text to Google once configured. Choose the paid API tier if you want the pricing page's data handling that excludes use for product improvement; free-tier handling differs. See https://ai.google.dev/gemini-api/docs/pricing.

The API key and settings are stored in chrome.storage.local, restricted to trusted extension contexts, not sync storage. The key is not encrypted. This is a personal unpacked extension: do not ship a shared API key in a public extension. For distribution, use a backend with authentication or a designed bring-your-own-key flow. Cloud responses are inserted as text, not HTML. The worker accepts only matching Reddit thread messages and fetches only the fixed Gemini endpoint.

## Limitations

Image/video/link contents and comments are not analyzed. A title-only post produces suggestions from its title only. Reddit DOM changes may break extraction. This has no access to your actual opinions or experiences. Model drafts require judgment.

## Validation

Run `npm test` and `npm run check`. Tests cover prompt boundaries, parsing, URL validation, worker caching, request deduplication, quotas and errors without making API calls.

Live Chrome extension behavior and real Gemini generation require loading the extension and supplying your key.

## Experiment

Compare suggestions with a simple baseline: "What would you like to ask the author?" Track whether you write a comment, how much you edit, and whether the suggestion contributed something specific. Success is useful participation, not just generated text. A negative result is useful evidence too.



## Reply personalities

Choose a personality in extension settings, then save:
- **Boring**: average, straightforward replies.
- **Troll**: intentionally provocative, playful challenges to the premise.
- **Mom**: warm reassurance, encouragement and caring questions.
- **Byzantine uncle**: an oddly specific historical obsession. Relates post details to a small, sourced Byzantine fact bank with deliberately absurd analogies.

All three suggestions follow the selected personality; their card labels change with it. Mode changes get separate cached suggestions. Extra style preferences remain available. Old settings without a mode default to Boring. Reload the extension and refresh Reddit tabs after updating.

Historical grounding reduces invented details; it is not an independent fact-checker. Sources: https://www.metmuseum.org/essays/byzantium-ca-330-1453, https://www.metmuseum.org/exhibitions/listings/2004/byzantium-faith-and-power and https://guides.loc.gov/byzantine-empire/introduction.


## Insert a reply

Click **Insert** to populate the main post's comment box. The extension focuses the editor and inserts plain text; it never submits a comment. It supports textareas and rich-text editors in recognized post composers, including open shadow roots. It will try to expand the main composer if it is collapsed. If Reddit changes its editor markup, open the main comment box and try again.

An existing user draft is preserved. You can replace an untouched suggestion with another suggestion. Clear your draft before replacing text you have edited.
