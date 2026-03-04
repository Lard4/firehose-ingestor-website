// ── DOM refs ──────────────────────────────────────────────

const stage      = document.getElementById('stage');
const dot        = document.getElementById('dot');
const statusText = document.getElementById('status-text');
const btnPause   = document.getElementById('btn-pause');
const btnResume  = document.getElementById('btn-resume');
const btnBlur    = document.getElementById('btn-blur');
btnBlur.textContent = 'unblur images';

// ── State ─────────────────────────────────────────────────

let paused     = false;
let blurImages = true; // start blurred...

// ── Controls ──────────────────────────────────────────────

btnPause.addEventListener('click', () => {
  paused = true;
  btnPause.disabled = true;
  btnResume.disabled = false;
  setStatus('paused', 'paused');
});

btnResume.addEventListener('click', () => {
  paused = false;
  btnPause.disabled = false;
  btnResume.disabled = true;
  setStatus('live', 'live');
});

btnBlur.addEventListener('click', () => {
  blurImages = !blurImages;
  btnBlur.textContent = blurImages ? 'unblur images' : 'blur images';
  document.querySelectorAll('.images img').forEach(img => {
    img.classList.toggle('blurred', blurImages);
  });
});

// ── Helpers ───────────────────────────────────────────────

function setStatus(state, label) {
  dot.className = state;
  statusText.textContent = label;
}

function fmt(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Post rendering ────────────────────────────────────────

function buildPost(post, isMain) {
  const el = document.createElement('div');
  el.className = `post ${isMain ? 'main' : 'parent'}`;

  el.innerHTML = `
    <div class="handle">@${escHtml(post.handle)}</div>
    <div class="content">${escHtml(post.content)}</div>
    ${post.imageUrls && post.imageUrls.length ? `
      <div class="images">
        ${post.imageUrls.map(u => `<img src="${escHtml(u)}" alt="" loading="lazy" class="${blurImages ? 'blurred' : ''}" />`).join('')}
      </div>` : ''}
    ${isMain ? `
    <div class="stats">
      <div class="stat"><span>♥</span>${fmt(post.likes)}</div>
      <div class="stat"><span>↩</span>${fmt(post.replies)}</div>
      <div class="stat"><span>⟳</span>${fmt(post.reposts)}</div>
      <div class="stat"><span>"</span>${fmt(post.quotes)}</div>
    </div>` : ''}
  `;
  return el;
}

function renderPost(post) {
  const stack = document.createElement('div');
  stack.className = 'post-stack';

  const chain = [];
  let cursor = post.parent;
  while (cursor) {
    chain.unshift(cursor);
    cursor = cursor.parent;
  }

  chain.forEach(p => stack.appendChild(buildPost(p, false)));
  stack.appendChild(buildPost(post, true));

  stage.innerHTML = '';
  stage.appendChild(stack);
}

// ── SSE ───────────────────────────────────────────────────

function connect() {
  fetch('https://verda-nonobsessional-jaxon.ngrok-free.dev/feed', {
    headers: { 'ngrok-skip-browser-warning': 'true' }
  }).then(res => {
    setStatus('live', 'live');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    function read() {
      reader.read().then(({ done, value }) => {
        if (done) {
          setStatus('error', 'disconnected');
          setTimeout(connect, 3000);
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          if (paused) continue;
          try {
            const post = JSON.parse(line.slice(5).trim());
            renderPost(post);
          } catch {}
        }
        read();
      });
    }
    read();
  }).catch(() => {
    setStatus('error', 'disconnected');
    setTimeout(connect, 3000);
  });
}

connect();