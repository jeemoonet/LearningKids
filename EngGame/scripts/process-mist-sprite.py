"""Crop mist sprite to 3:7 and remove checkerboard / backdrop."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "mist-cool-3x7.png"
FALLBACK_SRC = ROOT / "public" / "assets" / "monsters" / "mist.png"
OUT = ROOT / "public" / "assets" / "monsters" / "mist.png"

TARGET_W = 600
TARGET_H = 1400  # 3:7


def saturation(r: int, g: int, b: int) -> float:
    mx = max(r, g, b)
    mn = min(r, g, b)
    return 0.0 if mx == 0 else (mx - mn) / mx


def is_background(r: int, g: int, b: int) -> bool:
    sat = saturation(r, g, b)
    # Light checkerboard / white-gray tiles
    if sat < 0.10 and r >= 165:
        return True
    # Mid-gray checkerboard tiles
    if sat < 0.07 and 35 <= r <= 215:
        return True
    # Dark navy / black backdrop
    if r < 35 and g < 35 and b < 50:
        return True
    return False


def main() -> None:
    src = SRC if SRC.exists() else FALLBACK_SRC
    im = Image.open(src).convert("RGBA")
    px = im.load()
    w, h = im.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_background(r, g, b):
                px[x, y] = (r, g, b, 0)

    # Bounding box of visible pixels
    bbox = im.getbbox()
    if not bbox:
        raise RuntimeError("No visible pixels after background removal")

    cropped = im.crop(bbox)
    cw, ch = cropped.size

    # Fit into 3:7 canvas, centered horizontally, bottom-aligned
    canvas = Image.new("RGBA", (TARGET_W, TARGET_H), (0, 0, 0, 0))
    scale = min(TARGET_W / cw, TARGET_H / ch)
    nw, nh = int(cw * scale), int(ch * scale)
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    ox = (TARGET_W - nw) // 2
    oy = TARGET_H - nh
    canvas.paste(resized, (ox, oy), resized)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, "PNG")
    print(f"Saved {OUT} ({TARGET_W}x{TARGET_H}, alpha)")


if __name__ == "__main__":
    main()
