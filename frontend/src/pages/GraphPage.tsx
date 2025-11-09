/**
 * GraphPage.tsx
 *
 * Full-screen graph view showing the React Flow tree node map.
 * Displays the tree visualization with the left sidebar maintained.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { InputOverlay } from "../components/InputOverlay";
import { TreeExplorer } from "../components/TreeExplorer";
import { VideoController } from "../controllers/VideoController";
import { loadVideoSession } from "../types/TreeState";

export const GraphPage: React.FC = () => {
  const navigate = useNavigate();
  const cachedSession = loadVideoSession();

  // If no session exists, redirect to home
  if (!cachedSession) {
    navigate("/");
    return null;
  }

  return (
    <>
      {/* Add dot background style */}
      <style>{`
        .dot-bg {
          background-color: #0a0a0a;
          background-image: radial-gradient(circle, #3a3a3a 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>
      <VideoController
        initialTopic={cachedSession.context.initialTopic || "Graph View"}
        initialSession={cachedSession}
      >
        {({
          session,
          currentSegment,
          currentNodeNumber,
          isGenerating,
          navigateToNode,
          requestNextSegment,
          requestNewTopic,
          loadCachedTopic,
          handleQuestionBranch,
          handleCachedQuestionBranch,
          activeGenerations,
          removeGenerationRequest,
        }) => {
          return (
            <div className="relative w-full h-screen flex dot-bg">
              {/* Left Sidebar */}
              <div className="w-80 h-screen bg-slate-900/80 backdrop-blur-sm border-r border-slate-800/50 flex flex-col">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-slate-800/50">
                  <button
                    onClick={() => navigate("/")}
                    className="w-full bg-slate-800/60 hover:bg-slate-800/80 text-white px-3 py-2 rounded-lg transition-all border border-slate-700/50 hover:border-slate-600/70 flex items-center justify-center gap-2"
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
                </div>

                {/* Topic Display */}
                {currentSegment && (
                  <div className="px-4 py-3 border-b border-slate-800/50">
                    <div className="text-xs text-slate-400 mb-1">
                      Currently Learning
                    </div>
                    <div className="font-semibold text-blue-300 text-sm">
                      {currentSegment.topic}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Node: {currentNodeNumber}
                    </div>
                  </div>
                )}

                {/* Sidebar Content - Input Controls */}
                <div className="flex-1 overflow-y-auto">
                  {currentSegment ? (
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
                  ) : (
                    <div className="p-4 text-slate-400 text-sm">
                      Loading session...
                    </div>
                  )}
                </div>
              </div>

              {/* Main Content Area - Full Screen Tree Visualization */}
              <div className="flex-1 relative w-full h-full">
                {session.tree.nodes.size > 0 ? (
                  <TreeExplorer
                    tree={session.tree}
                    onNodeClick={(nodeId) => {
                      navigateToNode(nodeId);
                    }}
                    onClose={() => navigate("/")}
                    isModal={false}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-white">
                    <div className="text-center">
                      <div className="text-lg mb-2 text-slate-300">
                        No tree data available
                      </div>
                      <button
                        onClick={() => navigate("/")}
                        className="px-4 py-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg transition-colors border border-blue-500/50 hover:border-blue-400"
                      >
                        Return to Home
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }}
      </VideoController>
    </>
  );
};
