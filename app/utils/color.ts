/** Couleur de texte lisible ("#111" ou "#fff") posée sur un aplat `hex`. */
export function onColor(hex: string): "#111" | "#fff" {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#111";
  const n = parseInt(m[1], 16);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  // Seuil où le contraste avec #111 dépasse celui avec #fff
  return L > 0.26 ? "#111" : "#fff";
}
