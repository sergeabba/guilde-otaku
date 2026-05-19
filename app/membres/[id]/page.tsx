import { Metadata } from "next";
import { supabase } from "../../../lib/supabase";
import MemberProfileClient from "./MemberProfileClient";

interface Props {
  params: Promise<{ id: string }>;
}

async function getMember(id: number) {
  const { data } = await supabase
    .from("fighters")
    .select("*")
    .eq("id", id)
    .eq("hidden", false)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const member = await getMember(Number(id));

  if (!member) {
    return { title: "Membre introuvable — Guilde Otaku" };
  }

  const ogParams = new URLSearchParams({
    name: member.name,
    rank: member.rank,
    photo: member.animechar || member.photo || "",
    color: member.color || "#c9a84c",
    ...(member.badge ? { badge: member.badge } : {}),
  });

  const ogImageUrl = `/api/og/member?${ogParams.toString()}`;
  const title = `${member.name} — Guilde Otaku`;
  const description = member.bio
    ? member.bio.slice(0, 155) + (member.bio.length > 155 ? "…" : "")
    : `Découvre le profil de ${member.name}, ${member.rank} de la Guilde Otaku.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Guilde Otaku",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${member.name} — ${member.rank}` }],
      locale: "fr_FR",
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function MemberPage({ params }: Props) {
  const { id } = await params;
  const member = await getMember(Number(id));

  if (!member) {
    return (
      <div style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a12",
        color: "#fff",
        fontFamily: "'Barlow Condensed', sans-serif",
        flexDirection: "column",
        gap: 16,
      }}>
        <p style={{ fontSize: 64, fontWeight: 900, color: "#c9a84c" }}>404</p>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)" }}>Ce membre n&apos;existe pas ou a été masqué.</p>
        <a href="/" style={{ color: "#c9a84c", textDecoration: "none", fontSize: 14, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Retour à l&apos;accueil
        </a>
      </div>
    );
  }

  return <MemberProfileClient member={member} />;
}
