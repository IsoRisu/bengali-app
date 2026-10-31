#!/usr/bin/env python3
"""Builds the self-hosted Noto Sans Bengali subset (WOFF2) for the app.

Usage:
  pip install fonttools brotli
  python3 scripts/make-font-subset.py path/to/NotoSansBengali-Regular.ttf

It collects every non-ASCII character used in src/data/*.json (so the subset always matches
the content), keeps those glyphs plus a few joiners, and writes src/fonts/NotoSansBengali-subset.woff2.
Get the font from https://fonts.google.com/noto/specimen/Noto+Sans+Bengali (OFL licence).
Re-run it whenever content in src/data changes. --flavor woff is only for testing without brotli.
"""
import argparse, glob, json, os, sys
from fontTools import subset
from fontTools.ttLib import TTFont

ap = argparse.ArgumentParser()
ap.add_argument("font", help="Noto Sans Bengali .ttf (a static weight, or the variable font)")
ap.add_argument("--data", default="src/data")
ap.add_argument("--out", default="src/fonts/NotoSansBengali-subset.woff2")
ap.add_argument("--flavor", default="woff2", choices=["woff2", "woff"])
a = ap.parse_args()

def strings(x):
    if isinstance(x, str): yield x
    elif isinstance(x, dict):
        for v in x.values(): yield from strings(v)
    elif isinstance(x, list):
        for v in x: yield from strings(v)

chars = set()
for p in sorted(glob.glob(os.path.join(a.data, "*.json"))):
    with open(p, encoding="utf-8") as f:
        for s in strings(json.load(f)):
            chars.update(c for c in s if ord(c) > 127)
if not any(0x0980 <= ord(c) <= 0x09FF for c in chars):
    sys.exit(f"No Bengali characters found in {a.data}/*.json. Run this from the project root.")

keep = chars | {" ", "\u200c", "\u200d", "\u25cc"}  # space, ZWNJ, ZWJ, dotted circle
opts = subset.Options()
opts.flavor = a.flavor
opts.layout_features = ["*"]      # keep shaping features (the app has no signs/conjuncts, but safe)
opts.notdef_outline = True
opts.name_IDs = ["*"]             # keep licence and copyright strings (OFL requires it)
font = TTFont(a.font)
missing = sorted(c for c in keep if ord(c) not in font.getBestCmap())
if missing:
    print("Warning: not in the font:", " ".join(f"U+{ord(c):04X}" for c in missing))
sub = subset.Subsetter(opts)
sub.populate(unicodes=[ord(c) for c in keep])
sub.subset(font)
os.makedirs(os.path.dirname(a.out), exist_ok=True)
font.flavor = a.flavor
font.save(a.out)
print(f"{len(keep)} characters -> {a.out} ({os.path.getsize(a.out)/1024:.1f} KB)")
print("Bengali characters:", "".join(sorted(c for c in keep if 0x0980 <= ord(c) <= 0x09FF)))
