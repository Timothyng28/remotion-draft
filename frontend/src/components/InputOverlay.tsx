/**
 * InputOverlay.tsx
 * 
 * Contextual interaction overlay for the infinite learning experience.
 * - Shows question input when segment has a question
 * - Shows continue/new topic options when no question
 * - Handles loading states during generation and evaluation
 */

import { useState, FormEvent } from "react";
import { BranchButton } from "./BranchButton";

interface InputOverlayProps {
  hasQuestion: boolean;
  questionText?: string;
  isGenerating: boolean;
  isEvaluating: boolean;
  onAnswer: (answer: string) => void;
  onRequestNext: () => void;
  onNewTopic: (topic: string) => void;
  onReset: () => void;
  onAskQuestion: (question: string) => void;
  currentNodeNumber: string;
}

export const InputOverlay: React.FC<InputOverlayProps> = ({
  hasQuestion,
  questionText,
  isGenerating,
  isEvaluating,
  onAnswer,
  onRequestNext,
  onNewTopic,
  onReset,
  onAskQuestion,
  currentNodeNumber,
}) => {
  const [input, setInput] = useState("");
  const [showNewTopicInput, setShowNewTopicInput] = useState(false);
  const [newTopicValue, setNewTopicValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (hasQuestion && input.trim()) {
      onAnswer(input.trim());
      setInput("");
    }
  };

  const handleNewTopicSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (newTopicValue.trim()) {
      onNewTopic(newTopicValue.trim());
      setNewTopicValue("");
      setShowNewTopicInput(false);
    }
  };

  // Show loading state
  if (isGenerating || isEvaluating) {
    return (
      <div className="p-4">
        <div className="bg-slate-700/50 border border-slate-600 rounded-xl px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
            <span className="text-white text-sm">
              {isEvaluating ? 'Evaluating your answer...' : 'Generating next segment...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // New topic input mode
  if (showNewTopicInput) {
    return (
      <div className="p-4">
        <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-white text-base font-semibold mb-2">
              What do you want to learn about?
            </h3>
          </div>
          
          <form onSubmit={handleNewTopicSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={newTopicValue}
              onChange={(e) => setNewTopicValue(e.target.value)}
              placeholder="Enter a new topic..."
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newTopicValue.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Go
              </button>
              <button
                type="button"
                onClick={() => setShowNewTopicInput(false)}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Question mode - segment has a question
  if (hasQuestion && questionText) {
    return (
      <div className="p-4">
        <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-5">
          {/* Question */}
          <div className="mb-4">
            <h3 className="text-blue-400 text-xs font-semibold uppercase tracking-wide mb-2">
              Question
            </h3>
            <p className="text-white text-sm">
              {questionText}
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer..."
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isEvaluating}
            />
            <button
              type="submit"
              disabled={!input.trim() || isEvaluating}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Submit
            </button>
          </form>

          {/* Additional Actions */}
          <div className="mt-4 flex flex-col gap-3">
            {/* Branch Button */}
            <BranchButton
              onAskQuestion={onAskQuestion}
              disabled={isEvaluating || isGenerating}
            />
            
            <button
              onClick={() => setShowNewTopicInput(true)}
              className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Switch Topic
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No question mode - show continue/new topic options
  return (
    <div className="p-4">
      <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-5">
        <div className="flex flex-col gap-3">
          {/* Branch Button */}
          <BranchButton
            onAskQuestion={onAskQuestion}
            disabled={isGenerating}
          />
          
          <button
            onClick={() => setShowNewTopicInput(true)}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            New Topic
          </button>
        </div>
      </div>
    </div>
  );
};
