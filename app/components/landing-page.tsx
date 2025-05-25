"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Github,
  Grid3X3,
  ArrowRight,
  Play,
  Zap,
  Code,
  Gamepad2,
  MapPin,
  Layers3,
  Palette,
  MousePointer,
  Users,
  Shield,
} from "lucide-react"

interface LandingPageProps {
  onLaunchStudio: () => void
  onConnectGitHub: () => void
  isAuthenticated?: boolean
  userProfile?: any
}

export default function LandingPage({
  onLaunchStudio,
  onConnectGitHub,
  isAuthenticated,
  userProfile,
}: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Animated tile grid background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const tileSize = 40
    const cols = Math.ceil(canvas.width / tileSize)
    const rows = Math.ceil(canvas.height / tileSize)

    const tiles = Array.from({ length: rows }, (_, y) =>
      Array.from({ length: cols }, (_, x) => ({
        x,
        y,
        type: Math.random() > 0.8 ? "water" : Math.random() > 0.9 ? "stone" : "grass",
        opacity: 0.1 + Math.random() * 0.2,
        pulse: Math.random() * Math.PI * 2,
      })),
    )

    let animationId: number

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      tiles.forEach((row, y) => {
        row.forEach((tile, x) => {
          const pulse = Math.sin(time * 0.001 + tile.pulse) * 0.1 + 0.9
          const alpha = tile.opacity * pulse

          ctx.fillStyle =
            tile.type === "water"
              ? `rgba(59, 130, 246, ${alpha})`
              : tile.type === "stone"
                ? `rgba(107, 114, 128, ${alpha})`
                : `rgba(34, 197, 94, ${alpha})`

          ctx.fillRect(x * tileSize, y * tileSize, tileSize - 1, tileSize - 1)

          // Add subtle grid
          ctx.strokeStyle = `rgba(255, 255, 255, 0.05)`
          ctx.lineWidth = 1
          ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize)
        })
      })

      animationId = requestAnimationFrame(animate)
    }

    animate(0)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Generation",
      description: "Describe your world in natural language and watch our AI create stunning tile maps instantly",
      gradient: "from-purple-500 to-pink-500",
      delay: "0ms",
    },
    {
      icon: Zap,
      title: "Real-time Collaboration",
      description: "Work together with your team in real-time, see changes instantly across all devices",
      gradient: "from-blue-500 to-cyan-500",
      delay: "100ms",
    },
    {
      icon: Zap,
      title: "WorkAdventure Ready",
      description: "Export production-ready maps that work seamlessly with WorkAdventure and Universe",
      gradient: "from-green-500 to-emerald-500",
      delay: "200ms",
    },
    {
      icon: Github,
      title: "GitHub Integration",
      description: "Version control, automatic deployment to GitHub Pages, and seamless team workflows",
      gradient: "from-orange-500 to-red-500",
      delay: "300ms",
    },
    {
      icon: Layers3,
      title: "Advanced Layering",
      description: "Professional layer management with collision detection, spawn points, and teleportation",
      gradient: "from-indigo-500 to-purple-500",
      delay: "400ms",
    },
    {
      icon: Zap,
      title: "Instant Publishing",
      description: "One-click deployment to the web with automatic hosting and CDN distribution",
      gradient: "from-pink-500 to-rose-500",
      delay: "500ms",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Lead Game Designer at Metaverse Studios",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face",
      content:
        "Universe Map Studio revolutionized our workflow. What used to take days now takes minutes. The AI generation is mind-blowing.",
      rating: 5,
    },
    {
      name: "Marcus Rodriguez",
      role: "Indie Developer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
      content:
        "Finally, a tool that understands game developers. The GitHub integration and real-time collaboration are game-changers.",
      rating: 5,
    },
    {
      name: "Emily Watson",
      role: "Creative Director at PixelForge",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
      content:
        "The most intuitive map editor I've ever used. Our team's productivity increased by 300% since switching to Universe Studio.",
      rating: 5,
    },
  ]

  const stats = [
    { number: "50K+", label: "Maps Created", icon: Grid3X3 },
    { number: "10K+", label: "Active Creators", icon: Users },
    { number: "99.9%", label: "Uptime", icon: Shield },
    { number: "< 100ms", label: "Response Time", icon: Zap },
  ]

  const tools = [
    { icon: MousePointer, name: "Select", color: "text-blue-400" },
    { icon: Palette, name: "Paint", color: "text-green-400" },
    { icon: Grid3X3, name: "Fill", color: "text-purple-400" },
    { icon: MapPin, name: "Portal", color: "text-orange-400" },
    { icon: Gamepad2, name: "Spawn", color: "text-pink-400" },
    { icon: Layers3, name: "Layer", color: "text-cyan-400" },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Animated tile background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-slate-950/80 z-10" />

      {/* Content */}
      <div className="relative z-20">
        {/* Header */}
        <header className="border-b border-slate-800/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded flex items-center justify-center">
                  <Grid3X3 className="w-4 h-4 text-slate-300" />
                </div>
                <span className="text-lg font-mono text-slate-200">universe-map-studio</span>
                <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                  v0.1.0
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                {isAuthenticated && userProfile ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    {userProfile.github_username}
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600"
                    onClick={onConnectGitHub}
                  >
                    <Github className="w-4 h-4 mr-2" />
                    auth
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="text-sm font-mono text-slate-500 tracking-wider">
                  $ npm install @universe/map-studio
                </div>
                <h1 className="text-5xl font-bold text-white leading-tight">
                  Visual map editor
                  <br />
                  for multiplayer worlds
                </h1>
                <p className="text-xl text-slate-400 leading-relaxed">
                  Create WorkAdventure-compatible tile maps with a clean, developer-focused interface. No bloat, just
                  tools that work.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={onLaunchStudio}
                  className="bg-white text-black hover:bg-slate-200 px-6 py-3 font-medium"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Open Editor
                </Button>
                <Button
                  variant="outline"
                  onClick={onConnectGitHub}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 px-6 py-3"
                >
                  <Github className="w-4 h-4 mr-2" />
                  Connect GitHub
                </Button>
              </div>

              <div className="pt-8 border-t border-slate-800">
                <div className="text-sm text-slate-500 mb-4">Core features:</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    AI-assisted generation
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Code className="w-4 h-4 text-blue-400" />
                    TMJ export format
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Github className="w-4 h-4 text-slate-400" />
                    Git integration
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Gamepad2 className="w-4 h-4 text-green-400" />
                    WorkAdventure ready
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Mock Editor Interface */}
            <div className="relative">
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
                {/* Editor Header */}
                <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-sm text-slate-400 ml-2">forest-world.tmj</span>
                  </div>
                  <div className="text-xs text-slate-500">30×20</div>
                </div>

                {/* Toolbar */}
                <div className="bg-slate-850 border-b border-slate-700 p-2 flex gap-1">
                  {tools.map((tool, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded border border-slate-700 hover:border-slate-600 transition-colors ${
                        index === 1 ? "bg-slate-700" : "bg-slate-800"
                      }`}
                    >
                      <tool.icon className={`w-4 h-4 ${tool.color}`} />
                    </div>
                  ))}
                </div>

                {/* Canvas Area */}
                <div className="relative bg-slate-950 p-4">
                  <div className="grid grid-cols-12 gap-0 w-full aspect-[3/2] border border-slate-700 rounded overflow-hidden">
                    {Array.from({ length: 96 }).map((_, i) => {
                      const x = i % 12
                      const y = Math.floor(i / 12)
                      const isWater = x > 3 && x < 8 && y > 2 && y < 6
                      const isStone = (x > 8 && y > 5) || (x < 2 && y < 2)
                      const isHovered = hoveredTile?.x === x && hoveredTile?.y === y

                      return (
                        <div
                          key={i}
                          className={`
                            aspect-square border-r border-b border-slate-800/50 transition-all cursor-pointer
                            ${isWater ? "bg-blue-500/30" : isStone ? "bg-slate-500/30" : "bg-green-500/20"}
                            ${isHovered ? "bg-white/20 scale-110 z-10 relative" : ""}
                          `}
                          onMouseEnter={() => setHoveredTile({ x, y })}
                          onMouseLeave={() => setHoveredTile(null)}
                        />
                      )
                    })}
                  </div>

                  {/* Floating panels */}
                  <div className="absolute top-6 right-6 bg-slate-800/90 backdrop-blur border border-slate-700 rounded p-3 text-xs">
                    <div className="text-slate-400 mb-2">Tileset</div>
                    <div className="grid grid-cols-4 gap-1">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded border border-slate-600 ${
                            i === 0
                              ? "bg-green-500/40"
                              : i === 1
                                ? "bg-blue-500/40"
                                : i === 2
                                  ? "bg-slate-500/40"
                                  : "bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-6 bg-slate-800/90 backdrop-blur border border-slate-700 rounded p-3 text-xs">
                    <div className="text-slate-400 mb-2">Layers</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-slate-300">base</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-slate-500">objects</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status bar */}
                <div className="bg-slate-800 border-t border-slate-700 px-3 py-2 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <span>Tool: Paint</span>
                    {hoveredTile && (
                      <span>
                        Tile: {hoveredTile.x},{hoveredTile.y}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Saved</span>
                  </div>
                </div>
              </div>

              {/* Floating code snippet */}
              <div className="absolute -bottom-8 -left-8 bg-slate-900 border border-slate-700 rounded p-4 text-xs font-mono max-w-xs">
                <div className="text-slate-500 mb-2">// Export to WorkAdventure</div>
                <div className="text-slate-300">
                  <span className="text-blue-400">export</span> <span className="text-yellow-400">map</span>{" "}
                  <span className="text-slate-500">→</span> <span className="text-green-400">forest.tmj</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-slate-800 bg-slate-900/50 backdrop-blur">
          <div className="container mx-auto px-6 py-12">
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-semibold text-white">Ready to start building?</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                No signup required. Create maps locally, connect GitHub when you're ready to collaborate and deploy.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={onLaunchStudio} className="bg-white text-black hover:bg-slate-200">
                  Launch Editor
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
