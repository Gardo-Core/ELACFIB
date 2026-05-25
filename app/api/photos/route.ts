import { NextResponse } from "next/server"
import type { GalleryPhoto, GalleryMediaType } from "@/lib/gallery-types"

// Fallback static images (using high-quality local assets) sorted alphabetically
const FALLBACK_PHOTOS: GalleryPhoto[] = [
  { id: "local-1", src: "/images/fern-leaf.jpg", title: "Fern Leaf", order: 0, type: "image" },
  { id: "local-2", src: "/images/lake-reflection.jpg", title: "Lake Reflection", order: 1, type: "image" },
  { id: "local-3", src: "/images/misty-forest.jpg", title: "Misty Forest", order: 2, type: "image" },
  { id: "local-4", src: "/images/mountain-peak.jpg", title: "Mountain Peak", order: 3, type: "image" },
  { id: "local-5", src: "/images/rock-texture.jpg", title: "Rock Texture", order: 4, type: "image" },
  { id: "local-6", src: "/images/sand-dunes.jpg", title: "Sand Dunes", order: 5, type: "image" },
  { id: "local-7", src: "/images/starry-night.jpg", title: "Starry Night", order: 6, type: "image" },
  { id: "local-8", src: "/images/stormy-ocean.jpg", title: "Stormy Ocean", order: 7, type: "image" },
]

/**
 * Determine media type from Google Drive mimeType
 */
function getMediaType(mimeType: string): GalleryMediaType {
  if (mimeType.startsWith("video/")) return "video"
  return "image"
}

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
    // Query for both images AND videos
    const query = encodeURIComponent(
      `'${folderId}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed = false`
    )
    // Request thumbnailLink for video previews in the gallery grid
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,thumbnailLink)&pageSize=1000&key=${apiKey}`

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
    const sortedFiles = [...files].sort((a: any, b: any) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    )

    // 2. Map files to GalleryPhoto structure
    const photos: GalleryPhoto[] = sortedFiles.map((file: { id: string; name: string; mimeType: string; thumbnailLink?: string }, index: number) => {
      // Clean up filename extension to use as title
      const title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
      const type = getMediaType(file.mimeType)

      return {
        id: file.id,
        src: `https://drive.google.com/uc?export=view&id=${file.id}`,
        title: title,
        order: index,
        type: type,
        // For videos, use Google Drive's auto-generated thumbnail as preview
        // Fall back to the file URL itself if no thumbnail is available
        thumbnail: type === "video" ? (file.thumbnailLink || undefined) : undefined,
      }
    })

    return NextResponse.json({ photos, isDemo: false })
  } catch (error: any) {
    console.error("[API/Photos] Error fetching from Google Drive:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch media from Google Drive", 
        details: error.message,
        photos: FALLBACK_PHOTOS,
        isDemo: true
      },
      { status: 500 }
    )
  }
}
