"""Détourages des portraits anime (fond retiré), pour les compositions où le personnage
déborde de l'interface. Modèle isnet-anime (rembg, MIT ; modèle anime-segmentation,
Apache 2.0), exécuté en local. Les originaux ne sont pas modifiés.

Usage : python3 scripts/make-cutouts.py members.json
  members.json : liste [{ "id", "anime" }] (adresse locale « /anime/... » ou URL publique).
Sortie : public/_opt/cutout/<empreinte>.webp et lib/cutouts.json
  { "<adresse du portrait>": { "src", "w", "h", "box": [x0, y0, x1, y1] en % } }.
Un portrait remplacé dans l'admin n'a plus de détourage : la page revient au portrait entier.
« edge » : part des bords restés opaques ; au-delà de 0,55 le détourage est jugé raté et ignoré.
"""
import hashlib, io, json, os, sys, urllib.request
from PIL import Image
from rembg import remove, new_session

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public/_opt/cutout")
MANIFEST = os.path.join(ROOT, "lib/cutouts.json")
os.makedirs(OUT, exist_ok=True)
members = json.load(open(sys.argv[1]))
manifest = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else {}
session = new_session("isnet-anime")

for m in members:
    url = m.get("anime")
    if not url or url in manifest:
        continue
    raw = open(os.path.join(ROOT, "public", url.lstrip("/")), "rb").read() if url.startswith("/") else urllib.request.urlopen(url, timeout=30).read()
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    cut = remove(im, session=session, post_process_mask=True)
    if cut.height > 1400:
        cut = cut.resize((round(cut.width * 1400 / cut.height), 1400), Image.LANCZOS)
    a = cut.getchannel("A").point(lambda v: 255 if v > 24 else 0)
    box = a.getbbox()
    if not box:
        continue
    name = hashlib.sha1(url.encode()).hexdigest()[:12] + ".webp"
    cut.save(os.path.join(OUT, name), "WEBP", quality=84, method=6)
    w, h = cut.size
    manifest[url] = {"src": f"/_opt/cutout/{name}", "w": w, "h": h,
                     "edge": round(sum(1 for v in [a.getpixel((x, 2)) for x in range(0, w, 4)] + [a.getpixel((2, y)) for y in range(0, h, 4)] + [a.getpixel((w - 3, y)) for y in range(0, h, 4)] if v) / ((w + 3) // 4 + 2 * ((h + 3) // 4)), 2),
                     "box": [round(box[0] * 100 / w, 1), round(box[1] * 100 / h, 1), round(box[2] * 100 / w, 1), round(box[3] * 100 / h, 1)]}
    print(m["id"], name, os.path.getsize(os.path.join(OUT, name)) // 1024, "Ko")
    json.dump(manifest, open(MANIFEST, "w"), indent=1, ensure_ascii=False)
