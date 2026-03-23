import fs from 'fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="533" viewBox="0 0 400 533">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#06060f"/>
    </radialGradient>
  </defs>
  <rect width="400" height="533" fill="url(#bg)"/>
  <circle cx="200" cy="190" r="55" fill="none" stroke="#c9a84c" stroke-width="1" opacity="0.3"/>
  <circle cx="200" cy="190" r="38" fill="#c9a84c" opacity="0.06"/>
  <text x="200" y="202" text-anchor="middle" fill="#c9a84c" font-size="40" font-family="sans-serif" font-weight="700" opacity="0.4">?</text>
  <text x="200" y="420" text-anchor="middle" fill="#c9a84c" font-size="13" font-family="sans-serif" letter-spacing="3" opacity="0.25">GUILDE OTAKU</text>
</svg>`;

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/placeholder.svg', svg);
console.log('Done : public/placeholder.svg cree');
