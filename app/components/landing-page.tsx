"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Github, Users, Grid3X3, Sparkles, MousePointer2, Upload, ArrowRight } from "lucide-react"
import Link from "next/link"

interface LandingPageProps {
  onLaunchStudio: () => void
  onConnectGitHub: () => void
}

export default function LandingPage({ onLaunchStudio, onConnectGitHub }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Grid3X3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Universe Map Studio
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-slate-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">
                How it Works
              </Link>
              <Link href="#docs" className="text-slate-300 hover:text-white transition-colors">
                Docs
              </Link>
              <Button
                variant="outline"
                className="border-slate-700 text-white hover:bg-slate-800"
                onClick={onConnectGitHub}
              >
                <Github className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <Badge className="mb-6 bg-slate-800/50 text-purple-300 border-purple-500/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Now in Beta
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent leading-tight">
            Design Multiplayer
            <br />
            Worlds Visually
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            The next-generation visual editor for tile maps. Create, collaborate, and publish WorkAdventure-compatible
            worlds with AI assistance and real-time multiplayer editing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
              onClick={onConnectGitHub}
            >
              <Github className="w-5 h-5 mr-2" />
              Connect with GitHub
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-800 px-8 py-3 text-lg"
              onClick={onLaunchStudio}
            >
              Try Studio Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Start creating immediately • No account required • Designs saved locally
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-slate-900/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Built for Creators</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Professional-grade tools that make world building accessible to everyone
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI-Assisted Generation</h3>
                <p className="text-slate-400 text-sm">
                  Describe your world in natural language and watch AI generate the perfect tile layout
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MousePointer2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Works Offline</h3>
                <p className="text-slate-400 text-sm">
                  Start creating immediately with no account required. Your designs are saved locally on your device
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">GitHub Integration</h3>
                <p className="text-slate-400 text-sm">
                  Connect your GitHub account to sync projects, collaborate with teams, and auto-deploy to Pages
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">WorkAdventure Ready</h3>
                <p className="text-slate-400 text-sm">
                  Export maps that work seamlessly with WorkAdventure and the Universe ecosystem
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Build Your Universe?</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Start creating immediately with no barriers. Connect GitHub later for advanced features and collaboration
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
              onClick={onLaunchStudio}
            >
              Launch Studio Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-800 px-8 py-3 text-lg"
              onClick={onConnectGitHub}
            >
              <Github className="w-5 h-5 mr-2" />
              Connect GitHub
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Free to use • No credit card required • Start building in seconds
          </p>
        </div>
      </section>
    </div>
  )
}
