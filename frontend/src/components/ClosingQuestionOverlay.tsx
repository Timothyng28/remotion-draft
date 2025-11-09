import { FC, useState } from "react";

interface ClosingQuestionOverlayProps {
  isOpen: boolean;
  topic: string;
  question?: string;
  isLoading?: boolean;
  error?: string;
  answer?: string;
  onAnswerChange?: (answer: string) => void;
  onRestart: () => void;
  onRetry?: () => void;
}

export const ClosingQuestionOverlay: FC<ClosingQuestionOverlayProps> = ({
  isOpen,
  topic,
  question,
  isLoading = false,
  error,
  answer = "",
  onAnswerChange,
  onRestart,
  onRetry,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl">
        <header className="mb-6">
          <p className="text-sm uppercase tracking-[0.35em] text-blue-400">
            Closing Reflection
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Before you go, think about this:
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-300">
            Topic: <span className="text-white font-medium">{topic}</span>
          </p>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
            <p className="text-slate-400">Gathering a thoughtful question just for you...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-8 text-center">
            <p className="text-base font-semibold text-red-300 mb-4">
              We couldn&apos;t generate a closing question this time.
            </p>
            <p className="text-sm text-red-200/80 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={onRestart}
                className="rounded-xl border border-slate-700 px-6 py-3 text-base font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-600/60 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Start a New Lesson
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-8 shadow-inner">
              <p className="text-lg text-slate-300 mb-2">Final Question</p>
              <h2 className="text-2xl font-semibold text-white leading-relaxed mb-6">
                {question || "What is one insight you want to carry forward from this lesson?"}
              </h2>
              
              <div className="mt-6">
                <label htmlFor="closing-answer" className="block text-sm font-medium text-slate-300 mb-2">
                  Your Answer
                </label>
                <textarea
                  id="closing-answer"
                  value={answer}
                  onChange={(e) => onAnswerChange?.(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Take a moment to reflect on what you&apos;ve learned.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center justify-end gap-3 sm:flex-row">
              <button
                onClick={onRestart}
                className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 focus:ring-offset-slate-900 sm:w-auto"
              >
                Start a New Lesson
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

