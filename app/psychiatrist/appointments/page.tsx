"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock, Video, Phone, User, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { makeCall, makeVideoCall } from "@/utils/callService"

export default function AppointmentsPage() {
  const { toast } = useToast()
  const [user, setUser] = useState(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [viewMode, setViewMode] = useState("day")
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Fetch appointments from API
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        console.log('Making API request with token:', token ? 'Token exists' : 'No token')
        const response = await fetch('/api/appointments', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        console.log('API Response status:', response.status)
        console.log('API Response ok:', response.ok)

        if (response.ok) {
          const data = await response.json()
          console.log('API Response:', data)
          const formattedAppointments = data.appointments?.map((apt: any) => ({
            id: apt.appointment_id,
            patient: apt.patient_name,
            patientEmail: apt.patient_email,
            date: apt.appointment_date,
            time: apt.appointment_time,
            type: apt.type,
            provider: apt.provider_name,
            status: apt.status,
            reason: apt.notes || "Regular consultation",
            duration: "30 min",
          })) || []
          console.log('Formatted Appointments:', formattedAppointments)
          setAppointments(formattedAppointments)
        } else {
          console.error('API request failed:', response.status, response.statusText)
          const errorText = await response.text()
          console.error('Error response:', errorText)
        }
      } catch (error) {
        console.error('Failed to fetch appointments:', error)
        // Fallback to localStorage if API fails
        const bookings = JSON.parse(localStorage.getItem("bookings") || "[]")
        console.log('Fallback to localStorage bookings:', bookings)
        const formattedAppointments = bookings.map((booking: any) => ({
          id: booking.id,
          patient: booking.patientName,
          patientEmail: booking.patientEmail,
          date: booking.date,
          time: booking.time,
          type: booking.sessionType,
          provider: booking.provider,
          status: booking.status,
          reason: booking.reason || "Regular consultation",
          duration: "30 min",
        }))
        console.log('Formatted fallback appointments:', formattedAppointments)
        setAppointments(formattedAppointments)
      }
    }

    fetchAppointments()
  }, [])

  const handleStatusChange = async (appointmentId: number, newStatus: string) => {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please log in to update appointments')
        return
      }

      // Call API to update appointment status
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        // Update local state
        const updatedAppointments = appointments.map((apt: any) =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt,
        )
        setAppointments(updatedAppointments)

        // Update in localStorage
        const bookings = JSON.parse(localStorage.getItem("bookings") || "[]")
        const updatedBookings = bookings.map((booking: any) =>
          booking.id === appointmentId ? { ...booking, status: newStatus } : booking,
        )
        localStorage.setItem("bookings", JSON.stringify(updatedBookings))

        alert(`Appointment ${newStatus} successfully!${newStatus === 'confirmed' ? ' Confirmation email sent to patient.' : ''}`)
      } else {
        const error = await response.json()
        alert(`Failed to update appointment: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating appointment status:', error)
      alert('Failed to update appointment status')
    }
  }

  const handleJoinVideo = (appointmentId: number, patientName: string) => {
    makeVideoCall(patientName, appointmentId.toString())
  }

  const handleMakeCall = (patientName: string, appointmentId?: number) => {
    makeCall(patientName, undefined, appointmentId?.toString())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const todaysAppointments = appointments.filter((apt: any) => {
    if (!selectedDate) return false
    // Handle different date formats from database
    const appointmentDate = new Date(apt.date).toISOString().split("T")[0]
    const selectedDateStr = selectedDate.toISOString().split("T")[0]
    console.log('Date comparison:', { appointmentDate, selectedDateStr, match: appointmentDate === selectedDateStr })
    return appointmentDate === selectedDateStr
  })
  
  console.log('All appointments:', appointments)
  console.log('Today\'s appointments:', todaysAppointments)
  console.log('Selected date:', selectedDate)

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-2">Manage your patient appointments and schedule.</p>
          </div>
          <div className="flex space-x-2">
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day View</SelectItem>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="month">Month View</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <CalendarIcon className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <CalendarIcon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaysAppointments.length}</div>
              <p className="text-xs text-muted-foreground">
                {todaysAppointments.filter((apt: any) => apt.status === "confirmed").length} confirmed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointments.filter((apt: any) => apt.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <User className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">Total appointments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Select a date to view appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Appointments List */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appointments for {selectedDate?.toLocaleDateString() || "Today"}</CardTitle>
                <CardDescription>{todaysAppointments.length} appointment(s) scheduled</CardDescription>
              </CardHeader>
              <CardContent>
                {todaysAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments</h3>
                    <p className="text-gray-600">No appointments scheduled for this date.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todaysAppointments.map((appointment: any) => (
                      <div key={appointment.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <Avatar>
                              <AvatarFallback>
                                {appointment.patient
                                  ? (() => {
                                      const nameParts = appointment.patient.split(" ");
                                      return nameParts.length > 1 
                                        ? nameParts[0][0] + nameParts[1][0]
                                        : nameParts[0][0];
                                    })()
                                  : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-gray-900">{appointment.patient}</h4>
                              <p className="text-sm text-gray-600">{appointment.type}</p>
                              <p className="text-xs text-gray-500">{appointment.reason}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {appointment.time} • {appointment.duration}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                            <div className="flex space-x-2">
                              {appointment.status === "pending" && (
                                <>
                                  <Button size="sm" onClick={() => handleStatusChange(appointment.id, "confirmed")}>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(appointment.id, "cancelled")}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                </>
                              )}
                              {appointment.status === "confirmed" && (
                                <>
                                  <Button size="sm" onClick={() => handleJoinVideo(appointment.id, appointment.patient)}>
                                    <Video className="h-4 w-4 mr-1" />
                                    Join
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleMakeCall(appointment.patient, appointment.id)}>
                                    <Phone className="h-4 w-4 mr-1" />
                                    Call
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
