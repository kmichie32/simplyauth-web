/* ================================================================
   SimplyAuth — Interactive Mockup Renderer
   Pure vanilla JS, no dependencies (except qrcode-generator for QR)
   ================================================================ */

(function () {
  'use strict';

  // ── Mock Data ────────────────────────────────────────────────
  const WORDS = ['ocean','timber','falcon','marble','silver','garden','crystal','summit','ember','velvet',
                 'breeze','canyon','dusk','echo','frost','harbor','iron','jasper','lotus','meadow'];
  const CONNECTIONS = [
    { name: 'Sarah Mitchell', initials: 'SM', bg: '#D1FAE5', text: '#065F46', role: 'You invited', verified: '2 days ago' },
    { name: 'James Chen',    initials: 'JC', bg: '#DBEAFE', text: '#1E40AF', role: 'Invited you', verified: '5 days ago' },
  ];

  const randomWord = () => WORDS[Math.floor(Math.random() * WORDS.length)];
  const randomNum  = () => Math.floor(Math.random() * 90) + 10;

  // ── Status Bar HTML ──────────────────────────────────────────
  function statusBar() {
    return `
      <div class="phone-statusbar">
        <span>9:41</span>
        <div class="phone-statusbar-icons">
          <svg width="12" height="9" viewBox="0 0 14 10" fill="currentColor"><rect x="0" y="4" width="2.5" height="6" rx="0.5"/><rect x="3.5" y="2.5" width="2.5" height="7.5" rx="0.5"/><rect x="7" y="1" width="2.5" height="9" rx="0.5"/><rect x="10.5" y="0" width="2.5" height="10" rx="0.5"/></svg>
          <svg width="12" height="9" viewBox="0 0 13 10" fill="currentColor"><path d="M6.5 2.5C8.4 2.5 10 3.3 11.2 4.5L12.5 3.2C10.9 1.6 8.8 0.5 6.5 0.5S2.1 1.6 0.5 3.2L1.8 4.5C3 3.3 4.6 2.5 6.5 2.5z"/><path d="M6.5 5.5C7.7 5.5 8.8 6 9.6 6.8L10.9 5.5C9.7 4.3 8.2 3.5 6.5 3.5S3.3 4.3 2.1 5.5L3.4 6.8C4.2 6 5.3 5.5 6.5 5.5z"/><circle cx="6.5" cy="9" r="1.5"/></svg>
          <svg width="18" height="9" viewBox="0 0 22 10" fill="currentColor"><rect x="0" y="1" width="18" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1"/><rect x="1.5" y="2.5" width="13" height="5" rx="0.5"/><path d="M19.5 4v2a1 1 0 0 0 1-1v0a1 1 0 0 0-1-1z"/></svg>
        </div>
      </div>`;
  }

  // ── Verification Screen ──────────────────────────────────────
  function buildVerifyScreen(containerId, isSmall) {
    const el = document.getElementById(containerId);
    if (!el) return null;

    let seconds = 45;
    const TOTAL = 60;
    let w1 = randomWord(), w2 = randomWord(), n1 = randomNum(), n2 = randomNum();

    function getTimerState(s) {
      if (s > 20) return { cls: '', color: '#16A34A' };
      if (s > 10) return { cls: 'warning', color: '#D97706' };
      return { cls: 'critical', color: '#DC2626' };
    }

    function render() {
      const ts = getTimerState(seconds);
      const pulseCls = seconds <= 10 && seconds > 0 ? ' pulse' : '';
      const progress = seconds / TOTAL;
      const sz = isSmall ? 'small' : 'large';

      el.innerHTML = `
        ${statusBar()}
        <div class="verify-mockup-header">
          <span class="verify-mockup-cancel">Cancel</span>
          <span class="verify-mockup-title">Verifying</span>
        </div>
        <div class="verify-who-card">
          <div class="verify-who-avatar" style="background:${CONNECTIONS[0].bg};color:${CONNECTIONS[0].text}">${CONNECTIONS[0].initials}</div>
          <div class="verify-who-info">
            <div class="verify-who-label">Verifying</div>
            <div class="verify-who-name">${CONNECTIONS[0].name}</div>
          </div>
        </div>
        <div class="verify-phrase-label">Read this phrase aloud</div>
        <div class="verify-tokens">
          <span class="verify-token verify-token-word">${w1}</span>
          <span class="verify-token verify-token-word">${w2}</span>
          <span class="verify-token verify-token-number">${n1}</span>
          <span class="verify-token verify-token-number">${n2}</span>
        </div>
        <div class="verify-copy-btn">&#x2398; Copy Phrase</div>
        <div class="verify-timer">
          <div class="verify-timer-circle ${ts.cls}${pulseCls}">
            <span class="verify-timer-seconds" style="color:${ts.color}">${seconds}</span>
            <span class="verify-timer-label" style="color:${ts.color}">sec</span>
          </div>
        </div>
        <div class="verify-progress-track">
          <div class="verify-progress-fill" style="width:${progress * 100}%;background:${ts.color}"></div>
        </div>
        <div class="verify-confirm-btn">They Said It Correctly</div>
      `;
    }

    render();

    const timer = setInterval(() => {
      seconds--;
      if (seconds < 0) {
        // Reset with new phrase
        seconds = TOTAL;
        w1 = randomWord(); w2 = randomWord(); n1 = randomNum(); n2 = randomNum();
      }
      render();
      // Animate tokens on reset
      if (seconds === TOTAL) {
        const tokens = el.querySelectorAll('.verify-token');
        tokens.forEach((t, i) => {
          t.classList.add('token-enter');
          setTimeout(() => t.classList.remove('token-enter'), 50 + i * 60);
        });
      }
    }, 1000);

    return timer;
  }

  // ── Home Dashboard Screen ────────────────────────────────────
  function buildHomeScreen(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    let conns = CONNECTIONS.map(c => `
      <div class="mock-connection">
        <div class="mock-avatar" style="background:${c.bg};color:${c.text}">${c.initials}</div>
        <div class="mock-conn-info">
          <div class="mock-conn-name">${c.name}</div>
          <div class="mock-conn-role">${c.role}</div>
          <div class="mock-conn-verified">&#x2713; Verified ${c.verified}</div>
        </div>
        <div class="mock-verify-badge">Verify &rarr;</div>
      </div>
    `).join('');

    el.innerHTML = `
      ${statusBar()}
      <div class="home-top-row">
        <div class="home-top-left">
          <span style="font-size:14px;color:var(--text-tertiary)">&#9776;</span>
          <h2 class="home-title">Hi, Kevin</h2>
        </div>
        <div class="home-profile-badge">
          <div class="mock-avatar" style="background:#DBEAFE;color:#1E40AF;width:28px;height:28px;font-size:10px;border-radius:14px">KM</div>
          <div class="home-plan-badge">&#10022; Personal</div>
        </div>
      </div>
      <div class="home-subtitle">Who would you like to verify today?</div>
      <div class="home-checkin-cta">
        <div class="home-checkin-icon">&#x23F1;</div>
        <div class="home-checkin-text">
          <strong>Scheduled Check-In</strong>
          <span>Set a timer for your safety</span>
        </div>
        <span class="home-checkin-arrow">&rsaquo;</span>
      </div>
      <div class="home-section-header">
        <div style="display:flex;align-items:baseline;gap:4px">
          <h3 class="home-conn-title">Your Connections</h3>
          <span class="home-conn-count">(1/10)</span>
        </div>
        <a href="javascript:void(0)" class="home-add-link">+ Add</a>
      </div>
      <div class="home-conn-hint">Only connections you invite count toward your limit</div>
      <div class="home-connections">${conns}</div>
    `;
  }

  // ── Check-In Screen ──────────────────────────────────────────
  function buildCheckinScreen(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    let totalSec = 6443; // 1h 47m 23s

    function fmt(s) {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    }

    function render() {
      el.innerHTML = `
        ${statusBar()}
        <div class="mockup-header">
          <span style="font-size:14px;color:#2563EB">&larr;</span>
          <span></span>
        </div>
        <div class="checkin-mockup-title">
          <h3>&#x23F1; Check-In Active</h3>
          <p>Your connections will be notified if you don't check in</p>
        </div>
        <div class="checkin-countdown">
          <div class="checkin-countdown-time">${fmt(totalSec)}</div>
          <div class="checkin-countdown-label">remaining</div>
        </div>
        <div class="checkin-note">
          <div class="checkin-note-label">Note</div>
          <div class="checkin-note-text">Meeting a buyer from Marketplace at the mall</div>
        </div>
        <div class="checkin-actions">
          <div class="checkin-btn-ok">I'm OK</div>
          <div class="checkin-btn-extend">+ 30 min</div>
        </div>
      `;
    }

    render();

    setInterval(() => {
      totalSec--;
      if (totalSec < 0) totalSec = 6443; // loop
      render();
    }, 1000);
  }

  // ── Add Connection Screen ────────────────────────────────────
  function buildAddConnectionScreen(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = `
      ${statusBar()}
      <div class="mockup-header">
        <span style="font-size:14px;color:#2563EB">&larr;</span>
        <span class="mockup-header-title">Add Connection</span>
        <span></span>
      </div>
      <div class="add-conn-tabs">
        <div class="add-conn-tab active" data-tab="invite">Invite</div>
        <div class="add-conn-tab" data-tab="scan">Scan</div>
        <div class="add-conn-tab" data-tab="enter">Enter Code</div>
      </div>
      <div class="add-conn-panel active" data-panel="invite">
        <div class="add-conn-qr">
          <div class="add-conn-qr-title">Your Invite Code</div>
          <div class="add-conn-qr-sub">Let others scan this or share your invite link</div>
          <div class="add-conn-qr-code" id="qr-code-container"></div>
          <div class="add-conn-code-label">Invite Code</div>
          <div class="add-conn-code">DEMO1234</div>
          <div class="add-conn-share-btn">Share Invite Link</div>
        </div>
      </div>
      <div class="add-conn-panel" data-panel="scan">
        <div class="add-conn-scan">
          <div class="add-conn-scan-icon">&#x1F4F7;</div>
          <p>Point your camera at a<br>connection's QR code</p>
        </div>
      </div>
      <div class="add-conn-panel" data-panel="enter">
        <div class="add-conn-enter">
          <p>Enter the invite code shared with you</p>
          <input class="add-conn-input" type="text" value="ABCD5678" readonly>
          <div class="add-conn-submit-btn">Connect</div>
        </div>
      </div>
    `;

    // Generate QR code
    try {
      if (typeof qrcode !== 'undefined') {
        const qr = qrcode(0, 'M');
        qr.addData('https://simplyauth.app/invite/DEMO1234');
        qr.make();
        const container = document.getElementById('qr-code-container');
        if (container) {
          container.innerHTML = qr.createSvgTag({ cellSize: 3, margin: 2 });
        }
      }
    } catch (e) {
      // Fallback: show a placeholder
      const container = document.getElementById('qr-code-container');
      if (container) {
        container.innerHTML = '<div style="width:120px;height:120px;background:#f1f5f9;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:10px">QR Code</div>';
      }
    }

    // Tab switching
    const tabs = el.querySelectorAll('.add-conn-tab');
    const panels = el.querySelectorAll('.add-conn-panel');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.getAttribute('data-tab');
        el.querySelector(`[data-panel="${target}"]`).classList.add('active');
      });
    });
  }

  // ── Scroll Reveal ────────────────────────────────────────────
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => observer.observe(el));
  }

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    // Build all mockups
    buildVerifyScreen('mockup-hero-verify', false);
    buildVerifyScreen('mockup-phrase', true);
    buildHomeScreen('mockup-home');
    buildCheckinScreen('mockup-checkin');
    buildAddConnectionScreen('mockup-add-connection');

    // Scroll animations
    initScrollReveal();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
