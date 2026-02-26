/* ============================================
   WORLDBOOK / LOREBOOK — Full Editor (i18n)
   ============================================ */

const Worldbook = (() => {
  let worlds = [];
  let activeWorldId = null;
  let activeEntryId = null;
  let searchQuery = '';

  function init() {
    worlds = Store.getWorlds();
    activeWorldId = activeWorldId || worlds[0]?.id || null;
    bindEvents();
    renderWorldList();
    renderEntryList();
    renderEditor();
  }

  function getActiveWorld() { return worlds.find(w => w.id === activeWorldId); }
  function getActiveEntry() { const w = getActiveWorld(); return w?.entries.find(e => e.id === activeEntryId); }
  function save() { Store.saveWorlds(worlds); }

  function getPositions() {
    return [
      { value: 'before_char', label: I18n.t('wb.pos.before_char') },
      { value: 'after_char', label: I18n.t('wb.pos.after_char') },
      { value: 'before_an', label: I18n.t('wb.pos.before_an') },
      { value: 'after_an', label: I18n.t('wb.pos.after_an') },
      { value: 'at_depth', label: I18n.t('wb.pos.at_depth') },
    ];
  }

  function bindEvents() {
    const on = (id, evt, fn) => { const el = document.getElementById(id); if (el) { el.removeEventListener(evt, el['_h_' + evt]); el['_h_' + evt] = fn; el.addEventListener(evt, fn); } };

    // Sidebar tab switching
    document.querySelectorAll('.wb-sidebar-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.wb-sidebar-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.wb-sidebar-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById(`wb-panel-${tab.dataset.panel}`);
        if (panel) panel.classList.add('active');
      });
    });

    on('wb-new-world', 'click', () => {
      const name = prompt(I18n.t('wb.world_name_prompt'), 'New World');
      if (!name) return;
      const w = { id: Store.uuid(), name, entries: [], createdAt: Date.now() };
      worlds.push(w); activeWorldId = w.id; activeEntryId = null;
      save(); renderWorldList(); renderEntryList(); renderEditor();
      // Auto-switch to entries tab
      switchSidebarTab('entries');
    });
    on('wb-new-entry', 'click', () => {
      const world = getActiveWorld();
      if (!world) { App.toast(I18n.t('wb.select_world'), 'warning'); return; }
      const entry = createEntry();
      world.entries.push(entry);
      activeEntryId = entry.id;
      save(); renderEntryList(); renderEditor();
    });
    on('wb-delete-world', 'click', async () => {
      const world = getActiveWorld(); if (!world) return;
      const ok = await App.confirm(I18n.t('wb.delete_confirm', { name: world.name }));
      if (!ok) return;
      worlds = worlds.filter(w => w.id !== world.id);
      activeWorldId = worlds[0]?.id || null;
      activeEntryId = null;
      save(); renderWorldList(); renderEntryList(); renderEditor();
    });
    on('wb-rename-world', 'click', () => {
      const world = getActiveWorld(); if (!world) return;
      const name = prompt(I18n.t('wb.rename_prompt'), world.name);
      if (!name) return;
      world.name = name; save(); renderWorldList();
    });
    on('wb-import', 'click', () => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.json';
      input.onchange = async (e) => {
        try {
          const data = await Store.importJSON(e.target.files[0]);
          const w = { id: Store.uuid(), name: data.name || 'Imported World', entries: (data.entries || []).map(en => ({ ...createEntry(), ...en, id: Store.uuid() })), createdAt: Date.now() };
          worlds.push(w); activeWorldId = w.id; activeEntryId = null;
          save(); renderWorldList(); renderEntryList(); renderEditor();
          App.toast(I18n.t('wb.imported'));
          switchSidebarTab('entries');
        } catch (err) { App.toast(I18n.t('wb.import_failed') + err.message, 'error'); }
      };
      input.click();
    });
    on('wb-export', 'click', () => {
      const world = getActiveWorld(); if (!world) return;
      Store.exportJSON(world, `${world.name.replace(/\s+/g, '_')}_lorebook.json`);
      App.toast(I18n.t('wb.exported'));
    });
    on('wb-search', 'input', (e) => { searchQuery = e.target.value.toLowerCase(); renderEntryList(); });
    on('wb-batch-enable', 'click', () => batchAction('enable'));
    on('wb-batch-disable', 'click', () => batchAction('disable'));
    on('wb-batch-delete', 'click', () => batchAction('delete'));
    on('wb-select-all', 'change', (e) => { const world = getActiveWorld(); if (!world) return; world.entries.forEach(en => en._selected = e.target.checked); renderEntryList(); });
  }

  function switchSidebarTab(panel) {
    document.querySelectorAll('.wb-sidebar-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.wb-sidebar-panel').forEach(p => p.classList.remove('active'));
    const tab = document.querySelector(`.wb-sidebar-tab[data-panel="${panel}"]`);
    const panelEl = document.getElementById(`wb-panel-${panel}`);
    if (tab) tab.classList.add('active');
    if (panelEl) panelEl.classList.add('active');
  }

  function createEntry() {
    return { id: Store.uuid(), title: 'New Entry', keywords: '', optionalFilter: '', content: '', enabled: true, position: 'before_char', depth: 4, order: 100, triggerPercent: 100, logic: 'any', scanDepth: null, caseSensitive: false, wholeWords: false, nonRecursable: false, preventRecursion: false, delayUntilRecursion: false, ignoreBudget: false, inclusionGroup: '', prioritize: false, groupWeight: 100, sticky: 0, cooldown: 0, delay: 0, _selected: false };
  }

  function batchAction(action) {
    const world = getActiveWorld(); if (!world) return;
    const selected = world.entries.filter(e => e._selected);
    if (selected.length === 0) { App.toast(I18n.t('wb.no_selected'), 'warning'); return; }
    if (action === 'enable') selected.forEach(e => e.enabled = true);
    else if (action === 'disable') selected.forEach(e => e.enabled = false);
    else if (action === 'delete') {
      world.entries = world.entries.filter(e => !e._selected);
      if (!world.entries.find(e => e.id === activeEntryId)) activeEntryId = null;
    }
    save(); renderEntryList(); renderEditor();
  }

  function renderWorldList() {
    const list = document.getElementById('wb-world-list');
    if (!list) return;
    list.innerHTML = worlds.map(w => `
      <div class="wb-world-item ${w.id === activeWorldId ? 'active' : ''}" data-id="${w.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(w.name)}</span>
        <span style="font-size:0.7rem;color:var(--text-muted);">${w.entries.length}</span>
      </div>
    `).join('');
    list.querySelectorAll('.wb-world-item').forEach(el => {
      el.addEventListener('click', () => {
        activeWorldId = el.dataset.id;
        activeEntryId = null;
        renderWorldList(); renderEntryList(); renderEditor();
        // Auto-switch to entries tab
        switchSidebarTab('entries');
      });
    });
  }

  function renderEntryList() {
    const container = document.getElementById('wb-entry-list');
    if (!container) return;
    const world = getActiveWorld();

    if (!world) {
      container.innerHTML = `<div class="empty-state" style="padding:30px 10px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:32px;height:32px;"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/></svg><p style="font-size:0.8rem;">${I18n.t('wb.select_world')}</p></div>`;
      return;
    }

    let entries = world.entries;
    if (searchQuery) entries = entries.filter(e => e.title.toLowerCase().includes(searchQuery) || e.keywords.toLowerCase().includes(searchQuery) || e.content.toLowerCase().includes(searchQuery));

    if (entries.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:30px 10px;"><p style="font-size:0.8rem;">${searchQuery ? I18n.t('wb.no_match') : I18n.t('wb.no_entries')}</p></div>`;
      return;
    }

    container.innerHTML = entries.map(e => `
      <div class="wb-entry-item ${e.id === activeEntryId ? 'active' : ''} ${e.enabled ? '' : 'disabled'}" data-id="${e.id}">
        <input type="checkbox" class="entry-checkbox" ${e._selected ? 'checked' : ''} data-action="select" data-id="${e.id}">
        <span class="entry-status ${e.enabled ? '' : 'off'}"></span>
        <span class="entry-title">${esc(e.title)}</span>
      </div>
    `).join('');

    // Bind clicks
    container.querySelectorAll('.wb-entry-item').forEach(el => {
      el.addEventListener('click', (ev) => {
        if (ev.target.closest('.entry-checkbox')) return;
        activeEntryId = el.dataset.id;
        renderEntryList(); renderEditor();
      });
    });
    container.querySelectorAll('[data-action="select"]').forEach(el => {
      el.addEventListener('change', () => {
        const en = world.entries.find(e => e.id === el.dataset.id);
        if (en) en._selected = el.checked;
      });
    });
  }

  // Translation languages config
  const TRANSLATE_LANGS = [
    { key: 'english', label: '🇺🇸 English' },
    { key: 'chinese', label: '🇨🇳 中文' },
    { key: 'vietnamese', label: '🇻🇳 Tiếng Việt' },
    { key: 'japanese', label: '🇯🇵 日本語' },
    { key: 'korean', label: '🇰🇷 한국어' },
  ];

  function translateBarHtml(fieldId) {
    return `<div class="translate-bar" id="translate-bar-${fieldId}">
      <select class="translate-lang-select" id="translate-lang-${fieldId}">
        ${TRANSLATE_LANGS.map(l => `<option value="${l.key}">${l.label}</option>`).join('')}
      </select>
      <button class="pe-translate-go" id="translate-go-${fieldId}">${I18n.t('wb.translate')}</button>
      <button class="translate-settings-btn" id="translate-cfg-${fieldId}" title="${I18n.t('wb.translation_settings')}">⚙️</button>
    </div>`;
  }

  function renderEditor() {
    const editor = document.getElementById('wb-editor');
    if (!editor) return;
    const world = getActiveWorld();
    const entry = getActiveEntry();
    const POSITIONS = getPositions();

    if (!entry) {
      editor.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p>${I18n.t('wb.select_entry') || 'Select an entry to edit'}</p></div>`;
      return;
    }

    editor.innerHTML = `
      <div class="wb-editor-header">
        <h3>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span id="wb-editor-title-display">${esc(entry.title)}</span>
        </h3>
        <div class="editor-actions">
          <label class="toggle" style="margin-right:4px;" title="Enable/Disable"><input type="checkbox" ${entry.enabled ? 'checked' : ''} id="wb-editor-toggle-enable"><span class="toggle-slider"></span></label>
          <button class="btn btn-sm btn-danger" id="wb-editor-delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            ${I18n.t('btn.delete')}
          </button>
        </div>
      </div>
      <div class="wb-editor-scroll">
        <div class="wb-editor-fields">
          <div class="form-group"><label class="form-label">${I18n.t('wb.field.title')}</label><input class="form-input" value="${esc(entry.title)}" data-field="title" id="wb-f-title"></div>
          <div class="form-group"><label class="form-label">${I18n.t('wb.field.keywords')}</label><input class="form-input" value="${esc(entry.keywords)}" data-field="keywords" placeholder="Comma separated"></div>
          <div class="form-group"><label class="form-label">${I18n.t('wb.field.position')}</label><select class="form-select" data-field="position">${POSITIONS.map(p => `<option value="${p.value}" ${entry.position === p.value ? 'selected' : ''}>${p.label}</option>`).join('')}</select></div>
          <div class="form-group"><label class="form-label">${I18n.t('wb.field.logic')}</label><select class="form-select" data-field="logic"><option value="any" ${entry.logic === 'any' ? 'selected' : ''}>ANY (OR)</option><option value="and" ${entry.logic === 'and' ? 'selected' : ''}>AND</option></select></div>
          <div class="form-group"><label class="form-label">${I18n.t('wb.field.depth')}</label><input class="form-input" type="number" value="${entry.depth}" min="0" max="999" data-field="depth"></div>
          <div class="form-group"><label class="form-label">${I18n.t('wb.field.order')}</label><input class="form-input" type="number" value="${entry.order}" data-field="order"></div>
          <div class="form-group"><label class="form-label">${I18n.t('wb.field.trigger')}</label><input class="form-input" type="number" value="${entry.triggerPercent}" min="0" max="100" data-field="triggerPercent"></div>
          <div class="form-group"><label class="form-label">${I18n.t('wb.field.optional_filter')}</label><input class="form-input" value="${esc(entry.optionalFilter)}" data-field="optionalFilter"></div>
          <div class="form-group"><label class="form-label">${I18n.t('wb.field.inclusion_group')}</label><input class="form-input" value="${esc(entry.inclusionGroup)}" data-field="inclusionGroup"></div>
          <div class="form-group"><label class="form-label">${I18n.t('wb.field.group_weight')}</label><input class="form-input" type="number" value="${entry.groupWeight}" data-field="groupWeight"></div>
          <div class="form-group"><label class="form-label">${I18n.t('wb.field.sticky')}</label><input class="form-input" type="number" value="${entry.sticky}" min="0" data-field="sticky"></div>
          <div class="form-group"><label class="form-label">${I18n.t('wb.field.cooldown')}</label><input class="form-input" type="number" value="${entry.cooldown}" min="0" data-field="cooldown"></div>
        </div>
        <div class="wb-editor-content-wrap">
          <label class="form-label" style="display:flex;align-items:center;justify-content:space-between;">
            ${I18n.t('wb.field.content')}
            ${translateBarHtml('wb-f-content')}
          </label>
          <textarea class="form-textarea" data-field="content" id="wb-f-content" placeholder="${I18n.t('wb.field.content')}...">${esc(entry.content)}</textarea>
        </div>
        <div class="wb-editor-toggles">
          ${['caseSensitive', 'wholeWords', 'nonRecursable', 'preventRecursion', 'ignoreBudget', 'prioritize'].map(f => `<label><input type="checkbox" ${entry[f] ? 'checked' : ''} data-field="${f}" style="accent-color:var(--gold)"> ${I18n.t('wb.field.' + f.replace(/([A-Z])/g, '_$1').toLowerCase())}</label>`).join('')}
        </div>
      </div>`;

    // Bind field changes
    editor.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const isCb = el.type === 'checkbox', isNum = el.type === 'number';
      el.addEventListener(isCb ? 'change' : 'input', () => {
        if (isCb) entry[field] = el.checked;
        else if (isNum) entry[field] = parseInt(el.value) || 0;
        else entry[field] = el.value;
        save();
        // Update title in entry list and header
        if (field === 'title') {
          const titleDisplay = document.getElementById('wb-editor-title-display');
          if (titleDisplay) titleDisplay.textContent = el.value;
          const listItem = document.querySelector(`.wb-entry-item[data-id="${entry.id}"] .entry-title`);
          if (listItem) listItem.textContent = el.value;
        }
      });
    });

    // Toggle enable
    document.getElementById('wb-editor-toggle-enable')?.addEventListener('change', (e) => {
      entry.enabled = e.target.checked;
      save(); renderEntryList();
    });

    // Delete entry
    document.getElementById('wb-editor-delete')?.addEventListener('click', async () => {
      const ok = await App.confirm(I18n.t('wb.entry_delete_confirm', { name: entry.title }));
      if (!ok) return;
      world.entries = world.entries.filter(x => x.id !== entry.id);
      activeEntryId = null;
      save(); renderEntryList(); renderEditor();
    });

    // --- Content translate bar ---
    bindTranslateBar('wb-f-content');
  }

  function bindTranslateBar(fieldId) {
    const goBtn = document.getElementById(`translate-go-${fieldId}`);
    const cfgBtn = document.getElementById(`translate-cfg-${fieldId}`);
    const langSelect = document.getElementById(`translate-lang-${fieldId}`);

    goBtn?.addEventListener('click', () => {
      const lang = langSelect?.value || 'english';
      translateField(fieldId, lang);
    });

    cfgBtn?.addEventListener('click', () => openTranslateSettings());
  }

  async function translateField(fieldId, langKey) {
    const settings = Store.getSettings();
    if (!settings.apiKey) {
      App.toast(I18n.t('wb.translate_no_api'), 'warning');
      return;
    }

    const inputEl = document.getElementById(fieldId);
    if (!inputEl) return;
    const text = inputEl.value || inputEl.textContent;
    if (!text.trim()) return;

    const langName = I18n.t('wb.lang.' + langKey);
    const goBtn = document.getElementById(`translate-go-${fieldId}`);
    const origLabel = goBtn?.textContent;

    // Show loading state
    if (goBtn) { goBtn.disabled = true; goBtn.textContent = I18n.t('wb.translating'); }

    try {
      const prompt = (settings.translationPrompt || 'Translate the following text to {language}. Output ONLY the translated text.')
        .replace(/\{language\}/g, langName);

      const response = await fetch(settings.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: text },
          ],
          temperature: 0.3,
          max_tokens: 16384,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`HTTP ${response.status}: ${err.slice(0, 200)}`);
      }

      const data = await response.json();
      const translated = data.choices?.[0]?.message?.content?.trim();

      if (translated) {
        // Update the field
        if (inputEl.tagName === 'TEXTAREA') {
          inputEl.value = translated;
        } else {
          inputEl.value = translated;
        }
        // Trigger input event to persist
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));

        App.toast(I18n.t('wb.translate_done'));
      } else {
        throw new Error('Empty response');
      }
    } catch (err) {
      console.error('Translation error:', err);
      App.toast(I18n.t('wb.translate_error') + err.message, 'error');
    } finally {
      if (goBtn) { goBtn.disabled = false; goBtn.textContent = origLabel; }
    }
  }

  function openTranslateSettings() {
    const overlay = document.getElementById('wb-translate-settings-overlay');
    const input = document.getElementById('wb-translate-prompt-input');
    if (!overlay || !input) return;

    const settings = Store.getSettings();
    input.value = settings.translationPrompt || 'Translate the following text to {language}. Preserve all formatting, placeholders (like {{char}}, {{user}}), and special syntax. Output ONLY the translated text, nothing else.';

    overlay.classList.add('active');

    // Save
    const saveBtn = document.getElementById('wb-translate-settings-save');
    const cancelBtn = document.getElementById('wb-translate-settings-cancel');

    const onSave = () => {
      settings.translationPrompt = input.value;
      Store.saveSettings(settings);
      overlay.classList.remove('active');
      App.toast(I18n.t('pg.settings_saved'));
      cleanup();
    };
    const onCancel = () => {
      overlay.classList.remove('active');
      cleanup();
    };
    const onOverlay = (e) => {
      if (e.target === overlay) onCancel();
    };
    const cleanup = () => {
      saveBtn?.removeEventListener('click', onSave);
      cancelBtn?.removeEventListener('click', onCancel);
      overlay?.removeEventListener('click', onOverlay);
    };

    saveBtn?.addEventListener('click', onSave);
    cancelBtn?.addEventListener('click', onCancel);
    overlay?.addEventListener('click', onOverlay);
  }

  function esc(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }

  // Public API: import a character_book object from V2 Chara Spec
  function importFromCharaBook(charName, characterBook) {
    if (!characterBook || !characterBook.entries) return { count: 0, worldId: null };
    const entriesArray = Array.isArray(characterBook.entries) ? characterBook.entries : Object.values(characterBook.entries);
    if (entriesArray.length === 0) return { count: 0, worldId: null };

    const POSITION_MAP = { 0: 'before_char', 1: 'after_char', 2: 'before_an', 3: 'after_an', 4: 'at_depth' };

    const mappedEntries = entriesArray.map(e => ({
      ...createEntry(),
      id: Store.uuid(),
      title: e.comment || e.name || e.key?.[0] || 'Entry',
      keywords: Array.isArray(e.key) ? e.key.join(', ') : (e.keys || e.keyword || ''),
      optionalFilter: Array.isArray(e.secondary_keys) ? e.secondary_keys.join(', ') : (e.secondary_keys || ''),
      content: e.content || '',
      enabled: e.enabled !== undefined ? e.enabled : !e.disable,
      position: POSITION_MAP[e.position] || POSITION_MAP[e.extensions?.position] || 'before_char',
      depth: e.depth ?? e.extensions?.depth ?? 4,
      order: e.insertion_order ?? e.order ?? 100,
      caseSensitive: e.case_sensitive ?? false,
      selectiveLogic: e.selective_logic ?? 0,
      prioritize: e.extensions?.prioritize ?? false,
      inclusionGroup: e.extensions?.group || '',
      groupWeight: e.extensions?.group_weight ?? 100,
      sticky: e.extensions?.sticky ?? 0,
      cooldown: e.extensions?.cooldown ?? 0,
    }));

    const worldName = characterBook.name || `${charName} — Lorebook`;
    const w = { id: Store.uuid(), name: worldName, entries: mappedEntries, createdAt: Date.now() };
    worlds.push(w);
    activeWorldId = w.id;
    activeEntryId = null;
    save();
    renderWorldList();
    renderEntryList();
    renderEditor();
    return { count: mappedEntries.length, worldId: w.id };
  }

  // Public API: refresh UI from localStorage
  function refresh() {
    worlds = Store.getWorlds();
    activeWorldId = activeWorldId || worlds[0]?.id || null;
    renderWorldList();
    renderEntryList();
    renderEditor();
  }

  // Public API: programmatically select a world by id
  function selectWorld(worldId) {
    worlds = Store.getWorlds();
    const w = worlds.find(x => x.id === worldId);
    if (w) {
      activeWorldId = w.id;
      activeEntryId = null;
      renderWorldList();
      renderEntryList();
      renderEditor();
      switchSidebarTab('entries');
      return true;
    }
    return false;
  }

  return { init, importFromCharaBook, refresh, selectWorld, translateField, openTranslateSettings, TRANSLATE_LANGS };
})();
