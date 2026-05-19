"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Download,
  Eraser,
  Eye,
  EyeOff,
  Home,
  Layers,
  Navigation,
  Paintbrush,
  Redo2,
  Shield,
  Undo2,
  Upload,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type PaintTool = "collision" | "spawn" | "exit" | "erase"

interface TileCoord { x: number; y: number }

interface MapState {
  collisions: Set<string>
  spawn: TileCoord | null
  exits: Set<string>
}

interface LayerVis {
  collision: boolean
  spawn: boolean
  exit: boolean
  grid: boolean
}

interface MapEditorProps {
  isAuthenticated: boolean
  onBackToHome: () => void
  onBackToProjects?: () => void
  onConnectGitHub: () => void
  initialProject?: any
  userProfile?: any
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TILE = 32
const HISTORY_LIMIT = 50

const TOOL_META: Record<PaintTool, { label: string; color: string; icon: any }> = {
  collision: { label: "Collision",  color: "rgba(239,68,68,0.55)",   icon: Shield },
  spawn:     { label: "Spawn",      color: "rgba(34,197,94,0.75)",   icon: Users },
  exit:      { label: "Exit/Portal",color: "rgba(168,85,247,0.65)",  icon: Navigation },
  erase:     { label: "Erase",      color: "transparent",            icon: Eraser },
}

const key = (x: number, y: number) => `${x},${y}`
const fromKey = (k: string): TileCoord => {
  const [x, y] = k.split(",").map(Number)
  return { x, y }
}

// ─── Export helper ────────────────────────────────────────────────────────────

function buildWAMap(
  mapName: string,
  cols: number,
  rows: number,
  collisions: Set<string>,
  spawn: TileCoord | null,
  exits: Set<string>,
) {
  const total = cols * rows
  const makeEmpty = () => Array(total).fill(0)

  // collision layer: tile id 443 = first Special_Zones collision tile (matches Universe starter)
  const collisionData = makeEmpty()
  collisions.forEach((k) => {
    const { x, y } = fromKey(k)
    collisionData[y * cols + x] = 443
  })

  // start layer: tile id 444 = spawn area tile
  const startData = makeEmpty()
  if (spawn) {
    startData[spawn.y * cols + spawn.x] = 444
    // mark surrounding 3×3 so the player always has room
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = spawn.x + dx
        const ny = spawn.y + dy
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
          startData[ny * cols + nx] = 444
        }
      }
    }
  }

  // floor layer: all tiles tile 201 (solid floor from tileset1)
  const floorData = Array(total).fill(201)

  // exits as object layer
  const exitObjects = Array.from(exits).map((k, i) => {
    const { x, y } = fromKey(k)
    return {
      class: "area",
      height: TILE,
      id: i + 100,
      name: `exit_${i}`,
      properties: [{ name: "exitUrl", type: "string", value: "" }],
      rotation: 0,
      visible: true,
      width: TILE,
      x: x * TILE,
      y: y * TILE,
    }
  })

  return {
    compressionlevel: -1,
    height: rows,
    infinite: false,
    layers: [
      {
        data: startData,
        height: rows,
        id: 6,
        name: "start",
        opacity: 1,
        type: "tilelayer",
        visible: true,
        width: cols,
        x: 0,
        y: 0,
      },
      {
        data: collisionData,
        height: rows,
        id: 7,
        name: "collisions",
        opacity: 1,
        type: "tilelayer",
        visible: true,
        width: cols,
        x: 0,
        y: 0,
      },
      {
        data: floorData,
        height: rows,
        id: 4,
        name: "floor",
        opacity: 1,
        type: "tilelayer",
        visible: true,
        width: cols,
        x: 0,
        y: 0,
      },
      {
        draworder: "topdown",
        id: 2,
        name: "floorLayer",
        objects: exitObjects,
        opacity: 1,
        type: "objectgroup",
        visible: true,
        x: 0,
        y: 0,
      },
    ],
    nextlayerid: 40,
    nextobjectid: exitObjects.length + 1,
    orientation: "orthogonal",
    properties: [
      { name: "mapName", type: "string", value: mapName },
    ],
    renderorder: "right-down",
    tiledversion: "1.9.2",
    tileheight: TILE,
    tilesets: [
      {
        columns: 11,
        firstgid: 201,
        image: "../assets/tileset1.png",
        imageheight: 352,
        imagewidth: 352,
        margin: 0,
        name: "tileset1",
        spacing: 0,
        tilecount: 121,
        tileheight: TILE,
        tilewidth: TILE,
      },
      {
        columns: 6,
        firstgid: 443,
        image: "../assets/Special_Zones.png",
        imageheight: 64,
        imagewidth: 192,
        margin: 0,
        name: "Special_Zones",
        spacing: 0,
        tilecount: 12,
        tileheight: TILE,
        tiles: [{ id: 0, properties: [{ name: "collides", type: "bool", value: true }] }],
        tilewidth: TILE,
      },
    ],
    tilewidth: TILE,
    type: "map",
    version: "1.9",
    width: cols,
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MapEditor({
  onBackToHome,
}: MapEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const bgImageRef   = useRef<HTMLImageElement | null>(null)

  // Map meta
  const [mapName, setMapName]   = useState("My Map")
  const [cols, setCols]         = useState(30)
  const [rows, setRows]         = useState(20)

  // Viewport
  const [scale, setScale]   = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // Painting state
  const [tool, setTool]             = useState<PaintTool>("collision")
  const [isPainting, setIsPainting] = useState(false)

  // Map data
  const [map, setMap] = useState<MapState>({
    collisions: new Set(),
    spawn: null,
    exits: new Set(),
  })

  // History
  const historyRef   = useRef<MapState[]>([{ collisions: new Set(), spawn: null, exits: new Set() }])
  const histIdxRef   = useRef(0)

  // Layers visibility
  const [layers, setLayers] = useState<LayerVis>({
    collision: true,
    spawn: true,
    exit: true,
    grid: true,
  })

  // Pan state
  const panRef = useRef<{ active: boolean; lastX: number; lastY: number; startDist: number } | null>(null)

  // ── Canvas dimensions ──────────────────────────────────────────────────────

  const canvasW = cols * TILE
  const canvasH = rows * TILE

  // ── History helpers ────────────────────────────────────────────────────────

  const cloneMap = (m: MapState): MapState => ({
    collisions: new Set(m.collisions),
    spawn: m.spawn ? { ...m.spawn } : null,
    exits: new Set(m.exits),
  })

  const pushHistory = useCallback((newMap: MapState) => {
    const hist = historyRef.current.slice(0, histIdxRef.current + 1)
    hist.push(cloneMap(newMap))
    if (hist.length > HISTORY_LIMIT) hist.shift()
    historyRef.current = hist
    histIdxRef.current = hist.length - 1
  }, [])

  const undo = () => {
    if (histIdxRef.current <= 0) return
    histIdxRef.current--
    setMap(cloneMap(historyRef.current[histIdxRef.current]))
  }

  const redo = () => {
    if (histIdxRef.current >= historyRef.current.length - 1) return
    histIdxRef.current++
    setMap(cloneMap(historyRef.current[histIdxRef.current]))
  }

  // ── Draw ──────────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.scale(scale, scale)

    // Background image
    if (bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, canvasW, canvasH)
    } else {
      ctx.fillStyle = "#1e293b"
      ctx.fillRect(0, 0, canvasW, canvasH)
    }

    // Collision layer
    if (layers.collision) {
      ctx.fillStyle = TOOL_META.collision.color
      map.collisions.forEach((k) => {
        const { x, y } = fromKey(k)
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE)
      })
    }

    // Exit layer
    if (layers.exit) {
      ctx.fillStyle = TOOL_META.exit.color
      map.exits.forEach((k) => {
        const { x, y } = fromKey(k)
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE)
        // Portal symbol
        ctx.fillStyle = "rgba(255,255,255,0.8)"
        ctx.font = `${TILE * 0.5}px sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("⤴", x * TILE + TILE / 2, y * TILE + TILE / 2)
        ctx.fillStyle = TOOL_META.exit.color
      })
    }

    // Spawn layer
    if (layers.spawn && map.spawn) {
      const { x, y } = map.spawn
      // Highlight 3×3 area
      ctx.fillStyle = "rgba(34,197,94,0.2)"
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx; const ny = y + dy
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            ctx.fillRect(nx * TILE, ny * TILE, TILE, TILE)
          }
        }
      }
      // Spawn pin
      ctx.fillStyle = TOOL_META.spawn.color
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE)
      ctx.fillStyle = "white"
      ctx.font = `bold ${TILE * 0.55}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("★", x * TILE + TILE / 2, y * TILE + TILE / 2)
    }

    // Grid
    if (layers.grid) {
      ctx.strokeStyle = "rgba(148,163,184,0.25)"
      ctx.lineWidth = 0.5
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath(); ctx.moveTo(c * TILE, 0); ctx.lineTo(c * TILE, canvasH); ctx.stroke()
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * TILE); ctx.lineTo(canvasW, r * TILE); ctx.stroke()
      }
    }

    ctx.restore()
  }, [map, layers, scale, offset, canvasW, canvasH, cols, rows])

  useEffect(() => { draw() }, [draw])

  // Resize canvas to fill container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width  = el.clientWidth
      canvas.height = el.clientHeight
      draw()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [draw])

  // ── Pointer → tile ────────────────────────────────────────────────────────

  const pointerToTile = (clientX: number, clientY: number): TileCoord | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const px = (clientX - rect.left - offset.x) / scale
    const py = (clientY - rect.top  - offset.y) / scale
    const tx = Math.floor(px / TILE)
    const ty = Math.floor(py / TILE)
    if (tx < 0 || tx >= cols || ty < 0 || ty >= rows) return null
    return { x: tx, y: ty }
  }

  // ── Paint ─────────────────────────────────────────────────────────────────

  const applyTool = useCallback((tx: number, ty: number) => {
    setMap((prev) => {
      const next = cloneMap(prev)
      const k = key(tx, ty)
      if (tool === "collision") {
        next.collisions.add(k)
        next.exits.delete(k)
      } else if (tool === "exit") {
        next.exits.add(k)
        next.collisions.delete(k)
      } else if (tool === "spawn") {
        next.spawn = { x: tx, y: ty }
      } else if (tool === "erase") {
        next.collisions.delete(k)
        next.exits.delete(k)
        if (next.spawn && next.spawn.x === tx && next.spawn.y === ty) next.spawn = null
      }
      return next
    })
  }, [tool])

  // ── Mouse events ──────────────────────────────────────────────────────────

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) {
      // Middle/right = pan
      panRef.current = { active: true, lastX: e.clientX, lastY: e.clientY, startDist: 0 }
      return
    }
    const t = pointerToTile(e.clientX, e.clientY)
    if (!t) return
    setIsPainting(true)
    applyTool(t.x, t.y)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (panRef.current?.active) {
      setOffset((o) => ({ x: o.x + e.movementX, y: o.y + e.movementY }))
      return
    }
    if (!isPainting) return
    const t = pointerToTile(e.clientX, e.clientY)
    if (t) applyTool(t.x, t.y)
  }

  const onMouseUp = (e: React.MouseEvent) => {
    if (panRef.current?.active) { panRef.current = null; return }
    if (isPainting) {
      setIsPainting(false)
      setMap((m) => { pushHistory(m); return m })
    }
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    setScale((s) => {
      const next = Math.min(4, Math.max(0.2, s * factor))
      const ratio = next / s
      setOffset((o) => ({
        x: mx - ratio * (mx - o.x),
        y: my - ratio * (my - o.y),
      }))
      return next
    })
  }

  // ── Touch events ──────────────────────────────────────────────────────────

  const touchPaintRef = useRef(false)
  const lastTouchRef  = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 2) {
      // Pinch start
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      panRef.current = {
        active: true,
        lastX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        lastY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        startDist: Math.hypot(dx, dy),
      }
      return
    }
    // Single touch = paint
    const touch = e.touches[0]
    const t = pointerToTile(touch.clientX, touch.clientY)
    if (!t) return
    touchPaintRef.current = true
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY }
    applyTool(t.x, t.y)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 2 && panRef.current) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      const dist = Math.hypot(dx, dy)
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      const scaleFactor = dist / panRef.current.startDist

      setScale((s) => {
        const next = Math.min(4, Math.max(0.2, s * scaleFactor))
        const ratio = next / s
        const canvas = canvasRef.current!
        const rect = canvas.getBoundingClientRect()
        const mx = midX - rect.left
        const my = midY - rect.top
        setOffset((o) => ({
          x: mx - ratio * (mx - o.x) + (midX - panRef.current!.lastX),
          y: my - ratio * (my - o.y) + (midY - panRef.current!.lastY),
        }))
        return next
      })

      panRef.current.lastX = midX
      panRef.current.lastY = midY
      panRef.current.startDist = dist
      return
    }

    if (!touchPaintRef.current) return
    const touch = e.touches[0]
    const t = pointerToTile(touch.clientX, touch.clientY)
    if (t) applyTool(t.x, t.y)
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    panRef.current = null
    if (touchPaintRef.current) {
      touchPaintRef.current = false
      setMap((m) => { pushHistory(m); return m })
    }
  }

  // ── Image upload ──────────────────────────────────────────────────────────

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      bgImageRef.current = img
      // Auto-set cols/rows based on image aspect at 32px tiles
      const naturalCols = Math.round(img.naturalWidth  / TILE)
      const naturalRows = Math.round(img.naturalHeight / TILE)
      setCols(Math.max(10, Math.min(200, naturalCols)))
      setRows(Math.max(10, Math.min(200, naturalRows)))
      // Reset map
      const fresh: MapState = { collisions: new Set(), spawn: null, exits: new Set() }
      setMap(fresh)
      historyRef.current = [cloneMap(fresh)]
      histIdxRef.current = 0
      // Fit to viewport
      const canvas = canvasRef.current!
      const fitScale = Math.min(
        canvas.width  / (naturalCols * TILE),
        canvas.height / (naturalRows * TILE),
        1,
      )
      setScale(fitScale)
      setOffset({ x: 0, y: 0 })
    }
    img.src = url
  }

  // ── Export ────────────────────────────────────────────────────────────────

  const exportMap = () => {
    const data = buildWAMap(mapName, cols, rows, map.collisions, map.spawn, map.exits)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `${mapName.replace(/\s+/g, "_").toLowerCase()}.tmj`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── Zoom helpers ──────────────────────────────────────────────────────────

  const zoom = (dir: 1 | -1) => {
    const next = Math.min(4, Math.max(0.2, scale + dir * 0.2))
    setScale(next)
  }

  const fitToScreen = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const s = Math.min(canvas.width / canvasW, canvas.height / canvasH, 1)
    setScale(s)
    setOffset({ x: 0, y: 0 })
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  const collisionCount = map.collisions.size
  const exitCount      = map.exits.size

  // ── Render ────────────────────────────────────────────────────────────────

  const tools: PaintTool[] = ["collision", "spawn", "exit", "erase"]

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col select-none overflow-hidden">

      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center gap-2 flex-wrap">

        <Button size="sm" variant="ghost" onClick={onBackToHome} className="h-8 px-2">
          <Home className="w-4 h-4" />
        </Button>

        <div className="h-5 w-px bg-slate-700" />

        {/* Map name */}
        <Input
          value={mapName}
          onChange={(e) => setMapName(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white h-8 w-36 text-sm"
        />

        <div className="h-5 w-px bg-slate-700" />

        {/* Undo / Redo */}
        <Button size="sm" variant="ghost" onClick={undo} className="h-8 w-8 p-0">
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={redo} className="h-8 w-8 p-0">
          <Redo2 className="w-4 h-4" />
        </Button>

        <div className="h-5 w-px bg-slate-700" />

        {/* Zoom */}
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => zoom(-1)}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs text-slate-400 w-10 text-center">{Math.round(scale * 100)}%</span>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => zoom(1)}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={fitToScreen}>
          Fit
        </Button>

        <div className="h-5 w-px bg-slate-700" />

        {/* Upload image */}
        <Label
          htmlFor="bg-upload"
          className="cursor-pointer flex items-center gap-1.5 h-8 px-3 rounded-md bg-slate-700 hover:bg-slate-600 text-sm"
        >
          <Upload className="w-4 h-4" />
          Upload Map
        </Label>
        <input
          id="bg-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Export */}
        <Button
          size="sm"
          className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 ml-auto"
          onClick={exportMap}
        >
          <Download className="w-4 h-4 mr-1.5" />
          Export .tmj
        </Button>
      </div>

      {/* ── Main Area ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Toolbar ──────────────────────────────────────────────── */}
        <div className="w-14 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3 gap-2">
          {tools.map((t) => {
            const meta = TOOL_META[t]
            const Icon = meta.icon
            const active = tool === t
            return (
              <button
                key={t}
                title={meta.label}
                onClick={() => setTool(t)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                  ${ active
                    ? "ring-2 ring-white bg-slate-700"
                    : "hover:bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                style={active ? { color: meta.color === "transparent" ? "white" : meta.color } : {}}
              >
                <Icon className="w-5 h-5" />
              </button>
            )
          })}

          <div className="flex-1" />

          {/* Layer toggles */}
          <div className="flex flex-col items-center gap-1 pb-2">
            <span className="text-slate-500 text-[9px] uppercase tracking-wider mb-1">Layers</span>
            {([
              { id: "grid",      color: "text-slate-400", label: "Grid" },
              { id: "collision", color: "text-red-400",   label: "Collisions" },
              { id: "spawn",     color: "text-green-400", label: "Spawn" },
              { id: "exit",      color: "text-purple-400",label: "Exits" },
            ] as { id: keyof LayerVis; color: string; label: string }[]).map((l) => (
              <button
                key={l.id}
                title={`Toggle ${l.label}`}
                onClick={() => setLayers((lv) => ({ ...lv, [l.id]: !lv[l.id] }))}
                className={`w-10 h-8 rounded flex items-center justify-center transition-colors ${
                  layers[l.id] ? l.color : "text-slate-600"
                } hover:bg-slate-800`}
              >
                {layers[l.id]
                  ? <Eye className="w-4 h-4" />
                  : <EyeOff className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* ── Canvas ───────────────────────────────────────────────────── */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden bg-slate-950 relative"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 touch-none"
            style={{ cursor: tool === "erase" ? "cell" : "crosshair" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Empty state hint */}
          {!bgImageRef.current && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-center space-y-3 opacity-40">
                <Upload className="w-12 h-12 mx-auto" />
                <p className="text-lg font-medium">Upload your AI-generated map image</p>
                <p className="text-sm text-slate-400">PNG/JPG · Grid auto-fits to 32px tiles · Paint collision &amp; spawn on top</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel ──────────────────────────────────────────────── */}
        <div className="w-52 bg-slate-900 border-l border-slate-800 flex flex-col p-3 gap-4 overflow-y-auto">

          {/* Active tool */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Active Tool</p>
            <div
              className="rounded-lg p-3 text-sm font-medium flex items-center gap-2"
              style={{
                background: tool === "erase" ? "#334155" : TOOL_META[tool].color.replace("0.55","0.15").replace("0.75","0.15").replace("0.65","0.15"),
                borderLeft: `3px solid ${tool === "erase" ? "#64748b" : TOOL_META[tool].color}`,
              }}
            >
              {(() => { const Icon = TOOL_META[tool].icon; return <Icon className="w-4 h-4" /> })()}
              {TOOL_META[tool].label}
            </div>
          </div>

          {/* Stats */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Stats</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Size</span>
                <span className="text-slate-200 font-mono">{cols}×{rows}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Collisions</span>
                <span className="text-red-400 font-mono">{collisionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Spawn</span>
                <span className={map.spawn ? "text-green-400" : "text-slate-600"}>
                  {map.spawn ? `${map.spawn.x},${map.spawn.y}` : "none"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Exits</span>
                <span className="text-purple-400 font-mono">{exitCount}</span>
              </div>
            </div>
          </div>

          {/* Grid size */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Grid Size</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-slate-400">Cols</Label>
                <Input
                  type="number"
                  value={cols}
                  min={10}
                  max={200}
                  onChange={(e) => setCols(parseInt(e.target.value) || 30)}
                  className="bg-slate-800 border-slate-700 text-white h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Rows</Label>
                <Input
                  type="number"
                  value={rows}
                  min={10}
                  max={200}
                  onChange={(e) => setRows(parseInt(e.target.value) || 20)}
                  className="bg-slate-800 border-slate-700 text-white h-8 text-sm mt-1"
                />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Legend</p>
            <div className="space-y-1.5">
              {(Object.entries(TOOL_META) as [PaintTool, typeof TOOL_META[PaintTool]][]).map(([t, m]) => (
                <div key={t} className="flex items-center gap-2 text-xs text-slate-300">
                  <div
                    className="w-4 h-4 rounded border border-slate-600"
                    style={{ background: m.color === "transparent" ? "#334155" : m.color }}
                  />
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="mt-auto">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Tips</p>
            <ul className="text-xs text-slate-500 space-y-1 leading-relaxed">
              <li>🖱 Drag to paint</li>
              <li>🤏 Pinch to zoom</li>
              <li>✋ Right-drag to pan</li>
              <li>⭐ Only one spawn</li>
              <li>📤 Export → drop in WA</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom status bar ─────────────────────────────────────────────── */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-1.5 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Layers className="w-3 h-3" /> {cols}×{rows} tiles · {TILE}px grid
        </span>
        <span className="text-slate-600">|</span>
        <span>{Math.round(scale * 100)}% zoom</span>
        <span className="text-slate-600">|</span>
        <span className="text-red-400">{collisionCount} collisions</span>
        <span className="text-slate-600">|</span>
        <span className={map.spawn ? "text-green-400" : ""}>spawn: {map.spawn ? `${map.spawn.x},${map.spawn.y}` : "not set"}</span>
        <span className="text-slate-600">|</span>
        <span className="text-purple-400">{exitCount} exits</span>
      </div>
    </div>
  )
}
