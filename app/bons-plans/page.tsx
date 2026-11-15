import BonsPlansClient from "../components/BonsPlansClient";
import { fetchBonsPlans } from "../utils/dataAdapter";

export const revalidate = 0; // Optionnel : force le rafraîchissement au rechargement (ou on peut utiliser ISR)

export default async function BonsPlansPage() {
  const links = await fetchBonsPlans();
  
  return <BonsPlansClient initialLinks={links} />;
}