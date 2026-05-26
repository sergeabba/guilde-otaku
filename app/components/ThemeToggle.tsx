"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { motion } from "framer-motion";

export default function ThemeToggle({ size = 20 }: { size?: number }) {
  const { isDark, toggle } = useTheme();

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.85, rotate: 15 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      aria-label={isDark ? "Mode clair" : "Mode sombre"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 18,
        height: size + 18,
        borderRadius: "50%",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
        cursor: "pointer",
        color: isDark ? "#fbbf24" : "#6366f1",
        transition: "background 0.3s, border-color 0.3s, color 0.3s",
      }}
    >
      {isDark ? <Sun size={size} /> : <Moon size={size} />}
    </motion.button>
  );
}
