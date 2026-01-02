#!/usr/bin/env python3
"""
Scan a logos directory, create ASCII-safe filenames for each logo,
rename files in-place (optional) and produce a JSON mapping
from Chinese display name -> ASCII filename (relative to logos dir).

Usage:
  python scripts/generate_logo_mapping.py --logos "/path/to/logos" --out scripts/logo_mapping.json

The script will try to transliterate Chinese to pinyin using pypinyin if available.
If not available, it will fall back to generating stable short hashes.
"""
from __future__ import annotations

import argparse
import json
import hashlib
import os
import re
from pathlib import Path
from typing import Dict

try:
    from pypinyin import lazy_pinyin
except Exception:
    lazy_pinyin = None  # type: ignore


def ascii_name_for(orig: str) -> str:
    # orig is filename without extension
    # try pypinyin
    name = orig.strip()
    if lazy_pinyin:
        try:
            pinyin = ''.join(lazy_pinyin(name))
            pinyin = re.sub(r'[^0-9a-zA-Z_-]', '_', pinyin)
            pinyin = re.sub(r'__+', '_', pinyin).strip('_')
            if pinyin:
                return pinyin
        except Exception:
            pass
    # fallback: keep ASCII chars, remove others
    cleaned = re.sub(r'[^0-9a-zA-Z _-]', '', name)
    cleaned = re.sub(r'\s+', '_', cleaned).strip('_')
    if cleaned:
        return cleaned
    # final fallback: stable short hash
    h = hashlib.sha1(name.encode('utf-8')).hexdigest()[:8]
    return f'school_{h}'


def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('--logos', required=True, help='Path to logos directory')
    parser.add_argument('--out', required=True, help='Output mapping JSON path')
    parser.add_argument('--dry-run', action='store_true', help='Do not actually rename files')
    args = parser.parse_args(argv)

    logos_dir = Path(args.logos)
    if not logos_dir.exists() or not logos_dir.is_dir():
        print('Logos dir not found:', logos_dir)
        return 2

    mapping: Dict[str, str] = {}
    used_names = set(x.name for x in logos_dir.iterdir() if x.is_file())

    for p in sorted(logos_dir.iterdir()):
        if not p.is_file():
            continue
        orig_name = p.stem
        ext = p.suffix
        ascii_base = ascii_name_for(orig_name)
        candidate = ascii_base + ext
        i = 1
        # ensure no collision with existing names (including current file)
        while candidate in used_names and candidate != p.name:
            candidate = f'{ascii_base}_{i}{ext}'
            i += 1
        used_names.add(candidate)
        # rename if necessary
        if candidate != p.name:
            target = logos_dir / candidate
            print(f'Renaming: {p.name} -> {candidate}')
            if not args.dry_run:
                p.rename(target)
        else:
            target = p
        # mapping uses the original Chinese display name string
        mapping[orig_name] = target.name

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(mapping, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Wrote mapping to', out_path)
    return 0


if __name__ == '__main__':
    import sys

    raise SystemExit(main(sys.argv[1:]))




