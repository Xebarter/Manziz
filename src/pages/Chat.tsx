import React, { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, X, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Message } from '../lib/supabase'
import toast from 'react-hot-toast'

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initializeChat()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeChat = async () => {
    try {
      // First, try to find existing conversation for this customer
      // In a real app, you'd use actual customer identification
      const customerId = `customer_${Date.now()}`
      
      // For demo purposes, we'll create a new conversation each time
      // In production, you'd want to persist customer identity
      await createNewConversation(customerId)
      
    } catch (error) {
      console.error('Error initializing chat:', error)
      toast.error('Failed to initialize chat')
    }
  }

  const createNewConversation = async (customerId: string) => {
    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          customer_identifier: customerId,
          status: 'new'
        })
        .select()
        .single()

      if (error) throw error
      
      setConversationId(conversation.id)
      await fetchMessages(conversation.id)
      setupRealtimeSubscription(conversation.id)
      
    } catch (error) {
      console.error('Error creating conversation:', error)
      toast.error('Failed to create conversation')
    }
  }

  const fetchMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
      if (isLoading) {
        toast.error('Failed to load messages')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealtimeSubscription = (convId: string) => {
    // Set up real-time subscription with error handling
    let subscription: any = null
    
    try {
      subscription = supabase
        .channel(`messages_${convId}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `conversation_id=eq.${convId}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message])
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to messages')
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('Real-time subscription failed, falling back to polling')
            startPolling(convId)
          }
        })
    } catch (error) {
      console.warn('Real-time subscription setup failed:', error)
      startPolling(convId)
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }

  // Fallback polling mechanism
  const startPolling = (convId: string) => {
    const interval = setInterval(() => {
      fetchMessages(convId)
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `chat/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('files')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !conversationId) return

    setIsSending(true)

    try {
      let fileUrl = null
      
      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile)
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          sender: 'customer',
          message: newMessage.trim() || (fileUrl ? 'File attachment' : ''),
          file_url: fileUrl,
          conversation_id: conversationId
        })

      if (error) throw error

      setNewMessage('')
      setSelectedFile(null)
      
      // Refresh messages after sending to ensure consistency
      setTimeout(() => {
        fetchMessages(conversationId)
      }, 500)
      
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only images, PDFs, and text files are allowed')
        return
      }
      
      setSelectedFile(file)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const isImageFile = (url: string) => {
    return /\.(jpg|jpeg|png|gif)$/i.test(url)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Live Chat Support</h1>
                <p className="text-yellow-100">We're here to help! Send us a message.</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No messages yet. Start a conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'customer'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    {message.file_url && (
                      <div className="mb-2">
                        {isImageFile(message.file_url) ? (
                          <img
                            src={message.file_url}
                            alt="Attachment"
                            className="max-w-full h-auto rounded"
                          />
                        ) : (
                          <a
                            href={message.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-300 hover:text-blue-100 underline"
                          >
                            📎 View Attachment
                          </a>
                        )}
                      </div>
                    )}
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'customer' ? 'text-orange-200' : 'text-gray-500'
                    }`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* File Preview */}
          {selectedFile && (
            <div className="px-6 py-2 bg-gray-50 border-t">
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                <div className="flex items-center space-x-2">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{selectedFile.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
                <button
                  onClick={removeSelectedFile}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-6 border-t">
            <div className="flex items-end space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.txt"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={1}
                  style={{ minHeight: '40px', maxHeight: '100px' }}
                />
              </div>

              <button
                onClick={sendMessage}
                disabled={(!newMessage.trim() && !selectedFile) || isSending}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isSending ? 'Sending...' : 'Send'}
                </span>
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send • Attach files up to 5MB • We typically respond within a few minutes
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setNewMessage('I need help with my order')}
            className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Order Help</h3>
            <p className="text-sm text-gray-600">Get assistance with your current or past orders</p>
          </button>

          <button
            onClick={() => setNewMessage('I want to make a reservation')}
            className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Reservations</h3>
            <p className="text-sm text-gray-600">Book a table or modify existing reservations</p>
          </button>

          <button
            onClick={() => setNewMessage('I have feedback about my experience')}
            className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Feedback</h3>
            <p className="text-sm text-gray-600">Share your thoughts and suggestions with us</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chat