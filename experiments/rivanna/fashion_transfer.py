"""ImageNet ResNet-18 transfer regimes on full Fashion-MNIST."""

from __future__ import annotations

import argparse
import math
import time
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, models, transforms

from common import exclusive_lock, metadata, require_cuda, seed_everything, write_json


@torch.inference_mode()
def evaluate(model: nn.Module, loader: DataLoader, device: torch.device) -> tuple[float, float]:
    model.eval()
    loss_sum, correct, total = 0.0, 0, 0
    for images, targets in loader:
        images, targets = images.to(device, non_blocking=True), targets.to(device, non_blocking=True)
        logits = model(images)
        loss_sum += nn.functional.cross_entropy(logits, targets, reduction="sum").item()
        correct += (logits.argmax(1) == targets).sum().item()
        total += targets.numel()
    return loss_sum / total, correct / total


def build_model(regime: str, cache_root: Path) -> nn.Module:
    if regime == "scratch":
        model = models.resnet18(weights=None)
    else:
        torch.hub.set_dir(str(cache_root))
        model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    model.fc = nn.Linear(model.fc.in_features, 10)
    if regime == "probe":
        for parameter in model.parameters():
            parameter.requires_grad = False
        for parameter in model.fc.parameters():
            parameter.requires_grad = True
    elif regime == "finetune":
        for parameter in model.parameters():
            parameter.requires_grad = False
        for module in (model.layer4, model.fc):
            for parameter in module.parameters():
                parameter.requires_grad = True
    return model


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--regime", choices=["probe", "finetune", "scratch"], required=True)
    parser.add_argument("--seed", type=int, required=True)
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--data-root", type=Path, required=True)
    parser.add_argument("--cache-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--smoke", action="store_true")
    args = parser.parse_args()

    seed_everything(args.seed)
    device = require_cuda()
    with exclusive_lock(args.data_root / ".fashion.lock"):
        datasets.FashionMNIST(args.data_root, train=True, download=True)
        datasets.FashionMNIST(args.data_root, train=False, download=True)

    image_net_normalize = transforms.Normalize(
        mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)
    )
    train_transform = transforms.Compose([
        transforms.Resize(232, antialias=True),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.Grayscale(num_output_channels=3),
        transforms.ToTensor(),
        image_net_normalize,
    ])
    eval_transform = transforms.Compose([
        transforms.Resize(224, antialias=True),
        transforms.Grayscale(num_output_channels=3),
        transforms.ToTensor(),
        image_net_normalize,
    ])
    train_full = datasets.FashionMNIST(args.data_root, train=True, transform=train_transform)
    validation_full = datasets.FashionMNIST(args.data_root, train=True, transform=eval_transform)
    test = datasets.FashionMNIST(args.data_root, train=False, transform=eval_transform)
    split = torch.randperm(len(train_full), generator=torch.Generator().manual_seed(6050))
    train_indices, validation_indices = split[:50_000], split[50_000:]
    if args.smoke:
        train_indices, validation_indices = train_indices[:1024], validation_indices[:512]
        test = Subset(test, range(512))
        args.epochs = 1

    loaders = {
        "train": DataLoader(
            Subset(train_full, train_indices), batch_size=args.batch_size, shuffle=True,
            num_workers=args.workers, pin_memory=True, persistent_workers=args.workers > 0,
        ),
        "validation": DataLoader(
            Subset(validation_full, validation_indices), batch_size=args.batch_size,
            shuffle=False, num_workers=args.workers, pin_memory=True,
            persistent_workers=args.workers > 0,
        ),
        "test": DataLoader(
            test, batch_size=args.batch_size, shuffle=False, num_workers=args.workers,
            pin_memory=True, persistent_workers=args.workers > 0,
        ),
    }
    with exclusive_lock(args.cache_root / ".resnet18.lock"):
        model = build_model(args.regime, args.cache_root)
    model = model.to(device)
    trainable = [parameter for parameter in model.parameters() if parameter.requires_grad]
    learning_rate = {"probe": 3e-3, "finetune": 3e-4, "scratch": 1e-3}[args.regime]
    optimizer = torch.optim.AdamW(trainable, lr=learning_rate, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
    scaler = torch.amp.GradScaler("cuda")
    best_validation = -math.inf
    best_state: dict[str, torch.Tensor] | None = None
    history: list[dict[str, float]] = []
    started = time.perf_counter()

    for epoch in range(1, args.epochs + 1):
        model.train()
        if args.regime == "probe":
            model.eval()
            model.fc.train()
        for images, targets in loaders["train"]:
            images, targets = images.to(device, non_blocking=True), targets.to(device, non_blocking=True)
            optimizer.zero_grad(set_to_none=True)
            with torch.autocast(device_type="cuda", dtype=torch.float16):
                loss = nn.functional.cross_entropy(model(images), targets)
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
        scheduler.step()
        validation_loss, validation_accuracy = evaluate(model, loaders["validation"], device)
        history.append({
            "epoch": epoch,
            "validation_loss": validation_loss,
            "validation_accuracy": validation_accuracy,
            "learning_rate": scheduler.get_last_lr()[0],
        })
        print(args.regime, args.seed, epoch, f"val_acc={validation_accuracy:.5f}", flush=True)
        if validation_accuracy > best_validation:
            best_validation = validation_accuracy
            best_state = {name: value.detach().cpu() for name, value in model.state_dict().items()}

    assert best_state is not None
    model.load_state_dict(best_state)
    test_loss, test_accuracy = evaluate(model, loaders["test"], device)
    result = {
        "experiment": "chapter9_resnet18_transfer",
        "regime": args.regime,
        "seed": args.seed,
        "smoke": args.smoke,
        "epochs": args.epochs,
        "parameter_count": sum(parameter.numel() for parameter in model.parameters()),
        "trainable_parameter_count": sum(parameter.numel() for parameter in trainable),
        "best_validation_accuracy": best_validation,
        "test_loss": test_loss,
        "test_accuracy": test_accuracy,
        "elapsed_seconds": time.perf_counter() - started,
        "history": history,
        "metadata": metadata(),
    }
    write_json(args.output, result)
    print(f"RESULT test_acc={test_accuracy:.5f} output={args.output}", flush=True)


if __name__ == "__main__":
    main()
