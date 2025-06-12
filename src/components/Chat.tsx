import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Send, X, User, Bot, Phone, Mail } from 'lucide-react';
import { MessageService, Message } from '../lib/supabase';
import { formatDate } from '../lib/utils';
import { useAuthStore } from '../lib/store';
import toast from 'react-hot-toast';

const Chat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Pre-fill customer info if user is authenticated
    if (isAuthenticated && user) {
      setCustomerInfo({
        name: user.full_name || '',
        email: user.email || '',
        phone: user.phone_number || ''
      });
    }
  }, [isAuthenticated, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await MessageService.getMessages();
      if (error) {
        console.error('Error fetching messages:', error);
        // Set demo messages for fallback
        setMessages([
          {
            id: '1',
            sender: 'admin',
            message: 'Hello! Welcome to Manziz. How can I help you today?',
            is_read: true,
            created_at: new Date(Date.now() - 60000).toISOString()
          }
        ]);
      } else {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  const setupRealtimeSubscription = useCallback(() => {
    const subscription = MessageService.subscribeToMessages((newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      
      // Show typing indicator for admin responses
      if (newMessage.sender === 'admin') {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 1000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // Check if customer info is needed for first message
    if (messages.filter(m => m.sender === 'customer').length === 0 && !isAuthenticated) {
      if (!customerInfo.name || !customerInfo.email) {
        setShowCustomerForm(true);
        return;
      }
    }

    const messageText = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    try {
      const { data, error } = await MessageService.sendCustomerMessage(
        messageText,
        customerInfo.name || user?.full_name,
        customerInfo.email || user?.email,
        customerInfo.phone || user?.phone_number
      );

      if (error) {
        toast.error('Failed to send message. Please try again.');
        setNewMessage(messageText); // Restore message on error
        return;
      }

      // Simulate admin auto-response after a delay
      setTimeout(async () => {
        const autoResponse = getAutoResponse(messageText);
        if (autoResponse) {
          await MessageService.sendAdminMessage(autoResponse);
        }
      }, 2000 + Math.random() * 3000); // Random delay between 2-5 seconds

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      setNewMessage(messageText);
    } finally {
      setLoading(false);
    }
  };

  const getAutoResponse = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('menu') || lowerMessage.includes('food')) {
      return 'You can check our full menu by clicking on the "Menu" tab. We have delicious burgers, chicken, sides, and drinks! Is there anything specific you\'d like to know about?';
    }
    
    if (lowerMessage.includes('order') || lowerMessage.includes('delivery')) {
      return 'You can place an order through our website. We offer both delivery and pickup options. Delivery is free for orders above UGX 50,000! Would you like help with placing an order?';
    }
    
    if (lowerMessage.includes('hours') || lowerMessage.includes('open')) {
      return 'We\'re open Monday to Sunday from 8:00 AM to 10:00 PM. You can call us at +256 784 811 208 for any inquiries.';
    }
    
    if (lowerMessage.includes('location') || lowerMessage.includes('address')) {
      return 'We\'re located at Children\'s Medical Center Area, Kampala, Uganda. You can find us on the map in our Contact page.';
    }

    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return 'Our prices range from UGX 5,000 for drinks to UGX 25,000 for our signature burgers. Check our menu for detailed pricing!';
    }

    if (lowerMessage.includes('reservation') || lowerMessage.includes('book')) {
      return 'You can make a reservation through our Reservations page. We\'ll call you to confirm your booking!';
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hello! Thanks for reaching out to Manziz. How can I assist you today?';
    }

    // Return null for complex queries that need human response
    if (lowerMessage.length > 100 || lowerMessage.includes('complaint') || lowerMessage.includes('problem')) {
      return null;
    }
    
    return 'Thank you for your message! Our team will get back to you shortly. For immediate assistance, please call us at +256 784 811 208.';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCustomerInfoSubmit = () => {
    if (!customerInfo.name || !customerInfo.email) {
      toast.error('Please provide your name and email');
      return;
    }
    setShowCustomerForm(false);
    sendMessage();
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-brand-orange text-white p-4 rounded-full shadow-lg hover:bg-brand-red transition-all duration-200 hover:scale-110 z-50"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="bg-brand-orange text-white p-4 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Manziz Support</h3>
                <p className="text-xs text-orange-100">
                  {isTyping ? 'Typing...' : 'We\'re here to help!'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.sender === 'customer'
                      ? 'bg-brand-orange text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.sender === 'admin' && message.customer_name && (
                    <p className="text-xs text-gray-500 mb-1">
                      To: {message.customer_name}
                    </p>
                  )}
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'customer' ? 'text-orange-100' : 'text-gray-500'
                  }`}>
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Customer Info Form */}
          {showCustomerForm && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <h4 className="font-semibold text-sm mb-3">Please introduce yourself:</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Your name *"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                />
                <input
                  type="email"
                  placeholder="Your email *"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                />
                <input
                  type="tel"
                  placeholder="Your phone (optional)"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                />
                <button
                  onClick={handleCustomerInfoSubmit}
                  className="w-full bg-brand-orange text-white py-2 rounded-lg text-sm font-semibold hover:bg-brand-red transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          {!showCustomerForm && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent resize-none text-sm"
                  rows={2}
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="bg-brand-orange text-white p-2 rounded-lg hover:bg-brand-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-1 mt-2">
                {['Menu', 'Hours', 'Location', 'Order Help'].map((action) => (
                  <button
                    key={action}
                    onClick={() => setNewMessage(`Tell me about ${action.toLowerCase()}`)}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Chat;