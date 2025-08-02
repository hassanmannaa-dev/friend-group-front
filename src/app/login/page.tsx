"use client"

import { useState, useEffect } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/app/components/ui/avatar'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import { cn } from '@/lib/utils'

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

export default function LoginPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')

    if (token && user) {
      // User is already logged in, redirect to origin URL (home page)
      window.location.href = '/'
      return
    }

    // Only fetch users if not already logged in
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('https://emaur-api-40d46b1fc5a5.herokuapp.com/api/auth/users')
      const data = await response.json()
      console.log(data)
      if (data.success) {
        setUsers(data.users)
      } else {
        setError('Failed to load users')
      }
    } catch (error) {
      setError('Failed to load users')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setPassword('')
    setError('')
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
      const response = await fetch('https://emaur-api-40d46b1fc5a5.herokuapp.com/api/auth/login', {
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
        // Store token in localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Redirect to origin URL (home page)
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
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-6xl w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {selectedUser ? 'Enter Password' : 'Choose Your Account'}
          </h2>
          <p className="text-gray-600">
            {selectedUser 
              ? `Sign in as ${selectedUser.firstName}`
              : 'Select your account to continue'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {!selectedUser ? (
          // User selection view
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-12">
              {users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleUserSelect(user)}
                  className="group flex flex-col items-center p-8 rounded-xl hover:bg-blue-50 transition-all duration-300 ease-in-out transform hover:scale-110 min-w-0 cursor-pointer"
                >
                  <Avatar className="w-24 h-24 mb-4 group-hover:scale-110 transition-transform duration-300 ease-in-out">
                    <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                    <AvatarFallback className="text-2xl font-semibold">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-lg font-medium text-gray-900 text-center group-hover:text-blue-600 transition-colors duration-300 truncate w-full">
                    {user.firstName} {user.lastName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Password input view
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <Avatar className="w-20 h-20 mb-4">
                <AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.fullName} />
                <AvatarFallback className="text-xl font-semibold">
                  {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedUser.firstName} {selectedUser.lastName}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  className="w-full"
                  autoFocus
                />
              </div>

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
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 