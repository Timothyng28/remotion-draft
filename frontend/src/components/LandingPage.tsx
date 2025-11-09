/**
 * LandingPage.tsx
 *
 * Landing page where users enter the topic they want to learn about.
 */

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useImageUpload } from "../hooks/useImageUpload";
import {
  hasCachedSession,
  loadCachedSession,
} from "../services/cachedSessionService";
import { loadVideoSession } from "../types/TreeState";
import { ImagePreview } from "./ImagePreview";

interface LandingPageProps {
  onSubmit: (
    topic: string,
    voiceId?: string,
    imageData?: string,
    imageFileName?: string
  ) => void;
}

// Available voices for selection
const AVAILABLE_VOICES = [
  { id: "K80wneyktrw2rE11kA2W", name: "Ewen" },
  { id: "3qdetrzoUbrHyBEgSqsF", name: "Lui Leng" },
  { id: "UegrLZyjnJFv8l6OQkYO", name: "Ming Jun" },
  { id: "7Sq89C8p7zNMCiILWbMA", name: "Timothy" },
  { id: "lb0GqmO0jSR60T0eQdIc", name: "Peter Griffin" },
  { id: "ngeTUXucUwpDZ8yZi8OV", name: "3Blue1Brown" },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onSubmit }) => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>(
    AVAILABLE_VOICES[0].id
  ); // Default to first voice
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>(
    {}
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for active session on mount
  useEffect(() => {
    const session = loadVideoSession();
    setHasActiveSession(!!session && session.tree.nodes.size > 0);
  }, []);

  // Load thumbnail URLs from cached sessions
  useEffect(() => {
    const loadThumbnails = async () => {
      const thumbnails: Record<string, string> = {};

      for (const topic of exampleTopics) {
        const session = await loadCachedSession(topic);
        if (session && session.tree.nodes.size > 0) {
          // Get the first node (root) from the tree
          const tree = session.tree as any;
          const rootIds = tree.rootIds || [];
          if (rootIds.length > 0) {
            const rootId = rootIds[0];
            const rootNode = session.tree.nodes.get(rootId);
            const segment = rootNode?.segment as any;
            const thumbnailUrl = segment?.thumbnailUrl;
            if (thumbnailUrl && typeof thumbnailUrl === "string") {
              thumbnails[topic] = thumbnailUrl;
            }
          }
        }
      }

      setThumbnailUrls(thumbnails);
    };

    loadThumbnails();
  }, []);

  // Image upload functionality
  const {
    imageData,
    imagePreview,
    fileName,
    isDragging,
    error: imageError,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    removeImage,
    clearError,
  } = useImageUpload();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: at least text OR image must be provided
    if (!topic.trim() && !imageData) {
      return; // Don't submit if both are empty
    }

    // Pass topic, voice, image data, and filename
    // App.tsx will use filename for cache key generation
    onSubmit(
      topic.trim(),
      selectedVoice,
      imageData || undefined,
      fileName || undefined
    );
  };

  // Example topics for inspiration
  const exampleTopics = [
    "Binary Search Trees",
    "Photosynthesis",
    "Pythagoras Theorem",
  ];

  const handleExampleClick = (exampleTopic: string) => {
    // Directly submit if cached, otherwise set input value
    if (hasCachedSession(exampleTopic)) {
      onSubmit(exampleTopic, selectedVoice, undefined, undefined);
    } else {
      setTopic(exampleTopic);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 dot-bg w-full relative">
      {/* Graph View Button - Top Right */}
      {hasActiveSession && (
        <button
          onClick={() => navigate("/graph")}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-indigo-600/90 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-all border border-indigo-500/50 hover:border-indigo-400 flex items-center gap-2 shadow-lg hover:shadow-xl z-10"
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
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <span className="hidden sm:inline">Graph View</span>
        </button>
      )}

      <div className="w-full max-w-4xl">
        {/* Main Content */}
        <div className="text-center mb-8 sm:mb-12 space-y-4 sm:space-y-6">
          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-4 animate-fade-in lilita-one-regular">
            VideoGraph
          </h1>

          {/* Subtitle */}
          <p
            className="text-xl sm:text-2xl text-blue-300 animate-fade-in px-4"
            style={{ animationDelay: "0.2s" }}
          >
            What do you want to learn today?
          </p>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="mb-6 sm:mb-8 animate-fade-in px-2"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="relative">
            {/* Drag and drop zone overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-indigo-500/20 border-2 border-indigo-500 border-dashed rounded-xl flex items-center justify-center z-10 pointer-events-none">
                <p className="text-indigo-300 font-semibold text-sm sm:text-base">
                  Drop image here
                </p>
              </div>
            )}

            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              placeholder="e.g., Trigonometry, Quantum Physics... or drag an image"
              className={`w-full px-4 sm:px-6 py-4 sm:py-5 text-base sm:text-lg backdrop-blur-sm text-white placeholder-slate-500 rounded-xl border-2 transition-all duration-300 focus:outline-none pr-28 sm:pr-32 hover:shadow-lg hover:shadow-indigo-500/20 ${
                isFocused
                  ? "bg-slate-800/80 border-indigo-500 shadow-lg shadow-indigo-500/30"
                  : isDragging
                  ? "bg-slate-800/50 border-indigo-500 border-dashed"
                  : "bg-slate-800/50 border-slate-700 hover:border-indigo-500/50"
              }`}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!topic.trim() && !imageData}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 px-4 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base ${
                topic.trim() || imageData
                  ? "bg-indigo-600 hover:bg-indigo-600 text-white hover:scale-105 shadow-lg"
                  : "bg-slate-700 text-slate-500 cursor-not-allowed"
              }`}
            >
              Go!
            </button>
          </div>

          {/* File input and preview */}
          <div className="mt-4 space-y-3">
            {/* File input button and voice selection */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Attach Image
              </button>

              {/* Voice Selection - Compact dropdown */}
              <div className="relative inline-block w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <svg
                    className="h-3 w-3 sm:h-4 sm:w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
                <select
                  id="voice-select"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="appearance-none pl-7 sm:pl-8 pr-6 sm:pr-7 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 hover:border-indigo-500/60 focus:border-indigo-500 focus:outline-none transition-all duration-300 cursor-pointer w-full sm:w-auto"
                >
                  {AVAILABLE_VOICES.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                  <svg
                    className="h-3 w-3 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Image preview */}
            {imagePreview && fileName && (
              <ImagePreview
                imagePreview={imagePreview}
                fileName={fileName}
                onRemove={removeImage}
              />
            )}

            {/* Error message */}
            {imageError && (
              <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-400">{imageError}</p>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-xs text-red-300 hover:text-red-200 mt-1 underline"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Example Topics - Card Style */}
        <div
          className="animate-fade-in px-2"
          style={{ animationDelay: "0.8s" }}
        >
          <p className="text-slate-400 text-sm sm:text-base mb-8 text-center font-medium">
            Or explore these topics:
          </p>
          <div className="flex justify-center items-center min-h-[280px] sm:min-h-[320px] relative">
            {exampleTopics.map((example, index) => {
              const isCached = hasCachedSession(example);
              const thumbnailUrl = thumbnailUrls[example];

              // Calculate rotation and position for overlap effect
              const rotations = ["-8deg", "2deg", "-4deg"];
              const zIndexes = [1, 3, 2];
              // Increased spacing to span full width of search bar
              const translations = [
                "translateX(240px)",
                "translateX(0px)",
                "translateX(-240px)",
              ];

              return (
                <button
                  key={example}
                  onClick={() => handleExampleClick(example)}
                  className="absolute group cursor-pointer"
                  style={{
                    transform: `${translations[index]} rotate(${rotations[index]})`,
                    zIndex: zIndexes[index],
                    transition: "all 0.3s ease-out",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = `${translations[index]} rotate(0deg) scale(1.05)`;
                    e.currentTarget.style.zIndex = "10";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = `${translations[index]} rotate(${rotations[index]}) scale(1)`;
                    e.currentTarget.style.zIndex = String(zIndexes[index]);
                  }}
                  title={
                    isCached
                      ? "⚡ Instant playback - Pre-loaded"
                      : "Will generate on demand"
                  }
                >
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-[240px] sm:w-[280px] hover:shadow-blue-500/20 transition-shadow duration-300 border-4 border-white">
                    {/* Thumbnail */}
                    <div className="h-[140px] sm:h-[160px] w-full relative p-1">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={example}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        // Fallback placeholder while loading
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400 rounded-xl">
                          <div className="text-slate-500 text-sm">
                            Loading...
                          </div>
                        </div>
                      )}

                      {/* Cached indicator badge */}
                      {isCached && (
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg">
                          <span className="text-xs font-bold text-blue-600">
                            ⚡ Ready
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div className="p-4 sm:p-5">
                      <h3 className="text-slate-800 font-bold text-base sm:text-lg text-center">
                        {example}
                      </h3>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add CSS animation and custom styles */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .lilita-one-regular {
          font-family: "Lilita One", system-ui;
          font-weight: 400;
          font-style: normal;
        }

        .dot-bg {
          background-color: #0a0a0a;
          background-image: radial-gradient(circle, #3a3a3a 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>
    </div>
  );
};
