/**
 * searchService.ts
 * 
 * Service for semantic search using vector embeddings.
 * Enables searching for nodes by meaning rather than exact text matches.
 */

import { LearningTree, VideoSegment } from '../types/VideoConfig';
import { getAllNodes } from '../types/TreeState';

const MODAL_API_BASE = 'https://video-gen-2--main-video-generator-dev-embed-text.modal.run';

/**
 * Search result with node ID and similarity score
 */
export interface SearchResult {
  nodeId: string;
  segment: VideoSegment;
  similarity: number;
  description: string;
}

/**
 * Generate a description for a video segment using the backend API
 */
export async function generateNodeDescription(
  segment: VideoSegment
): Promise<{ success: boolean; description?: string; error?: string }> {
  try {
    const response = await fetch(
      'https://video-gen-2--main-video-generator-dev-generate-description.modal.run',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: segment.topic,
          title: segment.title,
          voiceover_script: segment.voiceoverScript,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating description:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Embed a single text using the backend API
 */
export async function embedText(
  text: string
): Promise<{ success: boolean; embedding?: number[]; error?: string }> {
  try {
    const response = await fetch(MODAL_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error embedding text:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Embed multiple texts using the backend batch API
 */
export async function embedBatch(
  texts: string[]
): Promise<{ success: boolean; embeddings?: number[][]; error?: string }> {
  try {
    const response = await fetch(
      'https://video-gen-2--main-video-generator-dev-embed-batch.modal.run',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ texts, batch_size: 32 }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error embedding batch:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate descriptions and embeddings for all nodes that don't have them
 */
export async function embedAllNodes(
  tree: LearningTree,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const allNodes = getAllNodes(tree);
    const nodesToEmbed = allNodes.filter(
      (node) => !node.segment.embedding || !node.segment.description
    );

    if (nodesToEmbed.length === 0) {
      console.log('All nodes already have embeddings');
      return { success: true };
    }

    console.log(`Embedding ${nodesToEmbed.length} nodes...`);

    // Step 1: Generate descriptions for nodes that don't have them
    for (let i = 0; i < nodesToEmbed.length; i++) {
      const node = nodesToEmbed[i];
      
      if (!node.segment.description) {
        if (onProgress) onProgress(i + 1, nodesToEmbed.length);
        
        const result = await generateNodeDescription(node.segment);
        if (result.success && result.description) {
          node.segment.description = result.description;
        } else {
          // Use fallback description
          node.segment.description = node.segment.title || node.segment.topic;
        }
      }
    }

    // Step 2: Batch embed all descriptions
    const descriptions = nodesToEmbed.map(
      (node) => node.segment.description || node.segment.topic
    );
    
    const embedResult = await embedBatch(descriptions);
    
    if (!embedResult.success || !embedResult.embeddings) {
      throw new Error(embedResult.error || 'Failed to generate embeddings');
    }

    // Step 3: Attach embeddings to nodes
    for (let i = 0; i < nodesToEmbed.length; i++) {
      nodesToEmbed[i].segment.embedding = embedResult.embeddings[i];
    }

    console.log('Successfully embedded all nodes');
    return { success: true };
  } catch (error) {
    console.error('Error embedding nodes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Compute cosine similarity between two embeddings
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same dimension');
  }
  
  // Since embeddings are normalized, cosine similarity is just dot product
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  
  return dotProduct;
}

/**
 * Search for nodes semantically similar to a query
 */
export async function searchNodes(
  query: string,
  tree: LearningTree,
  topK: number = 5
): Promise<{ success: boolean; results?: SearchResult[]; error?: string }> {
  try {
    // Ensure all nodes have embeddings
    const allNodes = getAllNodes(tree);
    const nodesWithoutEmbeddings = allNodes.filter((node) => !node.segment.embedding);
    
    if (nodesWithoutEmbeddings.length > 0) {
      console.log(`Embedding ${nodesWithoutEmbeddings.length} nodes before search...`);
      const embedResult = await embedAllNodes(tree);
      if (!embedResult.success) {
        return { success: false, error: 'Failed to embed nodes' };
      }
    }

    // Embed the query
    const queryEmbedResult = await embedText(query);
    if (!queryEmbedResult.success || !queryEmbedResult.embedding) {
      return {
        success: false,
        error: queryEmbedResult.error || 'Failed to embed query',
      };
    }

    const queryEmbedding = queryEmbedResult.embedding;

    // Compute similarities for all nodes
    const results: SearchResult[] = [];
    
    for (const node of allNodes) {
      if (!node.segment.embedding) continue;
      
      const similarity = cosineSimilarity(queryEmbedding, node.segment.embedding);
      
      results.push({
        nodeId: node.id,
        segment: node.segment,
        similarity,
        description: node.segment.description || node.segment.title || node.segment.topic,
      });
    }

    // Sort by similarity (descending) and take top K
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, topK);

    return {
      success: true,
      results: topResults,
    };
  } catch (error) {
    console.error('Error searching nodes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Save embeddings to localStorage
 */
export function saveEmbeddingsToStorage(sessionId: string, tree: LearningTree): void {
  try {
    const allNodes = getAllNodes(tree);
    const embeddings: Record<string, { description?: string; embedding?: number[] }> = {};
    
    for (const node of allNodes) {
      if (node.segment.description || node.segment.embedding) {
        embeddings[node.id] = {
          description: node.segment.description,
          embedding: node.segment.embedding,
        };
      }
    }
    
    localStorage.setItem(
      `node_embeddings_${sessionId}`,
      JSON.stringify(embeddings)
    );
    
    console.log(`Saved embeddings for ${Object.keys(embeddings).length} nodes`);
  } catch (error) {
    console.error('Error saving embeddings to localStorage:', error);
  }
}

/**
 * Load embeddings from localStorage
 */
export function loadEmbeddingsFromStorage(sessionId: string, tree: LearningTree): void {
  try {
    const stored = localStorage.getItem(`node_embeddings_${sessionId}`);
    if (!stored) return;
    
    const embeddings: Record<string, { description?: string; embedding?: number[] }> =
      JSON.parse(stored);
    
    const allNodes = getAllNodes(tree);
    let loadedCount = 0;
    
    for (const node of allNodes) {
      const nodeData = embeddings[node.id];
      if (nodeData) {
        if (nodeData.description) {
          node.segment.description = nodeData.description;
        }
        if (nodeData.embedding) {
          node.segment.embedding = nodeData.embedding;
        }
        loadedCount++;
      }
    }
    
    console.log(`Loaded embeddings for ${loadedCount} nodes from localStorage`);
  } catch (error) {
    console.error('Error loading embeddings from localStorage:', error);
  }
}

