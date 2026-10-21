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
    pg.wait_for_function('location.hash.indexOf("log-masuk") < 0', timeout=20000); pg.wait_for_selector('#view.content')

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

        # ---- Pentadbir (Super Admin)
        login(pg, 'super@demo.local')
        visit(pg, '/utama', '.stat', vp + ' admin ringkasan', 'fkm-%s-1-ringkasan.png' % vp)
        assert pg.locator('.chart').count() >= 2 and pg.locator('.fkm-donut').count() >= 1
        visit(pg, '/admin/fkm/staf', '[data-rows] tr', vp + ' admin direktori', 'fkm-%s-2-direktori.png' % vp)
        n_all = pg.locator('[data-rows] tr').count()
        pg.fill('[data-q]', 'Demo 1)'); pg.wait_for_timeout(300)
        assert pg.locator('[data-rows] tr').count() == 1, 'carian'
        pg.fill('[data-q]', ''); pg.select_option('[data-f="jabatan"]', 'KBPI'); pg.wait_for_timeout(200)
        assert 0 < pg.locator('[data-rows] tr').count() < n_all, 'penapis jabatan'
        pg.click('[data-rows] tr a'); pg.wait_for_selector('.fkm-ring'); no_hscroll(pg, vp + ' profil')
        assert pg.locator('.fkm-gaps li').count() >= 1 and pg.locator('a[href*="/sunting"]').count() == 1
        pg.screenshot(path=os.path.join(SHOTS, 'fkm-%s-3-profil.png' % vp), full_page=True)
        visit(pg, '/admin/fkm/kenaikan', '.fkm-table tbody tr', vp + ' kenaikan', 'fkm-%s-4-kenaikan.png' % vp)
        for t in ('latihan', 'penyelidikan', 'geran', 'penyeliaan', 'khidmat', 'myra'):
            visit(pg, '/admin/fkm/analitik?tab=' + t, '.segmented [aria-pressed="true"][data-tab="%s"]' % t, vp + ' analitik ' + t, 'fkm-%s-5-%s.png' % (vp, t) if t in ('latihan', 'penyelidikan') else None)
        visit(pg, '/admin/fkm/penasihat', '.fkm-msg', vp + ' penasihat')
        pg.click('[data-ask]'); pg.wait_for_function('document.querySelectorAll(".fkm-msg").length >= 3')
        pg.fill('[data-in]', 'latihan apa perlu?'); pg.press('[data-in]', 'Enter'); pg.wait_for_function('document.querySelectorAll(".fkm-msg").length >= 5')
        pg.screenshot(path=os.path.join(SHOTS, 'fkm-%s-6-penasihat.png' % vp), full_page=True)
        visit(pg, '/admin/fkm/cv', '[data-act="pick"]', vp + ' cv')
        visit(pg, '/admin/fkm/import', '#fkmSheet', vp + ' import')
        visit(pg, '/admin/staf', '.rec-item, table', vp + ' CRUD staf')
        visit(pg, '/admin/capaian', '.rec-item, table', vp + ' CRUD capaian')
        step(vp + ': pentadbir — semua paparan FKM')

        # ---- Dekan: semua jabatan, tiada menu admin
        login(pg, 'user1@demo.local')
        visit(pg, '/fkm/staf', '[data-rows] tr', vp + ' dekan direktori')
        assert pg.locator('[data-rows] tr').count() == 35, 'Dekan nampak semua staf aktif (35)'
        assert pg.locator('a[href*="/sunting"]').count() == 0
        step(vp + ': dekan nampak 35 staf aktif, tiada butang sunting')

        # ---- Ketua Jabatan KBPI
        login(pg, 'user0@demo.local')
        visit(pg, '/fkm/staf', '[data-rows] tr', vp + ' hod direktori', 'fkm-%s-7-hod.png' % vp)
        depts = pg.eval_on_selector_all('[data-rows] tr td:nth-child(2)', 'els => [...new Set(els.map(e => e.textContent.trim()))]')
        assert depts == ['KBPI'], 'HOD hanya KBPI: ' + str(depts)
        step(vp + ': ketua jabatan hanya nampak KBPI')

        # ---- Staf: profil sendiri sahaja
        login(pg, 'user@demo.local')
        pg.wait_for_selector('.fkm-ring'); no_hscroll(pg, vp + ' staf utama')
        pg.screenshot(path=os.path.join(SHOTS, 'fkm-%s-8-staf.png' % vp), full_page=True)
        visit(pg, '/fkm/staf', '.fkm-ring', vp + ' staf → profil sendiri')
        visit(pg, '/fkm/kenaikan', '.fkm-table tbody tr', vp + ' staf kenaikan')
        assert pg.locator('.fkm-table tbody tr').count() == 1
        step(vp + ': staf hanya nampak profil sendiri')

        # ---- Auto-Extract CV dengan PDF sebenar (pilihan, tempatan)
        cvdir = os.environ.get('KD_CV_DIR')
        if cvdir and vp == 'desktop':
            pdfs = sorted(glob.glob(os.path.join(cvdir, '*.pdf')))
            login(pg, 'super@demo.local')
            visit(pg, '/admin/fkm/cv', '[data-act="pick"]', 'cv')
            pg.set_input_files('[data-file]', pdfs)
            pg.wait_for_selector('[data-act="save"]', timeout=60000)
            rows = pg.locator('.fkm-table tbody tr').count()
            assert rows == len(pdfs), 'baris CV'
            assert pg.locator('.badge-success').count() == len(pdfs), 'semua CV sah'
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
