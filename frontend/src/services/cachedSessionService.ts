/**
 * cachedSessionService.ts
 * 
 * Service for loading pre-cached video sessions.
 * These sessions are pre-generated and stored in GCS (vid-gen-static/cached)
 * for instant loading when users click example topics.
 */

import { VideoSession } from '../types/VideoConfig';

/**
 * Map of topic names to their cached session files
 * Must match the topics in LandingPage.tsx
 * 
 * Cached sessions are now stored in GCS bucket for better scalability
 */
const CACHED_SESSIONS: Record<string, string> = {
  'Binary Search Trees': 'https://storage.googleapis.com/vid-gen-static/cached/binary-search-trees.json',
  'Photosynthesis': 'https://storage.googleapis.com/vid-gen-static/cached/photosynthesis.json',
  'Pythagoras Theorem': 'https://storage.googleapis.com/vid-gen-static/cached/pythagoras-theorem.json',
};

/**
 * Check if a topic has a pre-cached session available
 */
export function hasCachedSession(topic: string): boolean {
  return topic in CACHED_SESSIONS;
}

/**
 * Load a pre-cached session for a topic
 * Returns null if the session doesn't exist or fails to load
 */
export async function loadCachedSession(
  topic: string
): Promise<VideoSession | null> {
  const sessionPath = CACHED_SESSIONS[topic];
  
  if (!sessionPath) {
    console.log(`No cached session available for: ${topic}`);
    return null;
  }

  try {
    console.log(`Loading cached session from: ${sessionPath}`);
    const response = await fetch(sessionPath);
    
    if (!response.ok) {
      console.error(`Failed to load cached session: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // Deserialize the tree (Map objects need special handling)
    // Cached sessions store nodes as [[key, value], [key, value], ...]
    // We need to reconstruct the Map while preserving all segment properties
    const nodes = new Map<string, any>();
    
    for (const [nodeId, nodeData] of data.tree.nodes) {
      // Explicitly reconstruct node to ensure all segment properties are preserved
      nodes.set(nodeId, {
        id: nodeData.id,
        segment: {
          ...nodeData.segment,
          // Ensure embedding and description are explicitly copied if they exist
          embedding: nodeData.segment.embedding,
          description: nodeData.segment.description,
        },
        parentId: nodeData.parentId,
        childIds: nodeData.childIds,
        branchIndex: nodeData.branchIndex,
        branchLabel: nodeData.branchLabel,
      });
    }
    
    const tree = {
      nodes,
      rootIds: data.tree.rootIds,
      currentNodeId: data.tree.currentNodeId,
    };

    console.log(`✅ Loaded cached session for "${topic}"`);
    console.log(`   Nodes: ${tree.nodes.size}`);
    console.log(`   Root: ${tree.rootIds[0]}`);

    return {
      ...data,
      tree,
    };
  } catch (error) {
    console.error(`Error loading cached session for "${topic}":`, error);
    return null;
  }
}

/**
 * Get list of all topics that have cached sessions
 */
export function getCachedTopics(): string[] {
  return Object.keys(CACHED_SESSIONS);
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match a freeform question to one of the cached topics.
 * Returns the cached topic name if a match is found.
 */
export function matchQuestionToCachedTopic(question: string): string | null {
  const normalizedQuestion = normalizeText(question);
  if (!normalizedQuestion) {
    return null;
  }

  for (const topic of getCachedTopics()) {
    const normalizedTopic = normalizeText(topic);
    if (
      normalizedQuestion.includes(normalizedTopic) ||
      normalizedTopic.includes(normalizedQuestion)
    ) {
      return topic;
    }
  }

  return null;
}

