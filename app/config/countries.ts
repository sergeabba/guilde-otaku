export interface Country {
  code: string;
  label: string;
  prep: string; // "en France", "au Sénégal", "aux États-Unis"
}

// Règle française : "en" pour féminin/voyelle, "au" pour masculin consonne, "aux" pour pluriel
export const COUNTRIES: Country[] = [
  { code: "ZA", label: "Afrique du Sud", prep: "en Afrique du Sud" },
  { code: "DZ", label: "Algérie", prep: "en Algérie" },
  { code: "DE", label: "Allemagne", prep: "en Allemagne" },
  { code: "AO", label: "Angola", prep: "en Angola" },
  { code: "AR", label: "Argentine", prep: "en Argentine" },
  { code: "AU", label: "Australie", prep: "en Australie" },
  { code: "BE", label: "Belgique", prep: "en Belgique" },
  { code: "BJ", label: "Bénin", prep: "au Bénin" },
  { code: "BR", label: "Brésil", prep: "au Brésil" },
  { code: "BF", label: "Burkina Faso", prep: "au Burkina Faso" },
  { code: "BI", label: "Burundi", prep: "au Burundi" },
  { code: "CM", label: "Cameroun", prep: "au Cameroun" },
  { code: "CA", label: "Canada", prep: "au Canada" },
  { code: "CN", label: "Chine", prep: "en Chine" },
  { code: "CO", label: "Colombie", prep: "en Colombie" },
  { code: "KM", label: "Comores", prep: "aux Comores" },
  { code: "CG", label: "Congo", prep: "au Congo" },
  { code: "KR", label: "Corée du Sud", prep: "en Corée du Sud" },
  { code: "CI", label: "Côte d'Ivoire", prep: "en Côte d'Ivoire" },
  { code: "DJ", label: "Djibouti", prep: "à Djibouti" },
  { code: "EG", label: "Égypte", prep: "en Égypte" },
  { code: "ES", label: "Espagne", prep: "en Espagne" },
  { code: "US", label: "États-Unis", prep: "aux États-Unis" },
  { code: "ET", label: "Éthiopie", prep: "en Éthiopie" },
  { code: "FR", label: "France", prep: "en France" },
  { code: "GA", label: "Gabon", prep: "au Gabon" },
  { code: "GH", label: "Ghana", prep: "au Ghana" },
  { code: "GN", label: "Guinée", prep: "en Guinée" },
  { code: "IN", label: "Inde", prep: "en Inde" },
  { code: "IT", label: "Italie", prep: "en Italie" },
  { code: "JP", label: "Japon", prep: "au Japon" },
  { code: "KE", label: "Kenya", prep: "au Kenya" },
  { code: "MG", label: "Madagascar", prep: "à Madagascar" },
  { code: "ML", label: "Mali", prep: "au Mali" },
  { code: "MA", label: "Maroc", prep: "au Maroc" },
  { code: "MR", label: "Mauritanie", prep: "en Mauritanie" },
  { code: "MX", label: "Mexique", prep: "au Mexique" },
  { code: "NE", label: "Niger", prep: "au Niger" },
  { code: "NG", label: "Nigeria", prep: "au Nigeria" },
  { code: "NL", label: "Pays-Bas", prep: "aux Pays-Bas" },
  { code: "PL", label: "Pologne", prep: "en Pologne" },
  { code: "PT", label: "Portugal", prep: "au Portugal" },
  { code: "CD", label: "RD Congo", prep: "en RD Congo" },
  { code: "RO", label: "Roumanie", prep: "en Roumanie" },
  { code: "GB", label: "Royaume-Uni", prep: "au Royaume-Uni" },
  { code: "RU", label: "Russie", prep: "en Russie" },
  { code: "RW", label: "Rwanda", prep: "au Rwanda" },
  { code: "SN", label: "Sénégal", prep: "au Sénégal" },
  { code: "SE", label: "Suède", prep: "en Suède" },
  { code: "CH", label: "Suisse", prep: "en Suisse" },
  { code: "TD", label: "Tchad", prep: "au Tchad" },
  { code: "TG", label: "Togo", prep: "au Togo" },
  { code: "TN", label: "Tunisie", prep: "en Tunisie" },
  { code: "TR", label: "Turquie", prep: "en Turquie" },
];

export function flagUrl(code: string): string {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

export function findCountryByLabel(label: string): Country | undefined {
  return COUNTRIES.find(c => c.label === label);
}

export function findCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}
