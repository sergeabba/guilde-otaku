import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

config({ path: path.join(fileURLToPath(import.meta.url), "..", "..", ".env.local") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const DIR = path.join(__dirname, "..", "public", "atelier");

const files = fs.readdirSync(DIR).filter(f =>
  /\.(jpg|jpeg|png|webp|gif)$/i.test(f)
);

console.log(`Found ${files.length} images to upload`);

for (const file of files) {
  const filePath = path.join(DIR, file);
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(file).toLowerCase();
  const contentType = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  }[ext] || "image/jpeg";

  const { error } = await sb.storage
    .from("atelier")
    .upload(file, new Uint8Array(buffer), { contentType, upsert: true });

  if (error) console.log(`❌ ${file}: ${error.message}`);
  else console.log(`✅ ${file}`);
}
console.log("Done!");
