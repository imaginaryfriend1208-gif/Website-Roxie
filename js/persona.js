/* ============================================
   PERSONA — User Persona Manager (i18n)
   ============================================ */

const Persona = (() => {
  let personas = [];
  let templates = [];
  let activePersonaId = null;

  function init() {
    personas = Store.getPersonas();
    templates = Store.getPersonaTemplates();
    activePersonaId = activePersonaId || personas[0]?.id || null;
    bindEvents();
    renderList();
    renderEditor();
  }

  function getActive() { return personas.find(p => p.id === activePersonaId); }
  function save() { Store.savePersonas(personas); }
  function saveTemplates() { Store.savePersonaTemplates(templates); }

  function bindEvents() {
    const on = (id, evt, fn) => { const el = document.getElementById(id); if (el) { el.removeEventListener(evt, el['_h_' + evt]); el['_h_' + evt] = fn; el.addEventListener(evt, fn); } };
    on('ps-new', 'click', () => {
      const name = prompt(I18n.t('ps.persona_name'), 'New Persona');
      if (!name) return;
      const p = { id: Store.uuid(), name, avatar: '', description: '', personality: '', scenario: '', createdAt: Date.now() };
      personas.push(p); activePersonaId = p.id; save(); renderList(); renderEditor();
    });
    on('ps-from-template', 'click', () => {
      if (templates.length === 0) { App.toast(I18n.t('ps.no_templates'), 'warning'); return; }
      showTemplatePicker();
    });
  }

  function showTemplatePicker() {
    const list = document.getElementById('ps-template-picker-list');
    list.innerHTML = templates.map(t => `
      <div class="template-card" data-id="${t.id}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--bg-hover);overflow:hidden;flex-shrink:0;">${t.avatar ? `<img src="${t.avatar}" style="width:100%;height:100%;object-fit:cover;">` : ''}</div>
          <span style="font-weight:600;color:var(--text-gold);">${esc(t.name)}</span>
        </div>
        <div style="font-size:0.8rem;color:var(--text-secondary);max-height:60px;overflow:hidden;">${esc(t.description || I18n.t('sc.no_description'))}</div>
      </div>
    `).join('');
    list.querySelectorAll('.template-card').forEach(el => {
      el.addEventListener('click', () => {
        const tpl = templates.find(t => t.id === el.dataset.id);
        if (!tpl) return;
        personas.push({ id: Store.uuid(), name: tpl.name + ' (Copy)', avatar: tpl.avatar, description: tpl.description, personality: tpl.personality || '', scenario: tpl.scenario || '', createdAt: Date.now() });
        activePersonaId = personas[personas.length - 1].id; save(); renderList(); renderEditor();
        App.hideModal('ps-template-modal'); App.toast(I18n.t('ps.from_template_created'));
      });
    });
    App.showModal('ps-template-modal');
  }

  function renderList() {
    const list = document.getElementById('ps-persona-list');
    if (!list) return;
    list.innerHTML = personas.map(p => `
      <div class="persona-list-item ${p.id === activePersonaId ? 'active' : ''}" data-id="${p.id}">
        <div class="persona-avatar-sm">${p.avatar ? `<img src="${p.avatar}">` : ` <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.8rem;">${(p.name || '?')[0]}</div>`}</div>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.name)}</span>
      </div>
    `).join('');
    list.querySelectorAll('.persona-list-item').forEach(el => {
      el.addEventListener('click', () => { activePersonaId = el.dataset.id; renderList(); renderEditor(); });
    });
  }

  function renderEditor() {
    const editor = document.getElementById('ps-editor');
    if (!editor) return;
    const persona = getActive();
    if (!persona) { editor.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg><p>${I18n.t('ps.create_select')}</p></div>`; return; }

    editor.innerHTML = `
      <div class="persona-avatar-upload" id="ps-avatar-upload" title="${I18n.t('ps.click_avatar')}">
        ${persona.avatar ? `<img src="${persona.avatar}">` : ''}
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32" style="${persona.avatar ? 'opacity:0;' : ''}"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      </div>
      <input type="file" id="ps-avatar-input" accept="image/*" style="display:none;">
      <div class="form-group" style="margin-bottom:16px;"><label class="form-label">${I18n.t('ps.field.name')}</label><input class="form-input" id="ps-name" value="${esc(persona.name)}" placeholder="${I18n.t('ps.field.name')}"></div>
      <div class="form-group" style="margin-bottom:16px;"><label class="form-label">${I18n.t('ps.field.description')}</label><textarea class="form-textarea" id="ps-description" rows="5" placeholder="${I18n.t('ps.desc_placeholder')}">${esc(persona.description)}</textarea></div>
      <div class="form-group" style="margin-bottom:16px;"><label class="form-label">${I18n.t('ps.field.personality')}</label><textarea class="form-textarea" id="ps-personality" rows="3" placeholder="${I18n.t('ps.personality_placeholder')}">${esc(persona.personality || '')}</textarea></div>
      <div class="form-group" style="margin-bottom:16px;"><label class="form-label">${I18n.t('ps.field.scenario')}</label><textarea class="form-textarea" id="ps-scenario" rows="3" placeholder="${I18n.t('ps.scenario_placeholder')}">${esc(persona.scenario || '')}</textarea></div>
      <div style="display:flex;gap:8px;margin-bottom:24px;">
        <button class="btn btn-primary" id="ps-save-template"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> ${I18n.t('ps.create_template')}</button>
        <button class="btn btn-danger" id="ps-delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg> ${I18n.t('btn.delete')}</button>
      </div>
      <div class="persona-templates"><h3 style="color:var(--text-gold);font-size:1rem;margin-bottom:4px;">${I18n.t('ps.templates_title')}</h3><p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:12px;">${I18n.t('ps.templates_hint')}</p><div class="template-grid" id="ps-template-grid"></div></div>
    `;

    // Avatar upload
    document.getElementById('ps-avatar-upload')?.addEventListener('click', () => document.getElementById('ps-avatar-input')?.click());
    document.getElementById('ps-avatar-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0]; if (!file) return;
      const r = new FileReader(); r.onload = () => { persona.avatar = r.result; save(); renderList(); renderEditor(); }; r.readAsDataURL(file);
    });

    // Field bindings
    document.getElementById('ps-name')?.addEventListener('input', (e) => { persona.name = e.target.value; save(); renderList(); });
    document.getElementById('ps-description')?.addEventListener('input', (e) => { persona.description = e.target.value; save(); });
    document.getElementById('ps-personality')?.addEventListener('input', (e) => { persona.personality = e.target.value; save(); });
    document.getElementById('ps-scenario')?.addEventListener('input', (e) => { persona.scenario = e.target.value; save(); });

    // Create template
    document.getElementById('ps-save-template')?.addEventListener('click', () => {
      templates.push({ id: Store.uuid(), name: persona.name, avatar: persona.avatar, description: persona.description, personality: persona.personality || '', scenario: persona.scenario || '', createdAt: Date.now() });
      saveTemplates(); renderTemplateGrid(); App.toast(I18n.t('ps.template_created'));
    });

    // Delete
    document.getElementById('ps-delete')?.addEventListener('click', async () => {
      const ok = await App.confirm(I18n.t('ps.delete_confirm', { name: persona.name })); if (!ok) return;
      personas = personas.filter(p => p.id !== persona.id); activePersonaId = personas[0]?.id || null; save(); renderList(); renderEditor();
    });

    renderTemplateGrid();
  }

  function renderTemplateGrid() {
    const grid = document.getElementById('ps-template-grid');
    if (!grid) return;
    if (templates.length === 0) { grid.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;grid-column:1/-1;">${I18n.t('ps.no_templates_yet')}</p>`; return; }
    grid.innerHTML = templates.map(t => `
      <div class="template-card" data-id="${t.id}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--bg-hover);overflow:hidden;flex-shrink:0;">${t.avatar ? `<img src="${t.avatar}" style="width:100%;height:100%;object-fit:cover;">` : ''}</div>
          <span style="font-weight:500;font-size:0.85rem;color:var(--text-gold);flex:1;">${esc(t.name)}</span>
          <button class="btn btn-icon btn-ghost btn-danger btn-sm" data-action="delete-tpl" data-id="${t.id}" title="${I18n.t('btn.delete')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div style="font-size:0.75rem;color:var(--text-secondary);max-height:40px;overflow:hidden;">${esc(t.description || I18n.t('sc.no_description'))}</div>
        <button class="btn btn-sm btn-ghost" style="margin-top:8px;width:100%;justify-content:center;" data-action="copy-tpl" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> ${I18n.t('ps.copy_as_persona')}</button>
      </div>
    `).join('');

    grid.querySelectorAll('[data-action="copy-tpl"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const tpl = templates.find(t => t.id === el.dataset.id); if (!tpl) return;
        personas.push({ id: Store.uuid(), name: tpl.name + ' (Copy)', avatar: tpl.avatar, description: tpl.description, personality: tpl.personality || '', scenario: tpl.scenario || '', createdAt: Date.now() });
        activePersonaId = personas[personas.length - 1].id; save(); renderList(); renderEditor();
        App.toast(I18n.t('ps.from_template_created'));
      });
    });
    grid.querySelectorAll('[data-action="delete-tpl"]').forEach(el => {
      el.addEventListener('click', async (e) => {
        e.stopPropagation();
        const tpl = templates.find(t => t.id === el.dataset.id); if (!tpl) return;
        const ok = await App.confirm(I18n.t('ps.delete_tpl_confirm', { name: tpl.name })); if (!ok) return;
        templates = templates.filter(t => t.id !== tpl.id); saveTemplates(); renderTemplateGrid();
      });
    });
  }

  function esc(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }
  return { init };
})();
