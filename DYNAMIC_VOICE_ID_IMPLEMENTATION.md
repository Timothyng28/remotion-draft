# Dynamic Voice ID Implementation

## Summary
Updated the entire codebase to use dynamically selected voice IDs instead of hardcoded values. Now all hardcoded instances of the default voice use the voice selected by the user in the landing page.

## Problem
The default voice ID was hardcoded in 29 locations across the codebase, including:
- LLM prompts that generate Manim code
- Code fixing/patching utilities
- Error messages and repair prompts
- Default parameters in service initializations

This meant that even when a user selected a different voice, some parts of the system would still use the default male voice.

## Solution
Made the voice ID dynamic throughout the entire pipeline by:
1. Passing `voice_id` parameter through all generation and rendering functions
2. Updating prompts and code utilities to use the selected voice
3. Updating error messages and repair logic to reference the correct voice
4. Ensuring fallback services also use the selected voice

## Files Modified

### Backend - Core Services

#### 1. `backend/modal/services/prompts.py`
- **Changes:**
  - Renamed `ELEVENLABS_VOICE_ID` to `ELEVENLABS_VOICE_ID_DEFAULT`
  - Updated `get_tts_initialization_code()` to accept optional `voice_id` parameter
  - Updated `get_manim_prompt()` to accept optional `voice_id` parameter and pass it through
  - Changed hardcoded voice ID reference in MANIM_META_PROMPT to generic instruction
- **Impact:** LLM-generated code now uses the selected voice

#### 2. `backend/modal/services/code_utils.py`
- **Changes:**
  - Updated `remove_transcription_params()` to accept optional `voice_id` parameter
  - Updated all regex replacements to use the selected voice ID
  - Updated `clean_manim_code()` to accept and pass `voice_id`
  - Updated `apply_all_manual_fixes()` to accept `voice_id` parameter
- **Impact:** Code fixing and patching now uses the correct voice ID

#### 3. `backend/modal/services/tts/pregenerated.py`
- **Changes:**
  - Updated `PreGeneratedAudioService.__init__()` to accept optional `voice_id` parameter
  - Fallback ElevenLabsService now uses the selected voice ID
- **Impact:** Fallback TTS generation uses the correct voice

### Backend - Dev Environment

#### 4. `backend/modal/dev/generator_logic.py`
- **Changes:**
  - Updated `generate_educational_video_logic()` signature to accept `voice_id` parameter
  - Pass `voice_id` to `get_manim_prompt()` when generating prompts (1 location)
  - Pass `voice_id` to `clean_manim_code()` and `apply_all_manual_fixes()` (3 locations each)
  - Pass `voice_id` to `render_single_scene_fn.spawn()` when spawning render containers
- **Impact:** All code generation and rendering uses the selected voice

#### 5. `backend/modal/dev/renderer.py`
- **Changes:**
  - Updated `render_single_scene_logic()` signature to accept `voice_id` parameter
  - Pass `voice_id` to `clean_manim_code()` and `apply_all_manual_fixes()` (2 locations each)
  - Updated error analysis to use selected voice ID in error messages
  - Updated repair prompts to reference the correct voice ID
- **Impact:** Scene rendering and error repair uses the selected voice

#### 6. `backend/modal/main_video_generator_dev_modular.py`
- **Changes:**
  - Updated `render_single_scene()` Modal function to accept `voice_id` parameter
  - Updated `generate_educational_video()` Modal function to accept `voice_id` parameter
  - Pass `voice_id` through to logic functions
- **Impact:** Modal functions now support voice selection

#### 7. `backend/modal/dev/api_logic.py`
- **Changes:**
  - Extract `voice_id` from request body
  - Pass `voice_id` to `generate_educational_video_fn.remote_gen()`
  - Added logging for received voice ID
- **Impact:** API endpoint now accepts and uses voice_id parameter

### Frontend

#### 8. `frontend/src/services/llmService.ts`
- **Changes:**
  - Updated `buildSegmentPrompt()` to read voice ID from context
  - Updated hardcoded voice ID reference in prompt to generic instruction
- **Impact:** Frontend-generated prompts (if used) now use the correct voice

## Call Chain

Here's how the voice ID flows through the system:

1. **User Selection** → Landing Page → App Component → VideoController
   ```
   User selects voice → voice_id = "3qdetrzoUbrHyBEgSqsF" (example: Lui Leng)
   ```

2. **Video Generation Request** → Backend API
   ```
   Frontend: generateVideoScenes(topic, onProgress, voice_id)
   Backend: generate_video_api_logic(item) extracts voice_id
   ```

3. **Modal Function** → Generator Logic
   ```
   generate_educational_video(prompt, ..., voice_id)
   → generate_educational_video_logic(prompt, ..., voice_id)
   ```

4. **Code Generation** → LLM Prompts
   ```
   get_manim_prompt(voice_id)
   → get_tts_initialization_code(voice_id)
   → Generated code contains: ElevenLabsTimedService(voice_id="3qdetrzoUbrHyBEgSqsF")
   ```

5. **Code Fixing** → Utilities
   ```
   clean_manim_code(code, voice_id)
   → remove_transcription_params(code, voice_id)
   → Replaces any incorrect voice IDs with selected one
   ```

6. **TTS Generation** → ElevenLabs
   ```
   ElevenLabsTimedService(voice_id="3qdetrzoUbrHyBEgSqsF")
   → Generates audio with selected voice
   ```

7. **Scene Rendering** → Manim
   ```
   render_single_scene_logic(section_num, code, work_dir, job_id, voice_id)
   → clean_manim_code(code, voice_id)
   → Rendered video has correct voiceover
   ```

## Default Behavior

When `voice_id` is not provided or is `None`:
- Default: `"K80wneyktrw2rE11kA2W"` (Ewen voice)
- This ensures backward compatibility with existing code

## Testing

To verify the implementation:

1. **Select Female Voice:**
   - Open landing page
   - Click "🎤 Female Voice" button
   - Generate a video
   - Verify voiceover uses female voice

2. **Select Male Voice (Default):**
   - Open landing page
   - Click "🎙️ Male Voice" button (or don't change from default)
   - Generate a video
   - Verify voiceover uses male voice

3. **Check Generated Code:**
   - Look at backend logs during generation
   - Verify log line shows selected voice ID
   - Verify generated Manim code contains correct voice_id

4. **Test Error Repair:**
   - Intentionally cause a rendering error
   - Verify repair prompts reference the correct voice ID

## Voice IDs

- **Ewen (Default)**: `K80wneyktrw2rE11kA2W`
- **Lui Leng**: `3qdetrzoUbrHyBEgSqsF`
- **Ming Jun**: `UegrLZyjnJFv8l6OQkYO`
- **Timothy**: `7Sq89C8p7zNMCiILWbMA`
- **Peter Griffin**: `lb0GqmO0jSR60T0eQdIc`
- **3Blue1Brown**: `ngeTUXucUwpDZ8yZi8OV`

## Deployment

After deployment:
1. Existing videos with cached sessions will continue using their original voice
2. New video generations will use the selected voice
3. No database migrations or configuration changes required
4. ElevenLabs API automatically supports both voice IDs

## Locations Updated

Total hardcoded voice ID references updated: **29 locations** across **8 files**

### By File Type:
- **Backend Services**: 3 files (prompts.py, code_utils.py, pregenerated.py)
- **Backend Dev**: 3 files (generator_logic.py, renderer.py, api_logic.py)
- **Backend Modal**: 1 file (main_video_generator_dev_modular.py)
- **Frontend**: 1 file (llmService.ts)
- **Documentation**: 2 files (kept for reference, not updated)

### By Context:
- **Function parameters**: 8 functions updated
- **LLM prompts**: 4 prompts updated
- **Code fixing regex**: 7 patterns updated
- **Error messages**: 3 messages updated
- **Default values**: 4 defaults updated
- **Logging**: 3 log statements updated

## Benefits

1. **Full Voice Control**: Users can now select any supported voice and it will be used throughout the entire generation pipeline
2. **Consistency**: All parts of the system use the same voice ID
3. **Maintainability**: Easy to add more voice options in the future
4. **Debugging**: Voice ID is logged throughout the pipeline for troubleshooting
5. **Backward Compatible**: System still works with default voice when not specified

## Future Enhancements

Potential improvements:
1. Add more voice options (different languages, accents, etc.)
2. Allow per-segment voice selection
3. Add voice preview/sample audio
4. Save voice preference in user profile
5. Add voice quality/speed settings

