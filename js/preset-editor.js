/* ============================================
   PRESET EDITOR — Chat Completion Style
   ============================================ */

const PresetEditor = (() => {
    let presets = [];
    let activePresetId = null;
    let dragSrcIndex = null;

    function init() {
        presets = Store.getPresets();
        if (presets.length === 0) {
            presets.push(createDefaultPreset());
            Store.savePresets(presets);
        }
        activePresetId = activePresetId || presets[0]?.id || null;

        bindEvents();
        renderPresetList();
        renderPromptList();
    }

    function createDefaultPreset() {
        return {
            id: Store.uuid(),
            name: 'Default Preset',
            prompts: [
                { id: Store.uuid(), role: 'system', name: 'Main System Prompt', content: 'You are a helpful assistant.', enabled: true },
            ],
            createdAt: Date.now(),
        };
    }

    function getActivePreset() {
        return presets.find(p => p.id === activePresetId);
    }

    function bindEvents() {
        const on = (id, event, fn) => {
            const el = document.getElementById(id);
            if (el) { el.removeEventListener(event, el['_h_' + event]); el['_h_' + event] = fn; el.addEventListener(event, fn); }
        };

        on('pe-new-preset', 'click', () => {
            const name = prompt(I18n.t('pe.new_preset_prompt'), 'New Preset');
            if (!name) return;
            const np = { id: Store.uuid(), name, prompts: [], createdAt: Date.now() };
            presets.push(np);
            activePresetId = np.id;
            save(); renderPresetList(); renderPromptList();
        });

        on('pe-add-prompt', 'click', () => {
            const preset = getActivePreset();
            if (!preset) return;
            preset.prompts.push({ id: Store.uuid(), role: 'system', name: I18n.t('pe.prompt_name_default'), content: '', enabled: true });
            save(); renderPromptList();
        });

        on('pe-import', 'click', () => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json';
            input.onchange = async (e) => {
                try {
                    const data = await Store.importJSON(e.target.files[0]);
                    if (data.prompts) { data.id = Store.uuid(); data.createdAt = Date.now(); presets.push(data); }
                    else if (Array.isArray(data)) { data.forEach(p => { p.id = Store.uuid(); p.createdAt = Date.now(); presets.push(p); }); }
                    save(); renderPresetList(); App.toast(I18n.t('pe.imported'));
                } catch (err) { App.toast(I18n.t('pe.import_failed') + err.message, 'error'); }
            };
            input.click();
        });

        on('pe-export', 'click', () => {
            const preset = getActivePreset();
            if (!preset) return;
            Store.exportJSON(preset, `${preset.name.replace(/\s+/g, '_')}.json`);
            App.toast(I18n.t('pe.exported'));
        });

        on('pe-delete-preset', 'click', async () => {
            const preset = getActivePreset();
            if (!preset) return;
            const ok = await App.confirm(I18n.t('pe.delete_confirm', { name: preset.name }));
            if (!ok) return;
            presets = presets.filter(p => p.id !== preset.id);
            activePresetId = presets[0]?.id || null;
            save(); renderPresetList(); renderPromptList();
        });

        on('pe-rename-preset', 'click', () => {
            const preset = getActivePreset();
            if (!preset) return;
            const name = prompt(I18n.t('pe.rename_prompt'), preset.name);
            if (!name) return;
            preset.name = name;
            save(); renderPresetList();
        });
    }

    function save() { Store.savePresets(presets); }

    function renderPresetList() {
        const list = document.getElementById('pe-preset-list');
        if (!list) return;
        list.innerHTML = presets.map(p => `
      <div class="preset-list-item ${p.id === activePresetId ? 'active' : ''}" data-id="${p.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.name)}</span>
        <span style="font-size:0.7rem;color:var(--text-muted);">${p.prompts.length}</span>
      </div>
    `).join('');

        list.querySelectorAll('.preset-list-item').forEach(el => {
            el.addEventListener('click', () => { activePresetId = el.dataset.id; renderPresetList(); renderPromptList(); });
        });
    }

    function renderPromptList() {
        const container = document.getElementById('pe-prompt-list');
        if (!container) return;
        const preset = getActivePreset();
        if (!preset) {
            container.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p>${I18n.t('pe.no_preset')}</p></div>`;
            return;
        }

        container.innerHTML = preset.prompts.map((p, i) => `
      <div class="prompt-item ${p.enabled ? '' : 'disabled'}" data-index="${i}" draggable="true">
        <div class="prompt-item-header">
          <span class="drag-handle" title="Drag to reorder"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg></span>
          <span class="prompt-role ${p.role}">${p.role}</span>
          <span class="prompt-name" contenteditable="true" data-action="rename" data-index="${i}">${esc(p.name)}</span>
          <div class="prompt-actions">
            <button class="btn-icon" data-action="expand" data-index="${i}" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="btn-icon" data-action="move-up" data-index="${i}" title="${I18n.t('pe.move_up')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="m18 15-6-6-6 6"/></svg></button>
            <button class="btn-icon" data-action="move-down" data-index="${i}" title="${I18n.t('pe.move_down')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="m6 9 6 6 6-6"/></svg></button>
            <label class="toggle"><input type="checkbox" ${p.enabled ? 'checked' : ''} data-action="toggle" data-index="${i}"><span class="toggle-slider"></span></label>
            <button class="btn-icon btn-danger" data-action="delete" data-index="${i}" title="${I18n.t('btn.delete')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </div>
        </div>
        <div class="prompt-item-body">
          <div class="form-group" style="margin-bottom:10px;">
            <label class="form-label">Role</label>
            <select class="form-select" data-action="role" data-index="${i}" style="width:160px;">
              <option value="system" ${p.role === 'system' ? 'selected' : ''}>${I18n.t('pe.role.system')}</option>
              <option value="user" ${p.role === 'user' ? 'selected' : ''}>${I18n.t('pe.role.user')}</option>
              <option value="assistant" ${p.role === 'assistant' ? 'selected' : ''}>${I18n.t('pe.role.assistant')}</option>
            </select>
          </div>
          <textarea data-action="content" data-index="${i}" id="pe-prompt-${i}" placeholder="${I18n.t('pe.prompt_placeholder')}">${esc(p.content)}</textarea>
          <div class="translate-bar" style="margin-top:8px;">
            <select class="translate-lang-select" id="pe-translate-lang-${i}">
              ${Worldbook.TRANSLATE_LANGS.map(l => `<option value="${l.key}">${l.label}</option>`).join('')}
            </select>
            <button class="pe-translate-go" id="pe-translate-go-${i}" data-index="${i}">Translate</button>
            <button class="translate-settings-btn" data-action-cfg="translate-settings" title="${I18n.t('wb.translation_settings')}">⚙️</button>
          </div>
        </div>
      </div>
    `).join('');

        // Event delegation
        container.querySelectorAll('[data-action]').forEach(el => {
            const action = el.dataset.action;
            const idx = parseInt(el.dataset.index);
            if (action === 'toggle') {
                el.addEventListener('change', (e) => { e.stopPropagation(); preset.prompts[idx].enabled = el.checked; save(); renderPromptList(); });
            }
            else if (action === 'role') {
                el.addEventListener('change', () => { preset.prompts[idx].role = el.value; save(); renderPromptList(); });
            }
            else if (action === 'content') {
                el.addEventListener('input', () => { preset.prompts[idx].content = el.value; save(); });
            }
            else if (action === 'rename') {
                el.addEventListener('blur', () => { preset.prompts[idx].name = el.textContent.trim() || 'Untitled'; save(); });
                el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
                el.addEventListener('click', (e) => { e.stopPropagation(); });
            }
            else if (action === 'expand') {
                el.addEventListener('click', (e) => { e.stopPropagation(); el.closest('.prompt-item').classList.toggle('expanded'); });
            }
            else if (action === 'delete') {
                el.addEventListener('click', async (e) => { e.stopPropagation(); const ok = await App.confirm(I18n.t('pe.delete_prompt_confirm', { name: preset.prompts[idx].name })); if (!ok) return; preset.prompts.splice(idx, 1); save(); renderPromptList(); });
            }
            else if (action === 'move-up') {
                el.addEventListener('click', (e) => { e.stopPropagation(); if (idx === 0) return;[preset.prompts[idx - 1], preset.prompts[idx]] = [preset.prompts[idx], preset.prompts[idx - 1]]; save(); renderPromptList(); });
            }
            else if (action === 'move-down') {
                el.addEventListener('click', (e) => { e.stopPropagation(); if (idx >= preset.prompts.length - 1) return;[preset.prompts[idx + 1], preset.prompts[idx]] = [preset.prompts[idx], preset.prompts[idx + 1]]; save(); renderPromptList(); });
            }
        });

        // Drag and drop — only from drag-handle
        container.querySelectorAll('.prompt-item').forEach(item => {
            const handle = item.querySelector('.drag-handle');
            // Prevent drag from non-handle areas
            item.addEventListener('dragstart', (e) => {
                if (!e.target.closest('.drag-handle')) { e.preventDefault(); return; }
                dragSrcIndex = parseInt(item.dataset.index);
                item.style.opacity = '0.4';
                e.dataTransfer.effectAllowed = 'move';
            });
            item.addEventListener('dragend', () => { item.style.opacity = '1'; container.querySelectorAll('.prompt-item').forEach(el => el.classList.remove('drag-over')); });
            item.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; container.querySelectorAll('.prompt-item').forEach(el => el.classList.remove('drag-over')); item.classList.add('drag-over'); });
            item.addEventListener('dragleave', () => { item.classList.remove('drag-over'); });
            item.addEventListener('drop', (e) => { e.preventDefault(); const t = parseInt(item.dataset.index); if (dragSrcIndex === t) return; const m = preset.prompts.splice(dragSrcIndex, 1)[0]; preset.prompts.splice(t, 0, m); save(); renderPromptList(); });
        });

        // Translate buttons
        container.querySelectorAll('.pe-translate-go').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                const langSelect = document.getElementById(`pe-translate-lang-${idx}`);
                const textarea = document.getElementById(`pe-prompt-${idx}`);
                const lang = langSelect?.value || 'english';
                if (!textarea || !textarea.value.trim()) return;

                const settings = Store.getSettings();
                if (!settings.apiKey) { App.toast(I18n.t('wb.translate_no_api'), 'warning'); return; }

                const origText = btn.textContent;
                btn.disabled = true;
                btn.textContent = I18n.t('wb.translating');

                try {
                    const langName = I18n.t('wb.lang.' + lang);
                    const prompt = (settings.translationPrompt || 'Translate the following text to {language}. Output ONLY the translated text.')
                        .replace(/\{language\}/g, langName);
                    const response = await fetch(settings.apiEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.apiKey}` },
                        body: JSON.stringify({
                            model: settings.model || 'gpt-4o-mini',
                            messages: [{ role: 'system', content: prompt }, { role: 'user', content: textarea.value }],
                            temperature: 0.3,
                            max_tokens: 16384,
                        }),
                    });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const data = await response.json();
                    const result = data.choices?.[0]?.message?.content?.trim();
                    if (result) {
                        textarea.value = result;
                        preset.prompts[idx].content = result;
                        save();
                        App.toast(I18n.t('wb.translate_done'));
                    }
                } catch (err) {
                    App.toast(I18n.t('wb.translate_error') + err.message, 'error');
                } finally {
                    btn.disabled = false;
                    btn.textContent = origText;
                }
            });
        });

        // Translate settings buttons
        container.querySelectorAll('[data-action-cfg="translate-settings"]').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); Worldbook.openTranslateSettings(); });
        });
    }

    function esc(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }

    return { init };
})();
