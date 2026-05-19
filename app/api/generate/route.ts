import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const OPENAI_API_URL = "https://api.openai.com/v1"

export interface GenerateRequest {
  prompt: string
  width: number
  height: number
  /** Base64-encoded PNG of the surrounding canvas context (for inpainting) */
  contextImage?: string
  /** Base64-encoded alpha mask — white = fill region, black = keep (for inpainting) */
  maskImage?: string
}

export interface GenerateResponse {
  /** Base64-encoded PNG of the generated image */
  image: string
}

/**
 * Clamps a dimension to the nearest OpenAI-supported size.
 * gpt-image-1 supports: 1024x1024, 1024x1536, 1536x1024
 * We always generate at 1024x1024 and let the client crop/scale.
 */
function resolveSize(_w: number, _h: number): "1024x1024" | "1024x1536" | "1536x1024" {
  return "1024x1024"
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    )
  }

  let body: GenerateRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { prompt, width, height, contextImage, maskImage } = body

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 })
  }
  if (!width || !height || width <= 0 || height <= 0) {
    return NextResponse.json({ error: "width and height must be positive numbers" }, { status: 400 })
  }

  const size = resolveSize(width, height)

  try {
    let base64Image: string

    if (contextImage && maskImage) {
      // Inpainting path — use image edits endpoint
      base64Image = await callImageEdit({ apiKey, prompt, contextImage, maskImage, size })
    } else {
      // Text-to-image path
      base64Image = await callImageGenerate({ apiKey, prompt, size })
    }

    return NextResponse.json({ image: base64Image } satisfies GenerateResponse)
  } catch (err: unknown) {
    console.error("[/api/generate] OpenAI error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

// ---------------------------------------------------------------------------
// OpenAI helpers
// ---------------------------------------------------------------------------

async function callImageGenerate({
  apiKey,
  prompt,
  size,
}: {
  apiKey: string
  prompt: string
  size: string
}): Promise<string> {
  const res = await fetch(`${OPENAI_API_URL}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: prompt.trim(),
      n: 1,
      size,
      response_format: "b64_json",
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI generations API ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.data[0].b64_json as string
}

async function callImageEdit({
  apiKey,
  prompt,
  contextImage,
  maskImage,
  size,
}: {
  apiKey: string
  prompt: string
  contextImage: string
  maskImage: string
  size: string
}): Promise<string> {
  // Image edits endpoint requires multipart/form-data
  const formData = new FormData()
  formData.append("model", "gpt-image-1")
  formData.append("prompt", prompt.trim())
  formData.append("n", "1")
  formData.append("size", size)
  formData.append("response_format", "b64_json")

  // Convert base64 → Blob for form upload
  const imageBlob = base64ToBlob(contextImage, "image/png")
  const maskBlob = base64ToBlob(maskImage, "image/png")
  formData.append("image", imageBlob, "context.png")
  formData.append("mask", maskBlob, "mask.png")

  const res = await fetch(`${OPENAI_API_URL}/images/edits`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI edits API ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.data[0].b64_json as string
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  // Strip data URL prefix if present
  const b64 = base64.includes(",") ? base64.split(",")[1] : base64
  const bytes = Buffer.from(b64, "base64")
  return new Blob([bytes], { type: mimeType })
}
