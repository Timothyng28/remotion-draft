"""
xAI Grok LLM service implementation.
"""

import os
from typing import Any, Dict, List, Optional, Union

import requests

from .base import LLMMessage, LLMResponse, LLMService, LLMServiceError


class XAIService(LLMService):
    """
    xAI Grok LLM service implementation.

    Uses the OpenAI-compatible chat completions API provided by xAI.
    """

    def __init__(
        self,
        model: str = "grok-4-fast-reasoning",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        **kwargs: Any,
    ):
        super().__init__(model, **kwargs)

        self.api_key = (
            api_key
            or os.getenv("XAI_API_KEY")
            or os.getenv("xai-key")  # Modal secret format
        )
        if not self.api_key:
            raise LLMServiceError(
                "xAI API key required. Set XAI_API_KEY environment variable or pass api_key parameter."
            )

        self.base_url = base_url or os.getenv("XAI_API_BASE", "https://api.x.ai/v1")
        self.base_url = self.base_url.rstrip("/")  # Ensure no trailing slash

        # Lazy requests session for connection pooling
        self._session: Optional[requests.Session] = None

        print(f"✅ xAI Grok service initialized with model: {model}")

    @property
    def session(self) -> requests.Session:
        if self._session is None:
            self._session = requests.Session()
        return self._session

    def _prepare_messages(self, messages: List[LLMMessage]) -> List[Dict[str, Any]]:
        prepared: List[Dict[str, Any]] = []

        for msg in messages:
            content = msg.content
            if isinstance(content, str):
                prepared.append({"role": msg.role, "content": content})
                continue

            # Multimodal content handling (convert images to text markers)
            text_parts: List[str] = []
            has_images = False

            for block in content:
                if block.get("type") == "text":
                    text_parts.append(block.get("text", ""))
                elif block.get("type") == "image":
                    has_images = True
                    source = block.get("source", {})
                    image_data = source.get("data", "")
                    media_type = source.get("media_type", "image/unknown")
                    truncated = (
                        f"{image_data[:100]}..." if image_data and len(image_data) > 100 else image_data
                    )
                    text_parts.append(
                        f"\n[IMAGE PROVIDED - {media_type} - base64 data: {truncated}]\n"
                    )

            if has_images:
                print(
                    "⚠️  xAI Grok does not support direct vision inputs. Image provided as base64 marker."
                )

            prepared.append(
                {
                    "role": msg.role,
                    "content": " ".join(text_parts).strip(),
                }
            )

        return prepared

    @staticmethod
    def _normalize_content(content: Union[str, List[Dict[str, Any]]]) -> str:
        if isinstance(content, str):
            return content

        text_parts: List[str] = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                text_parts.append(block.get("text", ""))
        return " ".join(text_parts).strip()

    def _request_chat_completion(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            response = self.session.post(url, json=payload, headers=headers, timeout=120)
        except requests.RequestException as exc:
            raise LLMServiceError(f"xAI API request failed: {exc}") from exc

        if response.status_code >= 400:
            try:
                error_payload = response.json()
            except ValueError:
                error_payload = response.text
            raise LLMServiceError(
                f"xAI API error ({response.status_code}): {error_payload}"
            )

        try:
            return response.json()
        except ValueError as exc:
            raise LLMServiceError("xAI API returned invalid JSON") from exc

    def generate(
        self,
        messages: List[LLMMessage],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs: Any,
    ) -> LLMResponse:
        max_tokens = max_tokens or self.default_max_tokens
        temperature = temperature if temperature is not None else self.default_temperature

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": self._prepare_messages(messages),
            "temperature": temperature,
        }

        if max_tokens is not None:
            payload["max_tokens"] = max_tokens

        payload.update(kwargs)

        print(f"🤖 Calling xAI Grok API with model: {self.model}")
        print(f"   Max tokens: {max_tokens}, Temperature: {temperature}")

        data = self._request_chat_completion(payload)

        choices = data.get("choices", [])
        if not choices:
            raise LLMServiceError("xAI API returned no choices")

        first_choice = choices[0]
        message = first_choice.get("message", {})
        content = self._normalize_content(message.get("content", ""))

        usage = data.get("usage", {}) or {}
        usage.setdefault("input_tokens", usage.get("prompt_tokens", 0))
        usage.setdefault("output_tokens", usage.get("completion_tokens", 0))
        total_tokens = usage.get("total_tokens")
        if total_tokens is None:
            usage["total_tokens"] = (
                usage.get("input_tokens", 0) + usage.get("output_tokens", 0)
            )

        # Pricing details are not publicly available; set cost to 0.0 placeholder
        usage.setdefault("cost", 0.0)

        finish_reason = first_choice.get("finish_reason")

        return LLMResponse(
            content=content,
            model=data.get("model", self.model),
            usage=usage,
            finish_reason=finish_reason,
            metadata={"provider": "xai"},
        )

    def generate_simple(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        image_data: Optional[str] = None,
        **kwargs: Any,
    ) -> str:
        messages: List[LLMMessage] = []

        if system_prompt:
            messages.append(LLMMessage(role="system", content=system_prompt))

        if image_data:
            from .base import create_image_content_block, create_text_content_block

            content_blocks = [create_text_content_block(prompt)]
            content_blocks.append(create_image_content_block(image_data))
            messages.append(LLMMessage(role="user", content=content_blocks))
        else:
            messages.append(LLMMessage(role="user", content=prompt))

        response = self.generate(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            **kwargs,
        )
        return response.content

    async def generate_async(
        self,
        messages: List[LLMMessage],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs: Any,
    ) -> LLMResponse:
        import asyncio

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: self.generate(
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                **kwargs,
            ),
        )

    async def generate_simple_async(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        image_data: Optional[str] = None,
        **kwargs: Any,
    ) -> str:
        messages: List[LLMMessage] = []

        if system_prompt:
            messages.append(LLMMessage(role="system", content=system_prompt))

        if image_data:
            from .base import create_image_content_block, create_text_content_block

            content_blocks = [create_text_content_block(prompt)]
            content_blocks.append(create_image_content_block(image_data))
            messages.append(LLMMessage(role="user", content=content_blocks))
        else:
            messages.append(LLMMessage(role="user", content=prompt))

        response = await self.generate_async(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            **kwargs,
        )

        return response.content

    def get_provider_name(self) -> str:
        return "xai"

    def validate_api_key(self) -> bool:
        try:
            test_message = [LLMMessage(role="user", content="ping")]
            self.generate(messages=test_message, max_tokens=10, temperature=0.0)
            return True
        except LLMServiceError:
            return False


