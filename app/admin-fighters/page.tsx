import { redirect } from "next/navigation";

// L'ancien éditeur du roster est réuni avec l'administration des membres
// (identité, portraits, fiche de combat, univers, masquer, supprimer).
export default function AdminFightersRedirect() {
  redirect("/admin-membres");
}
