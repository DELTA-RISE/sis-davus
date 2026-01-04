import { useState, useEffect, useCallback, useRef } from "react";

interface UseInfiniteScrollOptions<T> {
  data: T[];
  pageSize?: number;
}

export function useInfiniteScroll<T>({ data, pageSize = 12 }: UseInfiniteScrollOptions<T>) {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialItems = data.slice(0, pageSize);
    setDisplayedItems(initialItems);
    setPage(1);
    setHasMore(data.length > pageSize);
  }, [data, pageSize]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    const endIndex = nextPage * pageSize;
    const newItems = data.slice(0, endIndex);
    setDisplayedItems(newItems);
    setPage(nextPage);
    setHasMore(endIndex < data.length);
  }, [data, page, pageSize]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  return { displayedItems, hasMore, loaderRef, loadMore };
}
