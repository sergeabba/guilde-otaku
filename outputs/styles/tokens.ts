// ─── GUILDE OTAKU · DESIGN TOKENS ────────────────────────────────────────────
// Remplace les centaines de styles inline répétés partout dans le projet.
// Importe ce fichier dans tes composants : import { t } from "@/styles/tokens"

export const font = "'Barlow Condensed', sans-serif";

// ─── COULEURS ─────────────────────────────────────────────────────────────────
export const colors = {
  gold:       "#c9a84c",
  goldLight:  "rgba(201,168,76,0.15)",
  goldBorder: "rgba(201,168,76,0.3)",
  goldGlow:   "rgba(201,168,76,0.5)",

  bg:         "#050508",
  bgCard:     "rgba(255,255,255,0.02)",
  bgHover:    "rgba(255,255,255,0.04)",
  bgActive:   "rgba(255,255,255,0.07)",

  border:     "rgba(255,255,255,0.07)",
  borderHover:"rgba(255,255,255,0.14)",

  textPrimary:   "#fff",
  textSecondary: "rgba(255,255,255,0.5)",
  textMuted:     "rgba(255,255,255,0.25)",
  textLabel:     "rgba(255,255,255,0.35)",

  success:    "#34d399",
  danger:     "#f87171",
  info:       "#60a5fa",
  youtube:    "#f87171",
} as const;

// ─── TYPOGRAPHIE ──────────────────────────────────────────────────────────────
export const typography = {
  // Labels / badges au-dessus des titres
  overline: {
    fontFamily: font,
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.3em",
    textTransform: "uppercase" as const,
    color: colors.gold,
  },
  // Titres de section
  sectionLabel: {
    fontFamily: font,
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.25em",
    textTransform: "uppercase" as const,
    color: colors.gold,
  },
  // Corps de texte courant
  body: {
    fontFamily: font,
    fontSize: "15px",
    fontWeight: 500,
    color: colors.textSecondary,
    lineHeight: 1.6,
  },
  // Labels de champs de formulaire
  label: {
    display: "block" as const,
    fontFamily: font,
    fontSize: "11px",
    fontWeight: 800,
    color: colors.textLabel,
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    marginBottom: "8px",
  },
  // Valeurs meta (ex: "2024 · Studio")
  meta: {
    fontFamily: font,
    fontSize: "12px",
    fontWeight: 600,
    color: colors.textMuted,
    letterSpacing: "0.06em",
  },
} as const;

// ─── COMPOSANTS ───────────────────────────────────────────────────────────────
export const components = {
  // Carte de base (bibliothèque, résultats, etc.)
  card: {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: "16px",
    padding: "20px",
    transition: "all 0.3s ease",
  },
  // Champ de saisie
  input: {
    width: "100%" as const,
    padding: "11px 14px",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${colors.border}`,
    borderRadius: "10px",
    color: colors.textPrimary,
    fontFamily: font,
    fontSize: "16px",
    boxSizing: "border-box" as const,
  },
  // Tag / badge petit (genre, année, épisodes)
  tag: {
    fontFamily: font,
    fontSize: "10px",
    color: colors.textSecondary,
    background: "rgba(255,255,255,0.06)",
    padding: "2px 7px",
    borderRadius: "100px",
    border: `1px solid ${colors.border}`,
  },
  // Bouton principal doré
  btnPrimary: {
    padding: "13px 24px",
    background: colors.gold,
    border: "none",
    borderRadius: "12px",
    cursor: "pointer" as const,
    fontFamily: font,
    fontWeight: 900,
    fontSize: "15px",
    color: "#000",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "8px",
    flexShrink: 0,
  },
  // Bouton secondaire (annuler, ghost)
  btnSecondary: {
    padding: "13px 20px",
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${colors.border}`,
    borderRadius: "12px",
    cursor: "pointer" as const,
    color: colors.textSecondary,
    fontFamily: font,
    fontSize: "14px",
  },
  // Pill de filtre (catégorie, tier)
  filterPill: {
    fontFamily: font,
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    padding: "8px 14px",
    borderRadius: "100px",
    cursor: "pointer" as const,
    transition: "all 0.2s",
  },
} as const;

// ─── ANIMATIONS ──────────────────────────────────────────────────────────────
export const animations = {
  // fadeUp standard (pour les cards au scroll)
  fadeUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  },
  // scale pour les modals
  scaleIn: {
    initial: { scale: 0.9, y: 20, opacity: 0 },
    animate: { scale: 1, y: 0, opacity: 1 },
    exit:    { scale: 0.9, y: 20, opacity: 0 },
  },
  // Slide pour les banners (birthday, success)
  slideDown: {
    initial: { y: -50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit:    { y: -50, opacity: 0 },
  },
  // Transition de page (utilisé dans template.tsx)
  pageTransition: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: -8 },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
} as const;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
// Génère les styles d'un pill de filtre actif/inactif
export function filterPillStyle(isActive: boolean, activeColor = colors.gold) {
  return {
    ...components.filterPill,
    background: isActive ? activeColor : "rgba(255,255,255,0.04)",
    color: isActive ? "#000" : colors.textSecondary,
    border: `1px solid ${isActive ? activeColor : "rgba(255,255,255,0.08)"}`,
  };
}

// Génère les styles d'une card au survol
export function cardHoverStyle(hovered: boolean, accentColor = colors.goldBorder) {
  return {
    ...components.card,
    background: hovered ? colors.bgHover : colors.bgCard,
    border: `1px solid ${hovered ? accentColor : colors.border}`,
    transform: hovered ? "translateY(-4px)" : "translateY(0px)",
    boxShadow: hovered ? `0 8px 24px rgba(0,0,0,0.3)` : "none",
  };
}
