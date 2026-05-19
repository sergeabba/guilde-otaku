"use client";
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "guilde-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  const toggle = useCallback((id: string | number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string | number) => {
    return favorites.has(String(id));
  }, [favorites]);

  return { favorites, toggle, isFavorite, count: favorites.size };
}
