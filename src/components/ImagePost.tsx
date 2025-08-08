import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle } from 'lucide-react';
import { Post } from '@/lib/api';
import { apiService } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface ImagePostProps {
  post: Post;
  onLike?: (postId: string) => void;
}

export function ImagePost({ post, onLike }: ImagePostProps) {
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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handlePostClick}
    >
      <div className="aspect-square overflow-hidden">
        <img 
          src={post.mediaUrl} 
          alt={post.caption}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <CardHeader className="p-4">
        <div className="flex items-center space-x-3 mb-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={post.author.avatarUrl} alt={`${post.author.firstName} ${post.author.lastName}`} />
            <AvatarFallback className="text-xs">
              {post.author.firstName.charAt(0)}{post.author.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-sm font-semibold">
              {post.author.firstName} {post.author.lastName}
            </CardTitle>
            <CardDescription className="text-xs">
              {formatDate(post.createdAt)}
            </CardDescription>
          </div>
        </div>
        <CardTitle className="text-lg">{post.caption}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between text-gray-500">
          <div className="flex items-center space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              className="flex items-center space-x-1 hover:text-red-500 transition-colors"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-sm">{likeCount}</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/post/${post._id}`);
              }}
              className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{post.comments.length}</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 