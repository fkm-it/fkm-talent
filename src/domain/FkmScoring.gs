/**
 * @file FkmScoring.gs
 * Enjin skor kesiapsiagaan kenaikan pangkat — formula UTM 4 komponen + gatekeeper LPPT.
 *
 * Formula dipindah TEPAT daripada sistem lama (Scoring.gs / score() dalam index.html). Bezanya:
 *  - SATU pelaksanaan sahaja (sistem lama ada dua salinan — pelayan & pelayar — yang pernah tidak selari).
 *  - Dikira sekali di pelayan semasa set data dibina, kemudian dicache; pelayar tidak mengira semula.
 *  - Ambang jalur (hijau/kuning) diambil daripada konfigurasi untuk SEMUA paparan. Sistem lama menggunakan
 *    80/65 pada lencana tetapi 75/55 pada kiraan modul Promotion, jadi jumlah GREEN/YELLOW tidak sepadan.
 *  - Jam latihan yang tiada dikira 0 (sistem lama: `undefined < 25` → false, jurang kepimpinan terlepas).
 */
const FkmScoring = {
  cap: function (x) { return Math.min(100, Math.max(0, x * 100)); },

  lpptAvg: function (s) {
    const v = (s.lppt || []).map(Number).filter(function (x) { return isFinite(x) && x > 0; });
    return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null;
  },

  /**
   * @param {Object} s staf ternormal (FkmData.toStaff)
   * @param {Object} cfg FkmConfig.get()
   * @return {{total:number, r:number, t:number, k:number, l:number, lppt:number|null, lpptLulus:boolean,
   *           gagal:string[], jalur:string, label:string, sasaran:string}}
   */
  score: function (s, cfg) {
    const cap = FkmScoring.cap;
    const sasaran = cfg.sasaran[s.sasaran] ? s.sasaran : 'DS54';
    const t = cfg.sasaran[sasaran] || cfg.sasaran.DS54;
    const L = s.latihan || {};

    const citB = (s.sitasi > 0 ? (s.sitasi / (t.pub * 12)) * 0.08 : 0) + (s.hindex > 0 ? (s.hindex / (t.pub * 0.45)) * 0.07 : 0);
    const research = cap((s.pub / t.pub) * 0.40 + ((s.q1 + s.q2) / t.q12) * 0.30 + (s.geran / t.geran) * 0.10 +
      (s.pi / Math.max(1, t.geran * 0.5)) * 0.05 + citB);
    const teaching = cap((s.phd / t.phd) * 0.50 + (s.ms / Math.max(1, t.phd * 2)) * 0.30 + ((L.pdp || 0) / 40) * 0.20);
    const service = cap((cfg.jawatanKhidmat.indexOf(String(s.jp || '').toUpperCase()) > -1 ? 0.40 : 0.12) +
      (s.coe ? 0.25 : 0) + ((L.profesional || 0) / 40) * 0.18 + (s.geranAktif > 0 ? 0.10 : 0));
    const rgr = String(s.rgPeranan || '').toUpperCase();
    const standing = cap((rgr === 'LEADER' ? 0.45 : rgr === 'DEPUTY' ? 0.28 : 0.14) + ((L.kepimpinan || 0) / 40) * 0.30 +
      (s.alliance && s.alliance !== 'TIDAK DINYATAKAN' ? 0.12 : 0));

    const W = cfg.bobot, M = cfg.minimum;
    const total = Math.round(research * W.penyelidikan / 100 + teaching * W.pengajaran / 100 + service * W.khidmat / 100 + standing * W.kepimpinan / 100);
    const rR = Math.round(research), rT = Math.round(teaching), rS = Math.round(service), rL = Math.round(standing);

    const gagal = [];
    if (rR < M.penyelidikan) gagal.push('Penyelidikan ' + rR + '% (min ' + M.penyelidikan + '%)');
    if (rT < M.pengajaran) gagal.push('Pengajaran ' + rT + '% (min ' + M.pengajaran + '%)');
    if (rS < M.khidmat) gagal.push('Khidmat ' + rS + '% (min ' + M.khidmat + '%)');
    if (rL < M.kepimpinan) gagal.push('Kepimpinan ' + rL + '% (min ' + M.kepimpinan + '%)');
    const lppt = FkmScoring.lpptAvg(s);
    const lpptGagal = lppt !== null && lppt < cfg.lpptMinimum;
    if (lpptGagal) gagal.unshift('LPPT purata ' + lppt.toFixed(1) + '% (min ' + cfg.lpptMinimum + '%)');

    const jalur = gagal.length ? 'MERAH' : total >= cfg.jalur.hijau ? 'HIJAU' : total >= cfg.jalur.kuning ? 'KUNING' : 'MERAH';
    const label = lpptGagal ? 'Gagal syarat LPPT' : gagal.length ? 'Gagal minimum komponen'
      : jalur === 'HIJAU' ? 'Layak memohon' : jalur === 'KUNING' ? 'Hampir layak' : 'Perlu pembangunan';

    return {
      total: total, r: rR, t: rT, k: rS, l: rL,
      lppt: lppt === null ? null : Math.round(lppt * 10) / 10, lpptLulus: !lpptGagal,
      gagal: gagal, jalur: jalur, label: label, sasaran: sasaran
    };
  },

  /** Analisis jurang — senarai [bidang, mesej]. */
  gaps: function (s, sc, cfg) {
    const t = cfg.sasaran[sc.sasaran];
    const L = s.latihan || {};
    const g = [];
    sc.gagal.forEach(function (f) { g.push(['Syarat wajib', 'Di bawah paras minimum: ' + f + '. Ini menyekat kelayakan walaupun jumlah skor mencukupi.']); });
    if (s.pub < t.pub) g.push(['Penerbitan', 'Ada ' + s.pub + ' penerbitan; sasaran ' + t.pub + '. Perlu tambah ' + (t.pub - s.pub) + ' lagi.']);
    if (s.q1 + s.q2 < t.q12) g.push(['Kualiti jurnal', 'Q1+Q2 = ' + (s.q1 + s.q2) + '; sasaran ' + t.q12 + '. Perlu tambah ' + (t.q12 - s.q1 - s.q2) + ' artikel Q1/Q2.']);
    if (s.geran < t.geran) g.push(['Geran', 'Ada ' + s.geran + ' geran; sasaran ' + t.geran + '. Perlu ' + (t.geran - s.geran) + ' lagi.']);
    if (s.pi < 1) g.push(['Ketua projek', 'Belum pernah menjadi Principal Investigator — kriteria penting kenaikan pangkat.']);
    if (s.phd < t.phd) g.push(['Penyeliaan PhD', 'Menyelia ' + s.phd + ' pelajar PhD; sasaran ' + t.phd + '. Perlu ' + (t.phd - s.phd) + ' lagi.']);
    if ((L.kepimpinan || 0) < cfg.kepimpinanMinJam) g.push(['Kepimpinan', 'Hanya ' + (L.kepimpinan || 0) + ' jam latihan Leadership. Disyorkan minimum ' + cfg.kepimpinanMinJam + ' jam.']);
    if (!s.wajib) g.push(['Latihan wajib', 'Kursus latihan wajib belum lengkap — boleh menyekat permohonan.']);
    if ((L.ai || 0) < cfg.aiMinJam) g.push(['Literasi AI', 'Latihan AI di bawah ' + cfg.aiMinJam + ' jam — keperluan transformasi digital universiti.']);
    return g.length ? g : [['Cemerlang', 'Semua kriteria utama dipenuhi. Sedia untuk memohon kenaikan pangkat.']];
  }
};
