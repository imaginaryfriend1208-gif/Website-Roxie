/* ============================================
   API SETTINGS — Multi-Profile API Configuration
   ============================================ */

const ApiSettings = (() => {
    let profiles = [];
    let activeProfileId = '';
    let selectedProfileId = '';

    function init() {
        profiles = Store.getApiProfiles();
        activeProfileId = Store.getActiveProfileId();
        if (profiles.length > 0 && !activeProfileId) {
            activeProfileId = profiles[0].id;
            Store.saveActiveProfileId(activeProfileId);
        }
        selectedProfileId = activeProfileId;
        renderProfileList();
        renderProfileEditor();
        bindEvents();
    }

    function bindEvents() {
        const on = (id, evt, fn) => { const el = document.getElementById(id); if (el) { el.removeEventListener(evt, el['_h_' + evt]); el['_h_' + evt] = fn; el.addEventListener(evt, fn); } };

        on('api-new-profile', 'click', () => {
            const name = prompt(I18n.t('api.new_profile_prompt'), `Profile ${profiles.length + 1}`);
            if (!name) return;
            const profile = {
                id: Store.uuid(),
                name,
                endpoint: 'https://api.openai.com/v1/chat/completions',
                apiKey: '',
                model: 'gpt-4o-mini',
                temperature: 0.7,
                maxTokens: 2048,
                translationPrompt: '',
            };
            profiles.push(profile);
            if (profiles.length === 1) {
                activeProfileId = profile.id;
                Store.saveActiveProfileId(activeProfileId);
            }
            selectedProfileId = profile.id;
            save();
            renderProfileList();
            renderProfileEditor();
        });

        on('api-rename-profile', 'click', () => {
            const profile = profiles.find(p => p.id === selectedProfileId);
            if (!profile) return;
            const name = prompt(I18n.t('api.rename_prompt'), profile.name);
            if (!name) return;
            profile.name = name;
            save();
            renderProfileList();
            renderProfileEditor();
        });

        on('api-delete-profile', 'click', async () => {
            const profile = profiles.find(p => p.id === selectedProfileId);
            if (!profile) return;
            const ok = await App.confirm(I18n.t('api.delete_confirm', { name: profile.name }));
            if (!ok) return;
            profiles = profiles.filter(p => p.id !== selectedProfileId);
            if (activeProfileId === selectedProfileId) {
                activeProfileId = profiles[0]?.id || '';
                Store.saveActiveProfileId(activeProfileId);
            }
            selectedProfileId = profiles[0]?.id || '';
            save();
            renderProfileList();
            renderProfileEditor();
        });

        on('api-save-profile', 'click', () => {
            saveCurrentProfile();
            App.toast(I18n.t('api.saved'));
        });

        on('api-set-active', 'click', () => {
            if (!selectedProfileId) return;
            activeProfileId = selectedProfileId;
            Store.saveActiveProfileId(activeProfileId);
            renderProfileList();
            renderProfileEditor();
            App.toast(I18n.t('api.set_active_done'));
        });

        on('api-test-connection', 'click', testConnection);
    }

    function save() {
        Store.saveApiProfiles(profiles);
    }

    function saveCurrentProfile() {
        const profile = profiles.find(p => p.id === selectedProfileId);
        if (!profile) return;
        const el = (id) => document.getElementById(id);
        profile.endpoint = el('api-endpoint')?.value || '';
        profile.apiKey = el('api-key')?.value || '';
        profile.model = el('api-model')?.value || '';
        profile.temperature = parseFloat(el('api-temperature')?.value) || 0.7;
        profile.maxTokens = parseInt(el('api-max-tokens')?.value) || 2048;
        save();
    }

    async function testConnection() {
        const el = (id) => document.getElementById(id);
        const endpoint = el('api-endpoint')?.value;
        const apiKey = el('api-key')?.value;
        const model = el('api-model')?.value;

        if (!endpoint || !apiKey) {
            App.toast(I18n.t('api.test_missing'), 'warning');
            return;
        }

        const btn = el('api-test-connection');
        if (btn) { btn.disabled = true; btn.textContent = '⏳'; }

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({ model: model || 'gpt-4o-mini', messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 })
            });
            if (res.ok) {
                App.toast(I18n.t('api.test_success'), 'success');
            } else {
                const err = await res.text();
                App.toast(I18n.t('api.test_fail') + res.status, 'error');
            }
        } catch (err) {
            App.toast(I18n.t('api.test_fail') + err.message, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> <span data-i18n="api.test">${I18n.t('api.test')}</span>`; }
        }
    }

    function renderProfileList() {
        const container = document.getElementById('api-profile-list');
        if (!container) return;

        if (profiles.length === 0) {
            container.innerHTML = `<div class="empty-state" style="padding:20px"><p style="font-size:0.8rem">${I18n.t('api.no_profiles')}</p></div>`;
            return;
        }

        container.innerHTML = profiles.map(p => `
            <div class="preset-list-item ${p.id === selectedProfileId ? 'active' : ''}" data-id="${p.id}">
                <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">
                    ${p.id === activeProfileId ? '<span style="color:var(--gold);font-size:0.7rem;" title="Active">★</span>' : '<span style="width:12px"></span>'}
                    <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.name)}</span>
                </div>
                <span style="font-size:0.65rem;color:var(--text-muted);white-space:nowrap;">${esc(p.model || '—')}</span>
            </div>
        `).join('');

        container.querySelectorAll('.preset-list-item').forEach(el => {
            el.addEventListener('click', () => {
                // Save currently editing profile before switching
                if (selectedProfileId) saveCurrentProfile();
                selectedProfileId = el.dataset.id;
                renderProfileList();
                renderProfileEditor();
            });
        });
    }

    function renderProfileEditor() {
        const container = document.getElementById('api-profile-editor');
        if (!container) return;

        const profile = profiles.find(p => p.id === selectedProfileId);
        if (!profile) {
            container.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><p>${I18n.t('api.select_profile')}</p></div>`;
            return;
        }

        const isActive = profile.id === activeProfileId;

        container.innerHTML = `
            <div class="api-editor-inner">
                <div class="api-editor-header">
                    <h3>${esc(profile.name)}</h3>
                    ${isActive ? `<span class="api-active-badge">★ ${I18n.t('api.active')}</span>` : `<button class="btn btn-sm btn-primary" id="api-set-active"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> <span data-i18n="api.set_active">${I18n.t('api.set_active')}</span></button>`}
                </div>

                <div class="form-group">
                    <label class="form-label">${I18n.t('api.endpoint')}</label>
                    <input class="form-input" id="api-endpoint" value="${esc(profile.endpoint)}" placeholder="https://api.openai.com/v1/chat/completions">
                </div>
                <div class="form-group">
                    <label class="form-label">${I18n.t('api.api_key')}</label>
                    <div style="display:flex;gap:6px;">
                        <input class="form-input" id="api-key" type="password" value="${esc(profile.apiKey)}" placeholder="sk-..." style="flex:1;">
                        <button class="btn btn-sm btn-ghost" id="api-toggle-key" title="Show/Hide" style="padding:6px 10px;">👁</button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">${I18n.t('api.model')}</label>
                    <input class="form-input" id="api-model" value="${esc(profile.model)}" placeholder="gpt-4o-mini">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div class="form-group">
                        <label class="form-label">${I18n.t('api.temperature')}</label>
                        <input class="form-input" id="api-temperature" type="number" min="0" max="2" step="0.1" value="${profile.temperature}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${I18n.t('api.max_tokens')}</label>
                        <input class="form-input" id="api-max-tokens" type="number" min="1" max="128000" value="${profile.maxTokens}">
                    </div>
                </div>
                <div style="display:flex;gap:8px;margin-top:12px;">
                    <button class="btn btn-primary btn-sm" id="api-save-profile" style="flex:1;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        <span data-i18n="api.save">${I18n.t('api.save')}</span>
                    </button>
                    <button class="btn btn-sm" id="api-test-connection">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <span data-i18n="api.test">${I18n.t('api.test')}</span>
                    </button>
                </div>
            </div>
        `;

        // Bind toggle key visibility
        const toggleBtn = document.getElementById('api-toggle-key');
        const keyInput = document.getElementById('api-key');
        if (toggleBtn && keyInput) {
            toggleBtn.addEventListener('click', () => {
                keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
            });
        }

        // Re-bind set active
        const setActiveBtn = document.getElementById('api-set-active');
        if (setActiveBtn) {
            setActiveBtn.addEventListener('click', () => {
                activeProfileId = selectedProfileId;
                Store.saveActiveProfileId(activeProfileId);
                renderProfileList();
                renderProfileEditor();
                App.toast(I18n.t('api.set_active_done'));
            });
        }

        // Re-bind save & test
        const saveBtn = document.getElementById('api-save-profile');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                saveCurrentProfile();
                App.toast(I18n.t('api.saved'));
            });
        }
        const testBtn = document.getElementById('api-test-connection');
        if (testBtn) {
            testBtn.addEventListener('click', testConnection);
        }
    }

    function esc(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }

    return { init };
})();
