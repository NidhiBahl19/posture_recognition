(function() {
  const STORAGE_KEY = 'safety_observations_v1';
  const MAX_IMAGE_WIDTH = 1400;
  const IMAGE_QUALITY = 0.82;

  /** @type {HTMLFormElement} */
  const form = document.getElementById('observationForm');
  /** @type {HTMLInputElement} */
  const titleEl = document.getElementById('title');
  /** @type {HTMLTextAreaElement} */
  const descriptionEl = document.getElementById('description');
  /** @type {HTMLInputElement} */
  const photoEl = document.getElementById('photo');
  /** @type {HTMLDivElement} */
  const previewWrapperEl = document.getElementById('photoPreviewWrapper');
  /** @type {HTMLImageElement} */
  const previewImgEl = document.getElementById('photoPreview');
  /** @type {HTMLButtonElement} */
  const removePhotoBtn = document.getElementById('removePhotoBtn');
  /** @type {HTMLUListElement} */
  const listEl = document.getElementById('observationList');
  /** @type {HTMLParagraphElement} */
  const emptyStateEl = document.getElementById('emptyState');
  /** @type {HTMLSelectElement} */
  const filterSelectEl = document.getElementById('filterSelect');
  /** @type {HTMLButtonElement} */
  const exportBtn = document.getElementById('exportBtn');
  /** @type {HTMLInputElement} */
  const importFileEl = document.getElementById('importFile');
  /** @type {HTMLButtonElement} */
  const clearBtn = document.getElementById('clearBtn');
  /** @type {HTMLDivElement} */
  const statsEl = document.getElementById('stats');

  /** @typedef {{id:string, createdAt:number, title:string, description:string, rating:'positive'|'negative', photoDataUrl?:string}} Observation */

  /** @type {Observation[]} */
  let observations = loadObservations();
  /** @type {string|null} */
  let currentPhotoDataUrl = null;

  function loadObservations() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data;
    } catch (e) {
      console.error('Failed to load observations', e);
      return [];
    }
  }

  function saveObservations() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
    } catch (e) {
      alert('Storage quota exceeded. Consider exporting and clearing some entries.');
      console.error('Failed to save observations', e);
    }
  }

  function formatDate(ts) {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return '' + ts;
    }
  }

  function updateStats() {
    const total = observations.length;
    const pos = observations.filter(o => o.rating === 'positive').length;
    const neg = observations.filter(o => o.rating === 'negative').length;
    statsEl.innerHTML = '';
    const makePill = (label) => {
      const span = document.createElement('span');
      span.className = 'stat-pill';
      span.textContent = label;
      return span;
    };
    statsEl.appendChild(makePill(`Total: ${total}`));
    statsEl.appendChild(makePill(`Positive: ${pos}`));
    statsEl.appendChild(makePill(`Negative: ${neg}`));
  }

  function renderList() {
    const filter = filterSelectEl.value; // all | positive | negative
    const items = observations
      .filter(o => filter === 'all' ? true : o.rating === filter)
      .sort((a, b) => b.createdAt - a.createdAt);

    listEl.innerHTML = '';
    emptyStateEl.classList.toggle('hidden', items.length > 0);

    for (const obs of items) {
      const li = document.createElement('li');
      li.className = 'observation-item';

      const thumb = document.createElement('img');
      thumb.className = 'observation-thumb';
      thumb.alt = 'Observation photo';
      thumb.src = obs.photoDataUrl || placeholderDataUrl(obs.rating);

      const content = document.createElement('div');
      content.className = 'observation-content';

      const title = document.createElement('h3');
      title.className = 'observation-title';
      title.textContent = obs.title;

      const desc = document.createElement('p');
      desc.className = 'observation-desc';
      desc.textContent = obs.description || '';

      const meta = document.createElement('div');
      meta.className = 'observation-meta';

      const badge = document.createElement('span');
      badge.className = `badge ${obs.rating}`;
      badge.textContent = obs.rating === 'positive' ? 'Positive' : 'Negative';

      const time = document.createElement('span');
      time.textContent = formatDate(obs.createdAt);

      const actions = document.createElement('div');
      actions.className = 'item-actions';

      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn btn-secondary btn-inline';
      viewBtn.textContent = 'View';
      viewBtn.addEventListener('click', () => showDetail(obs));

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger btn-inline';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => deleteObservation(obs.id));

      actions.appendChild(viewBtn);
      actions.appendChild(delBtn);

      meta.appendChild(badge);
      meta.appendChild(time);

      content.appendChild(title);
      if (obs.description) content.appendChild(desc);
      content.appendChild(meta);
      content.appendChild(actions);

      li.appendChild(thumb);
      li.appendChild(content);

      listEl.appendChild(li);
    }

    updateStats();
  }

  function placeholderDataUrl(rating) {
    const bg = rating === 'positive' ? '#0c2617' : '#2a1010';
    const fg = rating === 'positive' ? '#22c55e' : '#f87171';
    const text = rating === 'positive' ? 'POS' : 'NEG';
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>\
<rect width='100%' height='100%' rx='12' ry='12' fill='${bg}'/>\
<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='28' fill='${fg}'>${text}</text>\
</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function showDetail(obs) {
    const lines = [
      `Title: ${obs.title}`,
      `Rating: ${obs.rating}`,
      `When: ${formatDate(obs.createdAt)}`,
      obs.description ? `\nDescription:\n${obs.description}` : ''
    ].filter(Boolean);

    // Simple viewer with native confirm for delete
    const view = window.open('', '_blank', 'popup,width=520,height=640');
    if (!view) {
      alert(lines.join('\n\n'));
      return;
    }
    view.document.write(`<!doctype html><html><head><meta charset='utf-8'><title>Observation</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>body{margin:0;font-family:system-ui;background:#0f141a;color:#e6edf3} .wrap{padding:12px} img{max-width:100%;border-radius:12px;border:1px solid #22303c;background:#0b1116} .meta{color:#9fb0c0} .btn{padding:10px 14px;border-radius:10px;border:1px solid #22303c;background:#0b1116;color:#e6edf3;cursor:pointer} .row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}</style>
    </head><body><div class='wrap'>`);
    if (obs.photoDataUrl) view.document.write(`<img src='${obs.photoDataUrl}' alt='Photo'><br><br>`);
    view.document.write(`<div class='meta'>${lines.map(l => `<div>${l.replace(/</g,'&lt;')}</div>`).join('')}</div>`);
    view.document.write(`<div class='row'><button class='btn' onclick='window.print()'>Print / Save PDF</button>
    <a class='btn' download='observation-${obs.id}.json' href='data:application/json,${encodeURIComponent(JSON.stringify(obs,null,2))}'>Download JSON</a></div>`);
    view.document.write('</div></body></html>');
    view.document.close();
  }

  function deleteObservation(id) {
    if (!confirm('Delete this observation? This cannot be undone.')) return;
    observations = observations.filter(o => o.id !== id);
    saveObservations();
    renderList();
  }

  function resetForm() {
    form.reset();
    currentPhotoDataUrl = null;
    previewImgEl.src = '';
    previewWrapperEl.classList.add('hidden');
    titleEl.focus();
  }

  function readFileAsImageDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  function compressImage(dataUrl, maxWidth, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No canvas context'));
        ctx.drawImage(img, 0, 0, w, h);
        try {
          const out = canvas.toDataURL('image/jpeg', quality);
          resolve(out);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = dataUrl;
    });
  }

  async function handlePhotoSelected(file) {
    if (!file) {
      currentPhotoDataUrl = null;
      previewWrapperEl.classList.add('hidden');
      return;
    }
    try {
      const rawDataUrl = await readFileAsImageDataUrl(file);
      const compressed = await compressImage(String(rawDataUrl), MAX_IMAGE_WIDTH, IMAGE_QUALITY);
      currentPhotoDataUrl = compressed;
      previewImgEl.src = compressed;
      previewWrapperEl.classList.remove('hidden');
    } catch (e) {
      console.error(e);
      alert('Could not process the image. Try a different file.');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const rating = String(formData.get('rating') || 'positive') === 'negative' ? 'negative' : 'positive';

    if (!title) {
      alert('Title is required.');
      titleEl.focus();
      return;
    }

    const obs = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      title,
      description,
      rating,
      photoDataUrl: currentPhotoDataUrl || undefined,
    };

    observations.push(obs);
    saveObservations();
    renderList();
    resetForm();
  });

  photoEl.addEventListener('change', (e) => {
    const file = photoEl.files && photoEl.files[0] ? photoEl.files[0] : null;
    handlePhotoSelected(file);
  });

  removePhotoBtn.addEventListener('click', () => {
    photoEl.value = '';
    currentPhotoDataUrl = null;
    previewImgEl.src = '';
    previewWrapperEl.classList.add('hidden');
  });

  filterSelectEl.addEventListener('change', () => renderList());

  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(observations, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'observations.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  importFileEl.addEventListener('change', async () => {
    const file = importFileEl.files && importFileEl.files[0] ? importFileEl.files[0] : null;
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid format');
      const cleaned = data.map(x => ({
        id: String(x.id || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`),
        createdAt: Number(x.createdAt || Date.now()),
        title: String(x.title || '').slice(0, 200),
        description: String(x.description || '').slice(0, 2000),
        rating: x.rating === 'negative' ? 'negative' : 'positive',
        photoDataUrl: typeof x.photoDataUrl === 'string' && x.photoDataUrl.startsWith('data:image/') ? x.photoDataUrl : undefined
      }));
      observations = cleaned;
      saveObservations();
      renderList();
      importFileEl.value = '';
    } catch (e) {
      console.error(e);
      alert('Failed to import file. Ensure it is a previously exported JSON.');
    }
  });

  clearBtn.addEventListener('click', () => {
    if (!confirm('This will permanently delete all observations on this device. Continue?')) return;
    observations = [];
    saveObservations();
    renderList();
  });

  // Initial render
  renderList();
})();