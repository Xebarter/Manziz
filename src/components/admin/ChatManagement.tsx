import React, { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, User, Clock, CheckCircle, AlertCircle, X, Trash2, MoreVertical } from 'lucide-react'
import { Message, Conversation } from '../../lib/supabase'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const ChatManagement: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'pending' | 'resolved'>('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'conversation' | 'message', id: string } | null>(null)
  const [showConversationMenu, setShowConversationMenu] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    fetchConversations()
    const cleanup = setupRealtimeSubscription()
    
    return () => {
      isMountedRef.current = false
      cleanup()
    }
  }, [])

  useEffect(() => {
    if (selectedConversation && isMountedRef.current) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    if (isMountedRef.current) {
      scrollToBottom()
    }
  }, [messages])

  const setupRealtimeSubscription = () => {
    // Set up real-time subscription directly in useEffect
    const realtimeChannel = supabase
      .channel('admin_chat_management')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (!isMountedRef.current) return
          
          console.log('Real-time message change:', payload.eventType, payload.new || payload.old)
          
          switch (payload.eventType) {
            case 'INSERT':
              const newMessage = payload.new as Message
              if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
                setMessages(prev => [...prev, newMessage])
              }
              // Refresh conversations to update last message time and status
              fetchConversations()
              break
              
            case 'UPDATE':
              const updatedMessage = payload.new as Message
              if (selectedConversation && updatedMessage.conversation_id === selectedConversation.id) {
                setMessages(prev => 
                  prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
                )
              }
              break
              
            case 'DELETE':
              const deletedMessage = payload.old as Message
              if (selectedConversation && deletedMessage.conversation_id === selectedConversation.id) {
                setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id))
              }
              break
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          if (!isMountedRef.current) return
          
          console.log('Real-time conversation change:', payload.eventType, payload.new || payload.old)
          
          switch (payload.eventType) {
            case 'INSERT':
              const newConversation = payload.new as Conversation
              setConversations(prev => [newConversation, ...prev])
              break
              
            case 'UPDATE':
              const updatedConversation = payload.new as Conversation
              setConversations(prev => 
                prev.map(conv => 
                  conv.id === updatedConversation.id ? updatedConversation : conv
                )
              )
              if (selectedConversation && selectedConversation.id === updatedConversation.id) {
                setSelectedConversation(updatedConversation)
              }
              break
              
            case 'DELETE':
              const deletedConversation = payload.old as Conversation
              setConversations(prev => prev.filter(conv => conv.id !== deletedConversation.id))
              
              // If the deleted conversation was selected, clear selection
              if (selectedConversation && selectedConversation.id === deletedConversation.id) {
                setSelectedConversation(null)
                setMessages([])
              }
              break
          }
        }
      )
      .subscribe((status, err) => {
        if (!isMountedRef.current) return
        
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true)
          console.log('Real-time subscription established')
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setIsRealtimeConnected(false)
          console.warn('Real-time subscription failed, falling back to polling:', status, err)
          startPolling()
        }
      })

    // Cleanup function
    return () => {
      try {
        realtimeChannel.unsubscribe()
      } catch (error) {
        console.error('Error unsubscribing from real-time channel:', error)
      }
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }

  const startPolling = () => {
    if (pollingIntervalRef.current || !isMountedRef.current) {
      return
    }

    console.log('Starting polling fallback for conversations')
    pollingIntervalRef.current = setInterval(async () => {
      if (!isMountedRef.current) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        return
      }
      
      try {
        await fetchConversations()
        if (selectedConversation) {
          await fetchMessages(selectedConversation.id)
        }
      } catch (error) {
        console.error('Error polling for updates:', error)
      }
    }, 5000) // Poll every 5 seconds
  }

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false })

      if (error) throw error
      
      if (isMountedRef.current) {
        setConversations(data || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      if (isMountedRef.current) {
        toast.error('Failed to load conversations')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      if (isMountedRef.current) {
        setMessages(data || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      if (isMountedRef.current) {
        toast.error('Failed to load messages')
      }
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !isMountedRef.current) return

    setIsSending(true)

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender: 'admin',
          message: newMessage.trim(),
          conversation_id: selectedConversation.id
        })

      if (error) throw error

      if (isMountedRef.current) {
        setNewMessage('')
        
        // Update conversation status to pending if it was resolved
        if (selectedConversation.status === 'resolved') {
          await updateConversationStatus(selectedConversation.id, 'pending')
        }
        
        if (!isRealtimeConnected) {
          await fetchMessages(selectedConversation.id)
          await fetchConversations()
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
      if (isMountedRef.current) {
        toast.error('Failed to send message')
      }
    } finally {
      if (isMountedRef.current) {
        setIsSending(false)
      }
    }
  }

  const updateConversationStatus = async (conversationId: string, status: 'new' | 'pending' | 'resolved') => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)

      if (error) throw error

      if (isMountedRef.current) {
        toast.success(`Conversation marked as ${status}`)
        
        // Update local state
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, status, updated_at: new Date().toISOString() }
              : conv
          )
        )
        
        if (selectedConversation && selectedConversation.id === conversationId) {
          setSelectedConversation(prev => prev ? { ...prev, status } : null)
        }
      }
      
    } catch (error) {
      console.error('Error updating conversation status:', error)
      if (isMountedRef.current) {
        toast.error('Failed to update conversation status')
      }
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .select()

      if (error) throw error

      if (isMountedRef.current) {
        toast.success('Message deleted successfully')
        
        if (!isRealtimeConnected && selectedConversation) {
          await fetchMessages(selectedConversation.id)
          await fetchConversations()
        }
      }
      
    } catch (error: any) {
      console.error('Error deleting message:', error)
      if (isMountedRef.current) {
        toast.error(error.message || 'Failed to delete message')
      }
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      // First delete all messages in the conversation
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId)
        .select()

      if (messagesError) throw messagesError

      // Then delete the conversation
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .select()

      if (conversationError) throw conversationError

      if (isMountedRef.current) {
        toast.success('Conversation deleted successfully')
        
        // Clear selection if the deleted conversation was selected
        if (selectedConversation && selectedConversation.id === conversationId) {
          setSelectedConversation(null)
          setMessages([])
        }
        
        if (!isRealtimeConnected) {
          await fetchConversations()
        }
      }
      
    } catch (error: any) {
      console.error('Error deleting conversation:', error)
      if (isMountedRef.current) {
        toast.error(error.message || 'Failed to delete conversation')
      }
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    if (deleteTarget.type === 'conversation') {
      await deleteConversation(deleteTarget.id)
    } else {
      await deleteMessage(deleteTarget.id)
    }

    setShowDeleteModal(false)
    setDeleteTarget(null)
  }

  const openDeleteModal = (type: 'conversation' | 'message', id: string) => {
    setDeleteTarget({ type, id })
    setShowDeleteModal(true)
    setShowConversationMenu(null)
  }

  const closeChat = () => {
    setSelectedConversation(null)
    setMessages([])
    setShowConversationMenu(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
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

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <MessageCircle className="w-4 h-4" />
    }
  }

  const filteredConversations = conversations.filter(conv => 
    statusFilter === 'all' || conv.status === statusFilter
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat Management</h1>
          <p className="text-gray-600">Manage customer conversations and provide support</p>
          {!isRealtimeConnected && (
            <div className="mt-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md inline-block">
              Real-time updates unavailable - using polling mode
            </div>
          )}
        </div>
        
        {selectedConversation && (
          <button
            onClick={closeChat}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Close Chat</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header with filters */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                {isRealtimeConnected && (
                  <span className="inline-flex items-center text-sm text-green-600">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                    Live
                  </span>
                )}
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="all">All Conversations</option>
                <option value="new">New</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Conversations list */}
            <div className="max-h-96 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No conversations found</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors relative ${
                      selectedConversation?.id === conversation.id ? 'bg-orange-50 border-orange-200' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div 
                        className="flex items-center space-x-2 cursor-pointer flex-1"
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900 text-sm">
                          {conversation.customer_identifier.startsWith('anonymous_') 
                            ? 'Anonymous Customer' 
                            : conversation.customer_identifier}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(conversation.status)}`}>
                          {getStatusIcon(conversation.status)}
                          <span className="capitalize">{conversation.status}</span>
                        </span>
                        
                        <div className="relative">
                          <button
                            onClick={() => setShowConversationMenu(
                              showConversationMenu === conversation.id ? null : conversation.id
                            )}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                          
                          {showConversationMenu === conversation.id && (
                            <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                              <button
                                onClick={() => setSelectedConversation(conversation)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                              >
                                Open Chat
                              </button>
                              <button
                                onClick={() => openDeleteModal('conversation', conversation.id)}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                Delete Chat
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Last activity: {formatTime(conversation.last_message_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {selectedConversation.customer_identifier.startsWith('anonymous_') 
                          ? 'Anonymous Customer' 
                          : selectedConversation.customer_identifier}
                      </h3>
                      <p className="text-orange-100 text-sm">
                        Status: {selectedConversation.status}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateConversationStatus(selectedConversation.id, 'pending')}
                      disabled={selectedConversation.status === 'pending'}
                      className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors disabled:opacity-50"
                    >
                      Mark Pending
                    </button>
                    <button
                      onClick={() => updateConversationStatus(selectedConversation.id, 'resolved')}
                      disabled={selectedConversation.status === 'resolved'}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => openDeleteModal('conversation', selectedConversation.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                    >
                      Delete Chat
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No messages in this conversation yet.</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                          message.sender === 'admin'
                            ? 'bg-orange-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'admin' ? 'text-orange-200' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                        
                        {/* Delete button for individual messages */}
                        <button
                          onClick={() => openDeleteModal('message', message.id)}
                          className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                            message.sender === 'admin' 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your response..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      rows={2}
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {isSending ? 'Sending...' : 'Send'}
                    </span>
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send • Shift+Enter for new line
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Chat Selected</h3>
              <p className="text-gray-600 mb-4">Choose a conversation from the list to start chatting with customers.</p>
              <p className="text-sm text-gray-500">You can also close any open chat to return to this view.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Response Templates */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Response Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            "Thank you for contacting Manziz! How can I help you today?",
            "Your order is being prepared and will be ready shortly.",
            "We apologize for any inconvenience. Let me help resolve this for you.",
            "Your reservation has been confirmed. We look forward to serving you!",
            "Thank you for your feedback. We appreciate your business!",
            "Our restaurant hours are Monday-Thursday 9AM-10PM, Friday-Saturday 9AM-11PM, Sunday 10AM-9PM."
          ].map((response, index) => (
            <button
              key={index}
              onClick={() => setNewMessage(response)}
              disabled={!selectedConversation}
              className="p-3 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {response}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Conversations</p>
              <p className="text-2xl font-bold text-gray-900">
                {conversations.filter(c => c.status === 'new').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {conversations.filter(c => c.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">
                {conversations.filter(c => c.status === 'resolved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete {deleteTarget.type === 'conversation' ? 'Conversation' : 'Message'}
                </h3>
                <p className="text-gray-600">
                  {deleteTarget.type === 'conversation' 
                    ? 'This will permanently delete the entire conversation and all its messages.'
                    : 'This will permanently delete this message.'
                  }
                </p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteTarget(null)
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete {deleteTarget.type === 'conversation' ? 'Conversation' : 'Message'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showConversationMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowConversationMenu(null)}
        />
      )}
    </div>
  )
}

export default ChatManagement