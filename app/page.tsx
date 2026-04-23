import { fetchMembers } from "./utils/dataAdapter";
import HomePageClient from "./components/HomePageClient";

// Ce composant est maintenant un composant serveur
// Il chargera les données instantanément sans passer par l'état "loading" sur le client
export default async function HomePage() {
  const members = await fetchMembers();

  return (
    <HomePageClient initialMembers={members} />
  );
}
