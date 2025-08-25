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

    // Get the token from the environment variable (using the existing name)
    const token = process.env.Storage_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      console.error('No blob storage token found')
      return NextResponse.json(
        { success: false, error: 'Storage configuration error' },
        { status: 500 }
      )
    }

    // Upload to Vercel Blob with the token
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
      token: token,
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