// utils.js — Shared utilities for NETLEARN CN App

// ── IP / Subnet math ────────────────────────────────────────

function ipToInt(ip) {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0) >>> 0;
}

function intToIp(int) {
  return [24, 16, 8, 0].map(shift => (int >>> shift) & 0xff).join('.');
}

function toBinary(n, bits = 8) {
  return (n >>> 0).toString(2).padStart(bits, '0');
}

function getSubnetMask(prefix) {
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return intToIp(mask);
}

function getNetworkAddr(ip, prefix) {
  const ipInt = ipToInt(ip);
  const maskInt = ipToInt(getSubnetMask(prefix));
  return intToIp((ipInt & maskInt) >>> 0);
}

function getBroadcast(ip, prefix) {
  const networkInt = ipToInt(getNetworkAddr(ip, prefix));
  return intToIp((networkInt | (~ipToInt(getSubnetMask(prefix)) >>> 0)) >>> 0);
}

function getSubnetDetails(octets, prefix) {
  const ip = octets.join('.');
  const mask = getSubnetMask(prefix);
  const network = getNetworkAddr(ip, prefix);
  const broadcast = getBroadcast(ip, prefix);
  const networkInt = ipToInt(network);
  const broadcastInt = ipToInt(broadcast);
  const totalHosts = Math.max(0, broadcastInt - networkInt - 1);
  const firstHost = totalHosts > 0 ? intToIp(networkInt + 1) : 'N/A';
  const lastHost  = totalHosts > 0 ? intToIp(broadcastInt - 1) : 'N/A';
  return { ip, mask, network, broadcast, firstHost, lastHost, totalHosts, prefix };
}

function getClass(firstOctet) {
  if (firstOctet >= 1   && firstOctet <= 126) return 'A';
  if (firstOctet === 127)                      return 'Loopback';
  if (firstOctet >= 128 && firstOctet <= 191) return 'B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'D';
  return 'E';
}

function isPrivate(octets) {
  const [a, b] = octets;
  return (a === 10) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168);
}

// ── Dijkstra ─────────────────────────────────────────────────

function dijkstra(graph, source) {
  const dist = {};
  const prev = {};
  const visited = new Set();
  const nodes = Object.keys(graph);
  nodes.forEach(n => { dist[n] = Infinity; prev[n] = null; });
  dist[source] = 0;
  while (visited.size < nodes.length) {
    const u = nodes
      .filter(n => !visited.has(n))
      .reduce((a, b) => dist[a] < dist[b] ? a : b, null);
    if (!u || dist[u] === Infinity) break;
    visited.add(u);
    Object.entries(graph[u] || {}).forEach(([v, w]) => {
      const alt = dist[u] + w;
      if (alt < dist[v]) { dist[v] = alt; prev[v] = u; }
    });
  }
  return { dist, prev };
}

function buildPath(prev, target) {
  const path = [];
  let cur = target;
  while (cur) { path.unshift(cur); cur = prev[cur]; }
  return path;
}

// ── Bandwidth ────────────────────────────────────────────────

function calcTransferTime(fileSizeBytes, bandwidthBps) {
  if (!bandwidthBps) return null;
  const seconds = (fileSizeBytes * 8) / bandwidthBps;
  if (seconds < 60)   return `${seconds.toFixed(2)} sec`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(2)} min`;
  return `${(seconds / 3600).toFixed(2)} hr`;
}

// ── Gemini API wrapper ────────────────────────────────────────

async function callGemini(contents) {
  if (!CONFIG.GEMINI_API_KEY) {
    throw new Error('API key not configured. Add GEMINI_API_KEY to GitHub Secrets and redeploy.');
  }
  const res = await fetch(CONFIG.GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents })
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

// ── WebViewString bridge ──────────────────────────────────────

function sendToApp(payload) {
  if (window.AppInventor) {
    AppInventor.setWebViewString(JSON.stringify(payload));
  }
}

// ── DOM helpers ───────────────────────────────────────────────

function el(id) { return document.getElementById(id); }
function show(id) { el(id)?.classList.remove('hidden'); }
function hide(id) { el(id)?.classList.add('hidden'); }
function setText(id, text) { const e = el(id); if (e) e.textContent = text; }

// ── Animation helpers ─────────────────────────────────────────

/**
 * Typewriter effect on a DOM element
 * @param {HTMLElement} elem - Target element
 * @param {string} text - Text to type
 * @param {number} speed - Ms per character (default 30)
 * @returns {Promise} Resolves when done
 */
function typewriter(elem, text, speed = 30) {
  return new Promise(resolve => {
    elem.textContent = '';
    let i = 0;
    const interval = setInterval(() => {
      elem.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}

/**
 * Count-up animation on a DOM element
 * @param {HTMLElement} elem - Target element
 * @param {number} target - Number to count to
 * @param {number} duration - Duration in ms (default 800)
 */
function countUp(elem, target, duration = 800) {
  const start = parseInt(elem.textContent) || 0;
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    elem.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/**
 * Mini confetti burst using canvas overlay
 * @param {number} x - X position in viewport
 * @param {number} y - Y position in viewport
 */
function confettiBurst(x, y) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position:fixed;top:0;left:0;width:100%;height:100%;
    pointer-events:none;z-index:9999;
  `;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#00D4FF','#39FF14','#FFB347','#8B5CF6','#FF4560'];
  const particles = Array.from({ length: 40 }, () => ({
    x, y,
    vx: (Math.random() - 0.5) * 8,
    vy: (Math.random() - 1.5) * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 6 + 3,
    life: 1
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.25;
      p.life -= 0.02;
      if (p.life > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 6;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });
    if (alive) requestAnimationFrame(draw);
    else canvas.remove();
  }
  requestAnimationFrame(draw);
}

/**
 * localStorage with try/catch fallback
 */
const storage = {
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
  },
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch(e) { return fallback; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch(e) {}
  }
};
