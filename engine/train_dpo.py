"""Guarded local LoRA/DPO training entry point for a reviewed SYNTH dataset.

Default behavior is a dry run. Use --train only after reviewing the manifest,
confirming rights to the data, and accepting that CPU training is slow.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", type=Path, help="DPO JSONL created by prepare_dpo_dataset.py")
    parser.add_argument("--model", default="HuggingFaceTB/SmolLM2-135M-Instruct")
    parser.add_argument("--output", type=Path, default=Path("outputs/synth-dpo-adapter"))
    parser.add_argument("--minimum-pairs", type=int, default=20)
    parser.add_argument("--train", action="store_true", help="Actually train; without this, print a plan only.")
    parser.add_argument("--allow-cpu", action="store_true", help="Required for an intentionally slow CPU-only run.")
    args = parser.parse_args()

    rows = [json.loads(line) for line in args.dataset.read_text(encoding="utf-8").splitlines() if line.strip()]
    if len(rows) < args.minimum_pairs:
        raise SystemExit(f"Refusing to train: {len(rows)} reviewed pairs found; minimum is {args.minimum_pairs}.")
    required = {"prompt", "chosen", "rejected"}
    if any(not required.issubset(row) for row in rows):
        raise SystemExit("Dataset is not valid DPO JSONL. Run prepare_dpo_dataset.py first.")

    try:
        import torch
        from datasets import Dataset
        from peft import LoraConfig
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from trl import DPOConfig, DPOTrainer
    except ImportError as error:
        raise SystemExit(f"Training runtime is incomplete: {error}") from error

    device = "cuda" if torch.cuda.is_available() else "cpu"
    plan = {"model": args.model, "pairs": len(rows), "device": device, "output": str(args.output), "actual_training": args.train}
    print(json.dumps(plan, indent=2))
    if not args.train:
        print("Dry run only. Add --train after reviewing this plan.")
        return
    if device == "cpu" and not args.allow_cpu:
        raise SystemExit("CPU training is intentionally gated. Re-run with --allow-cpu if you accept the slow proof-of-workflow run.")

    tokenizer = AutoTokenizer.from_pretrained(args.model, trust_remote_code=False)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    model = AutoModelForCausalLM.from_pretrained(args.model, trust_remote_code=False)
    dataset = Dataset.from_list(rows)
    config = DPOConfig(
        output_dir=str(args.output),
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        num_train_epochs=1,
        learning_rate=1e-5,
        logging_steps=1,
        save_strategy="no",
        report_to="none",
    )
    peft_config = LoraConfig(r=8, lora_alpha=16, lora_dropout=0.05, bias="none", task_type="CAUSAL_LM")
    trainer = DPOTrainer(model=model, args=config, train_dataset=dataset, processing_class=tokenizer, peft_config=peft_config)
    trainer.train()
    trainer.save_model(str(args.output))
    print(f"Saved LoRA adapter to {args.output}")


if __name__ == "__main__":
    main()
