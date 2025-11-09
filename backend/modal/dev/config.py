"""
Configuration and constants for dev environment video generator
"""

# LLM Configuration
TEMP = 0.3
MAX_TOKENS = 16000
# CODE_GEN_PROVIDER controls text-only code generation priority.
# Supported values (comma-separated list allowed):
#   - "grok" (default) → xAI Grok `grok-code-fast-1`
#   - "claude"        → Anthropic Claude Sonnet 4.5
#   - "cerebras"      → Cerebras Qwen 3.235B

# Rendering Configuration
MAX_RENDER_ATTEMPTS = 2
RENDER_TIMEOUT = 600  # seconds (10 minutes)
RENDER_MEMORY = 8192  # MB (8GB)
RENDER_CPU = 4.0

# Main Pipeline Configuration
MAIN_TIMEOUT = 3600  # seconds (1 hour)
MAIN_MEMORY = 8192  # MB (8GB)
MAIN_CPU = 4.0

# Modal Configuration
APP_NAME = "main-video-generator-dev"
VOLUME_NAME = "video-outputs-main-dev"

# Secrets Configuration
RENDER_SECRETS = [
    "anthropic-key",  # For code repair
    "elevenlabs-key",  # For TTS
    "cerebras-key",  # For Cerebras LLM
    "xai-key",  # For xAI Grok LLM
    "gcp-credentials",  # For GCS uploads (contains GCP_SERVICE_ACCOUNT_JSON)
    "google-api-key",  # For Gemini embeddings
    "embedding-provider",  # Optional override for embedding provider
    "code-gen-config",  # Code generation provider selection (grok/claude/cerebras)
    "planning-config",  # Planning LLM provider selection (cerebras/xai)
]

MAIN_SECRETS = [
    "anthropic-key",
    "elevenlabs-key",
    "cerebras-key",  # For Cerebras LLM
    "xai-key",  # For xAI Grok LLM
    "gcp-credentials",  # For GCS uploads (contains GCP_SERVICE_ACCOUNT_JSON)
    "google-api-key",  # For Gemini embeddings
    "embedding-provider",  # Optional override for embedding provider
    "code-gen-config",  # Code generation provider selection (grok/claude/cerebras)
    "planning-config",  # Planning LLM provider selection (cerebras/xai)
]
