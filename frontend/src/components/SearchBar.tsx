/**
 * SearchBar.tsx
 * 
 * Compact search input for semantic node search.
 * Can be placed in the main UI to allow quick searching.
 */

import { useCallback, useEffect, useState } from 'react';
import { LearningTree } from '../types/VideoConfig';
import { SearchResult, searchNodes } from '../services/searchService';

interface SearchBarProps {
  tree: LearningTree;
  onResultClick: (nodeId: string) => void;
  onExpandTreeView: () => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  tree,
  onResultClick,
  onExpandTreeView,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setError(null);

      const searchResult = await searchNodes(query, tree, 5);

      if (searchResult.success && searchResult.results) {
        setResults(searchResult.results);
        setShowResults(true);
      } else {
        setError(searchResult.error || 'Search failed');
        setResults([]);
      }

      setIsSearching(false);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, tree]);

  const handleResultClick = useCallback(
    (nodeId: string) => {
      onResultClick(nodeId);
      setQuery('');
      setShowResults(false);
      setResults([]);
    },
    [onResultClick]
  );

  const handleExpandClick = useCallback(() => {
    onExpandTreeView();
  }, [onExpandTreeView]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-bar-container')) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative search-bar-container ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search nodes... (e.g., 'how graphs work')"
          className="w-full bg-slate-700/80 text-white px-4 py-2 pr-10 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none placeholder-slate-400"
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
        />
        
        {/* Search Icon / Loading Spinner */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <svg
              className="animate-spin h-5 w-5 text-blue-400"
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
              className="h-5 w-5 text-slate-400"
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

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute top-full mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {error ? (
            <div className="px-4 py-3 text-red-400 text-sm">{error}</div>
          ) : results.length > 0 ? (
            <>
              {results.map((result) => (
                <button
                  key={result.nodeId}
                  onClick={() => handleResultClick(result.nodeId)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {result.segment.title || result.segment.topic}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {result.description}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-xs font-medium text-blue-400">
                      {(result.similarity * 100).toFixed(0)}%
                    </div>
                  </div>
                </button>
              ))}
              
              {/* View in Tree Explorer Button */}
              <button
                onClick={handleExpandClick}
                className="w-full px-4 py-2 text-center text-sm text-blue-400 hover:bg-slate-700 transition-colors"
              >
                View all in Tree Explorer →
              </button>
            </>
          ) : query.trim() && !isSearching ? (
            <div className="px-4 py-3 text-slate-400 text-sm">
              No results found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

