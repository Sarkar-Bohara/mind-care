"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Clock, Video, Phone, CheckCircle, XCircle, AlertCircle, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { makeCall, makeVideoCall } from "@/utils/callService"

export default function PatientAppointments() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Fetch appointments from API
      const fetchAppointments = async () => {
        try {
          const token = localStorage.getItem('token')
          if (!token) return

          const response = await fetch('/api/appointments', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            const data = await response.json()
            const formattedAppointments = data.appointments?.map((apt: any) => ({
              id: apt.appointment_id,
              provider: apt.provider_name,
              providerSpecialty: apt.provider_role,
              date: apt.appointment_date,
              time: apt.appointment_time,
              sessionType: apt.type,
              status: apt.status,
              reason: apt.notes || "Regular consultation",
              patientName: apt.patient_name,
              patientEmail: apt.patient_email,
              price: "RM 150", // Default price
              createdAt: apt.created_at,
            })) || []

            // Sort appointments by date
            const sortedAppointments = formattedAppointments.sort((a: any, b: any) => {
              const dateA = new Date(`${a.date} ${a.time}`)
              const dateB = new Date(`${b.date} ${b.time}`)
              return dateA.getTime() - dateB.getTime()
            })

            setAppointments(sortedAppointments)
          }
        } catch (error) {
          console.error('Failed to fetch appointments:', error)
          // Fallback to localStorage if API fails
          const bookings = JSON.parse(localStorage.getItem("bookings") || "[]")
          const userAppointments = bookings.filter(
            (booking: any) =>
              booking.patientEmail === parsedUser.email ||
              booking.patientName === parsedUser.name ||
              booking.patientName === parsedUser.username,
          )

          // Sort appointments by date
          const sortedAppointments = userAppointments.sort((a: any, b: any) => {
            const dateA = new Date(`${a.date} ${a.time}`)
            const dateB = new Date(`${b.date} ${b.time}`)
            return dateA.getTime() - dateB.getTime()
          })

          setAppointments(sortedAppointments)
        }
      }

      fetchAppointments()
    }
  }, [])

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const upcomingAppointments = appointments.filter((apt: any) => {
    const appointmentDate = new Date(apt.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return appointmentDate >= today && apt.status !== "cancelled" && apt.status !== "completed"
  })

  const pastAppointments = appointments.filter((apt: any) => {
    const appointmentDate = new Date(apt.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return appointmentDate < today || apt.status === "completed"
  })

  const pendingAppointments = appointments.filter((apt: any) => apt.status === "pending")

  const handleSendMessage = (providerName: string) => {
    // Navigate to messages page with provider info
    router.push(`/patient/messages?psychiatristName=${encodeURIComponent(providerName)}`)
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
            <p className="text-gray-600 mt-2">View and manage your scheduled appointments.</p>
          </div>
          <Link href="/patient/booking">
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Book New Appointment
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingAppointments.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pastAppointments.length}</div>
              <p className="text-xs text-muted-foreground">Sessions attended</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Appointments Alert */}
        {pendingAppointments.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-800">Pending Appointments</CardTitle>
              </div>
              <CardDescription className="text-yellow-700">
                You have {pendingAppointments.length} appointment(s) awaiting provider confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingAppointments.map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {appointment.provider
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("") || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-sm">{appointment.provider}</h4>
                        <p className="text-xs text-gray-600">{appointment.sessionType}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your confirmed appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming appointments</h3>
                <p className="text-gray-600 mb-4">Schedule your next session with a mental health professional.</p>
                <Link href="/patient/booking">
                  <Button>Book Appointment</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment: any) => (
                  <div key={appointment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {appointment.provider
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("") || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{appointment.provider}</h4>
                          <p className="text-sm text-gray-600">{appointment.providerSpecialty}</p>
                          <p className="text-sm font-medium text-blue-600 mt-1">{appointment.sessionType}</p>

                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(appointment.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{appointment.time}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Video className="h-4 w-4" />
                              <span>Online Session</span>
                            </div>
                          </div>

                          {appointment.reason && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700">
                                <strong>Reason:</strong> {appointment.reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(appointment.status)}
                          <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                        </div>

                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSendMessage(appointment.provider)}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          {appointment.status === "confirmed" && (
                            <>
                              <Button 
                                size="sm"
                                onClick={() => makeVideoCall(appointment.provider, appointment.id.toString())}
                              >
                                <Video className="h-4 w-4 mr-1" />
                                Join Session
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => makeCall(appointment.provider, undefined, appointment.id.toString())}
                              >
                                <Phone className="h-4 w-4 mr-1" />
                                Call
                              </Button>
                            </>
                          )}
                        </div>

                        <div className="text-right text-sm text-gray-500">
                          <p>Booked: {new Date(appointment.createdAt).toLocaleDateString()}</p>
                          <p className="font-medium text-gray-900">{appointment.price}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Past Appointments</CardTitle>
              <CardDescription>Your appointment history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pastAppointments.slice(0, 5).map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {appointment.provider
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-gray-900">{appointment.provider}</h4>
                        <p className="text-sm text-gray-600">{appointment.sessionType}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(appointment.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{appointment.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                      <div className="flex space-x-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleSendMessage(appointment.provider)}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {pastAppointments.length > 5 && (
                  <div className="text-center">
                    <Button variant="outline">View All Past Appointments</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Appointments State */}
        {appointments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No appointments yet</h3>
              <p className="text-gray-600 mb-6">
                Start your mental health journey by booking your first appointment with a qualified professional.
              </p>
              <Link href="/patient/booking">
                <Button size="lg">
                  <Calendar className="h-5 w-5 mr-2" />
                  Book Your First Appointment
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
