"""
Base classes and data structures for LLM services
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Union


@dataclass
class LLMMessage:
    """
    Standard message format for LLM interactions.
    
    Content can be either:
    - str: Simple text message
    - List[Dict]: Content blocks for multimodal (text + images)
    
    Example multimodal content:
    [
        {"type": "text", "text": "What's in this image?"},
        {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": "iVBORw0KGgo..."
            }
        }
    ]
    """
    role: str  # "user", "assistant", "system"
    content: Union[str, List[Dict[str, Any]]]


@dataclass
class LLMResponse:
    """Standard response format from LLM services."""
    content: str
    model: str
    usage: Optional[Dict[str, Any]] = None
    finish_reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class LLMServiceError(Exception):
    """Base exception for LLM service errors."""
    pass


def create_image_content_block(base64_data: str, media_type: str = "image/png") -> Dict[str, Any]:
    """
    Helper function to create an image content block for multimodal messages.
    
    Args:
        base64_data: Base64-encoded image data (with or without data URI prefix)
        media_type: Image media type (image/png, image/jpeg, image/gif, image/webp)
    
    Returns:
        Dictionary representing an image content block
    """
    # Remove data URI prefix if present (e.g., "data:image/png;base64,")
    if base64_data.startswith("data:"):
        # Extract media type from data URI if present
        if ";base64," in base64_data:
            prefix = base64_data.split(";base64,")[0]
            if prefix.startswith("data:"):
                detected_media_type = prefix[5:]  # Remove "data:" prefix
                if detected_media_type.startswith("image/"):
                    media_type = detected_media_type
            base64_data = base64_data.split(";base64,")[1]
    
    return {
        "type": "image",
        "source": {
            "type": "base64",
            "media_type": media_type,
            "data": base64_data
        }
    }


def create_text_content_block(text: str) -> Dict[str, str]:
    """
    Helper function to create a text content block for multimodal messages.
    
    Args:
        text: Text content
    
    Returns:
        Dictionary representing a text content block
    """
    return {
        "type": "text",
        "text": text
    }


class LLMService(ABC):
    """
    Abstract base class for LLM services.
    Provides a unified interface for different LLM providers.
    """

    def __init__(self, model: str, **kwargs):
        self.model = model
        self.default_max_tokens = kwargs.get('max_tokens', 4000)
        self.default_temperature = kwargs.get('temperature', 0.3)

    @abstractmethod
    def generate(self,
                messages: List[LLMMessage],
                max_tokens: Optional[int] = None,
                temperature: Optional[float] = None,
                **kwargs) -> LLMResponse:
        """
        Generate a response from the LLM.

        Args:
            messages: List of messages (conversation history)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0-1)
            **kwargs: Provider-specific parameters

        Returns:
            LLMResponse with generated content
        """
        pass

    @abstractmethod
    def generate_simple(self,
                       prompt: str,
                       system_prompt: Optional[str] = None,
                       max_tokens: Optional[int] = None,
                       temperature: Optional[float] = None,
                       **kwargs) -> str:
        """
        Simple text-in, text-out generation.

        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            **kwargs: Provider-specific parameters

        Returns:
            Generated text content
        """
        pass

    @abstractmethod
    async def generate_async(self,
                            messages: List[LLMMessage],
                            max_tokens: Optional[int] = None,
                            temperature: Optional[float] = None,
                            **kwargs) -> LLMResponse:
        """
        Async version of generate().

        Args:
            messages: List of messages (conversation history)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0-1)
            **kwargs: Provider-specific parameters

        Returns:
            LLMResponse with generated content
        """
        pass

    @abstractmethod
    async def generate_simple_async(self,
                                    prompt: str,
                                    system_prompt: Optional[str] = None,
                                    max_tokens: Optional[int] = None,
                                    temperature: Optional[float] = None,
                                    **kwargs) -> str:
        """
        Async version of generate_simple().

        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            **kwargs: Provider-specific parameters

        Returns:
            Generated text content
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Return the name of the LLM provider."""
        pass

    def validate_api_key(self) -> bool:
        """Validate that the API key is properly configured."""
        return True  # Override in subclasses if needed
