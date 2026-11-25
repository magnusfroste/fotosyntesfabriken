#!/usr/bin/env python3
"""Ritar ikon, favicon, og-bild, manifest, robots och sitemap för Fotosyntesfabriken.
Ingen tredjepart. Ikonen är ett blad med en sol bakom – appens mekanik – tre tjocka
former, inga tunna streck, så den överlever 48 px."""
import math
import pathlib
from PIL import Image, ImageDraw, ImageFont

P = pathlib.Path(__file__).parent / "public"
P.mkdir(exist_ok=True)
GRON = (47, 125, 90, 255)
MORKGRON = (31, 92, 65, 255)
PAPPER = (250, 247, 242, 255)
GUL = (255, 214, 92, 255)
LJUSGRON = (150, 205, 170, 255)


def blad(d, cx, cy, r, fyll=LJUSGRON, kant=MORKGRON, vinkel=-38):
    """Ett blad: två bågar från spets till spets, ritat som en polygon."""
    a = math.radians(vinkel)
    pts = []
    for i in range(41):
        t = i / 40
        y = (t - 0.5) * 2 * r
        w = 0.62 * r * (math.sin(math.pi * t) ** 0.75)
        pts.append((-w, y))
    for i in range(41):
        t = 1 - i / 40
        y = (t - 0.5) * 2 * r
        w = 0.62 * r * (math.sin(math.pi * t) ** 0.75)
        pts.append((w, y))
    om = [(cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)) for x, y in pts]
    d.polygon(om, fill=fyll, outline=kant, width=max(2, int(r * 0.09)))
    # mittnerv + stjälk
    x1, y1 = cx + (-r * 0.95) * math.sin(a) * -1, cy - r * 0.95 * math.cos(a)
    x2, y2 = cx + r * 0.95 * math.sin(a) * -1 * -1, cy + r * 0.95 * math.cos(a)
    d.line([(cx - r * 0.9 * -math.sin(a), cy - r * 0.9 * math.cos(a)),
            (cx + r * 0.95 * -math.sin(a), cy + r * 0.95 * math.cos(a))], fill=kant, width=max(2, int(r * 0.07)))
    d.line([(cx + r * 0.9 * -math.sin(a), cy + r * 0.9 * math.cos(a)),
            (cx + r * 1.25 * -math.sin(a), cy + r * 1.25 * math.cos(a))], fill=kant, width=max(3, int(r * 0.11)))


def sol(d, cx, cy, r, fyll=GUL):
    for i in range(8):
        a = i * math.pi / 4
        d.line([(cx + math.cos(a) * r * 1.25, cy + math.sin(a) * r * 1.25),
                (cx + math.cos(a) * r * 1.75, cy + math.sin(a) * r * 1.75)],
               fill=fyll, width=max(2, int(r * 0.3)))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fyll)


def ikon(N, med_bakgrund=True):
    ss = 4
    im = Image.new("RGBA", (N * ss, N * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    n = N * ss
    if med_bakgrund:
        d.rounded_rectangle([0, 0, n - 1, n - 1], radius=n * 0.23, fill=GRON)
    sol(d, n * 0.70, n * 0.30, n * 0.13)
    blad(d, n * 0.44, n * 0.56, n * 0.30, LJUSGRON, (255, 255, 255, 255))
    return im.resize((N, N), Image.LANCZOS)


def skriv_ikoner():
    (P / "favicon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
        '<rect width="100" height="100" rx="23" fill="#2f7d5a"/>'
        '<circle cx="70" cy="30" r="13" fill="#ffd65c"/>'
        '<path d="M44 22 C 70 40 66 70 44 84 C 22 70 18 40 44 22 Z" fill="#96cd aa"/>'
        '<path d="M44 26 L44 82" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>'.replace("#96cd aa", "#96cdaa"),
        encoding="utf-8")
    ikon(512).save(P / "favicon.png")
    ikon(192).save(P / "icon-192.png")
    ikon(512).save(P / "icon-512.png")
    N = 512
    im = Image.new("RGBA", (N, N), GRON)
    inner = Image.new("RGBA", (int(N * 0.74), int(N * 0.74)), (0, 0, 0, 0))
    di = ImageDraw.Draw(inner)
    sol(di, int(N * 0.74) * 0.70, int(N * 0.74) * 0.30, int(N * 0.74) * 0.13)
    blad(di, int(N * 0.74) * 0.44, int(N * 0.74) * 0.56, int(N * 0.74) * 0.30, LJUSGRON, (255, 255, 255, 255))
    im.paste(inner, (int(N * 0.13), int(N * 0.13)), inner)
    im.save(P / "icon-maskable-512.png")
    (P / "apple-touch-icon.png").write_bytes((P / "icon-192.png").read_bytes())


def og_bild():
    W, H = 1200, 630
    im = Image.new("RGB", (W, H), PAPPER[:3])
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, H], fill=(242, 236, 225))
    sol(d, W * 0.58, H * 0.36, 52)
    blad(d, W * 0.45, H * 0.55, 150, (111, 185, 141, 255), (47, 125, 90, 255))
    # in-pilar till vänster, ut-pilar till höger
    for i, y in enumerate([170, 315, 460]):
        d.rounded_rectangle([90, y - 34, 210, y + 34], radius=16, fill=(255, 255, 255, 255), outline=(185, 160, 119, 255), width=4)
        d.polygon([(215, y), (243, y - 16), (243, y + 16)], fill=(185, 160, 119, 255))
        d.rounded_rectangle([990, y - 34, 1110, y + 34], radius=16, fill=(255, 255, 255, 255), outline=(185, 160, 119, 255), width=4)
        d.polygon([(985, y), (957, y - 16), (957, y + 16)], fill=(185, 160, 119, 255))
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 52)
    except Exception:
        font = ImageFont.load_default()
    d.text((W // 2, H - 62), "Fotosyntesfabriken – in och ut ur bladet", font=font, fill=(20, 24, 31), anchor="mm")
    im.save(P / "og.png")


def manifest():
    import json
    data = {
        "name": "Fotosyntesfabriken",
        "short_name": "Fotosyntesen",
        "description": "Vatten, koldioxid och ljus in – socker och syre ut. Fotosyntes och cellandning, biologi åk 4–6.",
        "lang": "sv-SE",
        "start_url": "./",
        "scope": "./",
        "display": "standalone",
        "orientation": "any",
        "background_color": "#faf7f2",
        "theme_color": "#faf7f2",
        "icons": [
            {"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    (P / "site.webmanifest").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    (P / "robots.txt").write_text("User-agent: *\nAllow: /\nSitemap: https://fotosyntesfabriken.shipholm.dev/sitemap.xml\n", encoding="utf-8")
    (P / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        '<url><loc>https://fotosyntesfabriken.shipholm.dev/</loc></url></urlset>\n', encoding="utf-8")


if __name__ == "__main__":
    skriv_ikoner()
    og_bild()
    manifest()
    print("ikoner, og, manifest, robots, sitemap klara")