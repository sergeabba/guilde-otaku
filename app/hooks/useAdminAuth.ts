"use client";

import { useState, useEffect, useCallback } from "react";

const AUTH_KEY = "guilde_admin_auth";

export function useAdminAuth() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem(AUTH_KEY);
    if (token) {
      fetch("/api/admin/verify", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => {
          if (r.ok) setAuthed(true);
          else sessionStorage.removeItem(AUTH_KEY);
        })
        .catch(() => sessionStorage.removeItem(AUTH_KEY))
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const login = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem(AUTH_KEY, data.token || password);
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  }, [password]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setPassword("");
  }, []);

  return { authed, checking, password, setPassword, error, login, logout };
}
