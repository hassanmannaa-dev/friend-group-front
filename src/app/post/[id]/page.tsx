"use client"

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/app/components/ui/avatar';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Heart, MessageCircle, ArrowLeft, Send } from 'lucide-react';
import { Post, Comment, apiService } from '@/lib/api';

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const postId = params.id as string;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await apiService.getPostById(postId);
        
        if (response.success && response.post) {
          setPost(response.post);
          setLikeCount(response.post.likes.length);
          setIsLiked(apiService.hasUserLikedPost(response.post));
        } else {
          setError('Post not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const handleLike = async () => {
    if (!post) return;
    
    try {
      const response = await apiService.likePost(post._id);
      if (response.success && response.post) {
        setIsLiked(apiService.hasUserLikedPost(response.post));
        setLikeCount(response.post.likes.length);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async () => {
    if (!post || !newComment.trim()) return;
    
    try {
      setSubmittingComment(true);
      const response = await apiService.addComment(post._id, newComment);
      
      if (response.success && response.comment) {
        // Refresh the post to get updated comments
        const postResponse = await apiService.getPostById(post._id);
        if (postResponse.success && postResponse.post) {
          setPost(postResponse.post);
        }
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Post not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Post Content */}
        <Card className="mb-6">
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
                <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
              </div>
            </div>
            <CardTitle className="text-xl mb-2">{post.caption}</CardTitle>
          </CardHeader>
          
          <CardContent>
            {/* Media Content */}
            {post.type === 'image' && post.mediaUrl && (
              <div className="mb-4">
                <img 
                  src={post.mediaUrl} 
                  alt={post.caption}
                  className="w-full max-h-96 object-cover rounded-lg"
                />
              </div>
            )}
            
            {post.type === 'video' && post.mediaUrl && (
              <div className="mb-4">
                <video 
                  src={post.mediaUrl} 
                  controls
                  className="w-full max-h-96 object-cover rounded-lg"
                />
              </div>
            )}
            
            {post.type === 'blog' && post.content && (
              <div className="mb-4">
                <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-6 text-gray-500">
              <button
                onClick={handleLike}
                className="flex items-center space-x-2 hover:text-red-500 transition-colors"
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{likeCount}</span>
              </button>
              
              <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span>{post.comments.length}</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Comments ({post.comments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add Comment */}
            <div className="mb-6">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submittingComment}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {post.comments.map((comment: Comment) => (
                <div key={comment._id} className="flex space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.author.avatarUrl} alt={`${comment.author.firstName} ${comment.author.lastName}`} />
                    <AvatarFallback className="text-xs">
                      {comment.author.firstName.charAt(0)}{comment.author.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-sm">
                        {comment.author.firstName} {comment.author.lastName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))}
              
              {post.comments.length === 0 && (
                <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 