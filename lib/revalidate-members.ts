// Après une écriture admin sur les membres : le cache serveur des membres expire
// aussitôt, et les fiches et l'accueil sont régénérés à la prochaine visite.
import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateMembers(): void {
  try {
    revalidateTag("members", { expire: 0 });
    revalidatePath("/membres/[id]", "page");
    revalidatePath("/");
  } catch (err) {
    console.error("[revalidate-members]", err);
  }
}
