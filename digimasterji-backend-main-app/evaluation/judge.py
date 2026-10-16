"""
LLM-as-judge scoring for faithfulness, correctness, relevancy, and language.

The judge is the same Ollama model the tutor uses. That bias is recorded in
the evaluation report. This module does not change tutor prompts.
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional

from app.services.llm_service import llm_service


JUDGE_SYSTEM = """You grade a tutor answer for an evaluation dataset.
Return only a JSON object. Do not use markdown fences.

Schema:
{
  "claims": [{"text": "one factual claim", "supported": true}],
  "correct": true,
  "relevant": true,
  "language_match": true
}

Rules:
- claims: split the tutor answer into short factual claims. Mark supported true only when the claim is stated or clearly implied by CONTEXT. If CONTEXT is empty, return an empty claims list.
- correct: true when the tutor answer agrees with GOLD ANSWER and does not contradict it. Extra explanation is allowed.
- relevant: true when the tutor answer addresses QUESTION.
- language_match: true when the tutor answer is primarily in EXPECTED LANGUAGE.
"""


def parse_json_object(text: str) -> Dict[str, Any]:
    raw = (text or "").strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?", "", raw, flags=re.IGNORECASE).strip()
        raw = re.sub(r"```$", "", raw).strip()
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("Judge response did not contain a JSON object")
    return json.loads(raw[start:end + 1])


def _as_bool(value: Any) -> Optional[bool]:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"true", "yes", "1"}:
            return True
        if lowered in {"false", "no", "0"}:
            return False
    return None


def normalize_judgment(payload: Dict[str, Any]) -> Dict[str, Any]:
    claims_in = payload.get("claims") or []
    claims: List[Dict[str, Any]] = []
    if isinstance(claims_in, list):
        for claim in claims_in:
            if isinstance(claim, str):
                claims.append({"text": claim, "supported": False})
                continue
            if not isinstance(claim, dict):
                continue
            supported = _as_bool(claim.get("supported"))
            claims.append({
                "text": str(claim.get("text") or "").strip(),
                "supported": supported is True,
            })
    return {
        "claims": [claim for claim in claims if claim["text"]],
        "correct": _as_bool(payload.get("correct")),
        "relevant": _as_bool(payload.get("relevant")),
        "language_match": _as_bool(payload.get("language_match")),
    }


async def judge_answer(
    question: str,
    answer: str,
    gold_answer: str,
    context: str,
    expected_language: str,
) -> Dict[str, Any]:
    """Score one tutor answer. Raises when the model call or JSON parse fails."""
    prompt = (
        f"QUESTION:\n{question}\n\n"
        f"EXPECTED LANGUAGE:\n{expected_language}\n\n"
        f"CONTEXT:\n{context or '(empty)'}\n\n"
        f"GOLD ANSWER:\n{gold_answer}\n\n"
        f"TUTOR ANSWER:\n{answer}\n"
    )
    result = await llm_service.generate(
        prompt=prompt,
        system_prompt=JUDGE_SYSTEM,
        temperature=0.0,
        max_tokens=800,
    )
    if not result.get("success"):
        raise RuntimeError(result.get("error") or "Judge model call failed")
    return normalize_judgment(parse_json_object(result.get("response") or ""))
