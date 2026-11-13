// Lecture d'un lien YouTube saisi dans l'admin.

/** Identifiant YouTube à partir d'une URL (watch, youtu.be, shorts, embed) ou de l'identifiant seul. */
export function youtubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return /^[\w-]{11}$/.test(u.pathname.slice(1)) ? u.pathname.slice(1) : null;
    if (host === "youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const m = /^\/(?:shorts|embed|live)\/([\w-]{11})/.exec(u.pathname);
      if (m) return m[1];
    }
  } catch { /* pas une URL */ }
  return null;
}
