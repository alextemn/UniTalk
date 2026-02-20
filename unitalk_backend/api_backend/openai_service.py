import json
from django.conf import settings
from openai import OpenAI, OpenAIError

# Strict, unchanging scoring rubric — never modify these weights.
RUBRIC = """
Score the answer from 0 to 100 using this fixed rubric (do not deviate):
  - Content Accuracy        (0–30 pts): Is the answer factually correct and directly relevant to the question?
  - Depth & Detail          (0–25 pts): Does it provide sufficient explanation, context, and examples?
  - Structure & Clarity     (0–25 pts): Is it logically organised and easy to follow?
  - Professional Communication (0–20 pts): Is the language concise, professional, and appropriate?
Sum the four category scores for the total (0–100).
""".strip()


def evaluate_answer(question_obj, answer_text: str) -> dict:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    prompt = f"""You are an expert interview coach. Evaluate the following spoken answer.

Question: {question_obj.question}
Category: {question_obj.category} | Subcategory: {question_obj.subcategory} | Difficulty: {question_obj.difficulty}
Answer: {answer_text}

{RUBRIC}

Return a JSON object with exactly these three keys:
- "score": integer from 0 to 100
- "strengths": list of strings (specific things done well)
- "weaknesses": list of strings (specific areas for improvement)"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "user", "content": prompt},
            ],
        )
        result = json.loads(response.choices[0].message.content)
        score = int(result.get("score", 0))
        score = max(0, min(100, score))  # clamp to valid range
        return {
            "score": score,
            "strengths": result.get("strengths", []),
            "weaknesses": result.get("weaknesses", []),
        }
    except OpenAIError as e:
        raise ValueError(f"OpenAI evaluation failed: {e}") from e
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
        raise ValueError(f"Failed to parse OpenAI response: {e}") from e
