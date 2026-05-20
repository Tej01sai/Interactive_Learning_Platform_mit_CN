# CN Learning App — Full Project Specification
> AI for Education | Computer Networks | MIT App Inventor + HTML/CSS/JS

---

## Project Overview

A mobile learning app that teaches Computer Networks interactively using HTML/CSS/JS modules embedded inside MIT App Inventor via WebViewer. AI features (Quiz generator + Tutor chatbot) are powered by the Gemini API called directly from JavaScript using `fetch()`.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Content & UI | HTML5 + CSS3 + Vanilla JS | All interactive screens |
| AI | Gemini 1.5 Flash API (REST) | Quiz MCQ generator + AI Tutor |
| Hosting | GitHub Pages | Serves HTML files to WebViewer |
| App Shell | MIT App Inventor | Navigation, WebViewer, TinyDB |
| Storage | localStorage (JS side) | Scores, chat history per session |
| Data bridge | WebViewString API | JS ↔ App Inventor communication |

---

## File Structure

```
cn-app/
├── index.html               # Landing / entry point (optional)
├── style.css                # Shared mobile-first styles
├── utils.js                 # Shared math utilities (subnet calc etc.)
├── config.js                # API key config (DO NOT commit to public repo)
│
├── learn_osi.html           # OSI & TCP/IP interactive simulation
├── learn_ip.html            # IP Addressing & Subnetting slider tool
├── learn_topology.html      # Network Topology drag & build
├── learn_routing.html       # Routing path-finding game
├── learn_security.html      # Network Security scenario stories
│
├── tools_subnet.html        # Subnet calculator
├── tools_ipclass.html       # IP class identifier
├── tools_bandwidth.html     # Bandwidth calculator
│
├── quiz.html                # AI-generated MCQ quiz (Gemini API)
└── tutor.html               # AI Tutor chatbot (Gemini API)
```

---

## Shared Style Guide (`style.css`)

- Mobile-first, viewport width 360–420px
- Font: `system-ui, sans-serif`
- Background: `#f8f9fa`, Cards: `#ffffff`
- Primary accent: `#534AB7` (purple)
- Secondary: `#1D9E75` (teal)
- Border radius: `12px` for cards, `8px` for buttons
- No external CSS frameworks — keep files lightweight for WebViewer
- All tap targets minimum `44px` height (mobile usability)
- CSS animations using `@keyframes` for packet flow, highlights, transitions

---

## Module Specifications

---

### 1. `learn_osi.html` — OSI & TCP/IP Simulation

**Mechanic:** Step-through packet journey simulation

**What the student does:**
- Taps "Send message" to start
- A packet travels DOWN 7 OSI layers on the sender side
- Crosses a "network cloud" in the middle
- Travels UP 7 layers on the receiver side
- Each layer lights up, shows what it adds (header/trailer), and shows a one-line explanation

**UI Elements:**
- Two columns: Sender | Receiver
- 7 layer boxes per column, color-coded by layer
- Animated packet bar travelling between layers
- Info panel below showing current layer's explanation
- Packet visualizer: shows accumulated headers as colored segments
- Toggle button: switch between OSI (7 layer) and TCP/IP (4 layer) view
- "What went wrong?" challenge mode: one layer is broken, student must tap the faulty one

**Layer data:**

| # | Layer | PDU | Role | Color |
|---|---|---|---|---|
| 7 | Application | Data | User data created | `#EEEDFE` |
| 6 | Presentation | Data | Encode & encrypt | `#E1F5EE` |
| 5 | Session | Data | Open connection | `#FBEAF0` |
| 4 | Transport | Segment | Add port + sequence | `#FAECE7` |
| 3 | Network | Packet | Add IP addresses | `#FAEEDA` |
| 2 | Data Link | Frame | Add MAC + CRC | `#E6F1FB` |
| 1 | Physical | Bits | Convert to signals | `#EAF3DE` |

**JS Logic:**
- `step` variable tracks current position (0 = idle, 1–7 = sender layers, 8 = cloud, 9–15 = receiver layers)
- `nextStep()` and `prevStep()` functions
- `renderStep(step)` updates DOM — highlights current layer, updates info panel, updates packet visualizer
- `resetSim()` resets all state
- TCP/IP toggle maps 7 layers → 4 layers: Application(5+6+7), Transport(4), Internet(3), Network Access(1+2)

---

### 2. `learn_ip.html` — IP Addressing & Subnetting

**Mechanic:** Visual IP builder with live binary view

**What the student does:**
- Drags 4 sliders (0–255 each) to build an IP address
- App instantly shows: dotted decimal, binary form, IP class, network vs host portions
- A CIDR prefix slider (/8 to /30) visually "cuts" the IP into network and host portions
- Subnet details: network address, broadcast, usable hosts, subnet mask

**UI Elements:**
- 4 octet sliders side by side, each labeled (e.g. `192`)
- Binary display: 32 bits shown as 4 groups of 8, network bits highlighted in purple, host bits in teal
- Class badge: auto-updates (Class A / B / C / D / E)
- Subnet panel: shows all calculated values live
- "Assign this IP" game mode: a scenario appears ("You are setting up a small office with 50 devices — pick a valid IP and subnet") and student must configure correctly

**JS Logic:**
- `octets = [192, 168, 1, 1]` — updated by slider `oninput`
- `toBinary(n)` — converts octet to 8-bit binary string
- `getClass(firstOctet)` — returns A/B/C/D/E
- `getSubnetDetails(octets, prefix)` — returns network addr, broadcast, usable hosts, mask
- All calculations done client-side, no API needed

---

### 3. `learn_topology.html` — Network Topology Builder

**Mechanic:** Drag-and-drop canvas + auto-detect topology

**What the student does:**
- Taps "Add Device" to place router/PC/switch nodes on a canvas
- Taps two nodes to connect them with a link
- App auto-detects the topology type: Star, Bus, Ring, Mesh, Hybrid
- "Simulate failure" button: student taps a node to remove it — app shows which devices lose connectivity in red
- Cost vs reliability score shown as two progress bars

**UI Elements:**
- SVG canvas (full width, ~300px tall)
- Toolbar: Add Router, Add PC, Add Switch, Connect, Delete, Simulate Failure
- Topology label badge: auto-updates as student builds
- Connectivity status panel
- Score bars: Cost efficiency | Fault tolerance

**JS Logic:**
- `nodes = []` array of `{id, type, x, y}`
- `edges = []` array of `{from, to}`
- `detectTopology(nodes, edges)` — returns topology name based on connection pattern
- `simulateFailure(nodeId)` — removes node, runs BFS to find disconnected nodes
- SVG drawn dynamically with `createElementNS`

---

### 4. `learn_routing.html` — Routing Path-finding Game

**Mechanic:** Student plays as a packet choosing hops

**What the student does:**
- A network map shows 8 routers as nodes with weighted links (hop cost)
- Student must route a packet from source to destination by tapping the next router to hop to
- Routing table shown for current router
- Wrong hop = packet dropped animation
- "Shortest path" reveal button shows Dijkstra's result highlighted in green
- Timed challenge mode: reach destination in fewest hops before countdown

**UI Elements:**
- SVG router graph (nodes + weighted edges)
- Current router highlighted in amber
- Destination router highlighted in teal
- Routing table below: `{Destination | Next Hop | Cost}`
- Hop counter + timer
- "Reveal shortest path" button
- Packet trail showing visited routers

**JS Logic:**
- `graph = {A: {B:2, C:5}, B: {D:1}, ...}` adjacency with weights
- `dijkstra(graph, source)` — returns shortest paths from source
- `playerHop(routerId)` — validates hop, updates trail, checks if destination reached
- `renderGraph()` — redraws SVG on each hop

---

### 5. `learn_security.html` — Network Security Scenarios

**Mechanic:** Decision-based storytelling + mini-games

**What the student does:**
- Scenarios presented as story cards: "You're the network admin. A suspicious packet arrives from IP 10.0.0.99 on port 22. What do you do?"
- 3 choice buttons per scenario — each leads to a different outcome (success/breach/partial)
- Encryption demo: student types a message, watches Caesar cipher → then AES-style block substitution explained visually
- Firewall rule builder: student sets ALLOW/DENY rules and tests packets against them
- "Catch the hacker" mini-game: anomalous packets stream in, student taps the malicious ones

**UI Elements:**
- Scenario card with story text
- 3 choice buttons with outcome reveal
- Progress: scenario 1/6, score tracker
- Encryption demo panel
- Firewall rule table: editable rows
- Mini-game: scrolling packet list, tap to block

**JS Logic:**
- `scenarios[]` array of `{text, choices: [{label, outcome, correct}]}`
- `caesarCipher(text, shift)` — live encryption demo
- `firewallCheck(packet, rules)` — evaluates packet against rule list
- `gameLoop()` — generates random packets for mini-game, tracks correct blocks

---

### 6. `tools_subnet.html` — Subnet Calculator

**Mechanic:** Input IP + prefix → instant full subnet breakdown

**UI Elements:**
- IP address input (4 text fields or one combined)
- CIDR prefix slider `/8` to `/30`
- Result cards: Network Address, Broadcast Address, First Host, Last Host, Total Hosts, Subnet Mask

**JS Logic:**
- Pure math — no API
- `ipToInt(ip)`, `intToIp(int)`, `getSubnetMask(prefix)`, `getNetworkAddr(ip, mask)`, `getBroadcast(ip, mask)`
- All results update `oninput` live

---

### 7. `tools_ipclass.html` — IP Class Identifier

**Mechanic:** Enter any IP, get instant classification with explanation

**UI Elements:**
- Single IP input field
- Class badge (A/B/C/D/E) with color
- Range info: "Class A: 1.0.0.0 – 126.255.255.255"
- Private/Public indicator
- Default subnet mask for that class
- Use case explanation (1–2 sentences)

---

### 8. `tools_bandwidth.html` — Bandwidth Calculator

**Mechanic:** Input file size + bandwidth → transfer time

**UI Elements:**
- File size input + unit selector (KB/MB/GB)
- Bandwidth input + unit selector (Kbps/Mbps/Gbps)
- Result: transfer time in seconds/minutes
- Comparison bar: shows how fast vs dial-up, 4G, fiber

---

### 9. `quiz.html` — AI-Generated MCQ Quiz

**Mechanic:** Gemini API generates topic-specific MCQs dynamically

**UI Elements:**
- Topic selector: dropdown (OSI / IP / Topology / Routing / Security)
- Difficulty selector: Easy / Medium / Hard
- Question card with 4 answer buttons
- Score tracker: X / 10
- Feedback panel: correct answer + brief explanation after each answer
- Final score screen with "Try again" and "Share score" buttons

**Gemini API call:**

```javascript
async function generateQuestion(topic, difficulty) {
  const prompt = `Generate 1 multiple choice question about ${topic} in Computer Networks.
Difficulty: ${difficulty}.
Return ONLY valid JSON in this exact format:
{
  "question": "...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "answer": "A",
  "explanation": "..."
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}
```

**JS Logic:**
- `score`, `questionNum` tracked in state
- `generateQuestion(topic, difficulty)` — API call, returns parsed JSON
- `checkAnswer(selected, correct)` — updates score, shows feedback
- `localStorage.setItem('quizScore', score)` — persists score
- Loading spinner shown during API call

---

### 10. `tutor.html` — AI Tutor Chatbot

**Mechanic:** Student asks CN questions, Gemini answers in simple terms

**UI Elements:**
- Chat bubble UI: student messages right-aligned, tutor messages left-aligned
- Text input + Send button at bottom
- Suggested questions as pill buttons: "What is subnetting?", "Explain TCP vs UDP", "What does a router do?"
- Typing indicator (animated dots) while API responds
- "Clear chat" button

**Gemini API call:**

```javascript
const SYSTEM_PROMPT = `You are a friendly Computer Networks tutor for undergraduate students.
Explain concepts simply, use real-world analogies, keep answers under 100 words.
If a student asks something unrelated to Computer Networks, politely redirect them.`;

async function askTutor(userMessage, chatHistory) {
  const messages = [
    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
    ...chatHistory,
    { role: 'user', parts: [{ text: userMessage }] }
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: messages })
    }
  );

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
```

**JS Logic:**
- `chatHistory = []` — stores last 6 messages (3 exchanges) for context
- `appendMessage(role, text)` — adds bubble to chat UI
- `localStorage.setItem('chatHistory', JSON.stringify(chatHistory))` — persists across reloads
- Scroll to bottom after each message

---

## WebViewString Bridge (JS ↔ MIT App Inventor)

Use this to send data from your HTML files back to App Inventor blocks (e.g. quiz score, topic completed).

**From JS (inside HTML file):**
```javascript
// Send quiz score back to App Inventor
function sendScoreToApp(score) {
  if (window.AppInventor) {
    AppInventor.setWebViewString(JSON.stringify({ type: 'quizScore', value: score }));
  }
}

// Send topic completion signal
function sendTopicComplete(topic) {
  if (window.AppInventor) {
    AppInventor.setWebViewString(JSON.stringify({ type: 'topicDone', topic: topic }));
  }
}
```

**In MIT App Inventor blocks:**
- Event: `WebViewer.WebViewStringChange` fires whenever JS calls `setWebViewString`
- Read value with `WebViewer.WebViewString` block
- Parse with `list from csv row` or store directly in TinyDB

---

## API Key Safety

- For development/research prototype: store key in `config.js`, add `config.js` to `.gitignore`
- For paper submission demo: use a free Vercel serverless function as a proxy
- Never expose key in a public GitHub repo

**Simple Vercel proxy (`api/gemini.js`):**
```javascript
export default async function handler(req, res) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) }
  );
  const data = await response.json();
  res.json(data);
}
```

---

## Deployment Steps

1. Create GitHub repo: `cn-app` (private for now)
2. Enable GitHub Pages: Settings → Pages → Branch: main → `/root`
3. Your base URL: `https://yourusername.github.io/cn-app/`
4. Each file accessible at: `https://yourusername.github.io/cn-app/quiz.html`
5. In MIT App Inventor: set each `WebViewer.HomeURL` to the corresponding GitHub Pages URL
6. Test on MIT AI2 Companion app first before building APK

---

## MIT App Inventor Screen Map

| Screen | Components | WebViewer URL |
|---|---|---|
| Screen1 (Home) | Labels, Buttons, TinyDB | — (no WebViewer) |
| LearnScreen | WebViewer (full screen) | `learn_osi.html` (default, switchable) |
| ToolsScreen | WebViewer (full screen) | `tools_subnet.html` (default) |
| QuizScreen | WebViewer (full screen) | `quiz.html` |
| TutorScreen | WebViewer (full screen) | `tutor.html` |

**Navigation:** Bottom nav bar built in App Inventor using a horizontal arrangement of image buttons. Each button calls `open another screen` block with the target screen name.

---

## Research Paper Mapping

| App Feature | Learning Theory to cite |
|---|---|
| OSI simulation (step-through) | Active Learning (Bonwell & Eison, 1991) |
| IP slider builder | Constructivism (Piaget) |
| Topology drag & build | Discovery Learning (Bruner) |
| Routing path-finding game | Game-based Learning (Prensky, 2001) |
| Security scenario stories | Problem-based Learning (Barrows, 1986) |
| AI Tutor chatbot | Intelligent Tutoring Systems (VanLehn, 2011) |
| AI Quiz generator | Adaptive Assessment |

---

*Generated for conference paper: "AI-Powered Interactive Mobile Application for Computer Networks Education Using MIT App Inventor"*
