/* ============================================
   STORE — localStorage persistence with auto-save
   ============================================ */

const Store = (() => {
  const KEYS = {
    presets: 'roxie_presets',
    characters: 'roxie_characters',
    showcase: 'roxie_showcase',
    worlds: 'roxie_worlds',
    settings: 'roxie_settings',
    personas: 'roxie_personas',
    personaTemplates: 'roxie_persona_templates',
    activeTab: 'roxie_active_tab',
    charChats: 'roxie_char_chats',
    apiProfiles: 'roxie_api_profiles',
    activeProfileId: 'roxie_active_profile_id',
  };

  const _saveTimeouts = {};
  const SAVE_DEBOUNCE = 300;

  function _get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error(`Store: failed to read ${key}`, e);
      return null;
    }
  }

  function _set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Store: failed to write ${key}`, e);
    }
  }

  function _showSaveIndicator() {
    const el = document.getElementById('autosave-indicator');
    if (el) {
      el.classList.add('show');
      clearTimeout(el._hideTimeout);
      el._hideTimeout = setTimeout(() => el.classList.remove('show'), 1500);
    }
  }

  function save(key, data) {
    clearTimeout(_saveTimeouts[key]);
    _saveTimeouts[key] = setTimeout(() => {
      _set(key, data);
      _showSaveIndicator();
    }, SAVE_DEBOUNCE);
  }

  function saveImmediate(key, data) {
    _set(key, data);
    _showSaveIndicator();
  }

  // --- Presets ---
  function getPresets() {
    return _get(KEYS.presets) || [];
  }
  function savePresets(presets) {
    save(KEYS.presets, presets);
  }

  // --- Characters ---
  function getCharacters() {
    return _get(KEYS.characters) || [];
  }
  function saveCharacters(chars) {
    save(KEYS.characters, chars);
  }

  // --- Showcase ---
  function getShowcase() {
    return _get(KEYS.showcase) || [];
  }
  function saveShowcase(showcase) {
    save(KEYS.showcase, showcase);
  }

  // --- Worlds/Lorebook ---
  function getWorlds() {
    return _get(KEYS.worlds) || [];
  }
  function saveWorlds(worlds) {
    save(KEYS.worlds, worlds);
  }

  // --- Settings (backward compatible — reads from active profile) ---
  function getSettings() {
    const profiles = getApiProfiles();
    const activeId = getActiveProfileId();
    const profile = profiles.find(p => p.id === activeId) || profiles[0];
    if (profile) {
      return {
        apiEndpoint: profile.endpoint || '',
        apiKey: profile.apiKey || '',
        model: profile.model || '',
        temperature: profile.temperature ?? 0.7,
        maxTokens: profile.maxTokens ?? 2048,
        translationPrompt: profile.translationPrompt || 'Translate the following text to {language}. Preserve all formatting, placeholders (like {{char}}, {{user}}), and special syntax. Output ONLY the translated text, nothing else.',
      };
    }
    // Fallback to legacy settings
    return _get(KEYS.settings) || {
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: '',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2048,
      translationPrompt: 'Translate the following text to {language}. Preserve all formatting, placeholders (like {{char}}, {{user}}), and special syntax. Output ONLY the translated text, nothing else.',
    };
  }
  function saveSettings(settings) {
    saveImmediate(KEYS.settings, settings);
  }

  // --- API Profiles ---
  function getApiProfiles() {
    const profiles = _get(KEYS.apiProfiles);
    if (profiles && profiles.length > 0) return profiles;
    // Migrate legacy settings to first profile
    const legacy = _get(KEYS.settings);
    if (legacy && legacy.apiKey) {
      const migrated = [{
        id: uuid(),
        name: 'Default',
        endpoint: legacy.apiEndpoint || 'https://api.openai.com/v1/chat/completions',
        apiKey: legacy.apiKey || '',
        model: legacy.model || 'gpt-4o-mini',
        temperature: legacy.temperature ?? 0.7,
        maxTokens: legacy.maxTokens ?? 2048,
        translationPrompt: legacy.translationPrompt || '',
      }];
      _set(KEYS.apiProfiles, migrated);
      _set(KEYS.activeProfileId, migrated[0].id);
      return migrated;
    }
    return [];
  }
  function saveApiProfiles(profiles) {
    saveImmediate(KEYS.apiProfiles, profiles);
  }
  function getActiveProfileId() {
    return _get(KEYS.activeProfileId) || '';
  }
  function saveActiveProfileId(id) {
    saveImmediate(KEYS.activeProfileId, id);
  }

  // --- Personas ---
  function getPersonas() {
    return _get(KEYS.personas) || [];
  }
  function savePersonas(personas) {
    save(KEYS.personas, personas);
  }

  // --- Persona Templates ---
  function getPersonaTemplates() {
    return _get(KEYS.personaTemplates) || [];
  }
  function savePersonaTemplates(templates) {
    save(KEYS.personaTemplates, templates);
  }

  // --- Active Tab ---
  function getActiveTab() {
    return _get(KEYS.activeTab) || 'preset-editor';
  }
  function saveActiveTab(tab) {
    saveImmediate(KEYS.activeTab, tab);
  }

  // --- Character Chats ---
  function getCharacterChats() {
    return _get(KEYS.charChats) || {};
  }
  function saveCharacterChats(chats) {
    save(KEYS.charChats, chats);
  }

  // --- JSON Export/Import helpers ---
  function exportJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          resolve(JSON.parse(e.target.result));
        } catch (err) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // --- UUID generator ---
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  return {
    KEYS, getPresets, savePresets,
    getCharacters, saveCharacters,
    getShowcase, saveShowcase,
    getWorlds, saveWorlds,
    getSettings, saveSettings,
    getApiProfiles, saveApiProfiles,
    getActiveProfileId, saveActiveProfileId,
    getPersonas, savePersonas,
    getPersonaTemplates, savePersonaTemplates,
    getActiveTab, saveActiveTab,
    getCharacterChats, saveCharacterChats,
    exportJSON, importJSON, uuid,
  };
})();
