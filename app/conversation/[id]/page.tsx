'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ChatInterface from '@/app/components/ChatInterface'
import { Message } from '@/app/types'

export default function ConversationPage() {
  const params = useParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // In a real implementation, we would fetch messages from the API
        // For now, we'll just set a mock welcome message
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: 'I have analyzed your content. What would you like to know?',
            timestamp: Date.now(),
          },
        ])
        setLoading(false)
      } catch (err) {
        setError('Failed to load conversation')
        setLoading(false)
      }
    }

    fetchMessages()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ChatInterface messages={messages} conversationId={params.id as string} />
    </div>
  )
} 