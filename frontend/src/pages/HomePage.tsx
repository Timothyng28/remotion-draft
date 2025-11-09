/**
 * HomePage.tsx
 *
 * Wrapper component for the landing page and learning flow.
 * This is the main page that handles topic submission and video learning.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClosingQuestionOverlay } from "../components/ClosingQuestionOverlay";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { InputOverlay } from "../components/InputOverlay";
import { LandingPage } from "../components/LandingPage";
import { LeafQuestionOverlay } from "../components/LeafQuestionOverlay";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { NodeCarousel } from "../components/NodeCarousel";
import { QuizQuestionOverlay } from "../components/QuizQuestionOverlay";
import { TreeExplorer } from "../components/TreeExplorer";
import { VideoController } from "../controllers/VideoController";
import {
  hasCachedSession,
  loadCachedSession,
} from "../services/cachedSessionService";
import { generateClosingQuestion } from "../services/llmService";
import {
  getAllNodes,
  getChildren,
  getNextNode,
  getPreviousNode,
  loadVideoSession,
  saveVideoSession,
} from "../types/TreeState";
import {
  ClosingQuestionPayload,
  VideoSession,
  createVideoSession,
} from "../types/VideoConfig";

/**
 * App state types
 */
type AppState = "landing" | "learning" | "error" | "closing";

interface PendingTopicRequest {
  id: string;
  topic: string;
  imageData?: string;
  imageFileName?: string;
}

/**
 * Home Page Component
 */
export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // App state machine
  const [appState, setAppState] = useState<AppState>("landing");
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Cached session from localStorage
  const [cachedSession, setCachedSession] = useState<VideoSession | null>(null);
  const [pendingTopicRequest, setPendingTopicRequest] =
    useState<PendingTopicRequest | null>(null);

  // Reference to the video element for programmatic control
  const videoRef = useRef<HTMLVideoElement>(null);
  const closingPayloadRef = useRef<ClosingQuestionPayload | null>(null);

  // Track when segment changes to restart playback
  const [segmentKey, setSegmentKey] = useState(0);

  // Closing question state
  const [closingQuestion, setClosingQuestion] = useState<string | null>(null);
  const [closingQuestionStatus, setClosingQuestionStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [closingQuestionError, setClosingQuestionError] = useState<string>("");
  const [closingQuestionAnswer, setClosingQuestionAnswer] =
    useState<string>("");

  const resetClosingQuestionState = useCallback(() => {
    setClosingQuestion(null);
    setClosingQuestionStatus("idle");
    setClosingQuestionError("");
    setClosingQuestionAnswer("");
    closingPayloadRef.current = null;
  }, []);

  // Leaf question state
  const [leafQuestion, setLeafQuestion] = useState<string | null>(null);
  const [leafQuestionStatus, setLeafQuestionStatus] = useState<
    | "idle"
    | "loading"
    | "ready"
    | "evaluating"
    | "correct"
    | "incorrect"
    | "error"
    | "generating_followup"
  >("idle");
  const [leafQuestionAnswer, setLeafQuestionAnswer] = useState<string>("");
  const [leafEvaluationReasoning, setLeafEvaluationReasoning] =
    useState<string>("");

  const resetLeafQuestionState = useCallback(() => {
    setLeafQuestion(null);
    setLeafQuestionStatus("idle");
    setLeafQuestionAnswer("");
    setLeafEvaluationReasoning("");
  }, []);

  // Tree explorer modal state
  const [showTreeExplorer, setShowTreeExplorer] = useState(false);

  // Auto-play toggle state (on by default)
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);

  // Track if user has seen a video (to prevent question overlay on initial mount)
  const [hasSeenFirstVideo, setHasSeenFirstVideo] = useState(false);

  // Track if follow-up videos are being generated (to prevent duplicate question overlay)
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);

  /**
   * Load cached session on mount (but don't navigate away from landing page)
   */
  useEffect(() => {
    const cached = loadVideoSession();
    if (cached && cached.tree.nodes.size > 0) {
      console.log("Loaded cached session from localStorage");
      console.log("Cached tree has", cached.tree.nodes.size, "nodes");
      console.log("Saved current node ID:", cached.tree.currentNodeId);

      // Validate the saved currentNodeId - only reset if it's invalid
      const isValidNode =
        cached.tree.currentNodeId &&
        cached.tree.nodes.has(cached.tree.currentNodeId);

      if (!isValidNode) {
        // Only reset to first root if currentNodeId is empty or invalid
        const rootIds = (cached.tree as any).rootIds || [];
        if (rootIds.length > 0) {
          console.log(
            "Invalid or missing currentNodeId, resetting to first root"
          );
          cached.tree.currentNodeId = rootIds[0];
        } else {
          console.error("No root nodes found in cached tree!");
          return; // Don't load corrupted session
        }
      } else {
        console.log(
          "Restoring user to saved position:",
          cached.tree.currentNodeId
        );
      }

      setCachedSession(cached);
      // Don't navigate - user stays on landing page by default
    }
  }, []);

  /**
   * Handle topic submission from landing page
   * Tries to load cached session first, then falls back to generating new session
   */
  const handleTopicSubmit = async (
    topic: string,
    voiceId?: string,
    imageData?: string,
    imageFileName?: string
  ) => {
    resetClosingQuestionState();
    resetLeafQuestionState();
    setHasSeenFirstVideo(false); // Reset video tracking for new session

    // Determine cache key and final topic
    // Cache key strategy:
    // - Text only → cache key = text
    // - Image only → cache key = filename
    // - Text + Image → cache key = text + filename (both affect result)
    const hasText = topic.trim().length > 0;
    const hasImage = !!imageData;
    const isImageOnly = hasImage && !hasText;

    // Generate cache key
    let cacheKey = topic;
    if (isImageOnly && imageFileName) {
      // Image only: use filename as cache key
      cacheKey = imageFileName;
    } else if (hasText && hasImage && imageFileName) {
      // Text + Image: combine both for cache key
      cacheKey = `${topic}__${imageFileName}`;
    }

    // Set final topic for display (and for backend prompt if image-only)
    const finalTopic = hasText
      ? topic
      : isImageOnly
      ? "Explain this image"
      : topic;

    const existingSession = cachedSession ?? loadVideoSession();

    if (existingSession && existingSession.tree.nodes.size > 0) {
      let sessionToUse: VideoSession = existingSession;

      if (voiceId && (existingSession.context as any).voiceId !== voiceId) {
        sessionToUse = {
          ...existingSession,
          context: {
            ...existingSession.context,
            voiceId,
          } as any,
        };
      }

      if (!cachedSession || sessionToUse !== cachedSession) {
        setCachedSession(sessionToUse);
        saveVideoSession(sessionToUse);
      }

      // Navigate to graph page with pending generation info
      navigate("/graph", {
        state: {
          pendingGeneration: {
            topic: finalTopic,
            imageData: imageData || undefined,
            imageFileName: imageFileName || undefined,
          },
        },
      });
      return;
    }

    // Try to load from cache using the generated cache key
    if (hasCachedSession(cacheKey)) {
      console.log("Attempting to load cached session for:", cacheKey);
      if (hasImage && hasText) {
        console.log("  (Text + Image combo - cached by both)");
      } else if (isImageOnly) {
        console.log("  (Image-only - cached by filename)");
      }

      const cached = await loadCachedSession(cacheKey);

      if (cached) {
        console.log("✅ Successfully loaded cached session for:", cacheKey);
        if (voiceId && (cached.context as any).voiceId !== voiceId) {
          const updatedSession = {
            ...cached,
            context: {
              ...cached.context,
              voiceId,
            } as any,
          };
          setCachedSession(updatedSession);
          saveVideoSession(updatedSession);
        } else {
          setCachedSession(cached);
          saveVideoSession(cached);
        }
        setPendingTopicRequest(null);
        setCurrentTopic(finalTopic);
        // Navigate to graph page instead of learning state
        navigate("/graph");
        return; // Successfully loaded cached session, skip generation
      } else {
        console.warn(
          "Failed to load cached session, falling back to generation"
        );
      }
    }

    // No cached session available or failed to load - generate fresh
    setPendingTopicRequest(null);

    // Create a new session with the final topic
    const newSession = createVideoSession(finalTopic);
    if (voiceId) {
      (newSession.context as any).voiceId = voiceId;
    }

    setCachedSession(newSession);
    saveVideoSession(newSession);
    setCurrentTopic(finalTopic);

    // Navigate to graph page with pending generation info
    navigate("/graph", {
      state: {
        pendingGeneration: {
          topic: finalTopic,
          imageData: imageData || undefined,
          imageFileName: imageFileName || undefined,
        },
      },
    });
  };

  /**
   * Handle errors from VideoController
   */
  const handleVideoError = (errorMsg: string) => {
    setError(errorMsg);
    setAppState("error");
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    resetClosingQuestionState();
    if (currentTopic) {
      setAppState("learning");
      setError("");
    } else {
      setAppState("landing");
    }
  };

  /**
   * Return to landing page
   */
  const handleReset = () => {
    resetClosingQuestionState();
    resetLeafQuestionState();
    setHasSeenFirstVideo(false); // Reset video tracking

    const latestSession = loadVideoSession();
    if (latestSession) {
      setCachedSession(latestSession);
      const latestTopic =
        latestSession.context.initialTopic ||
        latestSession.context.historyTopics?.[
          latestSession.context.historyTopics.length - 1
        ] ||
        "";
      if (latestTopic) {
        setCurrentTopic(latestTopic);
      }
    }

    setPendingTopicRequest(null);
    setAppState("landing");
    setError("");
  };

  const executeClosingQuestionRequest = useCallback(
    async (payload: ClosingQuestionPayload) => {
      setClosingQuestionStatus("loading");
      setClosingQuestion(null);
      setClosingQuestionError("");

      try {
        console.log("Requesting closing question with payload:", payload);
        const response = await generateClosingQuestion(payload);
        console.log("Closing question response:", response);
        if (response.success && response.question) {
          setClosingQuestion(response.question);
          setClosingQuestionStatus("ready");
        } else {
          setClosingQuestionStatus("error");
          setClosingQuestionError(
            response.error || "Unable to generate closing question"
          );
        }
      } catch (err) {
        console.error("Closing question error:", err);
        setClosingQuestionStatus("error");
        setClosingQuestionError(
          err instanceof Error
            ? err.message
            : "Unknown error occurred while generating the closing question"
        );
      }
    },
    []
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const requestClosingQuestion = useCallback(
    (sessionSnapshot: VideoSession) => {
      const topic =
        sessionSnapshot.context.initialTopic || currentTopic || "your lesson";

      // Get all nodes from the tree instead of segments array
      const allNodes = getAllNodes(sessionSnapshot.tree);

      const voiceoverSections = allNodes
        .map((node, index) => {
          const script = node.segment.voiceoverScript?.trim();
          if (!script) {
            return null;
          }
          return {
            section: index + 1,
            script,
          };
        })
        .filter(
          (item): item is ClosingQuestionPayload["voiceoverSections"][number] =>
            item !== null
        );

      const userResponses = allNodes
        .map((node, index) => {
          if (!node.segment.userAnswer) {
            return null;
          }

          const prompt =
            (node.segment.questionText && node.segment.questionText.trim()) ||
            `What resonated with you in segment ${index + 1}?`;

          return {
            prompt,
            answer: node.segment.userAnswer,
          };
        })
        .filter(
          (item): item is ClosingQuestionPayload["userResponses"][number] =>
            item !== null
        );

      const summary =
        sessionSnapshot.context.historyTopics &&
        sessionSnapshot.context.historyTopics.length > 0
          ? sessionSnapshot.context.historyTopics.join(" → ")
          : undefined;

      const payload: ClosingQuestionPayload = {
        topic,
        voiceoverSections,
        userResponses,
        summary,
      };

      closingPayloadRef.current = payload;
      setAppState("closing");
      void executeClosingQuestionRequest(payload);
    },
    [currentTopic, executeClosingQuestionRequest]
  );

  void requestClosingQuestion;

  const handleRetryClosingQuestion = useCallback(() => {
    if (closingPayloadRef.current) {
      void executeClosingQuestionRequest(closingPayloadRef.current);
    }
  }, [executeClosingQuestionRequest]);

  // Render based on app state
  if (appState === "landing") {
    return <LandingPage onSubmit={handleTopicSubmit} />;
  }

  if (appState === "error") {
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
  }

  // Closing question state - show lightweight overlay
  if (appState === "closing") {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center bg-slate-950">
        <ClosingQuestionOverlay
          isOpen
          topic={
            currentTopic || closingPayloadRef.current?.topic || "Your lesson"
          }
          question={closingQuestion || undefined}
          answer={closingQuestionAnswer}
          onAnswerChange={(newAnswer) => {
            setClosingQuestionAnswer(newAnswer);
            console.log("Closing question answer:", newAnswer);
          }}
          isLoading={closingQuestionStatus === "loading"}
          error={
            closingQuestionStatus === "error" ? closingQuestionError : undefined
          }
          onRestart={handleReset}
          onRetry={
            closingQuestionStatus === "error"
              ? handleRetryClosingQuestion
              : undefined
          }
        />
      </div>
    );
  }

  // Learning state - show video flow
  if (appState === "learning" && currentTopic) {
    return (
      <>
        <style>{`
          .dot-bg {
            background-color: #0a0a0a;
            background-image: radial-gradient(circle, #3a3a3a 1px, transparent 1px);
            background-size: 24px 24px;
          }
        `}</style>
        <div className="relative w-full h-screen flex dot-bg">
          <VideoController
            initialTopic={currentTopic}
            onError={handleVideoError}
            initialSession={cachedSession || undefined} // Pass cached session if available
          >
            {({
              session,
              currentSegment,
              currentNodeNumber,
              isGenerating,
              error: videoError,
              requestNextSegment,
              loadCachedTopic,
              requestNewTopic,
              navigateToNode,
              handleCachedQuestionBranch,
              handleQuestionBranch,
              showQuiz,
              quizQuestion,
              quizResult,
              quizExplanation,
              isGeneratingQuiz,
              isEvaluating,
              handleQuizAnswer,
              closeQuiz,
              createQuestionNode,
              handleLeafQuestionAnswer,
              generateFollowUpVideos,
              activeGenerations,
              removeGenerationRequest,
            }) => {
              // Check if current node is a leaf (no children) - this means it's the last segment
              const isLastSegment =
                getChildren(session.tree, session.tree.currentNodeId).length ===
                0;

              // Debug info in console
              console.log("VideoController State:", {
                treeSize: session.tree.nodes.size,
                currentNode: session.tree.currentNodeId,
                currentSegment: currentSegment?.id,
                nodeNumber: currentNodeNumber,
                isGenerating,
                videoError,
                context: session.context,
                isLastSegment,
              });

              const handleVideoEnd = useCallback(() => {
                console.log("🎬 VIDEO END EVENT FIRED", {
                  currentSegmentId: currentSegment?.id,
                  isGenerating,
                  isLastSegment,
                  isQuestionNode: currentSegment?.isQuestionNode,
                  hasSeenFirstVideo,
                  isAutoPlayEnabled,
                });

                if (!currentSegment || isGenerating) {
                  console.log(
                    "⏸️ Ignoring video end - no segment or generating"
                  );
                  return;
                }

                // Check if this is a leaf node AND not already a question node
                // Also ensure we've actually played the video (not just mounted on a leaf node)
                if (
                  isLastSegment &&
                  !(currentSegment.isQuestionNode ?? false) &&
                  hasSeenFirstVideo
                ) {
                  // Leaf video detected - create question node
                  console.log("❓ Leaf video ended, creating question node");
                  createQuestionNode(session.tree.currentNodeId);
                } else if (
                  isAutoPlayEnabled &&
                  !(currentSegment.isQuestionNode ?? false)
                ) {
                  // Auto-advance to next node (only for video nodes, not question nodes)
                  const nextNode = getNextNode(
                    session.tree,
                    session.tree.currentNodeId
                  );
                  if (nextNode) {
                    console.log("⏭️ Auto-advancing to next node:", nextNode.id);
                    navigateToNode(nextNode.id);
                  } else {
                    console.log("🛑 No next node available");
                  }
                }
              }, [
                currentSegment,
                isGenerating,
                isLastSegment,
                createQuestionNode,
                session,
                isAutoPlayEnabled,
                navigateToNode,
                hasSeenFirstVideo,
              ]);

              const processedTopicRequestRef = useRef<string | null>(null);

              // IMPORTANT: Call all hooks BEFORE any conditional returns
              useEffect(() => {
                if (!pendingTopicRequest) {
                  processedTopicRequestRef.current = null;
                  return;
                }

                if (
                  processedTopicRequestRef.current === pendingTopicRequest.id
                ) {
                  return;
                }

                processedTopicRequestRef.current = pendingTopicRequest.id;
                const request = pendingTopicRequest;
                void requestNewTopic(
                  request.topic,
                  request.imageData,
                  request.imageFileName
                ).finally(() => {
                  setPendingTopicRequest((current) =>
                    current && current.id === request.id ? null : current
                  );
                });
              }, [
                pendingTopicRequest,
                requestNewTopic,
                setPendingTopicRequest,
              ]);

              // Effect to restart video when segment changes
              useEffect(() => {
                if (
                  currentSegment &&
                  currentSegment.videoUrl &&
                  videoRef.current
                ) {
                  console.log("🔄 Segment changed, loading new video:", {
                    segmentId: currentSegment.id,
                    videoUrl: currentSegment.videoUrl,
                  });
                  setSegmentKey((prev) => prev + 1);
                  videoRef.current.load();

                  // Play the video and log any errors
                  videoRef.current
                    .play()
                    .then(() => {
                      console.log("▶️ Video playing successfully");
                    })
                    .catch((error) => {
                      console.error("❌ Video play error:", error);
                    });
                }
              }, [currentSegment?.id, currentSegment?.videoUrl]);

              // Check if video has ended and should auto-advance or trigger reflection
              useEffect(() => {
                if (!videoRef.current) return;

                console.log("👂 Setting up video 'ended' event listener");

                const videoElement = videoRef.current;
                videoElement.addEventListener("ended", handleVideoEnd);

                return () => {
                  console.log("🔇 Removing video 'ended' event listener");
                  videoElement.removeEventListener("ended", handleVideoEnd);
                };
              }, [handleVideoEnd]);

              // Preload next 2 videos for smooth playback
              useEffect(() => {
                if (!session.tree.currentNodeId) return;

                // Get next 2 nodes
                const videosToPreload: string[] = [];
                let currentNodeId = session.tree.currentNodeId;

                for (let i = 0; i < 2; i++) {
                  const nextNode = getNextNode(session.tree, currentNodeId);
                  if (nextNode && nextNode.segment.videoUrl) {
                    videosToPreload.push(nextNode.segment.videoUrl);
                    currentNodeId = nextNode.id;
                  } else {
                    break;
                  }
                }

                // Create hidden video elements to trigger preloading
                const preloadElements: HTMLVideoElement[] = [];
                videosToPreload.forEach((url) => {
                  const video = document.createElement("video");
                  video.src = url;
                  video.preload = "auto";
                  video.style.display = "none";
                  document.body.appendChild(video);
                  preloadElements.push(video);
                });

                // Cleanup preload elements
                return () => {
                  preloadElements.forEach((video) => {
                    document.body.removeChild(video);
                  });
                };
              }, [session.tree, session.tree.currentNodeId]);

              // Auto-open leaf question overlay when navigating to a question node
              // But NOT on initial mount - only when we actually navigate to a question node
              useEffect(() => {
                // Mark that we've seen a video segment (not on question nodes)
                if (
                  currentSegment &&
                  !(currentSegment.isQuestionNode ?? false)
                ) {
                  setHasSeenFirstVideo(true);
                }
              }, [currentSegment?.id, currentSegment?.isQuestionNode]);

              useEffect(() => {
                if (
                  currentSegment &&
                  (currentSegment.isQuestionNode ?? false) &&
                  leafQuestionStatus === "idle" &&
                  hasSeenFirstVideo &&
                  !isGeneratingFollowUp
                ) {
                  // Extract the question from the segment
                  if (currentSegment.questionText) {
                    setLeafQuestion(currentSegment.questionText);
                    setLeafQuestionStatus("ready");
                    console.log("Auto-opening leaf question overlay");
                  }
                } else if (
                  currentSegment &&
                  !(currentSegment.isQuestionNode ?? false) &&
                  leafQuestionStatus !== "idle"
                ) {
                  // Reset state when leaving question node
                  resetLeafQuestionState();
                }
              }, [
                currentSegment?.id,
                currentSegment?.isQuestionNode,
                currentSegment?.questionText,
                leafQuestionStatus,
                resetLeafQuestionState,
                hasSeenFirstVideo,
                isGeneratingFollowUp,
              ]);

              // NOW we can do conditional returns

              // Show loading spinner while generating first segment
              if (!currentSegment && isGenerating) {
                return (
                  <div className="flex items-center justify-center w-full h-screen">
                    <LoadingSpinner />
                  </div>
                );
              }

              // Show error if something went wrong
              if (videoError) {
                return (
                  <div className="flex items-center justify-center w-full h-screen">
                    <ErrorDisplay error={videoError} onRetry={handleRetry} />
                  </div>
                );
              }

              // No segment yet and not generating - show waiting state
              if (!currentSegment) {
                return (
                  <div className="flex items-center justify-center w-full h-screen">
                    <div className="text-white text-center">
                      <div className="text-2xl mb-4">
                        Preparing your learning experience...
                      </div>
                      <LoadingSpinner />
                    </div>
                  </div>
                );
              }

              return (
                <>
                  {/* Quiz Question Overlay */}
                  <QuizQuestionOverlay
                    isOpen={showQuiz}
                    question={quizQuestion || ""}
                    isLoading={isGeneratingQuiz}
                    isEvaluating={isEvaluating}
                    error={videoError || undefined}
                    result={quizResult}
                    explanation={quizExplanation || undefined}
                    onSubmitAnswer={handleQuizAnswer}
                    onContinue={closeQuiz}
                    onRestart={handleReset}
                  />

                  {/* Leaf Question Overlay */}
                  <LeafQuestionOverlay
                    isOpen={leafQuestionStatus !== "idle"}
                    question={leafQuestion || undefined}
                    status={leafQuestionStatus}
                    answer={leafQuestionAnswer}
                    reasoning={leafEvaluationReasoning}
                    error={videoError || undefined}
                    onAnswerChange={setLeafQuestionAnswer}
                    onSubmit={async (ans) => {
                      if (!leafQuestion) return;
                      setLeafQuestionStatus("evaluating");
                      const result = await handleLeafQuestionAnswer(
                        leafQuestion,
                        ans
                      );
                      if (result.success) {
                        if (result.correct) {
                          setLeafQuestionStatus("correct");
                          setLeafEvaluationReasoning(result.reasoning || "");
                        } else {
                          setLeafQuestionStatus("incorrect");
                          setLeafEvaluationReasoning(result.reasoning || "");
                        }
                      } else {
                        setLeafQuestionStatus("error");
                      }
                    }}
                    onContinueLearning={async (wasCorrect) => {
                      // Set flag to prevent duplicate question overlay
                      setIsGeneratingFollowUp(true);

                      // Show loading state in overlay instead of closing
                      setLeafQuestionStatus("generating_followup");

                      try {
                        // Generate follow-up videos based on answer correctness
                        // Pass full context: question, answer, and evaluation reasoning
                        await generateFollowUpVideos(
                          wasCorrect,
                          leafQuestion || undefined,
                          leafQuestionAnswer || undefined,
                          leafEvaluationReasoning || undefined
                        );

                        // After successful generation, close overlay
                        resetLeafQuestionState();
                      } catch (error) {
                        console.error(
                          "Error generating follow-up videos:",
                          error
                        );
                        // On error, show error state
                        setLeafQuestionStatus("error");
                      } finally {
                        // Always reset flag
                        setIsGeneratingFollowUp(false);
                      }
                    }}
                    onContinue={() => {
                      resetLeafQuestionState();
                      // If on question node, try to navigate to next or show message
                      if (currentSegment?.isQuestionNode ?? false) {
                        const nextNode = getNextNode(
                          session.tree,
                          session.tree.currentNodeId
                        );
                        if (nextNode) {
                          navigateToNode(nextNode.id);
                        }
                      }
                    }}
                    onRetry={() => {
                      setLeafQuestionStatus("ready");
                      setLeafQuestionAnswer("");
                    }}
                    onStartOver={handleReset}
                  />

                  {/* Left Sidebar */}
                  <div className="w-80 h-screen bg-slate-800 border-r border-slate-700 flex flex-col">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-slate-700">
                      <button
                        onClick={handleReset}
                        className="w-full bg-slate-700/80 hover:bg-slate-700 text-white px-3 py-2 rounded-lg transition-all border border-slate-600 hover:border-slate-500 flex items-center justify-center gap-2"
                        title="Return to home"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                        <span>Home</span>
                      </button>
                      <button
                        onClick={() => navigate("/graph")}
                        className="w-full mt-2 bg-indigo-600/80 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg transition-all border border-indigo-500 hover:border-indigo-400 flex items-center justify-center gap-2"
                        title="View graph"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                        <span>Graph View</span>
                      </button>
                    </div>

                    {/* Topic Display */}
                    <div className="px-4 py-3 border-b border-slate-700">
                      <div className="text-xs text-slate-400 mb-1">
                        Currently Learning
                      </div>
                      <div className="font-semibold text-blue-400 text-sm">
                        {currentSegment.topic}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Node: {currentNodeNumber}
                      </div>
                    </div>

                    {/* Sidebar Content - Input Controls */}
                    <div className="flex-1 overflow-y-auto">
                      <InputOverlay
                        hasQuestion={currentSegment.hasQuestion}
                        questionText={currentSegment.questionText}
                        isGenerating={isGenerating}
                        isEvaluating={false}
                        onAnswer={() => Promise.resolve()}
                        onRequestNext={requestNextSegment}
                        onNewTopic={requestNewTopic}
                        onLoadCachedTopic={loadCachedTopic as any}
                        onReset={handleReset}
                        onAskQuestion={handleQuestionBranch}
                        onAskCachedQuestion={handleCachedQuestionBranch}
                        currentNodeNumber={currentNodeNumber}
                        activeGenerations={activeGenerations}
                        onNavigateToGeneration={navigateToNode}
                        onDismissGeneration={removeGenerationRequest}
                      />
                    </div>
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col items-center justify-center relative p-4">
                    {/* Video Player Container with Navigation */}
                    <div className="flex items-center gap-4 mb-4">
                      {/* Previous Button */}
                      <button
                        onClick={() => {
                          const prevNode = getPreviousNode(
                            session.tree,
                            session.tree.currentNodeId
                          );
                          if (prevNode) {
                            navigateToNode(prevNode.id);
                          }
                        }}
                        disabled={
                          !getPreviousNode(
                            session.tree,
                            session.tree.currentNodeId
                          )
                        }
                        className={`p-3 rounded-full transition-all ${
                          getPreviousNode(
                            session.tree,
                            session.tree.currentNodeId
                          )
                            ? "bg-slate-700/80 hover:bg-slate-600 text-white cursor-pointer"
                            : "bg-slate-800/40 text-slate-600 cursor-not-allowed"
                        }`}
                        title="Previous video"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>

                      {/* Video Player */}
                      <div
                        className="relative shadow-2xl rounded-lg overflow-hidden bg-black"
                        style={{
                          width: "calc(100vw - 400px)",
                          maxWidth: "1280px",
                        }}
                      >
                        {currentSegment.isQuestionNode ?? false ? (
                          <div
                            className="flex items-center justify-center bg-gradient-to-br from-amber-900/30 to-slate-900"
                            style={{ width: "100%", height: "450px" }}
                          >
                            <div className="text-center text-white px-8">
                              <div className="text-6xl mb-4">❓</div>
                              <div className="text-2xl mb-2 font-semibold text-amber-400">
                                Knowledge Check
                              </div>
                              <div className="text-lg text-slate-300">
                                Answer the question below to continue your
                                learning journey
                              </div>
                            </div>
                          </div>
                        ) : currentSegment.videoUrl ? (
                          <video
                            key={segmentKey}
                            ref={videoRef}
                            src={currentSegment.videoUrl}
                            controls
                            autoPlay
                            className="w-full h-auto"
                            style={{
                              maxHeight: "80vh",
                            }}
                            onLoadedData={() => {
                              console.log("📺 Video loaded and ready to play");
                            }}
                            onPlay={() => {
                              console.log("▶️ Video started playing");
                            }}
                            onPause={() => {
                              console.log("⏸️ Video paused");
                            }}
                            onEnded={() => {
                              console.log("🏁 Video ended (native event)");
                            }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : currentSegment.renderingStatus === "rendering" ||
                          currentSegment.renderingStatus === "pending" ? (
                          <div
                            className="flex items-center justify-center"
                            style={{ width: "100%", height: "450px" }}
                          >
                            <div className="text-center text-white">
                              <LoadingSpinner />
                              <div className="mt-4 text-lg">
                                Rendering video...
                              </div>
                              <div className="mt-2 text-sm text-slate-400">
                                This may take a minute
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="flex items-center justify-center"
                            style={{ width: "100%", height: "450px" }}
                          >
                            <div className="text-center text-white">
                              <div className="text-lg mb-2">
                                Video not available
                              </div>
                              <div className="text-sm text-slate-400">
                                Rendering status:{" "}
                                {currentSegment.renderingStatus || "unknown"}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Auto-play Toggle Overlay */}
                        <div className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2 text-sm z-10">
                          <span className="text-slate-300">Auto-play</span>
                          <button
                            onClick={() =>
                              setIsAutoPlayEnabled(!isAutoPlayEnabled)
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              isAutoPlayEnabled
                                ? "bg-indigo-600"
                                : "bg-slate-600"
                            }`}
                            title={
                              isAutoPlayEnabled
                                ? "Disable auto-play"
                                : "Enable auto-play"
                            }
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isAutoPlayEnabled
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={() => {
                          const nextNode = getNextNode(
                            session.tree,
                            session.tree.currentNodeId
                          );
                          if (nextNode) {
                            navigateToNode(nextNode.id);
                          }
                        }}
                        disabled={
                          !getNextNode(session.tree, session.tree.currentNodeId)
                        }
                        className={`p-3 rounded-full transition-all ${
                          getNextNode(session.tree, session.tree.currentNodeId)
                            ? "bg-slate-700/80 hover:bg-slate-600 text-white cursor-pointer"
                            : "bg-slate-800/40 text-slate-600 cursor-not-allowed"
                        }`}
                        title="Next video"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Node Carousel - horizontal timeline below video */}
                    {session.tree.nodes.size > 0 && (
                      <div
                        style={{
                          width: "calc(100vw - 400px)",
                          maxWidth: "1280px",
                        }}
                      >
                        <NodeCarousel
                          tree={session.tree}
                          onNodeClick={(nodeId) => navigateToNode(nodeId)}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Tree Explorer Modal */}
                    {showTreeExplorer && (
                      <TreeExplorer
                        tree={session.tree}
                        onNodeClick={(nodeId) => {
                          navigateToNode(nodeId);
                          setShowTreeExplorer(false);
                        }}
                        onClose={() => setShowTreeExplorer(false)}
                      />
                    )}
                  </div>
                </>
              );
            }}
          </VideoController>
        </div>
      </>
    );
  }

  // Fallback
  return <div>Loading...</div>;
};
