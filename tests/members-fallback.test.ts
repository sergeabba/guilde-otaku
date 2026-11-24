// Base injoignable : on ressert la dernière liste reçue (membres masqués déjà retirés),
// jamais la copie locale du site, qui ignore les membres masqués dans l'admin.
const reply: { data: unknown; error: unknown } = { data: null, error: null };
jest.mock("../lib/supabase", () => ({
  supabase: { from: () => ({ select: () => ({ order: async () => reply }) }) },
}));

const row = (id: number, name: string, hidden = false) => ({ id, name, rank: "Genin", hidden, position: id });

async function load() {
  let mod!: typeof import("../app/utils/dataAdapter");
  jest.isolateModules(() => { mod = require("../app/utils/dataAdapter"); });
  return mod;
}

describe("fetchMembers en cas de panne", () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); process.env.NEXT_PUBLIC_SUPABASE_URL = url; });

  async function run<T>(p: Promise<T>) { await jest.runAllTimersAsync(); return p; }

  it("ressert la dernière liste correcte, sans les membres masqués", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://exemple.supabase.co";
    const m = await load();
    reply.data = [row(1, "Alpha"), row(13, "Masqué", true)]; reply.error = null;
    expect((await run(m.fetchMembers())).map((x) => x.id)).toEqual([1]);

    m.invalidateMembersCache();
    reply.data = null; reply.error = { message: "panne" };
    const after = await run(m.fetchMembers());
    expect(after.map((x) => x.id)).toEqual([1]);
    expect(m.lastMembersFromLocal()).toBe(false);
  });

  it("base configurée mais jamais jointe : liste vide plutôt que la copie locale", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://exemple.supabase.co";
    const m = await load();
    reply.data = null; reply.error = { message: "panne" };
    expect(await run(m.fetchMembers())).toEqual([]);
    expect(m.lastMembersFromLocal()).toBe(true);
  });

  it("sans base configurée (démo) : copie locale", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const m = await load();
    reply.data = []; reply.error = null;
    expect((await run(m.fetchMembers())).length).toBeGreaterThan(0);
  });
});
