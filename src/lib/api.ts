const API_BASE_URL = 'https://emaur-api-40d46b1fc5a5.herokuapp.com/api';

export interface Post {
  _id: string;
  type: 'image' | 'video' | 'blog';
  caption: string;
  content: string;
  mediaUrl?: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
  };
  likes: string[]; // Array of user IDs who liked the post
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
  };
  createdAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  posts?: T[];
  post?: T;
  comment?: T;
  pagination?: PaginationInfo;
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Utility function to get current user ID
  getCurrentUserId(): string | null {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user._id;
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  }

  // Utility function to check if current user has liked a post
  hasUserLikedPost(post: Post): boolean {
    const currentUserId = this.getCurrentUserId();
    return currentUserId ? post.likes.includes(currentUserId) : false;
  }

  async getPostsByType(type: 'image' | 'video' | 'blog', page: number = 1, limit: number = 10): Promise<ApiResponse<Post>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/type/${type}?page=${page}&limit=${limit}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  async getPostById(postId: string): Promise<ApiResponse<Post>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/${postId}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  async likePost(postId: string): Promise<ApiResponse<Post>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/${postId}/like`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }

  async addComment(postId: string, content: string): Promise<ApiResponse<Comment>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/${postId}/comments`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService(); 