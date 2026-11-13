import { planUpload, slugify, MAX_BYTES } from "../lib/admin-upload";
import { youtubeId } from "../lib/youtube";

describe("planUpload", () => {
  const ok = { kind: "photo", contentType: "image/jpeg", size: 700_000, memberId: 4, memberName: "Serge \"Le Don\"" };

  it("crée un chemin unique et horodaté dans fighters/", () => {
    const a = planUpload(ok, 1_000_000), b = planUpload(ok, 2_000_000);
    expect(a).toEqual({ path: "fighters/serge_le_don_4_photo_lfls.jpg", field: "photo" });
    expect(b).not.toEqual(a);
  });

  it("associe chaque type au bon champ", () => {
    expect(planUpload({ ...ok, kind: "anime" })).toHaveProperty("field", "animechar");
    expect(planUpload({ ...ok, kind: "animevideo", contentType: "video/mp4" })).toHaveProperty("field", "animevideo");
  });

  it("refuse les formats, tailles et membres invalides", () => {
    expect(planUpload({ ...ok, contentType: "image/svg+xml" })).toHaveProperty("error");
    expect(planUpload({ ...ok, contentType: "video/mp4" })).toEqual({ error: "une vidéo n'est pas une image" });
    expect(planUpload({ ...ok, size: MAX_BYTES.image + 1 })).toHaveProperty("error");
    expect(planUpload({ ...ok, size: 0 })).toHaveProperty("error");
    expect(planUpload({ ...ok, memberId: "4" })).toHaveProperty("error");
    expect(planUpload({ ...ok, kind: "../../etc" })).toHaveProperty("error");
  });

  it("produit un nom de fichier sûr", () => {
    expect(slugify("../Éméraude Norina/")).toBe("emeraude_norina");
    expect(slugify("")).toBe("membre");
  });
});

describe("youtubeId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://music.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://evil.example/watch?v=dQw4w9WgXcQ", null],
    ["pas un lien", null],
  ])("%s", (input, expected) => expect(youtubeId(input)).toBe(expected));
});
