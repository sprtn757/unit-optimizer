import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/app/services/auth.service'
import { AnalysisService } from '@/app/services/analysis.service'

// Middleware to verify JWT token
async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    throw new Error('No token provided')
  }
  return AuthService.verifyToken(token)
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request)

    // Create new analysis session
    const session = await AnalysisService.createSession(auth.userId)

    // Get form data with files
    const formData = await request.formData()
    const uploadedFiles = formData.getAll('files')

    // Process each file
    const filePromises = uploadedFiles.map(async (file: any) => {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Handle different file types
      let content: string
      if (file.type.startsWith('text/') || 
          file.type === 'application/json' ||
          file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        content = buffer.toString('utf-8')
      } else {
        // For non-text files, we'll need to handle them differently
        // For now, we'll just extract what we can
        content = buffer.toString('base64')
      }
      
      // Create file metadata with content
      const fileData = {
        originalName: file.name,
        content,
        fileType: file.type,
        size: buffer.length
      }

      return AnalysisService.addFile(session.id, fileData)
    })

    // Wait for all files to be processed
    const processedFiles = await Promise.all(filePromises)

    // Start the analysis
    const results = await AnalysisService.startAnalysis(session.id)

    return NextResponse.json({
      sessionId: session.id,
      results
    })
  } catch (error: any) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: error.message.includes('token') ? 401 : 500 }
    )
  }
} 