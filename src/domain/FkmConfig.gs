/**
 * @file FkmConfig.gs
 * Konfigurasi skor kenaikan pangkat — SATU sumber kebenaran untuk backend & frontend.
 * Boleh diubah admin tanpa deploy: Panel → Tetapan → FKM_SKOR (JSON). Kosong = nilai lalai di bawah.
 *
 * Nilai lalai disalin daripada sistem lama (Config.gs: CFG + MIN_REQ). Ia masih ANGGARAN — tandakan
 * "rasmi": true dalam JSON selepas disahkan dengan pekeliling kenaikan pangkat UTM.
 */
const FkmConfig = {
  DEFAULTS: function () {
    return {
      rasmi: false,
      bobot: { penyelidikan: 45, pengajaran: 30, khidmat: 15, kepimpinan: 10 },
      minimum: { penyelidikan: 36, pengajaran: 24, khidmat: 12, kepimpinan: 8 },
      lpptMinimum: 85,
      jalur: { hijau: 80, kuning: 65 },
      latihanMinJam: 20,
      kepimpinanMinJam: 25,
      aiMinJam: 20,
      sasaran: {
        'DS14': { pub: 7, q12: 3, geran: 2, phd: 1, sarjana: 2 },
        'DS54': { pub: 16, q12: 8, geran: 4, phd: 2, sarjana: 4 },
        'VK7': { pub: 30, q12: 12, geran: 8, phd: 6, sarjana: 8 },
        'VK6': { pub: 56, q12: 28, geran: 18, phd: 12, sarjana: 14 },
        'VK5': { pub: 80, q12: 46, geran: 26, phd: 15, sarjana: 18 },
        'VK5 (Kekal)': { pub: 40, q12: 22, geran: 16, phd: 10, sarjana: 12 }
      },
      jawatanKhidmat: ['HOD', 'DEAN', 'TDA', 'TDPIP']
    };
  },

  /**
   * Gabung JSON admin dengan nilai lalai. strict=true → lontar ralat mesra (digunakan semasa menyimpan tetapan).
   * @return {Object} konfigurasi lengkap
   */
  parse: function (json, strict) {
    const base = FkmConfig.DEFAULTS();
    let o;
    try { o = JSON.parse(json); } catch (e) { if (strict) throw new Error('FKM_SKOR: JSON tidak sah — ' + e.message); return base; }
    if (!o || typeof o !== 'object' || Array.isArray(o)) { if (strict) throw new Error('FKM_SKOR mesti objek JSON.'); return base; }
    const num = function (v, min, max, label) {
      const n = Number(v);
      if (!isFinite(n) || n < min || n > max) throw new Error('FKM_SKOR: ' + label + ' mesti nombor ' + min + '–' + max + '.');
      return n;
    };
    try {
      if (o.rasmi !== undefined) base.rasmi = o.rasmi === true;
      ['bobot', 'minimum'].forEach(function (grp) {
        if (!o[grp]) return;
        Object.keys(base[grp]).forEach(function (k) { if (o[grp][k] !== undefined) base[grp][k] = num(o[grp][k], 0, 100, grp + '.' + k); });
      });
      const sum = Object.keys(base.bobot).reduce(function (t, k) { return t + base.bobot[k]; }, 0);
      if (Math.abs(sum - 100) > 0.01) throw new Error('FKM_SKOR: jumlah bobot mesti 100 (kini ' + sum + ').');
      if (o.lpptMinimum !== undefined) base.lpptMinimum = num(o.lpptMinimum, 0, 100, 'lpptMinimum');
      ['latihanMinJam', 'kepimpinanMinJam', 'aiMinJam'].forEach(function (k) { if (o[k] !== undefined) base[k] = num(o[k], 0, 1000, k); });
      if (o.jalur) {
        if (o.jalur.hijau !== undefined) base.jalur.hijau = num(o.jalur.hijau, 0, 100, 'jalur.hijau');
        if (o.jalur.kuning !== undefined) base.jalur.kuning = num(o.jalur.kuning, 0, 100, 'jalur.kuning');
        if (base.jalur.kuning > base.jalur.hijau) throw new Error('FKM_SKOR: jalur.kuning mesti ≤ jalur.hijau.');
      }
      if (o.sasaran) {
        Object.keys(o.sasaran).forEach(function (g) {
          const t = o.sasaran[g] || {};
          const cur = base.sasaran[g] || { pub: 1, q12: 1, geran: 1, phd: 1, sarjana: 1 };
          ['pub', 'q12', 'geran', 'phd', 'sarjana'].forEach(function (k) { if (t[k] !== undefined) cur[k] = num(t[k], 1, 1000, 'sasaran.' + g + '.' + k); });
          base.sasaran[g] = cur;
        });
      }
      if (Array.isArray(o.jawatanKhidmat)) base.jawatanKhidmat = o.jawatanKhidmat.map(function (x) { return String(x).toUpperCase().slice(0, 20); });
    } catch (e) {
      if (strict) throw e;
      return FkmConfig.DEFAULTS();
    }
    return base;
  },

  /** Konfigurasi aktif (cache permintaan melalui SettingsService). */
  get: function () {
    const raw = String(SettingsService.get('FKM_SKOR') || '').trim();
    return raw ? FkmConfig.parse(raw, false) : FkmConfig.DEFAULTS();
  },

  /** Domain e-mel dibenarkan (huruf kecil). */
  domains: function () {
    return String(SettingsService.get('FKM_EMAIL_DOMAINS') || '').toLowerCase().split(/[\s,]+/).filter(Boolean);
  },

  JABATAN: function () {
    return { KAAS: 'Aeronautik, Automotif & Ocean', KBPI: 'Bahan, Pembuatan & Industri', MGR: 'Mekanikal Gunaan & Reka Bentuk', TB: 'Termo-Bendalir', AAS: 'Aeroangkasa' };
  },

  LATIHAN: function () {
    return [
      ['pdp', 'Teaching & Learning'], ['penyelidikan', 'Research'], ['ai', 'Artificial Intelligence'],
      ['digital', 'Digital Transformation'], ['kepimpinan', 'Leadership'], ['profesional', 'Professional Development']
    ];
  }
};
