"use client"

import { useState } from 'react'

export default function Marquee({ items }: { items: string[] }) {
  const [isVisible, setIsVisible] = useState(true)

  const handleClick = () => {
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div 
      className="relative w-full max-w-screen overflow-hidden border-b-2 border-t-2 border-border bg-secondary-background text-foreground font-base cursor-pointer hover:opacity-80 transition-opacity"
      style={{ maxWidth: '100vw' }}
      onClick={handleClick}
    >
      <div className="animate-marquee whitespace-nowrap py-1 sm:py-2 md:py-3 lg:py-4 xl:py-6">
        {items.map((item) => {
          return (
            <span key={item} className="mx-1 sm:mx-2 md:mx-3 lg:mx-4 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl inline-block">
              {item}
            </span>
          )
        })}
      </div>

      <div className="absolute top-0 animate-marquee2 whitespace-nowrap py-1 sm:py-2 md:py-3 lg:py-4 xl:py-6">
        {items.map((item) => {
          return (
            <span key={item} className="mx-1 sm:mx-2 md:mx-3 lg:mx-4 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl inline-block">
              {item}
            </span>
          )
        })}
      </div>

      {/* must have both of these in order to work */}
    </div>
  )
}
