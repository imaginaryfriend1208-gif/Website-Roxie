/* ============================================
   CHARACTER CARD — Upload, View, Edit (i18n)
   ============================================ */

const CharacterCard = (() => {
    let characters = [];
    let activeCharId = null;

    function init() {
        characters = Store.getCharacters();
        activeCharId = activeCharId || characters[0]?.id || null;
        bindEvents();
        renderGallery();
        renderDetail();
    }

    function bindEvents() {
        const on = (id, evt, fn) => { const el = document.getElementById(id); if (el) { el.removeEventListener(evt, el['_h_' + evt]); el['_h_' + evt] = fn; el.addEventListener(evt, fn); } };
        on('cc-upload-btn', 'click', () => document.getElementById('cc-file-input')?.click());
        on('cc-file-input', 'change', (e) => { handleFiles(e.target.files); e.target.value = ''; });
        const dz = document.getElementById('cc-dropzone');
        if (dz) {
            dz.onclick = () => document.getElementById('cc-file-input')?.click();
            dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('dragover'); };
            dz.ondragleave = () => dz.classList.remove('dragover');
            dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove('dragover'); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); };
        }
    }

    function getActive() { return characters.find(c => c.id === activeCharId); }
    function save() { Store.saveCharacters(characters); }

    async function handleFiles(files) {
        for (const file of files) {
            try {
                if (file.type === 'image/png') {
                    const charData = await extractPngCharaData(file);
                    const imageData = await fileToDataURL(file);
                    const g = (k) => charData[k] || charData.data?.[k] || '';
                    const char = { id: Store.uuid(), avatar: imageData, name: g('name') || 'Unknown', description: g('description'), first_mes: g('first_mes'), personality: g('personality'), scenario: g('scenario'), mes_example: g('mes_example'), system_prompt: g('system_prompt'), creator_notes: g('creator_notes'), tags: charData.tags || charData.data?.tags || [], creator: g('creator'), character_version: g('character_version'), createdAt: Date.now(), _raw: charData };
                    characters.push(char); activeCharId = char.id;
                    App.toast(I18n.t('cc.imported', { name: char.name }));
                    // Auto-import embedded lorebook
                    const book = charData.character_book || charData.data?.character_book;
                    if (book) {
                        const result = Worldbook.importFromCharaBook(char.name, book);
                        if (result.count > 0) {
                            char._lorebookWorldId = result.worldId;
                            App.toast(I18n.t('cc.lorebook_imported', { name: char.name, count: result.count }));
                        }
                    }
                } else if (file.type === 'application/json') {
                    const data = await Store.importJSON(file);
                    const g = (k) => data[k] || data.data?.[k] || '';
                    const char = { id: Store.uuid(), avatar: data.avatar || '', name: g('name') || 'Unknown', description: g('description'), first_mes: g('first_mes'), personality: g('personality'), scenario: g('scenario'), mes_example: g('mes_example'), system_prompt: g('system_prompt'), creator_notes: g('creator_notes'), tags: data.tags || data.data?.tags || [], creator: g('creator'), character_version: g('character_version'), createdAt: Date.now(), _raw: data };
                    characters.push(char); activeCharId = char.id;
                    App.toast(I18n.t('cc.imported', { name: char.name }));
                    // Auto-import embedded lorebook
                    const book = data.character_book || data.data?.character_book;
                    if (book) {
                        const result = Worldbook.importFromCharaBook(char.name, book);
                        if (result.count > 0) {
                            char._lorebookWorldId = result.worldId;
                            App.toast(I18n.t('cc.lorebook_imported', { name: char.name, count: result.count }));
                        }
                    }
                } else {
                    const imageData = await fileToDataURL(file);
                    const char = { id: Store.uuid(), avatar: imageData, name: file.name.replace(/\.[^.]+$/, ''), description: '', first_mes: '', personality: '', scenario: '', mes_example: '', system_prompt: '', creator_notes: '', tags: [], creator: '', character_version: '', createdAt: Date.now() };
                    characters.push(char); activeCharId = char.id;
                    App.toast(I18n.t('cc.added_image'));
                }
            } catch (err) { console.error(err); App.toast(I18n.t('cc.import_failed') + err.message, 'error'); }
        }
        save(); renderGallery(); renderDetail();
    }

    async function extractPngCharaData(file) {
        const buffer = await file.arrayBuffer();
        const view = new DataView(buffer);
        let offset = 8;
        while (offset < buffer.byteLength) {
            const length = view.getUint32(offset);
            const type = String.fromCharCode(view.getUint8(offset + 4), view.getUint8(offset + 5), view.getUint8(offset + 6), view.getUint8(offset + 7));
            if (type === 'tEXt') {
                const textData = new Uint8Array(buffer, offset + 8, length);
                let nullPos = 0;
                for (let i = 0; i < textData.length; i++) { if (textData[i] === 0) { nullPos = i; break; } }
                const keyword = new TextDecoder().decode(textData.slice(0, nullPos));
                if (keyword === 'chara') {
                    const base64Str = new TextDecoder('ascii').decode(textData.slice(nullPos + 1));
                    const binaryStr = atob(base64Str);
                    const bytes = new Uint8Array(binaryStr.length);
                    for (let i = 0; i < binaryStr.length; i++) {
                        bytes[i] = binaryStr.charCodeAt(i);
                    }
                    const jsonStr = new TextDecoder('utf-8').decode(bytes);
                    return JSON.parse(jsonStr);
                }
            }
            offset += 12 + length;
        }
        throw new Error(I18n.t('cc.no_chara_data'));
    }

    function fileToDataURL(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }

    function renderGallery() {
        const grid = document.getElementById('cc-gallery-grid');
        if (!grid) return;
        if (characters.length === 0) {
            grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg><p>${I18n.t('cc.no_chars')}</p></div>`;
            return;
        }
        grid.innerHTML = characters.map(c => `
      <div class="char-card-thumb ${c.id === activeCharId ? 'active' : ''}" data-id="${c.id}">
        ${c.avatar ? `<img src="${c.avatar}" alt="${esc(c.name)}">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:2rem;">${(c.name || '?')[0]}</div>`}
        <div class="char-name">${esc(c.name)}</div>
      </div>
    `).join('');
        grid.querySelectorAll('.char-card-thumb').forEach(el => {
            el.addEventListener('click', () => { activeCharId = el.dataset.id; renderGallery(); renderDetail(); });
        });
    }

    function renderDetail() {
        const detail = document.getElementById('cc-detail');
        if (!detail) return;
        const char = getActive();
        if (!char) { detail.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg><p>${I18n.t('cc.empty_hint')}</p></div>`; return; }
        const charHasBook = !!(char._raw?.character_book || char._raw?.data?.character_book);

        const fields = [
            { key: 'description', label: I18n.t('cc.field.description'), type: 'textarea' },
            { key: 'personality', label: I18n.t('cc.field.personality'), type: 'textarea' },
            { key: 'first_mes', label: I18n.t('cc.field.first_mes'), type: 'textarea' },
            { key: 'scenario', label: I18n.t('cc.field.scenario'), type: 'textarea' },
            { key: 'mes_example', label: I18n.t('cc.field.mes_example'), type: 'textarea' },
            { key: 'system_prompt', label: I18n.t('cc.field.system_prompt'), type: 'textarea' },
            { key: 'creator_notes', label: I18n.t('cc.field.creator_notes'), type: 'textarea' },
            { key: 'creator', label: I18n.t('cc.field.creator'), type: 'input' },
            { key: 'character_version', label: I18n.t('cc.field.version'), type: 'input' },
        ];

        detail.innerHTML = `
      <div class="char-detail-header">
        <div class="char-detail-avatar">${char.avatar ? `<img src="${char.avatar}">` : ''}</div>
        <div class="char-detail-info">
          <input class="form-input" value="${esc(char.name)}" data-field="name" style="font-size:1.3rem;font-weight:600;color:var(--text-gold);background:transparent;border:1px solid transparent;" placeholder="Character name">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">${(char.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          ${char._lorebookWorldId ? `<button class="btn btn-sm" id="cc-goto-lorebook" style="margin-top:8px;background:rgba(201,168,76,0.15);border:1px solid var(--gold);color:var(--text-gold);display:inline-flex;align-items:center;gap:6px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> 📖 Lorebook</button>` : (charHasBook ? `<button class="btn btn-sm" id="cc-import-lorebook" style="margin-top:8px;background:rgba(201,168,76,0.08);border:1px dashed var(--gold);color:var(--text-secondary);display:inline-flex;align-items:center;gap:6px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Import Lorebook</button>` : '')}
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button class="btn btn-sm" id="cc-export"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> ${I18n.t('btn.export')}</button>
            <button class="btn btn-sm btn-danger" id="cc-delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg> ${I18n.t('btn.delete')}</button>
          </div>
          <div class="cc-translate-bar">
            <span class="translate-label">${I18n.t('wb.translate')}</span>
            <select class="translate-lang-select" id="cc-translate-lang">
              ${Worldbook.TRANSLATE_LANGS.map(l => `<option value="${l.key}">${l.label}</option>`).join('')}
            </select>
            <button class="pe-translate-go" id="cc-translate-all">${I18n.t('wb.translate')}</button>
            <button class="translate-settings-btn" id="cc-translate-cfg" title="${I18n.t('wb.translation_settings')}">⚙️</button>
          </div>
        </div>
      </div>
      <div class="char-fields">
        ${fields.map(f => `<div class="form-group"><label class="form-label">${f.label}</label>${f.type === 'textarea' ? `<textarea class="form-textarea" data-field="${f.key}" rows="4" placeholder="${f.label}...">${esc(char[f.key] || '')}</textarea>` : `<input class="form-input" data-field="${f.key}" value="${esc(char[f.key] || '')}" placeholder="${f.label}">`}</div>`).join('')}
      </div>`;

        detail.querySelectorAll('[data-field]').forEach(el => {
            el.addEventListener('input', () => { char[el.dataset.field] = el.value; if (el.dataset.field === 'name') renderGallery(); save(); });
        });

        document.getElementById('cc-delete')?.addEventListener('click', async () => {
            const ok = await App.confirm(I18n.t('cc.delete_confirm', { name: char.name }));
            if (!ok) return;
            characters = characters.filter(c => c.id !== char.id);
            activeCharId = characters[0]?.id || null;
            save(); renderGallery(); renderDetail();
        });
        document.getElementById('cc-export')?.addEventListener('click', () => {
            const d = { ...char }; delete d.id;
            Store.exportJSON(d, `${char.name.replace(/\s+/g, '_')}_card.json`);
            App.toast(I18n.t('cc.exported'));
        });
        // Lorebook badge: go to linked world
        document.getElementById('cc-goto-lorebook')?.addEventListener('click', () => {
            const worldExists = Worldbook.selectWorld(char._lorebookWorldId);
            if (worldExists === false) {
                // World was lost (e.g. deleted or data not saved properly)
                App.toast('⚠️ Lorebook world not found — please re-import', 'warning');
                char._lorebookWorldId = null;
                save();
                renderDetail();
                return;
            }
            App.switchTab('worldbook');
        });
        // Lorebook badge: import from raw data (for cards not yet imported)
        document.getElementById('cc-import-lorebook')?.addEventListener('click', () => {
            const book = char._raw?.character_book || char._raw?.data?.character_book;
            if (!book) return;
            const result = Worldbook.importFromCharaBook(char.name, book);
            if (result.count > 0) {
                char._lorebookWorldId = result.worldId;
                save();
                App.toast(I18n.t('cc.lorebook_imported', { name: char.name, count: result.count }));
                renderDetail();
            }
        });
        // Translate All: translate all text fields
        document.getElementById('cc-translate-all')?.addEventListener('click', async () => {
            const langSelect = document.getElementById('cc-translate-lang');
            const goBtn = document.getElementById('cc-translate-all');
            const lang = langSelect?.value || 'english';
            const settings = Store.getSettings();
            if (!settings.apiKey) {
                App.toast(I18n.t('wb.translate_no_api'), 'warning');
                return;
            }
            const textFields = detail.querySelectorAll('textarea[data-field]');
            const toTranslate = Array.from(textFields).filter(el => el.value.trim());
            if (toTranslate.length === 0) return;

            const origLabel = goBtn.textContent;
            goBtn.disabled = true;

            const langName = I18n.t('wb.lang.' + lang);
            const prompt = (settings.translationPrompt || 'Translate the following text to {language}. Output ONLY the translated text.')
                .replace(/\{language\}/g, langName);

            let translated = 0;
            for (let i = 0; i < toTranslate.length; i++) {
                const el = toTranslate[i];
                const fieldName = el.dataset.field || '';
                goBtn.textContent = `⏳ ${i + 1}/${toTranslate.length} ${fieldName}...`;
                try {
                    const response = await fetch(settings.apiEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.apiKey}` },
                        body: JSON.stringify({
                            model: settings.model || 'gpt-4o-mini',
                            messages: [{ role: 'system', content: prompt }, { role: 'user', content: el.value }],
                            temperature: 0.3,
                            max_tokens: 16384,
                        }),
                    });
                    if (!response.ok) {
                        const errText = await response.text();
                        console.error(`Translate ${fieldName} failed:`, response.status, errText.slice(0, 200));
                        App.toast(`⚠️ ${fieldName}: HTTP ${response.status}`, 'warning');
                        continue;
                    }
                    const data = await response.json();
                    const result = data.choices?.[0]?.message?.content?.trim();
                    if (result) {
                        el.value = result;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        translated++;
                    }
                } catch (e) {
                    console.error('Translate field error:', e);
                    App.toast(`❌ ${fieldName}: ${e.message}`, 'error');
                }
            }

            goBtn.disabled = false;
            goBtn.textContent = origLabel;
            if (translated > 0) App.toast(`${I18n.t('wb.translate_done')} (${translated}/${toTranslate.length})`);
        });
        // Translation settings
        document.getElementById('cc-translate-cfg')?.addEventListener('click', () => {
            Worldbook.openTranslateSettings();
        });
    }

    function esc(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }

    return { init };
})();
