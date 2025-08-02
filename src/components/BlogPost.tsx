import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/app/components/ui/avatar';
import { Heart, MessageCircle } from 'lucide-react';
import { Post } from '@/lib/api';
import { apiService } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface BlogPostProps {
  post: Post;
  onLike?: (postId: string) => void;
}

export function BlogPost({ post, onLike }: BlogPostProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(apiService.hasUserLikedPost(post));
  const [likeCount, setLikeCount] = useState(post.likes.length);

  const handleLike = async () => {
    try {
      const response = await apiService.likePost(post._id);
      if (response.success && response.post) {
        setIsLiked(apiService.hasUserLikedPost(response.post));
        setLikeCount(response.post.likes.length);
        onLike?.(post._id);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handlePostClick = () => {
    router.push(`/post/${post._id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  return (
    <Card 
      className="mb-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handlePostClick}
    >
      <CardHeader>
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={post.author.avatarUrl} alt={`${post.author.firstName} ${post.author.lastName}`} />
            <AvatarFallback>
              {post.author.firstName.charAt(0)}{post.author.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">
              {post.author.firstName} {post.author.lastName}
            </CardTitle>
            <CardDescription className="text-sm">
              {formatDate(post.createdAt)}
            </CardDescription>
          </div>
        </div>
        <CardTitle className="text-xl mb-2">{post.caption}</CardTitle>
      </CardHeader>
      
      <CardContent>
        {post.content && (
          <div className="mb-4">
            <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
          </div>
        )}
        
        <div className="flex items-center justify-between text-gray-500">
          <div className="flex items-center space-x-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              className="flex items-center space-x-2 hover:text-red-500 transition-colors"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span>{likeCount}</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/post/${post._id}`);
              }}
              className="flex items-center space-x-2 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments.length}</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 