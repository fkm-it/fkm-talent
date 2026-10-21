/**
 * seed-custom.js — data demo REKAAN untuk dev server & E2E (bukan data staf sebenar; jangan letak data peribadi di sini).
 * Akaun: super@demo.local (SUPER_ADMIN), user@demo.local (STAFF — profil sendiri), user0@demo.local (HOD KBPI), user1@demo.local (DEAN).
 */
'use strict';
module.exports = function ({ api, ok, sup, ctx }) {
  const call = (action, payload) => ok(api({ action, token: sup.token, payload }));
  call('admin.settings.update', { changes: { FKM_EMAIL_DOMAINS: 'utm.my,mail.fkm.utm.my,demo.local' } });

  let seed = 7;
  const rnd = (a, b) => { seed = (seed * 9301 + 49297) % 233280; return a + Math.floor((seed / 233280) * (b - a + 1)); };
  const DEPTS = ['KAAS', 'KBPI', 'MGR', 'TB'];
  const RANKS = [['Pensyarah Universiti DS13', 'DS13', 'DS14'], ['Pensyarah Universiti DS14', 'DS14', 'DS54'], ['Profesor Madya DS54', 'DS54', 'VK7'], ['Profesor VK7', 'VK7', 'VK6'], ['Profesor VK6', 'VK6', 'VK5']];
  const FIRST = ['Ahmad', 'Siti', 'Lim', 'Nurul', 'Kumar', 'Farah', 'Hafiz', 'Aina', 'Tan', 'Zul', 'Mei Ling', 'Rashid'];
  const LAST = ['Rahman', 'Ismail', 'Wei Jie', 'Hassan', 'Raj', 'Yusof', 'Omar', 'Karim', 'Chong', 'Abdullah', 'Ng', 'Salleh'];
  const ids = [];
  const items = [];
  for (let i = 0; i < 36; i++) {
    const r = RANKS[Math.min(4, Math.floor(rnd(0, 100) / 22))];
    const senior = RANKS.indexOf(r);
    const pub = rnd(2, 12) + senior * rnd(6, 14);
    const q1 = Math.floor(pub * rnd(10, 35) / 100), q2 = Math.floor(pub * rnd(10, 30) / 100);
    const geran = rnd(0, 4) + senior * 2;
    const trend = {}; ['2020', '2021', '2022', '2023', '2024', '2025'].forEach((y) => { trend['pub' + y] = rnd(0, 2 + senior * 2); });
    const item = Object.assign({
      staffId: String(10000 + i * 37), gelaran: senior >= 3 ? 'PROF. DR.' : senior === 2 ? 'PROF. MADYA DR.' : 'DR.',
      nama: FIRST[i % FIRST.length] + ' ' + LAST[(i * 5) % LAST.length] + ' (Demo ' + (i + 1) + ')',
      email: i === 0 ? 'user@demo.local' : 'staf' + i + '@demo.local',
      jabatan: DEPTS[i % 4], jawatan: r[0], gred: r[1], sasaran: r[2], jawatanPentadbiran: i === 3 ? 'HOD' : i === 5 ? 'DEAN' : 'LECTURER',
      kelayakan: 'PHD', bidangKepakaran: ['Bahan termaju', 'Aerodinamik', 'Reka bentuk mekanikal', 'Tenaga boleh baharu'][i % 4],
      researchAlliance: i % 5 === 0 ? 'TIDAK DINYATAKAN' : ['FRONTIER MATERIALS', 'INNOVATIVE ENGINEERING', 'RESOURCE SUSTAINABILITY'][i % 3],
      rgKod: ['AMRG', 'SOT', 'EDRG', 'SERF'][i % 4], rgPeranan: i % 7 === 0 ? 'LEADER' : i % 7 === 1 ? 'DEPUTY' : 'MEMBER', peranCoe: i % 4 === 0 ? 'FULL MEMBER' : '',
      statusPerkhidmatan: i % 9 === 0 ? 'CONTRACT' : 'PERMANENT', warganegara: 'LOCAL', tempohKhidmat: rnd(2, 30), umur: rnd(30, 62),
      pub, q1, q2, q3: rnd(0, 3), scopusCount: Math.round(pub * 0.8), wos: Math.round(pub * 0.6), sitasi: pub * rnd(8, 25), hIndex: rnd(3, 8) + senior * 3,
      geran, geranAktif: rnd(0, 2), geranPi: Math.floor(geran / 2), dana: geran * rnd(80, 400) * 1000,
      phdSelia: rnd(0, 2) + senior * 2, phdTamat: senior, sarjanaSelia: rnd(1, 4) + senior * 2, sarjanaTamat: rnd(0, 3) + senior,
      jamAjarUg: rnd(60, 220), jamAjarPg: rnd(10, 80), latihanWajib: i % 4 !== 1,
      latihanPdp: rnd(5, 44), latihanPenyelidikan: rnd(5, 44), latihanAi: rnd(5, 44), latihanDigital: rnd(5, 44), latihanKepimpinan: rnd(5, 44), latihanProfesional: rnd(5, 44),
      projekPerundingan: rnd(0, 6), nilaiPerundingan: rnd(0, 300) * 1000, vivaDalaman: rnd(0, 20), vivaLuar: rnd(0, 8), penilaiGeran: rnd(0, 6), pewasitJurnal: rnd(0, 20),
      jkAntarabangsa: rnd(0, 2), jkKebangsaan: rnd(0, 3), jkUniversiti: rnd(0, 10), jkFakulti: rnd(2, 30), pengerusiSesi: rnd(0, 5),
      anugerahAntarabangsa: rnd(0, 2), anugerahKebangsaan: rnd(0, 2), anugerahUtm: rnd(0, 4), hakCipta: rnd(0, 3),
      lppt2025: rnd(80, 98), lppt2024: rnd(80, 98), lppt2023: rnd(i % 6 === 0 ? 70 : 82, 98)
    }, trend);
    items.push(item);
    ids.push(call('crud.create', Object.assign({ module: 'staf' }, item)));
  }
  call('crud.setStatus', { module: 'staf', id: ids[35].id, status: 'BERSARA', note: 'Demo: bersara' });
  call('crud.create', { module: 'capaian', email: 'user@demo.local', nama: 'Staf demo', peranan: 'STAFF', skop: '' });
  call('crud.create', { module: 'capaian', email: 'user0@demo.local', nama: 'Ketua Jabatan demo', peranan: 'HOD', skop: 'KBPI' });
  call('crud.create', { module: 'capaian', email: 'user1@demo.local', nama: 'Dekan demo', peranan: 'DEAN' });
  /* Sheet "sistem lama" rekaan (mock) untuk halaman Semakan Data: salinan data demo dalam format STAFF_PROFILE lama,
     dengan 2 perbezaan sengaja (sitasi disunting, LPPT tidak sah) dan 1 staf yang belum diimport. */
  if (ctx) {
    const vm = require('vm');
    const map = vm.runInContext('FkmImport.LEGACY_STAFF_MAP()', ctx), train = vm.runInContext('FkmImport.LEGACY_TRAINING()', ctx);
    const cols = Object.keys(map);
    const head = cols.concat(['status', 'training_json', 'pubtrend_json']);
    const rows = [head].concat(items.map((it, i) => {
      const r = cols.map((c) => (it[map[c]] === undefined ? '' : it[map[c]]));
      if (i === 2) r[cols.indexOf('cit')] = Number(it.sitasi) + 15;
      if (i === 4) r[cols.indexOf('lppt_2024')] = 2024;
      const tj = {}; Object.keys(train).forEach((k) => { tj[k] = it[train[k]]; });
      const pt = {}; ['2020', '2021', '2022', '2023', '2024', '2025'].forEach((y) => { pt[y] = it['pub' + y]; });
      return r.concat([i === 35 ? 'BERSARA' : 'ACTIVE', JSON.stringify(tj), JSON.stringify(pt)]);
    }));
    const extra = rows[1].slice(); extra[cols.indexOf('staff_id')] = '19999'; extra[cols.indexOf('name')] = 'Staf Lama Belum Import (Demo)'; extra[cols.indexOf('email')] = 'lama@demo.local';
    rows.push(extra);
    ctx.__legacyRows = rows;
    const id = vm.runInContext('(function(){ var ss = SpreadsheetApp.create("LEGACY_FKM_DEMO"); var sh = ss.insertSheet("STAFF_PROFILE"); sh.getRange(1, 1, __legacyRows.length, __legacyRows[0].length).setValues(__legacyRows); Env.set("LEGACY_SHEET_ID", ss.getId()); return ss.getId(); })()', ctx);
    console.log('Sheet sistem lama rekaan: ' + id + ' (LEGACY_SHEET_ID)');
  }
  console.log('Data demo FKM: 36 staf rekaan, capaian user@ (STAFF), user0@ (HOD KBPI), user1@ (DEAN)');
};
