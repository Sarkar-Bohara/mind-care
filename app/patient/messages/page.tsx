"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft, Send, Search, MessageSquare, Clock, User } from "lucide-react"

interface Message {
  id: number
  senderId: number
  senderName: string
  senderType: 'patient' | 'psychiatrist'
  content: string
  timestamp: string
  read: boolean
}

interface Conversation {
  id: string | number
  psychiatristId: number
  psychiatristName: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: Message[]
}

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const psychiatristId = searchParams.get('psychiatristId')
  const psychiatristName = searchParams.get('psychiatristName')
  const [user, setUser] = useState(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [showProviders, setShowProviders] = useState(false)
  const [providers, setProviders] = useState<any[]>([])

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    
    fetchConversations()
  }, [])
  
  useEffect(() => {
    // Handle URL params for new conversation
    if (psychiatristId && psychiatristName && conversations.length > 0) {
      const existingConversation = conversations.find(
        conv => conv.psychiatristId === parseInt(psychiatristId)
      )
      
      if (existingConversation) {
        handleSelectConversation(existingConversation)
      } else {
        // Create new conversation
        const newConversation: Conversation = {
          id: `${user?.user_id}-${psychiatristId}`,
          psychiatristId: parseInt(psychiatristId),
          psychiatristName: decodeURIComponent(psychiatristName),
          lastMessage: "Start a new conversation",
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          messages: []
        }
        setSelectedConversation(newConversation)
      }
    }
  }, [psychiatristId, psychiatristName, conversations, user])

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      
      const response = await fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      } else {
        console.error('Failed to fetch conversations')
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/providers')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers?.filter((p: any) => p.role === 'psychiatrist') || [])
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error)
    }
  }

  const startNewConversation = async (psychiatristId: number, psychiatristName: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Create a new conversation by sending a message
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: psychiatristId,
          content: `Hello Dr. ${psychiatristName}, I would like to start a conversation with you.`
        })
      })

      if (response.ok) {
        const data = await response.json()
        setShowProviders(false)
        
        // Refresh conversations and then select the new one
        await fetchConversations()
        
        // Create and select the new conversation
        const newConversation: Conversation = {
          id: data.conversationId || `${user?.user_id}-${psychiatristId}`,
          psychiatristId: psychiatristId,
          psychiatristName: psychiatristName,
          lastMessage: `Hello Dr. ${psychiatristName}, I would like to start a conversation with you.`,
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          messages: [data.message] || []
        }
        
        setSelectedConversation(newConversation)
        
        // Add to conversations list if not already there
        setConversations(prevConversations => {
          const exists = prevConversations.some(conv => conv.psychiatristId === psychiatristId)
          if (!exists) {
            return [newConversation, ...prevConversations]
          }
          return prevConversations.map(conv => 
            conv.psychiatristId === psychiatristId ? newConversation : conv
          )
        })
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
    }
  }

  const fetchMessages = async (conversationId: string | number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      
      const response = await fetch(`/api/messages?conversationId=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (selectedConversation) {
          setSelectedConversation({
            ...selectedConversation,
            messages: data.messages || []
          })
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
           receiverId: selectedConversation.psychiatristId,
           content: newMessage.trim(),
           conversationId: selectedConversation.id
         })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Add the new message to the conversation
        const updatedMessages = [...(selectedConversation.messages || []), data.message]
        setSelectedConversation({
          ...selectedConversation,
          messages: updatedMessages,
          lastMessage: newMessage.trim(),
          lastMessageTime: new Date().toISOString()
        })
        
        // Update conversations list
        setConversations(prevConversations => {
          const updatedConversations = prevConversations.map(conv => 
            conv.id === selectedConversation.id 
              ? { ...conv, lastMessage: newMessage.trim(), lastMessageTime: new Date().toISOString() }
              : conv
          )
          
          // If this is a new conversation, add it to the list
          const conversationExists = prevConversations.some(conv => conv.id === selectedConversation.id)
          if (!conversationExists) {
            return [{
              ...selectedConversation,
              lastMessage: newMessage.trim(),
              lastMessageTime: new Date().toISOString()
            }, ...updatedConversations]
          }
          
          return updatedConversations
        })
        
        setNewMessage("")
        toast({
          title: "Message sent",
          description: "Your message has been sent successfully."
        })
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    
    // Fetch messages for this conversation
    await fetchMessages(conversation.id)
    
    // Mark messages as read
    try {
      const token = localStorage.getItem('token')
      if (token) {
        await fetch(`/api/messages?conversationId=${conversation.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString()
    }
  }

  const filteredConversations = conversations.filter(conversation =>
    conversation.psychiatristName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600">Communicate with your psychiatrists</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setShowProviders(true)
              fetchProviders()
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start New Conversation
          </Button>
        </div>

        {/* Provider Selection Modal */}
        {showProviders && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Select a Psychiatrist</CardTitle>
                <CardDescription>Choose a psychiatrist to start a conversation with</CardDescription>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                {providers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No psychiatrists available</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {providers.map((provider) => (
                      <div
                        key={provider.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => startNewConversation(provider.id, provider.name)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={provider.avatar || "/placeholder-user.jpg"} />
                            <AvatarFallback>
                              {provider.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">Dr. {provider.name}</p>
                            <p className="text-sm text-gray-500">{provider.specialization || 'Psychiatrist'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowProviders(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Messages Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Conversations
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Start a conversation with your psychiatrist</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 border-b transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => handleSelectConversation(conversation)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="/placeholder-user.jpg" />
                          <AvatarFallback>
                            {conversation.psychiatristName?.split(' ').map(n => n[0]).join('') || 'DR'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              Dr. {conversation.psychiatristName || 'Unknown'}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="default" className="ml-2">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                          <p className="text-xs text-gray-400">{formatTime(conversation.lastMessageTime)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>
                        {selectedConversation.psychiatristName?.split(' ').map(n => n[0]).join('') || 'DR'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">Dr. {selectedConversation.psychiatristName || 'Unknown'}</CardTitle>
                      <CardDescription>Psychiatrist</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                    selectedConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === 'patient' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderType === 'patient'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.senderType === 'patient' ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation by sending a message</p>
                    </div>
                  )}
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 min-h-[40px] max-h-[120px]"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p>Choose a conversation from the list to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function PatientMessagesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessagesContent />
    </Suspense>
  )
}