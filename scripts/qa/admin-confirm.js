// Test isolé des confirmations d'actions sensibles dans l'administration (téléphone).
// Session admin simulée dans ce seul navigateur ; données d'équipes FICTIVES servies par
// le test ; toutes les écritures sont interceptées et enregistrées, jamais envoyées.
// Lancer : OUT=/tmp/sortie node scripts/qa/admin-confirm.js (serveur de dev sur le port 3011).
const { chromium, devices } = require("playwright");
const out = process.env.OUT || ".";
const base = "http://localhost:3011";
const FAKE_TEAM = { id: 9101, slug: "test", name: "Équipe fictive de test", sport: "basket", formation: "5 majeur", color: "#ef6c00", motto: null, position: 0, published: false, slots: [] };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices["iPhone 13"] });
  await ctx.addCookies([{ name: "guilde-splash-seen", value: "1", url: base }]);
  const writes = [];
  await ctx.route("**/api/admin/verify", (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
  await ctx.route("**/api/admin/teams", (r) => {
    if (r.request().method() === "GET") return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ available: true, teams: [FAKE_TEAM] }) });
    writes.push({ method: r.request().method(), url: r.request().url().replace(base, ""), body: r.request().postData() });
    r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await ctx.route("**/api/admin/db", (r) => { writes.push({ method: "POST", url: "/api/admin/db", body: r.request().postData() }); r.fulfill({ status: 200, contentType: "application/json", body: '{"data":[{"id":1}]}' }); });
  await ctx.route("**/rest/v1/**", (r) => (r.request().method() === "GET" ? r.fallback() : (writes.push({ blocked: r.request().url() }), r.abort())));
  const p = await ctx.newPage();

  // 1. Teams : suppression d'une équipe fictive → confirmation → annulation → confirmation → suppression.
  await p.goto(base + "/admin-teams", { waitUntil: "networkidle", timeout: 180000 }); await p.waitForTimeout(1500);
  await p.locator("button", { hasText: "Supprimer" }).first().click(); await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/confirm-teams.png` });
  await p.locator("button", { hasText: "Annuler" }).click(); await p.waitForTimeout(300);
  const afterCancel = writes.length;
  await p.locator("button", { hasText: "Supprimer" }).first().click(); await p.waitForTimeout(300);
  await p.locator("[role=dialog] button, [role=alertdialog] button", { hasText: /^Supprimer$/ }).last().click(); await p.waitForTimeout(800);

  // 2. Bons plans : la suppression demande aussi confirmation (on annule).
  await p.goto(base + "/admin-bons-plans", { waitUntil: "networkidle", timeout: 180000 }); await p.waitForTimeout(1200);
  await p.locator("button", { hasText: "Supprimer" }).first().click(); await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/confirm-bons-plans.png` });
  const hasDialog = await p.locator("[role=dialog], [role=alertdialog]").count();
  await p.locator("button", { hasText: "Annuler" }).click(); await p.waitForTimeout(300);

  console.log(JSON.stringify({ afterCancel, writes: writes.map((w) => w.method + " " + (w.url || w.blocked)), bonsPlansDialog: hasDialog }));
  await b.close();
})();
