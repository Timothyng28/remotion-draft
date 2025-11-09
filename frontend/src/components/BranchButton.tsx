/**
 * BranchButton.tsx
 *
 * Button for asking questions about the current topic.
 * Creates a new branch with videos that answer the user's question.
 */

import { useRef, useState } from "react";
import { useImageUpload } from "../hooks/useImageUpload";
import { ImagePreview } from "./ImagePreview";

interface BranchButtonProps {
  onAskQuestion: (
    question: string,
    imageData?: string,
    imageFilename?: string
  ) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

/**
 * Button to ask a question and create a new learning branch
 */
export const BranchButton: React.FC<BranchButtonProps> = ({
  onAskQuestion,
  disabled = false,
  className = "",
}) => {
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [question, setQuestion] = useState("");
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

  const handleClick = () => {
    if (disabled) return;
    setShowQuestionInput(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Text is required for follow-up questions, image is optional
    if (question.trim()) {
      await onAskQuestion(
        question.trim(),
        imageData || undefined,
        fileName || undefined
      );
      setQuestion("");
      removeImage();
      setShowQuestionInput(false);
    }
  };

  const handleCancel = () => {
    setQuestion("");
    removeImage();
    clearError();
    setShowQuestionInput(false);
  };

  if (showQuestionInput) {
    return (
      <div
        className={`bg-slate-800 border border-slate-600 rounded-lg p-4 ${className}`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <label className="text-slate-300 text-sm mb-2 block font-medium">
              What are you confused about?
            </label>

            {/* Drag and drop zone overlay */}
            {isDragging && (
              <div className="absolute inset-0 top-8 bg-indigo-500/20 border-2 border-indigo-500 border-dashed rounded-lg flex items-center justify-center z-10 pointer-events-none">
                <p className="text-indigo-300 font-semibold text-sm">
                  Drop image here
                </p>
              </div>
            )}

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              placeholder="e.g., 'How does energy transfer between objects?', 'Why is this important?', 'Can you explain this more deeply?'"
              className={`w-full px-3 py-2.5 bg-slate-700 border rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all ${
                isDragging
                  ? "border-indigo-500 border-dashed"
                  : "border-slate-600"
              }`}
              rows={3}
              autoFocus
            />
          </div>

          {/* File input button */}
          <div className="flex items-center gap-2">
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
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded transition-colors flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
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
            <p className="text-xs text-slate-500">Optional</p>
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
            <div className="p-2 bg-red-900/20 border border-red-500/50 rounded text-xs text-red-400">
              {imageError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!question.trim()}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors font-semibold"
            >
              Generate Videos
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-slate-400 italic">
            AI will analyze your question and create 1-5 videos based on
            complexity.
          </p>
        </form>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-semibold ${className}`}
      title="Ask a question about this topic and get personalized video explanations"
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
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>Ask Question</span>
    </button>
  );
};
