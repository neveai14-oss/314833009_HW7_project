import json
import os
import re
import urllib.error
import urllib.request


SYSTEM_PROMPT = (
    "You are a visual prompt engineer. Convert the user's idea into a compact JSON "
    "art direction for a generative poster. Return only JSON with keys: title, "
    "palette, objects, mood, motion, prompt."
)


def _post_json(url, payload, headers=None, timeout=20):
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", **(headers or {})},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _extract_json(text):
    match = re.search(r"\{.*\}", text, flags=re.S)
    if not match:
        raise ValueError("No JSON object found in model output.")
    return json.loads(match.group(0))


def _from_ollama(user_prompt):
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "llama3.1")
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "stream": False,
        "format": "json",
    }
    result = _post_json(f"{base_url}/api/chat", payload)
    return _extract_json(result["message"]["content"])


def _from_openrouter(user_prompt):
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not set.")
    model = os.getenv("OPENROUTER_MODEL", "opencode/big-pickle")
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": {"type": "json_object"},
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Prompt-to-Flow Poster Studio",
    }
    result = _post_json("https://openrouter.ai/api/v1/chat/completions", payload, headers)
    return _extract_json(result["choices"][0]["message"]["content"])


def _fallback(user_prompt):
    words = re.findall(r"[A-Za-z0-9\u4e00-\u9fff]+", user_prompt)
    seed_words = words[:8] or ["dream", "flow", "poster"]
    title = " ".join(seed_words[:4]).title()
    joined = " ".join(seed_words)
    warm = any(token.lower() in joined.lower() for token in ["sun", "fire", "熱", "夏", "orange"])
    ocean = any(token.lower() in joined.lower() for token in ["sea", "ocean", "雨", "水", "blue"])
    if warm:
        palette = ["#f97316", "#fde047", "#7c2d12", "#fff7ed"]
        mood = "bright, kinetic, warm"
    elif ocean:
        palette = ["#0f766e", "#38bdf8", "#172554", "#ecfeff"]
        mood = "fluid, luminous, calm"
    else:
        palette = ["#111827", "#22c55e", "#f8fafc", "#f59e0b"]
        mood = "cinematic, experimental, crisp"
    return {
        "title": title,
        "palette": palette,
        "objects": seed_words,
        "mood": mood,
        "motion": "rectified flow particles converge from noise into semantic clusters",
        "prompt": (
            f"Create a generative poster about {user_prompt}. Use {mood} visual language, "
            "clean typography, and particles that move from random noise into structured forms."
        ),
        "source": "offline_fallback",
    }


def expand_prompt(user_prompt):
    provider = os.getenv("LLM_PROVIDER", "auto").lower()
    providers = ["ollama", "openrouter"] if provider == "auto" else [provider]
    errors = []
    for name in providers:
        try:
            if name == "ollama":
                result = _from_ollama(user_prompt)
            elif name == "openrouter":
                result = _from_openrouter(user_prompt)
            else:
                continue
            result["source"] = name
            return result
        except (urllib.error.URLError, TimeoutError, RuntimeError, KeyError, ValueError, json.JSONDecodeError) as exc:
            errors.append(f"{name}: {exc}")
    result = _fallback(user_prompt)
    result["provider_errors"] = errors
    return result
