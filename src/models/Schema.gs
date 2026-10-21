/**
 * @file Schema.gs
 * SATU sumber kebenaran untuk struktur setiap sheet.
 * SheetManager mencipta header daripada sini; RepositoryBase menukar jenis data berdasarkan `types`.
 *
 * Semua sel disimpan sebagai TEKS (format '@') — elak Sheets menukar ISO date/nombor telefon secara automatik.
 * Jenis: 'bool' | 'int' | (lalai) string.
 */
const SCHEMA = Object.freeze({
  USERS: {
    sheet: 'USERS', id: 'user_id', prefix: 'U',
    columns: ['user_id', 'email', 'full_name', 'phone', 'photo_url', 'role', 'status', 'auth_provider',
      'created_at', 'updated_at', 'last_login_at'],
    types: {}
  },
  /** Dipisahkan daripada USERS supaya hash tidak terdedah jika USERS dikongsi. Sheet ini disembunyi & dilindungi. */
  CREDENTIALS: {
    sheet: 'CREDENTIALS', id: 'user_id', hidden: true, protect: true,
    columns: ['user_id', 'password_hash', 'updated_at'],
    types: {}
  },
  /** session_id = SHA-256(token). Token mentah TIDAK pernah disimpan. */
  SESSIONS: {
    sheet: 'SESSIONS', id: 'session_id', hidden: true, protect: true,
    columns: ['session_id', 'user_id', 'expires_at', 'created_at', 'user_agent_hash', 'revoked_at'],
    types: {}
  },
  CATEGORIES: {
    sheet: 'CATEGORIES', id: 'category_id', prefix: 'C',
    columns: ['category_id', 'name_ms', 'name_en', 'description', 'icon', 'sort_order', 'status', 'created_at', 'updated_at'],
    types: { sort_order: 'int' }
  },
  /** Lampiran untuk SEMUA modul (module + record_id). Fail sebenar di Drive peribadi. */
  ATTACHMENTS: {
    sheet: 'ATTACHMENTS', id: 'attachment_id', prefix: 'A',
    columns: ['attachment_id', 'module', 'record_id', 'field', 'uploader_user_id', 'drive_file_id', 'filename', 'mime_type', 'size_bytes', 'status', 'created_at'],
    types: { size_bytes: 'int' }
  },
  /** Token peranti FCM untuk notifikasi telefon. Dilindungi — token ialah alamat penghantaran. */
  PUSH_TOKENS: {
    sheet: 'PUSH_TOKENS', id: 'token_id', prefix: 'K', hidden: true, protect: true,
    columns: ['token_id', 'user_id', 'token', 'platform', 'user_agent', 'status', 'created_at', 'last_seen_at'],
    types: {}
  },
  NOTIFICATIONS: {
    sheet: 'NOTIFICATIONS', id: 'notification_id', prefix: 'N',
    columns: ['notification_id', 'user_id', 'type', 'title', 'message', 'reference_id', 'is_read', 'created_at'],
    types: { is_read: 'bool' }
  },
  AUDIT_LOGS: {
    sheet: 'AUDIT_LOGS', id: 'log_id', prefix: 'L',
    columns: ['log_id', 'user_id', 'role', 'action', 'module', 'reference_id', 'description', 'ip_hash', 'user_agent', 'created_at'],
    types: {}
  },
  SETTINGS: {
    sheet: 'SETTINGS', id: 'setting_key',
    columns: ['setting_key', 'setting_value', 'description', 'updated_by', 'updated_at'],
    types: {}
  },
  SYSTEM_LOGS: {
    sheet: 'SYSTEM_LOGS', id: 'log_id', prefix: 'S',
    columns: ['log_id', 'level', 'error_id', 'action', 'message', 'context', 'created_at'],
    types: {}
  },
  FEEDBACK: {
    sheet: 'FEEDBACK', id: 'feedback_id', prefix: 'B',
    columns: ['feedback_id', 'user_id', 'name', 'email', 'message', 'status', 'created_at', 'updated_at'],
    types: {}
  },
  MIGRATIONS: {
    sheet: 'MIGRATIONS', id: 'migration_id',
    columns: ['migration_id', 'description', 'applied_at', 'applied_by'],
    types: {}
  },

  // ===================================================================== MODUL
  // Blok di bawah DIJANA oleh `npm run gen` daripada modules/*.json — jangan sunting dengan tangan.
  // @generator:schema:start
  STAF: {
    sheet: 'STAF', id: 'id', prefix: 'SF', module: 'staf',
    columns: ['id', 'ref_no', 'owner_user_id', 'owner_name', 'staff_id', 'gelaran', 'nama', 'email', 'telefon', 'jabatan', 'jawatan', 'gred', 'jawatan_pentadbiran', 'sasaran', 'kelayakan', 'bidang_kepakaran', 'niche_area', 'research_alliance', 'rg_nama', 'rg_kod', 'rg_peranan', 'institut', 'peran_coe', 'rg_baharu', 'status_perkhidmatan', 'warganegara', 'negara', 'lantikan_pertama', 'lantikan_semasa', 'tamat_perkhidmatan', 'tarikh_lahir', 'umur', 'kohort', 'tempoh_khidmat', 'scopus_id', 'pub', 'q0', 'q1', 'q2', 'q3', 'q4', 'scopus_count', 'wos', 'sitasi', 'h_index', 'pub2020', 'pub2021', 'pub2022', 'pub2023', 'pub2024', 'pub2025', 'geran', 'geran_aktif', 'geran_pi', 'dana', 'phd_selia', 'phd_tamat', 'sarjana_selia', 'sarjana_tamat', 'jam_ajar_ug', 'jam_ajar_pg', 'jam_latihan', 'latihan_wajib', 'latihan_pdp', 'latihan_penyelidikan', 'latihan_ai', 'latihan_digital', 'latihan_kepimpinan', 'latihan_profesional', 'projek_perundingan', 'nilai_perundingan', 'viva_dalaman', 'viva_luar', 'penilai_geran', 'pewasit_jurnal', 'jk_antarabangsa', 'jk_kebangsaan', 'jk_universiti', 'jk_fakulti', 'pengerusi_sesi', 'anugerah_antarabangsa', 'anugerah_kebangsaan', 'anugerah_utm', 'hak_cipta', 'lppt2025', 'lppt2024', 'lppt2023', 'sumber_data', 'cv_dikemaskini', 'status', 'status_note', 'status_changed_at', 'status_changed_by', 'state', 'created_at', 'updated_at', 'deleted_at'],
    types: {'umur': 'intOrNull', 'tempoh_khidmat': 'intOrNull', 'pub': 'intOrNull', 'q0': 'intOrNull', 'q1': 'intOrNull', 'q2': 'intOrNull', 'q3': 'intOrNull', 'q4': 'intOrNull', 'scopus_count': 'intOrNull', 'wos': 'intOrNull', 'sitasi': 'intOrNull', 'h_index': 'intOrNull', 'pub2020': 'intOrNull', 'pub2021': 'intOrNull', 'pub2022': 'intOrNull', 'pub2023': 'intOrNull', 'pub2024': 'intOrNull', 'pub2025': 'intOrNull', 'geran': 'intOrNull', 'geran_aktif': 'intOrNull', 'geran_pi': 'intOrNull', 'phd_selia': 'intOrNull', 'phd_tamat': 'intOrNull', 'sarjana_selia': 'intOrNull', 'sarjana_tamat': 'intOrNull', 'jam_ajar_ug': 'intOrNull', 'jam_ajar_pg': 'intOrNull', 'latihan_wajib': 'bool', 'projek_perundingan': 'intOrNull', 'viva_dalaman': 'intOrNull', 'viva_luar': 'intOrNull', 'penilai_geran': 'intOrNull', 'pewasit_jurnal': 'intOrNull', 'jk_antarabangsa': 'intOrNull', 'jk_kebangsaan': 'intOrNull', 'jk_universiti': 'intOrNull', 'jk_fakulti': 'intOrNull', 'pengerusi_sesi': 'intOrNull', 'anugerah_antarabangsa': 'intOrNull', 'anugerah_kebangsaan': 'intOrNull', 'anugerah_utm': 'intOrNull', 'hak_cipta': 'intOrNull'}
  },
  CAPAIAN: {
    sheet: 'CAPAIAN', id: 'id', prefix: 'CP', module: 'capaian',
    columns: ['id', 'ref_no', 'owner_user_id', 'owner_name', 'email', 'nama', 'peranan', 'skop', 'catatan', 'status', 'status_note', 'status_changed_at', 'status_changed_by', 'state', 'created_at', 'updated_at', 'deleted_at'],
    types: {}
  },
  // @generator:schema:end
});

/**
 * Carian skema (SCHEMA + skema tambahan semasa runtime — digunakan oleh ujian untuk modul fixture).
 * Diselesaikan semasa panggilan, jadi tiada kebergantungan susunan muat.
 */
const SchemaRegistry = {
  extra: {},
  get: function (key) { return SCHEMA[key] || SchemaRegistry.extra[key]; }
};
