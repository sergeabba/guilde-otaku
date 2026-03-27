"use client";

// ─── app/template.tsx ─────────────────────────────────────────────────────────
// Ce fichier est différent de layout.tsx : il se REMONTE à chaque navigation.
// Layout.tsx persiste (header, bannière), template.tsx wrap le contenu de page.
// Résultat : transition douce à chaque changement de route, sans recréer le header.
//
// ► Placer ce fichier directement dans : app/template.tsx

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1], // cubic-bezier "snappy" - plus naturel que easeOut
      }}
    >
      {children}
    </motion.div>
  );
}
