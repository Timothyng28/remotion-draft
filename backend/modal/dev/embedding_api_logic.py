"""
Embedding API Logic

Pure Python logic for embedding endpoints.
"""

from typing import List, Optional

from services.embeddings import EmbeddingService


def embed_text_logic(text: str) -> dict:
    """
    Embed a single text string.
    
    Args:
        text: Text to embed
        
    Returns:
        Dictionary with success, embedding, and optional error
    """
    try:
        service = EmbeddingService()
        embedding = service.embed_text(text)
        
        return {
            "success": True,
            "embedding": embedding,
            "dimension": len(embedding)
        }
    except Exception as e:
        print(f"Error embedding text: {e}")
        return {
            "success": False,
            "error": str(e)
        }


def embed_batch_logic(texts: List[str], batch_size: int = 32) -> dict:
    """
    Embed multiple texts efficiently.
    
    Args:
        texts: List of texts to embed
        batch_size: Batch size for processing
        
    Returns:
        Dictionary with success, embeddings, and optional error
    """
    try:
        if not texts:
            return {
                "success": True,
                "embeddings": [],
                "count": 0
            }
        
        service = EmbeddingService()
        embeddings = service.embed_batch(texts, batch_size=batch_size)
        
        return {
            "success": True,
            "embeddings": embeddings,
            "count": len(embeddings),
            "dimension": len(embeddings[0]) if embeddings else 0
        }
    except Exception as e:
        print(f"Error embedding batch: {e}")
        return {
            "success": False,
            "error": str(e)
        }

