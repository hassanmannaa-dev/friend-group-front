"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { animate } from "animejs"
import Image from "next/image"
import { API_BASE_URL } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Animation constants (easy to tweak)
const HOVER_IN_MS = 140
const HOVER_OUT_MS = 120
const OUT_MS = 120
const IN_MS = 120
const IN_EASING = "easeOutExpo"
const START_TRANSLATE_X = 240
const PARALLAX_DURATIONS = [11000, 15000, 19000, 23000]

// Simple background layers (grayscale manga-style). Real data restriction applies to characters, not background.
const MANGA_SOURCES: string[] = [
  "https://picsum.photos/seed/panelA/900/1300?grayscale",
  "https://picsum.photos/seed/panelB/900/1300?grayscale",
  "https://picsum.photos/seed/panelC/900/1300?grayscale",
  "https://picsum.photos/seed/panelD/900/1300?grayscale",
]

type User = {
  _id: string
  firstName: string
  lastName: string
  avatarUrl: string
}

type Character = {
  id: string
  name: string
  portraitSrc: string
  tileSrc: string
}

export default function Page() {
  // Auth gate (fail closed): If already logged-in, kick to home; otherwise proceed.
  const [authChecked, setAuthChecked] = useState(false)
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const user = typeof window !== "undefined" ? localStorage.getItem("user") : null
    if (token && user) {
      window.location.href = "/"
      return
    }
    setAuthChecked(true)
  }, [])

  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [error, setError] = useState("")

  // Accessibility: reduced motion
  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(!!mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  // Fetch characters (real data)
  useEffect(() => {
    if (!authChecked) return
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/users`)
        const data = await res.json()
        if (data?.success && Array.isArray(data.users)) {
          setUsers(data.users)
        } else {
          setError("Failed to load users")
        }
      } catch {
        setError("Failed to load users")
      } finally {
        setIsLoadingUsers(false)
      }
    }
    fetchUsers()
  }, [authChecked])

  const characters: Character[] = useMemo(
    () =>
      users.map((u) => ({
        id: u._id,
        name: u.firstName.toUpperCase(),
        portraitSrc: u.avatarUrl,
        tileSrc: u.avatarUrl,
      })),
    [users]
  )

  const [selectedId, setSelectedId] = useState<string>("")
  const [outgoingId, setOutgoingId] = useState<string | null>(null)
  useEffect(() => {
    if (characters.length && !selectedId) setSelectedId(characters[0].id)
  }, [characters, selectedId])

  const selected = useMemo(() => characters.find((c) => c.id === selectedId) || null, [characters, selectedId])
  const outgoing = useMemo(() => (outgoingId ? characters.find((c) => c.id === outgoingId) || null : null), [characters, outgoingId])

  // Refs: selected node (incoming/current), outgoing node, and background container
  const selectedRef = useRef<HTMLDivElement | null>(null)
  const outgoingRef = useRef<HTMLDivElement | null>(null)
  const bgRef = useRef<HTMLDivElement | null>(null)

  // Track all background anime instances for cleanup
  const bgAnimsRef = useRef<ReturnType<typeof animate>[]>([])

  // Initialize/refresh layered vertical scroll background
  useEffect(() => {
    const container = bgRef.current
    if (!container) return

    // cleanup any existing animations
    bgAnimsRef.current.forEach((a) => a?.cancel())
    bgAnimsRef.current = []

    // Respect reduced motion: pause background loop entirely
    if (reducedMotion) return

    const layers = Array.from(container.querySelectorAll<HTMLElement>("[data-manga-layer]"))

    layers.forEach((layer, idx) => {
      // position start
      layer.style.transform = "translateY(0%)"
      const duration = PARALLAX_DURATIONS[idx % PARALLAX_DURATIONS.length]
      const anim = animate(layer, {
        translateY: ["0%", "-100%"],
        duration,
        easing: "linear",
        loop: true,
        autoplay: true,
        begin: () => {
          layer.style.transform = "translateY(0%)"
        },
        complete: () => {
          // recycle to bottom
          layer.style.transform = "translateY(0%)"
        },
      })
      bgAnimsRef.current.push(anim)
    })

    return () => {
      bgAnimsRef.current.forEach((a) => a?.cancel())
      bgAnimsRef.current = []
    }
  }, [reducedMotion, characters.length])

  // Selection handler (hover preview handled inline below)
  const handleSelect = (id: string) => {
    if (id === selectedId) return
    setOutgoingId(selectedId || null)
    setSelectedId(id)
  }

  // After a short delay, remove outgoing
  useEffect(() => {
    if (!outgoingId) return
    const timeout = setTimeout(() => setOutgoingId(null), Math.max(OUT_MS, 120) + 20)
    return () => clearTimeout(timeout)
  }, [outgoingId])

  // Animate out the previous character
  useEffect(() => {
    const node = outgoingRef.current
    if (!node) return
    const duration = reducedMotion ? Math.max(OUT_MS / 2, 80) : OUT_MS
    node.style.willChange = "transform, opacity"
    const anim = animate(node, {
      translateX: [0, -40],
      opacity: [1, 0],
      duration,
      easing: "easeOutQuad",
    })
    return () => {
      try { anim.cancel() } catch {}
    }
  }, [outgoingId, reducedMotion])

  // Animate in the selected character (snap-fast sweep from right)
  useEffect(() => {
    const node = selectedRef.current
    if (!node) return
    const duration = reducedMotion ? Math.max(IN_MS / 2, 80) : IN_MS

    // immediate mount style
    node.style.opacity = "0"
    node.style.transform = `translateX(${START_TRANSLATE_X}px)`
    node.style.willChange = "transform, opacity"

    const anim = animate(node, {
      translateX: [START_TRANSLATE_X, 0],
      opacity: [0, 1],
      duration,
      easing: IN_EASING,
    })
    return () => {
      try { anim.cancel() } catch {}
    }
  }, [selectedId, reducedMotion])

  // Hover emphasis helpers (animejs only)
  const previewIn = (el: HTMLElement) => {
    const duration = reducedMotion ? Math.max(HOVER_IN_MS / 2, 80) : HOVER_IN_MS
    animate(el, { scale: [1, 1.05], borderWidth: ["6px", "8px"], duration, easing: "easeOutQuad" })
  }
  const previewOut = (el: HTMLElement) => {
    const duration = reducedMotion ? Math.max(HOVER_OUT_MS / 2, 80) : HOVER_OUT_MS
    animate(el, { scale: [1.05, 1], borderWidth: ["8px", "6px"], duration, easing: "easeOutQuad" })
  }

  // Minimal password input to complete login flow (real auth)
  const [password, setPassword] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const selectedUser = useMemo(() => users.find((u) => u._id === selectedId) || null, [users, selectedId])

  const handleLogin = async () => {
    if (!selectedUser || !password.trim()) {
      setError("Please enter a password")
      return
    }
    setIsLoggingIn(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: selectedUser.firstName, password }),
      })
      const data = await res.json()
      if (data?.success && data?.token) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        window.location.href = "/"
      } else {
        setError(data?.message || "Login failed")
      }
    } catch {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Loading states
  if (!authChecked || isLoadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-2 text-gray-600">Loading characters...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#F2F2F2] text-black relative">
      {/* Grid layout */}
      <div className="mx-auto max-w-7xl min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* Left: Selected Pane with thick frame and manga background */}
        <div className="relative p-4 md:p-8">
          <div className="relative h-full w-full overflow-hidden bg-[#F7F3E8] border-[8px] border-black shadow-[12px_12px_0_0_#000]">
            {/* Background layered scroll */}
            <div ref={bgRef} className="absolute inset-0 z-0 pointer-events-none">
              {MANGA_SOURCES.map((src, idx) => (
                <div key={idx} data-manga-layer className="absolute inset-0" style={{ zIndex: idx, transform: "translateY(0%)" }}>
                  <Image src={src} alt="manga layer" fill sizes="100vw" className="object-cover" style={{ top: 0 }} />
                  <Image src={src} alt="manga layer clone" fill sizes="100vw" className="object-cover" style={{ top: "100%" }} />
                </div>
              ))}
            </div>

            {/* Outgoing (quick fade/slide left) */}
            {outgoing && (
              <div
                ref={outgoingRef}
                className="absolute inset-0 z-10 flex items-center justify-center"
                aria-hidden
              >
                <div className="relative w-[72%] max-w-[560px] aspect-[4/5] border-[6px] border-black bg-white shadow-[10px_10px_0_0_#000]">
                  <Image src={outgoing.portraitSrc} alt={outgoing.name} fill sizes="(max-width: 560px) 70vw, 560px" className="object-cover" />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 text-xl font-extrabold tracking-widest shadow-[6px_6px_0_0_#000] border-4 border-white">
                    {outgoing.name}
                  </div>
                </div>
              </div>
            )}

            {/* Selected (fast sweep-in from right) */}
            {selected ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div
                  ref={selectedRef}
                  className="relative w-[72%] max-w-[560px] aspect-[4/5] border-[6px] border-black bg-white shadow-[10px_10px_0_0_#000]"
                  style={{ opacity: 0, transform: `translateX(${START_TRANSLATE_X}px)` }}
                >
                  <Image src={selected.portraitSrc} alt={selected.name} fill sizes="(max-width: 560px) 70vw, 560px" className="object-cover" />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 text-xl font-extrabold tracking-widest shadow-[6px_6px_0_0_#000] border-4 border-black">
                    {selected.name}
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-lg">No user selected</div>
            )}

            {/* Thick frame accents (neobrutalist feel) */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <div className="absolute top-0 left-0 right-0 h-[14px] bg-black" />
              <div className="absolute bottom-0 left-0 right-0 h-[14px] bg-black" />
              <div className="absolute top-0 bottom-0 left-0 w-[14px] bg-black" />
              <div className="absolute top-0 bottom-0 right-0 w-[14px] bg-black" />
            </div>
          </div>
        </div>

        {/* Right: Roster grid on solid blue with chunky frames + title */}
        <div className="relative">
          {/* Vertical divider */}
          <div className="absolute left-0 top-0 bottom-0 w-[12px] bg-black z-20" aria-hidden />

          <div className="flex flex-col h-full bg-[#0B5FFF] border-l-[12px] border-black p-4 md:p-6">
            <div className="mb-4">
              <div className="inline-block bg-black text-white px-4 py-2 text-2xl font-extrabold tracking-wider border-[6px] border-white shadow-[8px_8px_0_0_#000]">
                CHARACTER SELECT
              </div>
            </div>

            <div
              role="grid"
              aria-label="Character roster"
              tabIndex={0}
              onKeyDown={(e) => {
                const cols = 3
                const total = characters.length
                const currentIndex = Math.max(0, characters.findIndex((c) => c.id === selectedId))
                let next = currentIndex
                if (e.key === "ArrowRight") next = Math.min(total - 1, currentIndex + 1)
                else if (e.key === "ArrowLeft") next = Math.max(0, currentIndex - 1)
                else if (e.key === "ArrowDown") next = Math.min(total - 1, currentIndex + cols)
                else if (e.key === "ArrowUp") next = Math.max(0, currentIndex - cols)
                else if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  if (selectedId) handleSelect(selectedId)
                  return
                }
                if (next !== currentIndex) {
                  e.preventDefault()
                  handleSelect(characters[next]?.id)
                }
              }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
            >
              {characters.map((c) => {
                const isSelected = c.id === selectedId
                return (
                  <button
                    key={c.id}
                    aria-label={`${c.name} select`}
                    aria-pressed={isSelected}
                    onClick={() => handleSelect(c.id)}
                    onMouseEnter={(e) => previewIn(e.currentTarget)}
                    onMouseLeave={(e) => previewOut(e.currentTarget)}
                    className="relative aspect-[3/4] border-[6px] border-black bg-white shadow-[8px_8px_0_0_#000] focus:outline-none focus:ring-4 focus:ring-black"
                    style={{ boxShadow: isSelected ? "12px 12px 0 0 #000" : undefined }}
                  >
                    <Image src={c.tileSrc} alt={c.name} fill sizes="33vw" className="absolute inset-0 object-cover" />
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 text-sm font-extrabold border-[4px] border-black shadow-[6px_6px_0_0_#000] bg-yellow-400">
                      {c.name}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Password input area */}
            {selectedUser && (
              <div className="mt-6 border-t-[12px] border-black pt-4">
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLogin()
                    }}
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
                      disabled={isLoggingIn || !password.trim()}
                      className="flex-1 border-[4px] border-black shadow-[6px_6px_0_0_#000]"
                    >
                      {isLoggingIn ? "Signing in..." : "Sign In"}
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
