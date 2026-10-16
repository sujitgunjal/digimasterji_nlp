"""
Metric calculations for the DigiMasterJi evaluation harness.

These functions do not call the network or the database. The runner supplies
retrieved chunks, judge scores, and timings.
"""

from __future__ import annotations

import re
import statistics
from typing import Any, Dict, Iterable, Optional, Sequence


def _chunk_id(chunk: Dict[str, Any]) -> str:
    return str(chunk.get("_id", ""))


def is_relevant_chunk(chunk: Dict[str, Any], item: Dict[str, Any]) -> bool:
    """A retrieved chunk is relevant when it is one of the labeled gold chunks."""
    gold_ids = {str(value) for value in (item.get("gold_chunk_ids") or [])}
    if gold_ids and _chunk_id(chunk) in gold_ids:
        return True

    source = item.get("gold_source_file")
    indexes = item.get("gold_chunk_indexes")
    if source and chunk.get("source_file") == source:
        if not indexes:
            return not gold_ids
        return chunk.get("chunk_index") in indexes

    snippet = (item.get("gold_snippet") or "").strip()
    if snippet and snippet in (chunk.get("content_chunk") or ""):
        return True
    return False


def gold_count(item: Dict[str, Any]) -> int:
    """How many chunks count as the full relevant set for recall."""
    gold_ids = item.get("gold_chunk_ids") or []
    if gold_ids:
        return len(gold_ids)
    if item.get("gold_source_file") or item.get("gold_snippet"):
        return 1
    return 0


def recall_at_k(ranked: Sequence[Dict[str, Any]], item: Dict[str, Any], k: int = 5) -> Optional[float]:
    """
    Fraction of gold chunks that appear in the top k.

    With a single gold chunk this is the same as hit-rate at k.
    """
    total = gold_count(item)
    if total == 0:
        return None

    gold_ids = {str(value) for value in (item.get("gold_chunk_ids") or [])}
    if gold_ids:
        found = {
            _chunk_id(chunk)
            for chunk in ranked[:k]
            if _chunk_id(chunk) in gold_ids
        }
        return len(found) / total

    hit = any(is_relevant_chunk(chunk, item) for chunk in ranked[:k])
    return 1.0 if hit else 0.0


def mean_reciprocal_rank(ranked: Sequence[Dict[str, Any]], item: Dict[str, Any]) -> Optional[float]:
    """1 / rank of the first relevant chunk. Zero when none of the hits are relevant."""
    if gold_count(item) == 0:
        return None
    for index, chunk in enumerate(ranked, start=1):
        if is_relevant_chunk(chunk, item):
            return 1.0 / index
    return 0.0


def context_precision_at_k(
    ranked: Sequence[Dict[str, Any]],
    item: Dict[str, Any],
    k: int = 5,
) -> Optional[float]:
    """Fraction of the top-k slots that are relevant. Empty slots count against precision."""
    if gold_count(item) == 0:
        return None
    relevant = sum(1 for chunk in ranked[:k] if is_relevant_chunk(chunk, item))
    return relevant / k


def faithfulness_from_claims(claims: Optional[Sequence[Dict[str, Any]]]) -> Optional[float]:
    """Supported claims divided by all claims. None when the answer has no factual claims."""
    if not claims:
        return None
    supported = sum(1 for claim in claims if claim.get("supported") is True)
    return supported / len(claims)


def match_option(answer: str, options: Sequence[str]) -> Optional[str]:
    """
    Map a quiz reply onto one allowed option.

    The reply is expected to contain a final line `ANSWER: <option text>`.
    The last option named on that line wins, so an explanation that mentions a
    wrong option first does not hide the final choice.
    """
    text = (answer or "").strip()
    if not text:
        return None

    def norm(value: str) -> str:
        return " ".join(value.split()).strip().lower()

    marker = "ANSWER:"
    upper = text.upper()
    if marker in upper:
        labeled = text[upper.rfind(marker) + len(marker):].strip()
    else:
        labeled = text
    line = labeled.splitlines()[0] if labeled else ""
    line_norm = norm(line)

    for option in options:
        if norm(option) == line_norm or norm(option) == norm(labeled):
            return option

    if marker not in upper:
        return None

    hits = []
    for option in options:
        pattern = rf"(?<!\w){re.escape(option)}(?!\w)"
        if re.search(pattern, line, flags=re.IGNORECASE):
            hits.append(option)
    if not hits:
        return None
    return hits[-1]


def median(values: Iterable[Optional[float]]) -> Optional[float]:
    cleaned = [float(value) for value in values if value is not None]
    if not cleaned:
        return None
    return float(statistics.median(cleaned))


def mean(values: Iterable[Optional[float]]) -> Optional[float]:
    cleaned = [float(value) for value in values if value is not None]
    if not cleaned:
        return None
    return sum(cleaned) / len(cleaned)


def rate(numerator: int, denominator: int) -> Optional[float]:
    if denominator == 0:
        return None
    return numerator / denominator


def summarize_question_types(rows: Sequence[Dict[str, Any]]) -> Dict[str, Optional[float]]:
    """Quiz accuracy grouped by question_type."""
    buckets: Dict[str, List[float]] = {}
    for row in rows:
        if row.get("quiz_correct") is None:
            continue
        label = row.get("question_type") or "unspecified"
        buckets.setdefault(label, []).append(1.0 if row["quiz_correct"] else 0.0)
    return {label: mean(scores) for label, scores in sorted(buckets.items())}


def _self_check() -> None:
    item = {"gold_chunk_ids": ["a", "b"]}
    ranked = [
        {"_id": "a", "content_chunk": "plants release oxygen"},
        {"_id": "c", "content_chunk": "unrelated"},
        {"_id": "d", "content_chunk": "unrelated"},
        {"_id": "e", "content_chunk": "unrelated"},
        {"_id": "b", "content_chunk": "photosynthesis uses sunlight"},
    ]
    assert recall_at_k(ranked, item, 5) == 1.0
    assert recall_at_k(ranked[:1], item, 5) == 0.5
    assert mean_reciprocal_rank(ranked, item) == 1.0
    assert context_precision_at_k(ranked, item, 5) == 0.4
    assert faithfulness_from_claims([{"supported": True}, {"supported": False}]) == 0.5
    assert faithfulness_from_claims([]) is None
    assert match_option("ANSWER: Oxygen", ["Oxygen", "Nitrogen"]) == "Oxygen"
    assert match_option("not oxygen\nANSWER: Nitrogen", ["Oxygen", "Nitrogen"]) == "Nitrogen"
    assert match_option("I think it is nitrogen.", ["Oxygen", "Nitrogen"]) is None
    assert median([1, None, 3, 2]) == 2
    print("metric self-check passed")


if __name__ == "__main__":
    _self_check()
