# Audit Sistem Lama — FKM Academic Talent & Career Intelligence Dashboard

**Tarikh:** 21 Okt 2026 · **Skop:** kod Apps Script lama (Config, Auth, Api, Data, Scoring, Utils, Migration, index.html — salinan dikemas kini 10 Sept 2026) dan 3 CV pilot.

> Nota: projek Apps Script live tidak dapat dibaca terus dari sesi ini (perlu kelayakan clasp). Audit berdasarkan salinan kod dalam Project. Jika kod live berbeza (cth. Hotfix Fasa 0 sudah dipasang), dapatan keselamatan berkaitan mungkin sudah ditutup — dapatan prestasi dan data tetap terpakai.

Sistem lama **tidak diubah**. Sistem baharu (`fkm-it/fkm-talent`) menggunakan projek Apps Script dan Google Sheet berasingan.

## 1. Ringkasan eksekutif

| # | Dapatan | Kesan | Status dalam sistem baharu |
|---|---|---|---|
| P1 | Cache `STAFF_PROFILE` ≈ **204 KB** melebihi had CacheService **100 KB** → `cache.put` gagal secara senyap | Setiap panggilan membaca Sheet penuh; cache tidak pernah berfungsi | Set data dimampat gzip + dipecah; dibatalkan automatik bila data berubah |
| P2 | `getDashboardData()` memanggil `calculatePromotionScore()` bagi setiap staf; setiap panggilan baca Sheet semula | ≈119 bacaan Sheet penuh satu permintaan (risiko had 6 minit / 30 s) | Skor dikira **sekali** semasa set data dibina, kemudian dicache |
| P3 | `audit_()` membuka Spreadsheet + `appendRow` + `deleteRows` pada **setiap** paparan (38 titik panggilan) | +0.5–1 s setiap permintaan | Audit teras templat (tulis berkelompok, hanya tindakan penting) |
| P4 | Simpan profil/CV/akaun guna `setValue()` sel demi sel (20 lokasi) | Lambat & tiada atomik | `bulkUpsert`: 1 bacaan + 2 tulisan berkelompok di bawah satu kunci |
| P5 | HtmlService iframe + Chart.js (≈200 KB) + pdf.js (≈320 KB) dimuat **menyekat** untuk semua pengguna | Muat awal perlahan, terutama telefon | GitHub Pages + PWA (aset dicache), carta SVG tanpa pustaka, pdf.js dimuat **hanya** di halaman Auto-Extract |
| L1 | Ambang jalur tidak konsisten: lencana 80/65 tetapi kiraan modul Promotion 75/55, Executive "ready" ≥55 | Jumlah HIJAU/KUNING berbeza antara paparan | Satu konfigurasi jalur untuk semua paparan |
| L2 | Dua salinan formula skor (pelayan & pelayar) | Pernah tidak selari (nota dalam Scoring.gs) | Satu enjin (`FkmScoring.gs`), pelayar tidak mengira |
| L3 | `gaps()` pelayar: `undefined < 25` → false | Jurang Kepimpinan/AI terlepas jika jam tiada | Nilai tiada dikira 0 |
| L4 | Pengekstrak CV: kiraan Pengerusi/Penceramah sentiasa **0** | PDF.js memecah tarikh `22/10 /2025`; regex tanpa `\s*` | Dibaiki; disahkan 9 / 9 / 5 pada 3 CV pilot |
| D1 | Nilai LPPT dalam data benih (`STAFF_ROWS`) **tidak sepadan** dengan CV | Ketiga-tiga CV pilot: data lama 78–82, CV sebenar 93–98 | Gatekeeper LPPT ≥85% menolak staf yang sebenarnya lulus → perlu Auto-Extract CV semula |
| D2 | Q1/Q2 & VIVA dalam `KPI_ROWS` tidak sepadan dengan CV | Satu pilot: Q1/Q2 data lama ≈4× lebih rendah daripada CV; VIVA dalaman dua pilot ≈2× lebih tinggi | Sama — jalankan Auto-Extract bagi semua CV |
| S1 | Kata laluan SHA-256 satu lelaran + salt | Mudah diteka jika sheet bocor | PBKDF2-HMAC-SHA256 + pepper (templat); hash lama **tidak** dipindah |
| S2 | Sesi dalam CacheService sahaja; boleh hilang (eviction) | Pengguna terkeluar rawak | Sesi dalam sheet (hash token) + cache |
| S3 | Fungsi penyelenggaraan boleh dipanggil melalui `google.script.run` tanpa log masuk (jika Hotfix Fasa 0 belum dipasang) | Kritikal | Templat: satu pintu `Router.dispatch` + `requireOwner_()` |
| S4 | `innerHTML` disambung terus dengan data sheet | XSS tersimpan | `html\`\`` auto-escape + CSP ketat (`script-src 'self'`) |

## 2. Pengesahan pengekstrak CV (3 CV pilot sebenar, PDF.js 3.11)

Medan teras **tepat** pada ketiga-tiga CV berbanding data yang telah disahkan: jumlah penerbitan, geran (PI/ahli), dana, projek & nilai perundingan (termasuk pembetulan jenis UTM + Others), penyeliaan PhD/Sarjana, anugerah, jawatankuasa, hak cipta, jam kredit UG/PG.

Perbezaan yang tinggal (LPPT, Q1/Q2 satu pilot, VIVA dalaman) ialah **data lama yang salah**, bukan pengekstrak — disemak terus pada teks CV (`LPPT Marks (3 years)`, baris berlabel kuartil, `MSc./PhD Internal Examiner`). Butiran per staf disimpan dalam Project Claude, bukan dalam repo awam ini.

**Tindakan disyorkan:** selepas import, jalankan Auto-Extract CV untuk semua 118 staf supaya KPI datang terus daripada CV.

## 3. Item tertangguh yang dibawa ke hadapan

1. **Benchmark rasmi** (`MIN_REQ`, minimum komponen, LPPT) — kini boleh diubah tanpa deploy: Panel → Tetapan → `FKM_SKOR` (JSON). Lencana "Benchmark: anggaran" dipaparkan sehingga `"rasmi": true`.
2. **Pengguna sebenar** — senarai Capaian diimport daripada `USER_ACCESS` lama; pengguna mendaftar semula dengan e-mel tersebut.
3. Scopus API / sheet perincian (PUBLICATION_RECORD dsb.) — belum (fasa seterusnya).
