'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import { Message } from '@/app/types'

interface ChatInterfaceProps {
  messages: Message[]
  conversationId: string
}

export default function ChatInterface({ messages: initialMessages, conversationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const messageId = uuidv4()

    // Add user message immediately
    const userMessage: Message = {
      id: messageId,
      role: 'user',
      content: newMessage,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setNewMessage('')

    try {
      // Send message to API
      const response = await axios.post(`/api/conversation/${conversationId}/message`, {
        message: newMessage,
      })

      // Add AI response
      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.data.message,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-4 mb-4 max-h-[600px] overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 ml-12'
                : 'bg-gray-100 mr-12'
            }`}
          >
            <div className="text-sm text-gray-500 mb-1">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className={`px-4 py-2 text-white rounded ${
            !newMessage.trim() || sending
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
} 