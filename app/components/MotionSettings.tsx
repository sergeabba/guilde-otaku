"use client";

import { MotionConfig } from "framer-motion";

/** One preference for every Framer Motion transition on the site. */
export default function MotionSettings({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
