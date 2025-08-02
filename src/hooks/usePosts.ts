import { useState, useEffect } from 'react';
import { apiService, Post, PaginationInfo } from '@/lib/api';

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  refetch: () => void;
}

export function usePosts(type: 'image' | 'video' | 'blog'): UsePostsReturn {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPosts = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getPostsByType(type, page, 10);
      
      if (response.success && response.posts && response.pagination) {
        setPosts(response.posts);
        setPagination(response.pagination);
      } else {
        setError('Failed to fetch posts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(currentPage);
  }, [type, currentPage]);

  const refetch = () => {
    fetchPosts(currentPage);
  };

  return {
    posts,
    loading,
    error,
    pagination,
    currentPage,
    setCurrentPage,
    refetch,
  };
} 