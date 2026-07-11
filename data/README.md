# Committed data and model artifacts

These files are committed so a book render never downloads data. They are
third-party artifacts and are **not** relicensed under the book's text or code
licenses. See `../THIRD_PARTY_NOTICES.md` for the applicable notices.

| File | Provenance | Local SHA-256 |
|---|---|---|
| `fashion-train.pt` | A fixed 1,200-example subset of the official Fashion-MNIST training split: `X` is uint8 `(1200, 28, 28)`, `y` is int64, and `classes` contains the ten official labels. The source dataset is [Zalando Research Fashion-MNIST](https://github.com/zalandoresearch/fashion-mnist), MIT licensed. | `86a99167f14d98891de2bc34b83197727f89e178cdf9e5b019fceb7bf71cc427` |
| `fashion-test.pt` | A fixed 600-example subset of the official Fashion-MNIST test split with the same structure. Chapters may deterministically divide this artifact into validation and final-test partitions; they must name the split honestly. | `1db79d080c51173c7df18a5e8389dd4ae20ecb0352a21be90aaa446aed612a09` |
| `squeezenet1_1-imagenet.pt` | The state dictionary distributed by torchvision as `SqueezeNet1_1_Weights.IMAGENET1K_V1`, originally available from `https://download.pytorch.org/models/squeezenet1_1-b8a52dc0.pth`. The local file contains only the state dictionary needed by `squeezenet1_1(weights=None)`. | `df74f119cd43fdf5d3c2c60c5731e3c5f1cede6fece5d0a1328000c1958bd856` |

The historical sampling script for the two Fashion-MNIST subsets was not retained.
Consequently, these files are fixed teaching benchmarks rather than artifacts claimed
to be reproducible from an undocumented selection rule. Do not silently replace them:
record any new sampling method, seed, source checksums, and resulting local checksums.

Torchvision's own notice says pretrained weights can inherit terms from their training
data. Anyone reusing the SqueezeNet checkpoint outside this course should review both
the [torchvision license](https://github.com/pytorch/vision/blob/main/LICENSE) and the
applicable ImageNet terms for their use case.
