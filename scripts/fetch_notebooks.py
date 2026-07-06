#!/usr/bin/env python3
"""Export the instructor's Colab notebooks (Google Drive) for provenance.

These notebooks seed the book's code examples but are NOT book content;
they land in code/notebooks/source/ which is gitignored.

Usage:  .venv/bin/python scripts/fetch_notebooks.py
"""

import subprocess
import sys
from pathlib import Path

# Drive file IDs from dl-course-site/lib/module-data.ts (module -> id)
NOTEBOOKS = {
    "m01a-lecture1": "1zQoyTDKP37dFEzM8G5aACAcWlnI8Jfre",
    "m01b-lecture1": "1dXLaMnIOQtcBqCZ9LnPiSEpVYmtviRxB",
    "m02-03-shared": "1lNxYvpKIZDtZNdsrG5hq2558DE1voNMu",
    "m04-05-shared": "1U487JBOOdJhIV72a9RZl0ASiSnkpX5KJ",
    "m06-encdec": "1Lq3H1VtkT1IFDNfykULpIPel-9cSXsIt",
    "m07-rnn": "1RizCNioTF-6u5F-BopXPBefOReV3rSgu",
    "m07-decorators": "102yn6vsljzZyx8ypgbqH1t-6EJZzKltK",
    "m08-livecoding": "1K04Xu9lqBF3mClD7O97k36qPNS1AMvgO",
    "m09-transformer": "1-fMvYAQc0jNl0_JeYhk52UVH575uuan8",
    "m10-deit": "1qbTNmh_4_6CUiNCKpgvPndiID8RTxx3J",
    "m10-hf-tutorial": "1kVDgeXvQX5HdsuhrnMAgreCxNtyE9M8d",
    "m12-multimodal": "10CNVZa0wmGUYatqpVvd0O0cbfk9WyMvB",
    "m12-diffusion": "111Iux63gpCEKFcTb17aXYo8Y5WEW4Jez",
    "m12-vae": "1seQyM-w2kQLm48bdyo2uKRGUZPRP42hr",
    "m12-gan": "1Gz5laYgBDddXRfaTgZNq-kswXZFREIb5",
}

OUT = Path(__file__).resolve().parent.parent / "code" / "notebooks" / "source"
OUT.mkdir(parents=True, exist_ok=True)

failed = []
for name, file_id in NOTEBOOKS.items():
    dest = OUT / f"{name}.ipynb"
    if dest.exists():
        print(f"  skip {name} (exists)")
        continue
    try:
        subprocess.run(
            [sys.executable, "-m", "gdown", "--id", file_id, "-O", str(dest)],
            check=True,
            capture_output=True,
            timeout=120,
        )
        print(f"  ✓ {name}")
    except Exception as exc:  # noqa: BLE001 - report and continue
        failed.append(name)
        print(f"  ✗ {name}: {exc}")

if failed:
    print(f"\n{len(failed)} failed (likely need share-link download in a browser): {failed}")
else:
    print("\nAll notebooks exported.")
