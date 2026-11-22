import type { Metadata } from "next";
import { getAtelierWork, getAtelierWorkBySlug } from "../../lib/atelier-server";
import { futiliteMetadata } from "../../lib/og/atelier-meta";
import AtelierClient from "./AtelierClient";


export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const sp = await searchParams;
  const slug = typeof sp.f === "string" ? sp.f : null;
  if (slug) {
    const work = await getAtelierWorkBySlug(slug).catch(() => null);
    return futiliteMetadata(work, work?.key ?? null, slug);
  }
  const key = typeof sp.oeuvre === "string" ? sp.oeuvre : null;
  return futiliteMetadata(key ? await getAtelierWork(key).catch(() => null) : null, key, null);
}

export default function AtelierPage() {
  return <AtelierClient />;
}
