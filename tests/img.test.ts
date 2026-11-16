import { optimizedSrc } from "../lib/img";
describe("optimizedSrc", () => {
  it("redimensionne les images locales et Supabase, laisse les autres", () => {
    expect(optimizedSrc("/photos/a.jpg", 300)).toBe("/_next/image?url=%2Fphotos%2Fa.jpg&w=384&q=75");
    expect(optimizedSrc("https://x.supabase.co/storage/v1/object/public/f/a.jpg", 600)).toContain("w=640");
    expect(optimizedSrc("https://exemple.com/a.jpg", 300)).toBe("https://exemple.com/a.jpg");
    expect(optimizedSrc("/logo.svg", 100)).toBe("/logo.svg");
    expect(optimizedSrc(undefined, 100)).toBeUndefined();
  });
});
