"use client"

import { useState, useEffect } from "react"
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
  patientId: number
  patientName: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: Message[]
}

export default function MessagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patientId')
  const patientName = searchParams.get('patientName')
  const [user, setUser] = useState(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    
    fetchConversations()
  }, [])
  
  useEffect(() => {
    // Handle URL params for new conversation
    if (patientId && patientName && conversations.length > 0) {
      const existingConversation = conversations.find(
        (conv: Conversation) => conv.patientId === parseInt(patientId)
      )
      
      if (existingConversation) {
        setSelectedConversation(existingConversation)
        fetchMessages(existingConversation.id)
      } else {
        // Create new conversation placeholder
        const newConversation: Conversation = {
          id: `new-${patientId}`,
          patientId: parseInt(patientId),
          patientName: decodeURIComponent(patientName),
          lastMessage: "No messages yet",
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          messages: []
        }
        setSelectedConversation(newConversation)
      }
    }
  }, [patientId, patientName, conversations])
  
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
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }
  
  const fetchMessages = async (conversationId: string | number, conversation?: Conversation) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      
      console.log('Fetching messages for conversation:', conversationId)
      
      const response = await fetch(`/api/messages?conversationId=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Messages API response:', data)
        
        // Use the passed conversation or the current selectedConversation
        const targetConversation = conversation || selectedConversation
        if (targetConversation) {
          const updatedConversation = {
            ...targetConversation,
            messages: data.messages || []
          }
          console.log('Updated conversation with messages:', updatedConversation)
          setSelectedConversation(updatedConversation)
        }
      } else {
        console.error('Failed to fetch messages:', response.status, response.statusText)
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
           receiverId: selectedConversation.patientId,
           content: newMessage.trim(),
           conversationId: selectedConversation.id
         })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update the conversation with the new message
        const updatedConversation = {
          ...selectedConversation,
          messages: [...(selectedConversation.messages || []), data.message],
          lastMessage: newMessage.trim(),
          lastMessageTime: new Date().toISOString()
        }

        setSelectedConversation(updatedConversation)
        setNewMessage("")
        
        // Refresh conversations list
        fetchConversations()

        toast({
          title: "Message Sent",
          description: `Your message has been sent to ${selectedConversation.patientName}`,
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
    console.log('Selecting conversation:', conversation)
    setSelectedConversation(conversation)
    
    // Fetch messages for this conversation
    await fetchMessages(conversation.id, conversation)
    
    // Mark messages as read
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      await fetch('/api/messages/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: conversation.id
        })
      })
      
      // Refresh conversations to update unread counts
      fetchConversations()
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const filteredConversations = conversations.filter(conv => 
    conv.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patient Messages</h1>
              <p className="text-gray-600 mt-1">Communicate with your patients securely</p>
            </div>
          </div>
        </div>

        {/* Messages Interface */}
        <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Conversations</span>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 border-b transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback>
                          {conversation.patientName
                            ? (() => {
                                const nameParts = conversation.patientName.split(" ");
                                return nameParts.length > 1 
                                  ? nameParts[0][0] + nameParts[1][0]
                                  : nameParts[0][0];
                              })()
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm truncate">{conversation.patientName}</h4>
                          <div className="flex items-center space-x-2">
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.lastMessageTime)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">{conversation.lastMessage}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>
                        {selectedConversation.patientName
                          ? (() => {
                              const nameParts = selectedConversation.patientName.split(" ");
                              return nameParts.length > 1 
                                ? nameParts[0][0] + nameParts[1][0]
                                : nameParts[0][0];
                            })()
                          : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedConversation.patientName}</CardTitle>
                      <CardDescription>Patient ID: {selectedConversation.patientId}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[450px]">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {!selectedConversation.messages || selectedConversation.messages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      selectedConversation.messages?.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderType === 'psychiatrist' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              message.senderType === 'psychiatrist'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs opacity-70">{message.senderName}</span>
                              <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 min-h-[60px] resize-none"
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
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-[500px]">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">Select a Conversation</h3>
                  <p>Choose a patient from the list to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}