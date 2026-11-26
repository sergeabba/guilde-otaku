// Lancer : OUT=/tmp/sortie node scripts/qa/admin-mock.js (serveur de dev sur le port 3011).
// Test isolé de l'administration des membres : seul ce navigateur de test voit une session
// admin factice (réponse simulée de /api/admin/verify). Toutes les écritures vers /api/admin/*
// sont interceptées et enregistrées ici, jamais envoyées au serveur ni à la base.
// Lecture des membres : vraie lecture publique (lecture seule).
const { chromium, devices } = require("playwright");
const fs = require("fs");
const base = "http://localhost:3011";
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices["iPhone 13"] });
  await ctx.addCookies([{ name: "guilde-splash-seen", value: "1", url: base }]);
  const writes = [];
  await ctx.route("**/api/admin/verify", (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
  await ctx.route("**/api/admin/**", (r) => {
    const u = r.request().url();
    if (u.endsWith("/api/admin/verify")) return r.fallback();
    const body = r.request().postData();
    writes.push({ url: u.replace(base, ""), method: r.request().method(), body: body ? JSON.parse(body) : null });
    let data = [];
    try { const j = JSON.parse(body || "{}"); data = j.id ? [{ id: j.id }] : (j.rows || []).map((x, i) => ({ id: 99000 + i, ...x })); } catch {}
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data, ok: true }) });
  });
  // Toute écriture directe vers Supabase (REST hors lecture) est bloquée par sécurité.
  await ctx.route("**/rest/v1/**", (r) => (r.request().method() === "GET" ? r.fallback() : (writes.push({ blocked: r.request().url() }), r.abort())));
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(base + "/admin-membres", { waitUntil: "networkidle", timeout: 120000 }); await p.waitForTimeout(1500);
  await p.screenshot({ path: (process.env.OUT || ".") + "/list-phone.png" });
  // Recherche puis ouverture de l'éditeur de Godwin.
  await p.fill("input[type=search]", "Godwin"); await p.waitForTimeout(500);
  await p.screenshot({ path: (process.env.OUT || ".") + "/search-phone.png" });
  await p.locator("button[aria-label^='Modifier'], button:has-text('Modifier')").first().click(); await p.waitForTimeout(800);
  await p.locator("[role=tab]", { hasText: "Portraits" }).click(); await p.waitForTimeout(500);
  const sel = p.locator("fieldset:has(legend:has-text('Scènes de pouvoir')) select").nth(1);
  await sel.scrollIntoViewIfNeeded(); await sel.selectOption("glace"); await p.waitForTimeout(300);
  await p.locator("fieldset:has(legend:has-text('Scènes de pouvoir')) button", { hasText: "Aperçu" }).nth(1).click(); await p.waitForTimeout(1200);
  await p.locator(".am-ps-preview").scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  await p.screenshot({ path: (process.env.OUT || ".") + "/preview-phone.png" });
  // Enregistrement (intercepté).
  await p.locator("button", { hasText: /^Enregistrer$/ }).click(); await p.waitForTimeout(1200);
  await p.screenshot({ path: (process.env.OUT || ".") + "/saved-phone.png" });
  // Suppression (interceptée) : onglet Identité, bouton Supprimer, confirmation.
  await p.locator("[role=tab]", { hasText: "Identité" }).click(); await p.waitForTimeout(400);
  await p.locator("button", { hasText: "Supprimer…" }).click(); await p.waitForTimeout(500);
  await p.screenshot({ path: (process.env.OUT || ".") + "/confirm-phone.png" });
  await p.locator("button", { hasText: /^Supprimer Godwin/ }).click(); await p.waitForTimeout(1200);
  await p.screenshot({ path: (process.env.OUT || ".") + "/deleted-phone.png" });
  fs.writeFileSync((process.env.OUT || ".") + "/writes.json", JSON.stringify(writes, null, 1));
  console.log("writes", writes.length, JSON.stringify(writes).slice(0, 600)); console.log("errors", errs.slice(0, 3));
  await b.close();
})();
