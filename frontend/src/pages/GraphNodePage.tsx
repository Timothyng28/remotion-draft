/**
 * GraphNodePage.tsx
 *
 * Page component for viewing a specific node's video at /graph/:nodeId
 * Shows the video player interface similar to HomePage's learning state.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { InputOverlay } from "../components/InputOverlay";
import { LeafQuestionOverlay } from "../components/LeafQuestionOverlay";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { NodeCarousel } from "../components/NodeCarousel";
import { QuizQuestionOverlay } from "../components/QuizQuestionOverlay";
import { TreeExplorer } from "../components/TreeExplorer";
import { VideoController } from "../controllers/VideoController";
import {
  getChildren,
  getNextNode,
  getPreviousNode,
  loadVideoSession,
} from "../types/TreeState";

export const GraphNodePage: React.FC = () => {
  const navigate = useNavigate();
  const { nodeId } = useParams<{ nodeId: string }>();
  const cachedSession = loadVideoSession();

  // Reference to the video element for programmatic control
  const videoRef = useRef<HTMLVideoElement>(null);

  // Track when segment changes to restart playback
  const [segmentKey, setSegmentKey] = useState(0);

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

  // Track if follow-up videos are being generated
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);

  // Track when we're syncing from URL to prevent URL update loops
  const syncingFromUrlRef = useRef(false);
  const lastSyncedNodeIdRef = useRef<string | null>(null);

  // If no session exists, redirect to home
  if (!cachedSession) {
    navigate("/");
    return null;
  }

  // If nodeId doesn't exist in tree, redirect to graph view
  if (nodeId && !cachedSession.tree.nodes.has(nodeId)) {
    navigate("/graph");
    return null;
  }

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
          initialTopic={cachedSession.context.initialTopic || "Graph View"}
          onError={(error) => console.error("VideoController error:", error)}
          initialSession={cachedSession}
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
            // Navigate to the nodeId from URL on mount or when nodeId changes
            useEffect(() => {
              if (nodeId && session.tree.nodes.has(nodeId)) {
                if (session.tree.currentNodeId !== nodeId) {
                  syncingFromUrlRef.current = true;
                  lastSyncedNodeIdRef.current = nodeId;
                  navigateToNode(nodeId);
                  // Reset flag after navigation completes
                  setTimeout(() => {
                    syncingFromUrlRef.current = false;
                  }, 200);
                } else {
                  // Already synced, clear the flag
                  syncingFromUrlRef.current = false;
                  lastSyncedNodeIdRef.current = nodeId;
                }
              }
            }, [nodeId, session.tree.nodes, navigateToNode]);

            // Update URL when node changes (but not when syncing from URL)
            useEffect(() => {
              const currentNodeId = session.tree.currentNodeId;
              if (!currentNodeId) {
                return;
              }

              // Don't update URL if we're currently syncing from URL
              if (syncingFromUrlRef.current) {
                // If the current node matches what we're syncing to, mark sync as complete
                if (currentNodeId === lastSyncedNodeIdRef.current) {
                  syncingFromUrlRef.current = false;
                }
                return;
              }

              // Always update URL if current node differs from URL nodeId
              // This handles previous/next button clicks and other navigation
              if (currentNodeId !== nodeId) {
                navigate(`/graph/${currentNodeId}`, { replace: true });
              }
            }, [session.tree.currentNodeId, nodeId, navigate]);

            // Check if current node is a leaf (no children)
            const isLastSegment =
              getChildren(session.tree, session.tree.currentNodeId).length ===
              0;

            const handleVideoEnd = useCallback(() => {
              if (!currentSegment || isGenerating) {
                return;
              }

              // Check if this is a leaf node AND not already a question node
              if (
                isLastSegment &&
                !(currentSegment.isQuestionNode ?? false) &&
                hasSeenFirstVideo
              ) {
                // Leaf video detected - create question node
                console.log("Leaf video ended, creating question node");
                createQuestionNode(session.tree.currentNodeId);
              } else if (
                isAutoPlayEnabled &&
                !(currentSegment.isQuestionNode ?? false)
              ) {
                // Auto-advance to next node
                const nextNode = getNextNode(
                  session.tree,
                  session.tree.currentNodeId
                );
                if (nextNode) {
                  navigateToNode(nextNode.id);
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

            // Effect to restart video when segment changes
            useEffect(() => {
              if (
                currentSegment &&
                currentSegment.videoUrl &&
                videoRef.current
              ) {
                setSegmentKey((prev) => prev + 1);
                videoRef.current.load();
                videoRef.current.play().catch(console.error);
              }
            }, [currentSegment?.id, currentSegment?.videoUrl]);

            // Check if video has ended and should auto-advance or trigger reflection
            useEffect(() => {
              if (!videoRef.current) return;

              videoRef.current.addEventListener("ended", handleVideoEnd);
              return () => {
                videoRef.current?.removeEventListener("ended", handleVideoEnd);
              };
            }, [handleVideoEnd]);

            // Mark that we've seen a video segment
            useEffect(() => {
              if (currentSegment && !(currentSegment.isQuestionNode ?? false)) {
                setHasSeenFirstVideo(true);
              }
            }, [currentSegment?.id, currentSegment?.isQuestionNode]);

            // Auto-open leaf question overlay when navigating to a question node
            useEffect(() => {
              if (
                currentSegment &&
                (currentSegment.isQuestionNode ?? false) &&
                leafQuestionStatus === "idle" &&
                hasSeenFirstVideo &&
                !isGeneratingFollowUp
              ) {
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
                  <ErrorDisplay
                    error={videoError}
                    onRetry={() => navigate("/")}
                  />
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
                  onRestart={() => navigate("/")}
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
                    setIsGeneratingFollowUp(true);
                    setLeafQuestionStatus("generating_followup");

                    try {
                      await generateFollowUpVideos(
                        wasCorrect,
                        leafQuestion || undefined,
                        leafQuestionAnswer || undefined,
                        leafEvaluationReasoning || undefined
                      );
                      resetLeafQuestionState();
                    } catch (error) {
                      console.error(
                        "Error generating follow-up videos:",
                        error
                      );
                      setLeafQuestionStatus("error");
                    } finally {
                      setIsGeneratingFollowUp(false);
                    }
                  }}
                  onContinue={() => {
                    resetLeafQuestionState();
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
                  onStartOver={() => navigate("/")}
                />

                {/* Left Sidebar */}
                <div className="w-80 h-screen bg-slate-800 border-r border-slate-700 flex flex-col">
                  {/* Sidebar Header */}
                  <div className="p-4 border-b border-slate-700">
                    <button
                      onClick={() => navigate("/")}
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
                      onReset={() => navigate("/")}
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
                <div className="flex-1 flex flex-col items-center justify-center relative p-4 pb-[212px]">
                  {/* Video Player Container with Navigation */}
                  <div className="flex items-center gap-4">
                    {/* Previous Button */}
                    <button
                      onClick={() => {
                        const prevNode = getPreviousNode(
                          session.tree,
                          session.tree.currentNodeId
                        );
                        if (prevNode) {
                          navigateToNode(prevNode.id);
                          // Explicitly update URL when navigating via button
                          navigate(`/graph/${prevNode.id}`, { replace: true });
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
                            isAutoPlayEnabled ? "bg-indigo-600" : "bg-slate-600"
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
                          // Explicitly update URL when navigating via button
                          navigate(`/graph/${nextNode.id}`, { replace: true });
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

                  {/* Node Carousel - absolutely positioned at bottom */}
                  {session.tree.nodes.size > 0 && (
                    <div
                      className="absolute bottom-12 left-1/2 -translate-x-1/2"
                      style={{
                        width: "calc(100vw - 400px)",
                        maxWidth: "1280px",
                      }}
                    >
                      <NodeCarousel
                        tree={session.tree}
                        onNodeClick={(nodeId) => {
                          navigateToNode(nodeId);
                          navigate(`/graph/${nodeId}`, { replace: true });
                        }}
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
                        // Explicitly update URL when navigating via tree explorer
                        navigate(`/graph/${nodeId}`, { replace: true });
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
};
