"use client";
import { useState, useEffect, useCallback } from "react";

const BASE_KEY = "guilde-favorites";

/**
 * Favoris locaux (localStorage, aucun compte requis).
 * `scope` isole chaque rubrique : useFavorites("atelier"), useFavorites("biblio")...
 * Sans scope, on garde la clé historique.
 */
export function useFavorites(scope?: string) {
  const STORAGE_KEY = scope ? `${BASE_KEY}:${scope}` : BASE_KEY;
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored)));
    } catch {}
  }, [STORAGE_KEY]);

  const toggle = useCallback((id: string | number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, [STORAGE_KEY]);

  const isFavorite = useCallback((id: string | number) => {
    return favorites.has(String(id));
  }, [favorites]);

  return { favorites, toggle, isFavorite, count: favorites.size };
}
