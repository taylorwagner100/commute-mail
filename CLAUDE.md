# Commute Mail — instructions for Claude

Single-file, voice-first Gmail triage app for driving. `index.html` IS the entire app — no build step, no dependencies, no backend. `test.mjs` is the only test. `README.md` is user-facing setup. `HANDOFF.md` is the backlog.

## Invariants — do not break these

1. **One file, no build, no deps.** Resist adding a framework, bundler, or npm. If a change seems to need one, it's the wrong change.
2. **`node test.mjs` must pass before every push.** It executes the real `<script>` from index.html under Node with stubbed browser globals and drives the full voice flow through the text-input path. If you change the flow, update the test in the same commit.
3. **Nothing sends without spoken confirmation.** The user must hear the draft read aloud and say "send" — never weaken this.
4. **Untrusted strings (email/AI/user) reach the DOM only via `textContent`.** The one `innerHTML` (settings voice dropdown) strips `<>&` — keep it that way.
5. **Email content stays fenced as untrusted** inside `<email_content>` in the Claude system prompt (prompt-injection defense). Don't interpolate email text anywhere else in the prompt.

## Architecture (all inside index.html's script)

- `cfg` — settings from localStorage (`cm_*` keys): Google client ID, Anthropic key, name, rate, voice, ElevenLabs key.
- **Speech out:** `speak()` → `speakEleven()` when an ElevenLabs key is set (shared `audioEl`, primed by user gesture), else `speakLocal()` (sentence-chunked `speechSynthesis`, `pickVoice()` prefers premium/enhanced names).
- **Speech in:** `listen()` — one-shot SpeechRecognition wrapped in a promise. The global `pendingResolve` lets the text box answer any active listen; this is also how `test.mjs` drives the app.
- **Intents:** `intent()` — ordered substring matching (order matters: reply before read, stop first).
- **`gmail`** — raw REST against gmail.googleapis.com, Bearer token from Google Identity Services token client. Single scope `gmail.modify` (the narrowest scope covering list + get + send + label changes). `sendReply()` builds an RFC 822 message (base64 body, In-Reply-To/References for threading) and base64url-encodes the whole thing into `raw`.
- **`ai`** — Claude `claude-haiku-4-5`, called browser-direct with the `anthropic-dangerous-direct-browser-access` header. Replies wrap the email body in `<draft></draft>` tags; everything outside the tags is spoken commentary. With no API key set, a template mock drafts instead (keeps demo/tests offline).
- **Flow:** `triage()` is a linear async loop over unread emails; `replyFlow()` per email; the single `running` flag is the only session state. Tapping the orb mid-run kills everything.
- **Demo (`?demo=1`):** mock gmail + mock ai; used by test.mjs and for safe manual testing. Demo uses real voice — do NOT couple demo mode to muted/textMode again (that bug shipped once).

## Dev loop

```
python3 -m http.server 8000        # open http://localhost:8000/?demo=1
node test.mjs                      # must print ALL TESTS PASSED
git push                           # deploy = push to main (Pages serves repo root)
curl -s https://taylorwagner100.github.io/commute-mail/ | grep -c "<some marker from your change>"
```

**GitHub Pages deploys sometimes stall in `deployment_queued` and time out** (happened twice on 2026-07-02). Re-running the failed workflow rarely helps; instead:

```
git commit --allow-empty -m "Retrigger Pages deploy" && git push
```

## iOS / web-voice gotchas

See the `voice-web-apps` skill (~/.claude/skills/voice-web-apps) — covers gesture-primed TTS, why downloaded Premium voices never appear in `getVoices()`, sentence chunking, and the Node stub-testing technique used by test.mjs.
