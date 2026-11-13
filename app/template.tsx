// Transition de page : animation CSS sans état résiduel (pas de transform ni
// de filter persistant, qui piégeraient les éléments position:fixed).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="gk-page-enter">{children}</div>;
}
