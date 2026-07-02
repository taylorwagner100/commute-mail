// Runs the app's <script> under Node with stubbed browser APIs and drives the
// full demo-mode voice flow through the text-input path. Fails loudly if the
// state machine breaks. Usage: node test.mjs
import { readFileSync } from 'fs';
import assert from 'assert';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const src = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];

// ---- browser stubs ----
function el() {
  const e = {
    handlers: {}, style: {}, dataset: {}, children: [],
    textContent: '', value: '', className: '',
    addEventListener(ev, fn) { e.handlers[ev] = fn; },
    appendChild(c) { e.children.push(c); },
    querySelector() { return el(); },
    focus() {}, showModal() {}, close() {},
    scrollTop: 0, scrollHeight: 0,
  };
  return e;
}
const els = {};
const $id = id => (els[id] ||= el());
const document = {
  getElementById: $id,
  createElement: () => el(),
  head: { appendChild() {} },
  body: el(),
};
const storage = new Map();
const localStorage = {
  getItem: k => storage.has(k) ? storage.get(k) : null,
  setItem: (k, v) => storage.set(k, v),
};
const speechSynthesis = { cancel() {}, speak(u) { setTimeout(() => u.onend && u.onend(), 0); } };
class SpeechSynthesisUtterance { constructor(t) { this.text = t; } }
const location = { search: '?demo=1' };
const window = {};
const navigator = { language: 'en-US' };
const fetch = () => { throw new Error('fetch should not be called in demo mode without an API key'); };

// eslint-disable-next-line no-new-func
new Function(
  'document', 'window', 'location', 'localStorage', 'navigator',
  'speechSynthesis', 'SpeechSynthesisUtterance', 'fetch',
  src
)(document, window, location, localStorage, navigator, speechSynthesis, SpeechSynthesisUtterance, fetch);

// ---- driver ----
const logEl = $id('log');
const logs = () => logEl.children.map(c => `${c.className}: ${c.textContent}`);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitForLog(re, timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const hit = logs().find(l => re.test(l));
    if (hit) return hit;
    await sleep(15);
  }
  throw new Error(`Timed out waiting for log matching ${re}\n--- log ---\n${logs().join('\n')}`);
}
async function say(text) {
  await sleep(30); // let the pending listen() attach
  $id('text-input').handlers.keydown({ key: 'Enter', target: { value: text } });
}

// ---- scenario ----
$id('orb').handlers.click(); // Start

await waitForLog(/app: You have 3 unread emails/);
await waitForLog(/app: Email 1, from Sarah Chen.*Read, reply, archive, or skip\?/);

await say('read it');
await waitForLog(/app: Hi, can you send over the Q3 projections/);
await waitForLog(/app: Reply, archive, or next\?/);

await say('reply');
await waitForLog(/app: What would you like to say\?/);

await say("tell her I'll have the projections to her by Thursday morning");
const draftPrompt = await waitForLog(/app: .*Here's the draft:.*Send it, change it, or cancel\?/s);
assert(/Thursday/.test(draftPrompt), 'draft should contain the dictated content');

await say('send it');
await waitForLog(/app: \[demo\] SENT to sarah@acme\.com/);
await waitForLog(/app: Sent\./);

await waitForLog(/app: Email 2, from Mike Torres/);
await say('archive');
await waitForLog(/app: \[demo\] ARCHIVED: Renewal contract attached/);
await waitForLog(/app: Archived\./);

await waitForLog(/app: Email 3, from HR Team/);
await say('skip');
await waitForLog(/app: That's all of them/);

// unknown command re-prompts instead of crashing
$id('orb').handlers.click(); // Start again
await waitForLog(/app: You have 3 unread emails\./, 3000);
// wait for email 1 prompt (appears twice in log now — check count grew)
await sleep(60);
await say('banana');
await waitForLog(/app: Say read, reply, archive, skip, or stop\./);
await say('stop');
await sleep(60);

console.log('ALL TESTS PASSED');
process.exit(0);
