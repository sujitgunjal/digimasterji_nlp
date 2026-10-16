"""
Build a labeled evaluation dataset from chunks already stored in MongoDB.

Each question is written by the tutor model from one chunk, and that chunk id
is stored as the gold label. Recall on this file is optimistic, because the
question was derived from the same passage the retriever is scored against.
Replace or edit items before treating the numbers as a student-question result.

This script only reads the knowledge base and writes a JSON file. It does not
modify application code or database documents.

Usage (from digimasterji-backend-main-app):

    python evaluation/build_dataset.py --count 8 --output evaluation/dataset.json
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

from app.database.mongodb import close_mongo_connection, connect_to_mongo
from app.database.knowledge_base import get_knowledge_base_collection
from app.services.llm_service import llm_service
from evaluation.judge import parse_json_object


QUESTION_SYSTEM = """You write evaluation items for a STEM tutor.
Return only a JSON object. Do not use markdown fences.

Schema:
{
  "question": "a student question answered by the passage",
  "gold_answer": "one or two sentences taken from the passage",
  "question_type": "definition|factual|reasoning|numerical",
  "options": ["option 1", "option 2", "option 3", "option 4"],
  "correct_answer": "the option that matches the passage, copied exactly"
}

The question must be answerable from the passage alone.
correct_answer must be identical to one of the four options.
The other options must be plausible and wrong.
"""


async def sample_chunks(count: int) -> List[Dict[str, Any]]:
    collection = get_knowledge_base_collection()
    pipeline = [
        {"$match": {"content_chunk": {"$type": "string"}}},
        {"$sample": {"size": max(count * 8, count)}},
        {"$project": {"vector_embedding": 0}},
    ]
    pool: List[Dict[str, Any]] = []
    async for doc in collection.aggregate(pipeline):
        text = (doc.get("content_chunk") or "").strip()
        if len(text) < 400:
            continue
        doc["_id"] = str(doc["_id"])
        pool.append(doc)

    chosen: List[Dict[str, Any]] = []
    seen_sources = set()
    for doc in pool:
        source = doc.get("source_file") or doc["_id"]
        if source in seen_sources:
            continue
        seen_sources.add(source)
        chosen.append(doc)
        if len(chosen) >= count:
            return chosen

    chosen_ids = {doc["_id"] for doc in chosen}
    for doc in pool:
        if doc["_id"] in chosen_ids:
            continue
        chosen.append(doc)
        chosen_ids.add(doc["_id"])
        if len(chosen) >= count:
            break
    return chosen


async def write_item(chunk: Dict[str, Any], language: str) -> Dict[str, Any]:
    excerpt = (chunk.get("content_chunk") or "")[:1800]
    prompt = (
        f"Write the evaluation item in {language}.\n\n"
        f"PASSAGE:\n{excerpt}\n"
    )
    result = await llm_service.generate(
        prompt=prompt,
        system_prompt=QUESTION_SYSTEM,
        temperature=0.2,
        max_tokens=700,
    )
    if not result.get("success"):
        raise RuntimeError(result.get("error") or "Question generation failed")
    payload = parse_json_object(result.get("response") or "")
    options = payload.get("options") or []
    if not isinstance(options, list) or len(options) != 4:
        raise ValueError("Expected exactly 4 options")
    options = [str(option).strip() for option in options]
    correct = str(payload.get("correct_answer") or "").strip()
    if correct not in options:
        raise ValueError("correct_answer is not one of the options")
    question = str(payload.get("question") or "").strip()
    gold_answer = str(payload.get("gold_answer") or "").strip()
    if not question or not gold_answer:
        raise ValueError("Question or gold answer was empty")
    question_type = str(payload.get("question_type") or "factual").strip().lower()
    if question_type not in {"definition", "factual", "reasoning", "numerical"}:
        question_type = "factual"
    return {
        "id": chunk["_id"],
        "question": question,
        "gold_answer": gold_answer,
        "gold_chunk_ids": [chunk["_id"]],
        "gold_source_file": chunk.get("source_file"),
        "gold_snippet": excerpt[:180],
        "subject": chunk.get("subject"),
        "question_type": question_type,
        "options": options,
        "correct_answer": correct,
        "synthetic": True,
    }


async def build(count: int, language: str) -> Dict[str, Any]:
    chunks = await sample_chunks(count)
    if not chunks:
        raise RuntimeError("No knowledge-base chunks were found. Upload a textbook PDF first.")
    items = []
    for index, chunk in enumerate(chunks, start=1):
        print(f"[{index}/{len(chunks)}] writing a question for {chunk.get('source_file')}")
        try:
            items.append(await write_item(chunk, language))
        except Exception as exc:
            print(f"  skipped chunk {chunk.get('_id')}: {exc}")
    if not items:
        raise RuntimeError("The model did not return any usable questions.")
    return {
        "synthetic": True,
        "note": (
            "Questions were generated from the gold chunk. Retrieval scores on "
            "this file are higher than scores on real student questions."
        ),
        "profile": {
            "name": "Aarav",
            "age": 12,
            "grade_level": "6th",
            "preferred_language": language,
        },
        "items": items,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a DigiMasterJi evaluation dataset from the knowledge base.")
    parser.add_argument("--count", type=int, default=8, help="Number of questions to create")
    parser.add_argument("--language", default="English", help="Language for questions and gold answers")
    parser.add_argument("--output", default="evaluation/dataset.json", help="Where to write the dataset")
    parser.add_argument("--force", action="store_true", help="Overwrite the output file if it exists")
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    output = Path(args.output)
    if not output.is_absolute():
        output = ROOT / output
    if output.exists() and not args.force:
        raise SystemExit(f"{output} already exists. Pass --force to replace it.")
    await connect_to_mongo()
    try:
        dataset = await build(args.count, args.language)
    finally:
        await close_mongo_connection()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(dataset, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(dataset['items'])} items to {output}")


if __name__ == "__main__":
    asyncio.run(main())
