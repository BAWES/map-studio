"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import LandingPage from "./components/landing-page"
import MapEditor from "./components/map-editor"
import ProjectManager from "@/components/project-manager"
import { useAuth } from "@/hooks/useAuth"
import { signInWithGitHub, signOut } from "@/lib/supabase"

export default function App() {
  const searchParams = useSearchParams()
  const { user, profile, loading, isAuthenticated } = useAuth()
  const [currentView, setCurrentView] = useState<"landing" | "editor" | "projects">("landing")
  const [currentProject, setCurrentProject] = useState<any>(null)

  useEffect(() => {
    // Check if user was just authenticated
    if (searchParams?.get("authenticated") === "true" && isAuthenticated) {
      setCurrentView("projects")
    }
  }, [searchParams, isAuthenticated])

  const handleLaunchStudio = () => {
    if (isAuthenticated) {
      setCurrentView("projects")
    } else {
      setCurrentView("editor")
    }
  }

  const handleConnectGitHub = async () => {
    try {
      const { error } = await signInWithGitHub()
      if (error) {
        console.error("GitHub sign in error:", error)
        alert("Failed to sign in with GitHub. Please try again.")
      }
    } catch (error) {
      console.error("GitHub sign in error:", error)
      alert("Failed to sign in with GitHub. Please try again.")
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setCurrentView("landing")
      setCurrentProject(null)
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const handleBackToHome = () => {
    setCurrentView("landing")
    setCurrentProject(null)
  }

  const handleBackToProjects = () => {
    setCurrentView("projects")
  }

  const handleOpenProject = (project: any) => {
    setCurrentProject(project)
    setCurrentView("editor")
  }

  const handleCreateNewProject = () => {
    setCurrentProject(null)
    setCurrentView("editor")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading Universe Map Studio...</p>
        </div>
      </div>
    )
  }

  if (currentView === "projects") {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-slate-800 bg-slate-900">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">U</span>
              </div>
              <span className="text-xl font-bold">Universe Map Studio</span>
            </div>
            <div className="flex items-center gap-4">
              {profile && (
                <div className="flex items-center gap-3">
                  {profile.avatar_url && (
                    <img
                      src={profile.avatar_url || "/placeholder.svg"}
                      alt={profile.github_username || "User"}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm text-slate-300">{profile.github_username || profile.full_name}</span>
                </div>
              )}
              <button onClick={handleSignOut} className="text-sm text-slate-400 hover:text-white transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </header>
        <ProjectManager onOpenProject={handleOpenProject} onCreateNew={handleCreateNewProject} />
      </div>
    )
  }

  if (currentView === "editor") {
    return (
      <MapEditor
        isAuthenticated={isAuthenticated}
        onBackToHome={handleBackToHome}
        onBackToProjects={isAuthenticated ? handleBackToProjects : undefined}
        onConnectGitHub={handleConnectGitHub}
        initialProject={currentProject}
        userProfile={profile}
      />
    )
  }

  return (
    <LandingPage
      onLaunchStudio={handleLaunchStudio}
      onConnectGitHub={handleConnectGitHub}
      isAuthenticated={isAuthenticated}
      userProfile={profile}
    />
  )
}
