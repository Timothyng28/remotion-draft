"""
Reflection questions generation logic (pure Python).

This module contains the business logic for generating personalized reflection
questions based on a completed learning session using Claude.
"""

import json
from typing import Dict, List, Any


def generate_reflection_questions_logic(session_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate reflection questions tailored to the completed lesson.
    
    Args:
        session_data: Dictionary containing:
            - topic: Main topic covered
            - segments: List of segment summaries
            - depth: Learning depth
            - historyTopics: Topics covered in session
    
    Returns:
        Dictionary with success status and questions array
    """
    from services.llm import AnthropicClaudeService
    
    try:
        # Initialize Claude service
        llm = AnthropicClaudeService()
        
        # Build the prompt
        prompt = build_reflection_prompt(session_data)
        
        # Generate questions using Claude
        response_text = llm.generate_simple(
            prompt=prompt,
            max_tokens=1024,
            temperature=0.7
        )
        
        # Parse JSON response
        cleaned = clean_json_response(response_text)
        parsed = json.loads(cleaned)
        
        # Extract and validate questions
        raw_questions = parsed.get('questions', [])
        if not isinstance(raw_questions, list):
            raw_questions = []
        
        questions = []
        for idx, q in enumerate(raw_questions):
            if isinstance(q, dict) and 'prompt' in q:
                questions.append({
                    'id': q.get('id', f'reflection-{idx + 1}'),
                    'prompt': q['prompt'],
                    'placeholder': q.get('placeholder', '')
                })
        
        if not questions:
            return {
                'success': False,
                'error': 'No valid questions generated'
            }
        
        return {
            'success': True,
            'questions': questions
        }
        
    except Exception as e:
        print(f"❌ Error generating reflection questions: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def build_reflection_prompt(session_data: Dict[str, Any]) -> str:
    """Build the prompt for generating reflection questions."""
    
    topic = session_data.get('topic', 'Unknown topic')
    segments = session_data.get('segments', [])
    history_topics = session_data.get('historyTopics', [])
    
    # Build segment summary
    segment_summary = "\n".join([
        f"- {seg.get('topic', 'Untitled')}"
        for seg in segments
    ])
    
    return f"""You are an expert educator creating personalized reflection questions for a student who just completed a lesson.

LESSON SUMMARY:
Main Topic: {topic}
Segments Covered:
{segment_summary}

Topics Explored: {', '.join(history_topics) if history_topics else 'N/A'}

Generate exactly 3 thoughtful reflection questions that:
1. Help the student consolidate their understanding of {topic}
2. Encourage them to think about practical applications
3. Identify areas where they might need more clarification
4. Are specific to the content covered (not generic)

Each question should be open-ended and encourage thoughtful responses.

RESPONSE FORMAT (JSON only, no markdown):
{{
  "questions": [
    {{
      "id": "key-takeaway",
      "prompt": "What is the single most important concept you learned about {topic}?",
      "placeholder": "Describe the core idea in your own words..."
    }},
    {{
      "id": "application",
      "prompt": "How would you apply this knowledge in a real-world scenario?",
      "placeholder": "Share a specific example or use case..."
    }},
    {{
      "id": "clarification",
      "prompt": "What aspect of {topic} would you like to explore further?",
      "placeholder": "Ask about anything that's still unclear..."
    }}
  ]
}}

Generate the reflection questions now:"""


def generate_closing_question_logic(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a single closing question based on the narrated lesson and learner inputs.
    """
    from services.llm import AnthropicClaudeService

    try:
        llm = AnthropicClaudeService()

        prompt = build_closing_question_prompt(request_data)

        response_text = llm.generate_simple(
            prompt=prompt,
            max_tokens=512,
            temperature=0.6
        )

        cleaned = clean_json_response(response_text)
        parsed = json.loads(cleaned)

        question = parsed.get('closing_question') or parsed.get('question')

        if isinstance(question, str) and question.strip():
            return {
                'success': True,
                'question': question.strip()
            }

        return {
            'success': False,
            'error': 'No closing question generated'
        }

    except Exception as e:
        print(f"❌ Error generating closing question: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def build_closing_question_prompt(request_data: Dict[str, Any]) -> str:
    """Build the prompt that asks Claude for a single closing question."""

    topic = request_data.get('topic') or request_data.get('session_topic') or 'the lesson topic'

    voiceover_sections = request_data.get('voiceover_sections') or request_data.get('section_scripts') or []
    if isinstance(voiceover_sections, dict):
        # Allow passing a dict of section -> script
        voiceover_sections = [
            {'section': key, 'script': value}
            for key, value in voiceover_sections.items()
        ]

    narration_lines = []
    for entry in voiceover_sections:
        script = entry.get('script') if isinstance(entry, dict) else None
        section_label = entry.get('section') if isinstance(entry, dict) else None
        if script and isinstance(script, str):
            truncated = " ".join(script.split())
            if truncated:
                if section_label is not None:
                    narration_lines.append(f"Section {section_label}: {truncated}")
                else:
                    narration_lines.append(truncated)

    narration_summary = "\n".join(narration_lines) if narration_lines else "N/A"

    learner_responses = request_data.get('user_responses') or request_data.get('responses') or []
    learner_lines = []
    for idx, entry in enumerate(learner_responses, 1):
        if isinstance(entry, dict):
            prompt = entry.get('prompt') or entry.get('question') or f"Prompt {idx}"
            answer = entry.get('answer') or entry.get('response')
            if answer:
                learner_lines.append(f"{prompt}: {answer}")
        elif isinstance(entry, str):
            learner_lines.append(f"Response {idx}: {entry}")

    learner_summary = "\n".join(learner_lines) if learner_lines else "No learner responses recorded."

    optional_summary = request_data.get('summary') or request_data.get('session_summary') or ''

    return f"""You are an expert instructional designer crafting the final reflective question for a short educational video.

LESSON TOPIC:
{topic}

VOICEOVER NARRATION (chronological order):
{narration_summary}

LEARNER RESPONSES:
{learner_summary}

ADDITIONAL CONTEXT:
{optional_summary if optional_summary else 'N/A'}

Goal: Create exactly ONE thoughtful, open-ended question that helps the learner synthesize what they heard in the narration and what they expressed in their responses. The question should:
- Tie directly to the core ideas from the narration and, when possible, reference the learner's responses.
- Encourage forward-looking reflection (application, extension, or self-evaluation) without requiring additional resources.
- Sound natural when spoken aloud.
- Avoid yes/no phrasing and avoid stacking multiple questions in one sentence.

RESPONSE FORMAT (strict JSON, no markdown):
{{
  "closing_question": "Your single question here"
}}

Generate the JSON now."""


def clean_json_response(response: str) -> str:
    """Clean JSON response from LLM output."""
    cleaned = response.strip()
    
    # Remove markdown code blocks
    if cleaned.startswith('```json'):
        cleaned = cleaned[7:]
    elif cleaned.startswith('```'):
        cleaned = cleaned[3:]
    
    if cleaned.endswith('```'):
        cleaned = cleaned[:-3]
    
    return cleaned.strip()

