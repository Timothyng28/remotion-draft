/**
 * videoRenderService.ts
 *
 * Service for generating videos via Modal backend.
 * This service handles communication with the Modal API using Server-Sent Events (SSE).
 */

import { VideoSegment } from "../types/VideoConfig";

export interface SectionVoiceover {
  section: number;
  script: string;
}

export interface SectionDetail {
  section: number;
  video_url: string;
  thumbnail_url?: string;
  title?: string;
  voiceover_script?: string;
}

/**
 * Progress update from the backend
 */
export interface GenerationProgress {
  status: "processing" | "completed" | "failed";
  stage?: number;
  stage_name?: string;
  progress_percentage?: number;
  message?: string;
  job_id?: string;
  sections?: string[]; // List of section video URLs (only in completion)
  section_details?: SectionDetail[];
  error?: string;
  metadata?: {
    prompt?: string;
    num_sections?: number;
    voiceover_scripts?: SectionVoiceover[];
  };
}

/**
 * Generate all video scenes for a topic using Modal backend
 * Returns a promise that resolves with all section URLs when complete
 */
export async function generateVideoScenes(
  topic: string,
  onProgress?: (progress: GenerationProgress) => void,
  voiceId?: string
): Promise<{
  success: boolean;
  sections?: string[];
  sectionDetails?: SectionDetail[];
  voiceoverScripts?: SectionVoiceover[];
  error?: string;
  jobId?: string;
}> {
  const modalEndpoint =
    "https://video-gen-2--main-video-generator-dev-generate-video-api.modal.run";

  try {
    console.log("Generating video scenes for topic:", topic);
    console.log("🎙️ Voice ID passed to backend:", voiceId || "NOT PROVIDED - WILL DEFAULT");

    const requestBody: { topic: string; voice_id?: string } = {
      topic: topic,
    };
    
    // Add voice_id if provided
    if (voiceId) {
      requestBody.voice_id = voiceId;
      console.log("✅ Voice ID added to request body:", voiceId);
    } else {
      console.warn("⚠️ No voice ID provided - backend will use default (Rachel)");
    }

    // Use XMLHttpRequest for better SSE streaming support (fetch has HTTP/2 issues)
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", modalEndpoint, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      
      let buffer = "";
      let finalSections: string[] | undefined;
      let jobId: string | undefined;
      let finalStatus: "processing" | "completed" | "failed" = "processing";
      let finalError: string | undefined;
      let finalSectionDetails: SectionDetail[] | undefined;
      let finalVoiceoverScripts: SectionVoiceover[] | undefined;

      xhr.onprogress = () => {
        // Process new data
        const newData = xhr.responseText.substring(buffer.length);
        buffer = xhr.responseText;
        
        // Split into lines and process SSE messages
        const lines = newData.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) as GenerationProgress;

              // Update progress
              if (data.job_id) {
                jobId = data.job_id;
              }

              if (data.status === "completed" && data.sections) {
                finalSections = data.sections;
                finalStatus = "completed";
              } else if (data.status === "failed") {
                finalStatus = "failed";
                finalError = data.error || "Generation failed";
              }

              if (data.section_details) {
                finalSectionDetails = data.section_details;
              }

              if (data.metadata?.voiceover_scripts) {
                finalVoiceoverScripts = data.metadata.voiceover_scripts;
              }

              // Call progress callback
              onProgress?.(data);
            } catch (parseError) {
              console.warn("Failed to parse SSE data:", line, parseError);
            }
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          if (finalStatus === "completed" && finalSections) {
            resolve({
              success: true,
              sections: finalSections,
              sectionDetails: finalSectionDetails,
              voiceoverScripts: finalVoiceoverScripts,
              jobId,
            });
          } else if (finalStatus === "failed") {
            resolve({
              success: false,
              error: finalError || "Generation failed",
              jobId,
            });
          } else {
            resolve({
              success: false,
              error: "Generation did not complete successfully",
              jobId,
            });
          }
        } else {
          resolve({
            success: false,
            error: `Request failed: ${xhr.status} ${xhr.statusText}`,
          });
        }
      };

      xhr.onerror = () => {
        resolve({
          success: false,
          error: "Network error occurred",
        });
      };

      xhr.send(JSON.stringify(requestBody));
    });
  } catch (error) {
    console.error("Video generation error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error occurred during generation",
    };
  }
}

/**
 * @deprecated Use generateVideoScenes instead
 * Legacy function kept for backward compatibility
 */
export async function renderManimVideo(
  _segment: VideoSegment
): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
  console.warn(
    "renderManimVideo is deprecated. Use generateVideoScenes instead."
  );
  return {
    success: false,
    error: "This function is deprecated. Use generateVideoScenes instead.",
  };
}

/**
 * @deprecated Status checking is no longer needed with SSE streaming
 */
export async function checkRenderingStatus(
  _segmentId: string
): Promise<{ status: string; videoUrl?: string; error?: string }> {
  console.warn(
    "checkRenderingStatus is deprecated. Progress is now handled via SSE in generateVideoScenes."
  );
  return {
    status: "failed",
    error:
      "This function is deprecated. Use generateVideoScenes with onProgress callback instead.",
  };
}
