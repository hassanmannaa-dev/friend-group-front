"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { animate } from "animejs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "@/lib/api"

// ---------------------------------------------
// Types & Mock Data
// ---------------------------------------------

type Character = {
  id: string
  name: string
  portraitSrc: string
  tileSrc: string
  accent?: string
}

// Real users data
interface User {
  _id: string
  firstName: string
  lastName: string
  avatarUrl: string
  fullName: string
}

const ACCENTS = ["#FF3B3B", "#FFD400", "#00D1FF", "#111111", "#FF7A00", "#7A00FF"]

const MANGA_IMAGES: string[] = [
  "https://picsum.photos/seed/panel1/420/600?grayscale",
  "https://picsum.photos/seed/panel2/420/600?grayscale",
  "https://picsum.photos/seed/panel3/420/600?grayscale",
  "https://picsum.photos/seed/panel4/420/600?grayscale",
]

// ---------------------------------------------
// Utils
// ---------------------------------------------

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(!!mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return reduced
}

// ---------------------------------------------
// Hooks: useMangaScroll, useCharacterSwap
// ---------------------------------------------

type MangaScrollOptions = {
  speedsMs?: number[]
}

function useMangaScroll(containerRef: React.RefObject<HTMLDivElement | null>, options?: MangaScrollOptions) {
  const animationRefs = useRef<ReturnType<typeof animate>[]>([])
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Stop any prior animations
    animationRefs.current.forEach((a) => a?.cancel())
    animationRefs.current = []

    const layerWrappers = Array.from(container.querySelectorAll<HTMLElement>("[data-manga-layer]"))
    if (layerWrappers.length === 0) return

    layerWrappers.forEach((layer, idx) => {
      const baseDuration = options?.speedsMs?.[idx % (options?.speedsMs.length || 1)] ?? 12000 + idx * 3000
      const duration = reduced ? Math.min(3000, baseDuration / 3) : baseDuration

      layer.style.transform = "translateY(0%)"

      const anim = animate(layer, {
        translateY: ["0%", "-100%"],
        duration,
        easing: "linear",
        loop: true,
        direction: "normal",
        endDelay: 0,
        autoplay: true,
        begin: () => {
          layer.style.transform = "translateY(0%)"
        },
        complete: () => {
          layer.style.transform = "translateY(0%)"
        },
      })
      animationRefs.current.push(anim)
    })

    return () => {
      animationRefs.current.forEach((a) => a?.cancel())
      animationRefs.current = []
    }
  }, [containerRef, options?.speedsMs, reduced])
}

type SwapConfig = {
  durationOut?: number
}

type SwapAnims = { out?: ReturnType<typeof animate> }

function useCharacterSwap(selectedId: string) {
  const outgoingRef = useRef<HTMLDivElement | null>(null)
  const incomingRef = useRef<HTMLDivElement | null>(null)
  const currentAnimating = useRef<SwapAnims>({})
  const reduced = usePrefersReducedMotion()

  const config: Required<SwapConfig> = {
    durationOut: reduced ? 120 : 240,
  }

  useEffect(() => {
    // Cancel any in-flight outgoing animation when selection changes
    currentAnimating.current.out?.cancel()
    currentAnimating.current = {}

    const outNode = outgoingRef.current

    if (outNode) {
      // Animate out: slide left ~ -40px + fade out (quick)
      outNode.style.willChange = "transform, opacity"
      const outAnim = animate(outNode, {
        translateX: [0, -40],
        opacity: [1, 0],
        duration: config.durationOut,
        easing: "easeOutQuad",
      })
      currentAnimating.current.out = outAnim
    }

    return () => {
      currentAnimating.current.out?.cancel()
      currentAnimating.current = {}
    }
  }, [selectedId, reduced])

  return { outgoingRef, incomingRef }
}

// ---------------------------------------------
// Components
// ---------------------------------------------

type SelectedPaneProps = {
  character: Character
  outgoingCharacter?: Character | null
  onOutgoingDone: () => void
  flashRef: React.RefObject<HTMLDivElement | null>
}

function SelectedPane({ character, outgoingCharacter, onOutgoingDone, flashRef }: SelectedPaneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { outgoingRef, incomingRef } = useCharacterSwap(character.id)
  const shineRef = useRef<HTMLDivElement | null>(null)
  const reduced = usePrefersReducedMotion()

  // Start layered manga scroll background
  useMangaScroll(containerRef, { speedsMs: [13000, 17000, 21000, 25000] })

  // When the outgoing animation is over, parent will unmount it by clearing outgoingCharacter
  useEffect(() => {
    if (!outgoingCharacter) return
    const timeout = setTimeout(onOutgoingDone, 260)
    return () => clearTimeout(timeout)
  }, [outgoingCharacter, onOutgoingDone])

  // Match login-3 incoming animation (flash + bounce-in + shine)
  useEffect(() => {
    const characterElement = incomingRef.current
    if (!characterElement) return

    // Initial reset
    characterElement.style.opacity = "0"
    characterElement.style.transform = "translateX(0px) scale(1)"

    if (!reduced && flashRef.current) {
      const flashElement = flashRef.current
      animate(flashElement, {
        translateX: ["-100%", "100%"],
        opacity: [0, 0.7, 0],
        duration: 200,
        easing: "easeOutQuad",
        begin: () => {
          flashElement.style.display = "block"
        },
        complete: () => {
          flashElement.style.display = "none"
        },
      })
    }

    // Character bounce-in from right
    animate(characterElement, {
      translateX: [200, 0],
      scale: [0.8, 1.1, 1],
      opacity: [0, 1],
      duration: reduced ? 200 : 600,
      easing: reduced ? "easeOutQuad" : "easeOutElastic(1, .8)",
      complete: () => {
        if (!reduced && shineRef.current) {
          const shine = shineRef.current
          animate(shine, {
            translateY: ["-100%", "100%"],
            opacity: [0, 0.6, 0],
            duration: 800,
            easing: "easeInOutQuad",
            begin: () => {
              shine.style.display = "block"
            },
            complete: () => {
              shine.style.display = "none"
            },
          })
        }
      },
    })
  }, [character.id, incomingRef, flashRef, reduced])

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#F7F3E8] border-[8px] border-black shadow-[12px_12px_0_0_#000]">
      {/* Background manga panels */}
      <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none">
        {MANGA_IMAGES.map((src, idx) => (
          <div
            key={idx}
            data-manga-layer
            className="absolute inset-0"
            style={{ zIndex: idx, transform: "translateY(0%)" }}
          >
            <img src={src} alt="manga layer" className="absolute w-full h-full object-cover" style={{ top: 0 }} />
            <img src={src} alt="manga layer clone" className="absolute w-full h-full object-cover" style={{ top: "100%" }} />
          </div>
        ))}
      </div>

      {/* Foreground selected character(s) */}
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        {/* Outgoing */}
        {outgoingCharacter ? (
          <div
            ref={outgoingRef}
            className="relative w-[70%] max-w-[520px] aspect-[4/5] border-[6px] border-black bg-white shadow-[10px_10px_0_0_#000]"
            aria-hidden
          >
            <img src={outgoingCharacter.portraitSrc} alt={outgoingCharacter.name} className="w-full h-full object-cover" />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 text-xl font-extrabold tracking-widest shadow-[6px_6px_0_0_#000] border-4 border-white">
              {outgoingCharacter.name}
            </div>
          </div>
        ) : null}

        {/* Incoming / Current */}
        <div
          key={character.id}
          ref={incomingRef}
          className="relative w-[70%] max-w-[520px] aspect-[4/5] border-[6px] border-black bg-white shadow-[10px_10px_0_0_#000]"
        >
          <img src={character.portraitSrc} alt={character.name} className="w-full h-full object-cover" />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 text-xl font-extrabold tracking-widest shadow-[6px_6px_0_0_#000] border-4 border-black">
            {character.name}
          </div>
          {/* Shine effect overlay */}
          <div
            ref={shineRef}
            className="absolute inset-0 pointer-events-none"
            style={{ display: "none", background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)", transform: "translateY(-100%)" }}
          />
        </div>
      </div>

      {/* Thick frame edge accents */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-0 right-0 h-[14px] bg-black" />
        <div className="absolute bottom-0 left-0 right-0 h-[14px] bg-black" />
        <div className="absolute top-0 bottom-0 left-0 w-[14px] bg-black" />
        <div className="absolute top-0 bottom-0 right-0 w-[14px] bg-black" />
      </div>
    </div>
  )
}

type RosterGridProps = {
  characters: Character[]
  selectedId: string
  onSelect: (id: string) => void
}

function RosterGrid({ characters, selectedId, onSelect }: RosterGridProps) {
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [focusIndex, setFocusIndex] = useState(0)

  // Hover preview animation using animejs
  const previewIn = (el: HTMLElement) => {
    animate(el, { scale: [1, 1.06], duration: 140, easing: "easeOutQuad" })
  }
  const previewOut = (el: HTMLElement) => {
    animate(el, { scale: [1.06, 1], duration: 120, easing: "easeOutQuad" })
  }

  const handleKey = (e: React.KeyboardEvent) => {
    const cols = 3
    const total = characters.length

    let next = focusIndex
    if (e.key === "ArrowRight") next = Math.min(total - 1, focusIndex + 1)
    else if (e.key === "ArrowLeft") next = Math.max(0, focusIndex - 1)
    else if (e.key === "ArrowDown") next = Math.min(total - 1, focusIndex + cols)
    else if (e.key === "ArrowUp") next = Math.max(0, focusIndex - cols)
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      const id = characters[focusIndex]?.id
      if (id) onSelect(id)
      return
    }

    if (next !== focusIndex) {
      e.preventDefault()
      setFocusIndex(next)
      tileRefs.current[next]?.focus()
    }
  }

  return (
    <div className="h-full w-full bg-[#0B5FFF] border-l-[12px] border-black p-4 md:p-6">
      <div className="mb-4">
        <div className="inline-block bg-black text-white px-4 py-2 text-2xl font-extrabold tracking-wider border-[6px] border-white shadow-[8px_8px_0_0_#000]">
          CHARACTER SELECT
        </div>
      </div>

      <div
        role="grid"
        aria-label="Character roster"
        tabIndex={0}
        onKeyDown={handleKey}
        className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
      >
        {characters.map((c, idx) => {
          const isSelected = c.id === selectedId
          return (
            <button
              key={c.id}
              ref={(el) => {
                tileRefs.current[idx] = el
              }}
              aria-label={`${c.name} select`}
              aria-pressed={isSelected}
              onClick={() => onSelect(c.id)}
              onMouseEnter={(e) => previewIn(e.currentTarget)}
              onMouseLeave={(e) => previewOut(e.currentTarget)}
              className="relative aspect-[3/4] border-[6px] border-black bg-white shadow-[8px_8px_0_0_#000] focus:outline-none focus:ring-4 focus:ring-black"
              style={{ boxShadow: isSelected ? "12px 12px 0 0 #000" : undefined }}
            >
              <img src={c.tileSrc} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
              <div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 text-sm font-extrabold border-[4px] border-black shadow-[6px_6px_0_0_#000]"
                style={{ backgroundColor: c.accent || "#FFD400" }}
              >
                {c.name}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------
// Page
// ---------------------------------------------

export default function Page() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [error, setError] = useState("")
  const flashRef = useRef<HTMLDivElement | null>(null)

  const characters: Character[] = useMemo(
    () =>
      users.map((u, idx) => ({
        id: u._id,
        name: `${u.firstName}`.toUpperCase(),
        portraitSrc: u.avatarUrl,
        tileSrc: u.avatarUrl,
        accent: ACCENTS[idx % ACCENTS.length],
      })),
    [users]
  )

  const [selectedId, setSelectedId] = useState<string>("")
  const [outgoingId, setOutgoingId] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [isLoadingLogin, setIsLoadingLogin] = useState(false)

  const selected = useMemo(() => characters.find((c) => c.id === selectedId) || null, [characters, selectedId])
  const outgoing = useMemo(() => (outgoingId ? characters.find((c) => c.id === outgoingId) || null : null), [characters, outgoingId])
  const selectedUser = useMemo(() => users.find((u) => u._id === selectedId) || null, [users, selectedId])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/users`)
        const data = await response.json()
        if (data.success) {
          setUsers(data.users)
          if (data.users.length > 0) setSelectedId(data.users[0]._id)
        } else {
          setError("Failed to load users")
        }
      } catch (e) {
        setError("Failed to load users")
      } finally {
        setIsLoadingUsers(false)
      }
    }
    fetchUsers()
  }, [])

  const handleSelect = (id: string) => {
    if (id === selectedId) return
    setOutgoingId(selectedId)
    setSelectedId(id)
    setPassword("")
  }

  const clearOutgoing = () => setOutgoingId(null)

  const handleLogin = async () => {
    if (!selectedUser || !password.trim()) {
      setError("Please enter a password")
      return
    }
    setIsLoadingLogin(true)
    setError("")
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: selectedUser.firstName, password }),
      })
      const data = await response.json()
      if (data.success && data.token) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        window.location.href = "/"
      } else {
        setError(data.message || "Login failed")
      }
    } catch (e) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoadingLogin(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin()
  }

  if (isLoadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#F2F2F2] text-black relative">
      {/* Flash swipe element */}
      <div ref={flashRef} className="fixed inset-0 bg-white opacity-0 pointer-events-none z-10" style={{ display: "none" }} />

      <div className="mx-auto max-w-7xl min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* Left: Selected area with thick frame */}
        <div className="relative p-4 md:p-8 bg-[#F2F2F2]">
          {selected ? (
            <SelectedPane character={selected} outgoingCharacter={outgoing} onOutgoingDone={clearOutgoing} flashRef={flashRef} />
          ) : (
            <div className="h-full w-full flex items-center justify-center">No user selected</div>
          )}
        </div>

        {/* Right: Roster grid + password */}
        <div className="relative">
          {/* Vertical division line */}
          <div className="absolute left-0 top-0 bottom-0 w-[12px] bg-black z-20" aria-hidden />
          <div className="flex flex-col h-full">
            <RosterGrid characters={characters} selectedId={selectedId} onSelect={handleSelect} />

            {/* Password Input Area */}
            {selectedUser && (
              <div className="bg-[#0B5FFF] border-t-[12px] border-black p-4 md:p-6">
                {error && (
                  <div className="bg-red-50 border-4 border-black text-red-700 px-4 py-3 shadow-[6px_6px_0_0_#000] mb-4 font-bold">
                    {error}
                  </div>
                )}
                <div className="max-w-sm">
                  <label htmlFor="password" className="block text-black font-extrabold mb-2">
                    PASSWORD
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Enter password for ${selectedUser.firstName}`}
                    className="w-full border-[4px] border-black shadow-[6px_6px_0_0_#000]"
                    autoFocus
                  />
                  <div className="flex gap-3 mt-4">
                    <Button
                      onClick={() => setPassword("")}
                      variant="neutral"
                      className="flex-1 border-[4px] border-black shadow-[6px_6px_0_0_#000]"
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={handleLogin}
                      disabled={isLoadingLogin || !password.trim()}
                      className="flex-1 border-[4px] border-black shadow-[6px_6px_0_0_#000]"
                    >
                      {isLoadingLogin ? "Signing in..." : "Sign In"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
