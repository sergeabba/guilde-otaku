"use client";

// Canal temps réel d'une salle : Supabase Realtime (Broadcast + Presence) en production ;
// BroadcastChannel (onglets d'un même navigateur) pour les essais locaux (?live=local).
import { supabase } from "../../lib/supabase";
import type { LivePeer } from "./live-logic";

export interface LiveTransport {
  send(type: string, data: unknown): void;
  close(): void;
}
interface Handlers { onMessage: (type: string, data: unknown, from: string) => void; onPeers: (peers: LivePeer[]) => void; onStatus: (ok: boolean, error?: string) => void }

export function openRoom(code: string, me: LivePeer, h: Handlers, local = false): LiveTransport {
  const name = `guilde-live-${code}`;
  if (local || typeof (supabase as { channel?: unknown }).channel !== "function") {
    if (!local) { h.onStatus(false, "Le mode en direct n'est pas disponible sur ce site."); return { send() {}, close() {} }; }
    return localRoom(name, me, h);
  }
  const ch = supabase.channel(name, { config: { broadcast: { self: false }, presence: { key: me.pid } } });
  ch.on("broadcast", { event: "msg" }, ({ payload }) => { const p = payload as { t: string; d: unknown; f: string }; h.onMessage(p.t, p.d, p.f); });
  ch.on("presence", { event: "sync" }, () => {
    const state = ch.presenceState<LivePeer>();
    h.onPeers(Object.values(state).map((list) => list[0]).filter(Boolean).map(({ pid, name, image, host }) => ({ pid, name, image, host })));
  });
  ch.subscribe((status) => {
    if (status === "SUBSCRIBED") { void ch.track(me); h.onStatus(true); }
    else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") h.onStatus(false, "Connexion temps réel impossible. Vérifie le réseau et réessaie.");
  });
  let closed = false;
  return {
    send: (t, d) => { if (!closed) void ch.send({ type: "broadcast", event: "msg", payload: { t, d, f: me.pid } }); },
    close: () => { if (closed) return; closed = true; void ch.untrack(); void supabase.removeChannel(ch); },
  };
}

/** Variante locale : présence simulée par un battement toutes les secondes. */
function localRoom(name: string, me: LivePeer, h: Handlers): LiveTransport {
  const bc = new BroadcastChannel(name);
  let closed = false;
  const seen = new Map<string, { peer: LivePeer; at: number }>([[me.pid, { peer: me, at: Infinity }]]);
  const emit = () => h.onPeers([...seen.values()].map((s) => s.peer));
  bc.onmessage = (e) => {
    const { t, d, f } = e.data as { t: string; d: unknown; f: string };
    if (t === "__hb") { const fresh = !seen.has(f); seen.set(f, { peer: d as LivePeer, at: Date.now() }); if (fresh) emit(); return; }
    if (t === "__bye") { seen.delete(f); emit(); return; }
    h.onMessage(t, d, f);
  };
  const beat = () => {
    if (closed) return;
    bc.postMessage({ t: "__hb", d: me, f: me.pid });
    const now = Date.now(); let changed = false;
    for (const [k, s] of seen) if (now - s.at > 3500) { seen.delete(k); changed = true; }
    if (changed) emit();
  };
  beat(); emit();
  const timer = window.setInterval(beat, 1000);
  window.setTimeout(() => h.onStatus(true), 50);
  return {
    send: (t, d) => { if (!closed) bc.postMessage({ t, d, f: me.pid }); },
    close: () => { if (closed) return; closed = true; window.clearInterval(timer); bc.postMessage({ t: "__bye", d: null, f: me.pid }); bc.close(); },
  };
}
