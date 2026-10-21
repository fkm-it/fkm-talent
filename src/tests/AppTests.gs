/**
 * @file AppTests.gs
 * Ujian domain FKM Talent: skor, konfigurasi, gerbang pendaftaran, skop RBAC, cache, penyelarasan status,
 * User Access Control, Auto-Extract CV dan import sistem lama. Dijalankan oleh `npm test` dan `runTestsPart5`.
 */
const AppTests = { suites: function () { return [TestSuiteFkm]; } };

const FkmT = {
  seq: 0,
  /** Cipta rekod staf melalui API admin sebenar. */
  staf: function (adm, o) {
    FkmT.seq++;
    return TestAssert.apiOk(TestHelpers.call(adm.token, 'crud.create', Object.assign({
      module: 'staf', staffId: String(9000 + FkmT.seq), nama: 'STAF UJIAN ' + FkmT.seq, jabatan: 'KBPI', sasaran: 'DS54',
      pub: 10, q1: 3, q2: 2, geran: 3, geranPi: 1, phdSelia: 1, sarjanaSelia: 2, latihanPdp: 20, latihanKepimpinan: 10,
      lppt2025: 90, lppt2024: 90, lppt2023: 90
    }, o || {})));
  },
  capaian: function (adm, email, peranan, skop) {
    return TestAssert.apiOk(TestHelpers.call(adm.token, 'crud.create', { module: 'capaian', email: email, nama: 'Ujian', peranan: peranan, skop: skop || '' }));
  },
  /** Daftar pengguna (mesti dalam capaian) dengan e-mel UTM. */
  user: function (email) { return TestHelpers.user('fkm', email); },
  data: function (u) { return TestAssert.apiOk(TestHelpers.call(u.token, 'staf.data', {})); },
  baseStaff: function (o) {
    return Object.assign({ pub: 0, q1: 0, q2: 0, sitasi: 0, hindex: 0, geran: 0, geranAktif: 0, pi: 0, phd: 0, ms: 0, jp: '', coe: '', rgPeranan: '', alliance: '',
      sasaran: 'DS54', latihan: {}, lppt: [null, null, null], wajib: true }, o || {});
  }
};

const TestSuiteFkm = {
  name: 'FKM Talent (domain)',
  tests: [
    ['Skor: formula UTM 4 komponen sama dengan sistem lama', function (t) {
      const cfg = FkmConfig.DEFAULTS();
      /* DS54: pub 16, q12 8, geran 4, phd 2. Staf memenuhi 100% setiap sasaran utama. */
      const s = FkmT.baseStaff({ pub: 16, q1: 4, q2: 4, geran: 4, pi: 2, phd: 2, ms: 4, jp: 'HOD', coe: 'MEMBER', geranAktif: 1, rgPeranan: 'LEADER', alliance: 'X',
        latihan: { pdp: 40, profesional: 40, kepimpinan: 40 }, lppt: [90, 90, 90] });
      const sk = FkmScoring.score(s, cfg);
      t.eq(sk.r, 85, 'penyelidikan = 0.40+0.30+0.10+0.05 tanpa sitasi');
      t.eq(sk.t, 100);
      t.eq(sk.k, 93, 'khidmat = 0.40+0.25+0.18+0.10');
      t.eq(sk.l, 87, 'kepimpinan = 0.45+0.30+0.12');
      t.eq(sk.total, Math.round(85 * 0.45 + 100 * 0.30 + 93 * 0.15 + 87 * 0.10));
      t.eq(sk.jalur, 'HIJAU');
      t.eq(sk.lppt, 90);
      const weak = FkmScoring.score(FkmT.baseStaff({ pub: 16, q1: 8, geran: 4, pi: 2, phd: 2, ms: 4, lppt: [80, 84, null] }), cfg);
      t.ok(!weak.lpptLulus && weak.jalur === 'MERAH' && /LPPT/.test(weak.gagal[0]), 'gatekeeper LPPT');
      t.eq(FkmScoring.score(FkmT.baseStaff({ sasaran: 'TIADA' }), cfg).sasaran, 'DS54', 'sasaran tidak dikenali → DS54');
      const gaps = FkmScoring.gaps(FkmT.baseStaff(), FkmScoring.score(FkmT.baseStaff(), cfg), cfg).map(function (g) { return g[0]; });
      t.ok(gaps.indexOf('Kepimpinan') >= 0 && gaps.indexOf('Literasi AI') >= 0, 'jam latihan tiada dikira 0 (pepijat lama)');
    }],
    ['Konfigurasi FKM_SKOR: JSON disahkan, bobot mesti 100, tetapan admin berkuat kuasa', function (t) {
      t.throws(function () { FkmConfig.parse('{bukan json', true); });
      t.throws(function () { FkmConfig.parse('{"bobot":{"penyelidikan":50}}', true); }, null, 'jumlah bobot ≠ 100');
      const c = FkmConfig.parse('{"rasmi":true,"lpptMinimum":80,"sasaran":{"DS54":{"pub":20}}}', true);
      t.ok(c.rasmi && c.lpptMinimum === 80 && c.sasaran.DS54.pub === 20 && c.sasaran.DS54.q12 === 8);
      t.eq(FkmConfig.parse('rosak', false).lpptMinimum, 85, 'mod tidak ketat → lalai');
      const adm = TestHelpers.admin(ROLES.ADMIN);
      TestAssert.apiFail(TestHelpers.call(adm.token, 'admin.settings.update', { changes: { FKM_SKOR: '{"bobot":{"penyelidikan":90}}' } }), ERROR_CODES.VALIDATION_ERROR);
      TestAssert.apiOk(TestHelpers.call(adm.token, 'admin.settings.update', { changes: { FKM_SKOR: '{"rasmi":true}' } }));
      t.eq(FkmConfig.get().rasmi, true);
      SettingsRepository.setMany({ FKM_SKOR: '' }, 'TEST');
    }],
    ['Gerbang pendaftaran: hanya e-mel dalam Capaian AKTIF & domain UTM', function (t) {
      const adm = TestHelpers.admin(ROLES.ADMIN);
      const res = api({ action: 'auth.register', payload: { fullName: 'Luar Senarai', email: 'luar' + Date.now() + '@utm.my', password: 'Rahsia123' } });
      TestAssert.apiFail(res, ERROR_CODES.FORBIDDEN);
      TestAssert.apiFail(TestHelpers.call(adm.token, 'crud.create', { module: 'capaian', email: 'orang@gmail.com', peranan: 'STAFF' }), ERROR_CODES.VALIDATION_ERROR);
      TestAssert.apiFail(TestHelpers.call(adm.token, 'crud.create', { module: 'capaian', email: 'hodx@utm.my', peranan: 'HOD', skop: 'XYZ' }), ERROR_CODES.VALIDATION_ERROR);
      const em = 'dalam' + Date.now() + '@utm.my';
      FkmT.capaian(adm, em, 'DEAN');
      TestAssert.apiFail(TestHelpers.call(adm.token, 'crud.create', { module: 'capaian', email: em.toUpperCase(), peranan: 'DEAN' }), ERROR_CODES.CONFLICT);
      t.ok(FkmT.user(em).token, 'e-mel disenaraikan boleh mendaftar');
    }],
    ['Skop RBAC: ADMIN/DEAN semua, HOD jabatan, STAFF diri sendiri, tiada capaian = tiada data; CRUD generik tertutup', function (t) {
      const adm = TestHelpers.admin(ROLES.ADMIN);
      const a = FkmT.staf(adm, { jabatan: 'KBPI', email: 'staf.a' + Date.now() + '@utm.my' });
      FkmT.staf(adm, { jabatan: 'MGR' });
      FkmT.staf(adm, { jabatan: 'MGR' });
      const total = FkmT.data(adm).staff.length;
      t.ok(total >= 3);
      const ts = Date.now();
      FkmT.capaian(adm, 'dean' + ts + '@utm.my', 'DEAN');
      FkmT.capaian(adm, 'hod' + ts + '@utm.my', 'HOD', 'mgr');
      const capStaf = FkmT.capaian(adm, a.values.email, 'STAFF', '');
      t.eq(capStaf.values.skop, a.values.staffId, 'skop STAFF diisi automatik daripada e-mel rekod staf');
      t.eq(FkmT.data(FkmT.user('dean' + ts + '@utm.my')).staff.length, total);
      const hod = FkmT.data(FkmT.user('hod' + ts + '@utm.my'));
      t.ok(hod.staff.length >= 2 && hod.staff.every(function (s) { return s.jabatan === 'MGR'; }), 'HOD hanya jabatan sendiri (skop dinormalkan huruf besar)');
      const su = FkmT.user(a.values.email);
      const mine = FkmT.data(su);
      t.eq(mine.staff.length, 1);
      t.eq(mine.staff[0].sid, a.values.staffId);
      t.eq(mine.staff[0].telefon, undefined, 'medan adminOnly tidak dihantar');
      t.eq(TestAssert.apiOk(TestHelpers.call(su.token, 'crud.list', { module: 'staf' })).items.length, 0, 'CRUD generik: bukan admin tiada rekod');
      TestAssert.apiFail(TestHelpers.call(su.token, 'crud.get', { module: 'staf', id: a.id }), ERROR_CODES.NOT_FOUND);
      TestAssert.apiFail(TestHelpers.call(su.token, 'staf.cvSave', { items: [] }), ERROR_CODES.FORBIDDEN);
      TestAssert.apiFail(TestHelpers.call(su.token, 'staf.importLegacy', {}), ERROR_CODES.FORBIDDEN);
      const nobody = TestHelpers.user('nobody');
      const none = FkmT.data(nobody);
      t.eq(none.access.peranan, 'TIADA');
      t.eq(none.staff.length, 0);
      TestAssert.apiFail(api({ action: 'staf.data', payload: {} }), ERROR_CODES.UNAUTHENTICATED);
    }],
    ['User Access Control: senarai capaian + status akaun, admin sahaja', function (t) {
      const adm = TestHelpers.admin(ROLES.ADMIN);
      const ts = Date.now();
      const reg = 'uac.daftar' + ts + '@utm.my', bel = 'uac.belum' + ts + '@utm.my';
      FkmT.capaian(adm, reg, 'DEAN');
      FkmT.capaian(adm, bel, 'HOD', 'tb');
      const u = FkmT.user(reg);
      const items = TestAssert.apiOk(TestHelpers.call(adm.token, 'staf.akses', {})).items;
      const a = items.filter(function (x) { return x.email === reg; })[0];
      const b = items.filter(function (x) { return x.email === bel; })[0];
      t.ok(a && a.akaun && a.akaun.status === USER_STATUS.ACTIVE && a.peranan === 'DEAN', 'akaun berdaftar dipadankan ikut e-mel');
      t.ok(b && b.akaun === null && b.skop === 'TB', 'belum daftar → akaun null; skop HOD huruf besar');
      t.eq(JSON.stringify(items).indexOf('hash'), -1, 'tiada hash/rahsia dalam respons');
      TestAssert.apiFail(TestHelpers.call(u.token, 'staf.akses', {}), ERROR_CODES.FORBIDDEN);
    }],
    ['Cache set data: dibatalkan serta-merta selepas rekod staf disunting', function (t) {
      const adm = TestHelpers.admin(ROLES.ADMIN);
      const s = FkmT.staf(adm, { pub: 1 });
      const before = FkmT.data(adm).staff.filter(function (x) { return x.id === s.id; })[0];
      TestAssert.apiOk(TestHelpers.call(adm.token, 'crud.update', { module: 'staf', id: s.id, pub: 40 }));
      const after = FkmT.data(adm).staff.filter(function (x) { return x.id === s.id; })[0];
      t.eq(after.pub, 40);
      t.ok(after.sk.r > before.sk.r, 'skor dikira semula');
      t.eq(Repo.of('STAF').findById(s.id).sumber_data, 'MANUAL');
      const hit = FkmCache.get('fkm:ds:' + AppCache.version('STAF') + '.' + AppCache.version('SETTINGS'));
      t.ok(hit && hit.staff.length, 'set data termampat disimpan dalam cache (melepasi had 100 KB)');
      TestAssert.apiFail(TestHelpers.call(adm.token, 'crud.create', { module: 'staf', staffId: s.values.staffId, nama: 'X', jabatan: 'TB' }), ERROR_CODES.CONFLICT);
    }],
    ['Status staf: bersara → capaian & akaun log masuk dinyahaktif, sesi tamat; aktif semula dipulihkan', function (t) {
      const adm = TestHelpers.admin(ROLES.ADMIN);
      const em = 'bersara' + Date.now() + '@utm.my';
      const s = FkmT.staf(adm, { email: em });
      FkmT.capaian(adm, em, 'STAFF');
      const u = FkmT.user(em);
      t.eq(FkmT.data(u).staff.length, 1);
      TestAssert.apiOk(TestHelpers.call(adm.token, 'crud.setStatus', { module: 'staf', id: s.id, status: 'BERSARA', note: 'Bersara wajib' }));
      t.eq(FkmAccess.forEmail(em), null, 'capaian dinyahaktif');
      t.eq(UserRepository.findByEmail(em).status, USER_STATUS.INACTIVE);
      TestAssert.apiFail(TestHelpers.call(u.token, 'staf.data', {}), ERROR_CODES.UNAUTHENTICATED);
      const ds = FkmT.data(adm).staff.filter(function (x) { return x.id === s.id; })[0];
      t.ok(!ds.aktif && ds.status === 'BERSARA', 'rekod kekal tetapi ditanda tidak aktif');
      TestAssert.apiOk(TestHelpers.call(adm.token, 'crud.setStatus', { module: 'staf', id: s.id, status: 'AKTIF' }));
      t.ok(FkmAccess.forEmail(em), 'capaian dipulihkan');
      t.eq(UserRepository.findByEmail(em).status, USER_STATUS.ACTIVE);
    }],
    ['Auto-Extract CV: kemas kini staf sedia ada sahaja, tolak bukan Summary Report & ID tidak wujud', function (t) {
      const adm = TestHelpers.admin(ROLES.ADMIN);
      const s = FkmT.staf(adm, { pub: 5, sitasi: 123 });
      const cv = { _summary: true, staff_id: s.values.staffId + '.0', name: 'NAMA DARI CV', pub_wos: 10, pub_scopus: 2, pub_conf: 1, pub_book: 0,
        grant_pi: 2, grant_member: 3, funding_pi: 1000.5, funding_member: 500, phd_grad: 1, phd_ongoing: 2, master: 4, consult_proj: 1, consult_rm: 61805.84,
        lppt_2025: 93.3, chair_count: 9, q1: 0, q2: 0 };
      const r = TestAssert.apiOk(TestHelpers.call(adm.token, 'staf.cvSave', { items: [cv, { staff_id: '1' }, Object.assign({}, cv, { staff_id: '99999999' })] }));
      t.eq(r.updated, 1);
      t.eq(r.errors.length, 2);
      t.ok(/Summary Report/.test(r.errors[0].message) && /belum wujud/.test(r.errors[1].message));
      const row = Repo.of('STAF').findById(s.id);
      t.eq(Number(row.pub), 13, 'pub = WoS + Scopus + persidangan + buku');
      t.eq(Number(row.geran), 5);
      t.eq(Number(row.dana), 1500.5);
      t.eq(Number(row.phd_selia), 3);
      t.eq(Number(row.nilai_perundingan), 61805.84);
      t.eq(Number(row.sitasi), 123, 'medan tiada dalam CV tidak disentuh');
      t.eq(row.nama, 'NAMA DARI CV');
      t.eq(row.sumber_data, 'CV');
      t.ok(/^\d{4}-\d{2}-\d{2}$/.test(row.cv_dikemaskini));
      const again = TestAssert.apiOk(TestHelpers.call(adm.token, 'staf.cvSave', { items: [cv] }));
      t.eq(again.unchanged, 1, 'simpan semula CV sama → tiada perubahan');
    }],
    ['Import sistem lama: baca sahaja, upsert idempoten, nilai tidak sah dibuang dengan amaran', function (t) {
      const sup = TestHelpers.admin(ROLES.SUPER_ADMIN);
      const legacy = SpreadsheetApp.create('LEGACY_FKM');
      const sp = legacy.insertSheet('STAFF_PROFILE');
      const head = ['staff_id', 'name', 'email', 'department', 'position', 'grade', 'target_position', 'status', 'phone', 'appointment_date', 'rg_role',
        'pub', 'q1', 'cit', 'grants', 'funding', 'lppt_2025', 'training_json', 'pubtrend_json', 'mandatory_done', 'years_of_service'];
      const rows = [head,
        [4321.0, 'STAF REKAAN SATU', 'rekaan.satu@utm.my', 'TB', 'Pensyarah Universiti DS14', 'DS14', 'DS54', 'ACTIVE', '012-000 0000', new Date('2021-10-11T00:00:00Z'), 'member',
          58, 10, 731, 42, 100000, 90.11, '{"Leadership":43.8,"Research":14.3}', '{"2024":6,"2025":3}', true, 23],
        [6655, 'STAF REKAAN DUA', 'rekaan.dua@utm.my', 'TB', 'Profesor VK7', 'VK7', 'VK6', 'BERSARA', 'bukan telefon!!', '', 'LEADER',
          31, 10, 764, 11, 200000, 79.16, 'rosak', '', false, '']];
      sp.getRange(1, 1, rows.length, head.length).setValues(rows);
      const ua = legacy.insertSheet('USER_ACCESS');
      const uaRows = [['email', 'name', 'role', 'scope', 'status', 'password_hash'],
        ['rekaan.satu@utm.my', 'Rekaan Satu', 'STAFF', '4321.0', 'ACTIVE', 'abc'],
        ['admin.lama@mail.fkm.utm.my', 'Admin PSM', 'ADMIN', '', 'ACTIVE', 'xyz'],
        ['hod.tb@utm.my', 'Ketua TB', 'HOD', 'TB', 'INACTIVE', '']];
      ua.getRange(1, 1, uaRows.length, 6).setValues(uaRows);

      TestAssert.apiFail(TestHelpers.call(TestHelpers.admin(ROLES.ADMIN).token, 'staf.importLegacy', { sheetId: legacy.getId() }), ERROR_CODES.FORBIDDEN);
      TestAssert.apiFail(TestHelpers.call(sup.token, 'staf.importLegacy', { sheetId: 'x' }), ERROR_CODES.VALIDATION_ERROR);
      const before = JSON.stringify(sp.getDataRange().getValues());
      const r = TestAssert.apiOk(TestHelpers.call(sup.token, 'staf.importLegacy', { sheetId: legacy.getId() }));
      t.eq(r.staf.added, 2);
      t.eq(r.capaian.added, 3);
      t.eq(JSON.stringify(sp.getDataRange().getValues()), before, 'sheet lama tidak diubah');
      t.ok(r.warnings.some(function (w) { return /ADMIN lama/.test(w) && /admin\.lama/.test(w); }), 'amaran naik taraf ADMIN');
      t.ok(r.warnings.some(function (w) { return /Telefon/.test(w); }) && r.warnings.some(function (w) { return /training_json/.test(w); }));

      const st = CrudEngine.repo(CrudEngine.get('staf')).all();
      const am = st.filter(function (x) { return x.staff_id === '4321'; })[0];
      t.ok(am, 'Staff ID 4321.0 → 4321');
      t.eq(am.lantikan_semasa, '2021-10-11');
      t.eq(am.rg_peranan, 'MEMBER');
      t.eq(Number(am.latihan_kepimpinan), 43.8);
      t.eq(Number(am.pub2024), 6);
      t.eq(am.sumber_data, 'IMPORT');
      t.eq(am.status, 'AKTIF');
      const mz = st.filter(function (x) { return x.staff_id === '6655'; })[0];
      t.eq(mz.status, 'BERSARA');
      t.eq(mz.telefon, '', 'telefon tidak sah dibuang');
      const caps = CrudEngine.repo(CrudEngine.get('capaian')).all();
      const capA = caps.filter(function (c) { return c.email === 'rekaan.satu@utm.my'; })[0];
      t.eq(capA.skop, '4321');
      t.eq(caps.filter(function (c) { return c.email === 'admin.lama@mail.fkm.utm.my'; })[0].peranan, 'DEAN');
      t.eq(caps.filter(function (c) { return c.email === 'hod.tb@utm.my'; })[0].status, 'TIDAK_AKTIF');
      t.eq(CredentialRepository.base().all().filter(function (c) { return /abc|xyz/.test(JSON.stringify(c)); }).length, 0, 'hash kata laluan lama tidak dipindah');

      const again = TestAssert.apiOk(TestHelpers.call(sup.token, 'staf.importLegacy', { sheetId: legacy.getId() }));
      t.eq(again.staf.added + again.staf.updated, 0, 'import semula idempoten');
      t.eq(again.capaian.added + again.capaian.updated, 0);
      const u = FkmT.user('rekaan.satu@utm.my');
      const mine = FkmT.data(u);
      t.eq(mine.staff.length, 1);
      t.eq(mine.staff[0].latihan.kepimpinan, 43.8);
    }]
  ]
};
