# Voice Selection Feature Implementation

## Overview
Added female voice option to the video generation system with voice selection UI in the landing page.

## Voice IDs
- **Ewen (Default)**: `K80wneyktrw2rE11kA2W`
- **Lui Leng**: `3qdetrzoUbrHyBEgSqsF`
- **Ming Jun**: `UegrLZyjnJFv8l6OQkYO`
- **Timothy**: `7Sq89C8p7zNMCiILWbMA`
- **Peter Griffin**: `lb0GqmO0jSR60T0eQdIc`
- **3Blue1Brown**: `ngeTUXucUwpDZ8yZi8OV`

## Changes Made

### Frontend Changes

#### 1. Landing Page (`frontend/src/components/LandingPage.tsx`)
- Added voice selection state with default male voice
- Added voice selection UI with two buttons (Male Voice and Female Voice)
- Positioned voice selection **above** the test mode button
- Updated `onSubmit` callback to include selected `voiceId`
- Updated example topic clicks to pass selected voice

#### 2. App Component (`frontend/src/App.tsx`)
- Updated `handleTopicSubmit` to accept optional `voiceId` parameter
- Added `createVideoSession` import from VideoConfig
- Modified session creation to include `voiceId` in context

#### 3. Type Definitions (`frontend/src/types/VideoConfig.ts`)
- Added `voiceId?: string` field to `LearningContext` interface

#### 4. Video Render Service (`frontend/src/services/videoRenderService.ts`)
- Updated `generateVideoScenes` function signature to accept optional `voiceId` parameter
- Modified request body to include `voice_id` when provided
- Added logging for voice ID selection

#### 5. Video Controller (`frontend/src/controllers/VideoController.tsx`)
- Updated all 5 calls to `generateVideoScenes` to pass `session.context.voiceId`:
  - Initial segment generation
  - New topic generation
  - Question branch generation
  - Correct answer explanation
  - Adaptive topic generation

### Backend Changes

#### 1. API Logic (`backend/modal/dev/api_logic.py`)
- Updated request body documentation to include `voice_id` parameter
- Added `voice_id` extraction from request
- Added logging for received voice ID
- Updated `remote_gen` call to pass `voice_id` parameter

#### 2. Generator Logic (`backend/modal/dev/generator_logic.py`)
- Updated `generate_educational_video_logic` function signature to accept optional `voice_id` parameter
- Modified TTS service initialization to use provided `voice_id` or default to male voice
- Added logging for selected voice ID

#### 3. Main Modal Function (`backend/modal/main_video_generator_dev_modular.py`)
- Updated `generate_educational_video` function signature to accept optional `voice_id` parameter
- Updated function documentation
- Modified call to `generate_educational_video_logic` to pass `voice_id`

## User Experience

### Voice Selection UI
The voice selection appears on the landing page:
1. Located between example topics and test mode button
2. Two clearly labeled buttons: "🎙️ Male Voice" and "🎤 Female Voice"
3. Selected voice is highlighted with blue background
4. Default selection is male voice

### Voice Persistence
- Selected voice is used for all video segments in a session
- Voice setting is passed through the entire video generation pipeline
- Backend logs the selected voice ID for debugging

## API Changes

The Modal API endpoint now accepts an additional optional parameter:

```json
{
  "topic": "Your topic here",
  "voice_id": "3qdetrzoUbrHyBEgSqsF"  // Optional (example: Lui Leng)
}
```

If `voice_id` is not provided, the system defaults to Ewen's voice (`K80wneyktrw2rE11kA2W`).

## Testing

To test the feature:
1. Open the application landing page
2. Select either Male or Female voice
3. Enter a topic and generate a video
4. Verify the voiceover uses the selected voice

## Deployment Notes

After deployment to Modal, the API will automatically support the new `voice_id` parameter. No additional configuration is required as the ElevenLabs API key is already configured via Modal secrets.

