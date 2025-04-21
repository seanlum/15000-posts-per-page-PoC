# 15000-posts-per-page-PoC

📦 Proof-of-Concept: Efficiently render 15,000 posts with thumbnails per page in a modern browser.

## 🧠 Overview

This project demonstrates how to render a massive feed (15,000 posts per page) from a 20MB text chunk without jank or performance issues — even on older hardware like a MacBook Pro 2015.

Each post is rendered from:
- A portion of a 20MB text chunk (≈1.3KB per post)
- A corresponding 300×240px PNG thumbnail from disk
- Lazy-loaded `<img>` elements
- Full rendering in one DOM view without a frontend framework

## 💡 Goals

- Push browser rendering limits for feed-style UIs
- Benchmark practical rendering strategies using real-world image and text constraints
- Avoid jank while using standard DOM and JavaScript
- Keep it pure HTML, IndexedDB, and vanilla JS

---

## 🚀 Features

- 📑 Loads 20MB text chunks using IndexedDB
- 🧩 Splits chunk into 15,000 evenly-sized posts
- 🖼️ Each post displays a unique 300x240 PNG from `img/image-<n>.png`
- 💤 Lazy-loads thumbnails with `IntersectionObserver`
- 🧠 Memory monitor with `performance.memory`
- 🧠 Fast loading with DOM chunked render
- 🎯 Performance-tested on MacBook Pro (2015)

---

## 📁 File Structure

```
📦 15000-posts-per-page-PoC
├── index.html                            # Page which displays the content
├── main.js                               # UI thread processing tool
├── worker.js                             # background worker that creates the indexdb
├── image-gen.py                          # Script which generates images in img/
├── img/                                  # Output directory structure
│   └── image-1.png to image-15000.png
```

You must generate or place 15,000 thumbnail PNGs under the `img/` folder. Use the Python script `image-gen.py` to create them.

---

## ⚙️ How It Works

### 🔄 Chunking and Storage: `worker.js`

```js
const chunkSize = 20 * 1024 * 1024; // 20MB
const totalChunks = 102;

function generateChunkBuffer(index) {
  const lorem = "Lorem ipsum dolor sit amet...";
  const repeat = Math.ceil(chunkSize / lorem.length);
  const payload = lorem.repeat(repeat).slice(0, chunkSize);
  return new TextEncoder().encode(payload).buffer;
}

async function initDB() {
  const db = await indexedDB.open("ChunkDB_Buffered", 1);
  for (let i = 0; i < totalChunks; i++) {
    const buffer = generateChunkBuffer(i);
    await db.transaction("chunks", "readwrite").objectStore("chunks").put(buffer, i);
  }
}
```

### 🧱 Rendering: `main.js`

```js
const postLength = Math.floor(buffer.byteLength / 15000);
const maxPosts = 15000;

for (let i = 0; i < maxPosts; i++) {
  const slice = text.slice(i * postLength, (i + 1) * postLength);
  const imgSrc = `img/image-${i + 1}.png`;

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = \`
    <img data-src="\${imgSrc}" loading="lazy" />
    <div>
      <h3>Post \${chunkIndex}-\${i + 1}</h3>
      <p>\${slice}</p>
    </div>
  \`;
  container.appendChild(card);
}
```

### 📉 Memory Monitoring

```js
function monitorMemory() {
  if (performance.memory) {
    const used = performance.memory.usedJSHeapSize / 1048576;
    const total = performance.memory.totalJSHeapSize / 1048576;
    memoryDiv.textContent = \`Memory: \${used.toFixed(1)} MB / \${total.toFixed(1)} MB\`;
  }
  requestAnimationFrame(monitorMemory);
}
```

---

## 🧪 Performance

Tested on:
- MacBook Pro 2015
- Google Chrome & Firefox
- 15s to render 15,000 cards
- ~1 minute to load thumbnails from disk

---

## 🛠️ Requirements

To serve the app locally:
```bash
python3 -m http.server 8000
```
Navigate to: [http://localhost:8000](http://localhost:8000)

---

## 🖼️ Generate Thumbnails

Use this script to generate image files:
```bash
python3 image-gen.py
```

---

## 📚 License

MIT
