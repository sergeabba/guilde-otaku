// Textures et masques de la Guilde, en SVG encodé (aucune image à télécharger).

const enc = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** Bord peint au pinceau : masque pour fondre un portrait dans la page (au lieu d'un cadre). */
export function brushMask(seed = 3, inset = 7): string {
  return enc(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><filter id='b' x='-20%' y='-20%' width='140%' height='140%'><feTurbulence type='fractalNoise' baseFrequency='.09 .05' numOctaves='3' seed='${seed}'/><feDisplacementMap in='SourceGraphic' scale='9'/></filter><rect x='${inset}' y='${inset}' width='${100 - inset * 2}' height='${100 - inset * 2}' fill='#000' filter='url(#b)'/></svg>`);
}

/** Grain de papier (multiplier au-dessus d'un fond). */
export const PAPER_GRAIN = enc(`<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .22 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`);

/** Motif d'étoiles à quatre branches (trame de la Guilde). */
export function starTile(color = "#000", size = 28): string {
  return enc(`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 28 28'><path d='M14 6 L15.4 12.6 L22 14 L15.4 15.4 L14 22 L12.6 15.4 L6 14 L12.6 12.6 Z' fill='${color}'/></svg>`);
}
