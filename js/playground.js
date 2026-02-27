/* ============================================
   PLAYGROUND — API Chat Interface (i18n)
   Multi-chat sessions, swipe/regen in all modes
   ============================================ */

const Playground = (() => {
    let mode = 'standard'; // 'standard' | 'character'

    // Multi-chat sessions
    let sessions = [];
    let activeSessionId = null;

    let activeCharId = null;
    let activePersonaId = null;
    let settingsVisible = true;

    function init() {
        loadSessions();
        if (sessions.length === 0) createNewSession(false);
        bindEvents();
        updateModeUI();
        populateDropdowns();
        renderSessionTabs();
        renderMessages();
        // Load system instruction to UI
        const s = getActiveSession();
        const sysEl = document.getElementById('pg-system-instruction');
        if (sysEl && s) sysEl.value = s.systemInstruction || '';
    }

    // ========== SESSION MANAGEMENT ==========
    function loadSessions() {
        const saved = localStorage.getItem('roxie_chat_sessions');
        if (saved) {
            try { sessions = JSON.parse(saved) || []; } catch (e) { sessions = []; }
        }
        // Legacy migration: old single-chat format
        if (sessions.length === 0) {
            const old = localStorage.getItem('roxie_playground');
            if (old) {
                try {
                    const d = JSON.parse(old);
                    if (d.messages && d.messages.length > 0) {
                        // Migrate old messages to swipe format
                        const migratedMsgs = d.messages.map(m => {
                            if (m.swipes) return m; // Already has swipes
                            return { role: m.role, swipes: [m.content], currentSwipe: 0 };
                        });
                        sessions.push({
                            id: Store.uuid(),
                            name: 'Chat 1',
                            messages: migratedMsgs,
                            systemInstruction: d.systemInstruction || 'You are a helpful assistant.',
                            mode: 'standard',
                            createdAt: Date.now()
                        });
                    }
                } catch (e) { }
            }
        }
        // Also load character chats
        const charChats = Store.getCharacterChats() || {};
        // If we have active sessions, keep them
        if (sessions.length > 0) {
            activeSessionId = sessions[sessions.length - 1].id;
        }
    }

    function saveSessions() {
        localStorage.setItem('roxie_chat_sessions', JSON.stringify(sessions));
        // Also save character chats for backward compat
        const charChats = {};
        sessions.filter(s => s.mode === 'character' && s.charId).forEach(s => {
            charChats[s.charId] = s.messages;
        });
        Store.saveCharacterChats(charChats);
    }

    function getActiveSession() {
        return sessions.find(s => s.id === activeSessionId) || null;
    }

    function createNewSession(doRender = true) {
        const s = {
            id: Store.uuid(),
            name: `Chat ${sessions.length + 1}`,
            messages: [],
            systemInstruction: 'You are a helpful assistant.',
            mode: mode,
            charId: activeCharId,
            personaId: activePersonaId,
            createdAt: Date.now()
        };
        sessions.push(s);
        activeSessionId = s.id;
        saveSessions();
        if (doRender) {
            renderSessionTabs();
            renderMessages();
            const sysEl = document.getElementById('pg-system-instruction');
            if (sysEl) sysEl.value = s.systemInstruction;
        }
    }

    function switchSession(id) {
        activeSessionId = id;
        const s = getActiveSession();
        if (s) {
            mode = s.mode || 'standard';
            activeCharId = s.charId || null;
            activePersonaId = s.personaId || null;
            // Update mode UI
            document.querySelectorAll('.pg-subtab').forEach(b => {
                b.classList.toggle('active', b.dataset.mode === mode);
            });
            updateModeUI();
            const sysEl = document.getElementById('pg-system-instruction');
            if (sysEl) sysEl.value = s.systemInstruction || '';
        }
        renderSessionTabs();
        renderMessages();
    }

    function renderSessionTabs() {
        const container = document.getElementById('pg-session-tabs');
        if (!container) return;

        container.innerHTML = sessions.map(s => {
            const isActive = s.id === activeSessionId;
            const icon = s.mode === 'character' ? '🎭' : '💬';
            return `
                <div class="chat-tab ${isActive ? 'active' : ''}" data-id="${s.id}" title="${esc(s.name)}">
                    <span class="chat-tab-icon">${icon}</span>
                    <span class="chat-tab-name">${esc(s.name)}</span>
                    ${sessions.length > 1 ? `<button class="chat-tab-close" data-close="${s.id}" title="Close">×</button>` : ''}
                </div>
            `;
        }).join('') + `
            <button class="chat-tab-new" id="pg-new-chat" title="${I18n.t('pg.new_chat')}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
            </button>
        `;

        // Bind tab clicks
        container.querySelectorAll('.chat-tab').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.chat-tab-close')) return;
                switchSession(el.dataset.id);
            });
            // Double-click to rename
            el.addEventListener('dblclick', () => {
                const s = sessions.find(x => x.id === el.dataset.id);
                if (!s) return;
                const name = prompt(I18n.t('pg.rename_chat'), s.name);
                if (name) { s.name = name; saveSessions(); renderSessionTabs(); }
            });
        });

        // Bind close buttons
        container.querySelectorAll('.chat-tab-close').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.dataset.close;
                const s = sessions.find(x => x.id === id);
                if (!s) return;
                const ok = await App.confirm(I18n.t('pg.close_chat_confirm', { name: s.name }));
                if (!ok) return;
                sessions = sessions.filter(x => x.id !== id);
                if (activeSessionId === id) {
                    activeSessionId = sessions[sessions.length - 1]?.id || null;
                    if (!activeSessionId) createNewSession(false);
                }
                saveSessions();
                renderSessionTabs();
                renderMessages();
            });
        });

        // Bind new chat button
        document.getElementById('pg-new-chat')?.addEventListener('click', () => createNewSession());
    }

    function savePlayground() {
        const s = getActiveSession();
        if (s) {
            s.mode = mode;
            s.charId = activeCharId;
            s.personaId = activePersonaId;
        }
        saveSessions();
    }

    function bindEvents() {
        const on = (id, evt, fn) => { const el = document.getElementById(id); if (el) { el.removeEventListener(evt, el['_h_' + evt]); el['_h_' + evt] = fn; el.addEventListener(evt, fn); } };

        // Mode switching
        document.querySelectorAll('.pg-subtab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.pg-subtab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                mode = btn.dataset.mode;
                const s = getActiveSession();
                if (s) s.mode = mode;
                saveSessions();
                updateModeUI();
            });
        });

        // Dropdowns
        on('pg-select-persona', 'change', (e) => { activePersonaId = e.target.value; savePlayground(); renderMessages(); });
        on('pg-select-char', 'change', (e) => {
            activeCharId = e.target.value;
            updateCharPreview();
            savePlayground();
            renderMessages();
        });

        on('pg-send', 'click', sendMessage);
        on('pg-input', 'keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
        on('pg-clear', 'click', async () => {
            const ok = await App.confirm(I18n.t('pg.clear_confirm'));
            if (!ok) return;
            const s = getActiveSession();
            if (s) s.messages = [];
            savePlayground(); renderMessages();
        });
        on('pg-toggle-settings', 'click', () => {
            settingsVisible = !settingsVisible;
            document.getElementById('pg-settings-panel')?.classList.toggle('collapsed', !settingsVisible);
        });
        on('pg-system-instruction', 'input', (e) => {
            const s = getActiveSession();
            if (s) s.systemInstruction = e.target.value;
            saveSessions();
        });
        on('pg-input', 'input', (e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; });

        // Regen Confirm Modal
        on('pg-regen-confirm', 'click', () => {
            const inst = document.getElementById('pg-regen-instruction').value.trim();
            App.hideModal('pg-regen-modal');
            regenerateLast(inst);
        });
    }

    function updateModeUI() {
        const setup = document.getElementById('pg-char-setup');
        const sysInst = document.getElementById('pg-sys-inst-container');
        const apiHint = document.getElementById('pg-char-api-hint');

        if (mode === 'character') {
            if (setup) setup.style.display = 'block';
            if (sysInst) sysInst.style.display = 'none';
            if (apiHint) apiHint.style.display = 'block';
            populateDropdowns();
        } else {
            if (setup) setup.style.display = 'none';
            if (sysInst) sysInst.style.display = 'block';
            if (apiHint) apiHint.style.display = 'none';
        }
        renderMessages();
    }

    function populateDropdowns() {
        if (mode !== 'character') return;

        const chars = Store.getCharacters() || [];
        const personas = Store.getPersonas() || [];

        const charSel = document.getElementById('pg-select-char');
        const perSel = document.getElementById('pg-select-persona');
        if (!charSel || !perSel) return;

        charSel.innerHTML = chars.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
        perSel.innerHTML = personas.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');

        if (chars.length > 0 && !activeCharId) activeCharId = chars[0].id;
        if (personas.length > 0 && !activePersonaId) activePersonaId = personas[0].id;

        if (activeCharId && !chars.find(c => c.id === activeCharId)) activeCharId = chars[0]?.id;
        if (activePersonaId && !personas.find(p => p.id === activePersonaId)) activePersonaId = personas[0]?.id;

        charSel.value = activeCharId || '';
        perSel.value = activePersonaId || '';

        updateCharPreview();
    }

    function updateCharPreview() {
        const preview = document.getElementById('pg-char-preview');
        if (!preview) return;

        if (!activeCharId) { preview.style.display = 'none'; return; }

        const chars = Store.getCharacters() || [];
        const char = chars.find(c => c.id === activeCharId);
        if (!char) { preview.style.display = 'none'; return; }

        preview.style.display = 'block';
        document.getElementById('pg-char-preview-img').src = char.avatar || '';
        document.getElementById('pg-char-preview-name').textContent = char.name;
        document.getElementById('pg-char-preview-desc').textContent = char.description || '';
    }

    // --- Message Data Access (unified swipe format) ---
    function getCurrentMessages() {
        const s = getActiveSession();
        if (!s) return [];
        return s.messages;
    }

    function addMessage(role, content) {
        const s = getActiveSession();
        if (!s) return;
        s.messages.push({ role, swipes: [content], currentSwipe: 0 });
        saveSessions();
    }

    function addSwipeToLastMessage(content) {
        const msgs = getCurrentMessages();
        if (msgs.length === 0) return;
        const last = msgs[msgs.length - 1];
        if (last.role !== 'assistant') return;
        last.swipes.push(content);
        last.currentSwipe = last.swipes.length - 1;
        saveSessions();
    }

    function changeSwipe(msgIndex, delta) {
        const msgs = getCurrentMessages();
        if (!msgs || !msgs[msgIndex]) return;
        const msg = msgs[msgIndex];
        if (!msg.swipes || msg.swipes.length <= 1) return;
        let newIdx = msg.currentSwipe + delta;
        if (newIdx < 0) newIdx = msg.swipes.length - 1;
        if (newIdx >= msg.swipes.length) newIdx = 0;
        msg.currentSwipe = newIdx;
        saveSessions();
        renderMessages();
    }

    // --- API Context Building ---
    function buildCharacterContext(lastMsgs) {
        const chars = Store.getCharacters() || [];
        const personas = Store.getPersonas() || [];
        const presets = Store.getPresets() || [];

        const char = chars.find(c => c.id === activeCharId) || {};
        const persona = personas.find(p => p.id === activePersonaId) || {};
        const activePreset = presets[0];

        const charName = char.name || 'Character';
        const userName = persona.name || 'User';

        let sysPrompt = '';
        if (activePreset && activePreset.prompts) {
            sysPrompt = activePreset.prompts
                .filter(p => p.enabled && p.role === 'system')
                .map(p => p.content)
                .join('\n\n');
        } else {
            sysPrompt = 'You are an AI assistant roleplaying as {{char}}.';
        }

        let personaContext = `User Persona: ${userName}\n`;
        if (persona.description) personaContext += `Description: ${persona.description}\n`;
        if (persona.personality) personaContext += `Personality: ${persona.personality}\n`;

        let charContext = `Character: ${charName}\n`;
        if (char.system_prompt) charContext += `${char.system_prompt}\n`;
        if (char.description) charContext += `Description: ${char.description}\n`;
        if (char.personality) charContext += `Personality: ${char.personality}\n`;
        if (char.scenario) charContext += `Scenario: ${char.scenario}\n`;

        let loreContext = '';
        if (char._lorebookWorldId) {
            const worlds = Store.getWorlds() || [];
            const world = worlds.find(w => w.id === char._lorebookWorldId);
            if (world && world.entries) {
                const combinedHistory = lastMsgs.map(m => {
                    return m.swipes ? m.swipes[m.currentSwipe] : (m.content || '');
                }).join(' ').toLowerCase();

                const triggered = world.entries.filter(e => {
                    if (!e.enabled || !e.content) return false;
                    const keys = (e.keys || '').split(',').map(k => k.trim().toLowerCase()).filter(k => k);
                    return keys.some(k => combinedHistory.includes(k));
                });
                if (triggered.length > 0) {
                    loreContext = "World Info:\n" + triggered.map(e => e.content).join('\n\n') + "\n";
                }
            }
        }

        let fullSys = [sysPrompt, personaContext, charContext, loreContext].filter(x => x.trim()).join('\n\n---\n\n');
        fullSys = fullSys.replace(/\{\{char\}\}/gi, charName).replace(/\{\{user\}\}/gi, userName);

        return { system: fullSys, charName, userName };
    }

    async function sendMessage() {
        if (mode === 'character' && (!activeCharId || !activePersonaId)) {
            App.toast('Select a User Persona and Character first.', 'warning');
            return;
        }

        const input = document.getElementById('pg-input');
        const text = input?.value?.trim();
        if (!text) return;

        addMessage('user', text);
        input.value = ''; input.style.height = 'auto';
        renderMessages();

        await generateReply();
    }

    function openRegenModal() {
        document.getElementById('pg-regen-instruction').value = '';
        App.showModal('pg-regen-modal');
    }

    async function regenerateLast(regenInstruction = null) {
        const msgs = getCurrentMessages();
        if (msgs.length === 0) return;
        const last = msgs[msgs.length - 1];
        if (last.role !== 'assistant') return;
        await generateReply(true, regenInstruction);
    }

    async function generateReply(isRegen = false, regenInstruction = null) {
        const settings = Store.getSettings();
        if (!settings.apiKey) {
            addMessage('assistant', I18n.t('pg.no_api_key'));
            renderMessages(); return;
        }

        const loadingId = 'loading-' + Date.now();
        addLoadingMessage(loadingId);

        try {
            const msgs = getCurrentMessages();
            const contextMsgs = isRegen ? msgs.slice(0, -1) : msgs;
            const apiMsgs = [];
            const session = getActiveSession();

            if (mode === 'standard') {
                const sysInst = session?.systemInstruction || '';
                if (sysInst) apiMsgs.push({ role: 'system', content: sysInst });
                contextMsgs.forEach(m => {
                    const content = m.swipes ? m.swipes[m.currentSwipe] : m.content;
                    apiMsgs.push({ role: m.role, content });
                });
                if (regenInstruction) {
                    apiMsgs.push({ role: 'system', content: `[System Note: ${regenInstruction}]` });
                }
            } else {
                const { system, charName, userName } = buildCharacterContext(contextMsgs.slice(-5));
                apiMsgs.push({ role: 'system', content: system });

                contextMsgs.forEach(m => {
                    const content = m.swipes ? m.swipes[m.currentSwipe] : m.content;
                    const cleanContent = content.replace(/\{\{char\}\}/gi, charName).replace(/\{\{user\}\}/gi, userName);
                    apiMsgs.push({ role: m.role, content: cleanContent });
                });

                if (regenInstruction) {
                    apiMsgs.push({ role: 'system', content: `[System Note: ${regenInstruction}]` });
                }
            }

            const res = await fetch(settings.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.apiKey}` },
                body: JSON.stringify({ model: settings.model, messages: apiMsgs, temperature: settings.temperature, max_tokens: settings.maxTokens })
            });
            if (!res.ok) { const err = await res.text(); throw new Error(`API error ${res.status}: ${err}`); }

            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content || 'No response';
            removeLoadingMessage(loadingId);

            if (isRegen) {
                addSwipeToLastMessage(reply);
            } else {
                addMessage('assistant', reply);
            }
            renderMessages();
        } catch (err) {
            removeLoadingMessage(loadingId);
            if (isRegen) {
                addSwipeToLastMessage(`❌ Error: ${err.message}`);
            } else {
                addMessage('assistant', `❌ Error: ${err.message}`);
            }
            renderMessages();
        }
    }

    function addLoadingMessage(id) {
        const container = document.getElementById('pg-messages');
        const el = document.createElement('div');
        el.className = 'message'; el.id = id;
        el.innerHTML = `<div class="message-avatar-wrap"><div class="message-avatar">AI</div></div><div class="message-content"><div class="message-bubble" style="display:flex;gap:6px;width:fit-content;"><span class="loading-dot"></span><span class="loading-dot" style="animation-delay:0.2s"></span><span class="loading-dot" style="animation-delay:0.4s"></span></div></div>`;
        container?.appendChild(el); scrollToBottom();
    }
    function removeLoadingMessage(id) { document.getElementById(id)?.remove(); }

    function renderMessages() {
        const container = document.getElementById('pg-messages');
        if (!container) return;

        const msgs = getCurrentMessages();

        if (msgs.length === 0) {
            container.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><p>${I18n.t('pg.empty')}</p></div>`;
            return;
        }

        let chars = [], personas = [];
        if (mode === 'character') {
            chars = Store.getCharacters() || [];
            personas = Store.getPersonas() || [];
        }

        container.innerHTML = msgs.map((m, i) => {
            const content = m.swipes ? m.swipes[m.currentSwipe] : (m.content || '');
            let swipeControls = '';
            let actions = '';

            let avatarHtml = `<div class="message-avatar">${m.role === 'user' ? 'You' : 'AI'}</div>`;
            let nameHtml = '';

            if (mode === 'character') {
                if (m.role === 'assistant') {
                    const char = chars.find(c => c.id === activeCharId);
                    if (char) {
                        if (char.avatar) avatarHtml = `<div class="message-avatar"><img src="${char.avatar}"></div>`;
                        nameHtml = `<div class="message-name">${esc(char.name)}</div>`;
                    }
                } else {
                    const persona = personas.find(c => c.id === activePersonaId);
                    if (persona) {
                        if (persona.avatar) avatarHtml = `<div class="message-avatar"><img src="${persona.avatar}"></div>`;
                        nameHtml = `<div class="message-name">${esc(persona.name)}</div>`;
                    }
                }
            }

            // Swipe controls for assistant messages with multiple swipes (both modes)
            if (m.role === 'assistant' && m.swipes && m.swipes.length > 1) {
                swipeControls = `
                    <div class="message-swipe-controls">
                        <button class="swipe-btn" data-action="swipe" data-idx="${i}" data-dir="-1" title="${I18n.t('pg.swipe_prev')}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
                        <span class="play-swipe-indicator">${m.currentSwipe + 1}/${m.swipes.length}</span>
                        <button class="swipe-btn" data-action="swipe" data-idx="${i}" data-dir="1" title="${I18n.t('pg.swipe_next')}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>
                    </div>
                `;
            }

            // Regen actions on the last assistant message (both modes)
            if (m.role === 'assistant' && i === msgs.length - 1) {
                actions = `
                    <div class="message-actions">
                        <button class="msg-action-btn" data-action="regen-prompt" title="${I18n.t('pg.regen_with_prompt')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                        <button class="msg-action-btn" data-action="regen" title="${I18n.t('pg.regen_go')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg></button>
                    </div>
                `;
            }

            return `
              <div class="message ${m.role}">
                <div class="message-avatar-wrap">${avatarHtml}</div>
                <div class="message-content">
                    ${nameHtml}
                    <div class="message-bubble">
                        ${formatContent(content)}
                        ${swipeControls}
                        ${actions}
                    </div>
                </div>
              </div>
            `;
        }).join('');

        // Bind swipe and regen actions
        container.querySelectorAll('[data-action="swipe"]').forEach(btn => {
            btn.addEventListener('click', () => changeSwipe(parseInt(btn.dataset.idx), parseInt(btn.dataset.dir)));
        });
        container.querySelectorAll('[data-action="regen"]').forEach(btn => {
            btn.addEventListener('click', () => regenerateLast());
        });
        container.querySelectorAll('[data-action="regen-prompt"]').forEach(btn => {
            btn.addEventListener('click', () => openRegenModal());
        });

        scrollToBottom();
    }

    function formatContent(text) {
        if (!text) return '';
        return esc(text)
            .replace(/```([\s\S]*?)```/g, '<pre style="background:var(--bg-deep);padding:10px;border-radius:6px;overflow-x:auto;margin:8px 0;font-family:var(--font-mono);font-size:0.85rem;">$1</pre>')
            .replace(/`([^`]+)`/g, '<code style="background:var(--bg-deep);padding:2px 6px;border-radius:3px;font-family:var(--font-mono);font-size:0.85rem;">$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    function scrollToBottom() { const c = document.getElementById('pg-messages'); if (c) c.scrollTop = c.scrollHeight; }
    function esc(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }

    function refresh() {
        populateDropdowns();
        renderSessionTabs();
        renderMessages();
    }

    return { init, refresh };
})();
