"""Install the exact official Quarto archive verified before extraction."""
import hashlib
import json
from pathlib import Path
import shutil
import tarfile
import tempfile
import urllib.request

settings = json.loads(Path(__file__).with_name("canonical-runtime.json").read_text())
with tempfile.TemporaryDirectory(prefix="quarto-install-") as temporary:
    archive = Path(temporary) / "quarto.tar.gz"
    with urllib.request.urlopen(settings["quarto_url"], timeout=120) as response:
        with archive.open("wb") as output:
            shutil.copyfileobj(response, output)
    with archive.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    if digest != settings["quarto_sha256"]:
        raise SystemExit("Official Quarto archive SHA-256 mismatch")
    extracted = Path(temporary) / "extracted"
    with tarfile.open(archive) as source:
        source.extractall(extracted, filter="data")
    binaries = list(extracted.glob("*/bin/quarto"))
    if len(binaries) != 1:
        raise SystemExit("Unexpected Quarto archive layout")
    shutil.move(str(binaries[0].parent.parent), "/opt/quarto")
