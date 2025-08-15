"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/hooks/use-toast"
import { Calendar, Users, Clock, TrendingUp, Video, Phone, MessageSquare } from "lucide-react"
import { makeCall, makeVideoCall } from '@/utils/callService'

export default function PsychiatristDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [todayAppointments, setTodayAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState({
    totalAppointments: 0,
    confirmedAppointments: 0,
    pendingAppointments: 0,
    activePatients: 0,
    hoursThisWeek: 0,
    patientSatisfaction: 0
  })

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
      fetchDashboardData()
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      // Fetch today's appointments
      const appointmentsResponse = await fetch('/api/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        const today = new Date().toISOString().split('T')[0]
        
        // Filter today's appointments
        const todaysAppointments = appointmentsData.appointments?.filter((apt: any) => 
          apt.appointment_date === today
        ) || []

        // Format appointments for display
        const formattedAppointments = todaysAppointments.map((apt: any) => ({
          id: apt.appointment_id,
          patient: apt.patient_name,
          time: apt.appointment_time,
          type: apt.type,
          status: apt.status,
          duration: `${apt.duration_minutes || 30} min`,
          notes: apt.notes || 'Regular session'
        }))

        setTodayAppointments(formattedAppointments)

        // Calculate stats
        const confirmedCount = formattedAppointments.filter(apt => apt.status === 'confirmed').length
        const pendingCount = formattedAppointments.filter(apt => apt.status === 'pending').length
        
        setDashboardStats(prev => ({
          ...prev,
          totalAppointments: formattedAppointments.length,
          confirmedAppointments: confirmedCount,
          pendingAppointments: pendingCount
        }))
      }

      // Fetch active patients count
      const patientsResponse = await fetch('/api/patients?active=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json()
        setDashboardStats(prev => ({
          ...prev,
          activePatients: patientsData.patients?.length || 0
        }))
      }

      // Fetch recent patients with progress data
       const progressResponse = await fetch('/api/patients/progress', {
         headers: {
           'Authorization': `Bearer ${token}`
         }
       })

       if (progressResponse.ok) {
         const progressData = await progressResponse.json()
         const formattedPatients = progressData.patients?.slice(0, 4).map((patient: any) => ({
           id: patient.id,
           name: patient.name || 'Unknown Patient',
           lastVisit: patient.lastSession || 'No recent visits',
           condition: patient.condition || 'General consultation',
           progress: patient.trend === 'improving' ? 'Improving' : patient.trend === 'declining' ? 'Declining' : 'Stable',
           nextAppointment: patient.nextAppointment || 'Not scheduled'
         })) || []
         
         setRecentPatients(formattedPatients)
       }

       // Set some default values for other stats (these could be calculated from actual data)
       setDashboardStats(prev => ({
         ...prev,
         hoursThisWeek: 32, // This could be calculated from appointments
         patientSatisfaction: 4.9 // This could come from a ratings system
       }))

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const [recentPatients, setRecentPatients] = useState([])

  // Event handlers for various actions
  const handleJoinVideo = (appointmentId: number, patientName: string) => {
    makeVideoCall(patientName, appointmentId.toString())
  }

  const handleMakeCall = (appointmentId: number, patientName: string) => {
    makeCall(patientName, undefined, appointmentId.toString())
  }

  const handleManageAppointments = () => {
    router.push('/psychiatrist/appointments')
  }

  const handlePatientProgress = () => {
    router.push('/psychiatrist/progress')
  }

  const handlePatientMessages = () => {
    router.push('/psychiatrist/messages')
  }

  const handleViewPatient = (patientId: number, patientName: string) => {
    router.push(`/psychiatrist/patients?id=${patientId}&name=${encodeURIComponent(patientName)}`)
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, Dr. {user?.name || 'Doctor'}!</h1>
          <p className="text-gray-600 mt-2">Here's your telepsychiatry dashboard for today.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalAppointments}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.confirmedAppointments} confirmed,{" "}
                {dashboardStats.pendingAppointments} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.activePatients}</div>
              <p className="text-xs text-muted-foreground">All active patients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.hoursThisWeek}</div>
              <p className="text-xs text-muted-foreground">8 hours remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patient Satisfaction</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.patientSatisfaction}</div>
              <p className="text-xs text-muted-foreground">Average rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your appointments for {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading appointments...</p>
                </div>
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{appointment.patient}</h4>
                      <p className="text-sm text-gray-600">
                        {appointment.type} • {appointment.duration}
                      </p>
                      <p className="text-xs text-gray-500">{appointment.notes}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                      {appointment.status}
                    </Badge>
                    <span className="text-sm font-medium">{appointment.time}</span>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleJoinVideo(appointment.id, appointment.patient)}
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Join
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleMakeCall(appointment.id, appointment.patient)}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
            <CardDescription>Overview of your recent patient interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading patients...</p>
                </div>
              </div>
            ) : recentPatients.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent patient data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPatients.map((patient) => (
                <div 
                  key={patient.id} 
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleViewPatient(patient.id, patient.name)}
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>
                        {patient.name
                          ? (() => {
                              const nameParts = patient.name.split(" ");
                              return nameParts.length > 1 
                                ? nameParts[0][0] + nameParts[1][0]
                                : nameParts[0][0];
                            })()
                          : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-gray-900">{patient.name || 'Unknown Patient'}</h4>
                      <p className="text-sm text-gray-600">{patient.condition}</p>
                      <p className="text-xs text-gray-500">Last visit: {patient.lastVisit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        patient.progress === "Improving"
                          ? "default"
                          : patient.progress === "Stable"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {patient.progress}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">Next: {patient.nextAppointment}</p>
                  </div>
                </div>
              ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleManageAppointments}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Appointments</h3>
                  <p className="text-sm text-gray-600">View and manage your schedule</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handlePatientProgress}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Patient Progress</h3>
                  <p className="text-sm text-gray-600">Track treatment outcomes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handlePatientMessages}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Patient Messages</h3>
                  <p className="text-sm text-gray-600">Secure communication</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
