// Captures d'une page (ordinateur 1440 px et iPhone 13) avec défilement lent pour
// déclencher les apparitions, et contrôles : erreurs JS, débordement horizontal.
//
//   node scripts/qa/shoot.mjs /membres/1 [sortie=./qa-shots] [base=http://localhost:3008]
// Utilise le Playwright préinstallé (require global), sans dépendance au projet.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");
const [route = "/", out = "qa-shots", base = "http://localhost:3008"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

const b = await chromium.launch();
for (const [tag, opts] of [["desk", { viewport: { width: 1440, height: 900 } }], ["phone", devices["iPhone 13"]]]) {
  const ctx = await b.newContext({ ...opts, deviceScaleFactor: 1 });
  await ctx.addCookies([{ name: "guilde-splash-seen", value: "1", url: base }]);
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message.slice(0, 200)));
  await p.goto(base + route, { waitUntil: "networkidle" }).catch(() => {});
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 250)); }
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(500);
  const file = `${out}/${route.replace(/\W+/g, "_") || "home"}_${tag}.png`;
  await p.screenshot({ path: file, fullPage: true });
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log(JSON.stringify({ tag, file, overflowX: overflow, errors: errs }));
  await ctx.close();
}
await b.close();
