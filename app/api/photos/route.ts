import { NextResponse } from "next/server"
import type { GalleryPhoto } from "@/lib/gallery-types"

// Fallback static images (using high-quality local assets) sorted alphabetically
const FALLBACK_PHOTOS: GalleryPhoto[] = [
  { id: "local-1", src: "/images/fern-leaf.jpg", title: "Fern Leaf", order: 0 },
  { id: "local-2", src: "/images/lake-reflection.jpg", title: "Lake Reflection", order: 1 },
  { id: "local-3", src: "/images/misty-forest.jpg", title: "Misty Forest", order: 2 },
  { id: "local-4", src: "/images/mountain-peak.jpg", title: "Mountain Peak", order: 3 },
  { id: "local-5", src: "/images/rock-texture.jpg", title: "Rock Texture", order: 4 },
  { id: "local-6", src: "/images/sand-dunes.jpg", title: "Sand Dunes", order: 5 },
  { id: "local-7", src: "/images/starry-night.jpg", title: "Starry Night", order: 6 },
  { id: "local-8", src: "/images/stormy-ocean.jpg", title: "Stormy Ocean", order: 7 },
]

export async function GET() {
  const apiKey = process.env.GOOGLE_API_KEY
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  // If variables are missing or set to placeholder defaults, return fallback local photos
  if (
    !apiKey || 
    !folderId || 
    apiKey === "YOUR_GOOGLE_API_KEY" || 
    folderId === "YOUR_GOOGLE_DRIVE_FOLDER_ID"
  ) {
    console.warn("[API/Photos] Google Drive credentials not configured. Serving local fallback images.")
    return NextResponse.json({
      photos: FALLBACK_PHOTOS,
      isDemo: true,
      message: "Configura GOOGLE_API_KEY e GOOGLE_DRIVE_FOLDER_ID in .env.local per connettere Google Drive."
    })
  }

  try {
    const query = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`)
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=1000&key=${apiKey}`

    const response = await fetch(url, {
      next: { revalidate: 60 } // Cache results for 60 seconds
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Google API returned status ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    const files = data.files || []

    // 1. Sort files alphabetically by name
    const sortedFiles = [...files].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    )

    // 2. Map files to GalleryPhoto structure
    const photos: GalleryPhoto[] = sortedFiles.map((file: { id: string; name: string }, index: number) => {
      // Clean up filename extension to use as title
      const title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
      
      return {
        id: file.id,
        src: `https://drive.google.com/uc?export=view&id=${file.id}`,
        title: title,
        order: index
      }
    })

    return NextResponse.json({ photos, isDemo: false })
  } catch (error: any) {
    console.error("[API/Photos] Error fetching from Google Drive:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch images from Google Drive", 
        details: error.message,
        photos: FALLBACK_PHOTOS,
        isDemo: true
      },
      { status: 500 }
    )
  }
}
