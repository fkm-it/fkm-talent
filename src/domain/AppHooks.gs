/**
 * @file AppHooks.gs
 * Titik sambungan peringkat aplikasi yang dipanggil oleh teras templat (lihat AuthService.register).
 */
const AppHooks = {
  /** Hanya e-mel dalam senarai Capaian AKTIF boleh mendaftar akaun. */
  beforeRegister: function (data, info) {
    // Ujian teras templat (sandbox DEV, e-mel @test.local / @demo.local, atau modul fixture) tidak tertakluk kepada senarai putih domain.
    if (Env.get('APP_ENV') === 'DEV' && /@(test|demo)\.local$/.test(String(data.email))) return;
    if (!CrudEngine.modules().some(function (d) { return d.key === 'capaian'; })) return;
    FkmAccess.assertCanRegister(data.email, info && info.isBootstrap);
  }
};
