# Cross-host dispatch: diagnostic evidence, not a promoted reference

**Latest state: dispatch-policy candidate, pending full independent execution.**
The finite probes below motivate a revised runtime policy; they do not establish
an accepted freeze or authorize publication. The expanded sample contains no
Intel host. Keep all original runs, including failures, and stop opportunistic
host sampling. A fresh final-source pair must still pass every strict gate.

The preceding repaired source was `95fa50dfa8eda42c4dbe6d4fbb95ab051f81ba6f`.
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

## Initial controlled check

PyTorch's native dispatcher has its own `ATEN_CPU_CAPABILITY` override; the MKL
and oneDNN settings do not select it. NumPy's wheel has a separate OpenBLAS
selector, `OPENBLAS_CORETYPE`, as well as NumPy's own ufunc SIMD dispatcher.
Primary implementation/documentation:

- [PyTorch native CPU dispatch](https://github.com/pytorch/pytorch/blob/main/aten/src/ATen/native/cpu/README.md)
- [OpenBLAS runtime variables](https://www.openmathlib.org/OpenBLAS/docs/runtime_variables/)
- [NumPy runtime troubleshooting](https://numpy.org/doc/stable/user/troubleshooting-importerror.html)
- [NumPy's separate CPU dispatcher](https://numpy.org/doc/stable/reference/simd/how-it-works.html)

The initial saved-image probe used four declared policies: the existing baseline,
ATen AVX2 alone, OpenBLAS Haswell alone, and both. Each gets two fresh processes
with fixed input bytes, same-seed random draws, elementary arithmetic, a backward
step, and the actual Chapter 1 setup/data/least-squares cells. It records requested
settings and observed dispatch, raw bytes, source hashes, and image provenance.
NumPy SIMD was observed; this first probe disabled no feature groups.

This probe is finite diagnostic evidence, never a book candidate or a replacement
for the two full independent executions. No numerical tolerance, manuscript
claim, archived result, or canonical runtime policy is changed by running it.

## First controlled observations and next intervention

Two completed diagnostic runs used the exact image from source `95fa50d`:
`33967832721` (AMD EPYC 7763) and `33967834515` (Intel Xeon 6973P-C).
Their original reports are
`build/runtime-probe-33967832721/results/report.json` (SHA-256
`ba8ee78e6475de883b7cd3fec7f5d5dce8effb220ab11c5529dfc9197f4db5fa`)
and `build/runtime-probe-33967834515/results/report.json` (SHA-256
`a25b61de49f96b2436de15ba1b73b8db4f1743c0eea0a6131e696d0866d53559`).
No fixed input differs across policies or hosts, and the two fresh processes
agree within every policy. There are 13 cross-host output differences under the
baseline and eight with both overrides. OpenBLAS Haswell removes the five SVD
output differences in this witness; changing the ATen setting alone changes
none of its selected outputs. That absence is not proof that ATen dispatch is
irrelevant to every book operation. Chapter 1's solved coefficients and several
elementary/gradient results still differ, so the two flags are not sufficient.

The raw `numpy_show_runtime` and `numpy_opt_func_info` fields additionally show
the pinned wheel's separate NumPy SIMD groups: the AMD host uses `X86_V3`, while
Intel can select `X86_V4`, `AVX512_ICL`, and `AVX512_SPR`. The float64 exponential
selects different implementations and remains a cross-host witness.

Intel's 2026 documentation explicitly states another boundary: on non-Intel
processors, the `MKL_CBWR=AVX2` environment setting can fall back to automatic
dispatch. Its cross-vendor CNR recipe uses `COMPATIBLE`, fixed thread counts,
and a common SSE2 path, subject to the documented conditions. See
[Intel's CNR setup conditions](https://www.intel.com/content/www/us/en/docs/onemkl/developer-reference-c/2026-0/getting-started-with-conditional-numerical.html).
That is an MKL-specific contract, not a framework-wide guarantee. The pinned
Torch build reports MKL 2024.2; the current documentation motivates an
intervention, not a measured claim about every operation in that older binary.

## Complete expanded sample: eight runs, six policies

Diagnostic source `0187f4692a7414e8bba5696e61d8f65bfc4629eb` retained the original
four policies and the same numerical witness functions. It added `compatible`
(both overrides plus `MKL_CBWR=COMPATIBLE`) and `compatible-numpy` (that policy
plus `NPY_DISABLE_CPU_FEATURES=X86_V4,AVX512_ICL,AVX512_SPR`). These feature-group
names came from the actual pinned NumPy wheel's introspection, not an assumed
older naming scheme. Each policy ran in two fresh processes per host.

All original reports reside at `build/runtime-probe-<run-id>/results/report.json`;
the sibling worker JSON and provenance files retain inputs, outputs, environment,
loaded-library details, and requested versus observed dispatch.

| Run | Observed AMD CPU | Baseline Torch / OpenBLAS | Original report SHA-256 |
|---|---|---|---|
| `33968279251` | EPYC 9V74 | AVX2 / Haswell | `c470465aa7e1a0ec3e78a0d29b052048b09464f880e42b19372d31f9be1f3c5e` |
| `33968280910` | EPYC 7763 | AVX2 / Haswell | `61cb63241bbac3a985363b81b1f66996426127fbc029d2f50d0355fa655b828f` |
| `33968466787` | EPYC 7763 | AVX2 / Haswell | `eab778a6312b0292cbd4de132f69c58cc6b6c0ed833f9be6c4eaf56743846cbd` |
| `33968468109` | EPYC 7763 | AVX2 / Haswell | `a3a66192f30bb226811ed4c1274f229b9ff3328cbdd814bdee241b32c9cdf6b3` |
| `33968697725` | EPYC 9V74 | AVX2 / Haswell | `f5e25dc4f5f6aff271a3029b7f32af59a81b4d3c9b4080b417656cff877c214b` |
| `33968699049` | EPYC 7763 | AVX2 / Haswell | `7b4870824b4ce7c151962e4925227044301e58e47e6c666f975c13cd55f2a78f` |
| `33968700578` | EPYC 9V74 | AVX512 / SkylakeX | `f8cbf5989408484eb2517c179d1f97c5b8456427eb0f0502a4a2bc9950533712` |
| `33968701933` | EPYC 7763 | AVX2 / Haswell | `00580dd69f34552f8d62840caafdeb711cfc2db0303df43d7919bbfa50e24534` |

The independent raw-record verification is
`build/runtime-dispatch-six-policy-comparison/report.json`, SHA-256
`1f78dc3f8070de7add72b08cc2a2ae6543e88b05cbee0cc4957b3639e5766478`.
Its verifier is `build/runtime-dispatch-six-policy-comparison/verify.py`, SHA-256
`24a2059f402ef15f995db212f41423aca2f33624bad5f666bcce4e6335ea22c2`.
It authenticates original report/worker hashes, source and witness identity,
recorded image identity and software, then compares raw numerical bytes. The
saved image's recorded ID is
`sha256:c6fdb124c40f539c1f88e71d0dcb9f7682c7f3f58a8f37d26267ca79a052bbce`;
its recorded archive SHA-256 is
`8cab8562323f45923b8166f1d51432fdb4b7fb2f78a9d0663710eb89d70f871c`.
The compressed archive was not present locally for a fresh hash check. The
verification instead checks the retained manifest, original Git recipe/verifier
blobs, and loaded image ID/layers/config; it does not claim to rehash absent bytes.

The 96 expanded-sample workers have matching fixed input bytes and no
within-policy replica difference. On the seven AVX2/Haswell hosts, every policy
matches the first AMD baseline's 41 output records. The AVX512-capable AMD host
provides the discriminating observation:

| Policy on run `33968700578` | Differing outputs from the first AMD baseline, out of 41 |
|---|---:|
| Baseline or ATen AVX2 alone | 6 |
| OpenBLAS Haswell alone or both overrides | 1 |
| Both overrides plus MKL `COMPATIBLE` | 1 |
| That policy plus the NumPy feature-group restriction | 0 |

The five SVD differences disappear with the OpenBLAS selector; the remaining
NumPy float64 exponential difference disappears only in the final condition.
Its observed NumPy implementation moves from `X86_V4` to `X86_V3`. Thus
`compatible-numpy` matches all 41 outputs across every observed AMD configuration.
The same EPYC 9V74 model string exposed different capabilities in different runs;
record actual flags and dispatch, not just a processor name.

**Limit:** all eight expanded runs landed on AMD. The earlier Intel run tested
only four policies and still differed in eight outputs with both overrides.
Intel under `compatible` or `compatible-numpy` is **untested**, not a passing
comparison. Nor do two fresh processes and 41 finite outputs establish full
training reproducibility, correctness, or a universal cross-machine guarantee.
These observations motivate the candidate; they do not isolate a cause for every
old training difference or establish that every proposed flag is necessary.

## Candidate policy and unchanged acceptance boundary

The next canonical image records `MKL_CBWR=COMPATIBLE`,
`ATEN_CPU_CAPABILITY=avx2`, `OPENBLAS_CORETYPE=Haswell`, and
`NPY_DISABLE_CPU_FEATURES=X86_V4,AVX512_ICL,AVX512_SPR`. It retains
`ONEDNN_MAX_CPU_ISA=AVX2`, Torch intra-op/inter-op 1/1, and the one-thread
OMP/MKL/OpenBLAS/NumExpr budgets. These are distinct library controls, not one
universal ISA switch. Requested settings and actual loaded-library/dispatcher
observations must remain bound to the runtime proof.

Changing this policy requires a fresh source checkpoint, image, full first run,
and independent full same-image repeat. Ordered stdout, every frozen file, and
all raw paired sidecars remain byte-exact gates; no tolerance, manuscript value,
or rejected-run status is changed. A matching pair is the acceptance test, not a
host-selection loop seeking a favorable result. No freeze has been promoted.
Publication, a stable release tag, and a durable runtime archive are separate
steps; neither a new tag nor a runtime-archive prerelease is authorized here.
