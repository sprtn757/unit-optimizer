import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/app/services/auth.service'
import { AnalysisService } from '@/app/services/analysis.service'

async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    throw new Error('No token provided')
  }
  return AuthService.verifyToken(token)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request)

    // Get session results
    const session = await AnalysisService.getSessionResults(params.sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this session
    if (session.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    return NextResponse.json(session)
  } catch (error: any) {
    console.error('Error fetching results:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch results' },
      { status: error.message.includes('token') ? 401 : 500 }
    )
  }
} 