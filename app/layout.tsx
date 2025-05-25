import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Universe Map Studio - Visual Map Editor for WorkAdventure",
  description:
    "Create WorkAdventure-compatible tile maps with AI assistance. Visual editor with GitHub integration, real-time collaboration, and instant deployment.",
  keywords: "WorkAdventure, map editor, tile maps, game development, multiplayer worlds, AI generation",
  authors: [{ name: "BAWES", url: "https://github.com/BAWES" }],
  creator: "BAWES",
  publisher: "Universe Map Studio",
  generator: "v0.dev",
  applicationName: "Universe Map Studio",
  referrer: "origin-when-cross-origin",
  metadataBase: new URL("https://v0-universe-map-studio.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://v0-universe-map-studio.vercel.app",
    title: "Universe Map Studio - Visual Map Editor for WorkAdventure",
    description:
      "Create WorkAdventure-compatible tile maps with AI assistance. Visual editor with GitHub integration, real-time collaboration, and instant deployment.",
    siteName: "Universe Map Studio",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Universe Map Studio - Visual Map Editor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Universe Map Studio - Visual Map Editor for WorkAdventure",
    description:
      "Create WorkAdventure-compatible tile maps with AI assistance. Visual editor with GitHub integration, real-time collaboration, and instant deployment.",
    images: ["/og-image.png"],
    creator: "@BAWES",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
