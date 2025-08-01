"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/app/components/ui/avatar'
import { Button } from '@/app/components/ui/button'
import Marquee from '@/components/ui/marquee'

// Mock data for images
const mockImages = [
  {
    id: 1,
    title: "Beautiful Sunset",
    description: "A stunning sunset over the mountains",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    date: "2024-01-15"
  },
  {
    id: 2,
    title: "Ocean Waves",
    description: "Peaceful ocean waves crashing on the shore",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
    date: "2024-01-10"
  },
  {
    id: 3,
    title: "Forest Path",
    description: "A serene forest path in autumn",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
    date: "2024-01-05"
  },
  {
    id: 4,
    title: "City Skyline",
    description: "Modern city skyline at night",
    url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
    date: "2024-01-01"
  }
]

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

        <Tabs defaultValue="images" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="blogs">Blogs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="images" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mockImages.map((image) => (
                <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square overflow-hidden">
                    <img 
                      src={image.url} 
                      alt={image.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{image.title}</CardTitle>
                    <CardDescription>{image.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-gray-500">{image.date}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="videos" className="mt-6">
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 text-lg">Videos content coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="blogs" className="mt-6">
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 text-lg">Blogs content coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Marquee items={marqueeMessage} />
    </div>
  )
}
