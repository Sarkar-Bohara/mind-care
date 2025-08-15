"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, Users, ArrowLeft } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function SchedulePage() {
  const [user, setUser] = useState(null)
  const [patients, setPatients] = useState([])
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedPatient, setSelectedPatient] = useState("")
  const [sessionType, setSessionType] = useState("")
  const [duration, setDuration] = useState("60")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/patients", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.error("Error fetching patients:", error)
    }
  }

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDate || !selectedTime || !selectedPatient || !sessionType) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/counselor/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          patientId: selectedPatient,
          appointmentDate: format(selectedDate, "yyyy-MM-dd"),
          appointmentTime: selectedTime,
          type: sessionType,
          notes: notes
        })
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Session scheduled successfully"
        })
        router.push("/counselor/sessions")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to schedule session",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error scheduling session:", error)
      toast({
        title: "Error",
        description: "Failed to schedule session",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ]

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Schedule Session</h1>
              <p className="text-gray-600 mt-2">Schedule a new counseling session with a patient.</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Schedule Form */}
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
              <CardDescription>Fill in the details for the new session</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScheduleSession} className="space-y-4">
                {/* Patient Selection */}
                <div className="space-y-2">
                  <Label htmlFor="patient">Patient *</Label>
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient: any) => (
                        <SelectItem key={patient.user_id} value={patient.user_id.toString()}>
                          {patient.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Selection */}
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Selection */}
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Session Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Session Type *</Label>
                  <Select value={sessionType} onValueChange={setSessionType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="counseling">Individual Counseling</SelectItem>
                      <SelectItem value="group">Group Therapy</SelectItem>
                      <SelectItem value="couples">Couples Therapy</SelectItem>
                      <SelectItem value="family">Family Therapy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Session Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any initial notes or session objectives..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Scheduling..." : "Schedule Session"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scheduling Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Session Duration</h4>
                    <p className="text-sm text-gray-600">
                      Standard sessions are 60 minutes. Adjust based on patient needs.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Patient Preparation</h4>
                    <p className="text-sm text-gray-600">
                      Patients will receive automatic reminders 24 hours and 1 hour before the session.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CalendarIcon className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Cancellation Policy</h4>
                    <p className="text-sm text-gray-600">
                      Sessions can be rescheduled up to 2 hours before the appointment time.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle>Selected Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {format(selectedDate, "EEEE")}
                    </div>
                    <div className="text-lg text-gray-600">
                      {format(selectedDate, "MMMM d, yyyy")}
                    </div>
                    {selectedTime && (
                      <div className="text-sm text-gray-500 mt-2">
                        at {selectedTime}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}