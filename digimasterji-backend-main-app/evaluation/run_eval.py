"""
Evaluate DigiMasterJi without changing the application.

Configurations:
  gemma_no_retrieval     Gemma answers with no textbook chunks
  rag_top5_0.3           Production retrieval: top 5, keep score >= 0.3
  rag_alt                Alternate top-k and score cutoff (defaults: top 3, score >= 0.5)

Metrics:
  Retrieval Recall@5, MRR, context precision@5
  Faithfulness (RAG rows only), answer correctness, answer relevancy, language match
  Median end-to-end latency, median retrieval latency, empty-retrieval rate, failure rate
  Chapter-quiz accuracy, accuracy by question type, quiz completion rate

Retrieval metrics use the ranked list before the score cutoff, with a fixed
cutoff of 5, so the RAG rows are comparable. The score cutoff only changes
which chunks are placed in the prompt.

Usage (from digimasterji-backend-main-app):

    python evaluation/run_eval.py --dataset evaluation/dataset.json
    python evaluation/run_eval.py --dataset evaluation/dataset.json --retrieval-only
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

from app.database.knowledge_base import vector_search
from app.database.mongodb import close_mongo_connection, connect_to_mongo
from app.services.chat_service import ChatService
from app.services.llm_service import llm_service
from app.services.rag_service import rag_service
from evaluation.judge import judge_answer
from evaluation.metrics import (
    context_precision_at_k,
    faithfulness_from_claims,
    gold_count,
    match_option,
    mean,
    mean_reciprocal_rank,
    median,
    rate,
    recall_at_k,
    summarize_question_types,
)


RETRIEVAL_DEPTH = 10
RECALL_K = 5


def load_dataset(path: Path) -> Dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    items = data.get("items") or []
    if not items:
        raise SystemExit(f"No items in {path}. Build one with evaluation/build_dataset.py.")
    profile = data.get("profile") or {
        "name": "Aarav",
        "age": 12,
        "grade_level": "6th",
        "preferred_language": "English",
    }
    return {"profile": profile, "items": items, "synthetic": bool(data.get("synthetic"))}


def build_configs(alt_k: int, alt_min_score: float) -> List[Dict[str, Any]]:
    return [
        {"name": "gemma_no_retrieval", "use_rag": False, "limit": 0, "min_score": None},
        {"name": "rag_top5_0.3", "use_rag": True, "limit": 5, "min_score": 0.3},
        {
            "name": f"rag_top{alt_k}_{alt_min_score}",
            "use_rag": True,
            "limit": alt_k,
            "min_score": alt_min_score,
        },
    ]


async def rank_chunks(question: str, subject: Optional[str]) -> List[Dict[str, Any]]:
    embedding = rag_service.generate_embedding(question)
    return await vector_search(
        query_embedding=embedding,
        limit=RETRIEVAL_DEPTH,
        subject=subject,
    )


def chunks_for_prompt(ranked: List[Dict[str, Any]], limit: int, min_score: float) -> List[Dict[str, Any]]:
    kept = [chunk for chunk in ranked if float(chunk.get("score") or 0) >= min_score]
    return kept[:limit]


def context_text(chunks: List[Dict[str, Any]]) -> str:
    parts = []
    for index, chunk in enumerate(chunks, start=1):
        title = chunk.get("title") or "Untitled"
        subject = chunk.get("subject") or "General"
        content = chunk.get("content_chunk") or ""
        parts.append(f"[Source {index}: {subject} - {title}]\n{content}")
    return "\n\n".join(parts)


async def generate_tutor_answer(
    chat: ChatService,
    question: str,
    chunks: List[Dict[str, Any]],
    profile: Dict[str, Any],
) -> Dict[str, Any]:
    system_prompt = chat.build_system_prompt(
        has_rag_context=bool(chunks),
        profile_data=profile,
    )
    prompt = chat.build_final_prompt(
        user_message=question,
        conversation_history=[],
        rag_results=chunks,
    )
    started = time.perf_counter()
    result = await llm_service.generate(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=chat.temperature,
        max_tokens=chat.max_tokens,
    )
    elapsed_ms = (time.perf_counter() - started) * 1000
    return {
        "success": bool(result.get("success")),
        "answer": result.get("response") or "",
        "error": result.get("error"),
        "generate_ms": elapsed_ms,
    }


def quiz_question(item: Dict[str, Any]) -> Optional[str]:
    options = item.get("options") or []
    correct = item.get("correct_answer")
    if not options or not correct:
        return None
    lines = [item["question"], "", "Choose one option and end with a line exactly like: ANSWER: <option text>"]
    for option in options:
        lines.append(f"- {option}")
    return "\n".join(lines)


async def evaluate_item(
    item: Dict[str, Any],
    profile: Dict[str, Any],
    configs: List[Dict[str, Any]],
    retrieval_only: bool,
) -> Dict[str, Any]:
    question = item["question"]
    subject = item.get("subject") if item.get("filter_subject") else None
    language = profile.get("preferred_language") or "English"
    retrieval_ms = None
    ranked: List[Dict[str, Any]] = []
    retrieval_error = None

    started = time.perf_counter()
    try:
        ranked = await rank_chunks(question, subject)
    except Exception as exc:
        retrieval_error = str(exc)
    retrieval_ms = (time.perf_counter() - started) * 1000

    retrieval_metrics = None
    if gold_count(item) > 0 and retrieval_error is None:
        retrieval_metrics = {
            "recall_at_5": recall_at_k(ranked, item, RECALL_K),
            "mrr": mean_reciprocal_rank(ranked, item),
            "context_precision_at_5": context_precision_at_k(ranked, item, RECALL_K),
            "retrieved_ids": [str(chunk.get("_id")) for chunk in ranked[:RECALL_K]],
        }

    per_config = []
    for config in configs:
        row: Dict[str, Any] = {
            "config": config["name"],
            "retrieval_ms": retrieval_ms if config["use_rag"] else None,
            "retrieval_error": retrieval_error if config["use_rag"] else None,
        }
        if retrieval_metrics and config["use_rag"]:
            row.update(retrieval_metrics)

        prompt_chunks: List[Dict[str, Any]] = []
        if config["use_rag"]:
            if retrieval_error:
                row["empty_retrieval"] = None
            else:
                prompt_chunks = chunks_for_prompt(ranked, config["limit"], config["min_score"])
                row["empty_retrieval"] = len(prompt_chunks) == 0
                row["prompt_chunk_ids"] = [str(chunk.get("_id")) for chunk in prompt_chunks]
        else:
            row["recall_at_5"] = None
            row["mrr"] = None
            row["context_precision_at_5"] = None
            row["empty_retrieval"] = None

        if retrieval_only:
            row["failure"] = retrieval_error is not None and config["use_rag"]
            per_config.append(row)
            continue

        chat = ChatService(
            rag_chunks_limit=config["limit"] or 5,
            rag_min_score=config["min_score"] if config["min_score"] is not None else 0.3,
        )
        open_started = time.perf_counter()
        generated = await generate_tutor_answer(chat, question, prompt_chunks, profile)
        open_ms = (time.perf_counter() - open_started) * 1000
        retrieval_part = retrieval_ms if config["use_rag"] and retrieval_ms is not None else 0
        row["e2e_ms"] = open_ms + retrieval_part
        row["failure"] = not generated["success"]
        row["answer"] = generated["answer"]
        row["error"] = generated["error"]

        if generated["success"] and item.get("gold_answer"):
            try:
                judgment = await judge_answer(
                    question=question,
                    answer=generated["answer"],
                    gold_answer=item["gold_answer"],
                    context=context_text(prompt_chunks) if config["use_rag"] else "",
                    expected_language=language,
                )
                row["correct"] = judgment["correct"]
                row["relevant"] = judgment["relevant"]
                row["language_match"] = judgment["language_match"]
                row["claims"] = judgment["claims"]
                if config["use_rag"] and prompt_chunks:
                    row["faithfulness"] = faithfulness_from_claims(judgment["claims"])
                else:
                    row["faithfulness"] = None
            except Exception as exc:
                row["judge_error"] = str(exc)

        quiz_prompt = quiz_question(item)
        if generated["success"] and quiz_prompt:
            quiz_run = await generate_tutor_answer(chat, quiz_prompt, prompt_chunks, profile)
            if not quiz_run["success"]:
                row["quiz_completed"] = False
                row["quiz_correct"] = False
                row["quiz_error"] = quiz_run["error"]
            else:
                chosen = match_option(quiz_run["answer"], item["options"])
                row["quiz_choice"] = chosen
                row["quiz_completed"] = chosen is not None
                row["quiz_correct"] = chosen == item["correct_answer"] if chosen else False
                row["question_type"] = item.get("question_type") or "unspecified"
        per_config.append(row)

    return {"id": item.get("id"), "question": question, "configs": per_config}


def aggregate(item_rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    names = []
    for item in item_rows:
        for config in item["configs"]:
            if config["config"] not in names:
                names.append(config["config"])

    summaries = []
    for name in names:
        rows = [config for item in item_rows for config in item["configs"] if config["config"] == name]
        uses_rag = rows[0].get("recall_at_5") is not None or any(row.get("empty_retrieval") is not None for row in rows)
        quiz_rows = [row for row in rows if "quiz_completed" in row]
        completed = sum(1 for row in quiz_rows if row.get("quiz_completed"))
        correct_quiz = sum(1 for row in quiz_rows if row.get("quiz_correct"))
        failures = sum(1 for row in rows if row.get("failure"))
        empty = [row.get("empty_retrieval") for row in rows if row.get("empty_retrieval") is not None]
        summaries.append({
            "config": name,
            "recall_at_5": mean(row.get("recall_at_5") for row in rows) if uses_rag else None,
            "mrr": mean(row.get("mrr") for row in rows) if uses_rag else None,
            "context_precision_at_5": mean(row.get("context_precision_at_5") for row in rows) if uses_rag else None,
            "faithfulness": mean(row.get("faithfulness") for row in rows),
            "answer_correctness": mean((1.0 if row.get("correct") else 0.0) for row in rows if row.get("correct") is not None),
            "answer_relevancy": mean((1.0 if row.get("relevant") else 0.0) for row in rows if row.get("relevant") is not None),
            "language_match": mean((1.0 if row.get("language_match") else 0.0) for row in rows if row.get("language_match") is not None),
            "median_e2e_ms": median(row.get("e2e_ms") for row in rows),
            "median_retrieval_ms": median(row.get("retrieval_ms") for row in rows),
            "empty_retrieval_rate": mean((1.0 if flag else 0.0) for flag in empty) if empty else None,
            "failure_rate": rate(failures, len(rows)),
            "quiz_accuracy": rate(correct_quiz, len(quiz_rows)) if quiz_rows else None,
            "quiz_accuracy_by_type": summarize_question_types(quiz_rows),
            "quiz_completion_rate": rate(completed, len(quiz_rows)) if quiz_rows else None,
            "items": len(rows),
        })
    return summaries


def format_cell(value: Any) -> str:
    if value is None:
        return "n/a"
    if isinstance(value, float):
        return f"{value:.3f}"
    return str(value)


def print_report(summaries: List[Dict[str, Any]], synthetic: bool) -> None:
    columns = [
        ("recall_at_5", "Recall@5"),
        ("mrr", "MRR"),
        ("context_precision_at_5", "Precision@5"),
        ("faithfulness", "Faithfulness"),
        ("answer_correctness", "Correctness"),
        ("answer_relevancy", "Relevancy"),
        ("language_match", "Language"),
        ("median_e2e_ms", "Median e2e ms"),
        ("median_retrieval_ms", "Median retrieval ms"),
        ("empty_retrieval_rate", "Empty retrieval"),
        ("failure_rate", "Failure rate"),
        ("quiz_accuracy", "Quiz accuracy"),
        ("quiz_completion_rate", "Quiz completion"),
    ]
    headers = ["Configuration"] + [label for _, label in columns]
    table = []
    for summary in summaries:
        table.append([summary["config"]] + [format_cell(summary[key]) for key, _ in columns])

    widths = [len(header) for header in headers]
    for row in table:
        for index, cell in enumerate(row):
            widths[index] = max(widths[index], len(cell))

    def line(cells: List[str]) -> str:
        return " | ".join(cell.ljust(widths[index]) for index, cell in enumerate(cells))

    print()
    print(line(headers))
    print("-+-".join("-" * width for width in widths))
    for row in table:
        print(line(row))

    print()
    for summary in summaries:
        by_type = summary["quiz_accuracy_by_type"]
        if not by_type:
            continue
        parts = [f"{label}={format_cell(score)}" for label, score in by_type.items()]
        print(f"{summary['config']} quiz accuracy by type: {', '.join(parts)}")

    print()
    print("Recall@5, MRR, and Precision@5 are n/a for Gemma without retrieval.")
    print("Faithfulness is n/a when no textbook chunks were placed in the prompt.")
    print("Context precision uses a denominator of 5, so one gold chunk caps it at 0.200 when that chunk is retrieved.")
    if synthetic:
        print("This dataset is synthetic: questions were written from the gold chunk, so retrieval scores are optimistic.")
    print("The judge model is the same Gemma model that wrote the answers.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run DigiMasterJi evaluation metrics.")
    parser.add_argument("--dataset", required=True, help="Path to a dataset JSON file")
    parser.add_argument("--output", default="", help="Results JSON path. Defaults to evaluation/results/<timestamp>.json")
    parser.add_argument("--limit", type=int, default=0, help="Evaluate only the first N items")
    parser.add_argument("--alt-k", type=int, default=3, help="Top-k for the alternate RAG configuration")
    parser.add_argument("--alt-min-score", type=float, default=0.5, help="Score cutoff for the alternate RAG configuration")
    parser.add_argument("--retrieval-only", action="store_true", help="Skip answer generation, judging, and quizzes")
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    dataset_path = Path(args.dataset)
    if not dataset_path.is_absolute():
        dataset_path = ROOT / dataset_path
    dataset = load_dataset(dataset_path)
    items = dataset["items"]
    if args.limit > 0:
        items = items[:args.limit]
    configs = build_configs(args.alt_k, args.alt_min_score)

    await connect_to_mongo()
    try:
        item_rows = []
        for index, item in enumerate(items, start=1):
            print(f"[{index}/{len(items)}] {item.get('id')}")
            item_rows.append(
                await evaluate_item(item, dataset["profile"], configs, args.retrieval_only)
            )
    finally:
        await close_mongo_connection()

    summaries = aggregate(item_rows)
    print_report(summaries, dataset["synthetic"])

    if args.output:
        output = Path(args.output)
        if not output.is_absolute():
            output = ROOT / output
    else:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        output = ROOT / "evaluation" / "results" / f"{stamp}.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "dataset": str(dataset_path),
        "synthetic": dataset["synthetic"],
        "retrieval_only": args.retrieval_only,
        "configs": configs,
        "summary": summaries,
        "items": item_rows,
    }
    output.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {output}")


if __name__ == "__main__":
    asyncio.run(main())
