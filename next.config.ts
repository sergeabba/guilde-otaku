import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Optimisation activée (suppression de unoptimized: true)
    // Formats modernes pour de meilleures performances
    formats: ["image/avif", "image/webp"],
    // Tailles de device standard pour le responsive
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Remote patterns pour Supabase Storage et autres sources externes
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
      // AniList CDN (covers bibliothèque)
      {
        protocol: "https",
        hostname: "s4.anilist.co",
        pathname: "/file/anilistcdn/**",
      },
      // TMDB (covers bibliothèque fallback)
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      // MangaDex (covers bibliothèque fallback)
      {
        protocol: "https",
        hostname: "uploads.mangadex.org",
        pathname: "/covers/**",
      },
    ],
  },
  // Compression activée
  compress: true,
  // Optimisation du bundle
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
