"""
Text-to-Speech Services for Manim Pipeline
ElevenLabs TTS service and Pre-generated audio service
"""

from .elevenlabs import ElevenLabsTimedService
from .pregenerated import PreGeneratedAudioService

__all__ = [
    'ElevenLabsTimedService',
    'PreGeneratedAudioService'
]
