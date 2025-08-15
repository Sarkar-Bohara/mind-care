"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Video, VideoOff, Phone, PhoneOff, MessageSquare, Settings, Users, Clock, Monitor, Wifi, AlertCircle, RefreshCw, Play, Square, FileText, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TelepsychiatryPage() {
  const [user, setUser] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [systemStatus, setSystemStatus] = useState({
    totalToday: 0,
    waiting: 0,
    active: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [videoSettings, setVideoSettings] = useState({
    camera: 'default',
    microphone: 'default',
    quality: 'high'
  })
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientRecords, setPatientRecords] = useState([])
  const [sessionNote, setSessionNote] = useState('')
  const [patientNotes, setPatientNotes] = useState([])
  const [showVideoSettings, setShowVideoSettings] = useState(false)
  const [showPatientRecords, setShowPatientRecords] = useState(false)
  const [showSessionNotes, setShowSessionNotes] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/telepsychiatry/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const data = await response.json()
      setUpcomingSessions(data.sessions)
      setSystemStatus(data.systemStatus)
      
      // Set active session if any
      const activeSessionData = data.sessions.find(s => s.status === 'active')
      if (activeSessionData) {
        setActiveSession(activeSessionData)
      }
      
    } catch (error) {
      console.error('Error fetching sessions:', error)
      setError(error.message)
      toast({
        title: "Error",
        description: "Failed to load telepsychiatry sessions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const startSession = async (sessionId: number) => {
    try {
      setActionLoading(sessionId.toString())
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/telepsychiatry/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          action: 'start'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start session')
      }

      const result = await response.json()
      
      // Update local state
      const session = upcomingSessions.find((s) => s.id === sessionId)
      if (session) {
        const updatedSession = { ...session, status: "active" }
        setActiveSession(updatedSession)
        const updatedSessions = upcomingSessions.map((s) => 
          s.id === sessionId ? updatedSession : s
        )
        setUpcomingSessions(updatedSessions)
        setSystemStatus(prev => ({
          ...prev,
          active: prev.active + 1,
          waiting: prev.waiting - 1
        }))
      }

      toast({
        title: "Success",
        description: "Session started successfully",
        variant: "default"
      })
      
    } catch (error) {
      console.error('Error starting session:', error)
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const fetchPatientRecords = async (searchTerm: string = '') => {
    try {
      const token = localStorage.getItem('token')
      const url = searchTerm ? `/api/patients?search=${encodeURIComponent(searchTerm)}&active=true` : '/api/patients?active=true'
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch patient records')
      }

      const data = await response.json()
      setPatientRecords(data.patients || [])
      
    } catch (error) {
      console.error('Error fetching patient records:', error)
      toast({
        title: "Error",
        description: "Failed to load patient records",
        variant: "destructive"
      })
    }
  }

  const fetchPatientNotes = async (patientId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/patients/notes?patientId=${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch patient notes')
      }

      const data = await response.json()
      setPatientNotes(data.notes || [])
      
    } catch (error) {
      console.error('Error fetching patient notes:', error)
      toast({
        title: "Error",
        description: "Failed to load patient notes",
        variant: "destructive"
      })
    }
  }

  const saveSessionNote = async () => {
    if (!selectedPatient || !sessionNote.trim()) {
      toast({
        title: "Error",
        description: "Please select a patient and enter a note",
        variant: "destructive"
      })
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/patients/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: selectedPatient.user_id,
          note: sessionNote
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save session note')
      }

      setSessionNote('')
      toast({
        title: "Success",
        description: "Session note saved successfully",
        variant: "default"
      })
      
      // Refresh notes if viewing the same patient
      if (selectedPatient) {
        fetchPatientNotes(selectedPatient.user_id)
      }
      
    } catch (error) {
      console.error('Error saving session note:', error)
      toast({
        title: "Error",
        description: "Failed to save session note",
        variant: "destructive"
      })
    }
  }

  const handleVideoSettings = () => {
    setShowVideoSettings(true)
  }

  const handlePatientRecords = () => {
    setShowPatientRecords(true)
    // Fetch all active patients for selection
    fetchPatientRecords()
  }

  const handleSessionNotes = () => {
    setShowSessionNotes(true)
    // Load patient records for selection
    fetchPatientRecords()
    // If there's an active session, set the patient
    if (activeSession) {
      const patient = { user_id: activeSession.patient_id, full_name: activeSession.patient_name }
      setSelectedPatient(patient)
      fetchPatientNotes(activeSession.patient_id)
    }
  }

  const saveVideoSettings = () => {
    // Save video settings to localStorage or API
    localStorage.setItem('videoSettings', JSON.stringify(videoSettings))
    setShowVideoSettings(false)
    toast({
      title: "Success",
      description: "Video settings saved successfully",
      variant: "default"
    })
  }

  const endSession = async (sessionId?: number) => {
    const idToEnd = sessionId || activeSession?.id
    if (!idToEnd) return
    
    try {
      setActionLoading(idToEnd.toString())
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/telepsychiatry/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: idToEnd,
          action: 'end'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to end session')
      }

      // Update local state
      const updatedSessions = upcomingSessions.map((s) =>
        s.id === idToEnd ? { ...s, status: "completed" } : s,
      )
      setUpcomingSessions(updatedSessions)
      setActiveSession(null)
      setSystemStatus(prev => ({
        ...prev,
        active: prev.active - 1
      }))

      toast({
        title: "Success",
        description: "Session ended successfully",
        variant: "default"
      })
      
    } catch (error) {
      console.error('Error ending session:', error)
      toast({
        title: "Error",
        description: "Failed to end session",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Telepsychiatry</h1>
            <p className="text-gray-600 mt-2">Conduct secure video consultations with your patients.</p>
          </div>
          <Button 
            onClick={fetchSessions} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Error loading sessions: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
              <Wifi className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">Excellent connection</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Video className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus.active}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Waiting Patients</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus.waiting}</div>
              <p className="text-xs text-muted-foreground">Ready to join</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus.totalToday}</div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Session */}
        {activeSession && (
          <Card className="border-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <CardTitle>Active Session</CardTitle>
                </div>
                <Badge className="bg-red-100 text-red-800">LIVE</Badge>
              </div>
              <CardDescription>Currently in session with {activeSession.patient_name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Video Area */}
                <div className="lg:col-span-2">
                  <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative">
                    <div className="text-white text-center">
                      <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Video Session Active</p>
                      <p className="text-sm opacity-75">Connected with {activeSession.patient_name}</p>
                    </div>

                    {/* Video Controls */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Session Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {activeSession.patient_name
                          ? (() => {
                              const nameParts = activeSession.patient_name.split(" ");
                              return nameParts.length > 1 
                                ? nameParts[0][0] + nameParts[1][0]
                                : nameParts[0][0];
                            })()
                          : 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{activeSession.patient_name}</h4>
                      <p className="text-sm text-gray-600">{activeSession.appointment_type}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Started:</span>
                      <span>{new Date(activeSession.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span>{activeSession.appointment_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      variant="destructive" 
                      onClick={() => endSession(activeSession.id)}
                      disabled={actionLoading === activeSession.id}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      {actionLoading === activeSession.id ? 'Ending...' : 'End Session'}
                    </Button>
                    <Button className="w-full bg-transparent" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Patients scheduled for today</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No upcoming sessions scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {session.patient_name
                            ? (() => {
                                const nameParts = session.patient_name.split(" ");
                                return nameParts.length > 1 
                                  ? nameParts[0][0] + nameParts[1][0]
                                  : nameParts[0][0];
                              })()
                            : 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-gray-900">{session.patient_name}</h4>
                        <p className="text-sm text-gray-600">{session.appointment_type}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(session.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.duration || '30 min'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        className={
                          session.status === "waiting"
                            ? "bg-orange-100 text-orange-800"
                            : session.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                        }
                      >
                        {session.status}
                      </Badge>
                      {session.status === "waiting" && (
                        <Button 
                          size="sm" 
                          onClick={() => startSession(session.id)}
                          disabled={actionLoading === session.id.toString()}
                        >
                          <Video className="h-4 w-4 mr-2" />
                          {actionLoading === session.id.toString() ? 'Starting...' : 'Start Session'}
                        </Button>
                      )}
                      {session.status === "scheduled" && (
                        <Button size="sm" variant="outline" disabled>
                          <Clock className="h-4 w-4 mr-2" />
                          Scheduled
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Dialog open={showVideoSettings} onOpenChange={setShowVideoSettings}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleVideoSettings}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Video Settings</h3>
                      <p className="text-sm text-gray-600">Configure camera and audio</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Video Settings</DialogTitle>
                <DialogDescription>
                  Configure your camera and audio settings for telepsychiatry sessions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="camera" className="text-right">
                    Camera
                  </Label>
                  <Select value={videoSettings.camera} onValueChange={(value) => setVideoSettings({...videoSettings, camera: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select camera" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Camera</SelectItem>
                      <SelectItem value="external">External Camera</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="microphone" className="text-right">
                    Microphone
                  </Label>
                  <Select value={videoSettings.microphone} onValueChange={(value) => setVideoSettings({...videoSettings, microphone: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select microphone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Microphone</SelectItem>
                      <SelectItem value="external">External Microphone</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quality" className="text-right">
                    Quality
                  </Label>
                  <Select value={videoSettings.quality} onValueChange={(value) => setVideoSettings({...videoSettings, quality: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High (1080p)</SelectItem>
                      <SelectItem value="medium">Medium (720p)</SelectItem>
                      <SelectItem value="low">Low (480p)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowVideoSettings(false)}>
                  Cancel
                </Button>
                <Button onClick={saveVideoSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showPatientRecords} onOpenChange={setShowPatientRecords}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handlePatientRecords}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Patient Records</h3>
                      <p className="text-sm text-gray-600">Access patient information</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Patient Records</DialogTitle>
                <DialogDescription>
                  View and manage patient information and medical records.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[400px] overflow-y-auto">
                {patientRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No patient records found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientRecords.map((patient) => (
                      <Card key={patient.user_id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>
                                {patient.full_name
                                  ? (() => {
                                      const nameParts = patient.full_name.split(" ");
                                      return nameParts.length > 1 
                                        ? nameParts[0][0] + nameParts[1][0]
                                        : nameParts[0][0];
                                    })()
                                  : 'P'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{patient.full_name}</h4>
                              <p className="text-sm text-gray-600">{patient.email}</p>
                              <p className="text-xs text-gray-500">DOB: {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedPatient(patient)
                              fetchPatientNotes(patient.user_id)
                              setShowPatientRecords(false)
                              setShowSessionNotes(true)
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Notes
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showSessionNotes} onOpenChange={setShowSessionNotes}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleSessionNotes}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Session Notes</h3>
                      <p className="text-sm text-gray-600">Document session details</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Session Notes</DialogTitle>
                <DialogDescription>
                  Document session details and patient progress notes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedPatient ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {selectedPatient.full_name
                            ? (() => {
                                const nameParts = selectedPatient.full_name.split(" ");
                                return nameParts.length > 1 
                                  ? nameParts[0][0] + nameParts[1][0]
                                  : nameParts[0][0];
                              })()
                            : 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">{selectedPatient.full_name}</h4>
                        <p className="text-sm text-gray-600">Patient ID: {selectedPatient.user_id}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedPatient(null)
                        setPatientNotes([])
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Change Patient
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Select Patient</Label>
                    <Select onValueChange={(value) => {
                      const patient = patientRecords.find(p => p.user_id.toString() === value)
                      if (patient) {
                        setSelectedPatient(patient)
                        fetchPatientNotes(patient.user_id)
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a patient to add notes" />
                      </SelectTrigger>
                      <SelectContent>
                        {patientRecords.map((patient) => (
                          <SelectItem key={patient.user_id} value={patient.user_id.toString()}>
                            {patient.full_name} - {patient.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {patientRecords.length === 0 && (
                      <p className="text-sm text-gray-500">Loading patients...</p>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="session-note">New Session Note</Label>
                  <Textarea
                    id="session-note"
                    placeholder="Enter session notes, observations, treatment progress, etc..."
                    value={sessionNote}
                    onChange={(e) => setSessionNote(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={saveSessionNote} disabled={!selectedPatient || !sessionNote.trim()}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Note
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Previous Notes</Label>
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {patientNotes.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No previous notes found</p>
                    ) : (
                      patientNotes.map((note) => (
                        <Card key={note.note_id} className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium">{note.provider_name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(note.created_at).toLocaleDateString()} {new Date(note.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{note.note_content}</p>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  )
}
