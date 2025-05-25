"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  MousePointer2,
  Paintbrush,
  Eraser,
  Square,
  Navigation,
  Users,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Save,
  Github,
  Sparkles,
  Grid3X3,
  Eye,
  EyeOff,
  Home,
  Download,
  Menu,
  Layers,
  Palette,
  X,
} from "lucide-react"

interface MapEditorProps {
  isAuthenticated: boolean
  onBackToHome: () => void
  onBackToProjects?: () => void
  onConnectGitHub: () => void
  initialProject?: any
  userProfile?: any
}

interface MapCell {
  x: number
  y: number
  tile: string
  tileId: number
  teleport?: boolean
  spawn?: boolean
  exitUrl?: string
  collision?: boolean
}

interface HistoryState {
  mapData: MapCell[]
  timestamp: number
}

const TILESETS = [
  { name: "Grass", tiles: Array.from({ length: 16 }, (_, i) => ({ id: i, type: "grass", color: "bg-green-500" })) },
  { name: "Stone", tiles: Array.from({ length: 12 }, (_, i) => ({ id: i + 16, type: "stone", color: "bg-gray-500" })) },
  { name: "Water", tiles: Array.from({ length: 8 }, (_, i) => ({ id: i + 28, type: "water", color: "bg-blue-500" })) },
]

const MAP_WIDTH = 30
const MAP_HEIGHT = 20

export default function MapEditor({
  isAuthenticated,
  onBackToHome,
  onBackToProjects,
  onConnectGitHub,
  initialProject,
  userProfile,
}: MapEditorProps) {
  const [selectedTool, setSelectedTool] = useState("draw")
  const [selectedLayer, setSelectedLayer] = useState("base")
  const [zoom, setZoom] = useState([100])
  const [selectedTile, setSelectedTile] = useState(0)
  const [mapName, setMapName] = useState("My Map")
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedCell, setSelectedCell] = useState<MapCell | null>(null)
  const [aiPrompt, setAiPrompt] = useState("")
  const [showAiDialog, setShowAiDialog] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date>(new Date())
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showTilesets, setShowTilesets] = useState(false)
  const [showLayers, setShowLayers] = useState(false)
  const [showProperties, setShowProperties] = useState(false)
  const [currentMapId, setCurrentMapId] = useState<string | null>(null)

  // Map data and history
  const [mapData, setMapData] = useState<MapCell[]>([])
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const canvasRef = useRef<HTMLDivElement>(null)

  const tools = [
    { id: "select", icon: MousePointer2, name: "Select", shortcut: "V" },
    { id: "draw", icon: Paintbrush, name: "Paint", shortcut: "B" },
    { id: "erase", icon: Eraser, name: "Erase", shortcut: "E" },
    { id: "fill", icon: Square, name: "Fill", shortcut: "F" },
    { id: "teleport", icon: Navigation, name: "Portal", shortcut: "T" },
    { id: "spawn", icon: Users, name: "Spawn", shortcut: "S" },
  ]

  const layers = [
    { id: "collision", name: "Collision", visible: true, locked: false, color: "bg-red-500" },
    { id: "objects", name: "Objects", visible: true, locked: false, color: "bg-blue-500" },
    { id: "base", name: "Base Layer", visible: true, locked: false, color: "bg-green-500" },
  ]

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Initialize map
  useEffect(() => {
    const savedMap = localStorage.getItem("universe-map-current")
    if (savedMap) {
      try {
        const parsed = JSON.parse(savedMap)
        setMapData(parsed.mapData || [])
        setMapName(parsed.name || "My Map")
        setLastSaved(new Date(parsed.lastSaved || Date.now()))
      } catch (e) {
        console.error("Failed to load saved map:", e)
        initializeMap()
      }
    } else {
      initializeMap()
    }
  }, [])

  // Initialize with project data if provided
  useEffect(() => {
    if (initialProject) {
      setMapData(initialProject.map_data || [])
      setMapName(initialProject.name || "My Map")
      setCurrentMapId(initialProject.id || null)
      setLastSaved(new Date(initialProject.updated_at || Date.now()))
    }
  }, [initialProject])

  const initializeMap = () => {
    const initialMap: MapCell[] = []
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const isWater = x > 10 && x < 15 && y > 8 && y < 12
        const isStone = (x > 20 && y > 15) || (x < 5 && y < 5)
        const hasTeleport = x === 7 && y === 7
        const hasSpawn = x === 22 && y === 3

        initialMap.push({
          x,
          y,
          tile: isWater ? "water" : isStone ? "stone" : "grass",
          tileId: isWater ? 28 : isStone ? 16 : 0,
          teleport: hasTeleport,
          spawn: hasSpawn,
          collision: isStone,
          exitUrl: hasTeleport ? "https://example.com/map2" : undefined,
        })
      }
    }
    setMapData(initialMap)
    addToHistory(initialMap)
  }

  // History management
  const addToHistory = useCallback(
    (newMapData: MapCell[]) => {
      const newState: HistoryState = {
        mapData: JSON.parse(JSON.stringify(newMapData)),
        timestamp: Date.now(),
      }

      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1)
        newHistory.push(newState)
        return newHistory.slice(-50)
      })
      setHistoryIndex((prev) => Math.min(prev + 1, 49))
    },
    [historyIndex],
  )

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setMapData(JSON.parse(JSON.stringify(history[newIndex].mapData)))
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setMapData(JSON.parse(JSON.stringify(history[newIndex].mapData)))
    }
  }, [history, historyIndex])

  // Save to localStorage
  const saveMap = useCallback(() => {
    const mapToSave = {
      name: mapName,
      mapData,
      lastSaved: new Date().toISOString(),
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
    }
    localStorage.setItem("universe-map-current", JSON.stringify(mapToSave))
    setLastSaved(new Date())
  }, [mapData, mapName])

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(saveMap, 30000)
    return () => clearInterval(interval)
  }, [saveMap])

  // Get tile info
  const getTileInfo = (tileId: number) => {
    for (const tileset of TILESETS) {
      const tile = tileset.tiles.find((t) => t.id === tileId)
      if (tile) return tile
    }
    return TILESETS[0].tiles[0]
  }

  const getCellAt = (x: number, y: number) => {
    return mapData.find((cell) => cell.x === x && cell.y === y)
  }

  const updateCell = useCallback((x: number, y: number, updates: Partial<MapCell>) => {
    setMapData((prev) => {
      const newData = [...prev]
      const index = newData.findIndex((cell) => cell.x === x && cell.y === y)
      if (index >= 0) {
        newData[index] = { ...newData[index], ...updates }
      }
      return newData
    })
  }, [])

  const handleCellInteraction = useCallback(
    (x: number, y: number, isTouch = false) => {
      const cell = getCellAt(x, y)
      if (!cell) return

      switch (selectedTool) {
        case "select":
          setSelectedCell(cell)
          if (isMobile) setShowProperties(true)
          break

        case "draw":
          const tileInfo = getTileInfo(selectedTile)
          updateCell(x, y, {
            tile: tileInfo.type,
            tileId: selectedTile,
            teleport: false,
            spawn: false,
          })
          break

        case "erase":
          updateCell(x, y, {
            tile: "grass",
            tileId: 0,
            teleport: false,
            spawn: false,
            collision: false,
            exitUrl: undefined,
          })
          break

        case "teleport":
          updateCell(x, y, {
            teleport: !cell.teleport,
            spawn: false,
            exitUrl: cell.teleport ? undefined : "https://example.com/map2",
          })
          break

        case "spawn":
          updateCell(x, y, {
            spawn: !cell.spawn,
            teleport: false,
          })
          break

        case "fill":
          const targetTile = cell.tileId
          const newTileInfo = getTileInfo(selectedTile)
          if (targetTile !== selectedTile) {
            floodFill(x, y, targetTile, selectedTile, newTileInfo.type)
          }
          break
      }
    },
    [selectedTool, selectedTile, updateCell, isMobile],
  )

  const floodFill = (startX: number, startY: number, targetTile: number, newTile: number, newType: string) => {
    const visited = new Set<string>()
    const stack = [{ x: startX, y: startY }]

    while (stack.length > 0) {
      const { x, y } = stack.pop()!
      const key = `${x},${y}`

      if (visited.has(key) || x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) continue

      const cell = getCellAt(x, y)
      if (!cell || cell.tileId !== targetTile) continue

      visited.add(key)
      updateCell(x, y, { tile: newType, tileId: newTile })

      stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 })
    }
  }

  // Touch and mouse handlers
  const handlePointerDown = (x: number, y: number) => {
    setIsDrawing(true)
    handleCellInteraction(x, y, true)
  }

  const handlePointerMove = (x: number, y: number) => {
    if (isDrawing && (selectedTool === "draw" || selectedTool === "erase")) {
      handleCellInteraction(x, y, true)
    }
  }

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false)
      addToHistory(mapData)
    }
  }

  // AI Generation
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return

    setShowAiDialog(false)
    const newMapData = [...mapData]

    const isForest = aiPrompt.toLowerCase().includes("forest")
    const isCave = aiPrompt.toLowerCase().includes("cave")
    const isWater = aiPrompt.toLowerCase().includes("water") || aiPrompt.toLowerCase().includes("lake")

    for (let i = 0; i < newMapData.length; i++) {
      const cell = newMapData[i]
      const { x, y } = cell

      if (isForest && Math.random() > 0.7) {
        cell.tile = "grass"
        cell.tileId = Math.floor(Math.random() * 16)
      } else if (isCave && x > 5 && x < 25 && y > 5 && y < 15 && Math.random() > 0.8) {
        cell.tile = "stone"
        cell.tileId = 16 + Math.floor(Math.random() * 12)
      } else if (isWater && x > 8 && x < 22 && y > 6 && y < 14 && Math.random() > 0.6) {
        cell.tile = "water"
        cell.tileId = 28 + Math.floor(Math.random() * 8)
      }
    }

    setMapData(newMapData)
    addToHistory(newMapData)
    setAiPrompt("")
  }

  // Export functionality
  const exportMap = () => {
    const exportData = {
      name: mapName,
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      tilewidth: 32,
      tileheight: 32,
      layers: [
        {
          name: "base",
          type: "tilelayer",
          data: mapData.map((cell) => cell.tileId + 1),
        },
      ],
      tilesets: [
        {
          firstgid: 1,
          name: "tileset",
          tilewidth: 32,
          tileheight: 32,
          tilecount: 36,
          columns: 6,
        },
      ],
      objects: mapData
        .filter((cell) => cell.teleport || cell.spawn)
        .map((cell) => ({
          id: cell.x * MAP_HEIGHT + cell.y,
          x: cell.x * 32,
          y: cell.y * 32,
          width: 32,
          height: 32,
          type: cell.teleport ? "teleport" : "spawn",
          properties: cell.exitUrl ? { exitUrl: cell.exitUrl } : {},
        })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${mapName.replace(/\s+/g, "_").toLowerCase()}.tmj`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getTileColor = (cell: MapCell) => {
    if (cell.teleport) return "bg-purple-500"
    if (cell.spawn) return "bg-yellow-500"
    const tileInfo = getTileInfo(cell.tileId)
    return tileInfo.color
  }

  // Mobile tool selector
  const MobileToolSelector = () => (
    <div className="flex gap-2 p-3 bg-slate-900 border-t border-slate-800 overflow-x-auto">
      {tools.map((tool) => (
        <Button
          key={tool.id}
          size="sm"
          variant={selectedTool === tool.id ? "default" : "ghost"}
          className={`min-w-[60px] h-12 flex-col gap-1 ${
            selectedTool === tool.id ? "bg-purple-600 hover:bg-purple-700" : "hover:bg-slate-800"
          }`}
          onClick={() => setSelectedTool(tool.id)}
        >
          <tool.icon className="w-4 h-4" />
          <span className="text-xs">{tool.name}</span>
        </Button>
      ))}
    </div>
  )

  // Mobile header
  const MobileHeader = () => (
    <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={onBackToHome}>
          <Home className="w-4 h-4" />
        </Button>
        {onBackToProjects && (
          <Button size="sm" variant="ghost" onClick={onBackToProjects}>
            Projects
          </Button>
        )}
        <Input
          value={mapName}
          onChange={(e) => setMapName(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white text-sm h-8 flex-1 max-w-[150px]"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={undo} disabled={historyIndex <= 0}>
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={redo} disabled={historyIndex >= history.length - 1}>
          <Redo2 className="w-4 h-4" />
        </Button>

        <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
          <SheetTrigger asChild>
            <Button size="sm" variant="ghost">
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-slate-900 border-slate-800 text-white w-80">
            <SheetHeader>
              <SheetTitle className="text-white">Menu</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              <Button onClick={() => setShowAiDialog(true)} className="w-full bg-purple-600 hover:bg-purple-700">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Generate
              </Button>

              <div className="space-y-2">
                <Button onClick={saveMap} variant="outline" className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Project
                </Button>
                <Button onClick={exportMap} variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export Map
                </Button>
              </div>

              {isAuthenticated ? (
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Github className="w-4 h-4 mr-2" />
                  Sync to GitHub
                </Button>
              ) : (
                <Button onClick={onConnectGitHub} variant="outline" className="w-full">
                  <Github className="w-4 h-4 mr-2" />
                  Connect GitHub
                </Button>
              )}

              <div className="pt-4 border-t border-slate-700">
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Last saved: {lastSaved.toLocaleTimeString()}</div>
                  <div>Status: {isAuthenticated ? "Synced with GitHub" : "Saved on your device"}</div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )

  // Desktop header
  const DesktopHeader = () => (
    <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button size="sm" variant="ghost" className="h-8" onClick={onBackToHome}>
          <Home className="w-4 h-4 mr-2" />
          Home
        </Button>

        <Separator orientation="vertical" className="h-6 bg-slate-700" />

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded flex items-center justify-center">
            <Grid3X3 className="w-3 h-3 text-white" />
          </div>
          <Input
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white w-48 h-8"
          />
        </div>

        <Separator orientation="vertical" className="h-6 bg-slate-700" />

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={undo} disabled={historyIndex <= 0}>
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 bg-slate-700" />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setZoom([Math.max(25, zoom[0] - 25)])}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-300 w-12 text-center">{zoom[0]}%</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setZoom([Math.min(200, zoom[0] + 25)])}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 h-8" onClick={() => setShowAiDialog(true)}>
          <Sparkles className="w-4 h-4 mr-2" />
          AI Generate
        </Button>

        <Separator orientation="vertical" className="h-6 bg-slate-700" />

        <Button size="sm" variant="ghost" className="h-8" onClick={saveMap}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>

        <Button size="sm" variant="ghost" className="h-8" onClick={exportMap}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        {isAuthenticated ? (
          <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8">
            <Github className="w-4 h-4 mr-2" />
            Sync to GitHub
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="border-slate-700 text-white hover:bg-slate-800 h-8"
            onClick={onConnectGitHub}
          >
            <Github className="w-4 h-4 mr-2" />
            Connect GitHub
          </Button>
        )}

        <div className="flex items-center gap-2 ml-4">
          {isAuthenticated ? (
            <Badge variant="secondary" className="bg-green-500/20 text-green-300">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1" />
              Synced
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-1" />
              Saved on Device
            </Badge>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      {isMobile ? <MobileHeader /> : <DesktopHeader />}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Left Sidebar - Tools */}
        {!isMobile && (
          <div className="w-16 bg-slate-900 border-r border-slate-800 p-2 flex flex-col gap-2">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                size="sm"
                variant={selectedTool === tool.id ? "default" : "ghost"}
                className={`w-12 h-12 p-0 ${
                  selectedTool === tool.id ? "bg-purple-600 hover:bg-purple-700" : "hover:bg-slate-800"
                }`}
                onClick={() => setSelectedTool(tool.id)}
                title={`${tool.name} (${tool.shortcut})`}
              >
                <tool.icon className="w-5 h-5" />
              </Button>
            ))}
          </div>
        )}

        {/* Main Canvas Area */}
        <div className="flex-1 bg-slate-950 relative overflow-auto">
          <div className="absolute inset-0 p-2 md:p-8">
            <div className="relative bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-2xl h-full">
              {/* Canvas Header */}
              <div className="bg-slate-800 border-b border-slate-700 p-2 md:p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <span className="text-xs md:text-sm text-slate-300">
                    {MAP_WIDTH}×{MAP_HEIGHT}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {selectedLayer}
                  </Badge>
                  {isMobile && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setShowTilesets(true)}>
                        <Palette className="w-3 h-3 mr-1" />
                        Tiles
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setShowLayers(true)}>
                        <Layers className="w-3 h-3 mr-1" />
                        Layers
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isMobile && (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">
                        <Grid3X3 className="w-3 h-3 mr-1" />
                        Grid
                      </Button>
                      <Slider value={zoom} onValueChange={setZoom} max={200} min={25} step={25} className="w-20" />
                    </>
                  )}
                  {isMobile && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => setZoom([Math.max(25, zoom[0] - 25)])}
                      >
                        <ZoomOut className="w-3 h-3" />
                      </Button>
                      <span className="text-xs text-slate-300 px-2 py-1">{zoom[0]}%</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => setZoom([Math.min(200, zoom[0] + 25)])}
                      >
                        <ZoomIn className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Canvas Grid */}
              <div className="p-2 md:p-4 bg-slate-950 h-full overflow-auto" onPointerUp={handlePointerUp}>
                <div
                  ref={canvasRef}
                  className="grid gap-0 border border-slate-700 rounded overflow-hidden select-none mx-auto"
                  style={{
                    gridTemplateColumns: `repeat(${MAP_WIDTH}, 1fr)`,
                    aspectRatio: `${MAP_WIDTH}/${MAP_HEIGHT}`,
                    transform: `scale(${zoom[0] / 100})`,
                    transformOrigin: "center",
                    maxWidth: isMobile ? "100%" : "none",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  {mapData.map((cell, index) => (
                    <div
                      key={index}
                      className={`
                        aspect-square border border-slate-800/50 relative cursor-pointer transition-all
                        ${!isMobile ? "hover:border-purple-400/50 hover:scale-110 hover:z-10" : ""}
                        ${getTileColor(cell)}
                        ${selectedCell?.x === cell.x && selectedCell?.y === cell.y ? "ring-2 ring-purple-400" : ""}
                      `}
                      style={{
                        minWidth: isMobile ? "12px" : "16px",
                        minHeight: isMobile ? "12px" : "16px",
                        touchAction: "none",
                      }}
                      onPointerDown={() => handlePointerDown(cell.x, cell.y)}
                      onPointerEnter={() => handlePointerMove(cell.x, cell.y)}
                      onTouchStart={(e) => {
                        e.preventDefault()
                        handlePointerDown(cell.x, cell.y)
                      }}
                    >
                      {cell.teleport && (
                        <Navigation className="w-2 h-2 md:w-3 md:h-3 text-white absolute inset-0 m-auto" />
                      )}
                      {cell.spawn && <Users className="w-2 h-2 md:w-3 md:h-3 text-white absolute inset-0 m-auto" />}
                      {cell.collision && <div className="absolute inset-0 bg-red-500/20 border border-red-500/50" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Right Sidebar */}
        {!isMobile && (
          <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
            {/* Tileset Browser */}
            <div className="border-b border-slate-800">
              <div className="p-4">
                <h3 className="text-sm font-medium text-slate-200 mb-3">Tileset Browser</h3>
                <div className="space-y-3">
                  {TILESETS.map((tileset) => (
                    <div key={tileset.name}>
                      <h4 className="text-xs text-slate-400 mb-2">{tileset.name}</h4>
                      <div className="grid grid-cols-8 gap-1">
                        {tileset.tiles.map((tile) => (
                          <div
                            key={tile.id}
                            className={`
                              aspect-square rounded border cursor-pointer transition-all hover:scale-110
                              ${
                                selectedTile === tile.id
                                  ? "border-purple-400 bg-purple-500/20 ring-2 ring-purple-400"
                                  : "border-slate-700 hover:border-slate-600"
                              }
                              ${tile.color}
                            `}
                            onClick={() => setSelectedTile(tile.id)}
                            title={`${tile.type} (${tile.id})`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Layers Panel */}
            <div className="border-b border-slate-800">
              <div className="p-4">
                <h3 className="text-sm font-medium text-slate-200 mb-3">Layers</h3>
                <div className="space-y-2">
                  {layers.map((layer) => (
                    <div
                      key={layer.id}
                      className={`
                        flex items-center gap-3 p-2 rounded cursor-pointer transition-colors
                        ${
                          selectedLayer === layer.id
                            ? "bg-purple-500/20 border border-purple-500/30"
                            : "hover:bg-slate-800"
                        }
                      `}
                      onClick={() => setSelectedLayer(layer.id)}
                    >
                      <div className={`w-3 h-3 rounded ${layer.color}`} />
                      <span className="text-sm flex-1">{layer.name}</span>
                      <Button size="sm" variant="ghost" className="h-5 w-5 p-0">
                        {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Properties Panel */}
            <div className="flex-1 overflow-auto">
              <div className="p-4">
                <h3 className="text-sm font-medium text-slate-200 mb-3">Properties</h3>
                {selectedCell ? (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-3">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-slate-400">Position</Label>
                          <Input
                            value={`${selectedCell.x}, ${selectedCell.y}`}
                            className="bg-slate-900 border-slate-700 text-white h-7 text-xs mt-1"
                            readOnly
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-slate-400">Tile</Label>
                          <Input
                            value={`${selectedCell.tile}_${selectedCell.tileId}`}
                            className="bg-slate-900 border-slate-700 text-white h-7 text-xs mt-1"
                            readOnly
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-slate-400">Collision</Label>
                          <Switch
                            checked={selectedCell.collision || false}
                            onCheckedChange={(checked) =>
                              updateCell(selectedCell.x, selectedCell.y, { collision: checked })
                            }
                          />
                        </div>

                        {selectedCell.teleport && (
                          <div>
                            <Label className="text-xs text-slate-400">Exit URL</Label>
                            <Input
                              value={selectedCell.exitUrl || ""}
                              onChange={(e) => updateCell(selectedCell.x, selectedCell.y, { exitUrl: e.target.value })}
                              placeholder="https://example.com/map2"
                              className="bg-slate-900 border-slate-700 text-white h-7 text-xs mt-1"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center text-slate-400 text-sm py-8">Select a tile to view properties</div>
                )}

                {!isAuthenticated && (
                  <Card className="bg-orange-500/10 border-orange-500/20 mt-4">
                    <CardContent className="p-3">
                      <div className="text-center">
                        <h4 className="text-sm font-medium text-orange-300 mb-2">Connect GitHub</h4>
                        <p className="text-xs text-orange-200/80 mb-3">Sync projects and collaborate with your team</p>
                        <Button
                          size="sm"
                          className="w-full bg-orange-600 hover:bg-orange-700"
                          onClick={onConnectGitHub}
                        >
                          <Github className="w-3 h-3 mr-1" />
                          Connect Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Tool Selector */}
      {isMobile && <MobileToolSelector />}

      {/* Mobile Sheets */}
      {isMobile && (
        <>
          {/* Tileset Sheet */}
          <Sheet open={showTilesets} onOpenChange={setShowTilesets}>
            <SheetContent side="bottom" className="bg-slate-900 border-slate-800 text-white h-[60vh]">
              <SheetHeader>
                <SheetTitle className="text-white flex items-center justify-between">
                  <span>Choose Tiles</span>
                  <Button size="sm" variant="ghost" onClick={() => setShowTilesets(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-6 overflow-auto">
                {TILESETS.map((tileset) => (
                  <div key={tileset.name}>
                    <h4 className="text-sm text-slate-300 mb-3">{tileset.name}</h4>
                    <div className="grid grid-cols-6 gap-2">
                      {tileset.tiles.map((tile) => (
                        <div
                          key={tile.id}
                          className={`
                            aspect-square rounded border cursor-pointer transition-all
                            ${
                              selectedTile === tile.id
                                ? "border-purple-400 bg-purple-500/20 ring-2 ring-purple-400"
                                : "border-slate-700"
                            }
                            ${tile.color}
                          `}
                          onClick={() => {
                            setSelectedTile(tile.id)
                            setShowTilesets(false)
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Layers Sheet */}
          <Sheet open={showLayers} onOpenChange={setShowLayers}>
            <SheetContent side="bottom" className="bg-slate-900 border-slate-800 text-white h-[40vh]">
              <SheetHeader>
                <SheetTitle className="text-white flex items-center justify-between">
                  <span>Layers</span>
                  <Button size="sm" variant="ghost" onClick={() => setShowLayers(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-3 mt-6">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`
                      flex items-center gap-3 p-3 rounded cursor-pointer transition-colors
                      ${
                        selectedLayer === layer.id
                          ? "bg-purple-500/20 border border-purple-500/30"
                          : "hover:bg-slate-800"
                      }
                    `}
                    onClick={() => {
                      setSelectedLayer(layer.id)
                      setShowLayers(false)
                    }}
                  >
                    <div className={`w-4 h-4 rounded ${layer.color}`} />
                    <span className="text-sm flex-1">{layer.name}</span>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Properties Sheet */}
          <Sheet open={showProperties} onOpenChange={setShowProperties}>
            <SheetContent side="bottom" className="bg-slate-900 border-slate-800 text-white h-[50vh]">
              <SheetHeader>
                <SheetTitle className="text-white flex items-center justify-between">
                  <span>Properties</span>
                  <Button size="sm" variant="ghost" onClick={() => setShowProperties(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                {selectedCell ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-slate-400">Position</Label>
                      <Input
                        value={`${selectedCell.x}, ${selectedCell.y}`}
                        className="bg-slate-800 border-slate-700 text-white mt-2"
                        readOnly
                      />
                    </div>

                    <div>
                      <Label className="text-sm text-slate-400">Tile Type</Label>
                      <Input
                        value={`${selectedCell.tile}_${selectedCell.tileId}`}
                        className="bg-slate-800 border-slate-700 text-white mt-2"
                        readOnly
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-slate-400">Collision</Label>
                      <Switch
                        checked={selectedCell.collision || false}
                        onCheckedChange={(checked) =>
                          updateCell(selectedCell.x, selectedCell.y, { collision: checked })
                        }
                      />
                    </div>

                    {selectedCell.teleport && (
                      <div>
                        <Label className="text-sm text-slate-400">Exit URL</Label>
                        <Input
                          value={selectedCell.exitUrl || ""}
                          onChange={(e) => updateCell(selectedCell.x, selectedCell.y, { exitUrl: e.target.value })}
                          placeholder="https://example.com/map2"
                          className="bg-slate-800 border-slate-700 text-white mt-2"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-8">Select a tile to view properties</div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}

      {/* AI Dialog */}
      {showAiDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">AI Map Generation</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-slate-300">Describe your world</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="A mystical forest with a hidden cave and a small lake..."
                    className="bg-slate-900 border-slate-700 text-white mt-2"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAiGenerate} className="bg-purple-600 hover:bg-purple-700 flex-1">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                  <Button variant="outline" onClick={() => setShowAiDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Bar - Desktop Only */}
      {!isMobile && (
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>Tool: {tools.find((t) => t.id === selectedTool)?.name}</span>
            <span>Layer: {selectedLayer}</span>
            {selectedCell && (
              <span>
                Selected: {selectedCell.x}, {selectedCell.y}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>
              {MAP_WIDTH}×{MAP_HEIGHT} tiles
            </span>
            <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isAuthenticated ? "bg-green-400" : "bg-blue-400"}`} />
              <span>{isAuthenticated ? "Synced with GitHub" : "Saved on your device"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
