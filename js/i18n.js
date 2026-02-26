/* ============================================
   I18N — Internationalization (EN / VI)
   ============================================ */

const I18n = (() => {
    const STORAGE_KEY = 'roxie_lang';
    let currentLang = localStorage.getItem(STORAGE_KEY) || 'en';

    const translations = {
        en: {
            // Sidebar tooltips
            'nav.preset_editor': 'Preset Editor',
            'nav.character_card': 'Character Card',
            'nav.preset_showcase': 'Preset Showcase',
            'nav.worldbook': 'Worldbook',
            'nav.playground': 'Playground',
            'nav.persona': 'User Persona',

            // Tab headers
            'tab.preset_editor': 'Preset Editor',
            'tab.character_card': 'Character Cards',
            'tab.preset_showcase': 'Preset Showcase',
            'tab.worldbook': 'Worldbook / Lorebook',
            'tab.playground': 'Playground',
            'tab.persona': 'User Persona',

            // Common
            'btn.import': 'Import',
            'btn.export': 'Export',
            'btn.delete': 'Delete',
            'btn.rename': 'Rename',
            'btn.save': 'Save',
            'btn.cancel': 'Cancel',
            'btn.confirm': 'Confirm',
            'btn.clear': 'Clear',
            'btn.settings': 'Settings',
            'btn.enable': 'Enable',
            'btn.disable': 'Disable',
            'btn.all': 'All',
            'autosave': 'Auto-saved',

            // Preset Editor
            'pe.new_preset': 'New Preset',
            'pe.add_prompt': 'Add Prompt',
            'pe.prompt_chain': 'Prompt Chain',
            'pe.prompt_name_default': 'New Prompt',
            'pe.prompt_placeholder': 'Enter prompt content...',
            'pe.new_preset_prompt': 'New preset name:',
            'pe.rename_prompt': 'Rename preset:',
            'pe.delete_confirm': 'Delete preset "{name}"?',
            'pe.delete_prompt_confirm': 'Delete prompt "{name}"?',
            'pe.no_preset': 'No preset selected. Create or select one.',
            'pe.imported': 'Preset imported!',
            'pe.exported': 'Preset exported!',
            'pe.import_failed': 'Import failed: ',
            'pe.role.system': 'System',
            'pe.role.user': 'User',
            'pe.role.assistant': 'Assistant',
            'pe.move_up': 'Move up',
            'pe.move_down': 'Move down',

            // Character Card
            'cc.upload_card': 'Upload Card',
            'cc.search': 'Search characters...',
            'cc.drop_hint': 'Drop PNG character cards here<br>or click to upload',
            'cc.no_chars': 'No characters yet',
            'cc.empty_hint': 'Upload a character card (PNG with embedded data) or select one from the gallery.',
            'cc.delete_confirm': 'Delete character "{name}"?',
            'cc.imported': 'Character "{name}" imported!',
            'cc.exported': 'Character exported!',
            'cc.import_failed': 'Failed to import: ',
            'cc.added_image': 'Character added from image!',
            'cc.no_chara_data': 'No character data found in PNG. Not a valid character card.',
            'cc.field.description': 'Description',
            'cc.field.personality': 'Personality',
            'cc.field.first_mes': 'First Message',
            'cc.field.scenario': 'Scenario',
            'cc.field.mes_example': 'Message Examples',
            'cc.field.system_prompt': 'System Prompt',
            'cc.field.creator_notes': 'Creator Notes',
            'cc.field.creator': 'Creator',
            'cc.field.version': 'Version',
            'cc.lorebook_imported': '📖 Lorebook from "{name}" imported! ({count} entries)',

            // Showcase
            'sc.add_from_editor': 'Add from Editor',
            'sc.upload_json': 'Upload JSON',
            'sc.no_presets_editor': 'No presets in editor yet',
            'sc.no_presets': 'No presets in showcase. Upload or add from editor.',
            'sc.select_preset': 'Select Preset to Add',
            'sc.add_desc': 'Add a description:',
            'sc.add_tags': 'Tags (comma separated):',
            'sc.added': '"{name}" added to showcase!',
            'sc.downloaded': 'Downloaded!',
            'sc.remove_confirm': 'Remove "{name}" from showcase?',
            'sc.preset_detail': 'Preset Detail',
            'sc.no_description': 'No description',
            'sc.prompts_count': '{count} prompts',

            // Worldbook
            'wb.worlds_tab': 'Worlds',
            'wb.entries_tab': 'Entries',
            'wb.select_entry': 'Select an entry to edit',
            'wb.new_world': 'New World',
            'wb.new_entry': 'New Entry',
            'wb.search': 'Search entries...',
            'wb.world_name_prompt': 'World name:',
            'wb.rename_prompt': 'Rename world:',
            'wb.delete_confirm': 'Delete world "{name}" and all its entries?',
            'wb.entry_delete_confirm': 'Delete entry "{name}"?',
            'wb.select_world': 'Select or create a world to start',
            'wb.no_entries': 'No entries yet. Click "New Entry" to add one.',
            'wb.no_match': 'No entries match your search',
            'wb.no_selected': 'No entries selected',
            'wb.imported': 'World imported!',
            'wb.exported': 'World exported!',
            'wb.import_failed': 'Import failed: ',
            'wb.field.title': 'Title / Memo',
            'wb.field.keywords': 'Primary Keywords',
            'wb.field.position': 'Position',
            'wb.field.logic': 'Logic',
            'wb.field.depth': 'Depth',
            'wb.field.order': 'Order',
            'wb.field.trigger': 'Trigger %',
            'wb.field.optional_filter': 'Optional Filter',
            'wb.field.inclusion_group': 'Inclusion Group',
            'wb.field.group_weight': 'Group Weight',
            'wb.field.sticky': 'Sticky',
            'wb.field.cooldown': 'Cooldown',
            'wb.field.content': 'Content',
            'wb.field.case_sensitive': 'Case Sensitive',
            'wb.field.whole_words': 'Whole Words',
            'wb.field.non_recursable': 'Non-Recursable',
            'wb.field.prevent_recursion': 'Prevent Recursion',
            'wb.field.ignore_budget': 'Ignore Budget',
            'wb.field.prioritize': 'Prioritize',
            'wb.pos.before_char': 'Before Char Defs',
            'wb.pos.after_char': 'After Char Defs',
            'wb.pos.before_an': 'Before AN',
            'wb.pos.after_an': 'After AN',
            'wb.pos.at_depth': '↕ At Depth',
            'wb.translate': '🌐 Translate',
            'wb.translate_to': 'Translate to {lang}',
            'wb.lang.english': 'English',
            'wb.lang.chinese': '中文 (Chinese)',
            'wb.lang.vietnamese': 'Tiếng Việt',
            'wb.lang.japanese': '日本語 (Japanese)',
            'wb.lang.korean': '한국어 (Korean)',
            'wb.translation_settings': '🌐 Translation Settings',
            'wb.translation_prompt_label': 'Translation Prompt',
            'wb.translation_prompt_hint': 'Use {language} as placeholder for the target language. The text to translate will be sent as user message.',
            'wb.translating': 'Translating...',
            'wb.translate_done': '✅ Translated!',
            'wb.translate_error': '❌ Translation failed: ',
            'wb.translate_no_api': '⚠️ Please configure API key in Playground settings first.',
            'wb.translate_settings_btn': '⚙️ Settings',

            // Playground
            'pg.clear': 'Clear',
            'pg.settings': 'Settings',
            'pg.clear_confirm': 'Clear all messages?',
            'pg.placeholder': 'Type your message...',
            'pg.empty': 'Start a conversation. Configure API settings in the right panel.',
            'pg.api_settings': '⚙️ API Settings',
            'pg.endpoint': 'Endpoint URL',
            'pg.api_key': 'API Key',
            'pg.model': 'Model',
            'pg.temperature': 'Temperature',
            'pg.max_tokens': 'Max Tokens',
            'pg.save_settings': 'Save Settings',
            'pg.system_instruction': '📝 System Instruction',
            'pg.sys_placeholder': 'System instruction for the AI...',
            'pg.settings_saved': 'API settings saved!',
            'pg.no_api_key': '⚠️ Please configure your API key in the settings panel.',

            // Persona
            'ps.new_persona': 'New Persona',
            'ps.from_template': 'From Template',
            'ps.no_templates': 'No templates yet. Create one first!',
            'ps.persona_name': 'Persona name:',
            'ps.create_select': 'Create or select a persona',
            'ps.click_avatar': 'Click to change avatar',
            'ps.field.name': 'Name',
            'ps.field.description': 'Description',
            'ps.field.personality': 'Personality',
            'ps.field.scenario': 'Scenario',
            'ps.desc_placeholder': 'Describe this persona...',
            'ps.personality_placeholder': 'Personality traits...',
            'ps.scenario_placeholder': 'Default scenario...',
            'ps.create_template': 'Create Template',
            'ps.templates_title': '📋 Persona Templates',
            'ps.templates_hint': 'Click a template to create a new persona from it',
            'ps.no_templates_yet': 'No templates yet. Click "Create Template" to save current persona as template.',
            'ps.copy_as_persona': 'Copy as Persona',
            'ps.template_created': 'Template created!',
            'ps.from_template_created': 'Persona created from template!',
            'ps.delete_confirm': 'Delete persona "{name}"?',
            'ps.delete_tpl_confirm': 'Delete template "{name}"?',
            'ps.choose_template': 'Choose Template',
        },

        vi: {
            // Sidebar tooltips
            'nav.preset_editor': 'Trình chỉnh sửa Preset',
            'nav.character_card': 'Thẻ Nhân vật',
            'nav.preset_showcase': 'Trưng bày Preset',
            'nav.worldbook': 'Sách Thế giới',
            'nav.playground': 'Sân chơi',
            'nav.persona': 'Nhân cách Người dùng',

            // Tab headers
            'tab.preset_editor': 'Trình chỉnh sửa Preset',
            'tab.character_card': 'Thẻ Nhân vật',
            'tab.preset_showcase': 'Trưng bày Preset',
            'tab.worldbook': 'Sách Thế giới / Lorebook',
            'tab.playground': 'Sân chơi',
            'tab.persona': 'Nhân cách Người dùng',

            // Common
            'btn.import': 'Nhập',
            'btn.export': 'Xuất',
            'btn.delete': 'Xóa',
            'btn.rename': 'Đổi tên',
            'btn.save': 'Lưu',
            'btn.cancel': 'Hủy',
            'btn.confirm': 'Xác nhận',
            'btn.clear': 'Xóa sạch',
            'btn.settings': 'Cài đặt',
            'btn.enable': 'Bật',
            'btn.disable': 'Tắt',
            'btn.all': 'Tất cả',
            'autosave': 'Đã tự động lưu',

            // Preset Editor
            'pe.new_preset': 'Preset mới',
            'pe.add_prompt': 'Thêm Prompt',
            'pe.prompt_chain': 'Chuỗi Prompt',
            'pe.prompt_name_default': 'Prompt mới',
            'pe.prompt_placeholder': 'Nhập nội dung prompt...',
            'pe.new_preset_prompt': 'Tên preset mới:',
            'pe.rename_prompt': 'Đổi tên preset:',
            'pe.delete_confirm': 'Xóa preset "{name}"?',
            'pe.delete_prompt_confirm': 'Xóa prompt "{name}"?',
            'pe.no_preset': 'Chưa chọn preset. Hãy tạo mới hoặc chọn một preset.',
            'pe.imported': 'Đã nhập preset!',
            'pe.exported': 'Đã xuất preset!',
            'pe.import_failed': 'Nhập thất bại: ',
            'pe.role.system': 'Hệ thống',
            'pe.role.user': 'Người dùng',
            'pe.role.assistant': 'Trợ lý',
            'pe.move_up': 'Di chuyển lên',
            'pe.move_down': 'Di chuyển xuống',

            // Character Card
            'cc.upload_card': 'Tải lên Thẻ',
            'cc.search': 'Tìm nhân vật...',
            'cc.drop_hint': 'Kéo thả ảnh PNG thẻ nhân vật vào đây<br>hoặc nhấn để tải lên',
            'cc.no_chars': 'Chưa có nhân vật nào',
            'cc.empty_hint': 'Tải lên thẻ nhân vật (PNG có dữ liệu nhúng) hoặc chọn từ thư viện.',
            'cc.delete_confirm': 'Xóa nhân vật "{name}"?',
            'cc.imported': 'Đã nhập nhân vật "{name}"!',
            'cc.exported': 'Đã xuất nhân vật!',
            'cc.import_failed': 'Không thể nhập: ',
            'cc.added_image': 'Đã thêm nhân vật từ ảnh!',
            'cc.no_chara_data': 'Không tìm thấy dữ liệu nhân vật trong PNG. Đây không phải thẻ nhân vật hợp lệ.',
            'cc.field.description': 'Mô tả',
            'cc.field.personality': 'Tính cách',
            'cc.field.first_mes': 'Tin nhắn đầu tiên',
            'cc.field.scenario': 'Tình huống',
            'cc.field.mes_example': 'Ví dụ tin nhắn',
            'cc.field.system_prompt': 'Prompt hệ thống',
            'cc.field.creator_notes': 'Ghi chú tác giả',
            'cc.field.creator': 'Tác giả',
            'cc.field.version': 'Phiên bản',
            'cc.lorebook_imported': '📖 Đã nhập Lorebook từ "{name}"! ({count} mục)',

            // Showcase
            'sc.add_from_editor': 'Thêm từ Editor',
            'sc.upload_json': 'Tải lên JSON',
            'sc.no_presets_editor': 'Chưa có preset nào trong editor',
            'sc.no_presets': 'Chưa có preset trong trưng bày. Tải lên hoặc thêm từ editor.',
            'sc.select_preset': 'Chọn Preset để thêm',
            'sc.add_desc': 'Thêm mô tả:',
            'sc.add_tags': 'Nhãn (phân tách bởi dấu phẩy):',
            'sc.added': 'Đã thêm "{name}" vào trưng bày!',
            'sc.downloaded': 'Đã tải xuống!',
            'sc.remove_confirm': 'Xóa "{name}" khỏi trưng bày?',
            'sc.preset_detail': 'Chi tiết Preset',
            'sc.no_description': 'Chưa có mô tả',
            'sc.prompts_count': '{count} prompt',

            // Worldbook
            'wb.worlds_tab': 'Thế giới',
            'wb.entries_tab': 'Mục',
            'wb.select_entry': 'Chọn một mục để chỉnh sửa',
            'wb.new_world': 'Thế giới mới',
            'wb.new_entry': 'Mục mới',
            'wb.search': 'Tìm kiếm mục...',
            'wb.world_name_prompt': 'Tên thế giới:',
            'wb.rename_prompt': 'Đổi tên thế giới:',
            'wb.delete_confirm': 'Xóa thế giới "{name}" và tất cả các mục?',
            'wb.entry_delete_confirm': 'Xóa mục "{name}"?',
            'wb.select_world': 'Chọn hoặc tạo thế giới để bắt đầu',
            'wb.no_entries': 'Chưa có mục nào. Nhấn "Mục mới" để thêm.',
            'wb.no_match': 'Không có mục khớp tìm kiếm',
            'wb.no_selected': 'Chưa chọn mục nào',
            'wb.imported': 'Đã nhập thế giới!',
            'wb.exported': 'Đã xuất thế giới!',
            'wb.import_failed': 'Nhập thất bại: ',
            'wb.field.title': 'Tiêu đề / Ghi chú',
            'wb.field.keywords': 'Từ khóa chính',
            'wb.field.position': 'Vị trí',
            'wb.field.logic': 'Logic',
            'wb.field.depth': 'Độ sâu',
            'wb.field.order': 'Thứ tự',
            'wb.field.trigger': 'Kích hoạt %',
            'wb.field.optional_filter': 'Bộ lọc tùy chọn',
            'wb.field.inclusion_group': 'Nhóm bao gồm',
            'wb.field.group_weight': 'Trọng số nhóm',
            'wb.field.sticky': 'Ghim',
            'wb.field.cooldown': 'Hồi lại',
            'wb.field.content': 'Nội dung',
            'wb.field.case_sensitive': 'Phân biệt hoa thường',
            'wb.field.whole_words': 'Toàn bộ từ',
            'wb.field.non_recursable': 'Không đệ quy',
            'wb.field.prevent_recursion': 'Ngăn đệ quy',
            'wb.field.ignore_budget': 'Bỏ qua ngân sách',
            'wb.field.prioritize': 'Ưu tiên',
            'wb.pos.before_char': 'Trước Nhân vật',
            'wb.pos.after_char': 'Sau Nhân vật',
            'wb.pos.before_an': 'Trước AN',
            'wb.pos.after_an': 'Sau AN',
            'wb.pos.at_depth': '↕ Tại Độ sâu',
            'wb.translate': '🌐 Dịch',
            'wb.translate_to': 'Dịch sang {lang}',
            'wb.lang.english': 'English',
            'wb.lang.chinese': '中文 (Tiếng Trung)',
            'wb.lang.vietnamese': 'Tiếng Việt',
            'wb.lang.japanese': '日本語 (Tiếng Nhật)',
            'wb.lang.korean': '한국어 (Tiếng Hàn)',
            'wb.translation_settings': '🌐 Cài đặt Dịch thuật',
            'wb.translation_prompt_label': 'Prompt Dịch thuật',
            'wb.translation_prompt_hint': 'Dùng {language} làm placeholder cho ngôn ngữ đích. Văn bản cần dịch sẽ được gửi dưới dạng tin nhắn user.',
            'wb.translating': 'Đang dịch...',
            'wb.translate_done': '✅ Đã dịch xong!',
            'wb.translate_error': '❌ Dịch thất bại: ',
            'wb.translate_no_api': '⚠️ Vui lòng cấu hình API key trong cài đặt Playground trước.',
            'wb.translate_settings_btn': '⚙️ Cài đặt',

            // Playground
            'pg.clear': 'Xóa sạch',
            'pg.settings': 'Cài đặt',
            'pg.clear_confirm': 'Xóa tất cả tin nhắn?',
            'pg.placeholder': 'Nhập tin nhắn...',
            'pg.empty': 'Bắt đầu cuộc trò chuyện. Cấu hình API ở panel bên phải.',
            'pg.api_settings': '⚙️ Cài đặt API',
            'pg.endpoint': 'Đường dẫn API',
            'pg.api_key': 'Khóa API',
            'pg.model': 'Mô hình',
            'pg.temperature': 'Nhiệt độ',
            'pg.max_tokens': 'Token tối đa',
            'pg.save_settings': 'Lưu cài đặt',
            'pg.system_instruction': '📝 Chỉ dẫn Hệ thống',
            'pg.sys_placeholder': 'Chỉ dẫn hệ thống cho AI...',
            'pg.settings_saved': 'Đã lưu cài đặt API!',
            'pg.no_api_key': '⚠️ Vui lòng cấu hình khóa API trong panel cài đặt.',

            // Persona
            'ps.new_persona': 'Persona mới',
            'ps.from_template': 'Từ Mẫu',
            'ps.no_templates': 'Chưa có mẫu. Hãy tạo một mẫu trước!',
            'ps.persona_name': 'Tên persona:',
            'ps.create_select': 'Tạo hoặc chọn một persona',
            'ps.click_avatar': 'Nhấn để đổi avatar',
            'ps.field.name': 'Tên',
            'ps.field.description': 'Mô tả',
            'ps.field.personality': 'Tính cách',
            'ps.field.scenario': 'Tình huống',
            'ps.desc_placeholder': 'Mô tả persona này...',
            'ps.personality_placeholder': 'Đặc điểm tính cách...',
            'ps.scenario_placeholder': 'Tình huống mặc định...',
            'ps.create_template': 'Tạo Mẫu',
            'ps.templates_title': '📋 Mẫu Persona',
            'ps.templates_hint': 'Nhấn vào mẫu để tạo persona mới từ đó',
            'ps.no_templates_yet': 'Chưa có mẫu. Nhấn "Tạo Mẫu" để lưu persona hiện tại làm mẫu.',
            'ps.copy_as_persona': 'Sao chép thành Persona',
            'ps.template_created': 'Đã tạo mẫu!',
            'ps.from_template_created': 'Đã tạo persona từ mẫu!',
            'ps.delete_confirm': 'Xóa persona "{name}"?',
            'ps.delete_tpl_confirm': 'Xóa mẫu "{name}"?',
            'ps.choose_template': 'Chọn Mẫu',
        },
    };

    function t(key, replacements = {}) {
        let text = translations[currentLang]?.[key] || translations['en']?.[key] || key;
        for (const [k, v] of Object.entries(replacements)) {
            text = text.replace(`{${k}}`, v);
        }
        return text;
    }

    function getLang() {
        return currentLang;
    }

    function setLang(lang) {
        if (lang !== 'en' && lang !== 'vi') return;
        currentLang = lang;
        localStorage.setItem(STORAGE_KEY, lang);
        // Re-render all modules
        updateStaticUI();
        PresetEditor.init();
        CharacterCard.init();
        PresetShowcase.init();
        Worldbook.init();
        Playground.init();
        Persona.init();
    }

    function toggleLang() {
        setLang(currentLang === 'en' ? 'vi' : 'en');
    }

    // Update static HTML elements that have data-i18n attributes
    function updateStaticUI() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const attr = el.dataset.i18nAttr;
            if (attr === 'placeholder') {
                el.placeholder = t(key);
            } else if (attr === 'title') {
                el.title = t(key);
            } else {
                el.innerHTML = t(key);
            }
        });
        // Update lang toggle button label
        const langBtn = document.getElementById('lang-toggle-label');
        if (langBtn) langBtn.textContent = currentLang === 'en' ? 'VI' : 'EN';

        // Update autosave text
        const autosave = document.getElementById('autosave-indicator');
        if (autosave) {
            const span = autosave.querySelector('span:last-child');
            if (span) span.textContent = t('autosave');
        }
    }

    return { t, getLang, setLang, toggleLang, updateStaticUI };
})();
