// ── DOM refs ──────────────────────────────────────────────

const stage      = document.getElementById('stage');
const dot        = document.getElementById('dot');
const statusText = document.getElementById('status-text');
const btnPause   = document.getElementById('btn-pause');
const btnResume  = document.getElementById('btn-resume');
const btnBlur    = document.getElementById('btn-blur');

// ── State ─────────────────────────────────────────────────

let paused     = false;
let blurImages = false;

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

  // collect ancestry chain oldest-first
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

// ── WebSocket ─────────────────────────────────────────────

function connect() {
  const ws = new WebSocket('ws://localhost:3001/stream');

  ws.addEventListener('open', () => {
    if (!paused) setStatus('live', 'live');
  });

  ws.addEventListener('message', (e) => {
    if (paused) return;
    try {
      const post = JSON.parse(e.data);
      renderPost(post);
    } catch {}
  });

  ws.addEventListener('close', () => {
    setStatus('error', 'disconnected');
    setTimeout(connect, 3000);
  });

  ws.addEventListener('error', () => {
    setStatus('error', 'error');
  });
}

connect();