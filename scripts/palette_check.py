#!/usr/bin/env python3
"""CIELAB delta-E check of figure colours against the book's five role colours.

A palette tool of the figure pipeline (press W2 phase 2). Reads the role hexes from
tex/macros.tex (\\definecolor{dl...}{HTML}{...}) and the colours to check from --colors,
or from an .mplstyle file's axes.prop_cycle (--style), or by default the palettes of the
author's ruling D2: the four inks plus the teal and magenta pair. For every colour it
reports CIE76 and CIEDE2000 distances to each role colour under normal vision and under
simulated deuteranopia (Machado, Oliveira and Fernandes 2009, severity 1.0, applied in
linear sRGB), plus protanopia and tritanopia for context, pairwise distances inside the
set (and in grayscale), L* (grayscale lightness), and WCAG contrast on white.

Usage:
  python scripts/palette_check.py [--colors 0EA1A1,9A0669] [--style code/dlbook/book.mplstyle]
"""

from __future__ import annotations

import argparse
import itertools
import math
import re
from pathlib import Path

import numpy as np

M = np.array([[0.4124564, 0.3575761, 0.1804375],
              [0.2126729, 0.7151522, 0.0721750],
              [0.0193339, 0.1191920, 0.9503041]])
WHITE = np.array([0.95047, 1.0, 1.08883])
# Machado et al. (2009), severity 1.0, linear-RGB matrices.
CVD = {
    "protan": np.array([[0.152286, 1.052583, -0.204868],
                        [0.114503, 0.786281, 0.099216],
                        [-0.003882, -0.048116, 1.051998]]),
    "deutan": np.array([[0.367322, 0.860646, -0.227968],
                        [0.280085, 0.672501, 0.047413],
                        [-0.011820, 0.042940, 0.968881]]),
    "tritan": np.array([[1.255528, -0.076749, -0.178779],
                        [-0.078411, 0.930809, 0.147602],
                        [0.004733, 0.691367, 0.303900]]),
}


# Ruling D2: the four inks, then the colour-blind-safe pair that may replace two of them.
D2_COLOURS = ("#1A1A1A", "#4D4D4D", "#7A7A7A", "#949494", "#0EA1A1", "#9A0669")


def hex2rgb(h: str) -> np.ndarray:
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)]) / 255.0


def lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def delin(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, 12.92 * c, 1.055 * c ** (1 / 2.4) - 0.055)


def lab(rgb):
    t = (M @ lin(rgb)) / WHITE
    f = np.where(t > (6 / 29) ** 3, np.cbrt(t), t / (3 * (6 / 29) ** 2) + 4 / 29)
    return np.array([116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])])


def de76(l1, l2):
    return float(np.linalg.norm(np.asarray(l1) - np.asarray(l2)))


def de2000(l1, l2):
    L1, a1, b1 = l1
    L2, a2, b2 = l2
    C1 = math.hypot(a1, b1); C2 = math.hypot(a2, b2); Cb = (C1 + C2) / 2
    G = 0.5 * (1 - math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p = (1 + G) * a1; a2p = (1 + G) * a2
    C1p = math.hypot(a1p, b1); C2p = math.hypot(a2p, b2)
    h1p = math.degrees(math.atan2(b1, a1p)) % 360
    h2p = math.degrees(math.atan2(b2, a2p)) % 360
    dLp = L2 - L1; dCp = C2p - C1p
    if C1p * C2p == 0:
        dhp = 0
    else:
        dhp = h2p - h1p
        if dhp > 180:
            dhp -= 360
        elif dhp < -180:
            dhp += 360
    dHp = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dhp / 2))
    Lbp = (L1 + L2) / 2; Cbp = (C1p + C2p) / 2
    if C1p * C2p == 0:
        hbp = h1p + h2p
    elif abs(h1p - h2p) <= 180:
        hbp = (h1p + h2p) / 2
    else:
        hbp = (h1p + h2p + 360) / 2 if h1p + h2p < 360 else (h1p + h2p - 360) / 2
    T = (1 - 0.17 * math.cos(math.radians(hbp - 30)) + 0.24 * math.cos(math.radians(2 * hbp))
         + 0.32 * math.cos(math.radians(3 * hbp + 6)) - 0.20 * math.cos(math.radians(4 * hbp - 63)))
    dth = 30 * math.exp(-((hbp - 275) / 25) ** 2)
    RC = 2 * math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
    SL = 1 + 0.015 * (Lbp - 50) ** 2 / math.sqrt(20 + (Lbp - 50) ** 2)
    SC = 1 + 0.045 * Cbp; SH = 1 + 0.015 * Cbp * T
    RT = -math.sin(math.radians(2 * dth)) * RC
    return math.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2
                     + RT * (dCp / SC) * (dHp / SH))


def sim(rgb, kind):
    if kind == "normal":
        return rgb
    if kind == "gray":
        y = (M @ lin(rgb))[1]
        return delin(np.array([y, y, y]))
    return delin(CVD[kind] @ lin(rgb))


def contrast(rgb):
    return 1.05 / ((M @ lin(rgb))[1] + 0.05)


def roles_from_macros(clone: Path) -> dict[str, str]:
    text = (clone / "tex" / "macros.tex").read_text(encoding="utf-8")
    found = re.findall(r"\\definecolor\{dl(\w+)\}\{HTML\}\{([0-9A-Fa-f]{6})\}", text)
    names = {"blue": "feature", "orange": "parameter", "purple": "target",
             "green": "prediction", "wine": "residual"}
    return {f"{names.get(n, n)} #{h.upper()}": "#" + h.upper() for n, h in found}


def cycle_from_style(style: Path) -> list[str]:
    for line in style.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("axes.prop_cycle"):
            return ["#" + h.upper() for h in re.findall(r"'([0-9A-Fa-f]{6})'", line)]
    raise SystemExit(f"no axes.prop_cycle in {style}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--clone", type=Path, default=Path(__file__).resolve().parents[1],
                    help="checkout whose tex/macros.tex holds the role colours (default: this one)")
    ap.add_argument("--style", type=Path, help="read the colours from this style's axes.prop_cycle")
    ap.add_argument("--colors", help="comma-separated hexes (overrides --style)")
    args = ap.parse_args()
    roles = roles_from_macros(args.clone)
    if args.colors:
        cycle = ["#" + c.strip().lstrip("#").upper() for c in args.colors.split(",")]
    elif args.style:
        cycle = cycle_from_style(args.style)
    else:
        cycle = list(D2_COLOURS)
    kinds = ["normal", "deutan", "protan", "tritan"]
    print(f"role colours ({args.clone / 'tex/macros.tex'}): " + ", ".join(roles))
    print(f"colours: {', '.join(cycle)}")
    print("\nPer colour: L*, contrast on white, then distance to each role colour.")
    print("Columns: dE2000 normal / deutan / protan / tritan  (dE76 normal / deutan)")
    worst = {}
    for c in cycle:
        rgb = hex2rgb(c)
        print(f"\n  {c}  L*={lab(rgb)[0]:5.1f}  contrast={contrast(rgb):4.2f}")
        for rn, rh in roles.items():
            r = hex2rgb(rh)
            d2000 = [de2000(lab(sim(rgb, k)), lab(sim(r, k))) for k in kinds]
            d76 = [de76(lab(sim(rgb, k)), lab(sim(r, k))) for k in ("normal", "deutan")]
            for k, v in zip(kinds, d2000):
                key = (c, k)
                if key not in worst or v < worst[key][0]:
                    worst[key] = (v, rn)
            print(f"    vs {rn:22s} " + " / ".join(f"{v:5.1f}" for v in d2000)
                  + f"   ({d76[0]:5.1f} / {d76[1]:5.1f})")
    print("\nNearest role colour per colour (dE2000):")
    for c in cycle:
        print("  " + c + ": " + "; ".join(f"{k} {worst[(c, k)][0]:.1f} ({worst[(c, k)][1].split()[0]})" for k in kinds))
    print("\nPairwise (dE2000 normal / deutan / protan / tritan / grayscale):")
    for a, b in itertools.combinations(cycle, 2):
        ra, rb = hex2rgb(a), hex2rgb(b)
        vals = [de2000(lab(sim(ra, k)), lab(sim(rb, k))) for k in kinds + ["gray"]]
        print(f"  {a} vs {b}: " + " / ".join(f"{v:5.1f}" for v in vals))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
