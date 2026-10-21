/**
 * @file FkmImport.gs
 * Kemasukan data pukal ke modul STAF / CAPAIAN:
 *   1. fromLegacySheet — import BACA SAHAJA daripada Google Sheet sistem lama (STAFF_PROFILE + USER_ACCESS).
 *      Sheet lama tidak pernah ditulis. Selamat dijalankan berulang kali (upsert ikut Staff ID / e-mel).
 *   2. saveCv — simpan hasil Auto-Extract CV (dari pelayar) ke rekod staf sedia ada.
 * Data peribadi TIDAK disimpan dalam kod/repo — ia dibaca terus dari Sheet pemilik.
 */
const FkmImport = {
  /** Lajur STAFF_PROFILE lama → kunci medan modul staf. */
  LEGACY_STAFF_MAP: function () {
    return {
      staff_id: 'staffId', title: 'gelaran', name: 'nama', email: 'email', phone: 'telefon', department: 'jabatan',
      position: 'jawatan', grade: 'gred', admin_position: 'jawatanPentadbiran', target_position: 'sasaran',
      highest_qualification: 'kelayakan', expertise_area: 'bidangKepakaran', niche_area: 'nicheArea',
      research_alliance: 'researchAlliance', rg: 'rgNama', rg_code: 'rgKod', rg_role: 'rgPeranan', inst: 'institut',
      coerole: 'peranCoe', newrg: 'rgBaharu', status2: 'statusPerkhidmatan', citizenship: 'warganegara', country: 'negara',
      first_appointment: 'lantikanPertama', appointment_date: 'lantikanSemasa', service_end: 'tamatPerkhidmatan',
      dob: 'tarikhLahir', age: 'umur', cohort: 'kohort', years_of_service: 'tempohKhidmat', scopus_id: 'scopusId',
      pub: 'pub', q0: 'q0', q1: 'q1', q2: 'q2', q3: 'q3', q4: 'q4', scopus_count: 'scopusCount', wos: 'wos', cit: 'sitasi',
      hindex: 'hIndex', grants: 'geran', active_grants: 'geranAktif', pi: 'geranPi', funding: 'dana',
      phd_sup: 'phdSelia', phd_done: 'phdTamat', ms_sup: 'sarjanaSelia', ms_done: 'sarjanaTamat',
      teach_ug: 'jamAjarUg', teach_pg: 'jamAjarPg', train_hours: 'jamLatihan', mandatory_done: 'latihanWajib',
      consult_projects: 'projekPerundingan', perundingan_amount: 'nilaiPerundingan', viva_internal: 'vivaDalaman',
      viva_external: 'vivaLuar', grant_evaluator: 'penilaiGeran', journal_reviewer: 'pewasitJurnal',
      comm_intl: 'jkAntarabangsa', comm_natl: 'jkKebangsaan', comm_univ: 'jkUniversiti', comm_fac: 'jkFakulti',
      chair_count: 'pengerusiSesi', award_intl: 'anugerahAntarabangsa', award_natl: 'anugerahKebangsaan',
      award_utm: 'anugerahUtm', copyright: 'hakCipta', lppt_2025: 'lppt2025', lppt_2024: 'lppt2024', lppt_2023: 'lppt2023'
    };
  },

  LEGACY_TRAINING: function () {
    return {
      'Teaching & Learning': 'latihanPdp', 'Research': 'latihanPenyelidikan', 'Artificial Intelligence': 'latihanAi',
      'Digital Transformation': 'latihanDigital', 'Leadership': 'latihanKepimpinan', 'Professional Development': 'latihanProfesional'
    };
  },

  /** Status staf lama → status modul. */
  legacyStatus: function (v) {
    const s = String(v || '').trim().toUpperCase();
    if (!s || s === 'ACTIVE' || s === 'AKTIF') return 'AKTIF';
    if (s === 'BERSARA' || s === 'RETIRED') return 'BERSARA';
    if (s === 'RESIGNED') return 'LETAK_JAWATAN';
    if (s === 'TAMAT') return 'TAMAT_KONTRAK';
    return 'TIDAK_AKTIF';
  },

  /** Normalkan Staff ID (Sheets menyimpan 8294 sebagai 8294.0). */
  normId: function (v) {
    const s = String(v === undefined || v === null ? '' : v).trim();
    return /^\d+(\.0+)?$/.test(s) ? String(parseInt(s, 10)) : s;
  },

  /** Baca sheet → objek { header_huruf_kecil: nilai }. Tarikh → YYYY-MM-DD. */
  readSheet: function (ss, name) {
    const sh = ss.getSheetByName(name);
    if (!sh) return [];
    const values = sh.getDataRange().getValues();
    if (values.length < 2) return [];
    const head = values[0].map(function (h) { return String(h).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); });
    return values.slice(1).filter(function (r) { return r.join('').trim() !== ''; }).map(function (r) {
      const o = {};
      head.forEach(function (h, i) {
        const v = r[i];
        o[h] = (v instanceof Date) ? Utilities.formatDate(v, DateUtils.tz(), 'yyyy-MM-dd') : v;
      });
      return o;
    });
  },

  /**
   * Bersihkan item: setiap medan disahkan BERASINGAN — nilai tidak sah dibuang (dengan amaran), bukan menggagalkan
   * seluruh baris. Medan readonly/files dan medan yang tidak wujud diabaikan.
   */
  sanitize: function (def, item, warnings, label) {
    const out = {};
    def.fields.forEach(function (f) {
      if (f.readonly || f.type === 'files' || !Object.prototype.hasOwnProperty.call(item, f.key)) return;
      const v = item[f.key];
      if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) return;
      try {
        Validator.coerce(v, CrudEngine.fieldRule(f, false), f.label);
        out[f.key] = typeof v === 'string' ? v.trim() : v;
      } catch (e) {
        warnings.push(label + ': ' + f.label + ' "' + String(v).slice(0, 40) + '" diabaikan (' + e.message + ')');
      }
    });
    return out;
  },

  /**
   * Import daripada Sheet sistem lama (baca sahaja).
   * @param {string} sheetId ID Google Sheet lama
   * @return {{staf:Object, capaian:Object, warnings:string[]}}
   */
  fromLegacySheet: function (sheetId, ctx) {
    if (!/^[A-Za-z0-9_-]{10,100}$/.test(String(sheetId || ''))) throw Errors.validation('ID Google Sheet tidak sah.');
    let ss;
    try { ss = SpreadsheetApp.openById(sheetId); } catch (e) { throw Errors.validation('Sheet tidak dapat dibuka. Pastikan akaun pemilik skrip ini mempunyai akses kepadanya.'); }

    const warnings = [];
    const map = FkmImport.LEGACY_STAFF_MAP();
    const trainMap = FkmImport.LEGACY_TRAINING();
    const stafDef = CrudEngine.get('staf');

    const staffItems = FkmImport.readSheet(ss, 'STAFF_PROFILE').map(function (r) {
      const it = {};
      Object.keys(map).forEach(function (col) { if (r[col] !== undefined) it[map[col]] = r[col]; });
      it.staffId = FkmImport.normId(r.staff_id);
      if (it.rgPeranan) it.rgPeranan = String(it.rgPeranan).toUpperCase();
      if (it.latihanWajib !== undefined && it.latihanWajib !== '') it.latihanWajib = it.latihanWajib === true || String(it.latihanWajib).toUpperCase() === 'TRUE';
      ['tempohKhidmat', 'umur'].forEach(function (k) { if (it[k] !== '' && it[k] !== undefined) it[k] = Math.round(Number(it[k])); });
      try {
        const tr = r.training_json ? JSON.parse(r.training_json) : {};
        Object.keys(trainMap).forEach(function (c) { if (tr[c] !== undefined) it[trainMap[c]] = tr[c]; });
      } catch (e) { warnings.push(it.staffId + ': training_json tidak sah'); }
      try {
        const pt = r.pubtrend_json ? JSON.parse(r.pubtrend_json) : {};
        Object.keys(pt).forEach(function (y) { if (/^20(2[0-5])$/.test(y)) it['pub' + y] = pt[y]; });
      } catch (e) { warnings.push(it.staffId + ': pubtrend_json tidak sah'); }
      const clean = FkmImport.sanitize(stafDef, it, warnings, 'Staf ' + it.staffId);
      clean._status = FkmImport.legacyStatus(r.status);
      return clean;
    }).filter(function (it) { return it.staffId; });

    const staf = CrudEngine.bulkUpsert(stafDef, ctx, staffItems, {
      keyField: 'staffId', onlyFilled: true,
      extra: function (it) { return { sumber_data: 'IMPORT', status: it._status }; }
    });

    const capDef = CrudEngine.get('capaian');
    const promote = [];
    const capItems = FkmImport.readSheet(ss, 'USER_ACCESS').map(function (r) {
      let role = String(r.role || '').toUpperCase();
      if (role === 'ADMIN') { promote.push(String(r.email || '').toLowerCase()); role = 'DEAN'; }
      if (FkmAccess.ROLES.indexOf(role) < 0) role = 'STAFF';
      const it = FkmImport.sanitize(capDef, {
        email: String(r.email || '').trim().toLowerCase(), nama: r.name, peranan: role,
        skop: role === 'STAFF' ? FkmImport.normId(r.scope) : String(r.scope || '').trim()
      }, warnings, 'Capaian ' + r.email);
      it._status = String(r.status || '').toUpperCase() === 'ACTIVE' ? 'AKTIF' : 'TIDAK_AKTIF';
      return it;
    }).filter(function (it) { return it.email; });
    const capaian = CrudEngine.bulkUpsert(capDef, ctx, capItems, {
      keyField: 'email', onlyFilled: true, extra: function (it) { return { status: it._status }; }
    });
    if (promote.length) warnings.unshift('Akaun ADMIN lama diimport sebagai DEAN. Selepas mereka mendaftar, naikkan ke ADMIN di menu Pengguna: ' + promote.join(', '));
    return { staf: staf, capaian: capaian, warnings: warnings.slice(0, 200) };
  },

  /** Hasil extractCVfields() (pelayar) → medan staf. Sama seperti buildCVFieldMap_() sistem lama. */
  cvToFields: function (cv) {
    const n = function (v) { const x = Number(v); return isFinite(x) ? x : 0; };
    const has = function (v) { return v !== undefined && v !== null && v !== ''; };
    const o = {
      staffId: FkmImport.normId(cv.staff_id),
      pub: n(cv.pub_wos) + n(cv.pub_scopus) + n(cv.pub_conf) + n(cv.pub_book),
      geran: n(cv.grant_pi) + n(cv.grant_member),
      dana: Math.round((n(cv.funding_pi) + n(cv.funding_member)) * 100) / 100,
      phdSelia: n(cv.phd_grad) + n(cv.phd_ongoing)
    };
    const direct = {
      name: 'nama', email: 'email', scopus_id: 'scopusId', q0: 'q0', q1: 'q1', q2: 'q2', q3: 'q3', q4: 'q4',
      phd_grad: 'phdTamat', master: 'sarjanaSelia', teach_ug: 'jamAjarUg', teach_pg: 'jamAjarPg', grant_pi: 'geranPi',
      consult_proj: 'projekPerundingan', consult_rm: 'nilaiPerundingan', award_intl: 'anugerahAntarabangsa',
      award_natl: 'anugerahKebangsaan', award_utm: 'anugerahUtm', comm_intl: 'jkAntarabangsa', comm_natl: 'jkKebangsaan',
      comm_univ: 'jkUniversiti', comm_fac: 'jkFakulti', viva_int: 'vivaDalaman', viva_ext: 'vivaLuar',
      copyright: 'hakCipta', chair_count: 'pengerusiSesi', lppt_2025: 'lppt2025', lppt_2024: 'lppt2024', lppt_2023: 'lppt2023'
    };
    Object.keys(direct).forEach(function (k) { if (has(cv[k])) o[direct[k]] = cv[k]; });
    return o;
  },

  /**
   * Simpan kelompok CV. Hanya kemas kini staf SEDIA ADA (staf baharu perlu dicipta dahulu kerana jabatan wajib).
   * @return {{updated:number, unchanged:number, errors:Object[], warnings:string[]}}
   */
  saveCv: function (items, ctx) {
    if (!Array.isArray(items) || !items.length) throw Errors.validation('Tiada data CV untuk disimpan.');
    if (items.length > 20) throw Errors.validation('Maksimum 20 CV sekali simpan.');
    const def = CrudEngine.get('staf');
    const existing = {};
    CrudEngine.repo(def).all().forEach(function (r) { if (r.state === RECORD_STATE.ACTIVE) existing[String(r.staff_id)] = true; });
    const warnings = [];
    const errors = [];
    const clean = [];
    items.forEach(function (cv, i) {
      if (!cv || typeof cv !== 'object' || cv._summary !== true) { errors.push({ index: i, key: '', message: 'Bukan CV Summary Report — ditolak.' }); return; }
      const f = FkmImport.cvToFields(cv);
      if (!/^\d{1,8}$/.test(f.staffId)) { errors.push({ index: i, key: f.staffId, message: 'Staff ID tidak sah.' }); return; }
      if (!existing[f.staffId]) { errors.push({ index: i, key: f.staffId, message: 'Staff ID belum wujud — tambah staf dahulu di menu Staf Akademik.' }); return; }
      clean.push(FkmImport.sanitize(def, f, warnings, 'CV ' + f.staffId));
    });
    const today = Utilities.formatDate(new Date(), DateUtils.tz(), 'yyyy-MM-dd');
    const res = clean.length ? CrudEngine.bulkUpsert(def, ctx, clean, {
      keyField: 'staffId', onlyFilled: true, extra: function () { return { sumber_data: 'CV', cv_dikemaskini: today }; }
    }) : { added: 0, updated: 0, unchanged: 0, errors: [] };
    return { updated: res.updated, unchanged: res.unchanged, errors: errors.concat(res.errors), warnings: warnings };
  }
};
