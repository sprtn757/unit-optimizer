import { prisma } from '../lib/prisma'
import { AnalysisSession, FileMetadata, AnalysisResult } from '@prisma/client'
import OpenAI from 'openai'
import https from 'https'

// Initialize OpenAI client lazily to avoid build-time errors
const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1',
    defaultHeaders: {
      'Content-Type': 'application/json'
    },
    maxRetries: 3,
    timeout: 30000
  })
}

// Add rate limiting
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class AnalysisService {
  static async createSession(userId: string) {
    return prisma.analysisSession.create({
      data: {
        userId,
        status: 'PENDING'
      }
    })
  }

  static async addFile(sessionId: string, fileData: {
    originalName: string;
    content: string;
    fileType: string;
    size: number;
  }) {
    return prisma.fileMetadata.create({
      data: {
        originalName: fileData.originalName,
        storagePath: '', // We're not storing files locally anymore
        fileType: fileData.fileType,
        size: fileData.size,
        content: fileData.content,
        sessionId
      }
    })
  }

  static async startAnalysis(sessionId: string) {
    // Update session status
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: { status: 'PROCESSING' }
    })

    try {
      // Get all files in the session with content
      const files = await prisma.fileMetadata.findMany({
        where: { sessionId },
        select: {
          id: true,
          sessionId: true,
          content: true,
          originalName: true,
          fileType: true,
          size: true,
          uploadedAt: true,
          storagePath: true
        }
      })

      // Process each file
      const results = await Promise.all(
        files.map(file => this.analyzeFile(file))
      )

      // Update session status to completed
      await prisma.analysisSession.update({
        where: { id: sessionId },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })

      return results
    } catch (error) {
      // Update session status to failed
      await prisma.analysisSession.update({
        where: { id: sessionId },
        data: { status: 'FAILED' }
      })
      throw error
    }
  }

  private static async analyzeFile(file: FileMetadata & { content: string }) {
    try {
      if (!file.content) {
        throw new Error('File content is required for analysis')
      }
      
      // Get OpenAI client
      const openai = getOpenAIClient()
      
      // Clean and prepare content
      const cleanedContent = file.content
        .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
        .trim()
        .slice(0, 4000) // Reduce token usage by limiting to 4K characters
      
      // Add delay between requests to avoid rate limits
      await sleep(1000)
      
      // Analyze with OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-instruct",
        messages: [
          {
            role: "system",
            content: `Analyze this educational content and provide a concise JSON response with:
1. Overall effectiveness score (0-100)
2. Key missed concepts or questions
3. Improvement suggestions
Keep the response focused and minimal.`
          },
          {
            role: "user",
            content: `Content to analyze:\n${cleanedContent}`
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })

      if (!completion.choices[0].message.content) {
        throw new Error('No response from GPT')
      }

      const analysis = JSON.parse(completion.choices[0].message.content)

      // Transform data to match UI expectations
      const transformedAnalysis = {
        overallScore: analysis.overallScore || 0,
        missedQuestions: (analysis.missedQuestions || []).map((q: any) => ({
          question: q.question || '',
          percentageMissed: q.percentageMissed || 0,
          relatedLessons: q.relatedLessons || [],
          improvementSuggestions: q.improvementSuggestions || []
        })),
        lessonRecommendations: (analysis.lessonRecommendations || []).map((l: any) => ({
          lessonName: l.lessonName || '',
          currentContent: l.currentContent || '',
          suggestedImprovements: l.suggestedImprovements || [],
          additionalResources: l.additionalResources || []
        }))
      }

      // Save analysis results
      return prisma.analysisResult.create({
        data: {
          fileId: file.id,
          sessionId: file.sessionId,
          overallScore: transformedAnalysis.overallScore,
          missedQuestions: transformedAnalysis.missedQuestions,
          lessonRecommendations: transformedAnalysis.lessonRecommendations
        }
      })
    } catch (error) {
      console.error(`Error analyzing file ${file.originalName}:`, error)
      // Return a partial result instead of throwing
      return prisma.analysisResult.create({
        data: {
          fileId: file.id,
          sessionId: file.sessionId,
          overallScore: 0,
          missedQuestions: [],
          lessonRecommendations: [{
            lessonName: 'Error Analysis',
            currentContent: 'Could not analyze file due to API limits',
            suggestedImprovements: ['Try again later'],
            additionalResources: []
          }]
        }
      })
    }
  }

  static async getSessionResults(sessionId: string) {
    return prisma.analysisSession.findUnique({
      where: { id: sessionId },
      include: {
        files: {
          select: {
            id: true,
            originalName: true,
            fileType: true,
            size: true,
            uploadedAt: true
          }
        },
        results: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  }

  static async getUserSessions(userId: string) {
    return prisma.analysisSession.findMany({
      where: { userId },
      include: {
        files: {
          select: {
            id: true,
            originalName: true,
            fileType: true,
            size: true,
            uploadedAt: true
          }
        },
        results: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }
} 