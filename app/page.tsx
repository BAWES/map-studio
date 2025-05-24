"use client"

import { useState } from "react"
import LandingPage from "./components/landing-page"
import MapEditor from "./components/map-editor"

export default function App() {
  const [currentView, setCurrentView] = useState<"landing" | "editor">("landing")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLaunchStudio = () => {
    setCurrentView("editor")
  }

  const handleConnectGitHub = () => {
    // Simulate GitHub OAuth flow
    setIsAuthenticated(true)
    setCurrentView("editor")
  }

  const handleBackToHome = () => {
    setCurrentView("landing")
  }

  if (currentView === "editor") {
    return (
      <MapEditor
        isAuthenticated={isAuthenticated}
        onBackToHome={handleBackToHome}
        onConnectGitHub={handleConnectGitHub}
      />
    )
  }

  return <LandingPage onLaunchStudio={handleLaunchStudio} onConnectGitHub={handleConnectGitHub} />
}
