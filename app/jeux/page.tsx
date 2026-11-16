import { pageMetadata } from "../../lib/og/page-meta";
import JeuxClient from "./JeuxClient";

export async function generateMetadata() {
  return pageMetadata("jeux", "/jeux", "Jeux de la Guilde", "Quiz des génériques, duels de goûts entre membres et badges à débloquer.");
}

export default function JeuxPage() {
  return <JeuxClient />;
}
