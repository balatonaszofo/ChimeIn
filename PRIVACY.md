# Chime In Privacy Policy

Last updated: October 3, 2026. This policy describes Chime In version 0.1.8.

Chime In helps you draft Reddit comments using Google's Gemini API. You choose whether to insert a suggestion, edit it and submit it. Chime In never submits comments automatically.

## Information accessed and used

- **Website content:** The visible Reddit post title, text body and subreddit name are read to generate relevant replies. Post content can itself contain personal or sensitive information. Images, videos and existing comments are not analyzed.
- **Authentication information:** Your Gemini API key is saved locally and sent only to Google's Gemini API to authenticate requests.
- **Current thread information:** The extension reads the current Reddit URL to identify and validate the open thread. Thread identifiers are included in local cache and retry keys. It does not request Chrome's browsing-history database or track browsing across other websites.
- **Settings and drafts:** Your selected model, reply personality, style preferences, enabled setting, daily limit, generated suggestions, request counts and temporary retry records are stored locally.
- **Comment editor:** When you select Insert, the extension reads the main comment editor to avoid overwriting your draft. Your existing draft is not sent to Gemini or stored in extension storage.

## Information sent to Google

After you save an API key and enable suggestions, opening a readable Reddit thread automatically sends its post title, text and subreddit, together with your style preference, selected personality instructions and the extension's generation instructions, to generativelanguage.googleapis.com when fresh suggestions are needed. The title is limited to 600 characters and the body to 7,000 characters. The Byzantine personality also sends a small bundled history fact bank.

Selecting Find available models sends your API key to Google to retrieve compatible models. The extension does not deliberately include the Reddit thread URL or identifier in Gemini request bodies. URLs or personal information embedded in post text may be transmitted as part of that text.

Requests go directly from your browser to Google over HTTPS. Chime In has no developer-operated processing server, advertising SDK or analytics integration. The developer does not receive your API key, posts or drafts through the extension.

## Your agreement with Google

Before using Gemini through Chime In, you must accept the applicable [Google APIs Terms of Service](https://developers.google.com/terms) and [Gemini API Additional Terms of Service](https://ai.google.dev/gemini-api/terms). By accepting those terms, you agree to abide by them when using Gemini through Chime In, including the applicable use restrictions and requirements for content submitted to the service. You are responsible for complying with the terms that apply to your Gemini account, API key and service tier.

Chime In uses the Gemini API key you provide to make requests directly to Google. Google's processing of those requests is governed by your applicable agreement with Google, as described below.

## Google's processing

Google's handling depends on your Gemini service tier and applicable terms. Under unpaid-service terms, Google can use submitted content and responses to improve its products, and human reviewers may process them. Under paid-service terms, Google does not use prompts and responses for product improvement, but retains limited logs for safety, abuse prevention and legal requirements. Other service metadata, including IP addresses, may be processed by Google. Chime In cannot determine your project's billing status or delete Google's records.

Read the [Gemini API terms](https://ai.google.dev/gemini-api/terms) and [Google Privacy Policy](https://policies.google.com/privacy). Avoid sending confidential or sensitive content, particularly through unpaid services.

## Local storage and retention

Settings and your API key remain in local extension storage until changed or removed. They are not synced by Chime In. The API key is stored unencrypted, and extension storage access is restricted to trusted extension contexts.

Cached suggestions are reusable for seven days, with at most 150 entries. Expired entries are removed during later successful cache writes; they may remain on disk until then. Retry records stop blocking requests after one minute and are pruned during later failures. Daily usage records store a UTC date and count.

## Your controls

You can disable automatic suggestions in Settings, change your preferences and use Clear saved drafts to remove cached suggestions and retry records. Removing the extension removes its local extension storage. You can revoke your API key through Google. These actions do not delete information already processed or retained by Google.

## Other uses and changes

Chime In's own code uses information to provide reply suggestions and related caching, quota and retry controls. It contains no sale, advertising, creditworthiness or lending functionality. Google's processing is described above. This policy will be updated when the extension's data practices change.

## Contact

For privacy questions or support, email [chimeinextension@gmail.com](mailto:chimeinextension@gmail.com).
