# ⚡ ClipSync

> Minimalist, ultra-fast, and 100% static cross-device clipboard & note sharing in real-time — with zero backend, zero databases, zero authentication, and zero environment variables.

---

## 🚀 Overview

ClipSync allows you to transfer text, code snippets, links, and tokens between your computer, phone, tablet, or coworkers in real time.

- **Zero-Backend / Static-First:** Runs purely in the browser. Ready to deploy directly to Vercel, Netlify, Cloudflare Pages, or GitHub Pages with **zero environment variables**.
- **Serverless Realtime Sync:** Powered by MQTT over secure WebSockets (`wss://`) utilizing **retained messages** (`retain: true`, `qos: 1`).
- **Persistence without DB:** The MQTT broker retains the latest state for each room. When any device opens the link or scans the QR code, it instantly receives the retained snapshot!
- **Automatic Fallback:** Connects primarily to **EMQX** (`wss://broker.emqx.io:8084/mqtt`) with automatic failover or manual switching to **HiveMQ** (`wss://broker.hivemq.com:8884/mqtt`) or custom private brokers.
- **Loop & Echo Prevention:** In-memory tab `senderId` (`crypto.randomUUID()`) prevents echo loops and cursor jumps.
- **Design System:** Sleek, native Dark Mode inspired by Linear, Raycast, and Vercel (`zinc-950`, `zinc-900`, `zinc-800` borders, `emerald-500` / `indigo-500` accents).

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript
- **Bundler:** Vite 8
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons:** `lucide-react`
- **Networking:** `mqtt` (Browser WebSocket client)
- **Utilities:** `qrcode` (instant QR generation for mobile sync)

---

## 📡 MQTT Sync Architecture

### 1. Topic Namespace
To prevent collisions on public brokers, every room is mapped under an isolated application prefix:
```
clipsync-app-v1-prod/<roomName>/state
```

### 2. State Payload (`SyncPayload`)
```ts
interface SyncPayload {
  scratchpad: string;
  cards: Array<{
    id: string;
    content: string;
    createdAt: number;
    pinned?: boolean;
  }>;
  updatedAt: number;
  senderId: string; // Random memory ID per tab (crypto.randomUUID())
}
```

### 3. Retain Flag & QoS 1
- When state changes (keystroke debounced at 350ms, card operations immediate), a message is published with:
  ```ts
  client.publish(topic, JSON.stringify(payload), { qos: 1, retain: true });
  ```
- Any new device or browser tab that connects and subscribes (`client.subscribe(topic, { qos: 1 })`) immediately receives the retained message from the broker without needing any database queries.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `⌘ / Ctrl + Enter` | Add new note card from input |
| `⌘ / Ctrl + K` | Open Room Switcher / Generator |
| `⌘ / Ctrl + Shift + C` | Copy scratchpad to clipboard |
| `Esc` | Close active dialog / modal |

---

## 📲 Instant Mobile Sync

1. Open ClipSync on your desktop.
2. Click **Mobile QR** in the top bar.
3. Scan the QR code with your phone camera.
4. Both devices are now linked to the exact same room and sync clipboard & notes in milliseconds.

---

## 📦 Getting Started

### Local Development
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Deploy to Vercel (1-Click)
Since ClipSync requires **0 environment variables and 0 backend functions**, you can deploy directly:
```bash
npx vercel
```
Or connect your Git repository to Vercel and use standard Vite presets (Build command: `npm run build`, Output directory: `dist`).

---

## 🔒 Privacy & Ephemeral Model
Rooms are public on the MQTT broker, protected by the obscurity of the room name. Use generated slugs or long room names (e.g. `swift-falcon-42-x9k1`) for confidential temporary transfers. No data is stored on proprietary servers.
