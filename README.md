# 🍾 TuneBottle
> 🚧*Too lazy to wire up the API right now. Will finish this later.*
> *Send a song into the sea. Wait for the tide.*

TuneBottle is a music pen-pal app where you anonymously throw a song + one-line note into a shared ocean. A stranger finds it. They reply with their own song. Like pen pals, but through music.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open http://localhost:5173
```

---

## 📁 Project Structure

```
tunebottle/
├── index.html              # HTML entry point
├── vite.config.js          # Vite config
├── package.json
└── src/
    ├── main.jsx            # React root render
    ├── index.css           # Global reset
    ├── App.jsx             # Main app + all components
    ├── App.module.css      # All styles (CSS Modules)
    ├── storage.js          # localStorage adapter
    └── helpers.js          # genId(), timeAgo()
```

---

## 🔧 Tech Stack

| Layer     | Choice                        |
|-----------|-------------------------------|
| Framework | React 18 + Vite               |
| Styling   | CSS Modules                   |
| Fonts     | Cormorant Garamond, Caveat, DM Sans (Google Fonts) |
| Storage   | localStorage (local) → swap for backend |

---

## 🌐 Making It Multi-User (Backend Upgrade)

Right now bottles are stored in **your browser's localStorage** — only you can see them.

To make it a real shared ocean, swap `src/storage.js` with API calls. Here are two easy paths:

### Option A — Supabase (recommended, free tier)

```js
// src/storage.js  →  replace with:
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const storage = {
  async get(key) {
    const { data } = await supabase.from('kv').select('value').eq('key', key).single()
    return data ? { key, value: data.value } : null
  },
  async set(key, value) {
    await supabase.from('kv').upsert({ key, value })
    return { key, value }
  }
}
```

SQL to create the table:
```sql
create table kv (
  key   text primary key,
  value text
);
```

### Option B — Firebase Realtime Database

```js
import { getDatabase, ref, set, get } from 'firebase/database'
// implement get/set using ref(db, key)
```

---

## 🗺️ Feature Roadmap

### v0.2 — Music
- [ ] Auto-generate YouTube / Spotify search link from song + artist
- [ ] Embed a playable preview in the bottle card

### v0.3 — Social
- [ ] ❤️ Resonance — react to a bottle without replying
- [ ] 🔗 Chain view — see the full conversation thread across multiple strangers

### v0.4 — Discovery
- [ ] 🌍 Ocean map — bottles as glowing dots on a world map
- [ ] 🎭 Mood tags — label bottles by feeling (melancholic, hopeful, nostalgic…)
- [ ] 🔁 Genre filter — find bottles in a genre you love

### v0.5 — Polish
- [ ] 🔔 "New reply" notification badge on page revisit
- [ ] 🌊 Bottle drift animation on send
- [ ] 📱 PWA support (installable on mobile)

---

## 🎨 Design Notes

- **Aesthetic:** Deep ocean at night — dark navy, bioluminescent teal glows, floating bottle
- **Fonts:** Cormorant Garamond (serif, poetic) + Caveat (handwritten notes) + DM Sans (UI)
- **Colors:** `#020c18` deep navy, `#00e5c8` bioluminescent teal, `#e8d5a3` moonlight gold

---

## 📄 License

MIT — build whatever you want with it.
