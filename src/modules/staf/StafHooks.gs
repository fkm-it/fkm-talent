/**
 * @file StafHooks.gs
 * Logik domain modul "Staf Akademik" + laluan API dashboard FKM.
 */
const StafHooks = {
  /** Staff ID unik & format nombor. */
  validate: function (data, info) {
    if (data.staffId !== undefined) {
      const id = FkmImport.normId(data.staffId);
      if (!/^\d{1,8}$/.test(id)) throw Errors.validation('Staff ID mesti nombor (1–8 digit).', { staffId: 'Nombor sahaja.' });
      const cur = info.current;
      const clash = CrudEngine.repo(CrudEngine.get('staf')).all().some(function (r) {
        return r.state === RECORD_STATE.ACTIVE && String(r.staff_id) === id && (!cur || r.id !== cur.id);
      });
      if (clash) throw Errors.conflict('Staff ID ' + id + ' sudah wujud.');
    }
  },

  beforeSave: function (row, info) {
    if (row.staff_id !== undefined) row.staff_id = FkmImport.normId(row.staff_id);
    if (row.email) row.email = String(row.email).toLowerCase();
    // Suntingan melalui borang admin direkod sebagai MANUAL (import/CV menetapkan sumbernya sendiri)
    if (info && info.ctx && info.ctx.userId && !row.sumber_data && !info.bulk) row.sumber_data = 'MANUAL';
  },

  /**
   * Status perkhidmatan berubah → selaraskan capaian & akaun log masuk staf tersebut
   * (sistem lama: setStaffStatus menyelaraskan USER_ACCESS secara manual dalam fungsi yang sama).
   */
  afterStatus: function (row, prev, ctx) {
    if (!row.email) return;
    const active = FkmData.isActiveStatus(row.status);
    const cap = FkmAccess.repo().all().filter(function (r) {
      return r.state === RECORD_STATE.ACTIVE && String(r.email).toLowerCase() === String(row.email).toLowerCase();
    })[0];
    if (cap && cap.status !== (active ? 'AKTIF' : 'TIDAK_AKTIF')) {
      FkmAccess.repo().update(cap.id, { status: active ? 'AKTIF' : 'TIDAK_AKTIF', status_note: 'Diselaraskan: staf ' + row.status, updated_at: DateUtils.nowIso() });
    }
    FkmAccess.syncUser(row.email, active, ctx, 'status staf ' + prev + ' → ' + row.status);
  },

  routes: {
    /** Set data dashboard, ditapis mengikut capaian peminta. */
    'staf.data': { role: 'USER', fn: function (payload, ctx) { return FkmData.scoped(ctx); } },

    /** Senarai capaian + status akaun (User Access Control). */
    'staf.akses': { role: 'ADMIN', fn: function () { return { items: FkmAccess.overview() }; } },

    /** Simpan hasil Auto-Extract CV (pentadbir). */
    'staf.cvSave': {
      role: 'ADMIN',
      fn: function (payload, ctx) {
        SecurityService.rateLimit('staf.cvSave', ctx.userId);
        return FkmImport.saveCv(payload && payload.items, ctx);
      }
    },

    /** Semakan integriti: Sheet sistem lama vs pangkalan data baharu vs set data dashboard (baca sahaja). */
    'staf.semak': {
      role: 'ADMIN',
      fn: function (payload, ctx) {
        SecurityService.rateLimit('staf.cvSave', ctx.userId);
        const id = String((payload && payload.sheetId) || Env.get('LEGACY_SHEET_ID') || '').trim();
        return FkmImport.reconcile(id);
      }
    },

    /** Import baca-sahaja daripada Sheet sistem lama (Super Admin). */
    'staf.importLegacy': {
      role: 'SUPER_ADMIN',
      fn: function (payload, ctx) {
        const id = String((payload && payload.sheetId) || Env.get('LEGACY_SHEET_ID') || '').trim();
        return FkmImport.fromLegacySheet(id, ctx);
      }
    }
  }
};
