/**
 * NodeCarousel.tsx
 *
 * Horizontal carousel showing video nodes as thumbnails.
 * Similar to PowerPoint slide editor - current node centered when possible.
 */

import { useEffect, useRef, useState } from "react";
import {
  getChildren,
  getCurrentNode,
  getPathFromRoot,
} from "../types/TreeState";
import { LearningTree } from "../types/VideoConfig";

interface NodeCarouselProps {
  tree: LearningTree;
  onNodeClick: (nodeId: string) => void;
  className?: string;
}

/**
 * Carousel component showing nodes as thumbnails
 */
export const NodeCarousel: React.FC<NodeCarouselProps> = ({
  tree,
  onNodeClick,
  className = "",
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentNodeRef = useRef<HTMLDivElement>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Get all nodes in a linear sequence for the carousel
  const getCarouselNodes = () => {
    const currentNode = getCurrentNode(tree);
    if (!currentNode) return [];

    // Get path from root to current (in order)
    const pathNodes = getPathFromRoot(tree, currentNode.id);

    // Get children of current node
    const children = getChildren(tree, currentNode.id);

    // Combine: path + children (showing what came before and what's next)
    const carouselNodes = [...pathNodes, ...children];

    // Remove duplicates while preserving order
    const seen = new Set<string>();
    return carouselNodes.filter((node) => {
      if (seen.has(node.id)) return false;
      seen.add(node.id);
      return true;
    });
  };

  const nodes = getCarouselNodes();
  const currentNode = getCurrentNode(tree);

  // Auto-scroll to center current node
  useEffect(() => {
    if (currentNodeRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const currentElement = currentNodeRef.current;

      // Calculate scroll position to center the current node
      const containerWidth = container.offsetWidth;
      const elementLeft = currentElement.offsetLeft;
      const elementWidth = currentElement.offsetWidth;

      // Center the element
      const scrollPosition =
        elementLeft - containerWidth / 2 + elementWidth / 2;

      container.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  }, [currentNode?.id]);

  const handleImageError = (nodeId: string) => {
    setImageErrors((prev) => new Set(prev).add(nodeId));
  };

  if (nodes.length === 0) {
    return null;
  }

  return (
    <>
      <style>{`
        .node-carousel-scroll::-webkit-scrollbar {
          height: 8px;
        }
        .node-carousel-scroll::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 4px;
        }
        .node-carousel-scroll::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }
        .node-carousel-scroll::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
      <div
        className={`bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden ${className}`}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-medium">
            Timeline ({nodes.length} {nodes.length === 1 ? "node" : "nodes"})
          </div>
          <div className="text-xs text-slate-500">Scroll to navigate</div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollContainerRef}
          className="node-carousel-scroll flex gap-3 p-3 overflow-x-auto"
          style={{
            scrollbarWidth: "thin",
          }}
        >
          {nodes.map((node, index) => {
            const isCurrent = node.id === currentNode?.id;
            const isQuestionNode = node.segment.isQuestionNode || false;
            const hasThumbnail =
              node.segment.thumbnailUrl && !imageErrors.has(node.id);
            const nodeNumber = index + 1;

            return (
              <div
                key={node.id}
                ref={isCurrent ? currentNodeRef : null}
                onClick={() => onNodeClick(node.id)}
                className={`flex-shrink-0 cursor-pointer transition-all duration-200 ${
                  isCurrent
                    ? "transform scale-105"
                    : "hover:transform hover:scale-102"
                }`}
                style={{ width: "160px" }}
              >
                {/* Thumbnail Container */}
                <div
                  className={`relative rounded-lg overflow-hidden shadow-lg transition-all ${
                    isCurrent
                      ? isQuestionNode
                        ? "ring-4 ring-amber-400 shadow-amber-400/50"
                        : "ring-4 ring-blue-400 shadow-blue-400/50"
                      : isQuestionNode
                      ? "ring-2 ring-amber-500/50"
                      : "ring-2 ring-slate-600 hover:ring-slate-500"
                  }`}
                  style={{
                    aspectRatio: "16/9",
                    backgroundColor: isQuestionNode ? "#78350f" : "#1e293b",
                  }}
                >
                  {/* Thumbnail Image or Placeholder */}
                  {hasThumbnail ? (
                    <img
                      src={node.segment.thumbnailUrl}
                      alt={node.segment.title || `Node ${nodeNumber}`}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(node.id)}
                    />
                  ) : isQuestionNode ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-900/30 to-slate-900">
                      <div className="text-4xl">❓</div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-slate-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Current Indicator */}
                  {isCurrent && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                      Current
                    </div>
                  )}

                  {/* Question Badge */}
                  {isQuestionNode && !isCurrent && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                      Quiz
                    </div>
                  )}

                  {/* Node Number */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
                    <div className="text-white text-xs font-medium truncate">
                      #{nodeNumber}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="mt-1 px-1">
                  <div
                    className={`text-xs truncate ${
                      isCurrent
                        ? "text-blue-300 font-semibold"
                        : "text-slate-400"
                    }`}
                    title={node.segment.title || `Node ${nodeNumber}`}
                  >
                    {node.segment.title || `Node ${nodeNumber}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
