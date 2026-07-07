# Handoff — backlog & cleanup

State as of 2026-07-07: **app is live and fully functional** at https://taylorwagner100.github.io/commute-mail/ pending Taylor's one-time setup (Google OAuth client ID + Anthropic key — README). Tests green (`node test.mjs`). No known bugs.

Read `CLAUDE.md` before changing anything. Items below are ranked by value-for-effort; none are blockers.

## High value

1. **Silent Gmail token refresh.** Access tokens die after ~1h; today the app tells the user to tap Start again mid-drive. Fix: on 401, call `tokenClient.requestAccessToken({prompt: ''})` once before surfacing the error — usually refreshes without a popup for an already-consented user.
2. **PWA manifest + icon.** "Add to Home Screen" currently gets a generic screenshot icon and Safari chrome. Add a `manifest.json` (name, standalone display, theme `#0d1117`) and a 180px `apple-touch-icon.png`. Note: verify SpeechRecognition still works in standalone mode on the user's iOS version — if it doesn't, drop `standalone` and keep the icon only.
3. **Screen wake lock.** Screen sleep can pause JS timers mid-session. `navigator.wakeLock.request('screen')` while `running` (iOS 16.4+), re-acquire on `visibilitychange`.

## Medium

4. **Repo is public** (free GitHub Pages requires it). If Taylor wants it private: deploy to Cloudflare Pages or Netlify (both free for private repos), update the OAuth client's authorized origin, then `gh repo edit --visibility private`.
5. **Google OAuth app is in Testing mode.** Fine for personal use, but Google shows an "unverified app" interstitial on first consent and may require re-consent every 7 days for some flow types. If re-consent nags: publish the consent screen ("In production" — no verification needed for <100 users with sensitive-scope warning) or just live with it.
6. **ElevenLabs voice is hard-coded** (Rachel, `21m00Tcm4TlvDq8ikWAM` in `speakEleven`). Add a voice-ID field in Settings if Taylor wants a different one.
7. **Inbox filter.** Triage pulls `in:inbox is:unread` (max 10). Consider `category:primary` to skip promos, or a configurable query in Settings.

## Low / polish

8. **`listen()` overlap edge** (from code review): if two listens could ever be active, `pendingResolve` overwrite is racy. The flow is strictly sequential today, so it's theoretical — fix only if the flow becomes concurrent.
9. **Barge-in:** user can't interrupt TTS by voice (tap-to-interrupt only). True barge-in needs simultaneous mic+TTS, which iOS Safari handles poorly — investigate before promising.
10. **Draft memory of user's writing style:** feed 2–3 of the user's past sent replies into the system prompt for voice-matching. Needs `gmail.readonly` on sent mail (already covered by `gmail.modify`).

## Won't-fix (decided, don't reopen)

- **Ava/Premium voices in the web dropdown** — Apple doesn't expose them to web pages. Ever. UI already explains this; ElevenLabs is the natural-voice path.
- **API keys in localStorage** — inherent to a no-backend app; documented in README/Settings. A backend proxy would fix it at the cost of the "one file, no server" design. Only revisit if the app is ever shared with others.
- **Native iOS app / CarPlay** — would beat Safari on voice UX, but it's a full rewrite plus signing/App Store friction. Revisit only if Safari limitations become daily annoyances.

## Recipes

- Deploy stalls in `deployment_queued` → `git commit --allow-empty -m "Retrigger Pages deploy" && git push`
- Verify a deploy landed → `curl -s https://taylorwagner100.github.io/commute-mail/ | grep -c "<marker string from your change>"`
