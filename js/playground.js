/* ============================================
   PLAYGROUND — API Chat Interface (i18n)
   ============================================ */

const Playground = (() => {
    let messages = [];
    let systemInstruction = 'You are a helpful assistant.';
    let settingsVisible = true;

    function init() {
        const saved = localStorage.getItem('roxie_playground');
        if (saved) { try { const d = JSON.parse(saved); messages = d.messages || []; systemInstruction = d.systemInstruction || 'You are a helpful assistant.'; } catch (e) { } }
        bindEvents();
        renderMessages();
        loadSettingsToUI();
    }

    function savePlayground() { localStorage.setItem('roxie_playground', JSON.stringify({ messages, systemInstruction })); }

    function bindEvents() {
        const on = (id, evt, fn) => { const el = document.getElementById(id); if (el) { el.removeEventListener(evt, el['_h_' + evt]); el['_h_' + evt] = fn; el.addEventListener(evt, fn); } };
        on('pg-send', 'click', sendMessage);
        on('pg-input', 'keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
        on('pg-clear', 'click', async () => { const ok = await App.confirm(I18n.t('pg.clear_confirm')); if (!ok) return; messages = []; savePlayground(); renderMessages(); });
        on('pg-toggle-settings', 'click', () => { settingsVisible = !settingsVisible; document.getElementById('pg-settings-panel')?.classList.toggle('collapsed', !settingsVisible); });
        on('pg-system-instruction', 'input', (e) => { systemInstruction = e.target.value; savePlayground(); });
        on('pg-save-settings', 'click', () => {
            Store.saveSettings({ apiEndpoint: document.getElementById('pg-endpoint')?.value || '', apiKey: document.getElementById('pg-api-key')?.value || '', model: document.getElementById('pg-model')?.value || '', temperature: parseFloat(document.getElementById('pg-temperature')?.value) || 0.7, maxTokens: parseInt(document.getElementById('pg-max-tokens')?.value) || 2048 });
            App.toast(I18n.t('pg.settings_saved'));
        });
        on('pg-input', 'input', (e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; });
    }

    function loadSettingsToUI() {
        const s = Store.getSettings();
        const el = (id) => document.getElementById(id);
        if (el('pg-endpoint')) el('pg-endpoint').value = s.apiEndpoint;
        if (el('pg-api-key')) el('pg-api-key').value = s.apiKey;
        if (el('pg-model')) el('pg-model').value = s.model;
        if (el('pg-temperature')) el('pg-temperature').value = s.temperature;
        if (el('pg-max-tokens')) el('pg-max-tokens').value = s.maxTokens;
        if (el('pg-system-instruction')) el('pg-system-instruction').value = systemInstruction;
    }

    async function sendMessage() {
        const input = document.getElementById('pg-input');
        const text = input?.value?.trim();
        if (!text) return;
        messages.push({ role: 'user', content: text });
        input.value = ''; input.style.height = 'auto';
        savePlayground(); renderMessages();

        const settings = Store.getSettings();
        if (!settings.apiKey) {
            messages.push({ role: 'assistant', content: I18n.t('pg.no_api_key') });
            savePlayground(); renderMessages(); return;
        }

        const loadingId = 'loading-' + Date.now();
        addLoadingMessage(loadingId);

        try {
            const apiMsgs = [];
            if (systemInstruction) apiMsgs.push({ role: 'system', content: systemInstruction });
            messages.forEach(m => apiMsgs.push({ role: m.role, content: m.content }));

            const res = await fetch(settings.apiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.apiKey}` }, body: JSON.stringify({ model: settings.model, messages: apiMsgs, temperature: settings.temperature, max_tokens: settings.maxTokens }) });
            if (!res.ok) { const err = await res.text(); throw new Error(`API error ${res.status}: ${err}`); }

            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content || 'No response';
            removeLoadingMessage(loadingId);
            messages.push({ role: 'assistant', content: reply });
            savePlayground(); renderMessages();
        } catch (err) {
            removeLoadingMessage(loadingId);
            messages.push({ role: 'assistant', content: `❌ Error: ${err.message}` });
            savePlayground(); renderMessages();
        }
    }

    function addLoadingMessage(id) {
        const container = document.getElementById('pg-messages');
        const el = document.createElement('div');
        el.className = 'message'; el.id = id;
        el.innerHTML = `<div class="message-avatar">AI</div><div class="message-bubble" style="display:flex;gap:6px;"><span class="loading-dot"></span><span class="loading-dot" style="animation-delay:0.2s"></span><span class="loading-dot" style="animation-delay:0.4s"></span></div>`;
        container?.appendChild(el); scrollToBottom();
    }
    function removeLoadingMessage(id) { document.getElementById(id)?.remove(); }

    function renderMessages() {
        const container = document.getElementById('pg-messages');
        if (!container) return;
        if (messages.length === 0) { container.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><p>${I18n.t('pg.empty')}</p></div>`; return; }
        container.innerHTML = messages.map(m => `
      <div class="message ${m.role}"><div class="message-avatar">${m.role === 'user' ? 'You' : 'AI'}</div><div class="message-bubble">${formatContent(m.content)}</div></div>
    `).join('');
        scrollToBottom();
    }

    function formatContent(text) {
        return esc(text)
            .replace(/```([\s\S]*?)```/g, '<pre style="background:var(--bg-deep);padding:10px;border-radius:6px;overflow-x:auto;margin:8px 0;font-family:var(--font-mono);font-size:0.85rem;">$1</pre>')
            .replace(/`([^`]+)`/g, '<code style="background:var(--bg-deep);padding:2px 6px;border-radius:3px;font-family:var(--font-mono);font-size:0.85rem;">$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }
    function scrollToBottom() { const c = document.getElementById('pg-messages'); if (c) c.scrollTop = c.scrollHeight; }
    function esc(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }
    return { init };
})();
