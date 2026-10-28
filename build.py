#!/usr/bin/env python3
"""Build the iCapital Finance static site from src/ into docs/.

Usage: python3 build.py

docs/ is what GitHub Pages serves. Edit pages in src/pages/, the shared
header and footer in src/layout.html, then run this script.
"""
import hashlib
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT / "docs"
SITE = "https://icapitalfinance.com.au"
DOMAIN = "icapitalfinance.com.au"

# Old WordPress URLs that are not real pages any more. Each gets a small
# redirect page so existing links and bookmarks keep working.
REDIRECTS = {
    "home/index.html": "/",
    "elementor-236/index.html": "/contact-us/",
}

REDIRECT_TEMPLATE = """<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<title>Redirecting… – iCapital Finance</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="{url}">
<meta http-equiv="refresh" content="0; url={rel}">
<script>location.replace("{rel}" + location.hash);</script>
</head>
<body>
<p>This page has moved to <a href="{rel}">{url}</a>.</p>
</body>
</html>
"""


def asset_version():
    h = hashlib.sha1()
    for p in ("assets/css/site.css", "assets/js/site.js"):
        h.update((OUT / p).read_bytes())
    return h.hexdigest()[:8]


def root_for(out_path, absolute):
    if absolute:
        return "/"
    depth = out_path.count("/")
    return "../" * depth if depth else "./"


def render(template, values):
    return re.sub(r"\{\{(\w+)\}\}", lambda m: values.get(m.group(1), m.group(0)), template)


def build():
    layout = (SRC / "layout.html").read_text(encoding="utf-8")
    partials = {p.stem: p.read_text(encoding="utf-8") for p in (SRC / "partials").glob("*.html")}
    version = asset_version()
    pages = []

    for src in sorted((SRC / "pages").glob("*.html")):
        text = src.read_text(encoding="utf-8")
        m = re.match(r"\s*<!--(\{.*?\})-->\s*", text, re.S)
        if not m:
            raise SystemExit(f"{src.name}: missing JSON header comment")
        meta = json.loads(m.group(1))
        body = text[m.end():]
        body = re.sub(r"\{\{>\s*(\w+)\s*\}\}", lambda x: partials[x.group(1)], body)

        out = meta["out"]
        root = root_for(out, meta.get("absolute"))
        nav = meta.get("nav", "")
        values = {
            "title": meta["title"],
            "og_title": meta.get("og_title", meta["title"]),
            "description": meta["description"],
            "url": SITE + meta["path"],
            "root": root,
            "version": version,
            "robots": '<meta name="robots" content="noindex">\n' if meta.get("noindex") else "",
            "head_extra": "",
        }
        for key in ("home", "about", "services", "contact"):
            values["cur_" + key] = ' aria-current="page"' if nav == key else ""
        values["content"] = render(body, values).strip()
        html = render(layout, values)

        leftover = re.findall(r"\{\{[^}]*\}\}", html)
        if leftover:
            raise SystemExit(f"{src.name}: unreplaced placeholders {leftover}")

        dest = OUT / out
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(html, encoding="utf-8")
        if not meta.get("noindex"):
            pages.append(meta["path"])
        print("built", out)

    for out, target in REDIRECTS.items():
        dest = OUT / out
        dest.parent.mkdir(parents=True, exist_ok=True)
        rel = root_for(out, False) + target.lstrip("/")
        dest.write_text(REDIRECT_TEMPLATE.format(url=SITE + target, rel=rel), encoding="utf-8")
        print("redirect", out, "->", target)

    today = date.today().isoformat()
    priority = {"/": "1.0", "/services/": "0.9", "/contact-us/": "0.8", "/about/": "0.8"}
    urls = "".join(
        f"  <url>\n    <loc>{SITE}{p}</loc>\n    <lastmod>{today}</lastmod>\n    <priority>{priority.get(p, '0.5')}</priority>\n  </url>\n"
        for p in sorted(pages, key=lambda p: (p != "/", p))
    )
    (OUT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n",
        encoding="utf-8",
    )
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n", encoding="utf-8")
    (OUT / "site.webmanifest").write_text(json.dumps({
        "name": "iCapital Finance",
        "short_name": "iCapital",
        "icons": [
            {"src": "/assets/img/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/assets/img/icon-512.png", "sizes": "512x512", "type": "image/png"},
        ],
        "theme_color": "#13255b",
        "background_color": "#ffffff",
        "display": "browser",
    }, indent=2) + "\n", encoding="utf-8")
    (OUT / "CNAME").write_text(DOMAIN + "\n", encoding="utf-8")
    (OUT / ".nojekyll").write_text("", encoding="utf-8")
    print("wrote sitemap.xml, robots.txt, site.webmanifest, CNAME, .nojekyll")


if __name__ == "__main__":
    build()
