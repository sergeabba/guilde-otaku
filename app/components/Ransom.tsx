// Lettres découpées : chaque caractère prend une police, une couleur de papier, une
// inclinaison et une taille différentes, de façon stable (même nom = même collage).
// Polices de la Guilde (OFL) : Anton, Dela Gothic One, Cinzel, Fraunces, Chakra Petch, Barlow Condensed.
import "./ransom.css";

const FONTS = ["'Anton', sans-serif", "var(--font-dela), 'Dela Gothic One', sans-serif", "'Cinzel', serif", "'Fraunces Edit', 'Fraunces Variable', serif", "'Chakra Petch', sans-serif", "var(--font-barlow-condensed), sans-serif"];
const STYLE = ["ink", "paper", "hot", "ink", "outline", "paper", "hot"] as const;

function seed(s: string, i: number) { let h = 2166136261 ^ i; for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 16777619); } return Math.abs(h ^ (i * 2654435761)); }

export default function Ransom({ text, className, as: Tag = "span" }: { text: string; className?: string; as?: "span" | "h1" | "h2" | "p" }) {
  const words = text.toUpperCase().split(/\s+/);
  let n = 0;
  return (
    <Tag className={`rn ${className ?? ""}`} aria-label={text}>
      {words.map((w, wi) => (
        <span key={wi} className="rn-w" aria-hidden="true">
          {[...w].map((c) => {
            const h = seed(text, n++);
            const st = STYLE[h % STYLE.length];
            return (
              <span key={n} className={`rn-c is-${st}`} style={{
                fontFamily: FONTS[(h >> 3) % FONTS.length], fontStyle: (h >> 5) % 4 === 0 ? "italic" : "normal",
                rotate: `${((h >> 7) % 15) - 7}deg`, fontSize: `${0.82 + ((h >> 9) % 40) / 100}em`, translate: `0 ${((h >> 11) % 9) - 4}%`,
              }}>{c}</span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
