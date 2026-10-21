# FKM Talent Intelligence

Dashboard bakat & kesiapsiagaan kenaikan pangkat staf akademik **Fakulti Kejuruteraan Mekanikal, UTM** — versi baharu yang menggantikan *FKM Academic Talent & Career Intelligence Dashboard* (Apps Script salin-tampal).

- **Web + app telefon (PWA):** GitHub Pages — `https://fkm-it.github.io/fkm-talent/`
- **Backend:** Google Apps Script + Google Sheets (projek & Sheet **baharu**, berasingan daripada sistem lama)
- **Deploy:** `git push main` → GitHub Actions (ujian → `clasp push` → kemas kini deployment → GitHub Pages). Tiada salin-tampal ke editor.
- Dibina atas templat [`kirimdoa/gas-pwa-starter`](docs/TEMPLAT.md).

## Ciri

Antara muka mengekalkan rupa sistem lama (sidebar, kad KPI, carta Chart.js, jadual):

| Halaman | Siapa | Kandungan |
|---|---|---|
| Executive Dashboard | Admin, Dekan, Ketua Jabatan | 7 KPI, taburan gred & jabatan, purata skor jabatan, pematuhan latihan, trend penerbitan |
| Staff Profile | ikut skop (staf: profil sendiri) | Direktori + penapis, profil penuh dalam modal, analisis jurang |
| Promotion Readiness | ikut skop | GREEN/YELLOW/RED, carta radar komponen, senarai skor |
| Training / Research / Grant / Supervision / Khidmat & Perundingan | ikut skop | KPI, carta, rekod per staf |
| MyRA Audit Score | Admin, Dekan, Ketua Jabatan | Anggaran indikatif |
| Auto-Extract CV | Admin | PDF CV Akademik UTM dibaca **dalam pelayar** (pdf.js), simpan pukal |
| AI Career Advisor | ikut skop | Analisis berasaskan peraturan daripada data profil |
| User Access Control | Admin | Matriks RBAC, senarai capaian (peranan/skop/status), status akaun, pautan reset, audit log |
| Import Sistem Lama | Super Admin | Salin STAFF_PROFILE + USER_ACCESS daripada Sheet lama (baca sahaja, idempoten) |
| Panel Pentadbir | Admin | Panel templat: Pengguna, CRUD Staf/Capaian, Tetapan, Audit, Kesihatan |

**Peranan & skop data** (ditapis di pelayan):

| Peranan | Data |
|---|---|
| ADMIN / SUPER_ADMIN (menu Pengguna) | Semua + tindakan tulis |
| Capaian `DEAN` | Semua jabatan, baca sahaja |
| Capaian `HOD` + skop `KBPI` | Jabatan KBPI sahaja |
| Capaian `STAFF` + skop Staff ID | Profil sendiri sahaja |
| Tiada capaian | Tiada data |

Hanya e-mel dalam senarai **Capaian** (domain UTM) boleh mendaftar. Nyahaktif staf (Bersara/Tamat kontrak…) → capaian & akaun log masuk dinyahaktif dan sesi ditamatkan serta-merta.

**Skor:** formula UTM 4 komponen (45/30/15/10) + minimum komponen + gatekeeper LPPT ≥85% — sama seperti sistem lama, satu enjin di pelayan (`src/domain/FkmScoring.gs`). Benchmark boleh diubah di **Panel → Tetapan → FKM_SKOR** tanpa deploy.

## Persediaan sekali sahaja

Rujuk [DEPLOYMENT.md](DEPLOYMENT.md) §1 (clasp login, projek Apps Script, deployment Web App, GitHub Secrets/Variables). Khusus FKM:

1. Script Properties: `BOOTSTRAP_SUPER_ADMIN_EMAIL` = e-mel anda, `LEGACY_SHEET_ID` = ID Google Sheet sistem lama, `APP_ENV` = `PRODUCTION`.
2. Daftar di laman web dengan e-mel bootstrap → anda Super Admin.
3. Panel → **Import Sistem Lama** → *Mula import* (atau jalankan `fkmImportLegacy` dalam editor).
4. Panel → Capaian: semak senarai; staf mendaftar sendiri dengan e-mel yang disenaraikan. Naikkan admin di menu **Pengguna**.
5. (Disyorkan) Panel → Auto-Extract CV untuk semua staf — data lama ada nilai LPPT/Q1/Q2 yang tidak sepadan dengan CV (lihat [audit](docs/AUDIT_SISTEM_LAMA.md)).

## Pembangunan

```bash
npm test            # 76 ujian backend (2 susunan muat), termasuk suite domain FKM
npm run check       # semakan frontend & imbasan rahsia
npm run dev         # http://localhost:8080 — data demo REKAAN
npm run e2e         # E2E generik templat
npm run e2e:fkm     # E2E 13 halaman FKM × 4 peranan, desktop + telefon 360px
                    # KD_CV_DIR=/folder/pdf npm run e2e:fkm → uji Auto-Extract dengan PDF sebenar (TEMPATAN sahaja)
```

Akaun demo (kata laluan `Demo1234`): `super@demo.local` (Super Admin), `user1@demo.local` (Dekan), `user0@demo.local` (Ketua Jabatan KBPI), `user@demo.local` (Staf).

## Struktur khusus FKM

```
modules/staf.json, modules/capaian.json   definisi modul (85 + 5 medan) → npm run gen
src/domain/FkmConfig.gs     konfigurasi skor (lalai + tetapan FKM_SKOR)
src/domain/FkmScoring.gs    enjin skor & analisis jurang
src/domain/FkmAccess.gs     RBAC domain (DEAN/HOD/STAFF), gerbang pendaftaran, penyelarasan akaun
src/domain/FkmData.gs       set data dashboard + cache termampat (gzip)
src/domain/FkmImport.gs     import sistem lama & simpan CV (bulkUpsert)
src/modules/staf/StafHooks.gs, capaian/CapaianHooks.gs   peraturan domain + laluan API staf.*
src/frontend/modules/staf.html   shell FKM (KD.shells.app) + semua halaman + pengekstrak CV
src/tests/AppTests.gs       ujian domain
pwa/vendor/pdfjs/, chartjs/  pdf.js 3.11.174 & Chart.js 4.4.1 (dimuat malas, CSP 'self')
```

**Privasi:** tiada data staf sebenar dalam repo. Data hanya dalam Google Sheet pemilik; PDF CV tidak pernah dimuat naik ke pelayan.
