import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('Uploading file:', file.name, 'Size:', file.size)

    // Upload to Vercel Blob with random suffix to avoid duplicates
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,  // This prevents the "already exists" error
    })

    console.log('Upload successful:', blob.url)

    return NextResponse.json({
      success: true,
      url: blob.url,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Upload failed - check server logs' },
      { status: 500 }
    )
  }
}