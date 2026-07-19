#!/usr/bin/env python3
"""Split a generated FDD comparison dataset into one compact JSON file per Item."""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input_json", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()

    payload = json.loads(args.input_json.read_text(encoding="utf-8"))
    grouped: dict[int, list[dict]] = defaultdict(list)
    for row in payload["rows"]:
        grouped[int(row["item"])].append(row)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    files: list[str] = []
    for item in sorted(grouped):
        filename = f"item-{item:02d}.json"
        files.append(filename)
        (args.output_dir / filename).write_text(
            json.dumps({"rows": grouped[item]}, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )

    (args.output_dir / "index.json").write_text(
        json.dumps({"metadata": payload["metadata"], "files": files}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
