/**
 * @file FkmData.gs
 * Set data dashboard: baris STAF → objek staf ternormal + skor, dikira SEKALI dan dicache termampat.
 *
 * Prestasi (berbanding sistem lama):
 *  - Sistem lama cuba cache STAFF_PROFILE sebagai JSON mentah (~204 KB) — melebihi had CacheService 100 KB,
 *    jadi cache SENTIASA gagal secara senyap dan setiap panggilan membaca Sheet. getDashboardData() pula
 *    memanggil calculatePromotionScore() untuk setiap staf, dan setiap panggilan itu membaca Sheet sekali lagi
 *    (≈119 bacaan penuh bagi 118 staf).
 *  - Di sini set data (skor sudah dikira) dimampat gzip (~10× lebih kecil) dan disimpan dalam cache yang
 *    dibatalkan automatik apabila sheet STAF atau SETTINGS ditulis. Satu bacaan Sheet setiap perubahan data.
 */
const FkmCache = {
  CHUNK: 90000,

  /** Simpan objek termampat; dipecah kepada beberapa kunci jika perlu (had 100 KB setiap nilai). */
  put: function (key, value, ttl) {
    try {
      const packed = Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(JSON.stringify(value), 'application/json')).getBytes());
      const parts = [];
      for (let i = 0; i < packed.length; i += FkmCache.CHUNK) parts.push(packed.slice(i, i + FkmCache.CHUNK));
      const map = {};
      parts.forEach(function (p, i) { map[AppCache.PREFIX + key + ':' + i] = p; });
      map[AppCache.PREFIX + key + ':n'] = String(parts.length);
      AppCache.store().putAll(map, Math.min(21600, ttl || 600));
    } catch (e) {
      AppLogger.warn('FkmCache.put gagal', { key: key });
    }
  },

  get: function (key) {
    try {
      const store = AppCache.store();
      const n = Number(store.get(AppCache.PREFIX + key + ':n') || 0);
      if (!n) return null;
      const keys = [];
      for (let i = 0; i < n; i++) keys.push(AppCache.PREFIX + key + ':' + i);
      const got = store.getAll(keys);
      let packed = '';
      for (let i = 0; i < n; i++) { if (!got[keys[i]]) return null; packed += got[keys[i]]; }
      const blob = Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(packed), 'application/x-gzip'));
      return JSON.parse(blob.getDataAsString());
    } catch (e) {
      return null;
    }
  },

  remember: function (key, ttl, compute) {
    const hit = FkmCache.get(key);
    if (hit) return hit;
    const v = compute();
    FkmCache.put(key, v, ttl);
    return v;
  }
};

const FkmData = {
  def: function () { return CrudEngine.get('staf'); },

  /** Status rekod STAF yang dikira aktif (selainnya dikecualikan daripada KPI). */
  isActiveStatus: function (st) { return !st || st === 'AKTIF'; },

  /** Baris sheet (lajur snake_case) → objek staf ternormal untuk dashboard. Medan adminOnly tidak disertakan. */
  toStaff: function (r) {
    const n = function (v) { const x = Number(v); return isFinite(x) ? x : 0; };
    const s = function (v) { return v === undefined || v === null ? '' : String(v); };
    const b = function (v) { return v === true || String(v).toUpperCase() === 'TRUE'; };
    const trend = {};
    ['2020', '2021', '2022', '2023', '2024', '2025'].forEach(function (y) { trend[y] = n(r['pub' + y]); });
    const latihan = {
      pdp: n(r.latihan_pdp), penyelidikan: n(r.latihan_penyelidikan), ai: n(r.latihan_ai),
      digital: n(r.latihan_digital), kepimpinan: n(r.latihan_kepimpinan), profesional: n(r.latihan_profesional)
    };
    /* Jumlah jam: nilai disimpan, atau hasil tambah kategori jika kosong */
    const jam = s(r.jam_latihan) === '' ? Math.round(Object.keys(latihan).reduce(function (t, k) { return t + latihan[k]; }, 0) * 10) / 10 : n(r.jam_latihan);
    return {
      id: r.id, sid: s(r.staff_id), gelaran: s(r.gelaran), nama: s(r.nama), email: s(r.email),
      jabatan: s(r.jabatan), jawatan: s(r.jawatan), gred: s(r.gred), jp: s(r.jawatan_pentadbiran), sasaran: s(r.sasaran) || 'DS54',
      kelayakan: s(r.kelayakan), kepakaran: s(r.bidang_kepakaran), niche: s(r.niche_area), alliance: s(r.research_alliance),
      rg: s(r.rg_nama), rgKod: s(r.rg_kod), rgPeranan: s(r.rg_peranan), institut: s(r.institut), coe: s(r.peran_coe), rgBaru: s(r.rg_baharu),
      khidmat: s(r.status_perkhidmatan), warga: s(r.warganegara), negara: s(r.negara),
      lantikPertama: s(r.lantikan_pertama), lantikKini: s(r.lantikan_semasa), tamat: s(r.tamat_perkhidmatan),
      umur: n(r.umur), kohort: s(r.kohort), tempoh: s(r.tempoh_khidmat) === '' ? null : n(r.tempoh_khidmat), scopusId: s(r.scopus_id),
      status: s(r.status) || 'AKTIF', aktif: FkmData.isActiveStatus(r.status),
      pub: n(r.pub), q0: n(r.q0), q1: n(r.q1), q2: n(r.q2), q3: n(r.q3), q4: n(r.q4), scopus: n(r.scopus_count), wos: n(r.wos),
      sitasi: n(r.sitasi), hindex: n(r.h_index), trend: trend,
      geran: n(r.geran), geranAktif: n(r.geran_aktif), pi: n(r.geran_pi), dana: n(r.dana),
      phd: n(r.phd_selia), phdTamat: n(r.phd_tamat), ms: n(r.sarjana_selia), msTamat: n(r.sarjana_tamat),
      ajarUg: n(r.jam_ajar_ug), ajarPg: n(r.jam_ajar_pg),
      jamLatihan: jam, wajib: b(r.latihan_wajib), latihan: latihan,
      perundingan: n(r.projek_perundingan), nilaiPerundingan: n(r.nilai_perundingan),
      vivaD: n(r.viva_dalaman), vivaL: n(r.viva_luar), penilai: n(r.penilai_geran), pewasit: n(r.pewasit_jurnal),
      jk: { a: n(r.jk_antarabangsa), k: n(r.jk_kebangsaan), u: n(r.jk_universiti), f: n(r.jk_fakulti) },
      pengerusi: n(r.pengerusi_sesi),
      anugerah: { a: n(r.anugerah_antarabangsa), k: n(r.anugerah_kebangsaan), u: n(r.anugerah_utm) },
      hakCipta: n(r.hak_cipta),
      lppt: [r.lppt2025, r.lppt2024, r.lppt2023].map(function (v) { return s(v) === '' ? null : n(v); }),
      sumber: s(r.sumber_data), cvTarikh: s(r.cv_dikemaskini)
    };
  },

  /** Set data penuh (semua staf + skor + jurang). Dicache; dibatalkan bila STAF/SETTINGS berubah. */
  dataset: function () {
    const ver = AppCache.version('STAF') + '.' + AppCache.version('SETTINGS');
    return FkmCache.remember('fkm:ds:' + ver, 21600, function () {
      const cfg = FkmConfig.get();
      const rows = CrudEngine.repo(FkmData.def()).all().filter(function (r) { return r.state === RECORD_STATE.ACTIVE; });
      const staff = rows.map(function (r) {
        const s = FkmData.toStaff(r);
        s.sk = FkmScoring.score(s, cfg);
        s.jurang = FkmScoring.gaps(s, s.sk, cfg);
        return s;
      }).sort(function (a, b) { return a.nama.localeCompare(b.nama); });
      return { cfg: cfg, staff: staff, builtAt: DateUtils.nowIso() };
    });
  },

  /** Data untuk peminta — ditapis mengikut capaian di pelayan. */
  scoped: function (ctx) {
    const access = FkmAccess.resolve(ctx);
    const ds = FkmData.dataset();
    return {
      access: access,
      cfg: ds.cfg,
      jabatan: FkmConfig.JABATAN(),
      latihan: FkmConfig.LATIHAN(),
      staff: FkmAccess.filter(ds.staff, access),
      builtAt: ds.builtAt
    };
  }
};
