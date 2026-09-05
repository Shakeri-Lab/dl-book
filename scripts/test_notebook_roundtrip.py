#!/usr/bin/env python3
"""Fast regression tests for generated notebook teaching and figure contracts."""

from __future__ import annotations

import base64
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import nbformat
from PIL import Image

from audit_notebook_exports import (
    audit_figure_outputs, audit_html_backlinks, audit_source_notebook,
)
from export_notebooks import (
    HTML_ROOT,
    _build_notebook,
    _notebook_context,
    _support_code,
    notebook_markdown,
    parse_document,
)
from notebook_manifest import NotebookUnit, SupportSelector


FIXTURE = """# A tiny chapter {#sec-tiny}

## A witness first

```{python}
#| echo: false
#| label: setup
import numpy as np
import matplotlib.pyplot as plt
rng = np.random.default_rng(6050)
```

::: {.callout-tip .notebook-prediction}
## Predict before running
Will the two values agree? Check $\\featurepart{\\vect{x}}$.
:::

:::: {.plan-code}
::: {.plan}
1. Sample the controlled witness.
:::
::: {.code}
```{python}
#| label: witness
# [1]
x = rng.normal(size=2)
print(x.sum())
```
:::
::::

::: {#aefig-witness}
```{python}
#| echo: false
plt.plot(x)
plt.show()
```
The visual witness.
:::

## A later section {#later}

:::: {.plan-code}
::: {.plan}
1. Check the next draw.
:::
::: {.code}
```{python}
# [1]
print(rng.normal())
```
:::
::::
"""


class NotebookRoundtripTests(unittest.TestCase):
    def setUp(self) -> None:
        self.directory = tempfile.TemporaryDirectory(prefix="dlbook-roundtrip-test-")
        self.addCleanup(self.directory.cleanup)
        self.source = Path(self.directory.name) / "chapters/part1/tiny.qmd"
        self.source.parent.mkdir(parents=True)
        self.source.write_text(FIXTURE, encoding="utf-8")

    def build(self):
        parsed = parse_document(self.source)
        unit = NotebookUnit(
            "chapters/part1/tiny.qmd", "tiny",
            support=SupportSelector(cell_label="setup"),
        )
        with patch("export_notebooks._asset_records", return_value=()):
            notebook = _build_notebook(
                unit, "a" * 40, document=parsed, converted=object(),
            )
        return parsed, notebook

    def source_errors(self, notebook) -> list[str]:
        parsed = parse_document(self.source)
        unit = NotebookUnit(
            "chapters/part1/tiny.qmd", "tiny",
            support=SupportSelector(cell_label="setup"),
        )
        output = Path(self.directory.name) / "tiny.ipynb"
        nbformat.write(notebook, output)
        errors = []
        with (
            patch("audit_notebook_exports.ROOT", Path(self.directory.name)),
            patch("audit_notebook_exports.git_blob", return_value=self.source.read_bytes()),
            patch("audit_notebook_exports.revision_files", return_value=[]),
            patch("export_notebooks.parse_document", return_value=parsed),
        ):
            audit_source_notebook(
                output, unit, list(parsed.surfaces), _support_code(parsed, unit.support), errors,
            )
        return errors

    def image_errors(self, mime: str, payload: str) -> list[str]:
        cell = nbformat.v4.new_code_cell(
            "plt.show()", metadata={"dlbook": {"figure_id": "fig-one"}},
        )
        cell.outputs = [nbformat.v4.new_output("display_data", data={mime: payload})]
        notebook = nbformat.v4.new_notebook(
            cells=[cell], metadata={"dlbook": {"figure_ids": ["fig-one"]}},
        )
        errors: list[str] = []
        audit_figure_outputs(notebook, "image fixture", errors)
        return errors

    @staticmethod
    def raster_bytes(format: str) -> bytes:
        output = io.BytesIO()
        Image.new("RGB", (8, 8), (30, 90, 150)).save(output, format=format)
        return output.getvalue()

    def test_source_order_support_once_and_clear_outputs(self) -> None:
        parsed, notebook = self.build()
        native = [
            cell for cell in notebook.cells
            if cell.metadata.get("dlbook", {}).get("native_ordinal") is not None
            and cell.cell_type == "code"
        ]
        self.assertEqual([cell.metadata.dlbook.native_ordinal for cell in native], [1, 2, 3, 4])
        self.assertEqual(sum(cell.source.count("rng = np.random.default_rng") for cell in notebook.cells), 1)
        self.assertEqual(notebook.cells[0].id, "orientation")
        self.assertEqual(notebook.cells[1].id, "bootstrap")
        self.assertEqual(notebook.metadata.dlbook.figure_ids, ["aefig-witness"])
        self.assertEqual(parsed.hidden_cells, 2)
        for cell in notebook.cells:
            if cell.cell_type == "code":
                self.assertIsNone(cell.execution_count)
                self.assertEqual(cell.outputs, [])
            if "dlbook-harness" in cell.metadata.get("tags", []):
                self.assertTrue(cell.metadata.jupyter.source_hidden)

    def test_prediction_precedes_its_code_and_returns_to_html(self) -> None:
        _, notebook = self.build()
        prediction_index = next(i for i, cell in enumerate(notebook.cells) if "dlbook-prediction" in cell.metadata.get("tags", []))
        witness_index = next(i for i, cell in enumerate(notebook.cells) if cell.id == "surface-001")
        self.assertLess(prediction_index, witness_index)
        text = notebook.cells[prediction_index].source
        self.assertIn("Will the two values agree?", text)
        self.assertNotIn("\\featurepart", text)
        self.assertIn("\\boldsymbol{x}", text)
        headers = [cell.source for cell in notebook.cells if "dlbook-section" in cell.metadata.get("tags", [])]
        self.assertEqual(len(headers), 2)
        self.assertIn("tiny.html#a-witness-first", headers[0])
        self.assertIn("tiny.html#later", headers[1])

    def test_nested_callout_title_is_not_a_chapter_section(self) -> None:
        contexts, wrappers = _notebook_context(FIXTURE.splitlines())
        self.assertEqual([c.anchor for c in contexts if c.kind == "section"], ["a-witness-first", "later"])
        self.assertEqual(list(wrappers.values()), ["aefig-witness"])

    def test_source_audit_rejects_missing_prediction(self) -> None:
        _, notebook = self.build()
        self.assertEqual(self.source_errors(notebook), [])
        notebook.cells = [cell for cell in notebook.cells if "dlbook-prediction" not in cell.metadata.get("tags", [])]
        self.assertTrue(any("prediction count differs" in error for error in self.source_errors(notebook)))

    def test_source_audit_rejects_prediction_after_result(self) -> None:
        _, notebook = self.build()
        prediction = next(cell for cell in notebook.cells if "dlbook-prediction" in cell.metadata.get("tags", []))
        notebook.cells.remove(prediction)
        notebook.cells.append(prediction)
        self.assertTrue(any("out of manuscript order" in error for error in self.source_errors(notebook)))

    def test_source_audit_rejects_missing_section_context(self) -> None:
        _, notebook = self.build()
        notebook.cells = [cell for cell in notebook.cells if "dlbook-section" not in cell.metadata.get("tags", [])]
        self.assertTrue(any("lost their source headings" in error for error in self.source_errors(notebook)))

    def test_book_math_and_cross_references_are_portable(self) -> None:
        result = notebook_markdown(
            r"$\\featurepart{\\vect{x}}$".replace("\\\\", "\\") + " @fig-learned-attention [read](../part1/01-linear-regression.qmd#eq-bias-variance)",
            HTML_ROOT + "chapters/part4/15-bert-pretraining.html",
        )
        self.assertIn("\\color{#2B6CB0}", result)
        self.assertIn("14-self-attention-transformer.html#fig-learned-attention", result)
        self.assertNotIn(".qmd", result)

    def test_image_audit_rejects_missing_and_invalid_payloads(self) -> None:
        cell = nbformat.v4.new_code_cell("plt.show()", metadata={"dlbook": {"figure_id": "fig-one"}})
        notebook = nbformat.v4.new_notebook(cells=[cell], metadata={"dlbook": {"figure_ids": ["fig-one"]}})
        errors = []
        audit_figure_outputs(notebook, "fixture", errors)
        self.assertTrue(errors)
        cell.outputs = [nbformat.v4.new_output("display_data", data={"image/png": "not an image"})]
        errors = []
        audit_figure_outputs(notebook, "fixture", errors)
        self.assertTrue(errors)
        cell.outputs = [nbformat.v4.new_output("display_data", data={"image/svg+xml": '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L1 1"/></svg>'})]
        errors = []
        audit_figure_outputs(notebook, "fixture", errors)
        self.assertEqual(errors, [])

    def test_image_audit_decodes_valid_png_and_jpeg(self) -> None:
        for mime, format in (("image/png", "PNG"), ("image/jpeg", "JPEG")):
            with self.subTest(mime=mime):
                payload = base64.b64encode(self.raster_bytes(format)).decode("ascii")
                self.assertEqual(self.image_errors(mime, payload), [])

    def test_image_audit_rejects_signature_only_raster_junk(self) -> None:
        for mime, signature in (
            ("image/png", b"\x89PNG\r\n\x1a\n"),
            ("image/jpeg", b"\xff\xd8\xff"),
        ):
            with self.subTest(mime=mime):
                data = signature + b"not a decodable image" * 3
                self.assertGreater(len(data), 32)
                payload = base64.b64encode(data).decode("ascii")
                self.assertTrue(self.image_errors(mime, payload))

    def test_image_audit_rejects_truncated_rasters_and_wrong_mime(self) -> None:
        for mime, format in (("image/png", "PNG"), ("image/jpeg", "JPEG")):
            with self.subTest(mime=mime):
                data = self.raster_bytes(format)[:-12]
                payload = base64.b64encode(data).decode("ascii")
                self.assertTrue(self.image_errors(mime, payload))
        jpeg = base64.b64encode(self.raster_bytes("JPEG")).decode("ascii")
        self.assertTrue(self.image_errors("image/png", jpeg))

    def test_image_audit_parses_svg_and_blocks_entities(self) -> None:
        invalid = (
            '<svg xmlns="http://www.w3.org/2000/svg"><path></svg>',
            '<html><svg></svg></html>',
            '<svg xmlns="urn:not-svg"></svg>',
            '<!DOCTYPE svg [<!ENTITY x "expanded">]><svg>&x;</svg>',
            '<!DOCTYPE svg [<!ENTITY x SYSTEM "https://example.invalid/entity">]>'
            '<svg>&x;</svg>',
        )
        for payload in invalid:
            with self.subTest(payload=payload):
                self.assertTrue(self.image_errors("image/svg+xml", payload))
        # Matplotlib emits this harmless external DOCTYPE; parsing must not fetch it.
        svg = (
            '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" '
            '"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2">'
            '<path d="M0 0L1 1"/></svg>'
        )
        self.assertEqual(self.image_errors("image/svg+xml", svg), [])

    def test_backlink_audit_rejects_nonexistent_anchor(self) -> None:
        root = Path(self.directory.name)
        (root / "index.html").write_text('<h1 id="existing">Title</h1>', encoding="utf-8")
        notebook = nbformat.v4.new_notebook(cells=[nbformat.v4.new_markdown_cell(f"[Read]({HTML_ROOT}index.html#missing)")])
        errors = []
        audit_html_backlinks(notebook, root, "fixture", errors)
        self.assertEqual(len(errors), 1)


if __name__ == "__main__":
    unittest.main()
