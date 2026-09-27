# Printed-number audit (I19, report only)

Every percentage and every count of three or more digits in running prose (class A)
that no printed cell output or caption on the same page shows at the prose's own
precision. Years, the book's seeds, and cross-reference numerals are skipped. A listed
number is not necessarily wrong (design constants, references to other pages, and
values computed but not printed appear here too); it is a number the page does not
print. The printout is the source of truth.

119 numbers listed.

## a3-precision-performance (2)

| number | context |
|---|---|
| 128 | …For square \(n\times n\) matrices this reduces to \(2n/(3s)\). At \(n=128\), the estimate is 21.3 FLOP/byte for F… |
| 512 | …r head. Separate score and probability arrays are 16 MiB per head, or 512 MiB across 32 heads. These are logical … |

## learning-by-experiment (2)

| number | context |
|---|---|
| 600 | …The 600-image file is not a globally sealed tes… |
| 729 | …3(6)+1(18)=81\) epoch-units. Training all 27 for 27 epochs would cost 729.… |

## making-pca-learnable (3)

| number | context |
|---|---|
| 900 | … scored against the clean targets. The development file is split into 900 fit and 300 validation examples; the co… |
| 300 | …nst the clean targets. The development file is split into 900 fit and 300 validation examples; the committed 600-… |
| 600 | …file is split into 900 fit and 300 validation examples; the committed 600-example shared benchmark is evaluated o… |

## 02-logistic-softmax (1)

| number | context |
|---|---|
| 700 | …\) overflows once a logit reaches the high eighties in float32 (about 700 in float64), a scale training easily re… |

## 03-nonlinearity-mlp (3)

| number | context |
|---|---|
| 25% | …xact ties into hard labels with a floating-point threshold can report 25%, 50%, or 75% because of tiny rounding d… |
| 75% | …o hard labels with a floating-point threshold can report 25%, 50%, or 75% because of tiny rounding differences; t… |
| 75% | …a hard linear boundary can classify at most three of the four points (75%), while the little network with a bend … |

## 04-training-loss-sgd (2)

| number | context |
|---|---|
| 256 | …didates (Chapter 20) is a different objective at \(B=64\) than at \(B=256\): neither is a biased version of the o… |
| 120 | …urface is a long narrow valley. We give all three optimizers the same 120-step, 16-example-batch budget, while us… |

## 05-backpropagation (1)

| number | context |
|---|---|
| 256 | …ad to survive the forward pass. Here CODE alone holds \(32 \times 8 = 256\) numbers, more than all \(57\) paramet… |

## 06-generalization-inductive-bias (7)

| number | context |
|---|---|
| 256 | …ct{w}_j^\top\) of the first-layer matrix \(\matr{W}_1 \in \mathbb{R}^{256\times784}\) is a 784-vector, which mean… |
| 3,072 | …ur images live in 784 dimensions; a small color image (32×32×3) needs 3,072 numbers, a one-megapixel photo three mi… |
| 150,528 | …3,072 numbers, a one-megapixel photo three million, an ImageNet input 150,528. And covering a \(d\)-dimensional space… |
| 203,530 | …re attacked at their root. The parameter count falls too: our MLP has 203,530 parameters, while the LeNet model in Ch… |
| 61,706 | … has 203,530 parameters, while the LeNet model in Chapter 8 will have 61,706, less than a third as many. Sharing is … |
| 1,200 | …eported metrics are now fixed. Only now do we fit the same MLP on all 1,200 development examples and open the 600-e… |
| 600 | …do we fit the same MLP on all 1,200 development examples and open the 600-example test set once:… |

## 07-filters-convolution (4)

| number | context |
|---|---|
| 784 | …ense layer from our 28×28 images to an equal-sized output would own \(784 \times 784 \approx 615{,}000\) weights.… |
| 784 | …from our 28×28 images to an equal-sized output would own \(784 \times 784 \approx 615{,}000\) weights. The Sobel … |
| 615 | …28 images to an equal-sized output would own \(784 \times 784 \approx 615{,}000\) weights. The Sobel detector own… |
| 615,000 | …a matrix, convolution is almost-all-zero with nine numbers repeating: 615,000 weights collapsed to 9.… |

## 08-cnn (3)

| number | context |
|---|---|
| 784 | …Note the shapes. In Part I we flattened every image into a 784-vector before the model ever saw it. Th… |
| 1,200 | …ion loss, pulling gradients backward through Equation 8.1 for roughly 1,200 optimizer steps, chose these local meas… |
| 1,200 | … shift size, and the two reported metrics. We refit each model on all 1,200 development images, then open the 600-i… |

## 09-modern-cnns-transfer (16)

| number | context |
|---|---|
| 96% | … cliff-dived. But the card has two demerits we wrote down explicitly: 96% of those parameters sit in the dense he… |
| 61,706 | …working machine and a report card. LeNet reads garments at 82.5% with 61,706 parameters; graceful under shift where … |
| 600 | …Chapter 8 already opened the 600-image holdout, and this chapter queries… |
| 28% | …a 28% saving. The stacked pair also fires a R… |
| 67% | …% to 27% across this book’s Part II is now a gentle slope from 76% to 67%. Position-specific weights are gone fro… |
| 60,000 | …ingredient, so this run does not prove it caused the gap. On the full 60,000-image dataset, the book’s pinned Rivann… |
| 1,200 | …the whole lesson. The plain 40-conv-layer network cannot even fit the 1,200 images it sees every epoch: 61% train a… |
| 60,000 | …d mechanisms. The architecture comparison deserves the full task: all 60,000 Fashion-MNIST training images, split on… |
| 10,000 | …Fashion-MNIST training images, split once into 50,000 for fitting and 10,000 for validation, with the official 10,00… |
| 10,000 | … into 50,000 for fitting and 10,000 for validation, with the official 10,000-image test set opened only after valida… |
| 1,200 | …The scale changes the verdict from the 1,200-image mechanism studies. NiN’s global h… |
| 863 | …ained trunk: the same trunk pretrained on the seven non-shoe classes (863 images), frozen, linear probe.… |
| 1,000 | …ackbone: SqueezeNet 1.1 trained on ImageNet (1.2 million photographs, 1,000 classes) loaded from weights committed … |
| 512 | …ed from weights committed with this book, frozen, linear probe on its 512-dimensional features. (Fashion images g… |
| 863 | …A trunk can only donate what its data taught it. Our own trunk saw 863 shirts, bags, and trousers. Nothing in … |
| 218 | …obal average pooling they fire the flatten head: parameters collapse (218k \(\rightarrow\) 35k) and position-spec… |

## 10-sequences-rnn (7)

| number | context |
|---|---|
| 150,000 | …ers you have already read: their prose, stripped of code cells, about 150,000 characters. We commit that code-strippe… |
| 150 | …s the book’s accent with none of its intent. Some of that is scale (a 150k-character corpus and 128 hidden units … |
| 128 | …one of its intent. Some of that is scale (a 150k-character corpus and 128 hidden units is a tiny language model),… |
| 128 | …of a sentence, the beginning has been squeezed through the LSTM’s two 128-dimensional states, \((\vect{h}, \vect{… |
| 256 | …ough the LSTM’s two 128-dimensional states, \((\vect{h}, \vect{c})\): 256 scalars in all. Both diagnoses point do… |
| 33,279 | …d recurrent depth increases. We ran that rematch on WikiText-2 with a 33,279-word training vocabulary. Three tied-em… |
| 256 | …ale, part the finite-state bottleneck. Cramming a whole sequence into 256 recurrent-state scalars is the debt Par… |

## 11-encoder-decoder (12)

| number | context |
|---|---|
| 784 | …Before recurrence, every model lived on a fixed-size contract: 784 pixels in, 10 logits out; \(28 \times 2… |
| 8601 | …s human-written dates in several dialects; the target language is ISO 8601:… |
| 70% | …search something genuine to reveal: numeric dates are written CODE by 70% of our imaginary writers (the US conven… |
| 8,000 | …giene, not decoration. It removes duplicate source strings before the 8,000/500/500 train/validation/test split. We… |
| 500 | … not decoration. It removes duplicate source strings before the 8,000/500/500 train/validation/test split. We use… |
| 500 | … decoration. It removes duplicate source strings before the 8,000/500/500 train/validation/test split. We use val… |
| 128 | …{c})\), handed to the decoder as its initial state. With hidden width 128, that bridge carries two 128-dimensiona… |
| 128 | … as its initial state. With hidden width 128, that bridge carries two 128-dimensional vectors, or 256 scalars. Ev… |
| 256 | …hidden width 128, that bridge carries two 128-dimensional vectors, or 256 scalars. Everything the decoder will ev… |
| 128 | …ecoder will ever use crossed one bridge: \((\vect{h},\vect{c})\), two 128-dimensional vectors and therefore 256 s… |
| 256 | …e: \((\vect{h},\vect{c})\), two 128-dimensional vectors and therefore 256 scalars. Our task fits because a date i… |
| 256 | …leneck is now the story. One fixed-size \((\vect{h},\vect{c})\) pair, 256 scalars here, connects reader and write… |

## 12-kernel-regression (1)

| number | context |
|---|---|
| 241 | …The key locations are seeded uniform draws on \([-3,3]\). The 241 query locations lie on \([-2.9,2.9]\) a… |

## 13-attention (4)

| number | context |
|---|---|
| 20,000 | …Test both the variance and what softmax sees. For each width, draw 20,000 queries and 16 independent keys per que… |
| 8,000 | …the same 8,000/500/500 train/validation/test split;… |
| 500 | …the same 8,000/500/500 train/validation/test split;… |
| 500 | …the same 8,000/500/500 train/validation/test split;… |

## 14-self-attention-transformer (8)

| number | context |
|---|---|
| 100 | …emoved: 148,594 characters, vocabulary 104, a contiguous 90/10 split, 100-character windows, batch size 64, and 2… |
| 2,501 | …, a contiguous 90/10 split, 100-character windows, batch size 64, and 2,501 updates with Adam at learning rate 0.00… |
| 16,006,400 | …then gives both Transformer variants the same initial weights and all 16,006,400 target characters in the same order. Th… |
| 0.55% | …ameters, 736 fewer than Chapter 10’s 133,224. That difference is only 0.55%, close enough to remove model size as a… |
| 736 | …The model has 132,488 trainable parameters, 736 fewer than Chapter 10’s 133,224. That d… |
| 133,224 | …e model has 132,488 trainable parameters, 736 fewer than Chapter 10’s 133,224. That difference is only 0.55%, close e… |
| 168 | …split into four 21-dimensional heads; each of the two FFNs expands to 168 features. Token embeddings are initiali… |
| 100 | …variants can now generate by repeatedly truncating to the most recent 100 characters, predicting a distribution f… |

## 15-bert-pretraining (6)

| number | context |
|---|---|
| 1,000 | …For 1,000 eligible positions, the expected flow i… |
| 1.5% | …An unchanged selected token exposes its answer on purpose; only about 1.5% of all eligible positions follow that b… |
| 120 | …l 150 selected positions are scored against their original token. The 120 mask replacements are 12% of all eligib… |
| 25% | …garden; the other appears near power, metal, gears, and workshop. The 25% cue noise gives every covered string a … |
| 600 | …4, one encoder is saved before training and the same encoder receives 600 MLM updates. The two downstream arms th… |
| 160 | …ceive the same labeled word types, identical classifier-head tensors, 160 full-batch updates, and the same learni… |

## 16-vit-scaling (18)

| number | context |
|---|---|
| 224 | …tart with the arithmetic used by the original ViT. A color image is \(224\times224\) pixels, and each square patc… |
| 768 | …patches. Each patch contains \(16\times16\times3=768\) raw channel values. So one image has … |
| 196 | …imes3=768\) raw channel values. So one image has become a sequence of 196 vectors, each initially 768-dimensional… |
| 768 | …es. So one image has become a sequence of 196 vectors, each initially 768-dimensional, already the same width use… |
| 224 | …mputational price. Ignoring CODE for the cleanest count, changing a \(224\times224\) image from \(P=32\) to \(P=1… |
| 196 | …ge from \(P=32\) to \(P=16\) changes the patch count from \(49\) to \(196\): four times as many tokens. Each atte… |
| 401 | …s. Each attention head’s score matrix therefore grows from \(49^2=2{,}401\) to \(196^2=38{,}416\) entries, sixtee… |
| 196 | …ention head’s score matrix therefore grows from \(49^2=2{,}401\) to \(196^2=38{,}416\) entries, sixteen times as … |
| 416 | …’s score matrix therefore grows from \(49^2=2{,}401\) to \(196^2=38{,}416\) entries, sixteen times as many. At \(… |
| 1024 | …=2{,}401\) to \(196^2=38{,}416\) entries, sixteen times as many. At \(1024\times1024\) with \(P=16\), there are 4,… |
| 4,096 | …sixteen times as many. At \(1024\times1024\) with \(P=16\), there are 4,096 patches, and the score matrix has about… |
| 437 | …ith \(P=16\), there are 4,096 patches, and the score matrix has about 437 times as many entries as the \(224\time… |
| 224 | …es, and the score matrix has about 437 times as many entries as the \(224\times224\) case.… |
| 1.8% | … gives about 1.19 million for the CNN and 1.16 million for the ViT, a 1.8% difference. That ledger counts convolut… |
| 120 | …The training protocol uses AdamW for 120 epochs, a cosine learning-rate schedule… |
| 76.1% | … recipe alone raised the reported ResNet-50 ImageNet-1K accuracy from 76.1% to 78.8% before the architectural seque… |
| 78.8% | …lone raised the reported ResNet-50 ImageNet-1K accuracy from 76.1% to 78.8% before the architectural sequence was c… |
| 400 | …Hoffmann and colleagues trained more than 400 language models while varying model siz… |

## 17-peft-quantization (11)

| number | context |
|---|---|
| 0.78125% | …ses 16,777,216 values; LoRA exposes \(16(4096+4096)=131{,}072\), or \(0.78125\%\). A model-level percentage requires su… |
| 4096 | …For one \(4096\times4096\) map and \(r=16\), full tuni… |
| 16,777,216 | …For one \(4096\times4096\) map and \(r=16\), full tuning exposes 16,777,216 values; LoRA exposes \(16(4096+4096)=13… |
| 4096 | …nd \(r=16\), full tuning exposes 16,777,216 values; LoRA exposes \(16(4096+4096)=131{,}072\), or \(0.78125\%\). A … |
| 4096 | …r=16\), full tuning exposes 16,777,216 values; LoRA exposes \(16(4096+4096)=131{,}072\), or \(0.78125\%\). A model… |
| 131 | …, full tuning exposes 16,777,216 values; LoRA exposes \(16(4096+4096)=131{,}072\), or \(0.78125\%\). A model-leve… |
| 072 | … tuning exposes 16,777,216 values; LoRA exposes \(16(4096+4096)=131{,}072\), or \(0.78125\%\). A model-level perc… |
| 37.5% | …In this toy \(32\times32\) layer, rank 6 still trains 384 values, 37.5% of a full matrix. The point is inspecta… |
| 4,096 | …ompares 8-bit and 4-bit symmetric grids, either global or per-row, on 4,096 fixed Gaussian inputs. The code reports… |
| 0.689% | …structed as all zeros. Per-row scales lower overall output error to \(0.689\%\) and maximum row error below \(0.964\%… |
| 0.964% | …wer overall output error to \(0.689\%\) and maximum row error below \(0.964\%\). At 4 bits, per-row scales improve ou… |

## 18-alignment (2)

| number | context |
|---|---|
| 20,000 | …al that excessive length should eventually become costly. We generate 20,000 noisy Bradley–Terry comparisons per see… |
| 401 | …Now place 401 candidate responses at fixed evidence \… |

## 19-generative (2)

| number | context |
|---|---|
| 5,000 | …ime channel is fixed at zero, so it sees only \(x_t\). Both train for 5,000 updates on the same generated-data prot… |
| 20,000 | …generated-data protocol over seeds 6050–6054. Each sampler then draws 20,000 points from a standard-normal endpoint … |

## 20-multimodal (4)

| number | context |
|---|---|
| 1,200 | …1,200 unique pairs are generated once, then s… |
| 160 | …ired initialization and minibatch schedule between conditions. AdamW, 160 epochs, batch size 120, and \(\tau=0.08… |
| 120 | … minibatch schedule between conditions. AdamW, 160 epochs, batch size 120, and \(\tau=0.08\) are fixed.… |
| 100 | …ate its size, construction, duplicates, and difficulty. Recall@1 over 100 candidates is not Recall@1 over one mil… |

