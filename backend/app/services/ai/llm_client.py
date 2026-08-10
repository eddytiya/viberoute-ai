import json
from functools import lru_cache

from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from app.core.config import get_settings
from app.core.exceptions import LLMQuotaExceededError
from app.services.ai import quota_tracker


@lru_cache
def get_genai_client() -> genai.Client:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set in backend/.env")
    return genai.Client(api_key=settings.gemini_api_key)


@lru_cache
def get_openai_client():
    from openai import OpenAI

    return OpenAI(api_key=get_settings().openai_api_key)


@lru_cache
def get_anthropic_client():
    from anthropic import Anthropic

    return Anthropic(api_key=get_settings().anthropic_api_key)


def _fallback_provider() -> str | None:
    settings = get_settings()
    if settings.openai_api_key:
        return "openai"
    if settings.anthropic_api_key:
        return "anthropic"
    return None


def generate_text(prompt: str, system_instruction: str | None = None) -> str:
    settings = get_settings()
    client = get_genai_client()
    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(system_instruction=system_instruction) if system_instruction else None,
        )
        quota_tracker.record_gemini_call()
        return response.text or ""
    except genai_errors.ClientError as exc:
        if exc.code != 429:
            raise
        provider = _fallback_provider()
        if provider == "openai":
            return _generate_text_openai(prompt, system_instruction)
        if provider == "anthropic":
            return _generate_text_anthropic(prompt, system_instruction)
        raise LLMQuotaExceededError() from exc


def generate_json(prompt: str, response_schema: type, system_instruction: str | None = None):
    settings = get_settings()
    client = get_genai_client()
    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=response_schema,
            ),
        )
        quota_tracker.record_gemini_call()
        return response.parsed
    except genai_errors.ClientError as exc:
        if exc.code != 429:
            raise
        provider = _fallback_provider()
        if provider == "openai":
            return _generate_json_openai(prompt, response_schema, system_instruction)
        if provider == "anthropic":
            return _generate_json_anthropic(prompt, response_schema, system_instruction)
        raise LLMQuotaExceededError() from exc


def _generate_text_openai(prompt: str, system_instruction: str | None) -> str:
    settings = get_settings()
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})
    response = get_openai_client().chat.completions.create(model=settings.openai_model, messages=messages)
    return response.choices[0].message.content or ""


def _generate_json_openai(prompt: str, response_schema: type, system_instruction: str | None):
    settings = get_settings()
    schema_hint = json.dumps(response_schema.model_json_schema())
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append(
        {
            "role": "user",
            "content": f"{prompt}\n\nRespond with ONLY valid JSON matching this schema:\n{schema_hint}",
        }
    )
    response = get_openai_client().chat.completions.create(
        model=settings.openai_model,
        messages=messages,
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content or "{}"
    return response_schema.model_validate_json(content)


def _generate_text_anthropic(prompt: str, system_instruction: str | None) -> str:
    settings = get_settings()
    response = get_anthropic_client().messages.create(
        model=settings.anthropic_model,
        max_tokens=2048,
        system=system_instruction or "",
        messages=[{"role": "user", "content": prompt}],
    )
    return "".join(block.text for block in response.content if block.type == "text")


def _generate_json_anthropic(prompt: str, response_schema: type, system_instruction: str | None):
    settings = get_settings()
    schema_hint = json.dumps(response_schema.model_json_schema())
    full_prompt = (
        f"{prompt}\n\nRespond with ONLY valid JSON matching this schema, no markdown fences, no commentary:\n{schema_hint}"
    )
    response = get_anthropic_client().messages.create(
        model=settings.anthropic_model,
        max_tokens=2048,
        system=system_instruction or "",
        messages=[{"role": "user", "content": full_prompt}],
    )
    content = "".join(block.text for block in response.content if block.type == "text").strip()
    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return response_schema.model_validate_json(content)
