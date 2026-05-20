// Shared utilities for CN Learning App

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
  const wildcardInt = ipToInt(getSubnetMask(32 - prefix > 31 ? 0 : prefix)) ^ 0xffffffff;
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
  const url = CONFIG.GEMINI_ENDPOINT;
  const body = CONFIG.USE_PROXY
    ? JSON.stringify({ contents })
    : JSON.stringify({ contents });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
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
