#!/usr/bin/env python3
"""
Batch-convert bitmap logos into simple SVG wrappers that embed the raster image as base64.
This creates an SVG file per input image; these SVGs can be rasterized later at arbitrary sizes.

Usage:
  python scripts/convert_logos_to_svg.py --input /home/root1/下载/中国所有大学校徽图片-200px-jpgs --output /home/root1/下载/中国所有大学校徽-images-svg

Notes:
 - This is NOT true vectorization. It embeds the original bitmap inside an SVG container.
 - The generated SVGs keep the original image's aspect ratio and include width/height attributes.
 - Requires Pillow: pip install pillow
"""
from __future__ import annotations

import argparse
import base64
from pathlib import Path
from PIL import Image


SVG_TEMPLATE = """<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <image width="{w}" height="{h}" href="data:{mime};base64,{b64}" preserveAspectRatio="xMidYMid meet" />
</svg>
"""


def convert_dir(input_dir: Path, output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    for p in sorted(input_dir.iterdir()):
        if not p.is_file():
            continue
        if p.suffix.lower() not in ('.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'):
            continue
        try:
            im = Image.open(p)
            w, h = im.size
            mime = Image.MIME.get(im.format, 'image/png')
            with open(p, 'rb') as f:
                b = f.read()
            b64 = base64.b64encode(b).decode('ascii')
            svg_name = output_dir / (p.stem + '.svg')
            svg_text = SVG_TEMPLATE.format(w=w, h=h, mime=mime, b64=b64)
            svg_name.write_text(svg_text, encoding='utf-8')
            print("Wrote", svg_name)
        except Exception as e:
            print("Failed to convert", p, e)


def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True, help='Input directory with bitmap logos')
    parser.add_argument('--output', required=False, help='Output directory for SVGs')
    args = parser.parse_args(argv)
    inp = Path(args.input)
    out = Path(args.output) if args.output else inp.parent / (inp.name + "-svg")
    if not inp.exists():
        print("Input dir not found:", inp)
        return 2
    convert_dir(inp, out)
    return 0


if __name__ == '__main__':
    raise SystemExit(main(__import__('sys').argv[1:]))




