export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface AnalysisResult {
  conversationId: string
  message: string
  score?: number
  commonlyMissedQuestions?: string[]
  suggestions?: string[]
} 