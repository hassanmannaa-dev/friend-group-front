import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/app/components/ui/avatar';
import { Heart, MessageCircle, Play } from 'lucide-react';
import { Post } from '@/lib/api';
import { apiService } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface VideoPostProps {
  post: Post;
  onLike?: (postId: string) => void;
}

// Helper function to detect YouTube URLs and extract video ID
const getYouTubeVideoId = (url: string): string | null => {
  console.log(url);
  // Handle the specific format: https://youtu.be/embed/VIDEO_ID
  if (url.includes('youtu.be/embed/')) {
    const videoId = url.split('youtu.be/embed/')[1];
    return videoId && videoId.length === 11 ? videoId : null;
  }
  
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(youtubeRegex);
  return match ? match[1] : null;
};

const isYouTubeUrl = (url: string): boolean => {
  return getYouTubeVideoId(url) !== null;
};

export function VideoPost({ post, onLike }: VideoPostProps) {
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

  const renderVideoContent = () => {
    console.log(post.mediaUrl);
    if (!post.mediaUrl) {
      return (
        <div className="relative aspect-video overflow-hidden bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500">No video available</span>
        </div>
      );
    }

    if (isYouTubeUrl(post.mediaUrl)) {
      const videoId = getYouTubeVideoId(post.mediaUrl);
      if (!videoId) {
        return (
          <div className="relative aspect-video overflow-hidden bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">Invalid YouTube URL</span>
          </div>
        );
      }
      return (
        <div className="relative aspect-video overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-full"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-20 transition-all pointer-events-none">
            <Play className="w-16 h-16 text-white opacity-80" />
          </div>
        </div>
      );
    }

         return (
       <div className="relative aspect-video overflow-hidden">
         <video 
           src={post.mediaUrl} 
           className="w-full h-full object-contain max-h-96"
           poster={post.mediaUrl}
           preload="metadata"
         />
         <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-20 transition-all">
           <Play className="w-16 h-16 text-white opacity-80" />
         </div>
       </div>
     );
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handlePostClick}
    >
      {renderVideoContent()}
      
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