from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from materialize_frozen_pdf_assets import frozen_pdf_sources


class FrozenPdfAssetTests(unittest.TestCase):
    def test_each_genuine_format_is_supported(self):
        for directory in ("figure-pdf", "figure-latex"):
            with self.subTest(directory=directory), TemporaryDirectory() as temp:
                root = Path(temp)
                path = root / "chapters/part1/01-demo" / directory / "plot.pdf"
                path.parent.mkdir(parents=True)
                path.write_bytes(b"%PDF-1.4\nfixture")
                self.assertEqual(frozen_pdf_sources(root), [path])

    def test_equal_siblings_are_deduplicated(self):
        with TemporaryDirectory() as temp:
            root = Path(temp)
            for directory in ("figure-pdf", "figure-latex"):
                path = root / "chapters/01-demo" / directory / "plot.pdf"
                path.parent.mkdir(parents=True)
                path.write_bytes(b"%PDF-1.4\nfixture")
            self.assertEqual(len(frozen_pdf_sources(root)), 1)

    def test_different_siblings_fail_instead_of_silently_winning(self):
        with TemporaryDirectory() as temp:
            root = Path(temp)
            for directory in ("figure-pdf", "figure-latex"):
                path = root / "chapters/01-demo" / directory / "plot.pdf"
                path.parent.mkdir(parents=True)
                path.write_bytes(b"%PDF-1.4\n" + directory.encode())
            with self.assertRaisesRegex(ValueError, "conflicting frozen"):
                frozen_pdf_sources(root)


if __name__ == "__main__":
    unittest.main()
