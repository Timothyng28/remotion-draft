/**
 * ImagePreview.tsx
 *
 * Component to display uploaded image preview with remove functionality
 */

import React from "react";

interface ImagePreviewProps {
  imagePreview: string;
  fileName: string;
  onRemove: () => void;
  className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imagePreview,
  fileName,
  onRemove,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-600 rounded-lg ${className}`}
    >
      {/* Image thumbnail */}
      <div className="flex-shrink-0">
        <img
          src={imagePreview}
          alt="Preview"
          className="w-16 h-16 object-cover rounded border border-slate-500"
        />
      </div>

      {/* File name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{fileName}</p>
        <p className="text-xs text-slate-400">Image attached</p>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
        title="Remove image"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};
