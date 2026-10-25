"""Export the trained Mini-DDSM checkpoints to browser-ready ONNX.

Each exported graph takes one ImageNet-normalised 1x3x512x512 image, applies the
same four-view TTA as the paper (identity, H-flip, V-flip, 180°), and returns the
mean sigmoid probability. Weights are stored as float16 and cast back to float32
inside the graph, so files are half-size while compute stays in fp32.

Usage (from repo root, in the training env):
    python website/scripts/export_onnx.py --seed 42 --fold 0
"""

import argparse
from pathlib import Path

import numpy as np
import onnx
import timm
import torch
from onnx import helper, numpy_helper

ROOT = Path(__file__).resolve().parents[2]
CKPT_DIR = ROOT / "mini_ddsm_csde2026_fixed_patient_outputs" / "checkpoints"
OUT_DIR = ROOT / "website" / "public" / "models"
BACKBONES = {"tf_efficientnet_b4": "effnet_b4", "convnextv2_tiny": "convnextv2_tiny"}


class TTAWrapper(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, x):
        views = torch.cat([x, torch.flip(x, dims=[3]), torch.flip(x, dims=[2]), torch.flip(x, dims=[2, 3])], 0)  # flip both axes == 180° rotation
        return torch.sigmoid(self.model(views)).mean(0, keepdim=True)


def weights_to_fp16(path: Path):
    m = onnx.load(str(path), load_external_data=True)
    g = m.graph
    new_inits, casts = [], []
    for init in g.initializer:
        arr = numpy_helper.to_array(init)
        if arr.dtype == np.float32 and arr.size >= 1024:
            half = numpy_helper.from_array(arr.astype(np.float16), init.name + "_fp16")
            new_inits.append(half)
            casts.append(helper.make_node("Cast", [half.name], [init.name], to=onnx.TensorProto.FLOAT))
        else:
            new_inits.append(init)
    del g.initializer[:]
    g.initializer.extend(new_inits)
    nodes = list(g.node)
    del g.node[:]
    g.node.extend(casts + nodes)
    onnx.checker.check_model(m)
    onnx.save(m, str(path))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--fold", type=int, default=0)
    args = ap.parse_args()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for arch, short in BACKBONES.items():
        ckpt = CKPT_DIR / f"{arch}_seed{args.seed}_fold{args.fold}.pt"
        model = timm.create_model(arch, pretrained=False, num_classes=1, in_chans=3)
        model.load_state_dict(torch.load(ckpt, map_location="cpu"))
        model.eval()
        wrapped = TTAWrapper(model).eval()
        out = OUT_DIR / f"{short}.onnx"
        dummy = torch.randn(1, 3, 512, 512)
        torch.onnx.export(wrapped, dummy, str(out), input_names=["image"], output_names=["prob"], opset_version=17, dynamo=False)
        weights_to_fp16(out)
        print(f"{ckpt.name} -> {out.name}  {out.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
