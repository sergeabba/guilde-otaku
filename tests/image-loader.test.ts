import { directSrc } from "../lib/image-loader";
import { optimizedSrc } from "../lib/img";

describe("sources d'images (quota de l'optimiseur Vercel)", () => {
  it("garde l'optimiseur pour les images du site seulement", () => {
    expect(directSrc("/photos/craig.jpg", 640)).toBeNull();
    expect(optimizedSrc("/photos/craig.jpg", 640)).toMatch(/^\/_next\/image\?url=%2Fphotos%2Fcraig\.jpg&w=640/);
  });
  it("sert Supabase tel quel, TMDB à la bonne taille, MangaDex en vignette", () => {
    const sb = "https://abc.supabase.co/storage/v1/object/public/atelier/lizzy.jpg";
    expect(directSrc(sb, 640)).toBe(sb);
    expect(optimizedSrc(sb, 640)).toBe(sb);
    expect(directSrc("https://image.tmdb.org/t/p/original/x.jpg", 300)).toBe("https://image.tmdb.org/t/p/w342/x.jpg");
    expect(directSrc("https://image.tmdb.org/t/p/w500/x.jpg", 2000)).toBe("https://image.tmdb.org/t/p/original/x.jpg");
    expect(directSrc("https://uploads.mangadex.org/covers/id/file.jpg", 200)).toBe("https://uploads.mangadex.org/covers/id/file.jpg.256.jpg");
    expect(directSrc("https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/x.jpg", 300)).toBe("https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/x.jpg");
  });
});
