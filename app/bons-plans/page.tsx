import BonsPlansClient from "../components/BonsPlansClient";
import { fetchBonsPlans } from "../utils/dataAdapter";

export const revalidate = 0; // Optionnel : force le rafraîchissement au rechargement (ou on peut utiliser ISR)

export const metadata = {
  title: "Bons Plans | Guilde Otaku",
  description: "Les archives secrètes de la Guilde : streams, scans et outils.",
};

export default async function BonsPlansPage() {
  const links = await fetchBonsPlans();
  
  return <BonsPlansClient initialLinks={links} />;
}