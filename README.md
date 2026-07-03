# Commute Mail

Voice-first Gmail triage for your commute. Reads your unread email aloud, discusses replies with you, drafts them with Claude, and sends — all by voice.

**One file, no build, no backend.** Your Gmail token and Claude API key never leave your phone except to go directly to Google / Anthropic.

## How you use it (in the car)

1. Open the app (home-screen icon), tap **Start** once before you drive off.
2. It reads each unread email's sender + subject, then listens:
   - **"Read"** — reads the full email aloud
   - **"Reply"** — say what you want to say; Claude drafts it, reads it back
     - then **"Send it"**, **"Change it"** (say what to change), or **"Cancel"**
     - you can also just talk: *"what do you think they're asking for?"*
   - **"Archive"**, **"Skip"**, **"Repeat"**, **"Stop"**
3. Tap the big orb anytime to stop everything (it's huge on purpose).

Nothing is ever sent without you saying "send it" after hearing the draft.

## One-time setup (~10 minutes, do this at a desk)

### 1. Host the app (needs HTTPS for the mic)

Already deployed via GitHub Pages if you used the included repo — your URL is in the deploy notes. Any static host works.

### 2. Google OAuth Client ID (lets the app read/send your Gmail)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a project (e.g. "Commute Mail").
2. **APIs & Services → Library** → enable **Gmail API**.
3. **APIs & Services → OAuth consent screen** → External → fill in app name + your email → add yourself under **Test users**. (Testing mode is fine forever for personal use.)
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → type **Web application** → under **Authorized JavaScript origins** add your app's URL origin (e.g. `https://YOURNAME.github.io`).
5. Copy the Client ID (ends in `.apps.googleusercontent.com`).

### 3. Anthropic API key (powers the reply drafting)

Create a key at [console.anthropic.com](https://console.anthropic.com/settings/keys). The app uses Claude Haiku — a full commute of email costs about a cent.

### 4. Configure on your iPhone

1. Open the app URL in **Safari**, tap the gear, paste the Client ID + API key, set your name (used for sign-offs).
2. Share → **Add to Home Screen**.
3. Tap **Start** once — approve the Google sign-in and mic permission.

## Voice quality

The default iOS voice is robotic. Two upgrades, in order of bang-for-buck:

1. **Free — download a Premium voice** (recommended): iPhone Settings → Accessibility → Spoken Content → Voices → English → download **Ava (Premium)** or **Zoe (Premium)** (~200 MB). The app auto-detects it (or pick it explicitly under Settings → Device voice). Siri-quality, works offline.
2. **ElevenLabs** (most natural): create a key at [elevenlabs.io](https://elevenlabs.io) (free tier: 10k characters/month) and paste it in Settings. The app then speaks with ElevenLabs' "Rachel" voice, falling back to the device voice if the request fails. Adds ~1s latency per utterance and requires signal.

## Notes

- **Use Safari** (or the home-screen icon). Voice recognition uses Apple's built-in dictation.
- The Gmail sign-in token lasts ~1 hour; if a long trip outlasts it the app will tell you to tap Start again (a tap at a red light — it won't need the popup again in the same browser session usually, but may show one).
- The keyboard button (⌨) lets you type instead of talk — for testing at a desk, not while driving.
- `?demo=1` on the URL runs with fake emails and no accounts — try the flow safely.
- Your API key sits in the browser's localStorage on your device. Don't use the app on a shared computer. If the key leaks, revoke it in the Anthropic console.

## Development

```
python3 -m http.server 8000   # then open http://localhost:8000/?demo=1
node test.mjs                  # end-to-end state-machine test (stubbed browser)
```
