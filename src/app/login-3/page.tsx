"use client"

import { useState, useEffect, useRef } from 'react'
import { animate } from 'animejs'
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselPrevious, 
  CarouselNext,
  type CarouselApi
} from '@/components/ui/carousel'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { API_BASE_URL } from '@/lib/api'
import Image from 'next/image'

interface User {
  _id: string
  firstName: string
  lastName: string
  avatarUrl: string
  fullName: string
}

interface LoginResponse {
  success: boolean
  message: string
  token?: string
  user?: User
}

export default function AnimeCharacterSelectPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>()
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  
  // Animation refs
  const flashRef = useRef<HTMLDivElement>(null)
  const characterRefs = useRef<(HTMLDivElement | null)[]>([])
  const shineRefs = useRef<(HTMLDivElement | null)[]>([])

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')

    if (token && user) {
      window.location.href = '/'
      return
    }

    fetchUsers()
  }, [])

  // Handle carousel navigation with anime.js animations
  useEffect(() => {
    if (!carouselApi) {
      return
    }

    const handleCarouselSelect = () => {
      const newIndex = carouselApi.selectedScrollSnap()
      const previousIndex = currentSlideIndex
      
      // Only animate if the slide actually changed
      if (newIndex !== previousIndex) {
        setCurrentSlideIndex(newIndex)
        triggerCharacterEnterAnimation(newIndex, newIndex > previousIndex ? 'right' : 'left')
      }
      
      // Clear selection when carousel changes slides
      if (selectedUser) {
        setSelectedUser(null)
        setPassword('')
        setError('')
      }
    }

    carouselApi.on('select', handleCarouselSelect)
    carouselApi.on('reInit', handleCarouselSelect)

    return () => {
      carouselApi.off('select', handleCarouselSelect)
      carouselApi.off('reInit', handleCarouselSelect)
    }
  }, [carouselApi, currentSlideIndex, selectedUser])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`)
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users)
        // Initialize character refs array
        characterRefs.current = new Array(data.users.length).fill(null)
        shineRefs.current = new Array(data.users.length).fill(null)
      } else {
        setError('Failed to load users')
      }
    } catch (error) {
      setError('Failed to load users')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const triggerCharacterEnterAnimation = (slideIndex: number, direction: 'left' | 'right') => {
    const characterElement = characterRefs.current[slideIndex]
    const shineElement = shineRefs.current[slideIndex]
    
    if (!characterElement || !flashRef.current) return

    // Reset character position before animation
    characterElement.style.opacity = '0'
    characterElement.style.transform = 'translateX(0px) scale(1)'

    // Flash swipe effect
    const flashElement = flashRef.current
    const fromX = direction === 'right' ? '-100%' : '100%'
    const toX = direction === 'right' ? '100%' : '-100%'
    
    animate(flashElement, {
      translateX: [fromX, toX],
      opacity: [0, 0.7, 0],
      duration: 200,
      easing: 'easeOutQuad',
      onBegin: () => {
        flashElement.style.display = 'block'
      },
      onComplete: () => {
        flashElement.style.display = 'none'
      }
    })

    // Character animation - starts immediately since carousel animation is disabled
    const startX = direction === 'right' ? 200 : -200
    
    animate(characterElement, {
      translateX: [startX, 0],
      scale: [0.8, 1.1, 1],
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutElastic(1, .8)',
      onComplete: () => {
        // Shine animation only triggers when character is perfectly centered
        if (shineElement) {
          animate(shineElement, {
            translateY: ['-100%', '100%'],
            opacity: [0, 0.6, 0],
            duration: 800,
            easing: 'easeInOutQuad',
            onBegin: () => {
              shineElement.style.display = 'block'
            },
            onComplete: () => {
              shineElement.style.display = 'none'
            }
          })
        }
      }
    })
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setPassword('')
    setError('')
    
    // Trigger selection animation
    const characterElement = characterRefs.current[currentSlideIndex]
    if (characterElement) {
      animate(characterElement, {
        scale: [1, 1.05, 1],
        duration: 400,
        easing: 'easeOutQuad'
      })
    }
  }

  const handleBackToUsers = () => {
    setSelectedUser(null)
    setPassword('')
    setError('')
  }

  const handleLogin = async () => {
    if (!selectedUser || !password.trim()) {
      setError('Please enter a password')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: selectedUser.firstName,
          password: password,
        }),
      })

      const data: LoginResponse = await response.json()

      if (data.success && data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        window.location.href = '/'
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (error) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  if (isLoadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading characters...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Flash swipe element */}
      <div 
        ref={flashRef}
        className="fixed inset-0 bg-white opacity-0 pointer-events-none z-10"
        style={{ display: 'none' }}
      />

      {/* Character name above */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          {users.length > 0 && users[currentSlideIndex] ? 
            `${users[currentSlideIndex].firstName} ${users[currentSlideIndex].lastName}` : 
            'Select Your Character'
          }
        </h1>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Character Carousel */}
      <div className="w-full max-w-md mb-8">
                <Carousel
          opts={{
            align: "center",
            loop: true,
            duration: 0, // Disable carousel's built-in animation completely
            dragFree: false,
            containScroll: "trimSnaps",
            skipSnaps: false,
            watchDrag: false // Disable swipe/drag interactions
          }}
          setApi={setCarouselApi}
          className="w-full"
        >
          <CarouselContent>
            {users.map((user, index) => (
              <CarouselItem key={user._id} className="basis-full">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleUserSelect(user)}
                    className="group relative focus:outline-none"
                  >
                    {/* Character container with animation ref */}
                    <div 
                      ref={(el) => { characterRefs.current[index] = el }}
                      className="relative w-64 h-64 overflow-hidden"
                    >
                      {/* Character image */}
                      <Image
                        src={user.avatarUrl}
                        alt={user.fullName}
                        fill
                        sizes="256px"
                        className="object-cover"
                        onErrorCapture={(e) => {
                          const target = e.target as HTMLElement;
                          if (target && target instanceof HTMLImageElement) {
                            (target as HTMLImageElement).style.display = 'none';
                          }
                        }}
                      />
                      
                      {/* Shine effect overlay */}
                      <div 
                        ref={(el) => { shineRefs.current[index] = el }}
                        className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent opacity-0 pointer-events-none"
                        style={{ 
                          display: 'none',
                          background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                          transform: 'translateY(-100%)'
                        }}
                      />
                    </div>
                  </button>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 sm:left-8" />
          <CarouselNext className="right-4 sm:right-8" />
        </Carousel>
      </div>

      {/* Password Input Area */}
      {selectedUser && (
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Enter Password for {selectedUser.firstName}
            </h3>
          </div>

          <div className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your password"
              className="w-full text-center"
              autoFocus
            />

            <div className="flex gap-3">
                             <Button
                 onClick={handleBackToUsers}
                 variant="neutral"
                 className="flex-1"
               >
                Back
              </Button>
              <Button
                onClick={handleLogin}
                disabled={isLoading || !password.trim()}
                className="flex-1"
              >
                {isLoading ? 'Entering...' : 'Enter'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
