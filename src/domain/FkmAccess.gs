/**
 * @file FkmAccess.gs
 * RBAC domain FKM di atas peranan teras templat:
 *   ADMIN / SUPER_ADMIN (teras)  → semua data, semua tindakan
 *   USER + Capaian DEAN          → semua jabatan, baca sahaja
 *   USER + Capaian HOD           → jabatan dalam `skop` sahaja
 *   USER + Capaian STAFF         → profil sendiri (`skop` = Staff ID)
 *   USER tanpa Capaian AKTIF     → tiada data
 * Ditapis di PELAYAN (satu pintu: FkmData.scoped) — pelayar tidak pernah menerima data di luar skop.
 */
const FkmAccess = {
  ROLES: ['DEAN', 'HOD', 'STAFF'],

  repo: function () { return CrudEngine.repo(CrudEngine.get('capaian')); },

  /** Rekod capaian AKTIF bagi e-mel (null jika tiada). */
  forEmail: function (email) {
    const e = StringUtils.normalizeEmail(email);
    if (!e) return null;
    return FkmAccess.repo().all().filter(function (r) {
      return r.state === RECORD_STATE.ACTIVE && r.status === 'AKTIF' && String(r.email).toLowerCase() === e;
    })[0] || null;
  },

  /** @return {{peranan:string, skop:string, label:string}} */
  resolve: function (ctx) {
    if (ctx && SecurityService.hasRole(ctx.role, ROLES.ADMIN)) return { peranan: 'ADMIN', skop: '', label: 'Pentadbir sistem' };
    const rec = ctx && ctx.user ? FkmAccess.forEmail(ctx.user.email) : null;
    if (!rec) return { peranan: 'TIADA', skop: '', label: 'Tiada capaian' };
    const labels = { DEAN: 'Dekan / pengurusan', HOD: 'Ketua Jabatan ' + rec.skop, STAFF: 'Staf akademik' };
    return { peranan: rec.peranan, skop: String(rec.skop || ''), label: labels[rec.peranan] || rec.peranan };
  },

  /** Tapis senarai staf mengikut capaian. */
  filter: function (list, access) {
    switch (access.peranan) {
      case 'ADMIN':
      case 'DEAN': return list;
      case 'HOD': return list.filter(function (s) { return s.jabatan === access.skop; });
      case 'STAFF': return list.filter(function (s) { return s.sid === access.skop; });
      default: return [];
    }
  },

  domainAllowed: function (email) {
    const d = String(email || '').toLowerCase().split('@')[1] || '';
    return FkmConfig.domains().indexOf(d) >= 0;
  },

  /**
   * Selaraskan status akaun log masuk (USERS teras) dengan capaian/rekod staf.
   * Hanya akaun peranan USER disentuh — akaun pentadbir tidak pernah dinyahaktif secara automatik.
   * @return {string} ringkasan tindakan ('' jika tiada akaun)
   */
  syncUser: function (email, active, ctx, reason) {
    const user = UserRepository.findByEmail(StringUtils.normalizeEmail(email));
    if (!user || user.role !== ROLES.USER) return '';
    const next = active ? USER_STATUS.ACTIVE : USER_STATUS.INACTIVE;
    if (user.status === next) return '';
    UserRepository.update(user.user_id, { status: next });
    UserService.invalidate(user.user_id);
    const revoked = active ? 0 : AuthService.revokeAllForUser(user.user_id);
    AuditService.log(ctx, active ? AUDIT_ACTIONS.USER_ACTIVATED : AUDIT_ACTIONS.USER_DEACTIVATED, 'USER', user.user_id,
      user.status + ' → ' + next + ' · ' + (reason || 'diselaraskan') + (revoked ? ' · ' + revoked + ' sesi ditamatkan' : ''));
    return 'akaun log masuk ' + StringUtils.maskEmail(user.email) + ' → ' + next;
  },

  /**
   * Gerbang pendaftaran (dipanggil oleh AppHooks.beforeRegister): hanya e-mel dalam Capaian AKTIF
   * (atau BOOTSTRAP_SUPER_ADMIN_EMAIL sebelum Super Admin pertama wujud) boleh mendaftar.
   */
  assertCanRegister: function (email, isBootstrap) {
    if (isBootstrap) return;
    if (!FkmAccess.forEmail(email)) {
      throw Errors.forbidden('E-mel ini belum disenaraikan untuk akses sistem. Hubungi Unit IT FKM untuk didaftarkan.');
    }
  }
};
