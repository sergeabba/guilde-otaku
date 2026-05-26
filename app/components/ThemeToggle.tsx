"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle({ size = 20 }: { size?: number }) {
  const { isDark, toggle } = useTheme();

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.85 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      aria-label={isDark ? "Mode clair" : "Mode sombre"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 20,
        height: size + 20,
        borderRadius: "50%",
        border: `1.5px solid ${isDark ? "rgba(251,191,36,0.3)" : "rgba(99,102,241,0.25)"}`,
        background: isDark ? "rgba(251,191,36,0.1)" : "rgba(99,102,241,0.08)",
        cursor: "pointer",
        color: isDark ? "#fbbf24" : "#6366f1",
        transition: "background 0.4s, border-color 0.4s, color 0.4s, box-shadow 0.4s",
        boxShadow: isDark ? "0 0 12px rgba(251,191,36,0.2)" : "0 0 12px rgba(99,102,241,0.15)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ display: "flex" }}
          >
            <Sun size={size} />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ display: "flex" }}
          >
            <Moon size={size} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
