// Script pour télécharger high-res covers du Dossier Bash localement
// Usage: node scripts/download-dossier-covers.mjs

import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COVERS_DIR = path.join(__dirname, '../public/covers/dossier-bash');

const DOSSIER_BASH = [
  { titleSlug: 'agents-of-the-four-season', anilistId: 190143, filename: 'bx190143-UV3GarNkmbMi.jpg' },
  { titleSlug: 'megaore', anilistId: 206951, filename: 'bx206951-qiHcrw7pwzuq.jpg' },
  { titleSlug: 'go-for-it-nakamura-kun', anilistId: 180228, filename: 'bx180228-vNwpaK5X7osA.png' },
  // Ajouter d'autres si besoin
];

async function downloadCover(id, filename, size = 'medium') {
  const url = `https://s4.anilist.co/file/anilistcdn/media/anime/cover/${size}/${filename}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const buffer = await res.arrayBuffer();
    const titleDir = path.join(COVERS_DIR, id.toString());
    await fs.mkdir(titleDir, { recursive: true });
    
    const filePath = path.join(titleDir, 'cover.jpg');
    await fs.writeFile(filePath, Buffer.from(buffer));
    
    console.log(`✅ ${id} (${filename}): ${buffer.byteLength} bytes → ${filePath}`);
    return `/covers/dossier-bash/${id}/cover.jpg`;
  } catch (error) {
    console.error(`❌ ${id} (${filename}): ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('📥 Téléchargement high-res covers Dossier Bash...\n');
  
  for (const entry of DOSSIER_BASH) {
    await downloadCover(entry.anilistId, entry.filename, 'medium');
    await new Promise(r => setTimeout(r, 500)); // Rate limit
  }
  
  console.log('\n🎉 Terminé ! Vérifiez public/covers/dossier-bash/');
  console.log('Mettez à jour page.tsx avec les nouveaux chemins locaux.');
}

main().catch(console.error);
