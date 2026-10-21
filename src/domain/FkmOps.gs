/**
 * @file FkmOps.gs
 * Fungsi operasi pemilik untuk FKM Talent (jalankan dari editor Apps Script sahaja).
 */

/**
 * Import BACA SAHAJA daripada Google Sheet sistem lama (STAFF_PROFILE + USER_ACCESS).
 * Tetapkan dahulu Script Property LEGACY_SHEET_ID = ID Sheet lama. Selamat dijalankan berulang kali.
 */
function fkmImportLegacy() {
  requireOwner_();
  Migration.autoRun();
  const id = String(Env.get('LEGACY_SHEET_ID') || '').trim();
  if (!id) throw new Error('Tetapkan Script Property LEGACY_SHEET_ID (ID Google Sheet sistem lama) dahulu.');
  const owner = UserRepository.all().filter(function (u) { return u.role === ROLES.SUPER_ADMIN; })[0];
  const ctx = owner ? { userId: owner.user_id, role: owner.role, user: owner } : { userId: '', role: ROLES.SUPER_ADMIN };
  const r = FkmImport.fromLegacySheet(id, ctx);
  console.log(JSON.stringify(r, null, 2));
  return r;
}
