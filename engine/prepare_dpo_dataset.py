"""Turn SYNTH preference JSONL into the small DPO format used by TRL.

This script does not judge whether the annotations are good. It preserves only
the prompt/chosen/rejected fields after checking the declared SYNTH schema.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="SYNTH preference JSONL export")
    parser.add_argument("output", type=Path, help="Output DPO JSONL path")
    parser.add_argument("--minimum-pairs", type=int, default=20)
    args = parser.parse_args()

    records: list[dict[str, str]] = []
    errors: list[str] = []
    for index, line in enumerate(args.input.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        record = json.loads(line)
        if record.get("schema") != "synth.preference.v1":
            errors.append(f"line {index}: expected synth.preference.v1")
            continue
        fields = {name: record.get(name) for name in ("prompt", "chosen", "rejected")}
        if not all(isinstance(value, str) and value.strip() for value in fields.values()):
            errors.append(f"line {index}: prompt/chosen/rejected must be non-empty strings")
            continue
        records.append(fields)  # type: ignore[arg-type]

    if errors:
        raise SystemExit("Dataset was not prepared:\n" + "\n".join(errors))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(json.dumps(record, ensure_ascii=False) for record in records) + ("\n" if records else ""), encoding="utf-8")
    manifest = {
        "source": str(args.input), "format": "trl-dpo-jsonl", "records": len(records),
        "minimum_pairs": args.minimum_pairs, "meets_minimum": len(records) >= args.minimum_pairs,
        "note": "Meeting a record count does not establish quality, consent, licensing, or expected model benefit.",
    }
    args.output.with_suffix(args.output.suffix + ".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
