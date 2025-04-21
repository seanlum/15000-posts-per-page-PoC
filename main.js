window.onload = () => {
  const startBtn = document.getElementById('start');
  const nextBtn = document.getElementById('next');
  const prevBtn = document.getElementById('prev');
  const status = document.getElementById('status');
  const memory = document.getElementById('memory');
  const content = document.getElementById('content');

  let worker = new Worker('worker.js');
  let currentChunk = 0;
  const totalChunks = 102;
  const MAX_POSTS_PER_PAGE = 15000;

  const cards = [];

  function monitorMemory() {
    if (performance.memory) {
      const usedMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
      memory.textContent = `Memory: ${usedMB} MB / ${totalMB} MB`;
    }
    requestAnimationFrame(monitorMemory);
  }

  function lazyLoadImages() {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.target.dataset.src) {
          entry.target.src = entry.target.dataset.src;
          delete entry.target.dataset.src;
        }
      }
    }, { root: content });

    content.querySelectorAll("img[data-src]").forEach(img => observer.observe(img));
  }

  function renderVirtualCards(buffer, chunkIndex) {
    const decoder = new TextDecoder();
    const text = decoder.decode(buffer);
    content.innerHTML = '';
    cards.length = 0;

    const postLength = Math.floor(buffer.byteLength / MAX_POSTS_PER_PAGE);
    const maxPosts = Math.min(MAX_POSTS_PER_PAGE, Math.floor(text.length / postLength));

    for (let i = 0; i < maxPosts; i++) {
      const slice = text.slice(i * postLength, (i + 1) * postLength);
      const postIndex = i;
      const imgSrc = `img/image-${postIndex + 1}.png`;

      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <img data-src="${imgSrc}" alt="Thumbnail" loading="lazy">
        <div>
          <h3>Post ${chunkIndex}-${postIndex + 1}</h3>
          <p>${slice}</p>
        </div>`;
      cards.push(div);
    }

    content.append(...cards.slice(0, maxPosts));
    lazyLoadImages();
  }

  worker.onmessage = (e) => {
    const { type, chunkIndex, buffer } = e.data;
    if (type === 'chunk') {
      status.textContent = `Chunk ${chunkIndex} (rendered ${MAX_POSTS_PER_PAGE} posts)`;
      renderVirtualCards(buffer, chunkIndex);
    } else if (type === 'ready') {
      status.textContent = 'Database initialized.';
      nextBtn.disabled = false;
      prevBtn.disabled = false;
    }
  };

  startBtn.onclick = () => {
    status.textContent = 'Initializing database...';
    worker.postMessage({ type: 'init' });
  };

  nextBtn.onclick = () => {
    if (currentChunk < totalChunks - 1) {
      currentChunk++;
      worker.postMessage({ type: 'get', chunkIndex: currentChunk });
    }
  };

  prevBtn.onclick = () => {
    if (currentChunk > 0) {
      currentChunk--;
      worker.postMessage({ type: 'get', chunkIndex: currentChunk });
    }
  };

  nextBtn.disabled = true;
  prevBtn.disabled = true;

  monitorMemory();
};
