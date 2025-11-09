"""
Description Generation Logic

Pure Python logic for generating concise descriptions from video segment metadata.
Used for semantic search indexing.
"""

from typing import Optional

from services.llm.factory import create_llm_service


def generate_description_logic(
    topic: str,
    title: Optional[str] = None,
    voiceover_script: Optional[str] = None
) -> dict:
    """
    Generate a concise 1-2 sentence description from segment metadata.
    
    Args:
        topic: The topic of the video segment
        title: Optional title of the segment
        voiceover_script: Optional voiceover script (will be truncated if long)
        
    Returns:
        Dictionary with success, description, and optional error
    """
    try:
        # Build context from available metadata
        context_parts = [f"Topic: {topic}"]
        
        if title and title != topic:
            context_parts.append(f"Title: {title}")
        
        if voiceover_script:
            # Truncate long scripts to first 500 characters
            script_preview = voiceover_script[:500]
            if len(voiceover_script) > 500:
                script_preview += "..."
            context_parts.append(f"Content preview: {script_preview}")
        
        context = "\n".join(context_parts)
        
        # Create prompt for description generation
        prompt = f"""Generate a concise, searchable description (1-2 sentences) for this educational video segment.

{context}

The description should:
- Capture the main concept or learning objective
- Be useful for semantic search
- Be clear and specific
- Not exceed 2 sentences

Description:"""

        # Use LLM to generate description
        llm = create_llm_service()
        
        response = llm.generate(
            prompt=prompt,
            max_tokens=150,
            temperature=0.3  # Lower temperature for more focused output
        )
        
        description = response.strip()
        
        # Fallback if description is too short or missing
        if len(description) < 10:
            # Create a simple fallback description
            if title and title != topic:
                description = f"Educational content about {topic}: {title}"
            else:
                description = f"Educational video explaining {topic}"
        
        return {
            "success": True,
            "description": description
        }
        
    except Exception as e:
        print(f"Error generating description: {e}")
        
        # Return a basic fallback description
        fallback = f"Educational content about {topic}"
        if title and title != topic:
            fallback += f": {title}"
        
        return {
            "success": True,
            "description": fallback,
            "warning": f"Used fallback description due to error: {str(e)}"
        }

