"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Plus, FolderOpen, Trash2, Edit, Globe, Lock, Calendar, Github, Download, Upload } from "lucide-react"
import { getUserMaps, deleteMap, saveMapToCloud } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

interface MapProject {
  id: string
  name: string
  description: string | null
  map_data: any
  width: number
  height: number
  is_public: boolean
  created_at: string
  updated_at: string
  github_repo: string | null
  github_path: string | null
}

interface ProjectManagerProps {
  onOpenProject: (project: MapProject) => void
  onCreateNew: () => void
  currentMapData?: any
  currentMapName?: string
  currentMapId?: string
}

export default function ProjectManager({
  onOpenProject,
  onCreateNew,
  currentMapData,
  currentMapName,
  currentMapId,
}: ProjectManagerProps) {
  const { isAuthenticated, profile } = useAuth()
  const [projects, setProjects] = useState<MapProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const [saveAsName, setSaveAsName] = useState("")
  const [saveAsDescription, setSaveAsDescription] = useState("")

  useEffect(() => {
    if (isAuthenticated) {
      loadProjects()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (currentMapName) {
      setSaveAsName(currentMapName)
    }
  }, [currentMapName])

  const loadProjects = async () => {
    try {
      const { data, error } = await getUserMaps()
      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error("Error loading projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    try {
      const initialMapData = Array.from({ length: 600 }, (_, i) => ({
        x: i % 30,
        y: Math.floor(i / 30),
        tile: "grass",
        tileId: 0,
        teleport: false,
        spawn: false,
        collision: false,
      }))

      const { data, error } = await saveMapToCloud(initialMapData, newProjectName.trim())

      if (error) throw error

      setNewProjectName("")
      setNewProjectDescription("")
      setShowNewProject(false)
      await loadProjects()

      if (data) {
        onOpenProject(data)
      }
    } catch (error) {
      console.error("Error creating project:", error)
      alert("Failed to create project. Please try again.")
    }
  }

  const handleSaveCurrentProject = async () => {
    if (!saveAsName.trim() || !currentMapData) return

    try {
      const { data, error } = await saveMapToCloud(currentMapData, saveAsName.trim(), currentMapId)

      if (error) throw error

      setSaveAsName("")
      setSaveAsDescription("")
      setShowSaveDialog(false)
      await loadProjects()
    } catch (error) {
      console.error("Error saving project:", error)
      alert("Failed to save project. Please try again.")
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      const { error } = await deleteMap(projectId)
      if (error) throw error
      await loadProjects()
    } catch (error) {
      console.error("Error deleting project:", error)
      alert("Failed to delete project. Please try again.")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const exportProject = (project: MapProject) => {
    const exportData = {
      name: project.name,
      width: project.width,
      height: project.height,
      tilewidth: 32,
      tileheight: 32,
      layers: [
        {
          name: "base",
          type: "tilelayer",
          data: project.map_data.map((cell: any) => cell.tileId + 1),
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
      objects: project.map_data
        .filter((cell: any) => cell.teleport || cell.spawn)
        .map((cell: any) => ({
          id: cell.x * project.height + cell.y,
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
    a.download = `${project.name.replace(/\s+/g, "_").toLowerCase()}.tmj`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto">
          <Github className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Connect GitHub to Manage Projects</h3>
          <p className="text-slate-400 mb-4">
            Sign in with GitHub to save your maps to the cloud, sync across devices, and collaborate with others.
          </p>
          <p className="text-sm text-slate-500">You can still create maps locally without signing in.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading your projects...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Projects</h2>
          <p className="text-slate-400">Welcome back, {profile?.github_username || profile?.full_name || "Creator"}!</p>
        </div>
        <div className="flex gap-2">
          {currentMapData && (
            <Button onClick={() => setShowSaveDialog(true)} className="bg-green-600 hover:bg-green-700">
              <Upload className="w-4 h-4 mr-2" />
              Save Current
            </Button>
          )}
          <Button onClick={() => setShowNewProject(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-slate-400 mb-4">Create your first map project to get started.</p>
          <Button onClick={() => setShowNewProject(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg mb-1">{project.name}</CardTitle>
                    {project.description && <p className="text-slate-400 text-sm">{project.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {project.is_public ? (
                      <Globe className="w-4 h-4 text-green-400" title="Public" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-400" title="Private" />
                    )}
                    {project.github_repo && <Github className="w-4 h-4 text-blue-400" title="Synced with GitHub" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                  <Calendar className="w-3 h-3" />
                  <span>Updated {formatDate(project.updated_at)}</span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs">
                    {project.width}×{project.height}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {project.map_data?.length || 0} tiles
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onOpenProject(project)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportProject(project)}
                    className="border-slate-600"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteProject(project.id)}
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Project Dialog */}
      <Sheet open={showNewProject} onOpenChange={setShowNewProject}>
        <SheetContent side="right" className="bg-slate-900 border-slate-800 text-white w-96">
          <SheetHeader>
            <SheetTitle className="text-white">Create New Project</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <Label className="text-sm text-slate-300">Project Name</Label>
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="My Awesome Map"
                className="bg-slate-800 border-slate-700 text-white mt-2"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-300">Description (Optional)</Label>
              <Textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="A brief description of your map..."
                className="bg-slate-800 border-slate-700 text-white mt-2"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Create Project
              </Button>
              <Button variant="outline" onClick={() => setShowNewProject(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Save Current Project Dialog */}
      <Sheet open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <SheetContent side="right" className="bg-slate-900 border-slate-800 text-white w-96">
          <SheetHeader>
            <SheetTitle className="text-white">{currentMapId ? "Update Project" : "Save Project"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <Label className="text-sm text-slate-300">Project Name</Label>
              <Input
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                placeholder="My Awesome Map"
                className="bg-slate-800 border-slate-700 text-white mt-2"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-300">Description (Optional)</Label>
              <Textarea
                value={saveAsDescription}
                onChange={(e) => setSaveAsDescription(e.target.value)}
                placeholder="A brief description of your map..."
                className="bg-slate-800 border-slate-700 text-white mt-2"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSaveCurrentProject}
                disabled={!saveAsName.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {currentMapId ? "Update" : "Save"} Project
              </Button>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
