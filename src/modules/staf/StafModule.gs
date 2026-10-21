/**
 * DIJANA oleh tools/gen.js daripada modules/staf.json — JANGAN sunting dengan tangan.
 * Ubah fail JSON, kemudian jalankan: npm run gen
 */
const StafModule = Object.freeze(Object.assign(
  {
    "key": "staf",
    "name": "Staf",
    "label": "Staf Akademik",
    "labelPlural": "Staf Akademik",
    "icon": "users",
    "prefix": "SF",
    "refFormat": "STF-{SEQ4}",
    "description": "Profil, pencapaian KPI dan status perkhidmatan staf akademik FKM. Diisi melalui import, Auto-Extract CV atau suntingan admin.",
    "access": {
      "create": "ADMIN",
      "list": "OWN",
      "edit": "ADMIN",
      "delete": "ADMIN",
      "ownerEditStatuses": []
    },
    "notify": {
      "adminsOnCreate": false,
      "ownerOnStatus": false
    },
    "statuses": [
      {
        "value": "AKTIF",
        "label": "Aktif",
        "tone": "success"
      },
      {
        "value": "TIDAK_AKTIF",
        "label": "Tidak aktif",
        "tone": "muted"
      },
      {
        "value": "BERSARA",
        "label": "Bersara",
        "tone": "muted"
      },
      {
        "value": "LETAK_JAWATAN",
        "label": "Letak jawatan / berpindah",
        "tone": "warn"
      },
      {
        "value": "TAMAT_KONTRAK",
        "label": "Tamat kontrak",
        "tone": "danger"
      }
    ],
    "titleField": "nama",
    "subtitleField": "jawatan",
    "nav": {
      "user": false,
      "admin": true,
      "order": 10
    },
    "fields": [
      {
        "key": "staffId",
        "label": "Staff ID",
        "type": "string",
        "required": true,
        "max": 12,
        "list": true,
        "search": true,
        "lockAfterCreate": true,
        "hint": "Kunci utama — padanan untuk Auto-Extract CV.",
        "column": "staff_id"
      },
      {
        "key": "gelaran",
        "label": "Gelaran",
        "type": "string",
        "max": 40,
        "placeholder": "cth. PROF. IR. DR.",
        "column": "gelaran"
      },
      {
        "key": "nama",
        "label": "Nama penuh",
        "type": "string",
        "required": true,
        "max": 120,
        "list": true,
        "search": true,
        "column": "nama"
      },
      {
        "key": "email",
        "label": "E-mel UTM",
        "type": "email",
        "search": true,
        "column": "email"
      },
      {
        "key": "telefon",
        "label": "Telefon",
        "type": "phone",
        "adminOnly": true,
        "column": "telefon"
      },
      {
        "key": "jabatan",
        "label": "Jabatan",
        "type": "enum",
        "required": true,
        "list": true,
        "filter": true,
        "options": [
          {
            "value": "KAAS",
            "label": "KAAS — Aeronautik, Automotif & Ocean"
          },
          {
            "value": "KBPI",
            "label": "KBPI — Bahan, Pembuatan & Industri"
          },
          {
            "value": "MGR",
            "label": "MGR — Mekanikal Gunaan & Reka Bentuk"
          },
          {
            "value": "TB",
            "label": "TB — Termo-Bendalir"
          },
          {
            "value": "AAS",
            "label": "AAS — Aeroangkasa"
          }
        ],
        "column": "jabatan"
      },
      {
        "key": "jawatan",
        "label": "Jawatan",
        "type": "string",
        "max": 60,
        "list": true,
        "search": true,
        "placeholder": "cth. Profesor Madya DS54",
        "column": "jawatan"
      },
      {
        "key": "gred",
        "label": "Gred",
        "type": "string",
        "max": 20,
        "search": true,
        "column": "gred"
      },
      {
        "key": "jawatanPentadbiran",
        "label": "Jawatan pentadbiran",
        "type": "string",
        "max": 30,
        "placeholder": "LECTURER / HOD / DEAN / TDA …",
        "column": "jawatan_pentadbiran"
      },
      {
        "key": "sasaran",
        "label": "Sasaran kenaikan pangkat",
        "type": "enum",
        "filter": true,
        "default": "DS54",
        "options": [
          {
            "value": "DS14",
            "label": "DS14"
          },
          {
            "value": "DS54",
            "label": "DS54"
          },
          {
            "value": "VK7",
            "label": "VK7"
          },
          {
            "value": "VK6",
            "label": "VK6"
          },
          {
            "value": "VK5",
            "label": "VK5"
          },
          {
            "value": "VK5 (Kekal)",
            "label": "VK5 (Kekal)"
          }
        ],
        "column": "sasaran"
      },
      {
        "key": "kelayakan",
        "label": "Kelayakan tertinggi",
        "type": "string",
        "max": 40,
        "column": "kelayakan"
      },
      {
        "key": "bidangKepakaran",
        "label": "Bidang kepakaran",
        "type": "string",
        "max": 120,
        "search": true,
        "column": "bidang_kepakaran"
      },
      {
        "key": "nicheArea",
        "label": "Niche area FKM",
        "type": "string",
        "max": 120,
        "column": "niche_area"
      },
      {
        "key": "researchAlliance",
        "label": "Research alliance",
        "type": "string",
        "max": 80,
        "column": "research_alliance"
      },
      {
        "key": "rgNama",
        "label": "Research group",
        "type": "string",
        "max": 120,
        "column": "rg_nama"
      },
      {
        "key": "rgKod",
        "label": "Kod RG",
        "type": "string",
        "max": 20,
        "column": "rg_kod"
      },
      {
        "key": "rgPeranan",
        "label": "Peranan dalam RG",
        "type": "enum",
        "options": [
          {
            "value": "LEADER",
            "label": "LEADER"
          },
          {
            "value": "DEPUTY",
            "label": "DEPUTY"
          },
          {
            "value": "MEMBER",
            "label": "MEMBER"
          }
        ],
        "column": "rg_peranan"
      },
      {
        "key": "institut",
        "label": "Institut / CoE",
        "type": "string",
        "max": 40,
        "column": "institut"
      },
      {
        "key": "peranCoe",
        "label": "Peranan CoE",
        "type": "string",
        "max": 40,
        "column": "peran_coe"
      },
      {
        "key": "rgBaharu",
        "label": "RG baharu",
        "type": "string",
        "max": 20,
        "column": "rg_baharu"
      },
      {
        "key": "statusPerkhidmatan",
        "label": "Status perkhidmatan",
        "type": "enum",
        "filter": true,
        "options": [
          {
            "value": "PERMANENT",
            "label": "PERMANENT"
          },
          {
            "value": "CONTRACT",
            "label": "CONTRACT"
          }
        ],
        "column": "status_perkhidmatan"
      },
      {
        "key": "warganegara",
        "label": "Warganegara",
        "type": "enum",
        "options": [
          {
            "value": "LOCAL",
            "label": "LOCAL"
          },
          {
            "value": "FOREIGN",
            "label": "FOREIGN"
          }
        ],
        "column": "warganegara"
      },
      {
        "key": "negara",
        "label": "Negara",
        "type": "string",
        "max": 60,
        "column": "negara"
      },
      {
        "key": "lantikanPertama",
        "label": "Lantikan pertama",
        "type": "date",
        "column": "lantikan_pertama"
      },
      {
        "key": "lantikanSemasa",
        "label": "Lantikan jawatan kini",
        "type": "date",
        "column": "lantikan_semasa"
      },
      {
        "key": "tamatPerkhidmatan",
        "label": "Tamat perkhidmatan",
        "type": "date",
        "column": "tamat_perkhidmatan"
      },
      {
        "key": "tarikhLahir",
        "label": "Tarikh lahir",
        "type": "date",
        "adminOnly": true,
        "column": "tarikh_lahir"
      },
      {
        "key": "umur",
        "label": "Umur",
        "type": "int",
        "min": 18,
        "max": 90,
        "column": "umur"
      },
      {
        "key": "kohort",
        "label": "Kohort",
        "type": "string",
        "max": 4,
        "column": "kohort"
      },
      {
        "key": "tempohKhidmat",
        "label": "Tempoh perkhidmatan (tahun)",
        "type": "int",
        "min": 0,
        "max": 60,
        "column": "tempoh_khidmat"
      },
      {
        "key": "scopusId",
        "label": "Scopus ID",
        "type": "string",
        "max": 20,
        "column": "scopus_id"
      },
      {
        "key": "pub",
        "label": "Jumlah penerbitan",
        "type": "int",
        "min": 0,
        "max": 5000,
        "column": "pub"
      },
      {
        "key": "q0",
        "label": "Penerbitan tanpa kuartil",
        "type": "int",
        "min": 0,
        "max": 5000,
        "column": "q0"
      },
      {
        "key": "q1",
        "label": "Q1",
        "type": "int",
        "min": 0,
        "max": 5000,
        "column": "q1"
      },
      {
        "key": "q2",
        "label": "Q2",
        "type": "int",
        "min": 0,
        "max": 5000,
        "column": "q2"
      },
      {
        "key": "q3",
        "label": "Q3",
        "type": "int",
        "min": 0,
        "max": 5000,
        "column": "q3"
      },
      {
        "key": "q4",
        "label": "Q4",
        "type": "int",
        "min": 0,
        "max": 5000,
        "column": "q4"
      },
      {
        "key": "scopusCount",
        "label": "Bilangan Scopus",
        "type": "int",
        "min": 0,
        "max": 5000,
        "column": "scopus_count"
      },
      {
        "key": "wos",
        "label": "Bilangan WoS",
        "type": "int",
        "min": 0,
        "max": 5000,
        "column": "wos"
      },
      {
        "key": "sitasi",
        "label": "Sitasi",
        "type": "int",
        "min": 0,
        "max": 1000000,
        "column": "sitasi"
      },
      {
        "key": "hIndex",
        "label": "Indeks-H",
        "type": "int",
        "min": 0,
        "max": 500,
        "column": "h_index"
      },
      {
        "key": "pub2020",
        "label": "Penerbitan 2020",
        "type": "int",
        "min": 0,
        "max": 500,
        "column": "pub2020"
      },
      {
        "key": "pub2021",
        "label": "Penerbitan 2021",
        "type": "int",
        "min": 0,
        "max": 500,
        "column": "pub2021"
      },
      {
        "key": "pub2022",
        "label": "Penerbitan 2022",
        "type": "int",
        "min": 0,
        "max": 500,
        "column": "pub2022"
      },
      {
        "key": "pub2023",
        "label": "Penerbitan 2023",
        "type": "int",
        "min": 0,
        "max": 500,
        "column": "pub2023"
      },
      {
        "key": "pub2024",
        "label": "Penerbitan 2024",
        "type": "int",
        "min": 0,
        "max": 500,
        "column": "pub2024"
      },
      {
        "key": "pub2025",
        "label": "Penerbitan 2025",
        "type": "int",
        "min": 0,
        "max": 500,
        "column": "pub2025"
      },
      {
        "key": "geran",
        "label": "Jumlah geran",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "geran"
      },
      {
        "key": "geranAktif",
        "label": "Geran aktif",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "geran_aktif"
      },
      {
        "key": "geranPi",
        "label": "Geran sebagai PI",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "geran_pi"
      },
      {
        "key": "dana",
        "label": "Dana geran (RM)",
        "type": "number",
        "min": 0,
        "max": 1000000000,
        "decimals": 2,
        "column": "dana"
      },
      {
        "key": "phdSelia",
        "label": "Penyeliaan PhD",
        "type": "int",
        "min": 0,
        "max": 500,
        "column": "phd_selia"
      },
      {
        "key": "phdTamat",
        "label": "PhD bergraduat",
        "type": "int",
        "min": 0,
        "max": 500,
        "column": "phd_tamat"
      },
      {
        "key": "sarjanaSelia",
        "label": "Penyeliaan Sarjana",
        "type": "int",
        "min": 0,
        "max": 500,
        "column": "sarjana_selia"
      },
      {
        "key": "sarjanaTamat",
        "label": "Sarjana bergraduat",
        "type": "int",
        "min": 0,
        "max": 500,
        "column": "sarjana_tamat"
      },
      {
        "key": "jamAjarUg",
        "label": "Jam kredit UG",
        "type": "int",
        "min": 0,
        "max": 5000,
        "column": "jam_ajar_ug"
      },
      {
        "key": "jamAjarPg",
        "label": "Jam kredit PG",
        "type": "int",
        "min": 0,
        "max": 5000,
        "column": "jam_ajar_pg"
      },
      {
        "key": "jamLatihan",
        "label": "Jumlah jam latihan",
        "type": "number",
        "min": 0,
        "max": 5000,
        "decimals": 1,
        "column": "jam_latihan"
      },
      {
        "key": "latihanWajib",
        "label": "Latihan wajib lengkap",
        "type": "bool",
        "filter": true,
        "column": "latihan_wajib"
      },
      {
        "key": "latihanPdp",
        "label": "Latihan: Teaching & Learning (jam)",
        "type": "number",
        "min": 0,
        "max": 1000,
        "decimals": 1,
        "column": "latihan_pdp"
      },
      {
        "key": "latihanPenyelidikan",
        "label": "Latihan: Research (jam)",
        "type": "number",
        "min": 0,
        "max": 1000,
        "decimals": 1,
        "column": "latihan_penyelidikan"
      },
      {
        "key": "latihanAi",
        "label": "Latihan: Artificial Intelligence (jam)",
        "type": "number",
        "min": 0,
        "max": 1000,
        "decimals": 1,
        "column": "latihan_ai"
      },
      {
        "key": "latihanDigital",
        "label": "Latihan: Digital Transformation (jam)",
        "type": "number",
        "min": 0,
        "max": 1000,
        "decimals": 1,
        "column": "latihan_digital"
      },
      {
        "key": "latihanKepimpinan",
        "label": "Latihan: Leadership (jam)",
        "type": "number",
        "min": 0,
        "max": 1000,
        "decimals": 1,
        "column": "latihan_kepimpinan"
      },
      {
        "key": "latihanProfesional",
        "label": "Latihan: Professional Development (jam)",
        "type": "number",
        "min": 0,
        "max": 1000,
        "decimals": 1,
        "column": "latihan_profesional"
      },
      {
        "key": "projekPerundingan",
        "label": "Projek perundingan",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "projek_perundingan"
      },
      {
        "key": "nilaiPerundingan",
        "label": "Nilai perundingan (RM)",
        "type": "number",
        "min": 0,
        "max": 1000000000,
        "decimals": 2,
        "column": "nilai_perundingan"
      },
      {
        "key": "vivaDalaman",
        "label": "Pemeriksa VIVA dalaman",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "viva_dalaman"
      },
      {
        "key": "vivaLuar",
        "label": "Pemeriksa VIVA luar",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "viva_luar"
      },
      {
        "key": "penilaiGeran",
        "label": "Penilai geran",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "penilai_geran"
      },
      {
        "key": "pewasitJurnal",
        "label": "Pewasit jurnal",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "pewasit_jurnal"
      },
      {
        "key": "jkAntarabangsa",
        "label": "J/kuasa antarabangsa",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "jk_antarabangsa"
      },
      {
        "key": "jkKebangsaan",
        "label": "J/kuasa kebangsaan",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "jk_kebangsaan"
      },
      {
        "key": "jkUniversiti",
        "label": "J/kuasa universiti",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "jk_universiti"
      },
      {
        "key": "jkFakulti",
        "label": "J/kuasa fakulti",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "jk_fakulti"
      },
      {
        "key": "pengerusiSesi",
        "label": "Pengerusi / penceramah jemputan",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "pengerusi_sesi"
      },
      {
        "key": "anugerahAntarabangsa",
        "label": "Anugerah antarabangsa",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "anugerah_antarabangsa"
      },
      {
        "key": "anugerahKebangsaan",
        "label": "Anugerah kebangsaan",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "anugerah_kebangsaan"
      },
      {
        "key": "anugerahUtm",
        "label": "Anugerah UTM",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "anugerah_utm"
      },
      {
        "key": "hakCipta",
        "label": "Hak cipta / harta intelek",
        "type": "int",
        "min": 0,
        "max": 1000,
        "column": "hak_cipta"
      },
      {
        "key": "lppt2025",
        "label": "LPPT 2025 (%)",
        "type": "number",
        "min": 0,
        "max": 100,
        "decimals": 2,
        "column": "lppt2025"
      },
      {
        "key": "lppt2024",
        "label": "LPPT 2024 (%)",
        "type": "number",
        "min": 0,
        "max": 100,
        "decimals": 2,
        "column": "lppt2024"
      },
      {
        "key": "lppt2023",
        "label": "LPPT 2023 (%)",
        "type": "number",
        "min": 0,
        "max": 100,
        "decimals": 2,
        "column": "lppt2023"
      },
      {
        "key": "sumberData",
        "label": "Sumber data terkini",
        "type": "enum",
        "readonly": true,
        "options": [
          {
            "value": "IMPORT",
            "label": "IMPORT"
          },
          {
            "value": "CV",
            "label": "CV"
          },
          {
            "value": "MANUAL",
            "label": "MANUAL"
          }
        ],
        "column": "sumber_data"
      },
      {
        "key": "cvDikemaskini",
        "label": "CV terakhir diekstrak",
        "type": "date",
        "readonly": true,
        "column": "cv_dikemaskini"
      }
    ],
    "path": "/staf",
    "sheet": "STAF",
    "defaultStatus": "AKTIF",
    "statusRole": "ADMIN"
  },
  { hooks: function () { return typeof StafHooks !== 'undefined' ? StafHooks : {}; } }
));
