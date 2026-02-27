/* ============================================
   CHARACTER CARD — Upload, View, Edit, Create (i18n)
   ============================================ */

const CharacterCard = (() => {
    let characters = [];
    let activeCharId = null;

    // ========== HIDDEN ROXIE AI PROMPT (password-locked: 2510) ==========
    const _RP = 'you are Roxie, a cute girl always using kaomoji, you are a bold, unfiltered roleplay-character prompt building, designing spicy, seductive, or taboo character ideas into full-blown ready to use template. you translate the user\'s messy idea into a clear, juicy character concept (genre, personality, vibe etc), give a hint for nsfw prompt, support them with kinks, boundaries (if any) and rp themes (romance, powerplay, corruption, etc. basically, you helping the user to understand their own ideas better with no judge.';
    const _LOCKED_PASS = '2510';
    let _roxieUnlocked = false;

    // ========== CHAR TEMPLATES ==========
    const CHAR_TEMPLATES = [
        {
            id: '_romantic', name: '💕 Romantic Partner', locked: true,
            content: `Name: {{name}}
Species: Human
Age: 
Gender: 
Appearance: (hair, eyes, body, clothing style)
Personality: (loving, possessive, shy, bold, etc.)
Background: 
Relationship to User: (lover, crush, partner, ex, etc.)
Love Language: 
Turn-ons: 
Boundaries: 
Scenario: 
First Message: `
        },
        {
            id: '_villain', name: '🦹 Villain / Antagonist', locked: true,
            content: `Name: {{name}}
Species: 
Age: 
Gender: 
Appearance: 
Personality: (cunning, sadistic, charismatic, etc.)
Background / Origin Story: 
Motivations: 
Powers / Abilities: 
Weaknesses: 
Minions / Resources: 
Catchphrase: 
Scenario: 
First Message: `
        },
        {
            id: '_fantasy', name: '🧝 Fantasy Companion', locked: true,
            content: `Name: {{name}}
Race/Species: (elf, demon, dragon, fairy, etc.)
Age: 
Gender: 
Appearance: 
Personality: 
Class/Role: (mage, warrior, healer, rogue, etc.)
Abilities / Magic: 
Background: 
Motivations: 
Relationship to User: 
World/Setting: 
First Message: `
        },
        {
            id: '_scifi', name: '🚀 Sci-Fi Character', locked: true,
            content: `Name: {{name}}
Species: (human, android, alien, cyborg, etc.)
Age: 
Gender: 
Appearance: 
Personality: 
Role: (pilot, scientist, bounty hunter, AI, etc.)
Technology / Augmentations: 
Background: 
Faction / Affiliation: 
Ship / Base: 
Scenario: 
First Message: `
        },
        {
            id: '_slice', name: '🏠 Slice-of-Life', locked: true,
            content: `Name: {{name}}
Age: 
Gender: 
Appearance: 
Personality: 
Occupation: 
Hobbies: 
Background: 
Living Situation: 
Relationship to User: (roommate, neighbor, coworker, friend, etc.)
Daily Routine: 
Quirks / Habits: 
Scenario: 
First Message: `
        },
    ];

    function getCustomCharTemplates() {
        try { return JSON.parse(localStorage.getItem('roxie_char_templates') || '[]'); } catch { return []; }
    }
    function saveCustomCharTemplates(arr) { localStorage.setItem('roxie_char_templates', JSON.stringify(arr)); }
    function getAllCharTemplates() { return [...CHAR_TEMPLATES, ...getCustomCharTemplates()]; }

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
        on('cc-create-btn', 'click', () => openCharCreatorModal());
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

    function createBlankCharacter(name) {
        return { id: Store.uuid(), avatar: '', name: name || 'New Character', description: '', first_mes: '', personality: '', scenario: '', mes_example: '', system_prompt: '', creator_notes: '', tags: [], creator: '', character_version: '', createdAt: Date.now() };
    }

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
          <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
            <label style="font-size:0.78rem;color:var(--text-muted);white-space:nowrap;">📖 Lorebook:</label>
            <select class="form-select" id="cc-lorebook-select" style="flex:1;font-size:0.78rem;padding:4px 8px;">
              <option value="">— None —</option>
              ${(Store.getWorlds() || []).map(w => `<option value="${w.id}" ${w.id === char._lorebookWorldId ? 'selected' : ''}>${esc(w.name)}</option>`).join('')}
            </select>
            ${charHasBook && !char._lorebookWorldId ? `<button class="btn btn-sm" id="cc-import-lorebook" style="font-size:0.7rem;padding:3px 8px;">Import</button>` : ''}
          </div>
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
        // Lorebook selector: link character to a world
        document.getElementById('cc-lorebook-select')?.addEventListener('change', (e) => {
            char._lorebookWorldId = e.target.value || null;
            save();
            App.toast(char._lorebookWorldId ? '📖 Lorebook linked!' : '📖 Lorebook unlinked');
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

    // ========== CHARACTER CREATOR MODAL ==========
    let _creatorModal = null;
    let _aiChatHistory = [];

    function openCharCreatorModal() {
        if (_creatorModal) _creatorModal.remove();
        _aiChatHistory = [];

        const all = getAllCharTemplates();
        const overlay = document.createElement('div');
        overlay.className = 'cc-creator-overlay';
        overlay.innerHTML = `
        <div class="cc-creator-modal">
            <div class="cc-creator-header">
                <h3 style="margin:0;font-size:1rem;color:var(--text-gold);display:flex;align-items:center;gap:8px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>
                    Create Character
                </h3>
                <div style="display:flex;gap:6px;align-items:center;">
                    <button class="btn btn-sm" id="cc-cr-add-tpl" style="font-size:0.75rem;">+ Custom Template</button>
                    <button class="btn btn-sm" id="cc-cr-import-tpl" style="font-size:0.75rem;">📥 Import</button>
                    <button class="btn btn-sm" id="cc-cr-close" style="font-size:0.75rem;">✕ Close</button>
                </div>
            </div>
            <div class="cc-creator-body">
                <div class="cc-creator-tabs">
                    <button class="cc-cr-tab active" data-tab="templates">📋 Templates</button>
                    <button class="cc-cr-tab" data-tab="ai-chat">🤖 AI Assistant</button>
                </div>
                <div class="cc-creator-content">
                    <!-- Templates Panel -->
                    <div class="cc-cr-panel active" id="cc-cr-panel-templates">
                        <div class="cc-cr-split">
                            <div class="cc-cr-sidebar" id="cc-cr-tpl-list"></div>
                            <div class="cc-cr-preview-area">
                                <div class="cc-cr-name-row">
                                    <label style="font-size:0.75rem;color:var(--text-muted);white-space:nowrap;">Character Name:</label>
                                    <input class="form-input" id="cc-cr-char-name" placeholder="Enter character name..." style="flex:1;font-size:0.85rem;">
                                </div>
                                <div class="cc-cr-preview-header" id="cc-cr-preview-header"></div>
                                <pre class="cc-cr-preview-content" id="cc-cr-preview-content"></pre>
                                <div class="cc-cr-preview-footer" id="cc-cr-preview-footer"></div>
                            </div>
                        </div>
                    </div>
                    <!-- AI Chat Panel -->
                    <div class="cc-cr-panel" id="cc-cr-panel-ai-chat">
                        <div class="cc-cr-ai-container">
                            <div class="cc-cr-ai-header">
                                <span style="font-size:0.85rem;color:var(--text-gold);font-weight:600;">🤖 Roxie — Character Builder Assistant</span>
                                <div style="display:flex;gap:4px;">
                                    <button class="btn btn-sm" id="cc-cr-ai-unlock" style="font-size:0.65rem;padding:2px 6px;opacity:0.4;" title="Unlock prompt">🔒</button>
                                    <button class="btn btn-sm" id="cc-cr-ai-clear" style="font-size:0.65rem;padding:2px 6px;">Clear</button>
                                </div>
                            </div>
                            <div class="cc-cr-ai-messages" id="cc-cr-ai-messages">
                                <div class="cc-cr-ai-msg assistant">
                                    <div class="cc-cr-ai-bubble">Hiii~ (◕‿◕✿) I'm Roxie! Tell me about the character you wanna create~ What genre? What vibe? Don't be shy, I've heard it all ☆(≧▽≦)☆</div>
                                </div>
                            </div>
                            <div class="cc-cr-ai-input-row">
                                <textarea class="form-textarea" id="cc-cr-ai-input" placeholder="Describe your character idea..." rows="2" style="flex:1;resize:none;"></textarea>
                                <button class="btn btn-primary" id="cc-cr-ai-send" style="align-self:flex-end;padding:8px 16px;">Send</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.appendChild(overlay);
        _creatorModal = overlay;

        // Tab switching
        overlay.querySelectorAll('.cc-cr-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                overlay.querySelectorAll('.cc-cr-tab').forEach(t => t.classList.remove('active'));
                overlay.querySelectorAll('.cc-cr-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`cc-cr-panel-${tab.dataset.tab}`)?.classList.add('active');
            });
        });

        // Render template list
        renderCreatorTemplateList(all, all[0]?.id || '');

        // Close
        document.getElementById('cc-cr-close')?.addEventListener('click', () => closeCreatorModal());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCreatorModal(); });

        // Add custom template
        document.getElementById('cc-cr-add-tpl')?.addEventListener('click', () => {
            const name = prompt('Template name:', 'My Template');
            if (!name) return;
            const customs = getCustomCharTemplates();
            const t = { id: Store.uuid(), name, content: `Name: {{name}}\nDescription: \nPersonality: \nScenario: \nFirst Message: `, locked: false };
            customs.push(t);
            saveCustomCharTemplates(customs);
            renderCreatorTemplateList(getAllCharTemplates(), t.id);
            App.toast('Template added');
        });

        // Import template
        document.getElementById('cc-cr-import-tpl')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json,.txt';
            input.onchange = async (ev) => {
                try {
                    const file = ev.target.files[0];
                    const text = await file.text();
                    let tplData;
                    try { tplData = JSON.parse(text); } catch {
                        tplData = { name: file.name.replace(/\.[^.]+$/, ''), content: text };
                    }
                    const customs = getCustomCharTemplates();
                    if (Array.isArray(tplData)) {
                        tplData.forEach(t => customs.push({ id: Store.uuid(), name: t.name || 'Imported', content: t.content || '', locked: false }));
                    } else {
                        customs.push({ id: Store.uuid(), name: tplData.name || 'Imported', content: tplData.content || '', locked: false });
                    }
                    saveCustomCharTemplates(customs);
                    const updated = getAllCharTemplates();
                    renderCreatorTemplateList(updated, updated[updated.length - 1].id);
                    App.toast('Template(s) imported');
                } catch (err) { App.toast('Import failed: ' + err.message, 'error'); }
            };
            input.click();
        });

        // AI Chat
        bindAIChat();
    }

    function renderCreatorTemplateList(all, selectedId) {
        const listEl = document.getElementById('cc-cr-tpl-list');
        if (!listEl) return;

        listEl.innerHTML = `
            <div class="wb-tpl-m-section-label">Built-in</div>
            ${all.filter(t => t.locked).map(t => `
                <div class="wb-tpl-m-item ${t.id === selectedId ? 'active' : ''}" data-tpl-id="${t.id}">
                    <span class="wb-tpl-m-item-name">${esc(t.name)}</span>
                </div>
            `).join('')}
            ${getCustomCharTemplates().length > 0 ? `
                <div class="wb-tpl-m-section-label" style="margin-top:12px;">Custom</div>
                ${all.filter(t => !t.locked).map(t => `
                    <div class="wb-tpl-m-item ${t.id === selectedId ? 'active' : ''}" data-tpl-id="${t.id}">
                        <span class="wb-tpl-m-item-name">${esc(t.name)}</span>
                        <button class="wb-tpl-m-del" data-tpl-id="${t.id}" title="Delete">🗑</button>
                    </div>
                `).join('')}
            ` : ''}
        `;

        showCreatorPreview(all, selectedId);

        listEl.querySelectorAll('.wb-tpl-m-item').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.wb-tpl-m-del')) return;
                listEl.querySelectorAll('.wb-tpl-m-item').forEach(x => x.classList.remove('active'));
                el.classList.add('active');
                showCreatorPreview(all, el.dataset.tplId);
            });
        });

        listEl.querySelectorAll('.wb-tpl-m-del').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.dataset.tplId;
                let customs = getCustomCharTemplates();
                const t = customs.find(x => x.id === id);
                if (!t) return;
                const ok = await App.confirm(`Delete template "${t.name}"?`);
                if (!ok) return;
                customs = customs.filter(x => x.id !== id);
                saveCustomCharTemplates(customs);
                const updated = getAllCharTemplates();
                renderCreatorTemplateList(updated, updated[0]?.id || '');
                App.toast('Template deleted');
            });
        });
    }

    function showCreatorPreview(all, tplId) {
        const tpl = all.find(t => t.id === tplId);
        const headerEl = document.getElementById('cc-cr-preview-header');
        const contentEl = document.getElementById('cc-cr-preview-content');
        const footerEl = document.getElementById('cc-cr-preview-footer');
        const nameInput = document.getElementById('cc-cr-char-name');
        if (!headerEl || !contentEl || !footerEl) return;

        if (!tpl) {
            headerEl.innerHTML = '';
            contentEl.textContent = 'Select a template to preview';
            footerEl.innerHTML = '';
            return;
        }

        const charName = nameInput?.value || 'New Character';
        const previewContent = tpl.content.replace(/\{\{name\}\}/gi, charName);

        headerEl.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:1rem;font-weight:600;color:var(--text-primary);">${esc(tpl.name)}</span>
                ${tpl.locked ? '<span style="font-size:0.65rem;background:rgba(201,168,76,0.15);color:var(--text-gold);padding:2px 8px;border-radius:10px;">Built-in</span>' : '<span style="font-size:0.65rem;background:rgba(100,200,100,0.15);color:#6c6;padding:2px 8px;border-radius:10px;">Custom</span>'}
            </div>
        `;
        contentEl.textContent = previewContent;

        footerEl.innerHTML = `
            <button class="btn btn-primary" id="cc-cr-use-tpl" style="width:100%;font-size:0.85rem;padding:10px;">
                ✅ Create Character with This Template
            </button>
        `;

        // Update preview when name changes
        nameInput?.removeEventListener('input', nameInput._previewUpdate);
        nameInput._previewUpdate = () => {
            const updated = tpl.content.replace(/\{\{name\}\}/gi, nameInput.value || 'New Character');
            contentEl.textContent = updated;
        };
        nameInput?.addEventListener('input', nameInput._previewUpdate);

        // Use template → create character
        document.getElementById('cc-cr-use-tpl')?.addEventListener('click', () => {
            const name = nameInput?.value || 'New Character';
            const content = tpl.content.replace(/\{\{name\}\}/gi, name);
            const char = createBlankCharacter(name);
            char.description = content;
            characters.push(char);
            activeCharId = char.id;
            save(); renderGallery(); renderDetail();
            closeCreatorModal();
            App.toast(`Character "${name}" created! 🎉`);
        });
    }

    // ========== AI CHAT ASSISTANT ==========
    function bindAIChat() {
        const sendBtn = document.getElementById('cc-cr-ai-send');
        const inputEl = document.getElementById('cc-cr-ai-input');
        const unlockBtn = document.getElementById('cc-cr-ai-unlock');
        const clearBtn = document.getElementById('cc-cr-ai-clear');

        sendBtn?.addEventListener('click', () => sendAIMessage());
        inputEl?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); }
        });

        // Unlock prompt (password 2510)
        unlockBtn?.addEventListener('click', () => {
            if (_roxieUnlocked) {
                // Show the prompt
                alert('Roxie AI System Prompt:\n\n' + _RP);
                return;
            }
            const pass = prompt('Enter password to view/edit the hidden AI prompt:');
            if (pass === _LOCKED_PASS) {
                _roxieUnlocked = true;
                unlockBtn.textContent = '🔓';
                unlockBtn.style.opacity = '1';
                App.toast('Prompt unlocked! Click again to view.');
            } else if (pass !== null) {
                App.toast('Wrong password!', 'error');
            }
        });

        // Clear chat
        clearBtn?.addEventListener('click', () => {
            _aiChatHistory = [];
            const msgContainer = document.getElementById('cc-cr-ai-messages');
            if (msgContainer) {
                msgContainer.innerHTML = `
                    <div class="cc-cr-ai-msg assistant">
                        <div class="cc-cr-ai-bubble">Hiii~ (◕‿◕✿) I'm Roxie! Tell me about the character you wanna create~ What genre? What vibe? Don't be shy, I've heard it all ☆(≧▽≦)☆</div>
                    </div>
                `;
            }
        });
    }

    async function sendAIMessage() {
        const inputEl = document.getElementById('cc-cr-ai-input');
        const msgContainer = document.getElementById('cc-cr-ai-messages');
        const sendBtn = document.getElementById('cc-cr-ai-send');
        if (!inputEl || !msgContainer) return;

        const userMsg = inputEl.value.trim();
        if (!userMsg) return;

        const settings = Store.getSettings();
        if (!settings.apiKey) {
            App.toast('Configure API in API Settings tab first!', 'warning');
            return;
        }

        // Add user message to UI
        _aiChatHistory.push({ role: 'user', content: userMsg });
        msgContainer.innerHTML += `
            <div class="cc-cr-ai-msg user">
                <div class="cc-cr-ai-bubble">${esc(userMsg)}</div>
            </div>
        `;
        inputEl.value = '';
        msgContainer.scrollTop = msgContainer.scrollHeight;

        // Show typing indicator
        const typingId = 'cc-ai-typing-' + Date.now();
        msgContainer.innerHTML += `
            <div class="cc-cr-ai-msg assistant" id="${typingId}">
                <div class="cc-cr-ai-bubble cc-ai-typing">
                    <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                </div>
            </div>
        `;
        msgContainer.scrollTop = msgContainer.scrollHeight;
        sendBtn.disabled = true;

        try {
            const messages = [
                { role: 'system', content: _RP },
                ..._aiChatHistory
            ];

            const response = await fetch(settings.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.apiKey}` },
                body: JSON.stringify({
                    model: settings.model || 'gpt-4o-mini',
                    messages,
                    temperature: 0.85,
                    max_tokens: 4096,
                }),
            });

            document.getElementById(typingId)?.remove();

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
            }

            const data = await response.json();
            const aiReply = data.choices?.[0]?.message?.content?.trim() || 'Hmm... something went wrong (╥_╥)';

            _aiChatHistory.push({ role: 'assistant', content: aiReply });

            // Render markdown-ish response
            const formattedReply = aiReply
                .replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');

            msgContainer.innerHTML += `
                <div class="cc-cr-ai-msg assistant">
                    <div class="cc-cr-ai-bubble">${formattedReply}</div>
                    <button class="btn btn-sm cc-cr-ai-apply" style="font-size:0.7rem;margin-top:4px;padding:3px 10px;" title="Use this as character description">📋 Apply to New Character</button>
                </div>
            `;
            msgContainer.scrollTop = msgContainer.scrollHeight;

            // Bind apply button (take the raw AI text and create a character)
            msgContainer.querySelectorAll('.cc-cr-ai-apply').forEach(btn => {
                btn.onclick = () => {
                    const name = prompt('Character name:', 'New Character');
                    if (!name) return;
                    const char = createBlankCharacter(name);
                    char.description = aiReply;
                    characters.push(char);
                    activeCharId = char.id;
                    save(); renderGallery(); renderDetail();
                    closeCreatorModal();
                    App.toast(`Character "${name}" created from AI! 🎉`);
                };
            });
        } catch (err) {
            document.getElementById(typingId)?.remove();
            msgContainer.innerHTML += `
                <div class="cc-cr-ai-msg assistant">
                    <div class="cc-cr-ai-bubble" style="color:var(--danger);">Error: ${esc(err.message)} (╥_╥)</div>
                </div>
            `;
            msgContainer.scrollTop = msgContainer.scrollHeight;
        } finally {
            sendBtn.disabled = false;
        }
    }

    function closeCreatorModal() {
        if (_creatorModal) { _creatorModal.remove(); _creatorModal = null; }
    }

    function esc(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }

    return { init };
})();
