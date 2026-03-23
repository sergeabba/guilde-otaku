"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Member } from "../../data/members";
import { useEffect } from "react";
import { ViewMode } from "../page";

const rankAccents: Record<string, string> = {
  "Fondateur": "#f59e0b", "Monarque": "#c9a84c", "Ex Monarque": "#fb923c",
  "Ordre Céleste": "#7c3aed", "New G dorée": "#db2777", "Futurs Espoirs": "#2563eb",
  "Vieux Briscard": "#0d9488", "Fantôme": "#64748b", "Revenant": "#7c3aed",
};

export default function MemberModal({ member, onClose, viewMode }: {
  member: Member | null; onClose: () => void; viewMode: ViewMode;
}) {
  const accent = member ? (rankAccents[member.rank] ?? "#111") : "#111";
  const isAnime = viewMode === "anime";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {member && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: "linear-gradient(160deg, #faf8f3 0%, #f5f3ee 50%, #f0edf8 100%)",
          }}
        >
          {/* Bouton fermer */}
          <button
            onClick={onClose}
            style={{
              position: "fixed", top: "20px", right: "24px", zIndex: 60,
              width: "44px", height: "44px", borderRadius: "50%",
              background: "rgba(0,0,0,0.25)", border: "none",
              cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: "18px",
              backdropFilter: "blur(8px)",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.5)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.25)"}
          >
            ✕
          </button>

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* HERO */}
            <div style={{
              position: "relative", width: "100%",
              height: "100vh", minHeight: "600px",
              background: "#08080f", overflow: "hidden",
            }}>
              {/* Numéro watermark */}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "clamp(180px, 32vw, 380px)",
                fontWeight: 900, color: accent,
                opacity: 0.07, lineHeight: 1,
                letterSpacing: "-0.05em",
                pointerEvents: "none", userSelect: "none",
                whiteSpace: "nowrap",
              }}>
                {String(member.id).padStart(2, "0")}
              </div>

              {/* Photo hero — anime ou réel selon mode */}
              <div style={{
                position: "absolute", bottom: 0, right: "8%",
                width: "52%", height: "95%",
              }}>
                <img
                  src={isAnime ? member.animeChar : member.photo}
                  alt={member.name}
                  style={{
                    width: "100%", height: "100%",
                    objectFit: "contain",
                    objectPosition: "center bottom",
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.jpg"; }}
                />
              </div>

              {/* Gradient bas */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: "50%",
                background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.9))",
                pointerEvents: "none",
              }} />

              {/* Badge mode */}
              <div style={{
                position: "absolute", top: "32px", left: "5%",
                display: "flex", gap: "10px", alignItems: "center",
              }}>
                {member.badge && !isAnime && (
                  <div style={{
                    background: accent, color: "#fff",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "13px", fontWeight: 800,
                    letterSpacing: "0.2em", textTransform: "uppercase",
                    padding: "6px 18px", borderRadius: "3px",
                  }}>
                    {member.badge}
                  </div>
                )}
                {isAnime && (
                  <div style={{
                    background: "rgba(0,0,0,0.5)",
                    border: `1px solid ${accent}60`,
                    backdropFilter: "blur(8px)",
                    color: accent,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "13px", fontWeight: 800,
                    letterSpacing: "0.2em", textTransform: "uppercase",
                    padding: "6px 18px", borderRadius: "3px",
                  }}>
                    ALTER EGO
                  </div>
                )}
              </div>

              {/* Nom + rang */}
              <div style={{
                position: "absolute", bottom: "52px", left: "5%", zIndex: 2,
              }}>
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "clamp(14px, 1.8vw, 18px)", fontWeight: 700,
                  color: accent, letterSpacing: "0.3em",
                  textTransform: "uppercase", marginBottom: "8px",
                }}>
                  {member.rank}
                </p>
                <h1 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "clamp(52px, 9vw, 104px)",
                  fontWeight: 900, color: "#fff",
                  lineHeight: 0.88, letterSpacing: "-0.02em",
                  textTransform: "uppercase", fontStyle: "italic",
                }}>
                  {member.name}
                </h1>
              </div>

              {/* Barre accent */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: "4px", background: accent,
              }} />
            </div>

            {/* INFOS */}
            <div style={{
              padding: "64px 5% 80px",
              maxWidth: "1100px", margin: "0 auto",
            }}>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "2px",
                  background: "rgba(0,0,0,0.06)",
                  borderRadius: "14px",
                  overflow: "hidden",
                  marginBottom: "64px",
                }}
              >
                {[
                  { label: "Rang", value: member.rank },
                  { label: "Anniversaire", value: member.birthday },
                  { label: "Guilde", value: "Otaku" },
                ].map((stat) => (
                  <div key={stat.label} style={{
                    background: "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(12px)",
                    padding: "28px 32px",
                    borderTop: `4px solid ${accent}`,
                  }}>
                    <p style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "17px", fontWeight: 700,
                      color: accent, letterSpacing: "0.22em",
                      textTransform: "uppercase", marginBottom: "10px",
                    }}>
                      {stat.label}
                    </p>
                    <p style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "36px", fontWeight: 900,
                      color: "#111", letterSpacing: "-0.01em",
                      lineHeight: 1,
                    }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </motion.div>

              {/* Bio */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ marginBottom: "72px" }}
              >
                <div style={{
                  display: "flex", alignItems: "center",
                  gap: "14px", marginBottom: "28px",
                }}>
                  <div style={{ width: "30px", height: "3px", background: accent, borderRadius: "2px" }} />
                  <p style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "18px", fontWeight: 800,
                    color: accent, letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}>
                    BIOGRAPHIE
                  </p>
                </div>
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "clamp(22px, 2.5vw, 30px)",
                  fontWeight: 600, lineHeight: 1.55,
                  color: "#111", maxWidth: "780px",
                }}>
                  {member.bio}
                </p>
              </motion.div>

              {/* Personnage associé */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: "48px" }}
              >
                <div style={{
                  display: "flex", alignItems: "center",
                  gap: "14px", marginBottom: "32px",
                }}>
                  <div style={{ width: "30px", height: "3px", background: accent, borderRadius: "2px" }} />
                  <p style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "18px", fontWeight: 800,
                    color: accent, letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}>
                    PERSONNAGE ASSOCIÉ
                  </p>
                </div>

                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr",
                  gap: "3px", borderRadius: "16px", overflow: "hidden",
                  height: "440px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                }}>
                  {/* Panneau gauche — suit le viewMode */}
                  <div style={{ position: "relative", background: "#f0f0ee", overflow: "hidden" }}>
                    <img
                      src={isAnime ? member.animeChar : member.photo}
                      alt={member.name}
                      style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover", objectPosition: "center 20%",
                      }}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.jpg"; }}
                    />
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      height: "55%",
                      background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.82))",
                    }} />
                    <div style={{ position: "absolute", bottom: "22px", left: "24px" }}>
                      <p style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: "11px", fontWeight: 700,
                        color: "rgba(255,255,255,0.45)",
                        letterSpacing: "0.22em", textTransform: "uppercase",
                        marginBottom: "5px",
                      }}>
                        {isAnime ? "Alter ego manga" : "Dans la vie"}
                      </p>
                      <p style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: "24px", fontWeight: 900,
                        color: "#fff", textTransform: "uppercase",
                        letterSpacing: "-0.01em", fontStyle: "italic",
                      }}>
                        {member.name}
                      </p>
                    </div>
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      height: "4px", background: accent,
                    }} />
                  </div>

                  {/* Panneau droit — toujours l'opposé */}
                  <div style={{
                    position: "relative",
                    background: `linear-gradient(160deg, ${accent}15 0%, #f5f3ff 100%)`,
                    overflow: "hidden",
                  }}>
                    <img
                      src={isAnime ? member.photo : member.animeChar}
                      alt="autre"
                      style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover", objectPosition: "center 15%",
                      }}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.jpg"; }}
                    />
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      height: "55%",
                      background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.82))",
                    }} />
                    <div style={{ position: "absolute", bottom: "22px", left: "24px" }}>
                      <p style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: "11px", fontWeight: 700,
                        color: "rgba(255,255,255,0.45)",
                        letterSpacing: "0.22em", textTransform: "uppercase",
                        marginBottom: "5px",
                      }}>
                        {isAnime ? "Dans la vie" : "Alter ego manga"}
                      </p>
                      <p style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: "24px", fontWeight: 900,
                        color: "#fff", textTransform: "uppercase",
                        letterSpacing: "-0.01em", fontStyle: "italic",
                      }}>
                        {member.name}
                      </p>
                    </div>
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      height: "4px", background: accent,
                    }} />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}