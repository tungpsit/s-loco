#!/usr/bin/env python3
"""
Split assets/img/categories.png (5 cols × 3 rows) into home-category PNGs.

Layout matches the content bounding box (non-background) of the source sheet.
Re-run after replacing categories.png; tweak GRID_* if alignment drifts.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets/img/categories.png"

# Grid inside source image (empirically fitted to 1536×1024 sheet)
GRID_X0 = 99
GRID_COL_W = 260
GRID_Y0 = 292
GRID_ROW_H = 225
# Icon art only (strip Vietnamese labels under each tile)
ICON_FRAC_OF_ROW = 0.64
CELL_INSET_X = 12
CELL_INSET_TOP = 10

# row-major indices 0..14: (row, col)
OUTPUTS: list[tuple[str, int]] = [
    ("category_diem_den", 0),
    ("category_am_thuc", 1),
    ("category_luu_tru", 2),
    ("category_giai_tri", 3),
    ("category_phuong_tien", 5),
    ("category_mua_sam", 7),
    ("category_su_kien", 8),
    ("category_xem_them", 10),
]


def cell_box(index: int) -> tuple[int, int, int, int]:
    row, col = divmod(index, 5)
    x0 = GRID_X0 + col * GRID_COL_W + CELL_INSET_X
    x1 = GRID_X0 + (col + 1) * GRID_COL_W - CELL_INSET_X
    y0 = GRID_Y0 + row * GRID_ROW_H + CELL_INSET_TOP
    icon_h = int(GRID_ROW_H * ICON_FRAC_OF_ROW)
    y1 = min(y0 + icon_h, GRID_Y0 + (row + 1) * GRID_ROW_H - 4)
    return (x0, y0, x1, y1)


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    ios_dir = ROOT / "apps/tourist-ios/SLocalTourist/Assets.xcassets"
    and_dir = ROOT / "apps/tourist-android/app/src/main/res/drawable-nodpi"

    for name, idx in OUTPUTS:
        x0, y0, x1, y1 = cell_box(idx)
        crop = im.crop((x0, y0, x1, y1))

        # Android
        and_dir.mkdir(parents=True, exist_ok=True)
        crop.save(and_dir / f"{name}.png", optimize=True)

        # iOS — one imageset per icon
        set_dir = ios_dir / f"{name}.imageset"
        set_dir.mkdir(parents=True, exist_ok=True)
        crop.save(set_dir / f"{name}.png", optimize=True)
        contents = f"""{{
  "images" : [
    {{
      "filename" : "{name}.png",
      "idiom" : "universal",
      "scale" : "1x"
    }}
  ],
  "info" : {{
    "author" : "xcode",
    "version" : 1
  }}
}}
"""
        (set_dir / "Contents.json").write_text(contents, encoding="utf-8")

    print(f"Wrote {len(OUTPUTS)} icons to {and_dir} and {ios_dir}/*.imageset")


if __name__ == "__main__":
    main()
