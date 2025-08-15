"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Clock, Users, Video, FileText, Plus, Edit, Mail, Send } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function SessionsPage() {
  const [user, setUser] = useState(null)
  const [sessions, setSessions] = useState([
    {
      id: 1,
      client: "Maria Santos",
      type: "Individual Counseling",
      date: "2024-01-16",
      time: "2:00 PM",
      duration: "50 min",
      status: "scheduled",
      notes: "",
      topic: "Anxiety Management",
    },
    {
      id: 2,
      client: "David Chen",
      type: "Couples Therapy",
      date: "2024-01-16",
      time: "4:00 PM",
      duration: "60 min",
      status: "completed",
      notes: "Good progress on communication skills. Homework assigned for next week.",
      topic: "Communication Issues",
    },
    {
      id: 3,
      client: "Support Group",
      type: "Group Therapy",
      date: "2024-01-17",
      time: "10:00 AM",
      duration: "90 min",
      status: "scheduled",
      notes: "",
      topic: "Depression Recovery",
    },
  ])

  const [selectedSession, setSelectedSession] = useState(null)
  const [sessionNotes, setSessionNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [emailLoading, setEmailLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Load sessions from API or fallback to localStorage/mock data
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/counselor/sessions", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      } else {
        // Fallback to localStorage or mock data
        const savedSessions = localStorage.getItem("counselor_sessions")
        if (savedSessions) {
          setSessions(JSON.parse(savedSessions))
        }
      }
    } catch (error) {
      console.error("Error fetching sessions:", error)
      // Fallback to localStorage or mock data
      const savedSessions = localStorage.getItem("counselor_sessions")
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedSession) return
    
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/counselor/sessions", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          notes: sessionNotes
        })
      })
      
      if (response.ok) {
        const updatedSessions = sessions.map((session) =>
          session.id === selectedSession.id
            ? { ...session, notes: sessionNotes }
            : session
        )
        setSessions(updatedSessions)
        setSelectedSession({ ...selectedSession, notes: sessionNotes })
        toast({
          title: "Success",
          description: "Session notes saved successfully"
        })
      } else {
        // Fallback to localStorage
        const updatedSessions = sessions.map((session) =>
          session.id === selectedSession.id
            ? { ...session, notes: sessionNotes }
            : session
        )
        setSessions(updatedSessions)
        localStorage.setItem("counselor_sessions", JSON.stringify(updatedSessions))
        setSelectedSession({ ...selectedSession, notes: sessionNotes })
        toast({
          title: "Notes saved locally",
          description: "Session notes saved to local storage"
        })
      }
    } catch (error) {
      console.error("Error saving notes:", error)
      // Fallback to localStorage
      const updatedSessions = sessions.map((session) =>
        session.id === selectedSession.id
          ? { ...session, notes: sessionNotes }
          : session
      )
      setSessions(updatedSessions)
      localStorage.setItem("counselor_sessions", JSON.stringify(updatedSessions))
      setSelectedSession({ ...selectedSession, notes: sessionNotes })
      toast({
        title: "Notes saved locally",
        description: "Session notes saved to local storage"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (sessionId: number, newStatus: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/counselor/sessions", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId,
          status: newStatus
        })
      })
      
      if (response.ok) {
        const updatedSessions = sessions.map((session) =>
          session.id === sessionId ? { ...session, status: newStatus } : session
        )
        setSessions(updatedSessions)
        
        if (selectedSession?.id === sessionId) {
          setSelectedSession({ ...selectedSession, status: newStatus })
        }
        
        toast({
          title: "Success",
          description: `Session status updated to ${newStatus}`
        })
      } else {
        // Fallback to localStorage
        const updatedSessions = sessions.map((session) =>
          session.id === sessionId ? { ...session, status: newStatus } : session
        )
        setSessions(updatedSessions)
        localStorage.setItem("counselor_sessions", JSON.stringify(updatedSessions))
        
        if (selectedSession?.id === sessionId) {
          setSelectedSession({ ...selectedSession, status: newStatus })
        }
        
        toast({
          title: "Status updated locally",
          description: `Session status updated to ${newStatus}`
        })
      }
    } catch (error) {
      console.error("Error updating status:", error)
      // Fallback to localStorage
      const updatedSessions = sessions.map((session) =>
        session.id === sessionId ? { ...session, status: newStatus } : session
      )
      setSessions(updatedSessions)
      localStorage.setItem("counselor_sessions", JSON.stringify(updatedSessions))
      
      if (selectedSession?.id === sessionId) {
        setSelectedSession({ ...selectedSession, status: newStatus })
      }
      
      toast({
        title: "Status updated locally",
        description: `Session status updated to ${newStatus}`
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!selectedSession || !emailSubject.trim() || !emailMessage.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all email fields",
        variant: "destructive"
      })
      return
    }

    try {
      setEmailLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/counselor/email", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          patientId: selectedSession.patientId || selectedSession.id, // Fallback for demo data
          subject: emailSubject,
          message: emailMessage,
          appointmentId: selectedSession.id
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Email sent successfully"
        })
        setEmailModalOpen(false)
        setEmailSubject("")
        setEmailMessage("")
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to send email",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error sending email:", error)
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive"
      })
    } finally {
      setEmailLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "no-show":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const todaySessions = sessions.filter((session) => {
    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    // Include today's sessions, yesterday's sessions (in case of timezone issues), and demo data
    return session.date === today || session.date === yesterday || session.date === "2024-01-16"
  })

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Counseling Sessions</h1>
            <p className="text-gray-600 mt-2">Manage your client sessions and documentation.</p>
          </div>
          <Button onClick={() => router.push('/counselor/schedule')}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Session
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaySessions.length}</div>
              <p className="text-xs text-muted-foreground">
                {todaySessions.filter((s) => s.status === "completed").length} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">Regular clients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">Sessions scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Session Hours</CardTitle>
              <FileText className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>
                  {todaySessions.filter(s => s.status === 'pending').length > 0 
                    ? `${todaySessions.filter(s => s.status === 'pending').length} pending confirmation • Your recent sessions`
                    : 'Your recent sessions'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todaySessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        setSelectedSession(session)
                        setSessionNotes(session.notes)
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedSession?.id === session.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              {session.client
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-gray-900">{session.client}</h4>
                            <p className="text-sm text-gray-600">{session.type}</p>
                            <p className="text-xs text-gray-500">{session.topic}</p>
                            <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>
                                {session.time} • {session.duration}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge className={getStatusColor(session.status)}>{session.status}</Badge>
                          {session.status === "pending" && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(session.id, "scheduled")
                                }}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(session.id, "cancelled")
                                }}
                              >
                                Decline
                              </Button>
                            </div>
                          )}
                          {session.status === "scheduled" && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusChange(session.id, "confirmed")
                              }}
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Start
                            </Button>
                          )}
                          {session.status === "confirmed" && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusChange(session.id, "completed")
                              }}
                            >
                              End Session
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Sessions scheduled for the rest of the week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions
                    .filter((s) => s.date !== "2024-01-16")
                    .map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {session.client
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-sm">{session.client}</h4>
                            <p className="text-xs text-gray-600">{session.type}</p>
                            <p className="text-xs text-gray-500">
                              {session.date} at {session.time}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(session.status)}>{session.status}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Notes */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Notes</CardTitle>
                <CardDescription>
                  {selectedSession ? `Notes for ${selectedSession.client}` : "Select a session to view notes"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSession ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Client:</span>
                        <span className="font-medium">{selectedSession.client}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Session Type:</span>
                        <span>{selectedSession.type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Topic:</span>
                        <span>{selectedSession.topic}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Duration:</span>
                        <span>{selectedSession.duration}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="session-notes">Session Notes</Label>
                      <Textarea
                        id="session-notes"
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        placeholder="Document session observations, progress, and next steps..."
                        rows={8}
                      />
                    </div>

                    <div className="space-y-2">
                      <Button onClick={handleSaveNotes} className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        Save Notes
                      </Button>
                      
                      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email to Client
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[525px]">
                          <DialogHeader>
                            <DialogTitle>Send Email to {selectedSession.client}</DialogTitle>
                            <DialogDescription>
                              Send a custom message to your client regarding their session or treatment.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="email-subject">Subject</Label>
                              <Input
                                id="email-subject"
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                placeholder="Enter email subject..."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email-message">Message</Label>
                              <Textarea
                                id="email-message"
                                value={emailMessage}
                                onChange={(e) => setEmailMessage(e.target.value)}
                                placeholder="Type your message here..."
                                rows={6}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEmailModalOpen(false)
                                setEmailSubject("")
                                setEmailMessage("")
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={handleSendEmail}
                              disabled={emailLoading || !emailSubject.trim() || !emailMessage.trim()}
                            >
                              {emailLoading ? (
                                "Sending..."
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Email
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Select a session to view or edit notes</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push('/counselor/schedule')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule New Session
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push('/counselor/clients')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Client Records
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push('/counselor/reports')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push('/counselor/treatment-plans')}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Treatment Plans
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-transparent"
                  onClick={() => {
                    if (selectedSession) {
                      setEmailModalOpen(true)
                    } else {
                      toast({
                        title: "No Session Selected",
                        description: "Please select a session first to send an email",
                        variant: "destructive"
                      })
                    }
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email to Client
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
