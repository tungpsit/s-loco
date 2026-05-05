#!/usr/bin/env python3
"""Trim padding from iOS and Android app icons and resize back in place.

By default, the script removes true transparent padding by reading the alpha
channel. If the source icon was flattened and the transparent area became a
uniform corner/background color, use --mode corner-color.

Each crop is scaled back to the original pixel size required by Xcode or
Android resource density buckets.
"""
from __future__ import annotations

import argparse
import json
import shutil
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_IOS_APPICONSETS = [
    ROOT / "apps/tourist-ios/SLocalTourist/Assets.xcassets/AppIcon.appiconset",
    ROOT / "apps/vendor-ios/SLocalVendor/Assets.xcassets/AppIcon.appiconset",
]
DEFAULT_ANDROID_RES_DIRS = [
    ROOT / "apps/tourist-android/app/src/main/res",
    ROOT / "apps/vendor-android/app/src/main/res",
]
DEFAULT_ANDROID_ICON_NAMES = {
    "ic_launcher.png",
    "ic_launcher_foreground.png",
    "ic_launcher_round.png",
}


@dataclass(frozen=True)
class TrimResult:
    path: Path
    original_size: tuple[int, int]
    crop_box: tuple[int, int, int, int] | None
    changed: bool


def alpha_bbox(image: Image.Image, threshold: int) -> tuple[int, int, int, int] | None:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > threshold else 0)
    return mask.getbbox()


def corner_color_bbox(image: Image.Image, threshold: int) -> tuple[int, int, int, int] | None:
    rgba = image.convert("RGBA")
    background = Image.new("RGBA", rgba.size, rgba.getpixel((0, 0)))
    diff = ImageChops.difference(rgba, background)
    grayscale = diff.convert("L")
    mask = grayscale.point(lambda value: 255 if value > threshold else 0)
    return mask.getbbox()


def detect_bbox(image: Image.Image, mode: str, threshold: int) -> tuple[int, int, int, int] | None:
    if mode == "alpha":
        return alpha_bbox(image, threshold)
    if mode == "corner-color":
        return corner_color_bbox(image, threshold)

    bbox = alpha_bbox(image, threshold)
    full_box = (0, 0, image.size[0], image.size[1])
    if bbox and bbox != full_box:
        return bbox
    return corner_color_bbox(image, threshold)


def meaningful_crop(
    bbox: tuple[int, int, int, int],
    image_size: tuple[int, int],
    min_trim_px: int,
) -> bool:
    width, height = image_size
    left, top, right, bottom = bbox
    margins = (left, top, width - right, height - bottom)
    return max(margins) > min_trim_px


def trim_icon(
    path: Path,
    mode: str,
    threshold: int,
    min_trim_px: int,
    dry_run: bool,
    backup: bool,
) -> TrimResult:
    with Image.open(path) as image:
        original_size = image.size
        bbox = detect_bbox(image, mode, threshold)

        if bbox is None:
            return TrimResult(path, original_size, None, False)

        full_box = (0, 0, original_size[0], original_size[1])
        if bbox == full_box or not meaningful_crop(bbox, original_size, min_trim_px):
            return TrimResult(path, original_size, bbox, False)

        if not dry_run:
            cropped = image.convert("RGBA").crop(bbox)
            resized = cropped.resize(original_size, Image.Resampling.LANCZOS)

            if backup:
                backup_path = path.with_suffix(path.suffix + ".bak")
                if not backup_path.exists():
                    shutil.copy2(path, backup_path)

            resized.save(path, optimize=True)

        return TrimResult(path, original_size, bbox, True)


def ios_icon_files(appiconset: Path) -> list[Path]:
    contents_path = appiconset / "Contents.json"
    if not contents_path.exists():
        return sorted(appiconset.glob("*.png"))

    contents = json.loads(contents_path.read_text(encoding="utf-8"))
    files: list[Path] = []
    for image in contents.get("images", []):
        filename = image.get("filename")
        if filename:
            files.append(appiconset / filename)
    return files


def android_icon_files(res_dir: Path) -> list[Path]:
    files: list[Path] = []
    for density_dir in sorted(res_dir.glob("mipmap-*")):
        if not density_dir.is_dir() or density_dir.name == "mipmap-anydpi-v26":
            continue
        for filename in DEFAULT_ANDROID_ICON_NAMES:
            path = density_dir / filename
            if path.exists():
                files.append(path)
    return files


def default_targets(platform: str) -> list[Path]:
    targets: list[Path] = []
    if platform in {"ios", "all"}:
        targets.extend(DEFAULT_IOS_APPICONSETS)
    if platform in {"android", "all"}:
        targets.extend(DEFAULT_ANDROID_RES_DIRS)
    return targets


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Remove padding from iOS and Android app icon PNGs while preserving required pixel sizes."
    )
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        help="AppIcon.appiconset directories, Android res directories, or individual PNG files. Defaults to all iOS and Android launcher icons.",
    )
    parser.add_argument(
        "--platform",
        choices=("ios", "android", "all"),
        default="all",
        help="Default target platform when no paths are passed. Default: all.",
    )
    parser.add_argument(
        "--mode",
        choices=("alpha", "corner-color", "auto"),
        default="auto",
        help="Trim strategy. alpha removes transparent padding; corner-color removes uniform edge padding; auto tries alpha then corner-color. Default: auto.",
    )
    parser.add_argument(
        "--threshold",
        type=int,
        default=8,
        help="Tolerance for transparent alpha or corner-color difference. Default: 8.",
    )
    parser.add_argument(
        "--min-trim-px",
        type=int,
        default=1,
        help="Ignore detected padding at or below this many pixels. Default: 1.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would change without modifying files.",
    )
    parser.add_argument(
        "--backup",
        action="store_true",
        help="Create .png.bak backups before overwriting files.",
    )
    return parser.parse_args()


def expand_targets(paths: list[Path], platform: str) -> list[Path]:
    targets = paths or default_targets(platform)
    files: list[Path] = []

    for target in targets:
        resolved = target if target.is_absolute() else ROOT / target
        if resolved.is_dir() and resolved.name == "AppIcon.appiconset":
            files.extend(ios_icon_files(resolved))
        elif resolved.is_dir() and (resolved / "mipmap-mdpi").exists():
            files.extend(android_icon_files(resolved))
        elif resolved.is_dir():
            files.extend(sorted(resolved.glob("*.png")))
        elif resolved.suffix.lower() == ".png":
            files.append(resolved)
        else:
            raise SystemExit(f"Unsupported target: {target}")

    return sorted(dict.fromkeys(files))


def main() -> None:
    args = parse_args()
    if not 0 <= args.threshold <= 255:
        raise SystemExit("--threshold must be between 0 and 255")
    if args.min_trim_px < 0:
        raise SystemExit("--min-trim-px must be 0 or greater")

    files = expand_targets(args.paths, args.platform)
    if not files:
        raise SystemExit("No icon PNG files found")

    changed = 0
    for path in files:
        if not path.exists():
            print(f"missing: {path.relative_to(ROOT)}")
            continue

        result = trim_icon(path, args.mode, args.threshold, args.min_trim_px, args.dry_run, args.backup)
        relative = result.path.relative_to(ROOT)
        if result.crop_box is None:
            print(f"skip transparent-only: {relative}")
        elif result.changed:
            changed += 1
            x0, y0, x1, y1 = result.crop_box
            width, height = result.original_size
            print(f"trim: {relative} crop=({x0},{y0},{x1},{y1}) resize={width}x{height}")
        else:
            print(f"ok: {relative} already fills {result.original_size[0]}x{result.original_size[1]}")

    action = "Would trim" if args.dry_run else "Trimmed"
    print(f"{action} {changed} of {len(files)} icon files")


if __name__ == "__main__":
    main()
