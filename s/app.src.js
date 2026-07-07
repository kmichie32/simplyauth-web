// Secure Send reveal page (spec §4, §7). Bundled by build.mjs into s/app.js —
// edit this file, run `npm run build`, commit both.
//
// Security invariants (the frontier review checks these — do not relax):
// - No network request until the user taps Reveal. Link-preview bots fetch
//   URLs; the one-time burn must never happen on load.
// - The key arrives in the URL fragment and is stripped via replaceState
//   before anything else. Key and plaintext live only in this closure —
//   never storage of any kind, never a URL, never console.
// - Plaintext is wiped on countdown zero and on pagehide.
import { xsalsa20poly1305 } from '@noble/ciphers/salsa.js';

const OPENSEND_URL = 'https://us-central1-verifyme-4d77d.cloudfunctions.net/openSend';

const ID_PATTERN = /^[A-Za-z0-9_-]{20,24}$/;
const KEY_PATTERN = /^[A-Za-z0-9_-]{43,44}$/; // 32 bytes, base64url, unpadded

(function main() {
  // --- capture link parts, then strip the fragment from the URL -------------
  let sendId = null;
  let keyB64url = null;
  let plaintext = null;

  const idParam = new URLSearchParams(location.search).get('i') || '';
  const rawHash = location.hash.replace(/^#/, '');
  history.replaceState(null, '', location.pathname + location.search);

  if (ID_PATTERN.test(idParam)) sendId = idParam;
  if (KEY_PATTERN.test(rawHash)) keyB64url = rawHash;

  // --- tiny state helpers ----------------------------------------------------
  const el = (id) => document.getElementById(id);
  const SECTIONS = ['ss-invalid', 'ss-landing', 'ss-outcome', 'ss-revealed'];
  function show(section) {
    for (const id of SECTIONS) el(id).hidden = id !== section;
    el('ss-footer').hidden = section === 'ss-invalid' || section === 'ss-landing';
  }

  function showOutcome(title, sub) {
    el('ss-outcome-title').textContent = title;
    el('ss-outcome-sub').textContent = sub;
    show('ss-outcome');
  }

  const OUTCOMES = {
    already_opened: ['Already viewed', 'This message was already viewed. Messages can only be opened once.'],
    expired: ['This link expired', 'Secure Send links last 24 hours.'],
    revoked: ['Message revoked', 'The sender revoked this message.'],
    not_found: ['This link isn’t valid', 'Check that the whole link was shared, or ask the sender for a new one.'],
    invalid: ['This link isn’t valid', 'Check that the whole link was shared, or ask the sender for a new one.'],
    rate_limited: ['Too many attempts', 'Too many attempts from your network — try again in an hour.'],
  };

  // --- base64 helpers ----------------------------------------------------------
  function b64ToBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function b64urlToBytes(b64url) {
    let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return b64ToBytes(b64);
  }

  // --- reveal flow -------------------------------------------------------------
  let countdownTimer = null;

  function wipe() {
    plaintext = null;
    keyB64url = null;
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    const secretEl = el('ss-secret');
    if (!el('ss-revealed').hidden) {
      secretEl.textContent = '— gone —';
      secretEl.classList.add('ss-gone');
      el('ss-copy-btn').hidden = true;
      el('ss-copied').classList.remove('show');
      el('ss-countdown').textContent = 'This message is gone. It can’t be opened again.';
    }
  }

  function startCountdown(revealMinutes) {
    const minutes = Number(revealMinutes);
    const totalMs = (minutes > 0 ? minutes : 5) * 60 * 1000;
    const endAt = Date.now() + totalMs;
    const label = el('ss-countdown');
    function tick() {
      const left = Math.max(0, endAt - Date.now());
      if (left === 0) { wipe(); return; }
      const m = Math.floor(left / 60000);
      const s = Math.floor((left % 60000) / 1000);
      label.textContent = 'Disappears in ' + m + ':' + String(s).padStart(2, '0');
    }
    tick();
    countdownTimer = setInterval(tick, 250);
  }

  function reveal(nonceB64, ciphertextB64, revealMinutes) {
    let text;
    try {
      const key = b64urlToBytes(keyB64url);
      const nonce = b64ToBytes(nonceB64);
      const ct = b64ToBytes(ciphertextB64);
      text = new TextDecoder().decode(xsalsa20poly1305(key, nonce).decrypt(ct));
    } catch (e) {
      showOutcome(
        'Couldn’t decrypt this message',
        'The link may have been damaged in transit. Ask the sender to send it again — for safety, this one can’t be re-opened.'
      );
      return;
    }
    plaintext = text;
    el('ss-secret').textContent = plaintext;
    show('ss-revealed');
    startCountdown(revealMinutes);
  }

  async function onRevealTap() {
    const btn = el('ss-reveal-btn');
    btn.disabled = true;
    btn.textContent = 'Opening…';
    let payload = null;
    try {
      const res = await fetch(OPENSEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sendId }),
      });
      // Outcome states arrive on non-2xx too (invalid=400, rate_limited=429) —
      // always try the body before treating the response as a failure.
      payload = await res.json();
    } catch (e) {
      payload = null;
    }
    const state = payload && typeof payload.state === 'string' ? payload.state : null;
    if (state === 'ok') {
      reveal(payload.nonce, payload.ciphertext, payload.revealMinutes);
    } else if (state && OUTCOMES[state]) {
      showOutcome(OUTCOMES[state][0], OUTCOMES[state][1]);
    } else {
      // Network failure, unparseable body, or a state this page doesn't know.
      showOutcome(OUTCOMES.rate_limited[0], OUTCOMES.rate_limited[1]);
    }
  }

  // --- copy button (fallback pattern shared with 404.html) ----------------------
  function onCopyTap() {
    if (plaintext == null) return;
    const showCopied = () => {
      el('ss-copied').classList.add('show');
      setTimeout(() => el('ss-copied').classList.remove('show'), 2500);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(plaintext).then(showCopied, () => {});
      } else {
        const ta = document.createElement('textarea');
        ta.value = plaintext; ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
        document.body.removeChild(ta); showCopied();
      }
    } catch (e) { /* ignore */ }
  }

  // --- boot ---------------------------------------------------------------------
  if (!sendId || !keyB64url) {
    show('ss-invalid');
    return;
  }
  el('ss-report').href =
    'mailto:support@simplyauth.app?subject=' + encodeURIComponent('Report Secure Send ' + sendId);
  el('ss-reveal-btn').addEventListener('click', onRevealTap);
  el('ss-copy-btn').addEventListener('click', onCopyTap);
  window.addEventListener('pagehide', wipe);
  show('ss-landing');
})();
