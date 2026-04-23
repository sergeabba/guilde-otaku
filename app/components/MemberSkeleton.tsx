"use client";

import { motion } from "framer-motion";

export default function MemberSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04 }}
      className="relative overflow-hidden bg-white/5 dark:bg-zinc-900 rounded-xl md:rounded-2xl aspect-[3/4] md:aspect-[2/3] shadow-md"
    >
      {/* Image Skeleton */}
      <div className="absolute inset-0 skeleton-cover" />
      
      {/* Bottom Info Skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5 z-10 space-y-2">
        {/* Rank Pill */}
        <div className="h-2 w-16 skeleton rounded-full" />
        
        {/* Name */}
        <div className="h-6 w-3/4 skeleton rounded-md" />
        
        {/* Birthday */}
        <div className="h-3 w-1/2 skeleton rounded-full" />
      </div>
    </motion.div>
  );
}
