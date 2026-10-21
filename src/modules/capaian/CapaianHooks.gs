/**
 * @file CapaianHooks.gs
 * Senarai putih pendaftaran + peranan/skop data FKM.
 */
const CapaianHooks = {
  validate: function (data, info) {
    const cur = info.current || {};
    const email = data.email !== undefined ? StringUtils.normalizeEmail(data.email) : String(cur.email || '');
    if (data.email !== undefined) {
      if (!FkmAccess.domainAllowed(email)) {
        throw Errors.validation('Domain e-mel tidak dibenarkan. Dibenarkan: ' + FkmConfig.domains().join(', '), { email: 'Guna e-mel UTM.' });
      }
      const clash = FkmAccess.repo().all().some(function (r) {
        return r.state === RECORD_STATE.ACTIVE && String(r.email).toLowerCase() === email && r.id !== cur.id;
      });
      if (clash) throw Errors.conflict('E-mel ini sudah ada dalam senarai capaian.');
    }
    const peranan = data.peranan || cur.peranan;
    const skop = data.skop !== undefined ? String(data.skop || '').trim() : String(cur.skop || '');
    if (peranan === 'HOD' && !FkmConfig.JABATAN()[skop.toUpperCase()]) {
      throw Errors.validation('Ketua Jabatan memerlukan skop kod jabatan: ' + Object.keys(FkmConfig.JABATAN()).join(', '), { skop: 'Kod jabatan.' });
    }
    if (peranan === 'STAFF' && skop && !/^\d{1,8}$/.test(FkmImport.normId(skop))) {
      throw Errors.validation('Skop staf mesti Staff ID (nombor).', { skop: 'Staff ID.' });
    }
  },

  beforeSave: function (row, info) {
    const cur = (info && info.current) || {};
    if (row.email) row.email = StringUtils.normalizeEmail(row.email);
    const peranan = row.peranan || cur.peranan;
    if (row.skop !== undefined || row.peranan !== undefined) {
      let skop = String(row.skop !== undefined ? row.skop : cur.skop || '').trim();
      if (peranan === 'HOD') skop = skop.toUpperCase();
      if (peranan === 'DEAN') skop = '';
      if (peranan === 'STAFF') {
        skop = FkmImport.normId(skop);
        if (!skop) {
          // Isi automatik daripada rekod staf dengan e-mel yang sama
          const email = row.email || cur.email;
          const st = CrudEngine.repo(CrudEngine.get('staf')).all().filter(function (r) {
            return r.state === RECORD_STATE.ACTIVE && String(r.email).toLowerCase() === String(email).toLowerCase();
          })[0];
          if (st) skop = String(st.staff_id);
        }
      }
      row.skop = skop;
    }
  },

  /** Capaian dinyahaktif → akaun log masuk dinyahaktif & sesi ditamatkan serta-merta (dan sebaliknya). */
  afterStatus: function (row, prev, ctx) {
    FkmAccess.syncUser(row.email, row.status === 'AKTIF', ctx, 'capaian ' + prev + ' → ' + row.status);
  }
};
