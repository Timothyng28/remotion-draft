/**
 * LandingPage.tsx
 *
 * Landing page where users enter the topic they want to learn about.
 */

import React, { useRef, useState } from "react";
import { useImageUpload } from "../hooks/useImageUpload";
import { hasCachedSession } from "../services/cachedSessionService";
import { ImagePreview } from "./ImagePreview";

interface LandingPageProps {
  onSubmit: (
    topic: string,
    voiceId?: string,
    imageData?: string,
    imageFileName?: string
  ) => void;
  onTestMode?: () => void; // NEW: For testing with hardcoded data
}

// Available voices for selection
const AVAILABLE_VOICES = [
  { id: "pqHfZKP75CvOlQylNhV4", name: "Male Voice" },
  { id: "XfNU2rGpBa01ckF309OY", name: "Female Voice" },
  // Add more voices here as needed
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onSubmit,
  onTestMode,
}) => {
  const [topic, setTopic] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>(
    AVAILABLE_VOICES[0].id
  ); // Default to first voice
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Main Content */}
        <div className="text-center mb-12 space-y-6">
          {/* Title */}
          <h1 className="text-6xl font-bold text-white mb-4 animate-fade-in">
            Learn Anything
          </h1>

          {/* Subtitle */}
          <p
            className="text-2xl text-blue-300 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            What do you want to learn today?
          </p>

          <p
            className="text-slate-400 max-w-lg mx-auto animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            Enter any topic and our AI will create a personalized, interactive
            video lesson just for you.
          </p>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="mb-8 animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="relative">
            {/* Drag and drop zone overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 border-dashed rounded-xl flex items-center justify-center z-10 pointer-events-none">
                <p className="text-blue-300 font-semibold">Drop image here</p>
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
              placeholder="e.g., React Hooks, Quantum Physics... or drag an image"
              className={`w-full px-6 py-5 text-lg bg-slate-800/50 backdrop-blur-sm text-white placeholder-slate-500 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                isFocused
                  ? "border-blue-500 shadow-lg shadow-blue-500/30"
                  : isDragging
                  ? "border-blue-500 border-dashed"
                  : "border-slate-700"
              }`}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!topic.trim() && !imageData}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                topic.trim() || imageData
                  ? "bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 shadow-lg"
                  : "bg-slate-700 text-slate-500 cursor-not-allowed"
              }`}
            >
              Generate
            </button>
          </div>

          {/* File input and preview */}
          <div className="mt-4 space-y-3">
            {/* File input button */}
            <div className="flex items-center gap-3">
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
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
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
              <p className="text-xs text-slate-500">
                Optional: Add an image for visual context
              </p>
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

        {/* Example Topics */}
        <div className="animate-fade-in" style={{ animationDelay: "0.8s" }}>
          <p className="text-slate-500 text-sm mb-4 text-center">
            Or try one of these:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {exampleTopics.map((example) => {
              const isCached = hasCachedSession(example);
              return (
                <button
                  key={example}
                  onClick={() => handleExampleClick(example)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 backdrop-blur-sm relative group ${
                    isCached
                      ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/50 hover:border-blue-400/70"
                      : "bg-slate-800/50 hover:bg-slate-700/70 text-slate-300 hover:text-white border border-slate-700 hover:border-blue-500/50"
                  }`}
                  title={
                    isCached
                      ? "Instant playback - Pre-loaded"
                      : "Will generate on demand"
                  }
                >
                  {isCached && (
                    <span className="inline-block mr-1.5 text-blue-400">
                      ⚡
                    </span>
                  )}
                  {example}
                </button>
              );
            })}
          </div>

          {/* Voice Selection */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <label
              htmlFor="voice-select"
              className="block text-slate-400 text-sm mb-3 text-center font-medium"
            >
              Voice Selection
            </label>
            <div className="flex justify-center">
              <div className="relative inline-block">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-blue-400"
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
                  className="appearance-none pl-12 pr-10 py-4 rounded-xl text-base font-medium bg-slate-800/70 text-white border-2 border-slate-700/70 hover:border-blue-500/60 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer backdrop-blur-md shadow-lg hover:shadow-xl hover:bg-slate-800/90 min-w-[240px]"
                >
                  {AVAILABLE_VOICES.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-slate-400"
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
            <p className="text-slate-500 text-xs mt-2 text-center">
              Choose the voice for your video narration
            </p>
          </div>

          {/* ===== TEST BUTTON - EASILY REMOVABLE ===== */}
          {onTestMode && (
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <button
                onClick={onTestMode}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                🧪 Test Mode: Pre-loaded 2-Segment Video
              </button>
              <p className="text-slate-500 text-xs mt-2 text-center">
                Test with hardcoded video data (for development)
              </p>
            </div>
          )}
          {/* ===== END TEST BUTTON ===== */}
        </div>

        {/* Feature Highlights */}
        <div
          className="mt-16 grid grid-cols-3 gap-6 animate-fade-in"
          style={{ animationDelay: "1s" }}
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">AI-Powered</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">Interactive</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">Personalized</p>
          </div>
        </div>
      </div>

      {/* Add CSS animation */}
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
      `}</style>
    </div>
  );
};
