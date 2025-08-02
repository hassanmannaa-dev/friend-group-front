"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarImage, AvatarFallback } from '@/app/components/ui/avatar'
import { Button } from '@/app/components/ui/button'
import Marquee from '@/components/ui/marquee'
import { usePosts } from '@/hooks/usePosts'
import { ImagePost } from '@/components/ImagePost'
import { VideoPost } from '@/components/VideoPost'
import { BlogPost } from '@/components/BlogPost'
import { PostsPagination } from '@/components/PostsPagination'

interface User {
  _id: string
  firstName: string
  lastName: string
  avatarUrl: string
  fullName: string
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'blog'>('image')

  // Use the custom hook for each post type
  const imagePosts = usePosts('image')
  const videoPosts = usePosts('video')
  const blogPosts = usePosts('blog')

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (token && userData) {
      // User is logged in, parse user data
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        router.push('/login')
      }
    } else {
      // User is not logged in, redirect to login page
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // Redirect to login page
    router.push('/login')
  }

  const handleTabChange = (value: string) => {
    const tabMapping: Record<string, 'image' | 'video' | 'blog'> = {
      'images': 'image',
      'videos': 'video',
      'blogs': 'blog'
    }
    setActiveTab(tabMapping[value] || 'image')
  }

  const getCurrentPostsData = () => {
    switch (activeTab) {
      case 'image':
        return imagePosts
      case 'video':
        return videoPosts
      case 'blog':
        return blogPosts
      default:
        return imagePosts
    }
  }

  const currentPostsData = getCurrentPostsData()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const marqueeMessage = ["I", "LOVE", "YOU", "GUYS 🫂", "SO", "MUCH 💖", "!!!", "٩(ಥ_ಥ)۶", "!!!", "◕ ◡ ◕", "!!!", "☾˙❀‿❀˙☽", "!!!"]

  return (
    <div className="min-h-screen flex flex-col">
      <Marquee items={marqueeMessage} />
      
      <div className="max-w-6xl mx-auto flex-1 mt-10 mb-10">
        <div className="mb-8 flex flex-col items-center">
          <Avatar className="w-24 h-24 mb-4">
            <AvatarImage src={user.avatarUrl} alt={user.fullName} />
            <AvatarFallback className="text-2xl font-semibold">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <Button 
            onClick={handleLogout}
            variant="default"
            className="mt-2 cursor-pointer"
          >
            Logout
          </Button>
        </div>

        <Tabs defaultValue="images" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="images" className="cursor-pointer">Images</TabsTrigger>
            <TabsTrigger value="videos" className="cursor-pointer">Videos</TabsTrigger>
            <TabsTrigger value="blogs" className="cursor-pointer">Blogs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="images" className="mt-6">
            {currentPostsData.loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading images...</p>
                </div>
              </div>
            ) : currentPostsData.error ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-red-600">{currentPostsData.error}</p>
              </div>
            ) : currentPostsData.posts.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500 text-lg">No images found</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentPostsData.posts.map((post) => (
                    <ImagePost key={post._id} post={post} />
                  ))}
                </div>
                {currentPostsData.pagination && (
                  <PostsPagination
                    pagination={currentPostsData.pagination}
                    currentPage={currentPostsData.currentPage}
                    onPageChange={currentPostsData.setCurrentPage}
                  />
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="videos" className="mt-6">
            {currentPostsData.loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading videos...</p>
                </div>
              </div>
            ) : currentPostsData.error ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-red-600">{currentPostsData.error}</p>
              </div>
            ) : currentPostsData.posts.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500 text-lg">No videos found</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentPostsData.posts.map((post) => (
                    <VideoPost key={post._id} post={post} />
                  ))}
                </div>
                {currentPostsData.pagination && (
                  <PostsPagination
                    pagination={currentPostsData.pagination}
                    currentPage={currentPostsData.currentPage}
                    onPageChange={currentPostsData.setCurrentPage}
                  />
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="blogs" className="mt-6">
            {currentPostsData.loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading blogs...</p>
                </div>
              </div>
            ) : currentPostsData.error ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-red-600">{currentPostsData.error}</p>
              </div>
            ) : currentPostsData.posts.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500 text-lg">No blogs found</p>
              </div>
            ) : (
              <>
                <div className="max-w-2xl mx-auto">
                  {currentPostsData.posts.map((post) => (
                    <BlogPost key={post._id} post={post} />
                  ))}
                </div>
                {currentPostsData.pagination && (
                  <PostsPagination
                    pagination={currentPostsData.pagination}
                    currentPage={currentPostsData.currentPage}
                    onPageChange={currentPostsData.setCurrentPage}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <Marquee items={marqueeMessage} />
    </div>
  )
}
