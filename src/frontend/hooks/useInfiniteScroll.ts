import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for implementing infinite scroll
 *
 * Features:
 * - Uses Intersection Observer API for efficient scroll detection
 * - Triggers fetchMore when user scrolls to bottom 200px
 * - Handles loading state during fetch
 * - Maintains scroll position
 *
 * @param fetchMore - Callback to fetch more items
 * @param hasMore - Whether there are more items to load
 * @param isLoading - Whether currently loading items
 * @returns Object with sentinel ref to observe
 */
export const useInfiniteScroll = (
  fetchMore: () => void,
  hasMore: boolean,
  isLoading: boolean
) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  /**
   * Intersection Observer callback
   */
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      // If sentinel is visible and we have more items and not loading, fetch more
      if (entry.isIntersecting && hasMore && !isLoading) {
        fetchMore();
      }
    },
    [fetchMore, hasMore, isLoading]
  );

  /**
   * Set up Intersection Observer
   */
  useEffect(() => {
    // Create observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null, // viewport
      rootMargin: '200px', // Trigger 200px before reaching the bottom
      threshold: 0.1,
    });

    // Observe sentinel element
    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observerRef.current.observe(currentSentinel);
    }

    // Cleanup
    return () => {
      if (observerRef.current && currentSentinel) {
        observerRef.current.unobserve(currentSentinel);
      }
    };
  }, [handleIntersection]);

  return {
    sentinelRef,
  };
};
