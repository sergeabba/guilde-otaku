import { optimizedSrc } from "../lib/img";
describe("optimizedSrc", () => {
  it("petites images du site telles quelles ; Supabase et le reste servis en direct", () => {
    expect(optimizedSrc("/photos/a.jpg", 300)).toBe("/photos/a.jpg");
    expect(optimizedSrc("https://x.supabase.co/storage/v1/object/public/f/a.jpg", 600)).toBe("https://x.supabase.co/storage/v1/object/public/f/a.jpg");
    expect(optimizedSrc("https://exemple.com/a.jpg", 300)).toBe("https://exemple.com/a.jpg");
    expect(optimizedSrc("/logo.svg", 100)).toBe("/logo.svg");
    expect(optimizedSrc(undefined, 100)).toBeUndefined();
  });
});
