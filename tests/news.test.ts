import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { clip, decodeEntities, parseFeed, syncNews, toPublic, type NewsRow } from "../lib/news";

const dir = join(__dirname, "fixtures/news");
const feeds = readdirSync(dir).map((f) => readFileSync(join(dir, f), "utf8"));

describe("actualités", () => {
  it("décode les entités HTML", () => {
    expect(decodeEntities("C&#8217;est l&rsquo;adaptation&#8230; &amp; &#x41;")).toBe("C’est l’adaptation… & A");
  });

  it("coupe à la fin d'un mot", () => {
    expect(clip("un deux trois quatre", 12)).toBe("un deux…");
    expect(clip("court", 12)).toBe("court");
  });

  it("lit les vrais flux WordPress (titre, lien https, date, extrait propre)", () => {
    for (const xml of feeds) {
      const items = parseFeed(xml, "Test");
      expect(items.length).toBeGreaterThan(3);
      for (const it of items) {
        expect(it.source_url).toMatch(/^https:\/\//);
        expect(it.title.length).toBeGreaterThan(3);
        expect(it.title).not.toMatch(/<|&#/);
        expect(it.published_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        if (it.excerpt) {
          expect(it.excerpt.length).toBeLessThanOrEqual(280);
          expect(it.excerpt).not.toMatch(/est apparu en premier sur|<p>|&#8217;/);
        }
      }
    }
  });

  it("écarte liens non https et doublons", () => {
    const xml = `<rss><channel>
      <item><title>A</title><link>https://x.test/a</link></item>
      <item><title>A bis</title><link>https://x.test/a</link></item>
      <item><title>B</title><link>http://x.test/b</link></item>
      <item><title><![CDATA[C &amp; D]]></title><link>https://x.test/c</link><description><![CDATA[<p>Extrait.</p><p>L’article <a href="#">C</a> est apparu en premier sur Média.</p>]]></description></item>
    </channel></rss>`;
    const items = parseFeed(xml, "Média");
    expect(items.map((i) => i.title)).toEqual(["A", "C & D"]);
    expect(items[1].excerpt).toBe("Extrait.");
  });

  it("n'écrit rien en mode --dry-run", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(new Response(feeds[0], { status: 200 }));
    const db = { from: jest.fn() };
    const r = await syncNews(db as never, { dryRun: true, feeds: [{ name: "Test", url: "https://x.test/feed", site: "https://x.test" }] });
    expect(r[0].read).toBeGreaterThan(0);
    expect(r[0].error).toBeNull();
    expect(db.from).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("affiche le texte revu par l'admin s'il existe", () => {
    const row = { id: 1, source: "S", source_url: "https://x.test", title: "Brut", excerpt: "e", edited_title: "Revu", edited_excerpt: " ", published_at: null, categories: [] } as unknown as NewsRow;
    expect(toPublic(row)).toMatchObject({ title: "Revu", excerpt: "e" });
  });
});
