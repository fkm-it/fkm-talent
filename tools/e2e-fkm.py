"""
e2e-fkm.py — ujian E2E paparan FKM Talent (dev server dengan data demo rekaan).
  npm run dev   (terminal 1)
  npm run e2e:fkm
Pilihan: KD_CV_DIR=/folder/berisi/pdf  → uji Auto-Extract CV dengan PDF sebenar (TEMPATAN SAHAJA; jangan commit PDF).
"""
from playwright.sync_api import sync_playwright
import os, glob

B = os.environ.get('KD_BASE', 'http://localhost:8080/')
SHOTS = os.environ.get('KD_SHOTS', 'e2e-shots')
os.makedirs(SHOTS, exist_ok=True)
errs, ok = [], []
def step(n): ok.append(n); print('✔', n)

def login(pg, email):
    pg.evaluate('localStorage.clear();sessionStorage.clear()')
    pg.goto(B + '#/log-masuk'); pg.reload(); pg.wait_for_selector('#f-email')
    pg.fill('#f-email', email); pg.fill('#f-password', 'Demo1234'); pg.click('button[type=submit]')
    pg.wait_for_function('location.hash.indexOf("log-masuk") < 0', timeout=20000); pg.wait_for_selector('#view.content'); pg.wait_for_timeout(300)

def no_hscroll(pg, tag):
    w = pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
    assert w <= 1, tag + ': skrol mendatar ' + str(w) + 'px'

def visit(pg, path, sel, tag, shot=None):
    pg.goto(B + '#' + path); pg.wait_for_selector(sel, timeout=20000); pg.wait_for_timeout(250)
    no_hscroll(pg, tag)
    if shot: pg.screenshot(path=os.path.join(SHOTS, shot), full_page=True)

with sync_playwright() as p:
    b = p.chromium.launch()
    for vp, w in (('desktop', 1280), ('telefon', 360)):
        pg = b.new_page(viewport={'width': w, 'height': 860 if w > 400 else 780})
        pg.route('https://fonts.**', lambda r: r.abort())
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(B); pg.wait_for_load_state('networkidle')
        pg.wait_for_selector('.fk-login .auth-card #f-email'); no_hscroll(pg, vp + ' log masuk')
        assert 'Intelligence Dashboard' in pg.text_content('.fk-login h1')
        pg.screenshot(path=os.path.join(SHOTS, 'fkm-%s-0-login.png' % vp))

        # ---- Pentadbir (Super Admin): 13 halaman rupa sistem lama
        login(pg, 'super@demo.local')
        assert '#/utama' in pg.url, 'admin mendarat di Executive Dashboard'
        visit(pg, '/utama', '.fk-kpi', vp + ' admin executive', 'fkm-%s-1-executive.png' % vp)
        pg.wait_for_function('document.querySelectorAll("canvas[data-chart]").length >= 5 && !!window.Chart', timeout=20000)
        assert pg.locator('.fk-nav-item').count() >= 13, 'menu penuh pentadbir'
        visit(pg, '/fkm/staf', '[data-tbl] tr[data-sid]', vp + ' admin direktori', 'fkm-%s-2-direktori.png' % vp)
        n_all = pg.locator('[data-tbl] tr[data-sid]').count()
        pg.fill('[data-q]', 'Demo 1)'); pg.wait_for_timeout(300)
        assert pg.locator('[data-tbl] tr[data-sid]').count() == 1, 'carian'
        pg.fill('[data-q]', ''); pg.select_option('[data-f="jabatan"]', 'KBPI'); pg.wait_for_timeout(200)
        assert 0 < pg.locator('[data-tbl] tr[data-sid]').count() < n_all, 'penapis jabatan'
        sid = pg.get_attribute('[data-tbl] tr[data-sid]', 'data-sid')
        pg.click('[data-tbl] tr[data-sid] td:first-child'); pg.wait_for_selector('.fk-modal:not(.hidden) .fk-ring'); no_hscroll(pg, vp + ' profil')
        assert pg.locator('.fk-modal .fk-gap-list li').count() >= 1 and pg.locator('.fk-modal [data-act="fk-edit"]').count() == 1
        pg.screenshot(path=os.path.join(SHOTS, 'fkm-%s-3-profil.png' % vp), full_page=True)
        # Borang sunting bertab: tukar tab, ubah medan, kiraan perubahan, simpan
        pg.click('.fk-modal [data-act="fk-edit"]'); pg.wait_for_selector('.fk-ef-tab[data-tab="penyelidikan"]'); no_hscroll(pg, vp + ' borang sunting')
        assert pg.locator('#ef_staffId[readonly]').count() == 1, 'Staff ID dikunci'
        pg.click('.fk-ef-tab[data-tab="penyelidikan"]'); SIT = '4321' if vp == 'desktop' else '5432'; pg.fill('#ef_sitasi', SIT)
        assert '(1)' in pg.text_content('.fk-ef-tab[data-tab="penyelidikan"]') and '1 perubahan' in pg.text_content('[data-ef-count]')
        pg.screenshot(path=os.path.join(SHOTS, 'fkm-%s-3b-sunting.png' % vp))
        pg.click('[data-act="ef-save"]'); pg.wait_for_selector('.fk-modal.hidden', state='attached', timeout=20000)
        pg.wait_for_selector('[data-tbl] tr[data-sid="%s"]' % sid)
        pg.click('[data-tbl] tr[data-sid="%s"] td:first-child' % sid); pg.wait_for_selector('.fk-modal:not(.hidden) .fk-ring')
        assert '{:,}'.format(int(SIT)) in pg.text_content('.fk-modal'), 'sitasi disimpan'
        pg.keyboard.press('Escape'); pg.wait_for_selector('.fk-modal.hidden', state='attached')
        # Tambah staf: medan wajib disahkan pelayan, kemudian berjaya
        pg.click('[data-act="fk-add"]'); pg.wait_for_selector('#ef_staffId:not([readonly])')
        pg.fill('#ef_staffId', '88' + ('1' if vp == 'desktop' else '2') + '01'); pg.click('[data-act="ef-save"]'); pg.wait_for_timeout(1200)
        assert pg.is_visible('.fk-modal:not(.hidden)') and pg.text_content('[data-ef-err]').strip(), 'nama/jabatan wajib'
        pg.fill('#ef_nama', 'STAF E2E ' + vp.upper()); pg.select_option('#ef_jabatan', 'TB'); pg.click('[data-act="ef-save"]')
        pg.wait_for_selector('.fk-modal.hidden', state='attached', timeout=20000)
        pg.fill('[data-q]', 'STAF E2E ' + vp.upper()); pg.wait_for_timeout(300)
        assert pg.locator('[data-tbl] tr[data-sid]').count() == 1, 'staf baharu dalam direktori'
        for path, sel in (('/fkm/kenaikan', 'tr[data-sid]'), ('/fkm/latihan', 'tr[data-sid]'), ('/fkm/penyelidikan', 'tr[data-sid]'), ('/fkm/geran', 'tr[data-sid]'),
                          ('/fkm/penyeliaan', 'tr[data-sid]'), ('/fkm/khidmat', 'tr[data-sid]'), ('/fkm/myra', 'tr[data-sid]')):
            visit(pg, path, sel, vp + ' ' + path, 'fkm-%s%s.png' % (vp, path.replace('/', '-')))
            assert pg.locator('.fk-nav-item.active[href="#%s"]' % path).count() == 1, 'menu aktif ' + path
        visit(pg, '/fkm/penasihat', '.fk-msg', vp + ' penasihat')
        pg.click('[data-ask]'); pg.wait_for_function('document.querySelectorAll(".fk-msg").length >= 3')
        pg.fill('[data-in]', 'latihan apa perlu?'); pg.press('[data-in]', 'Enter'); pg.wait_for_function('document.querySelectorAll(".fk-msg").length >= 5')
        pg.screenshot(path=os.path.join(SHOTS, 'fkm-%s-6-penasihat.png' % vp), full_page=True)
        visit(pg, '/fkm/capaian', '[data-ua-tbl] tr[data-id]', vp + ' capaian', 'fkm-%s-9-capaian.png' % vp)
        assert pg.locator('[data-ua-tbl] tr[data-id]').count() >= 3
        pg.wait_for_selector('[data-al-tbl] table')
        visit(pg, '/fkm/cv', '[data-act="pick"]', vp + ' cv')
        visit(pg, '/fkm/import', '#fkmSheet', vp + ' import')
        visit(pg, '/profil', '.fk-app #view', vp + ' profil templat dalam shell FKM')
        if pg.is_visible('[data-act="fk-menu"]'):
            pg.click('[data-act="fk-menu"]'); pg.wait_for_timeout(400)   # telefon: sidebar dibuka melalui menu
        pg.click('[data-act="fk-theme"]'); pg.wait_for_timeout(300)
        assert pg.get_attribute('.fk-app', 'data-theme') == 'dark'; pg.evaluate("localStorage.removeItem('fk.theme')")
        visit(pg, '/admin/staf', '.rec-item, table', vp + ' CRUD staf')
        visit(pg, '/admin/capaian', '.rec-item, table', vp + ' CRUD capaian')
        step(vp + ': pentadbir — semua halaman rupa sistem lama')

        # ---- Dekan: semua jabatan, tiada menu admin
        login(pg, 'user1@demo.local')
        visit(pg, '/fkm/staf', '[data-tbl] tr[data-sid]', vp + ' dekan direktori')
        assert pg.locator('[data-tbl] tr[data-sid]').count() >= 35, 'Dekan nampak semua staf aktif (35 demo + staf E2E)'
        assert pg.locator('a[href="#/fkm/capaian"], a[href="#/fkm/cv"], a[href="#/admin"]').count() == 0, 'tiada menu admin'
        pg.click('[data-tbl] tr[data-sid] td:first-child'); pg.wait_for_selector('.fk-modal:not(.hidden) .fk-ring')
        assert pg.locator('.fk-modal [data-act="fk-edit"]').count() == 0
        pg.goto(B + '#/fkm/capaian'); pg.wait_for_timeout(800); assert '#/utama' in pg.url, 'dekan dihalang dari User Access Control'
        step(vp + ': dekan nampak semua staf aktif, tiada butang sunting / menu admin')

        # ---- Ketua Jabatan KBPI
        login(pg, 'user0@demo.local')
        visit(pg, '/fkm/staf', '[data-tbl] tr[data-sid]', vp + ' hod direktori', 'fkm-%s-7-hod.png' % vp)
        depts = pg.eval_on_selector_all('[data-tbl] tr[data-sid] td:nth-child(2)', 'els => [...new Set(els.map(e => e.textContent.trim()))]')
        assert depts == ['KBPI'], 'HOD hanya KBPI: ' + str(depts)
        assert 'HOD · KBPI' in pg.text_content('[data-fk-role]')
        step(vp + ': ketua jabatan hanya nampak KBPI')

        # ---- Staf: profil sendiri sahaja
        login(pg, 'user@demo.local')
        pg.wait_for_selector('.fk-ring'); no_hscroll(pg, vp + ' staf utama')
        pg.screenshot(path=os.path.join(SHOTS, 'fkm-%s-8-staf.png' % vp), full_page=True)
        assert pg.locator('a[href="#/utama"].fk-nav-item, a[href="#/fkm/myra"]').count() == 0, 'staf tiada Executive/MyRA'
        visit(pg, '/fkm/staf', '.fk-ring', vp + ' staf → profil sendiri')
        visit(pg, '/fkm/latihan', 'tr[data-sid]', vp + ' staf latihan')
        assert pg.locator('tr[data-sid]').count() == 1
        visit(pg, '/fkm/myra', '.fk-ring', vp + ' staf myra → profil sendiri')
        step(vp + ': staf hanya nampak profil sendiri')

        # ---- Auto-Extract CV dengan PDF sebenar (pilihan, tempatan)
        cvdir = os.environ.get('KD_CV_DIR')
        if cvdir and vp == 'desktop':
            pdfs = sorted(glob.glob(os.path.join(cvdir, '*.pdf')))
            login(pg, 'super@demo.local')
            visit(pg, '/fkm/cv', '[data-act="pick"]', 'cv')
            pg.set_input_files('[data-file]', pdfs)
            pg.wait_for_selector('[data-act="save"]', timeout=60000)
            rows = pg.locator('[data-out] tbody tr').count()
            assert rows == len(pdfs), 'baris CV'
            assert pg.locator('[data-out] .fk-badge.b-green').count() == len(pdfs), 'semua CV sah'
            pg.screenshot(path=os.path.join(SHOTS, 'fkm-cv-pratonton.png'), full_page=True)
            pg.click('[data-act="save"]'); pg.wait_for_function('document.querySelector("[data-res]").textContent.length > 0', timeout=20000)
            res = pg.text_content('[data-res]')
            assert 'ralat' in res, 'staf CV tiada dalam data demo → ralat dijangka: ' + res
            step('Auto-Extract CV: %d PDF sebenar dibaca dalam pelayar (pdf.js tempatan); simpan menolak Staff ID tiada' % len(pdfs))
        pg.close()
    b.close()

if errs:
    print('Ralat JavaScript:', errs); raise SystemExit(1)
print('\n%d langkah lulus.' % len(ok))
