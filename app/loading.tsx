export default function Loading() {
  return (
    <div className="gk-page" role="status" aria-label="Chargement de la page">
      <div className="gk-wrap" style={{ paddingBlock: "clamp(28px, 6vw, 72px)" }}>
        <div className="gk-skel" style={{ width: 160, height: 30 }} />
        <div className="gk-skel" style={{ width: "min(720px, 90%)", height: "clamp(70px, 14vw, 150px)", marginTop: 18 }} />
        <div className="gk-skel" style={{ width: "min(460px, 70%)", height: 22, marginTop: 18 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))", gap: 20, marginTop: 44 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="gk-skel" style={{ aspectRatio: "3 / 4" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
