/* ============================================
   APP — Main init, routing, toast, event bus
   ============================================ */

const App = (() => {
    const TABS = [
        'preset-editor',
        'character-card',
        'preset-showcase',
        'worldbook',
        'playground',
        'persona',
        'api-settings',
    ];

    function init() {
        setupRouting();
        // Initialize all modules
        PresetEditor.init();
        CharacterCard.init();
        PresetShowcase.init();
        Worldbook.init();
        Playground.init();
        Persona.init();
        ApiSettings.init();

        // Apply translations to static UI
        I18n.updateStaticUI();

        // Restore last active tab
        const lastTab = Store.getActiveTab();
        switchTab(lastTab);
    }

    function setupRouting() {
        document.querySelectorAll('.sidebar-btn[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                switchTab(btn.dataset.tab);
            });
        });
    }

    function switchTab(tabId) {
        if (!TABS.includes(tabId)) tabId = TABS[0];

        // Update sidebar buttons
        document.querySelectorAll('.sidebar-btn[data-tab]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update tab views
        document.querySelectorAll('.tab-view').forEach(view => {
            view.classList.toggle('active', view.id === `tab-${tabId}`);
        });

        Store.saveActiveTab(tabId);
    }

    // --- Toast Notifications ---
    function toast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `<span>${message}</span>`;
        container.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }

    // --- Modal helpers ---
    function showModal(id) {
        document.getElementById(id)?.classList.add('active');
    }
    function hideModal(id) {
        document.getElementById(id)?.classList.remove('active');
    }

    // --- Confirm dialog ---
    function confirm(message) {
        return new Promise(resolve => {
            const overlay = document.getElementById('confirm-modal');
            const msgEl = overlay.querySelector('.confirm-message');
            const yesBtn = overlay.querySelector('.confirm-yes');
            const noBtn = overlay.querySelector('.confirm-no');
            msgEl.textContent = message;
            overlay.classList.add('active');

            const cleanup = (result) => {
                overlay.classList.remove('active');
                yesBtn.removeEventListener('click', onYes);
                noBtn.removeEventListener('click', onNo);
                resolve(result);
            };
            const onYes = () => cleanup(true);
            const onNo = () => cleanup(false);
            yesBtn.addEventListener('click', onYes);
            noBtn.addEventListener('click', onNo);
        });
    }

    return { init, switchTab, toast, showModal, hideModal, confirm };
})();

document.addEventListener('DOMContentLoaded', App.init);
