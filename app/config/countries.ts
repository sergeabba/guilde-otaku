export interface Country {
  code: string;
  label: string;
}

export const COUNTRIES: Country[] = [
  { code: "ZA", label: "Afrique du Sud" },
  { code: "DZ", label: "Algérie" },
  { code: "DE", label: "Allemagne" },
  { code: "AO", label: "Angola" },
  { code: "AR", label: "Argentine" },
  { code: "AU", label: "Australie" },
  { code: "BE", label: "Belgique" },
  { code: "BJ", label: "Bénin" },
  { code: "BR", label: "Brésil" },
  { code: "BF", label: "Burkina Faso" },
  { code: "BI", label: "Burundi" },
  { code: "CM", label: "Cameroun" },
  { code: "CA", label: "Canada" },
  { code: "CN", label: "Chine" },
  { code: "CO", label: "Colombie" },
  { code: "KM", label: "Comores" },
  { code: "CG", label: "Congo" },
  { code: "KR", label: "Corée du Sud" },
  { code: "CI", label: "Côte d'Ivoire" },
  { code: "DJ", label: "Djibouti" },
  { code: "EG", label: "Égypte" },
  { code: "ES", label: "Espagne" },
  { code: "US", label: "États-Unis" },
  { code: "ET", label: "Éthiopie" },
  { code: "FR", label: "France" },
  { code: "GA", label: "Gabon" },
  { code: "GH", label: "Ghana" },
  { code: "GN", label: "Guinée" },
  { code: "IN", label: "Inde" },
  { code: "IT", label: "Italie" },
  { code: "JP", label: "Japon" },
  { code: "KE", label: "Kenya" },
  { code: "MG", label: "Madagascar" },
  { code: "ML", label: "Mali" },
  { code: "MA", label: "Maroc" },
  { code: "MR", label: "Mauritanie" },
  { code: "MX", label: "Mexique" },
  { code: "NE", label: "Niger" },
  { code: "NG", label: "Nigeria" },
  { code: "NL", label: "Pays-Bas" },
  { code: "PL", label: "Pologne" },
  { code: "PT", label: "Portugal" },
  { code: "CD", label: "RD Congo" },
  { code: "RO", label: "Roumanie" },
  { code: "GB", label: "Royaume-Uni" },
  { code: "RU", label: "Russie" },
  { code: "RW", label: "Rwanda" },
  { code: "SN", label: "Sénégal" },
  { code: "SE", label: "Suède" },
  { code: "CH", label: "Suisse" },
  { code: "TD", label: "Tchad" },
  { code: "TG", label: "Togo" },
  { code: "TN", label: "Tunisie" },
  { code: "TR", label: "Turquie" },
];

export function flagUrl(code: string, size = 24): string {
  return `https://flagcdn.com/${size}x${Math.round(size * 0.75)}/${code.toLowerCase()}.png`;
}

export function findCountryByLabel(label: string): Country | undefined {
  return COUNTRIES.find(c => c.label === label);
}

export function findCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}
