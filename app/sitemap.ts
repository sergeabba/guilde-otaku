import type { MetadataRoute } from "next";
import { NAV } from "./config/nav";

const SITE_URL = "https://guilde-otaku.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return NAV.map((entry) => ({
    url: `${SITE_URL}${entry.href}`,
    changeFrequency: entry.id === "membres" ? "weekly" : "monthly",
    priority: entry.id === "membres" ? 1 : 0.7,
  }));
}
