"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface MemberRow {
  id: number;
  name: string;
  rank: string;
}

export default function MemberProfileClient({ member }: { member: MemberRow }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/?membre=${member.id}`);
  }, [member.id, router]);

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
      gap: 12,
    }}>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
        Redirection...
      </p>
      <p style={{ fontSize: 28, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase" }}>
        {member.name}
      </p>
    </div>
  );
}
