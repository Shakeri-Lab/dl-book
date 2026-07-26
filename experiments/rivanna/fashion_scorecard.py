"""Full-data Fashion-MNIST scorecard for Chapter 9."""

from __future__ import annotations

import argparse
import math
import time
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, transforms

from common import exclusive_lock, metadata, require_cuda, seed_everything, write_json


class LeNet(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 16, 5, padding=2), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(16, 32, 5, padding=2), nn.ReLU(), nn.MaxPool2d(2),
        )
        self.head = nn.Sequential(
            nn.Flatten(), nn.Linear(32 * 7 * 7, 120), nn.ReLU(), nn.Linear(120, 10)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.head(self.features(x))


def conv_bn_relu(in_channels: int, out_channels: int, kernel: int = 3) -> nn.Sequential:
    return nn.Sequential(
        nn.Conv2d(in_channels, out_channels, kernel, padding=kernel // 2, bias=False),
        nn.BatchNorm2d(out_channels),
        nn.ReLU(inplace=True),
    )


class VGGSmall(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.net = nn.Sequential(
            conv_bn_relu(1, 32), conv_bn_relu(32, 32), nn.MaxPool2d(2),
            conv_bn_relu(32, 64), conv_bn_relu(64, 64), nn.MaxPool2d(2),
            conv_bn_relu(64, 128), conv_bn_relu(128, 128),
            nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.Linear(128, 10),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


class NiNSmall(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.net = nn.Sequential(
            conv_bn_relu(1, 48, 5), conv_bn_relu(48, 32, 1), conv_bn_relu(32, 32, 1),
            nn.MaxPool2d(2),
            conv_bn_relu(32, 64), conv_bn_relu(64, 48, 1), conv_bn_relu(48, 48, 1),
            nn.MaxPool2d(2),
            conv_bn_relu(48, 96), conv_bn_relu(96, 64, 1),
            nn.Conv2d(64, 10, 1), nn.AdaptiveAvgPool2d(1), nn.Flatten(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


class ResidualBlock(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, stride: int = 1) -> None:
        super().__init__()
        self.main = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, stride, 1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
        )
        self.skip = (
            nn.Identity()
            if stride == 1 and in_channels == out_channels
            else nn.Sequential(
                nn.Conv2d(in_channels, out_channels, 1, stride, bias=False),
                nn.BatchNorm2d(out_channels),
            )
        )
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.relu(self.main(x) + self.skip(x))


class ResNetSmall(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        layers: list[nn.Module] = [conv_bn_relu(1, 32)]
        in_channels = 32
        for out_channels, blocks, stride in [(32, 3, 1), (64, 3, 2), (128, 3, 2)]:
            layers.append(ResidualBlock(in_channels, out_channels, stride))
            layers.extend(ResidualBlock(out_channels, out_channels) for _ in range(blocks - 1))
            in_channels = out_channels
        self.features = nn.Sequential(*layers)
        self.head = nn.Sequential(nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.Linear(128, 10))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.head(self.features(x))


MODELS = {
    "lenet": LeNet,
    "vgg": VGGSmall,
    "nin": NiNSmall,
    "resnet": ResNetSmall,
}


@torch.inference_mode()
def evaluate(model: nn.Module, loader: DataLoader, device: torch.device) -> tuple[float, float]:
    model.eval()
    total_loss = 0.0
    total_correct = 0
    total = 0
    for images, targets in loader:
        images, targets = images.to(device, non_blocking=True), targets.to(device, non_blocking=True)
        logits = model(images)
        total_loss += nn.functional.cross_entropy(logits, targets, reduction="sum").item()
        total_correct += (logits.argmax(1) == targets).sum().item()
        total += targets.numel()
    return total_loss / total, total_correct / total


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", choices=MODELS, required=True)
    parser.add_argument("--seed", type=int, required=True)
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch-size", type=int, default=256)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--data-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--smoke", action="store_true")
    args = parser.parse_args()

    seed_everything(args.seed)
    device = require_cuda()
    with exclusive_lock(args.data_root / ".fashion.lock"):
        datasets.FashionMNIST(args.data_root, train=True, download=True)
        datasets.FashionMNIST(args.data_root, train=False, download=True)

    normalize = transforms.Normalize((0.2860,), (0.3530,))
    train_transform = transforms.Compose([
        transforms.RandomHorizontalFlip(),
        transforms.RandomCrop(28, padding=2),
        transforms.ToTensor(),
        normalize,
    ])
    eval_transform = transforms.Compose([transforms.ToTensor(), normalize])
    train_full = datasets.FashionMNIST(args.data_root, train=True, transform=train_transform)
    validation_full = datasets.FashionMNIST(args.data_root, train=True, transform=eval_transform)
    test = datasets.FashionMNIST(args.data_root, train=False, transform=eval_transform)
    split = torch.randperm(len(train_full), generator=torch.Generator().manual_seed(6050))
    train_indices, validation_indices = split[:50_000], split[50_000:]
    if args.smoke:
        train_indices, validation_indices = train_indices[:2048], validation_indices[:1024]
        test = Subset(test, range(1024))
        args.epochs = 1

    loaders = {
        "train": DataLoader(
            Subset(train_full, train_indices), batch_size=args.batch_size, shuffle=True,
            num_workers=args.workers, pin_memory=True, persistent_workers=args.workers > 0,
        ),
        "validation": DataLoader(
            Subset(validation_full, validation_indices), batch_size=512, shuffle=False,
            num_workers=args.workers, pin_memory=True, persistent_workers=args.workers > 0,
        ),
        "test": DataLoader(
            test, batch_size=512, shuffle=False, num_workers=args.workers,
            pin_memory=True, persistent_workers=args.workers > 0,
        ),
    }
    model = MODELS[args.model]().to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-3, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
    scaler = torch.amp.GradScaler("cuda")
    history: list[dict[str, float]] = []
    best_state: dict[str, torch.Tensor] | None = None
    best_validation = -math.inf
    started = time.perf_counter()

    for epoch in range(1, args.epochs + 1):
        model.train()
        for images, targets in loaders["train"]:
            images = images.to(device, non_blocking=True)
            targets = targets.to(device, non_blocking=True)
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
        print(args.model, args.seed, epoch, f"val_acc={validation_accuracy:.5f}", flush=True)
        if validation_accuracy > best_validation:
            best_validation = validation_accuracy
            best_state = {name: value.detach().cpu() for name, value in model.state_dict().items()}

    assert best_state is not None
    model.load_state_dict(best_state)
    test_loss, test_accuracy = evaluate(model, loaders["test"], device)
    result = {
        "experiment": "chapter9_fashion_scorecard",
        "model": args.model,
        "seed": args.seed,
        "smoke": args.smoke,
        "epochs": args.epochs,
        "parameter_count": sum(parameter.numel() for parameter in model.parameters()),
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
