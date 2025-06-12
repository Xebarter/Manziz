import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Search, Filter, Bot, User, Phone, Mail, Eye, BookMarked as MarkAsRead } from 'lucide-react';
import { MessageService, Message } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

const MessageManagement: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [senderFilter, setSenderFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, searchTerm, senderFilter, readFilter]);

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await MessageService.getMessages();
      if (error) {
        console.error('Error fetching messages:', error);
        // Set demo data
        setMessages([
          {
            id: '1',
            sender: 'customer',
            message: 'Hi, I wanted to ask about your delivery times to Kampala city center?',
            customer_name: 'John Doe',
            customer_email: 'john@example.com',
            customer_phone: '+256784811208',
            is_read: false,
            created_at: new Date(Date.now() - 300000).toISOString()
          },
          {
            id: '2',
            sender: 'admin',
            message: 'Hello John! We deliver to Kampala city center within 30-45 minutes. Is there anything specific you\'d like to order?',
            reply_to: '1',
            is_read: true,
            created_at: new Date(Date.now() - 240000).toISOString()
          },
          {
            id: '3',
            sender: 'customer',
            message: 'Great! Do you have any vegetarian burger options?',
            customer_name: 'John Doe',
            customer_email: 'john@example.com',
            is_read: false,
            created_at: new Date(Date.now() - 180000).toISOString()
          },
          {
            id: '4',
            sender: 'customer',
            message: 'What are your opening hours?',
            customer_name: 'Jane Smith',
            customer_email: 'jane@example.com',
            customer_phone: '+256784811209',
            is_read: false,
            created_at: new Date(Date.now() - 120000).toISOString()
          }
        ]);
      } else {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { count } = await MessageService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  const setupRealtimeSubscription = useCallback(() => {
    const subscription = MessageService.subscribeToMessages((newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      if (newMessage.sender === 'customer' && !newMessage.is_read) {
        setUnreadCount(prev => prev + 1);
        toast.success('New customer message received!');
      }
    });

    const updateSubscription = MessageService.subscribeToMessageUpdates((updatedMessage) => {
      setMessages(prev => prev.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      ));
    });

    return () => {
      subscription.unsubscribe();
      updateSubscription.unsubscribe();
    };
  }, []);

  const filterMessages = useCallback(() => {
    let filtered = messages;

    if (senderFilter !== 'all') {
      filtered = filtered.filter(message => message.sender === senderFilter);
    }

    if (readFilter !== 'all') {
      const isRead = readFilter === 'read';
      filtered = filtered.filter(message => message.is_read === isRead);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(message =>
        message.message.toLowerCase().includes(searchLower) ||
        message.customer_name?.toLowerCase().includes(searchLower) ||
        message.customer_email?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredMessages(filtered);
  }, [messages, searchTerm, senderFilter, readFilter]);

  const sendAdminMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await MessageService.sendAdminMessage(newMessage.trim(), replyTo || undefined);

      if (error) {
        toast.error('Failed to send message');
        return;
      }

      setNewMessage('');
      setReplyTo(null);
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await MessageService.markMessageAsRead(messageId);
      if (error) {
        toast.error('Failed to mark message as read');
        return;
      }

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast.error('Failed to mark message as read');
    }
  };

  const viewMessageDetails = (message: Message) => {
    setSelectedMessage(message);
    setShowMessageModal(true);
    if (!message.is_read && message.sender === 'customer') {
      markAsRead(message.id);
    }
  };

  const replyToMessage = (message: Message) => {
    setReplyTo(message.id);
    setNewMessage(`@${message.customer_name || 'Customer'}: `);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAdminMessage();
    }
  };

  const senderFilterOptions = [
    { value: 'all', label: 'All Messages' },
    { value: 'customer', label: 'Customer Messages' },
    { value: 'admin', label: 'Admin Messages' }
  ];

  const readFilterOptions = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Message Management</h2>
            <p className="text-gray-600">Manage customer support messages and conversations</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={senderFilter}
                onChange={(e) => setSenderFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white text-sm"
              >
                {senderFilterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white text-sm"
              >
                {readFilterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Customer Messages</p>
              <p className="text-2xl font-bold text-gray-900">
                {messages.filter(msg => msg.sender === 'customer').length}
              </p>
            </div>
            <User className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Unread Messages</p>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Response Rate</p>
              <p className="text-2xl font-bold text-gray-900">94%</p>
            </div>
            <Bot className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Quick Reply */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {replyTo ? 'Reply to Message' : 'Send Admin Message'}
        </h3>
        {replyTo && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Replying to message #{replyTo.slice(0, 8)}
            </p>
            <button
              onClick={() => {
                setReplyTo(null);
                setNewMessage('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
            >
              Cancel reply
            </button>
          </div>
        )}
        <div className="flex space-x-4">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message to customers..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent resize-none"
            rows={3}
          />
          <button
            onClick={sendAdminMessage}
            disabled={sending || !newMessage.trim()}
            className="bg-brand-orange text-white px-6 py-3 rounded-lg hover:bg-brand-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Sending...' : 'Send'}</span>
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Message History</h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No messages found</h3>
              <p className="text-gray-600">No messages match your current filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !message.is_read && message.sender === 'customer' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => viewMessageDetails(message)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-full ${
                        message.sender === 'admin' ? 'bg-orange-100' : 'bg-blue-100'
                      }`}>
                        {message.sender === 'admin' ? (
                          <Bot className="w-4 h-4 text-brand-orange" />
                        ) : (
                          <User className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {message.sender === 'admin' ? 'Admin' : (message.customer_name || 'Customer')}
                          </span>
                          {!message.is_read && message.sender === 'customer' && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        
                        {message.customer_email && (
                          <p className="text-xs text-gray-500 mb-1">{message.customer_email}</p>
                        )}
                        
                        <p className="text-sm text-gray-700 line-clamp-2">{message.message}</p>
                        
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDate(message.created_at)}
                          </span>
                          
                          {message.sender === 'customer' && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  replyToMessage(message);
                                }}
                                className="text-xs text-brand-orange hover:text-brand-red"
                              >
                                Reply
                              </button>
                              
                              {!message.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(message.id);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Mark as read
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Details Modal */}
      {showMessageModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Message Details</h3>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Sender Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {selectedMessage.sender === 'admin' ? 'Admin Message' : 'Customer Information'}
                  </h4>
                  
                  {selectedMessage.sender === 'customer' ? (
                    <div className="space-y-2">
                      {selectedMessage.customer_name && (
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{selectedMessage.customer_name}</span>
                        </div>
                      )}
                      {selectedMessage.customer_email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{selectedMessage.customer_email}</span>
                        </div>
                      )}
                      {selectedMessage.customer_phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{selectedMessage.customer_phone}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-brand-orange" />
                      <span className="text-sm">System Administrator</span>
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Message</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                {/* Message Meta */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Details</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Sent: {formatDate(selectedMessage.created_at)}</p>
                    <p>Status: {selectedMessage.is_read ? 'Read' : 'Unread'}</p>
                    {selectedMessage.reply_to && (
                      <p>Reply to: #{selectedMessage.reply_to.slice(0, 8)}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {selectedMessage.sender === 'customer' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        replyToMessage(selectedMessage);
                        setShowMessageModal(false);
                      }}
                      className="flex-1 bg-brand-orange text-white py-2 px-4 rounded-lg hover:bg-brand-red transition-colors"
                    >
                      Reply
                    </button>
                    
                    {selectedMessage.customer_phone && (
                      <a
                        href={`tel:${selectedMessage.customer_phone}`}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-center"
                      >
                        Call
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageManagement;