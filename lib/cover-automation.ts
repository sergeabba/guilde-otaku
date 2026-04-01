import { createClient } from "@supabase/supabase-js";
import { fetchBestCover } from "./cover-fetch";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "bibliotheque-assets";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
const CONTENT_TYPE_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};
const STORAGE_PREFIX = "bibliotheque";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant pour la pipeline cover");
}

const supabaseStorage = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let bucketChecked = false;
let bucketWritable = false;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "cover";
}

function normalizeFolder(folder: string) {
  return folder.replace(/^\/+|\/+$/g, "");
}

function inferExtensionFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const extension = pathname.slice(pathname.lastIndexOf(".")).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(extension) ? extension : null;
  } catch {
    return null;
  }
}

function inferExtension(url: string, contentType: string | null) {
  if (contentType) {
    const normalized = contentType.split(";")[0].trim().toLowerCase();
    if (CONTENT_TYPE_TO_EXTENSION[normalized]) {
      return CONTENT_TYPE_TO_EXTENSION[normalized];
    }
  }

  return inferExtensionFromUrl(url) || ".jpg";
}

function inferSource(url: string | null) {
  if (!url) return "fallback";

  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes("supabase.co") || hostname.includes("supabase.in")) return "storage";
    if (hostname.includes("anilist.co")) return "anilist";
    if (hostname.includes("tmdb.org")) return "tmdb";
    if (hostname.includes("mangadex.org")) return "mangadex";
    return "manual";
  } catch {
    return "manual";
  }
}

function isSupabaseStorageUrl(url: string | null) {
  return !!url && url.includes(`/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/`);
}

async function ensureBucketWritable() {
  if (bucketChecked) return bucketWritable;

  const { data, error } = await supabaseStorage.storage.listBuckets();
  bucketWritable = !error && !!data?.some((bucket) => bucket.name === SUPABASE_STORAGE_BUCKET);
  bucketChecked = true;

  if (!bucketWritable) {
    throw new Error(`Bucket Supabase introuvable: ${SUPABASE_STORAGE_BUCKET}`);
  }

  return true;
}

async function existingSupabaseUrl(folder: string, baseName: string) {
  await ensureBucketWritable();

  const normalizedFolder = normalizeFolder(folder);
  const listPath = `${STORAGE_PREFIX}/${normalizedFolder}`;

  for (const extension of ALLOWED_EXTENSIONS) {
    const fileName = `${baseName}${extension}`;
    const { data: listData, error } = await supabaseStorage.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .list(listPath, { search: fileName });

    if (!error && listData?.some((item) => item.name === fileName)) {
      return supabaseStorage.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .getPublicUrl(`${listPath}/${fileName}`).data.publicUrl;
    }
  }

  return null;
}

async function uploadAssetToSupabase(options: {
  sourceUrl: string;
  folder: string;
  baseName: string;
  force?: boolean;
}) {
  const { sourceUrl, folder, baseName, force = false } = options;
  await ensureBucketWritable();

  const response = await fetch(sourceUrl, {
    headers: { Accept: "image/*" },
  });

  if (!response.ok) {
    throw new Error(`Téléchargement cover échoué (${response.status})`);
  }

  const contentType = response.headers.get("content-type");
  const extension = inferExtension(sourceUrl, contentType);
  const normalizedFolder = normalizeFolder(folder);
  const objectPath = `${STORAGE_PREFIX}/${normalizedFolder}/${baseName}${extension}`;
  const fileBuffer = Buffer.from(await response.arrayBuffer());

  const { error } = await supabaseStorage.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(objectPath, fileBuffer, {
      upsert: force,
      contentType: contentType ?? undefined,
    });

  if (error && !force) {
    const existing = await existingSupabaseUrl(folder, baseName);
    if (existing) return existing;
  }

  if (error) {
    throw new Error(error.message);
  }

  return supabaseStorage.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(objectPath).data.publicUrl;
}

async function ensureSupabaseAsset(options: {
  sourceUrl: string | null;
  folder: string;
  baseName: string;
  force?: boolean;
}) {
  const { sourceUrl, folder, baseName, force = false } = options;
  if (!sourceUrl) return null;
  if (isSupabaseStorageUrl(sourceUrl)) return sourceUrl;

  if (!force) {
    const existing = await existingSupabaseUrl(folder, baseName);
    if (existing) return existing;
  }

  return uploadAssetToSupabase({
    sourceUrl,
    folder,
    baseName,
    force,
  });
}

export async function resolveAndCacheMediaAssets(options: {
  title?: string;
  anilistId?: number;
  coverUrl?: string | null;
  bannerUrl?: string | null;
  force?: boolean;
}) {
  const { title, anilistId, bannerUrl, force = false } = options;
  let { coverUrl } = options;

  if (!coverUrl && title) {
    coverUrl = await fetchBestCover(title, anilistId);
  }

  const stableBaseName = anilistId ? String(anilistId) : slugify(title || "cover");

  const finalCoverUrl = await ensureSupabaseAsset({
    sourceUrl: coverUrl ?? null,
    folder: "covers/bibliotheque",
    baseName: stableBaseName,
    force,
  });

  const finalBannerUrl = bannerUrl
    ? await ensureSupabaseAsset({
        sourceUrl: bannerUrl,
        folder: "banners/bibliotheque",
        baseName: stableBaseName,
        force,
      })
    : null;

  return {
    coverUrl: finalCoverUrl ?? coverUrl ?? null,
    bannerUrl: finalBannerUrl ?? bannerUrl ?? null,
    source: inferSource(finalCoverUrl ?? coverUrl ?? null),
  };
}
