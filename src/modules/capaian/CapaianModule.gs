/**
 * DIJANA oleh tools/gen.js daripada modules/capaian.json — JANGAN sunting dengan tangan.
 * Ubah fail JSON, kemudian jalankan: npm run gen
 */
const CapaianModule = Object.freeze(Object.assign(
  {
    "key": "capaian",
    "name": "Capaian",
    "label": "Capaian Pengguna",
    "labelPlural": "Capaian Pengguna",
    "icon": "shield",
    "prefix": "CP",
    "refFormat": "CP-{SEQ4}",
    "description": "Senarai e-mel yang dibenarkan mendaftar, beserta peranan (Dekan / Ketua Jabatan / Staf) dan skop data. Pentadbir sistem diurus di menu Pengguna.",
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
      }
    ],
    "titleField": "email",
    "subtitleField": "nama",
    "nav": {
      "user": false,
      "admin": true,
      "order": 20
    },
    "fields": [
      {
        "key": "email",
        "label": "E-mel UTM",
        "type": "email",
        "required": true,
        "list": true,
        "search": true,
        "hint": "Hanya domain UTM yang dibenarkan (lihat Tetapan).",
        "column": "email"
      },
      {
        "key": "nama",
        "label": "Nama",
        "type": "string",
        "max": 120,
        "list": true,
        "search": true,
        "column": "nama"
      },
      {
        "key": "peranan",
        "label": "Peranan",
        "type": "enum",
        "required": true,
        "list": true,
        "filter": true,
        "default": "STAFF",
        "options": [
          {
            "value": "DEAN",
            "label": "Dekan / pengurusan — semua jabatan"
          },
          {
            "value": "HOD",
            "label": "Ketua Jabatan — jabatan sendiri"
          },
          {
            "value": "STAFF",
            "label": "Staf akademik — profil sendiri"
          }
        ],
        "column": "peranan"
      },
      {
        "key": "skop",
        "label": "Skop",
        "type": "string",
        "max": 20,
        "list": true,
        "hint": "HOD: kod jabatan (cth. KBPI). STAFF: Staff ID (diisi automatik daripada e-mel jika kosong). DEAN: kosongkan.",
        "column": "skop"
      },
      {
        "key": "catatan",
        "label": "Catatan",
        "type": "text",
        "max": 500,
        "column": "catatan"
      }
    ],
    "path": "/capaian",
    "sheet": "CAPAIAN",
    "defaultStatus": "AKTIF",
    "statusRole": "ADMIN"
  },
  { hooks: function () { return typeof CapaianHooks !== 'undefined' ? CapaianHooks : {}; } }
));
