
const state = {
  magazines: [],
  activeMagazine: null,
  spreadIndex: 0,
};

const els = {
  libraryView: document.getElementById('libraryView'),
  readerView: document.getElementById('readerView'),
  grid: document.getElementById('magazineGrid'),
  refreshButton: document.getElementById('refreshButton'),
  backButton: document.getElementById('backButton'),
  fullscreenButton: document.getElementById('fullscreenButton'),
  readerTitle: document.getElementById('readerTitle'),
  readerProgress: document.getElementById('readerProgress'),
  readerStage: document.getElementById('readerStage'),
  spread: document.getElementById('spread'),
  prevButton: document.getElementById('prevButton'),
  nextButton: document.getElementById('nextButton'),
  prevControl: document.getElementById('prevControl'),
  nextControl: document.getElementById('nextControl'),
  loading: document.getElementById('loading'),
  thumbnailStrip: document.getElementById('thumbnailStrip'),
  errorDialog: document.getElementById('errorDialog'),
  errorText: document.getElementById('errorText'),
  errorClose: document.getElementById('errorClose'),
};

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
  }[c]));
}

async function loadLibrary() {
  els.grid.innerHTML = '<div class="empty">Scanning <code>Magazines</code>…</div>';

  try {
    const response = await fetch('/api/magazines', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    const data = await response.json();

    state.magazines = (data.magazines || []).map(mag => ({
      ...mag,
      files: mag.pages.slice().sort(naturalSort),
      count: mag.pages.length,
      getSrc: file => `/Magazines/${encodeURIComponent(mag.id)}/${encodeURIComponent(file)}`
    }));

    renderLibrary();
  } catch (error) {
    showError(
      'The site could not scan the Magazines folder. Make sure you opened the site through server.py (not by double-clicking index.html).'
    );
  }
}

function renderLibrary() {
  els.grid.innerHTML = '';

  if (!state.magazines.length) {
    els.grid.innerHTML = `
      <div class="empty">
        <strong>No magazines found.</strong><br>
        Put issue folders inside <code>Magazines/</code>, for example
        <code>Magazines/01/1.jpg</code>, <code>2.jpg</code>, <code>3.jpg</code>…
      </div>
    `;
    return;
  }

  state.magazines.forEach((mag, index) => {
    const card = document.createElement('button');
    card.className = 'magazine-card';
    card.type = 'button';
    card.setAttribute('aria-label', `Open ${mag.title}`);

    const cover = document.createElement('div');
    cover.className = 'cover';

    const img = document.createElement('img');
    img.loading = index < 6 ? 'eager' : 'lazy';
    img.alt = `${mag.title} cover`;
    img.src = mag.getSrc(mag.files[0]);
    img.onerror = () => {
      cover.innerHTML = '<div class="cover-fallback">NO COVER<br>IMAGE</div>';
    };
    cover.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'magazine-meta';
    meta.innerHTML = `
      <div class="magazine-name">${escapeHtml(mag.title)}</div>
      <div class="magazine-count">${mag.count} ${mag.count === 1 ? 'image' : 'images'}</div>
    `;

    card.append(cover, meta);
    card.addEventListener('click', () => openMagazine(mag));
    els.grid.appendChild(card);
  });
}

function openMagazine(mag) {
  state.activeMagazine = mag;
  state.spreadIndex = 0;
  els.libraryView.classList.add('is-hidden');
  els.readerView.classList.remove('is-hidden');
  els.readerView.setAttribute('aria-hidden', 'false');
  els.readerTitle.textContent = mag.title;
  buildThumbnails();
  renderSpread();
  els.readerStage.focus();
}

function closeReader() {
  els.readerView.classList.add('is-hidden');
  els.readerView.setAttribute('aria-hidden', 'true');
  state.activeMagazine = null;
  els.spread.innerHTML = '';
}

function spreadCount() {
  const total = state.activeMagazine?.count || 0;
  return total ? 1 + Math.ceil(Math.max(0, total - 1) / 2) : 0;
}

function pageIndicesForSpread(index) {
  if (index === 0) return [0];
  const left = 1 + (index - 1) * 2;
  const right = left + 1;
  const total = state.activeMagazine.count;
  return right < total ? [left, right] : [left];
}

function renderSpread() {
  const mag = state.activeMagazine;
  if (!mag) return;

  const totalSpreads = spreadCount();
  state.spreadIndex = Math.max(0, Math.min(state.spreadIndex, totalSpreads - 1));

  const indices = pageIndicesForSpread(state.spreadIndex);
  els.spread.className = `spread ${indices.length === 1 ? 'single' : 'dual'}`;
  els.spread.innerHTML = '';
  els.loading.classList.remove('is-hidden');

  const promises = indices.map(index => new Promise(resolve => {
    const img = document.createElement('img');
    img.className = 'page';
    img.alt = `${mag.title}, page ${index + 1}`;
    img.src = mag.getSrc(mag.files[index]);
    img.onload = resolve;
    img.onerror = resolve;
    els.spread.appendChild(img);
  }));

  Promise.all(promises).finally(() => els.loading.classList.add('is-hidden'));

  els.readerProgress.textContent = state.spreadIndex === 0
    ? `Cover · 1 / ${mag.count}`
    : `Pages ${indices[0] + 1}${indices[1] !== undefined ? `–${indices[1] + 1}` : ''} / ${mag.count}`;

  els.prevControl.disabled = state.spreadIndex === 0;
  els.nextControl.disabled = state.spreadIndex >= totalSpreads - 1;
  els.prevButton.disabled = state.spreadIndex === 0;
  els.nextButton.disabled = state.spreadIndex >= totalSpreads - 1;

  document.querySelectorAll('.thumb').forEach((thumb, i) => {
    thumb.classList.toggle('active', indices.includes(i));
  });
}

function changeSpread(delta) {
  const next = state.spreadIndex + delta;
  if (next < 0 || next >= spreadCount()) return;
  state.spreadIndex = next;
  renderSpread();
}

function buildThumbnails() {
  const mag = state.activeMagazine;
  els.thumbnailStrip.innerHTML = '';

  mag.files.forEach((file, index) => {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'thumb';
    thumb.title = `Page ${index + 1}`;

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = `Page ${index + 1}`;
    img.src = mag.getSrc(file);

    thumb.appendChild(img);
    thumb.addEventListener('click', () => {
      state.spreadIndex = index === 0 ? 0 : 1 + Math.floor((index - 1) / 2);
      renderSpread();
    });
    els.thumbnailStrip.appendChild(thumb);
  });
}

function showError(message) {
  els.errorText.textContent = message;
  if (typeof els.errorDialog.showModal === 'function') els.errorDialog.showModal();
  else alert(message);
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await els.readerView.requestFullscreen?.();
      els.readerView.classList.add('is-fullscreen');
    } else {
      await document.exitFullscreen?.();
      els.readerView.classList.remove('is-fullscreen');
    }
  } catch {}
}

function setupSwipe() {
  let startX = 0;
  let startY = 0;

  els.readerStage.addEventListener('touchstart', e => {
    const t = e.changedTouches[0];
    startX = t.clientX;
    startY = t.clientY;
  }, { passive: true });

  els.readerStage.addEventListener('touchend', e => {
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
      changeSpread(dx < 0 ? 1 : -1);
    }
  }, { passive: true });
}

els.refreshButton.addEventListener('click', loadLibrary);
els.backButton.addEventListener('click', closeReader);
els.fullscreenButton.addEventListener('click', toggleFullscreen);
els.prevButton.addEventListener('click', () => changeSpread(-1));
els.nextButton.addEventListener('click', () => changeSpread(1));
els.prevControl.addEventListener('click', () => changeSpread(-1));
els.nextControl.addEventListener('click', () => changeSpread(1));
els.errorClose.addEventListener('click', () => els.errorDialog.close());

document.addEventListener('keydown', event => {
  if (els.readerView.classList.contains('is-hidden')) return;
  if (event.key === 'Escape') closeReader();
  if (event.key === 'ArrowLeft') changeSpread(-1);
  if (event.key === 'ArrowRight') changeSpread(1);
  if (event.key.toLowerCase() === 'f') toggleFullscreen();
});

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) els.readerView.classList.remove('is-fullscreen');
});

setupSwipe();
loadLibrary();
