"""Word-level WikiText-2 LSTM scale comparison for Chapter 10."""

from __future__ import annotations

import argparse
import math
import time
import urllib.request
from collections import Counter
from pathlib import Path

import torch
from torch import nn

from common import exclusive_lock, metadata, require_cuda, seed_everything, write_json


URLS = {
    "train": "https://raw.githubusercontent.com/pytorch/examples/main/word_language_model/data/wikitext-2/train.txt",
    "valid": "https://raw.githubusercontent.com/pytorch/examples/main/word_language_model/data/wikitext-2/valid.txt",
    "test": "https://raw.githubusercontent.com/pytorch/examples/main/word_language_model/data/wikitext-2/test.txt",
}
SIZES = {
    "small": (256, 256, 2),
    "medium": (512, 512, 2),
    "large": (768, 768, 3),
}


def prepare_corpus(root: Path) -> None:
    root.mkdir(parents=True, exist_ok=True)
    with exclusive_lock(root / ".wikitext2.lock"):
        for split, url in URLS.items():
            target = root / f"{split}.txt"
            if not target.exists():
                temporary = target.with_suffix(".download")
                urllib.request.urlretrieve(url, temporary)
                temporary.replace(target)


def tokenize(path: Path) -> list[str]:
    tokens: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        tokens.extend(line.strip().split())
        tokens.append("<eos>")
    return tokens


def batchify(tokens: torch.Tensor, batch_size: int, device: torch.device) -> torch.Tensor:
    usable = (tokens.numel() // batch_size) * batch_size
    return tokens[:usable].view(batch_size, -1).t().contiguous().to(device)


class WordLSTM(nn.Module):
    def __init__(self, vocabulary_size: int, embedding: int, hidden: int, layers: int) -> None:
        super().__init__()
        self.embedding = nn.Embedding(vocabulary_size, embedding)
        self.lstm = nn.LSTM(embedding, hidden, layers, dropout=0.25)
        self.decoder = nn.Linear(hidden, vocabulary_size)
        if embedding == hidden:
            self.decoder.weight = self.embedding.weight
        self.hidden = hidden
        self.layers = layers
        self.reset_parameters()

    def reset_parameters(self) -> None:
        nn.init.uniform_(self.embedding.weight, -0.1, 0.1)
        nn.init.zeros_(self.decoder.bias)

    def forward(
        self, tokens: torch.Tensor, state: tuple[torch.Tensor, torch.Tensor] | None = None
    ) -> tuple[torch.Tensor, tuple[torch.Tensor, torch.Tensor]]:
        output, state = self.lstm(self.embedding(tokens), state)
        return self.decoder(output), state


def detach_state(state: tuple[torch.Tensor, torch.Tensor]) -> tuple[torch.Tensor, torch.Tensor]:
    return state[0].detach(), state[1].detach()


@torch.inference_mode()
def evaluate(model: WordLSTM, data: torch.Tensor, bptt: int) -> float:
    model.eval()
    total_loss, total_tokens = 0.0, 0
    state = None
    for start in range(0, data.size(0) - 1, bptt):
        length = min(bptt, data.size(0) - 1 - start)
        inputs = data[start : start + length]
        targets = data[start + 1 : start + 1 + length].reshape(-1)
        logits, state = model(inputs, state)
        state = detach_state(state)
        total_loss += nn.functional.cross_entropy(
            logits.reshape(-1, logits.size(-1)), targets, reduction="sum"
        ).item()
        total_tokens += targets.numel()
    return total_loss / total_tokens


@torch.inference_mode()
def sample(
    model: WordLSTM,
    index_to_word: list[str],
    word_to_index: dict[str, int],
    seed_words: list[str],
    length: int,
) -> str:
    model.eval()
    state = None
    generated = list(seed_words)
    current = torch.tensor([[word_to_index.get(word, word_to_index["<unk>"])] for word in seed_words],
                           device=next(model.parameters()).device)
    logits, state = model(current, state)
    for _ in range(length):
        probabilities = torch.softmax(logits[-1, 0] / 0.9, dim=0)
        next_index = torch.multinomial(probabilities, 1).item()
        generated.append(index_to_word[next_index])
        current = torch.tensor([[next_index]], device=probabilities.device)
        logits, state = model(current, state)
    return " ".join(generated).replace(" <eos> ", "\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--size", choices=SIZES, required=True)
    parser.add_argument("--seed", type=int, required=True)
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--bptt", type=int, default=35)
    parser.add_argument("--data-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--smoke", action="store_true")
    args = parser.parse_args()

    seed_everything(args.seed)
    device = require_cuda()
    prepare_corpus(args.data_root)
    train_words = tokenize(args.data_root / "train.txt")
    counts = Counter(train_words)
    vocabulary = ["<unk>"] + sorted(counts)
    word_to_index = {word: index for index, word in enumerate(vocabulary)}

    def encode(split: str) -> torch.Tensor:
        return torch.tensor(
            [word_to_index.get(word, 0) for word in tokenize(args.data_root / f"{split}.txt")],
            dtype=torch.long,
        )

    train = batchify(encode("train"), args.batch_size, device)
    valid = batchify(encode("valid"), 20, device)
    test = batchify(encode("test"), 20, device)
    if args.smoke:
        train, valid, test = train[:140], valid[:70], test[:70]
        args.epochs = 1

    embedding, hidden, layers = SIZES[args.size]
    model = WordLSTM(len(vocabulary), embedding, hidden, layers).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-3, weight_decay=1e-5)
    scaler = torch.amp.GradScaler("cuda")
    history: list[dict[str, float]] = []
    best_validation = math.inf
    best_state: dict[str, torch.Tensor] | None = None
    started = time.perf_counter()

    for epoch in range(1, args.epochs + 1):
        model.train()
        state = None
        for start in range(0, train.size(0) - 1, args.bptt):
            length = min(args.bptt, train.size(0) - 1 - start)
            inputs = train[start : start + length]
            targets = train[start + 1 : start + 1 + length].reshape(-1)
            optimizer.zero_grad(set_to_none=True)
            with torch.autocast(device_type="cuda", dtype=torch.float16):
                logits, state = model(inputs, state)
                loss = nn.functional.cross_entropy(
                    logits.reshape(-1, len(vocabulary)), targets
                )
            state = detach_state(state)
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            nn.utils.clip_grad_norm_(model.parameters(), 0.25)
            scaler.step(optimizer)
            scaler.update()
        validation_loss = evaluate(model, valid, args.bptt)
        history.append({
            "epoch": epoch,
            "validation_loss": validation_loss,
            "validation_perplexity": math.exp(min(validation_loss, 20)),
        })
        print(
            args.size, args.seed, epoch,
            f"val_loss={validation_loss:.5f}",
            f"val_ppl={math.exp(min(validation_loss, 20)):.2f}",
            flush=True,
        )
        if validation_loss < best_validation:
            best_validation = validation_loss
            best_state = {name: value.detach().cpu() for name, value in model.state_dict().items()}

    assert best_state is not None
    model.load_state_dict(best_state)
    test_loss = evaluate(model, test, args.bptt)
    generated = sample(model, vocabulary, word_to_index, ["the"], 80)
    result = {
        "experiment": "chapter10_wikitext2_word_lstm",
        "size": args.size,
        "seed": args.seed,
        "smoke": args.smoke,
        "epochs": args.epochs,
        "vocabulary_size": len(vocabulary),
        "train_tokens": len(train_words),
        "parameter_count": sum(parameter.numel() for parameter in model.parameters()),
        "best_validation_loss": best_validation,
        "best_validation_perplexity": math.exp(min(best_validation, 20)),
        "test_loss": test_loss,
        "test_perplexity": math.exp(min(test_loss, 20)),
        "sample": generated,
        "elapsed_seconds": time.perf_counter() - started,
        "history": history,
        "metadata": metadata(),
    }
    write_json(args.output, result)
    print(f"RESULT test_ppl={result['test_perplexity']:.2f} output={args.output}", flush=True)


if __name__ == "__main__":
    main()
