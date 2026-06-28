#!/usr/bin/env python3
"""Generate full-res (4096x2048) equirectangular nebula skyboxes for the app.

Not a flat colour wash: deep near-black space + a handful of DISTINCT coloured
nebula regions (teal / magenta / blue / gold / violet) placed as great-circle
gaussians (so they wrap seamlessly across the lon seam and the poles), threaded
with dark dust lanes and overlaid with a dense, realistic starfield plus a few
bright foreground stars with soft glow. Looks like a real game skybox.

Two seeds → two different skies: `galaxy_skybox.jpg` (galaxy view) and
`skybox_space.jpg` (system view, additionally rotated at random per system).

Run with the `mentoring` conda env:
    conda run -n mentoring python scripts/gen_nebula_skybox.py
"""
import numpy as np
from PIL import Image

W, H = 4096, 2048

# curated emission/reflection-nebula colours (RGB, will be scaled per blob)
PALETTE = np.array(
    [
        [70, 30, 140],    # violet
        [40, 90, 210],    # blue
        [200, 60, 130],   # magenta / rose
        [40, 175, 165],   # teal
        [210, 135, 55],   # gold / amber
        [60, 185, 120],   # emerald
        [150, 50, 200],   # purple
    ],
    "float32",
)

# --- shared lon/lat grid + unit direction (for seamless 3D noise) ------------
lon = np.linspace(-np.pi, np.pi, W, dtype="float32")[None, :]      # 1xW
lat = np.linspace(np.pi / 2, -np.pi / 2, H, dtype="float32")[:, None]  # Hx1
clat, slat = np.cos(lat), np.sin(lat)
dirx = (clat * np.cos(lon)).astype("float32")
diry = np.broadcast_to(slat, (H, W)).astype("float32")
dirz = (clat * np.sin(lon)).astype("float32")


def octave(rng, cx, cy):
    """One octave of value noise, bilinearly upscaled to full size."""
    a = rng.random((cy, cx)).astype("float32")
    im = Image.fromarray((a * 255).astype("uint8")).resize((W, H), Image.BICUBIC)
    return np.asarray(im, "float32") / 255.0


def fbm(rng, base=4, octaves=6):
    out = np.zeros((H, W), "float32")
    amp, tot = 1.0, 0.0
    for k in range(octaves):
        cx = base * (2 ** k)
        cy = max(2, cx // 2)
        out += amp * octave(rng, cx, cy)
        tot += amp
        amp *= 0.5
    return out / tot


def great_circle(clon, clat_c):
    """Angular distance (rad) from every pixel to a sphere point (clon,clat_c)."""
    cd = slat * np.sin(clat_c) + clat * np.cos(clat_c) * np.cos(lon - clon)
    return np.arccos(np.clip(cd, -1.0, 1.0))


def build_sky(seed):
    rng = np.random.default_rng(seed)

    # fine + coarse noise fields reused for wisps and dust
    wisp = fbm(rng, base=6, octaves=6)          # filament texture
    dust = fbm(rng, base=3, octaves=5)           # large dark lanes
    warp = fbm(rng, base=4, octaves=4) - 0.5     # displaces blob edges (wispy)

    col = np.zeros((H, W, 3), "float32")
    # faint cold ambient so deep space isn't dead black
    col += np.array([1.5, 2.0, 4.0], "float32")

    # --- nebula regions: SMALL, DIM, distinct — a backdrop, not the subject.
    # Planets/galaxy read in front, so keep most of the sky dark.
    order = rng.permutation(len(PALETTE))
    n_blobs = 5
    for b in range(n_blobs):
        clon = rng.uniform(-np.pi, np.pi)
        # bias centres away from the exact poles (less stretching)
        clat_c = np.arcsin(rng.uniform(-0.7, 0.7))
        sigma = rng.uniform(0.17, 0.40)          # small → compact regions, lots of black
        d = great_circle(clon, clat_c)
        d = d * (0.80 + 0.65 * warp)             # wispy, non-elliptical edge
        glow = np.exp(-(d / sigma) ** 2)
        glow *= (0.3 + 0.8 * wisp)               # textured with filaments
        glow = np.clip(glow, 0.0, 1.0)
        color = PALETTE[order[b % len(PALETTE)]] * rng.uniform(0.7, 1.05)
        inten = rng.uniform(0.30, 0.58)          # dimmer so it never competes with planets
        col += glow[..., None] * color * inten
        # restrained warm-white cores only at the very densest knots
        core = np.clip((glow - 0.90) / 0.10, 0.0, 1.0) ** 2
        col += core[..., None] * np.array([255, 240, 225], "float32") * 0.15

    # dark dust lanes carve contrast into the gas + push more of the sky to black
    lane = np.clip((dust - 0.42) * 2.5, 0.0, 1.0)
    col *= (1.0 - 0.65 * lane[..., None])

    # gentle pole fade (equirect oversamples the poles)
    yfade = (1.0 - 0.35 * np.abs(np.linspace(-1, 1, H, dtype="float32")) ** 2)[:, None, None]
    col *= yfade

    # --- starfield ------------------------------------------------------------
    # uniform-on-sphere placement: lon uniform, lat via arccos so density is even
    def stars(n, bmin, bmax, smax_size, warm_bias=0.0):
        sx = rng.integers(0, W, n)
        sy = (np.arccos(1 - 2 * rng.random(n)) / np.pi * H).astype(int).clip(0, H - 1)
        bri = (bmin + (bmax - bmin) * rng.random(n) ** 3)
        # colour temperature: most blue-white, some warm
        t = rng.random(n)
        r = 0.75 + 0.25 * t + warm_bias
        g = 0.80 + 0.15 * (1 - np.abs(t - 0.5) * 2)
        bl = 1.05 - 0.30 * t
        for i in range(n):
            x, y = sx[i], sy[i]
            v = bri[i]
            col[y, x, 0] += v * r[i] * 255
            col[y, x, 1] += v * g[i] * 255
            col[y, x, 2] += v * bl[i] * 255

    stars(62000, 0.08, 0.5, 1)      # faint dust of background stars
    stars(9000, 0.4, 0.85, 1)       # mid stars
    stars(1400, 0.6, 1.05, 1, 0.05) # bright stars

    # a few brilliant foreground stars with a soft glow halo
    n_bright = 55
    bx = rng.integers(0, W, n_bright)
    by = (np.arccos(1 - 2 * rng.random(n_bright)) / np.pi * H).astype(int).clip(8, H - 9)
    yy, xx = np.mgrid[-7:8, -7:8].astype("float32")
    halo = np.exp(-(xx * xx + yy * yy) / 7.0)
    for i in range(n_bright):
        x, y = int(bx[i]), int(by[i])
        x0, x1 = x - 7, x + 8
        if x0 < 0 or x1 > W:  # skip seam-straddling bright stars (rare)
            continue
        tint = np.array([1.0, 0.96, 0.9], "float32") if rng.random() < 0.5 else np.array([0.85, 0.92, 1.0], "float32")
        col[y - 7:y + 8, x0:x1, :] += halo[..., None] * tint * 235

    # --- finalise -------------------------------------------------------------
    img = np.clip(col, 0, 255).astype("uint8")

    # wrap-blend the longitude seam so the sphere tiles cleanly
    b = 64
    blend = ((img[:, :b].astype("float32") + img[:, -b:].astype("float32")) / 2).astype("uint8")
    img[:, :b] = blend
    img[:, -b:] = blend
    return Image.fromarray(img, "RGB")


for seed, out in [(7, "textures/galaxy_skybox.jpg"), (29, "textures/skybox_space.jpg")]:
    build_sky(seed).save(out, quality=95)
    print("wrote", out)
