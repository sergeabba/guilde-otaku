// canvas-confetti est livré sans types : on déclare ce que le site utilise.
declare module "canvas-confetti" {
  interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
    angle?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    disableForReducedMotion?: boolean;
  }
  const confetti: (options?: ConfettiOptions) => Promise<null> | null;
  export default confetti;
}
