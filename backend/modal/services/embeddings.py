"""
Embedding Service

Provides text embedding functionality using sentence-transformers.
Uses all-MiniLM-L6-v2 model for fast, high-quality semantic embeddings.
"""

import os
from typing import List, Optional

import numpy as np


class EmbeddingService:
    """
    Service for generating text embeddings using sentence-transformers.
    
    Uses all-MiniLM-L6-v2 model:
    - 384-dimensional embeddings
    - Fast inference
    - Good quality for semantic search
    """
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        """
        Initialize the embedding service.
        
        Args:
            model_name: HuggingFace model identifier
        """
        self.model_name = model_name
        self._model = None
    
    def _load_model(self):
        """Lazy load the model on first use."""
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                print(f"Loading embedding model: {self.model_name}")
                self._model = SentenceTransformer(self.model_name)
                print("Embedding model loaded successfully")
            except ImportError:
                raise ImportError(
                    "sentence-transformers not installed. "
                    "Install with: pip install sentence-transformers"
                )
    
    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.
        
        Args:
            text: Text to embed
            
        Returns:
            List of floats representing the embedding (384 dimensions)
        """
        self._load_model()
        
        # Generate embedding
        embedding = self._model.encode(text, convert_to_numpy=True)
        
        # Normalize to unit length (for cosine similarity via dot product)
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
        
        return embedding.tolist()
    
    def embed_batch(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """
        Generate embeddings for multiple texts efficiently.
        
        Args:
            texts: List of texts to embed
            batch_size: Batch size for processing
            
        Returns:
            List of embeddings, one per input text
        """
        self._load_model()
        
        if not texts:
            return []
        
        # Generate embeddings in batch
        embeddings = self._model.encode(
            texts,
            batch_size=batch_size,
            convert_to_numpy=True,
            show_progress_bar=False
        )
        
        # Normalize all embeddings to unit length
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1  # Avoid division by zero
        embeddings = embeddings / norms
        
        return embeddings.tolist()


def cosine_similarity(embedding1: List[float], embedding2: List[float]) -> float:
    """
    Compute cosine similarity between two embeddings.
    
    Since embeddings are normalized, this is just the dot product.
    
    Args:
        embedding1: First embedding
        embedding2: Second embedding
        
    Returns:
        Similarity score between -1 and 1 (higher = more similar)
    """
    vec1 = np.array(embedding1)
    vec2 = np.array(embedding2)
    return float(np.dot(vec1, vec2))


def find_most_similar(
    query_embedding: List[float],
    embeddings: List[List[float]],
    top_k: int = 5
) -> List[tuple[int, float]]:
    """
    Find the most similar embeddings to a query.
    
    Args:
        query_embedding: Query embedding
        embeddings: List of embeddings to search
        top_k: Number of top results to return
        
    Returns:
        List of (index, similarity_score) tuples, sorted by similarity descending
    """
    query_vec = np.array(query_embedding)
    embeddings_array = np.array(embeddings)
    
    # Compute similarities (dot product since normalized)
    similarities = np.dot(embeddings_array, query_vec)
    
    # Get top-k indices
    top_indices = np.argsort(similarities)[::-1][:top_k]
    
    # Return (index, score) pairs
    results = [(int(idx), float(similarities[idx])) for idx in top_indices]
    
    return results

