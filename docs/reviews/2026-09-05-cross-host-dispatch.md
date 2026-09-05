# Cross-host dispatch: diagnostic evidence, not a promoted reference

The repaired source remains `95fa50dfa8eda42c4dbe6d4fbb95ab051f81ba6f`.
Its two native Mac profiles completed all units and physical schema-2 capture.
Linux run `33952532056` also completed the candidate, whose original fingerprint
physically validates, but the overall job failed afterward while uploading the
root-owned pretraining fixture directory. The candidate and fixture are separate.
The host-only ownership repair does not rewrite either one's contents or relax
the requirement for a successful independent pair.

Original candidate fingerprint:
`build/canonical-95fa50d-33952532056/provenance/fingerprint.json`, SHA-256
`f1c9092af8acf3cbc5603994c644be3ad056050ca9e0ac2d73501c7be1a277cb`.
The failed upload is recorded in
`build/canonical-95fa50d-33952532056-failed.log`.

## Earlier independent pair exposed a separate numerical issue

The unchanged rejected `eabfcc9` bundles from Actions runs `33947638254` and
`33947862727` retain matching source archives, declared inputs, package versions,
wheel hashes, and image IDs. Their HTML and LaTeX stdout agree internally, but
the independent runs differ in 96 of 274 frozen files and 41 stdout blocks across
18 units. All eight paired sidecars differ; their initialization and schedule
identity fields nevertheless match. This is not a new seed panel.

The direct raw-evidence report is
`build/diagnostic-eab-repeat/diagnostic.json`, SHA-256
`3d7e0a0d56de2bd25368c62ffe99fda66774741e3f15ac9556fcb3c3e1ad2002`.
It accompanies the untouched bundles at `build/canonical-eabfcc9-<run-id>/`.
Neither rejected bundle has a completed fingerprint; these observations do not
manufacture one. Stable cell identifiers and the removed Generator display now
match, so those earlier serialization defects are distinct from this drift.

The preflight records disclose two uncontrolled dispatch choices:

| Observation | AMD EPYC 9V74 run | Intel Xeon 6973P-C run |
|---|---|---|
| Reported Torch CPU capability | AVX2 | AVX512 |
| NumPy OpenBLAS kernel family | Haswell | SkylakeX |
| `ATEN_CPU_CAPABILITY` | unset | unset |
| `MKL_CBWR` / `ONEDNN_MAX_CPU_ISA` | AVX2 / AVX2 | AVX2 / AVX2 |

The relevant source files are each bundle's `provenance/preflight.json` and
`provenance/kernel-startup/`; the complete raw differences are preserved in the
diagnostic report. CPU/dispatch association is not yet isolated causation.

## Controlled next check

PyTorch's native dispatcher has its own `ATEN_CPU_CAPABILITY` override; the MKL
and oneDNN settings do not select it. NumPy's wheel has a separate OpenBLAS
selector, `OPENBLAS_CORETYPE`, as well as NumPy's own ufunc SIMD dispatcher.
Primary implementation/documentation:

- [PyTorch native CPU dispatch](https://github.com/pytorch/pytorch/blob/main/aten/src/ATen/native/cpu/README.md)
- [OpenBLAS runtime variables](https://www.openmathlib.org/OpenBLAS/docs/runtime_variables/)
- [NumPy runtime troubleshooting](https://numpy.org/doc/stable/user/troubleshooting-importerror.html)

The saved-image probe uses four declared policies: the existing baseline,
ATen AVX2 alone, OpenBLAS Haswell alone, and both. Each gets two fresh processes
with fixed input bytes, same-seed random draws, elementary arithmetic, a backward
step, and the actual Chapter 1 setup/data/least-squares cells. It records requested
settings and observed dispatch, raw bytes, source hashes, and image provenance.
NumPy SIMD is observed; no unverified feature names are disabled.

This probe is finite diagnostic evidence, never a book candidate or a replacement
for the two full independent executions. No numerical tolerance, manuscript
claim, archived result, or canonical runtime policy is changed by running it.
