# CHANGELOG

## FKM Talent 0.4.0 — 2026-10-21
- Halaman **Semakan Data** (pentadbir, laluan `staf.semak`): baca Sheet sistem lama + pangkalan data baharu + set data dashboard, bandingkan setiap staf & setiap medan, jumlah KPI staf aktif (Sheet lama / pangkalan data / dashboard), staf tidak berpasangan, nilai tidak sah, pengesanan data demo. Baca sahaja.
- `FkmImport.legacyStaffItems` dikongsi oleh import & semakan; dev server menyediakan Sheet lama rekaan (mock) dengan perbezaan sengaja untuk E2E.

## FKM Talent 0.3.0 — 2026-10-21
- Halaman log masuk / daftar / lupa kata laluan gaya lama (kad "FKM · Academic Talent & Career Intelligence Dashboard"); halaman pemasaran templat diganti terus ke log masuk.
- Borang Sunting & Tambah Staf bertab dalam modal (A. Profil, B. Penyelidikan & Geran, C. Pengajaran, Penyeliaan & Latihan, D. Khidmat, Anugerah & LPPT): kepala & kaki melekat, serlahan medan diubah, kiraan perubahan per tab, Undur Semua, amaran keluar tanpa simpan, tanda CV!/CV (medan yang ditimpa Auto-Extract), Staff ID dikunci, hanya medan diubah dihantar.
- Teras templat (generik): `KD.authShell()` untuk rupa halaman pengesahan.

## FKM Talent 0.2.0 — 2026-10-21
Antara muka sistem lama dikekalkan di platform baharu.
- Shell FKM (sidebar, topbar, footer) dan 12 halaman yang sama seperti sistem lama: Executive Dashboard, Staff Profile, Promotion Readiness, Training Intelligence, Research Performance, Grant Management, Supervision, Khidmat & Perundingan, MyRA Audit Score, Auto-Extract CV, AI Career Advisor, User Access Control (+ Import Sistem Lama untuk Super Admin).
- Kad KPI, carta Chart.js 4.4.1 (salinan tempatan, dimuat malas), profil dalam modal, Dark Mode, Tukar Kata Laluan.
- Semua peranan mendarat di Executive Dashboard (staf → profil sendiri). Panel pentadbir templat kekal di menu "Panel Pentadbir".
- User Access Control: senarai capaian + status akaun (laluan baharu `staf.akses`), tukar peranan/skop/status terus dalam jadual, tambah pengguna, pautan reset, audit log.
- Teras templat (generik): `KD.shells[<layout>]` (shell tersuai), `KD.home()` (laman selepas log masuk), pemilih laman utama boleh ditetapkan dalam `tools/e2e-values.json` (`_e2e`).

## FKM Talent 0.1.1 — 2026-10-21
- Pengekstrak CV: markah LPPT hanya diambil terus selepas label `LPPT Marks (3 years)` dan mesti 0–100. Sebelum ini (warisan sistem lama) CV tanpa markah LPPT tersalah ambil nombor lain (cth. tahun 2024) dan staf itu "lulus" gatekeeper LPPT.

## FKM Talent 0.1.0 — 2026-10-21
Versi pertama sistem baharu (berasingan daripada sistem Apps Script lama).
- Modul `staf` (85 medan profil + KPI, status perkhidmatan) dan `capaian` (senarai putih pendaftaran, peranan DEAN/HOD/STAFF + skop).
- Paparan: Ringkasan Eksekutif, Direktori, Profil + analisis jurang, Kenaikan Pangkat, Analitik (6 tab), Penasihat Kerjaya, Auto-Extract CV, Import Sistem Lama.
- Prestasi: set data + skor dikira sekali, dicache termampat (gzip, dipecah) dan dibatalkan automatik; satu panggilan API per halaman; carta SVG tanpa pustaka; pdf.js dimuat malas.
- Pembetulan berbanding sistem lama: ambang jalur konsisten, satu enjin skor, jam latihan tiada dikira 0, kiraan pengerusi/penceramah CV (tarikh `22/10 /2025`), pdf.js `isEvalSupported:false`.
- Teras templat (generik): `CrudEngine.bulkUpsert`, `AppHooks.beforeRegister`, pengesah tetapan `def.validate`, salinan `pwa/vendor/` dalam binaan web, mock GAS (`gzip/ungzip`, `putAll/getAll`, `getDataRange`).
- Ujian: 8 ujian domain (76 jumlah) + E2E `e2e-fkm.py` (4 peranan × desktop/360px).

---
Sejarah templat `gas-pwa-starter`:

## 0.4.4 — 2026-10-13
- **Dibaiki:** medan `int` pilihan yang kosong dipulangkan sebagai 0 (repository + DTO), jadi borang sunting menghantar 0 dan gagal validasi `min` (cth. tahun perolehan `min: 1990`). Medan modul `int` kini guna jenis lajur `intOrNull` (sel kosong kekal kosong, DTO `null`); kiraan `files` kekal 0. Ditemui semasa membina Dashboard Unit IT FKM. Sistem sedia ada: tarik `tools/gen.js`, `RepositoryBase.gs`, `CrudEngine.gs`, kemudian `npm run gen`.
- Ujian kategori teras tidak lagi menganggap hanya kategori `Umum` wujud (`TestHelpers.singleCategory`), jadi projek yang mengubah `SeedData.CATEGORIES` tidak gagal ujian teras.

## 0.4.3 — 2026-10-06
- Mod `/exec` dibaiki: HtmlService merosakkan komen blok dengan `/*` bersarang → `SyntaxError`, app tidak dimuat. `tools/build-gas.js` membuang komen skrip frontend ke `build/gas` sebelum `clasp push` (CI). `npm run check` melarang `/*` bersarang dalam komen. Web Pages juga tanpa komen skrip.

## 0.4.2 — 2026-10-06
- Idempotensi peringkat Router (`meta.rid`): semua tindakan dicuba semula secara selamat apabila Google gagal menghantar jawapan (404 URL echo / tamat masa). Mesej ralat sambungan menyertakan punca ringkas.


## 0.4.1 — 2026-10-06
- `public.bootstrap` (config + modul dalam satu eksekusi) + salinan simpanan pelayar: app dibuka serta-merta pada lawatan seterusnya.
- `AppCache.rememberFor(['SHEET'], key, ttl, fn)`: cache bacaan yang dibatalkan automatik bila sheet ditulis melalui repository.
- `KD.api`: tindakan baca dicuba semula 2 kali jika sambungan gagal; `bridge.js` had masa 45 s untuk permintaan biasa.


## 0.4.0 — 2026-10-06
- **Hook `hourly`** (kerja setiap jam, cth. peringatan beberapa jam sebelum). Pencetus `hourlyMaintenance` dipasang automatik selepas deploy (migrasi automatik) dan oleh penyelenggaraan harian; tiada langkah manual.
- **i18n halaman awam**: `KD.i18n.add('en', kamus, peraturan)` + `KD.t()`; butang BM/EN muncul di pengepala awam bila kamus wujud. Bahasa dihantar ke pelayan (`meta.lang` → `ctx.lang`, juga dalam borang awam) dan `NotificationService.email(…, { lang: 'en' })`.
- `KD.detailActions[<modul>]` (butang tambahan di halaman butiran rekod) dan `KD.heroCta` (ganti butang utama landing).
- Kesihatan Sistem: `hourlyTriggerInstalled`.


## 0.3.0 — 2026-10-06
Penambahbaikan daripada membina Sistem Tempahan Ruang FKM.
- **Pendaftaran ditutup** kini disokong sepenuhnya: Super Admin pertama (`BOOTSTRAP_SUPER_ADMIN_EMAIL`) masih boleh mendaftar (`SETUP_PENDING` dalam config awam); pautan "Daftar" disembunyikan apabila ditutup; seed demo & E2E berfungsi dengan pendaftaran ditutup.
- **Ujian domain projek**: isytihar `AppTests.suites()` dalam `src/tests/` → dijalankan oleh `npm test` dan `runTestsPart5` di editor.
- E2E: `tools/e2e-values.json` (nilai medan khusus projek), dan semua halaman awam tersuai (`KD.extraRoutes`) disemak pada 360px.
- `publicForm.successLink` (butang pada halaman berjaya, cth. "Semak status").
- Warna jenama dalam emel (`CONFIG.BRAND_COLOR`, diset oleh `npm run init`).
- Menu Kategori disembunyikan jika tiada modul menggunakan medan `category`; nama pendek pada pengepala awam di telefon (elak skrol mendatar).
- Mock GAS: `Range.getDisplayValues()`.


## 0.2.0 — 2026-10-06
- Jenis medan **`ref`** (rujuk rekod modul lain, cth. ruang/peralatan): pilihan dalam borang dalaman & awam, label, penapis, validasi (hook `selectable`).
- Hook **`beforeStatus`** (halang perubahan status — cth. semak semula pertindihan semasa lulus) dan **`routes`** (laluan API khusus modul tanpa mengubah Router).
- `publicForm.rateKeyField` — had kadar borang awam per pemohon.
- Frontend: `KD.extraRoutes`, `KD.extraNav`, `KD.landingCards` untuk halaman tersuai; borang diisi awal daripada query URL.
- Data demo khusus melalui `tools/seed-custom.js`.

## 0.1.1 — 2026-10-06
- Storan pelayar (sesi, token push, pilihan) diasingkan mengikut `APP_SLUG` — beberapa sistem boleh dihoskan di bawah `<org>.github.io` yang sama tanpa sesi bertindih.
- DEPLOYMENT.md §0: pilihan hosting (organisasi, repo, domain sendiri).

## 0.1.0 — 2026-10-05
Versi pertama templat, diekstrak daripada Kirim Doa 1.6.1.

- **Enjin modul generik** (`CrudEngine`): modul ditakrif dalam `modules/*.json`; CRUD, aliran status, borang awam, lampiran Drive, no. rujukan, eksport CSV, notifikasi (app/telefon/email), hooks domain.
- **Penjana** `npm run gen` / `npm run new` dengan validasi JSON yang menerangkan kesilapan; `--check` untuk CI.
- **Jenama** `npm run init`: nama, slogan, warna (palet + semakan kontras), ikon PWA dijana tanpa kebergantungan.
- **Frontend dipacu metadata**: laluan, menu, navigasi telefon, dashboard, senarai/butiran/borang dijana pada masa larian; paparan tersuai pilihan per modul.
- **Migrasi automatik selepas deploy** (`Migration.autoRun`).
- **CI/CD GitHub Actions**: ujian (2 susunan muat) + E2E generik + semakan telefon 360px → `clasp push` + `update-deployment` → GitHub Pages; `DeployInfo.gs` (URL awam, commit).
- **Imbasan rahsia** (`tools/scan-secrets.js`).
- Teras dikekalkan daripada Kirim Doa: auth PBKDF2+pepper, sesi, RBAC, audit, tetapan runtime, kesihatan sistem, sandaran harian, push FCM v1 + lencana ikon, PWA + pasang, binaan GitHub Pages dengan CSP ketat.
