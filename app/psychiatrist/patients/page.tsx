"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft, Calendar, Clock, FileText, MessageSquare, Phone, Video, User, TrendingUp } from "lucide-react"
import { makeCall, makeVideoCall } from '@/utils/callService'

export default function PatientDetailsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('id')
  const patientName = searchParams.get('name')
  const [user, setUser] = useState(null)
  const [patient, setPatient] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Mock patient data - in a real app, this would come from an API
    if (patientId && patientName) {
      setPatient({
        id: parseInt(patientId),
        name: patientName,
        email: `${patientName.toLowerCase().replace(' ', '.')}@email.com`,
        phone: "+60 12-345 6789",
        dateOfBirth: "1990-05-15",
        condition: "Anxiety Disorder",
        progress: "Improving",
        lastVisit: "2024-01-10",
        nextAppointment: "2024-01-20",
        treatmentPlan: "Cognitive Behavioral Therapy + Medication",
        medications: ["Sertraline 50mg", "Lorazepam 0.5mg PRN"],
        notes: "Patient showing good progress with CBT sessions. Anxiety levels have decreased significantly.",
        appointments: [
          {
            id: 1,
            date: "2024-01-20",
            time: "10:00 AM",
            type: "Follow-up",
            status: "scheduled"
          },
          {
            id: 2,
            date: "2024-01-10",
            time: "2:00 PM",
            type: "Therapy Session",
            status: "completed"
          }
        ],
        vitals: {
          bloodPressure: "120/80",
          heartRate: "72 bpm",
          weight: "65 kg",
          height: "170 cm"
        }
      })
    }
  }, [patientId, patientName])

  const handleStartVideoCall = () => {
    if (patient?.name) {
      makeVideoCall(patient.name)
    }
  }

  const handleMakeCall = () => {
    if (patient?.name) {
      makeCall(patient.name, patient.phone)
    }
  }

  const handleSendMessage = () => {
    router.push(`/psychiatrist/messages?patientId=${patientId}&patientName=${encodeURIComponent(patientName || '')}`)
  }

  const handleScheduleAppointment = () => {
    toast({
      title: "Schedule Appointment",
      description: "Redirecting to appointment scheduling...",
    })
    router.push('/psychiatrist/appointments')
  }

  if (!patient) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Patient not found</h2>
            <p className="text-gray-600 mt-2">The requested patient information could not be loaded.</p>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
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
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patient Details</h1>
              <p className="text-gray-600 mt-1">Comprehensive patient information and history</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleStartVideoCall}>
              <Video className="h-4 w-4 mr-2" />
              Video Call
            </Button>
            <Button variant="outline" onClick={handleMakeCall}>
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
            <Button variant="outline" onClick={handleSendMessage}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>
        </div>

        {/* Patient Overview */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="text-lg">
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
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
                <p className="text-gray-600">{patient.email}</p>
                <p className="text-gray-600">{patient.phone}</p>
                <div className="flex items-center space-x-4 mt-2">
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
                  <span className="text-sm text-gray-500">Last visit: {patient.lastVisit}</span>
                  <span className="text-sm text-gray-500">Next: {patient.nextAppointment}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="treatment">Treatment</TabsTrigger>
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date of Birth:</span>
                    <span className="font-medium">{patient.dateOfBirth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Primary Condition:</span>
                    <span className="font-medium">{patient.condition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Treatment Plan:</span>
                    <span className="font-medium">{patient.treatmentPlan}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Medications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {patient.medications.map((medication, index) => (
                      <div key={`medication-${patient.id}-${index}-${medication}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{medication}</span>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Clinical Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{patient.notes}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appointment History</CardTitle>
                <CardDescription>Recent and upcoming appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patient.appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{appointment.type}</h4>
                          <p className="text-sm text-gray-600">{appointment.date} at {appointment.time}</p>
                        </div>
                      </div>
                      <Badge variant={appointment.status === "completed" ? "default" : "secondary"}>
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button onClick={handleScheduleAppointment} className="w-full mt-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule New Appointment
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="treatment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Treatment Progress</CardTitle>
                <CardDescription>Patient's progress and treatment outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Overall Progress</span>
                    </div>
                    <Badge variant="default">Improving</Badge>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Therapy Sessions</h4>
                      <p className="text-2xl font-bold text-blue-600">12</p>
                      <p className="text-sm text-gray-600">Completed sessions</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Medication Adherence</h4>
                      <p className="text-2xl font-bold text-green-600">95%</p>
                      <p className="text-sm text-gray-600">Compliance rate</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vitals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vital Signs</CardTitle>
                <CardDescription>Latest recorded vital signs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <h4 className="font-semibold text-gray-600">Blood Pressure</h4>
                    <p className="text-2xl font-bold text-blue-600">{patient.vitals.bloodPressure}</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <h4 className="font-semibold text-gray-600">Heart Rate</h4>
                    <p className="text-2xl font-bold text-green-600">{patient.vitals.heartRate}</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <h4 className="font-semibold text-gray-600">Weight</h4>
                    <p className="text-2xl font-bold text-purple-600">{patient.vitals.weight}</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <h4 className="font-semibold text-gray-600">Height</h4>
                    <p className="text-2xl font-bold text-orange-600">{patient.vitals.height}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}