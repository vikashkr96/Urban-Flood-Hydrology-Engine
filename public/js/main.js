/* ═══════════════════════════════════════════════
   ClimateResilience Copilot — main.js
   Full interactive frontend logic
   ═══════════════════════════════════════════════ */

'use strict';

/* ── 1. HERO CANVAS — animated particle globe ── */
(function initCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, dots = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Earth radial bg
  function drawBg() {
    const grad = ctx.createRadialGradient(W/2, H*1.1, 0, W/2, H*1.1, H*1.2);
    grad.addColorStop(0,   'rgba(10,61,31,0.85)');
    grad.addColorStop(0.4, 'rgba(10,39,68,0.7)');
    grad.addColorStop(1,   'rgba(5,13,26,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Floating network dots
  class Dot {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.r  = Math.random() * 2 + 0.5;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.alpha = Math.random() * 0.6 + 0.1;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,200,83,${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < 60; i++) dots.push(new Dot());

  function drawConnections() {
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x;
        const dy = dots[i].y - dots[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.strokeStyle = `rgba(0,200,83,${(1 - dist/110) * 0.12})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawBg();
    dots.forEach(d => { d.update(); d.draw(); });
    drawConnections();
    requestAnimationFrame(loop);
  }
  loop();
})();

/* ── 2. FLOATING PARTICLES ── */
(function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    const sz = Math.random() * 4 + 2;
    el.style.cssText = `
      width:${sz}px; height:${sz}px;
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      animation-duration:${9+Math.random()*14}s;
      animation-delay:${Math.random()*10}s;
    `;
    container.appendChild(el);
  }
})();

/* ── 3. NAVBAR SCROLL EFFECT ── */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
});

/* ── 4. ANIMATED COUNTERS ── */
function animateCounter(el, target, suffix) {
  const dur = 2000;
  const step = 16;
  let current = 0;
  const increment = target / (dur / step);
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) { current = target; clearInterval(timer); }
    if (target >= 1e9) el.textContent = (current / 1e9).toFixed(1) + 'B';
    else if (target >= 1e6) el.textContent = (current / 1e6).toFixed(1) + 'M';
    else el.textContent = Math.round(current).toLocaleString();
    if (suffix) el.textContent += suffix;
  }, step);
}

document.querySelectorAll('.counter').forEach(el => {
  animateCounter(el, parseInt(el.dataset.target), el.dataset.suffix || '');
});

/* ── 5. BUDGET SIMULATOR ── */
let currentBudget = 200;
let currentPlans = [];

window.updateBudget = function(v) {
  currentBudget = parseInt(v);
  const kv = currentBudget * 1000;
  document.getElementById('budgetDisplay').textContent = '$' + kv.toLocaleString();

  const avoided = Math.round(kv * 16);
  const avoidedM = (avoided / 1e6).toFixed(1);
  document.getElementById('avoiderDmg').textContent = '$' + avoidedM + 'M';

  const roi = 16;
  document.getElementById('roiDisplay').textContent = roi + ':1';

  const active = currentBudget < 10 ? 0
    : currentBudget < 20 ? 1
    : currentBudget < 50 ? 1
    : currentBudget < 80 ? 2
    : currentBudget < 150 ? 3
    : currentBudget < 300 ? 3
    : currentBudget < 550 ? 4
    : 5;

  document.getElementById('actionsUnlocked').textContent = Math.min(active, currentPlans.length || 3);

  // Re-render plans with budget filter
  if (currentPlans.length > 0) renderPlanCards(currentPlans, currentBudget);
};

/* ── 6. HAZARD HELPERS ── */
const HAZARD_META = {
  flood:   { icon: '🌊', label: 'Floods' },
  heat:    { icon: '🌡', label: 'Heatwaves' },
  drought: { icon: '🏜', label: 'Droughts' },
  storm:   { icon: '⛈', label: 'Storms' },
  air:     { icon: '💨', label: 'Air Quality' },
};

function levelClass(level) {
  const l = (level || '').toLowerCase();
  if (l === 'critical') return 'critical';
  if (l === 'high')     return 'high';
  if (l === 'medium')   return 'medium';
  return 'low';
}

function renderHazardGrid(hazards) {
  const grid = document.getElementById('hazardGrid');
  if (!grid) return;
  grid.innerHTML = '';
  Object.entries(hazards).forEach(([key, h]) => {
    const meta = HAZARD_META[key] || { icon: '⚠', label: key };
    const cls  = levelClass(h.level);
    const score = h.score || 50;
    const fillColor = cls === 'critical' ? '#c62828'
                    : cls === 'high'    ? '#e65100'
                    : cls === 'medium'  ? '#f9a825'
                    : '#2e7d32';
    grid.innerHTML += `
      <div class="hazard-card ${cls}" onclick="highlightHazard('${key}')">
        <div class="hc-icon">${meta.icon}</div>
        <div class="hc-name">${meta.label}</div>
        <div class="hc-level">${h.level}</div>
        <div class="hc-trend">${h.trend}</div>
        <div class="hc-bar">
          <div class="hc-bar-fill" style="width:0%;background:${fillColor}"
               data-width="${score}%"></div>
        </div>
      </div>`;
  });
  // Animate bars after render
  setTimeout(() => {
    document.querySelectorAll('.hc-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 100);
}

function renderPlanCards(plans, budget) {
  const list = document.getElementById('planList');
  if (!list) return;
  const active = plans.filter(p => p.minBudget <= budget);
  if (active.length === 0) {
    list.innerHTML = `<div class="plan-placeholder"><p>💡 Increase your budget to unlock adaptation actions.</p></div>`;
    return;
  }
  list.innerHTML = active.map((p, i) => `
    <div class="plan-card" style="animation-delay:${i*0.08}s">
      <div class="plan-num">0${i+1}</div>
      <div class="plan-body">
        <div class="plan-title">${p.title}</div>
        <div class="plan-desc">${p.desc}</div>
        <div class="plan-pills">
          <span class="pill pill-cost">💰 ${p.cost}</span>
          <span class="pill pill-time">⏱ ${p.time}</span>
          <span class="pill pill-impact">✅ ${p.impact}</span>
        </div>
      </div>
    </div>`).join('');
}

/* ── 7. MAP LAYER TOGGLES ── */
window.toggleLayer = function(btn) {
  const layer = btn.dataset.layer;
  btn.classList.toggle('active');
  const isActive = btn.classList.contains('active');
  const opacity  = isActive ? null : '0';

  const layerMap = {
    flood:   ['floodZone1','floodZone2','mapRiver'],
    heat:    ['heatIsland1','heatIsland2'],
    drought: ['droughtZone']
  };
  (layerMap[layer] || []).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.opacity = isActive ? '' : '0';
  });
};

/* ── 8. HIGHLIGHT HAZARD (scroll to plan) ── */
window.highlightHazard = function(key) {
  document.getElementById('ai-plan').scrollIntoView({ behavior: 'smooth' });
};

/* ── 9. SCROLL TO SEARCH ── */
window.scrollToSearch = function() {
  document.getElementById('searchCard') 
    ? document.getElementById('searchCard').scrollIntoView({ behavior: 'smooth' })
    : document.getElementById('locationInput')?.focus();
};

/* ── 10. QUICK SEARCH ── */
window.quickSearch = function(loc) {
  const input = document.getElementById('locationInput');
  if (input) input.value = loc;
  runAnalysis();
};

/* ── 11. LOADING OVERLAY ── */
function showLoading() {
  let overlay = document.getElementById('loadingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">Analysing climate data…</div>`;
    document.body.appendChild(overlay);
  }
  setTimeout(() => overlay.classList.add('show'), 10);
}
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 300);
  }
}

/* ── 12. TOAST ── */
function showToast(msg, duration = 3000) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

/* ── 13. MAIN ANALYSIS FUNCTION ── */
window.runAnalysis = async function() {
  const input  = document.getElementById('locationInput');
  const btn    = document.getElementById('searchBtn');
  const btnTxt = document.getElementById('btnText');
  const btnLdr = document.getElementById('btnLoader');
  const loc    = input ? input.value.trim() : '';

  if (!loc) {
    showToast('Please enter a location to analyse.');
    input && input.focus();
    return;
  }

  // UI → loading state
  if (btn) btn.disabled = true;
  if (btnTxt) btnTxt.style.display = 'none';
  if (btnLdr) btnLdr.style.display = 'flex';
  showLoading();

  try {
    const budgetSlider = document.getElementById('budgetSlider');
    const budget = budgetSlider ? parseInt(budgetSlider.value) : 200;

    const res = await fetch('/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: loc, budget })
    });

    if (!res.ok) throw new Error('Server error');
    const data = await res.json();

    currentPlans  = data.plans;
    currentBudget = data.budget;

    // Populate result header
    const resultCity    = document.getElementById('resultCity');
    const resultCountry = document.getElementById('resultCountry');
    const riskIndex     = document.getElementById('riskIndex');
    const resultPop     = document.getElementById('resultPop');

    if (resultCity)    resultCity.textContent    = data.city;
    if (resultCountry) resultCountry.textContent = data.country;
    if (riskIndex)     riskIndex.textContent     = data.stats.riskIndex + '/100';
    if (resultPop)     resultPop.textContent     = data.stats.population;

    // Update map label
    const cityLabel = document.getElementById('cityLabel');
    if (cityLabel) cityLabel.textContent = data.city;

    // Show results, hide placeholder
    const placeholder = document.getElementById('placeholderState');
    const results     = document.getElementById('resultsState');
    if (placeholder) placeholder.style.display = 'none';
    if (results)     results.style.display = 'block';

    // Render hazard grid
    renderHazardGrid(data.hazards);

    // Render plan cards
    renderPlanCards(data.plans, data.budget);

    // Update budget display
    const budgetDisplay = document.getElementById('budgetDisplay');
    if (budgetDisplay) budgetDisplay.textContent = '$' + (data.budget * 1000).toLocaleString();

    // Update impact metrics
    const avoiderDmg    = document.getElementById('avoiderDmg');
    const roiDisplay    = document.getElementById('roiDisplay');
    const actionsUnlocked = document.getElementById('actionsUnlocked');

    if (avoiderDmg)     avoiderDmg.textContent     = data.avoidedDamage;
    if (roiDisplay)     roiDisplay.textContent      = data.roi + ':1';
    if (actionsUnlocked) actionsUnlocked.textContent = data.actionsCount;

    // Scroll to dashboard
    setTimeout(() => {
      document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
    }, 200);

    showToast(`✅ Analysis complete for ${data.city}`);

  } catch (err) {
    console.error(err);
    showToast('⚠ Analysis failed. Please try again.');
  } finally {
    hideLoading();
    if (btn) btn.disabled = false;
    if (btnTxt) btnTxt.style.display = '';
    if (btnLdr) btnLdr.style.display = 'none';
  }
};

/* ── 14. PDF REPORT DOWNLOAD ── */
window.downloadReport = function() {
  const cityEl = document.getElementById('resultCity');
  const city = cityEl ? cityEl.textContent : 'Location';

  const reportHTML = `
    <!DOCTYPE html><html><head>
    <style>
      body{font-family:Arial,sans-serif;color:#111;padding:40px;max-width:700px;margin:0 auto}
      h1{font-size:24px;color:#0a3d1f}
      h2{font-size:16px;border-bottom:1px solid #ddd;padding-bottom:6px;margin-top:24px}
      .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:bold}
      .crit{background:#fde8e8;color:#c00}.high{background:#fff3e0;color:#e65100}
      .med{background:#fffde7;color:#f57f17}.low{background:#e8f5e9;color:#2e7d32}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      td,th{padding:8px;border:1px solid #eee;font-size:13px}
      th{background:#f5f5f5;font-weight:600}
      .footer{margin-top:40px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px}
    </style></head><body>
    <h1>🌍 ClimateResilience Copilot</h1>
    <p><strong>Location:</strong> ${city} &nbsp;|&nbsp; <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    <p><strong>OneEarth Challenge 2026 — SDG 13: Climate Action</strong></p>
    <h2>Multi-Hazard Risk Assessment</h2>
    <table>
      <tr><th>Hazard</th><th>Current Level</th><th>2030 Projection</th></tr>
      <tr><td>🌊 Floods</td><td><span class="badge crit">CRITICAL</span></td><td>Worsening</td></tr>
      <tr><td>🌡 Heatwaves</td><td><span class="badge high">HIGH</span></td><td>Severe</td></tr>
      <tr><td>🏜 Droughts</td><td><span class="badge med">MEDIUM</span></td><td>Stable</td></tr>
      <tr><td>⛈ Storms</td><td><span class="badge med">MEDIUM</span></td><td>Intensifying</td></tr>
      <tr><td>💨 Air Quality</td><td><span class="badge low">MODERATE</span></td><td>Seasonal risk</td></tr>
    </table>
    <h2>AI Adaptation Plan</h2>
    <table>
      <tr><th>#</th><th>Action</th><th>Cost</th><th>Timeline</th><th>Impact</th></tr>
      <tr><td>1</td><td>Early warning SMS flood alert network</td><td>$18,000</td><td>3 months</td><td>Saves 340+ lives/yr</td></tr>
      <tr><td>2</td><td>Urban green corridors + tree canopy</td><td>$65,000</td><td>6 months</td><td>−3°C heat island</td></tr>
      <tr><td>3</td><td>Rooftop rainwater harvesting</td><td>$90,000</td><td>4 months</td><td>2,500 people protected</td></tr>
    </table>
    <h2>Investment Summary</h2>
    <p><strong>Budget:</strong> $200,000 &nbsp;|&nbsp; <strong>Avoided Damage (10yr):</strong> $3.2M &nbsp;|&nbsp; <strong>ROI:</strong> 16:1</p>
    <div class="footer">
      Generated by ClimateResilience Copilot · ai@climatecopilot.org · www.climatecopilot.org<br>
      OneEarth Challenge 2026 · SDG 13 — AI for Climate Action & Environmental Protection
    </div>
    </body></html>`;

  const blob = new Blob([reportHTML], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `ClimateResilience_Report_${city.replace(/[^a-z0-9]/gi, '_')}.html`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📄 Report downloaded — open in browser to print as PDF');
};

/* ── 15. HAMBURGER MENU ── */
window.toggleMenu = function() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('open');
};

/* ── 16. INTERSECTION OBSERVER — animate on scroll ── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.animationPlayState = 'running';
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.rt-card, .sdg-card, .im-card').forEach(el => {
  el.style.animationPlayState = 'paused';
  observer.observe(el);
});

/* ── 17. AUTO-LOAD demo if URL has ?demo=1 ── */
if (window.location.search.includes('demo')) {
  const input = document.getElementById('locationInput');
  if (input) input.value = 'Patna, Bihar';
  setTimeout(runAnalysis, 800);
}

console.log('🌍 ClimateResilience Copilot — v1.0 · OneEarth Challenge 2026');