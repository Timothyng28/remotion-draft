/**
 * TreeExplorer.tsx
 *
 * Full-screen modal for exploring the entire learning tree.
 * Features zoom, pan, drag, and node clicking for navigation.
 */

import {
  Background,
  Controls,
  Edge,
  Handle,
  MarkerType,
  Node,
  NodeMouseHandler,
  NodeProps,
  Panel,
  Position,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useState } from "react";
import { SearchResult, searchNodes } from "../services/searchService";
import {
  getAllNodes,
  getCurrentNode,
  getNodeNumber,
  getPathFromRoot,
} from "../types/TreeState";
import { LearningTree } from "../types/VideoConfig";
import "./TreeAnimations.css";

interface TreeExplorerProps {
  tree: LearningTree;
  onNodeClick: (nodeId: string) => void;
  onClose: () => void;
  isModal?: boolean; // If false, renders as full-screen component without modal overlay
}

/**
 * Custom node component for tree explorer with thumbnail and title
 */
const ExplorerNode = ({ data }: NodeProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Show thumbnail if available, otherwise show colored circle
  const hasThumbnail = (data as any).thumbnailUrl && !imageError;

  return (
    <div
      className="relative flex flex-col items-center gap-2"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        zIndex: 1,
        cursor: "pointer",
        pointerEvents: "all",
      }}
    >
      {/* Connection handles */}
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />

      {/* Node display - either thumbnail or circle */}
      <div className="relative" style={{ pointerEvents: "none" }}>
        {/* Yellow ring for question nodes - unclickable and always visible */}
        {(data as any).isQuestionNode && (
          <div
            className="absolute pointer-events-none rounded-lg"
            style={{
              inset: "-8px",
              border: "4px solid #fbbf24",
              boxShadow:
                "0 0 25px rgba(251, 191, 36, 0.95), inset 0 0 15px rgba(251, 191, 36, 0.3)",
              borderRadius: hasThumbnail ? "12px" : "50%",
              zIndex: 10,
            }}
          />
        )}

        {hasThumbnail ? (
          // Thumbnail image with node number overlay
          <div
            className="relative w-32 h-20 rounded-lg overflow-hidden shadow-lg"
            style={{
              border: (data as any).isQuestionNode
                ? "3px solid #f59e0b"
                : (data as any).isCurrent
                ? "3px solid #60a5fa"
                : `2px solid ${(data as any).borderColor || "#3b82f6"}`,
              boxShadow: (data as any).isQuestionNode
                ? "0 0 30px rgba(251, 191, 36, 0.8), 0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                : (data as any).isCurrent
                ? "0 0 30px rgba(59, 130, 246, 0.8), 0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            }}
          >
            <img
              src={(data as any).thumbnailUrl}
              alt={
                (data as any).title ||
                (data as any).topic ||
                "Section thumbnail"
              }
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              style={{ pointerEvents: "none" }}
            />
            {/* Node number badge on thumbnail */}
            <div
              className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md pointer-events-none"
              style={{ backgroundColor: (data as any).nodeColor || "#3b82f6" }}
            >
              {(data as any).nodeNumber}
            </div>
          </div>
        ) : (
          // Fallback to circle with number
          <div className="w-10 h-10 flex items-center justify-center font-bold text-xs">
            {(data as any).nodeNumber}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      {/* Title label below node - centered with text wrapping */}
      {((data as any).title || (data as any).topic) && (
        <div className="max-w-[160px] text-center pointer-events-none">
          <div className="text-xs text-white font-semibold bg-slate-900/80 px-2 py-1 rounded break-words">
            {(data as any).title || (data as any).topic}
          </div>
        </div>
      )}

      {/* Extended tooltip on hover with more details */}
      {showTooltip && (
        <div
          className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-slate-900/95 backdrop-blur-sm text-white text-sm px-4 py-3 rounded-lg pointer-events-none shadow-xl border border-slate-700/50 w-40"
          style={{ zIndex: 99999 }}
        >
          <div className="font-semibold text-blue-400">
            {(data as any).nodeNumber}
          </div>
          {(data as any).title && (
            <div className="text-sm font-medium mt-1">
              {(data as any).title}
            </div>
          )}
          {(data as any).topic &&
            (data as any).topic !== (data as any).title && (
              <div className="text-xs text-slate-300 mt-1">
                {(data as any).topic}
              </div>
            )}
          {(data as any).voiceoverScript && (
            <div className="text-xs text-slate-400 mt-2 max-h-20 overflow-y-auto">
              {(data as any).voiceoverScript?.substring(0, 150)}...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  explorerNode: ExplorerNode,
};

/**
 * Calculate bounding box for a set of positioned nodes
 */
function calculateTreeBounds(
  positions: Map<string, { x: number; y: number }>,
  nodeIds: string[]
): { minX: number; maxX: number; minY: number; maxY: number } {
  if (nodeIds.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const nodeId of nodeIds) {
    const pos = positions.get(nodeId);
    if (pos) {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    }
  }

  return { minX, maxX, minY, maxY };
}

/**
 * Get all node IDs belonging to a specific root tree
 */
function getNodesInTree(tree: LearningTree, rootId: string): string[] {
  const nodeIds: string[] = [];

  function traverse(nodeId: string) {
    nodeIds.push(nodeId);
    const node = tree.nodes.get(nodeId);
    if (node && node.childIds.length > 0) {
      node.childIds.forEach((childId) => traverse(childId));
    }
  }

  traverse(rootId);
  return nodeIds;
}

/**
 * Calculate hierarchical layout positions for multi-root trees
 * HORIZONTAL LAYOUT: left to right with vertical branching
 * Uses collision-aware positioning to place roots dynamically
 */
function calculateTreeLayout(tree: LearningTree) {
  const positions = new Map<string, { x: number; y: number }>();
  const verticalSpacing = 200; // Spacing between siblings (vertical branching)
  const horizontalSpacing = 280; // Space between levels (horizontal progression)
  const treeClearance = 400; // Minimum clearance between separate root trees (horizontal)

  // Traverse a single tree with HORIZONTAL layout (left to right)
  function traverseTree(
    rootId: string,
    offsetX: number,
    offsetY: number,
    targetMap: Map<string, { x: number; y: number }>
  ) {
    const levelWidth = new Map<number, number>();

    function traverse(
      nodeId: string,
      level: number,
      parentY: number,
      childIndex: number,
      totalSiblings: number
    ) {
      const currentWidth = levelWidth.get(level) || 0;
      levelWidth.set(level, currentWidth + 1);

      // HORIZONTAL LAYOUT: x is level (left to right), y is branching (vertical)
      const localOffsetY =
        (childIndex - (totalSiblings - 1) / 2) * verticalSpacing + parentY;

      targetMap.set(nodeId, {
        x: level * horizontalSpacing + offsetX, // X is the level (horizontal progression)
        y: localOffsetY + offsetY, // Y is the offset (vertical branching)
      });

      const node = tree.nodes.get(nodeId);
      if (node && node.childIds.length > 0) {
        node.childIds.forEach((childId, index) => {
          traverse(
            childId,
            level + 1,
            localOffsetY,
            index,
            node.childIds.length
          );
        });
      }
    }

    traverse(rootId, 0, 0, 0, 1);
  }

  // Get root IDs from the tree
  const rootIds = tree.rootIds || [];
  if (rootIds.length === 0) return positions;

  // First root at origin
  traverseTree(rootIds[0], 0, 0, positions);

  // Position remaining roots with collision avoidance (vertically stacked)
  for (let i = 1; i < rootIds.length; i++) {
    const rootId = rootIds[i];

    // Layout tree temporarily at origin to calculate its bounds
    const tempPositions = new Map<string, { x: number; y: number }>();
    traverseTree(rootId, 0, 0, tempPositions);
    const treeNodes = getNodesInTree(tree, rootId);
    const treeBounds = calculateTreeBounds(tempPositions, treeNodes);

    // Find safe position below all existing trees
    let safeY = 0;
    const existingNodeIds = Array.from(positions.keys());
    if (existingNodeIds.length > 0) {
      const existingBounds = calculateTreeBounds(positions, existingNodeIds);
      safeY = existingBounds.maxY + treeClearance + Math.abs(treeBounds.minY);
    }

    // Layout this tree at the safe position
    traverseTree(rootId, 0, safeY, positions);
  }

  return positions;
}

/**
 * Full-screen tree explorer modal
 */
export const TreeExplorer: React.FC<TreeExplorerProps> = ({
  tree,
  onNodeClick,
  onClose,
  isModal = true,
}) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(
    new Set()
  );

  // Build full tree visualization
  useEffect(() => {
    const allNodes = getAllNodes(tree);
    const currentNode = getCurrentNode(tree);
    const positions = calculateTreeLayout(tree);

    console.log("TreeExplorer: isModal =", isModal);

    // Color palette matching the mini view
    const nodeColors = [
      "#3b82f6",
      "#f59e0b",
      "#ec4899",
      "#8b5cf6",
      "#10b981",
      "#ef4444",
    ];

    const newNodes: Node[] = allNodes.map((treeNode) => {
      const isCurrent = treeNode.id === currentNode?.id;
      const nodeNumber = getNodeNumber(tree, treeNode.id);
      const position = positions.get(treeNode.id) || { x: 0, y: 0 };
      const isOnCurrentPath = currentNode
        ? getPathFromRoot(tree, currentNode.id).some(
            (n) => n.id === treeNode.id
          )
        : false;

      // Check if this is a question node
      const isQuestionNode = treeNode.segment.isQuestionNode || false;

      // Check if this node is highlighted from search
      const isHighlighted = highlightedNodeIds.has(treeNode.id);

      // Color logic: Question nodes are always yellow, current nodes are blue, others use branch colors
      const colorIndex = treeNode.branchIndex % nodeColors.length;
      let nodeColor = nodeColors[colorIndex];
      if (isQuestionNode) {
        nodeColor = "#fbbf24"; // Yellow for question nodes (always)
      } else if (isCurrent) {
        nodeColor = "#3b82f6"; // Blue for current video nodes
      } else if (isHighlighted) {
        nodeColor = "#10b981"; // Green for search results
      }

      // Determine if this node has a thumbnail
      const hasThumbnail = !!(treeNode.segment as any).thumbnailUrl;

      return {
        id: treeNode.id,
        type: "explorerNode",
        data: {
          nodeNumber: nodeNumber,
          topic: treeNode.segment.topic,
          title: (treeNode.segment as any).title,
          thumbnailUrl: (treeNode.segment as any).thumbnailUrl,
          voiceoverScript: treeNode.segment.voiceoverScript,
          nodeColor: nodeColor,
          borderColor: isQuestionNode
            ? "#f59e0b"
            : isCurrent
            ? "#60a5fa"
            : isHighlighted
            ? "#10b981"
            : nodeColor,
          isCurrent: isCurrent,
          isQuestionNode: isQuestionNode,
        },
        position,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          background: hasThumbnail ? "transparent" : nodeColor,
          color: "#fff",
          border:
            isQuestionNode && !hasThumbnail
              ? "3px solid #f59e0b"
              : isCurrent && !hasThumbnail
              ? "3px solid #60a5fa"
              : isHighlighted && !hasThumbnail
              ? "3px solid #10b981"
              : "none",
          borderRadius: hasThumbnail ? "0" : "50%",
          padding: "0",
          width: hasThumbnail ? "auto" : "40px",
          height: hasThumbnail ? "auto" : "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow:
            isQuestionNode && !hasThumbnail
              ? "0 0 30px rgba(251, 191, 36, 0.8)"
              : isCurrent && !hasThumbnail
              ? "0 0 30px rgba(59, 130, 246, 0.8)"
              : isHighlighted && !hasThumbnail
              ? "0 0 30px rgba(16, 185, 129, 0.8)"
              : !hasThumbnail
              ? "0 2px 8px rgba(0, 0, 0, 0.3)"
              : "none",
          cursor: "pointer",
          transition: "all 0.2s ease",
          opacity:
            isOnCurrentPath || isCurrent || isQuestionNode || isHighlighted
              ? 1
              : 0.7,
        },
        // Only allow dragging in modal mode; in graph page mode, prioritize clicking
        draggable: isModal,
      };
    });

    const newEdges: Edge[] = [];

    allNodes.forEach((treeNode) => {
      if (treeNode.childIds && treeNode.childIds.length > 0) {
        console.log(
          `Node ${treeNode.id} has ${treeNode.childIds.length} children:`,
          treeNode.childIds
        );

        treeNode.childIds.forEach((childId) => {
          const child = tree.nodes.get(childId);
          if (!child) {
            console.warn(`Child ${childId} not found in tree!`);
            return;
          }

          // Color based on child's branch
          const colorIndex = (child.branchIndex || 0) % nodeColors.length;
          const edgeColor = nodeColors[colorIndex];

          console.log(
            `Creating edge from ${treeNode.id} to ${childId}, color: ${edgeColor}`
          );

          newEdges.push({
            id: `edge-${treeNode.id}-to-${childId}`,
            source: treeNode.id,
            target: childId,
            type: "smoothstep",
            animated: false,
            style: {
              stroke: edgeColor,
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 12,
              height: 12,
              color: edgeColor,
            },
          });
        });
      }
    });

    console.log(
      "TreeExplorer - Total Nodes:",
      newNodes.length,
      "Total Edges:",
      newEdges.length
    );
    if (newEdges.length > 0) {
      console.log("Sample edges:", newEdges.slice(0, 3));
    }
    setNodes(newNodes);
    setEdges(newEdges);
  }, [
    tree,
    tree.currentNodeId,
    highlightedNodeIds,
    isModal,
    setNodes,
    setEdges,
  ]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      console.log("TreeExplorer: Node clicked!", node.id);
      event.stopPropagation();
      onNodeClick(node.id);
    },
    [onNodeClick]
  );

  const handleBackgroundClick = useCallback(() => {
    // Don't close on background click - only via close button
  }, []);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showResults) {
          setShowResults(false);
          setSearchQuery("");
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, showResults]);

  // Search handler with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      setHighlightedNodeIds(new Set());
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);

      const result = await searchNodes(searchQuery, tree, 10);

      if (result.success && result.results) {
        setSearchResults(result.results);
        setShowResults(true);

        // Highlight matching nodes in the visualization
        const matchingIds = new Set(result.results.map((r) => r.nodeId));
        setHighlightedNodeIds(matchingIds);
      } else {
        setSearchResults([]);
      }

      setIsSearching(false);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, tree]);

  const handleSearchResultClick = useCallback(
    (nodeId: string) => {
      onNodeClick(nodeId);
      setShowResults(false);
      setSearchQuery("");
      setHighlightedNodeIds(new Set());
    },
    [onNodeClick]
  );

  const containerClasses = isModal
    ? "fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm modal-fade"
    : "w-full h-full dot-bg";

  return (
    <div className={containerClasses}>
      <div className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          onPaneClick={handleBackgroundClick}
          fitView
          fitViewOptions={{ padding: 0.15, minZoom: 0.5, maxZoom: 1.5 }}
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={isModal}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnDrag={[1, 2]}
          selectionOnDrag={false}
          panOnScroll={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
        >
          <Background color="#1a1a1a" gap={20} size={1} />
          <style>{`
            .react-flow__node {
              z-index: 1 !important;
            }
            .react-flow__edge {
              z-index: 0 !important;
            }
            .react-flow__handle {
              z-index: 2 !important;
            }
          `}</style>
          <Controls
            style={{
              background: "#0f0f0f",
              border: "1px solid #2a2a2a",
              borderRadius: "8px",
            }}
          />

          {/* Header panel with title, search, and close button */}
          <Panel position="top-center">
            <div
              className="bg-slate-900/90 backdrop-blur-sm border border-slate-800/50 rounded-lg px-6 py-3 shadow-xl"
              style={{ minWidth: "700px", overflow: "visible" }}
            >
              <div
                className="flex items-center gap-4"
                style={{ overflow: "visible" }}
              >
                <h2 className="text-white text-lg font-semibold whitespace-nowrap">
                  Learning Path Explorer
                </h2>

                {/* Search Input */}
                <div
                  className="relative flex-shrink-0"
                  style={{ width: "350px", minWidth: "350px" }}
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search nodes..."
                    className="w-full bg-slate-800/80 text-white px-4 py-2 pr-10 rounded-lg border border-slate-700/50 focus:border-blue-500 focus:outline-none placeholder-slate-500 text-sm"
                    style={{ display: "block", minHeight: "40px" }}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isSearching ? (
                      <svg
                        className="animate-spin h-4 w-4 text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800/80 hover:bg-slate-800 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap border border-slate-700/50 hover:border-slate-600/70"
                >
                  Close (ESC)
                </button>
              </div>
            </div>
          </Panel>

          {/* Search Results Panel */}
          {showResults && searchResults.length > 0 && (
            <Panel position="top-right">
              <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-800/50 rounded-lg shadow-xl w-80 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-slate-800/50">
                  <div className="text-white font-semibold text-sm">
                    Search Results ({searchResults.length})
                  </div>
                </div>
                <div>
                  {searchResults.map((result) => (
                    <button
                      key={result.nodeId}
                      onClick={() => handleSearchResultClick(result.nodeId)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-800/60 transition-colors border-b border-slate-800/50 last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate">
                            {result.segment.title || result.segment.topic}
                          </div>
                          <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {result.description}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-xs font-medium text-green-400">
                          {(result.similarity * 100).toFixed(0)}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Panel>
          )}

          {/* Legend panel */}
          <Panel position="bottom-right">
            <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-800/50 rounded-lg px-4 py-3 text-sm">
              <div className="flex flex-col gap-2 text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500 border-2 border-blue-400"></div>
                  <span>Current Node</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-slate-600 border-2 border-slate-500"></div>
                  <span>Visited Node</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-slate-700 border-2 border-dashed border-slate-500"></div>
                  <span>Leaf Node</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500 border-2 border-green-400"></div>
                  <span>Search Match</span>
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};
