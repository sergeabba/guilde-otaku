"use client";

import { useState, useEffect, useCallback } from "react";

export function useAdminAuth() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Mot de passe incorrect");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/verify", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then((r) => { if (!controller.signal.aborted) setAuthed(r.ok); })
      .catch(() => { if (!controller.signal.aborted) setAuthed(false); })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, []);

  const login = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Connexion impossible");
      }
      setAuthed(true);
      setPassword("");
      setError(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Connexion impossible");
      setError(true);
      setTimeout(() => setError(false), 3500);
    }
  }, [password]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      setAuthed(false);
      setPassword("");
    }
  }, []);

  return { authed, checking, password, setPassword, error, errorMessage, login, logout };
}
