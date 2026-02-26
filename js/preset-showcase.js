/* ============================================
   PRESET SHOWCASE — Gallery (i18n)
   ============================================ */

const PresetShowcase = (() => {
    let showcase = [];
    let filterTag = null;

    function init() {
        showcase = Store.getShowcase();
        bindEvents();
        render();
    }

    function bindEvents() {
        const on = (id, evt, fn) => { const el = document.getElementById(id); if (el) { el.removeEventListener(evt, el['_h_' + evt]); el['_h_' + evt] = fn; el.addEventListener(evt, fn); } };

        on('sc-upload', 'click', () => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json'; input.multiple = true;
            input.onchange = async (e) => {
                for (const file of e.target.files) {
                    try {
                        const data = await Store.importJSON(file);
                        showcase.push({ id: Store.uuid(), name: data.name || file.name.replace('.json', ''), description: data.description || '', tags: data.tags || [], prompts: data.prompts || [], author: data.author || '', createdAt: Date.now(), _raw: data });
                        App.toast(I18n.t('sc.added', { name: data.name || file.name }));
                    } catch (err) { App.toast(I18n.t('pe.import_failed') + err.message, 'error'); }
                }
                save(); render();
            };
            input.click();
        });

        on('sc-add-from-editor', 'click', () => {
            const presets = Store.getPresets();
            if (presets.length === 0) { App.toast(I18n.t('sc.no_presets_editor'), 'warning'); return; }
            showPresetPicker(presets);
        });
    }

    function save() { Store.saveShowcase(showcase); }

    function showPresetPicker(presets) {
        const list = document.getElementById('sc-picker-list');
        list.innerHTML = presets.map(p => `
      <div class="preset-list-item" data-id="${p.id}" style="cursor:pointer;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span style="flex:1">${esc(p.name)}</span>
        <span style="font-size:0.7rem;color:var(--text-muted);">${I18n.t('sc.prompts_count', { count: p.prompts.length })}</span>
      </div>
    `).join('');
        list.querySelectorAll('.preset-list-item').forEach(el => {
            el.addEventListener('click', () => {
                const preset = presets.find(p => p.id === el.dataset.id);
                if (!preset) return;
                const desc = prompt(I18n.t('sc.add_desc'), '');
                const tagsStr = prompt(I18n.t('sc.add_tags'), '');
                showcase.push({ id: Store.uuid(), name: preset.name, description: desc || '', tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [], prompts: [...preset.prompts], author: '', createdAt: Date.now() });
                save(); render(); App.hideModal('sc-picker-modal');
                App.toast(I18n.t('sc.added', { name: preset.name }));
            });
        });
        App.showModal('sc-picker-modal');
    }

    function render() {
        const container = document.getElementById('sc-grid');
        if (!container) return;
        const allTags = [...new Set(showcase.flatMap(s => s.tags))];
        const tagsContainer = document.getElementById('sc-tags');
        if (tagsContainer) {
            tagsContainer.innerHTML = `<span class="tag ${!filterTag ? 'active' : ''}" data-tag="">${I18n.t('btn.all')}</span>${allTags.map(t => `<span class="tag ${filterTag === t ? 'active' : ''}" data-tag="${esc(t)}">${esc(t)}</span>`).join('')}`;
            tagsContainer.querySelectorAll('.tag').forEach(el => { el.addEventListener('click', () => { filterTag = el.dataset.tag || null; render(); }); });
        }
        let filtered = filterTag ? showcase.filter(s => s.tags.includes(filterTag)) : showcase;
        if (filtered.length === 0) { container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p>${I18n.t('sc.no_presets')}</p></div>`; return; }
        container.innerHTML = filtered.map(s => `
      <div class="showcase-card" data-id="${s.id}">
        <div class="showcase-card-title">${esc(s.name)}</div>
        <div class="showcase-card-desc">${esc(s.description) || I18n.t('sc.no_description')}</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;">${s.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <div class="showcase-card-meta">
          <span>${I18n.t('sc.prompts_count', { count: s.prompts.length })}</span>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-sm btn-ghost" data-action="download" data-id="${s.id}" title="Download"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
            <button class="btn btn-sm btn-ghost btn-danger" data-action="remove" data-id="${s.id}" title="${I18n.t('btn.delete')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
          </div>
        </div>
      </div>
    `).join('');
        container.querySelectorAll('[data-action="download"]').forEach(el => { el.addEventListener('click', (e) => { e.stopPropagation(); const it = showcase.find(s => s.id === el.dataset.id); if (it) { Store.exportJSON(it, `${it.name.replace(/\s+/g, '_')}.json`); App.toast(I18n.t('sc.downloaded')); } }); });
        container.querySelectorAll('[data-action="remove"]').forEach(el => { el.addEventListener('click', async (e) => { e.stopPropagation(); const it = showcase.find(s => s.id === el.dataset.id); if (!it) return; const ok = await App.confirm(I18n.t('sc.remove_confirm', { name: it.name })); if (!ok) return; showcase = showcase.filter(s => s.id !== it.id); save(); render(); }); });
        container.querySelectorAll('.showcase-card').forEach(el => { el.addEventListener('click', () => showDetail(el.dataset.id)); });
    }

    function showDetail(id) {
        const item = showcase.find(s => s.id === id);
        if (!item) return;
        const content = document.getElementById('sc-detail-content');
        content.innerHTML = `
      <h3 style="color:var(--text-gold);margin-bottom:12px;">${esc(item.name)}</h3>
      <p style="color:var(--text-secondary);margin-bottom:16px;">${esc(item.description) || I18n.t('sc.no_description')}</p>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${item.prompts.map(p => `<div style="background:var(--bg-deep);padding:10px;border-radius:var(--radius-sm);border:1px solid var(--border-subtle);"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><span class="prompt-role ${p.role}" style="font-size:0.7rem;">${p.role}</span><span style="font-weight:500;font-size:0.85rem;">${esc(p.name)}</span><span style="margin-left:auto;font-size:0.7rem;color:var(--text-muted);">${p.enabled ? '✓' : '✗'}</span></div><pre style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-secondary);white-space:pre-wrap;margin:0;">${esc(p.content)}</pre></div>`).join('')}
      </div>`;
        App.showModal('sc-detail-modal');
    }

    function esc(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }
    return { init };
})();
