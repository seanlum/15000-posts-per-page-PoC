const chunkSize = 20 * 1024 * 1024;
const totalChunks = 2 * 1024 * 1024 * 1024 / chunkSize;

function generateChunkBuffer(index) {
  const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ";
  const repeat = Math.ceil(chunkSize / lorem.length);
  const prefix = `[Chunk ${index}]\n`;
  const payload = prefix + lorem.repeat(repeat).slice(0, chunkSize - prefix.length);
  const encoder = new TextEncoder();
  return encoder.encode(payload).buffer;
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ChunkDB_Buffered", 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("chunks")) {
        db.createObjectStore("chunks");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function writeChunk(db, index, buffer) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("chunks", "readwrite");
    const store = tx.objectStore("chunks");
    const req = store.put(buffer, index);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function initDB() {
  const db = await openDB();
  for (let i = 0; i < totalChunks; i++) {
    const buffer = generateChunkBuffer(i);
    await writeChunk(db, i, buffer);
  }
  postMessage({ type: 'ready' });
}

async function getChunk(index) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("chunks", "readonly");
    const store = tx.objectStore("chunks");
    const req = store.get(index);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

onmessage = async (e) => {
  const { type, chunkIndex } = e.data;
  if (type === 'init') {
    await initDB();
  } else if (type === 'get') {
    const buffer = await getChunk(chunkIndex);
    postMessage({ type: 'chunk', chunkIndex, buffer }, [buffer]);
  }
};
