"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, Video, Star, MapPin } from "lucide-react"

export default function BookingPage() {
  const [user, setUser] = useState(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedProvider, setSelectedProvider] = useState("")
  const [sessionType, setSessionType] = useState("")
  const [reason, setReason] = useState("")
  const [providers, setProviders] = useState([])
  const [isLoadingProviders, setIsLoadingProviders] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    
    // Fetch providers from API
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      setIsLoadingProviders(true)
      const response = await fetch('/api/providers')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProviders(data.providers)
        } else {
          console.error('Failed to fetch providers:', data.error)
          // Fallback to default providers if API fails
          setProviders(defaultProviders)
        }
      } else {
        console.error('Failed to fetch providers')
        setProviders(defaultProviders)
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
      setProviders(defaultProviders)
    } finally {
      setIsLoadingProviders(false)
    }
  }

  // Fallback providers in case API fails
  const defaultProviders = [
    {
      id: 2, // Matches database user_id for dr.sarah
      name: "Dr. Sarah Ahmad",
      specialty: "Psychiatry",
      rating: 4.9,
      experience: "8 years",
      location: "Kuala Lumpur",
      image: "/placeholder-user.jpg",
      available: true,
      price: "RM 200/session",
    },
    {
      id: 3, // Matches database user_id for counselor.fatimah
      name: "Fatimah Ibrahim",
      specialty: "Counseling Psychology",
      rating: 4.7,
      experience: "6 years",
      location: "Shah Alam",
      image: "/placeholder-user.jpg",
      available: true,
      price: "RM 150/session",
    },
  ]

  const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"]

  const sessionTypes = [
    { value: "individual", label: "Individual Session", duration: "50 minutes" },
    { value: "group", label: "Group Therapy", duration: "60 minutes" },
    { value: "family", label: "Family Counseling", duration: "60 minutes" },
    { value: "consultation", label: "Initial Consultation", duration: "30 minutes" },
  ]

  const [isBooking, setIsBooking] = useState(false)

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedProvider || !sessionType) {
      alert("Please fill in all required fields")
      return
    }

    setIsBooking(true)

    try {
      // Find the selected provider details
      const providerDetails = providers.find((p) => p.name === selectedProvider)
      
      // Get provider ID from the selected provider details
      const providerId = providerDetails?.id
      if (!providerId) {
        throw new Error("Provider not found")
      }

      const appointmentData = {
        providerId: providerId,
        appointmentDate: selectedDate.toISOString().split("T")[0],
        appointmentTime: selectedTime,
        type: sessionType,
        notes: reason || null
      }

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Please log in to book an appointment')
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(appointmentData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to book appointment')
      }

      const result = await response.json()
      
      // Also save to localStorage for immediate UI updates
      const booking = {
        id: result.appointment?.appointment_id || result.appointment_id,
        date: selectedDate.toISOString().split("T")[0],
        time: selectedTime,
        provider: selectedProvider,
        providerSpecialty: providerDetails?.specialty || "",
        sessionType,
        reason,
        status: "pending",
        patientName: user?.name || "Patient",
        patientEmail: user?.email || "",
        price: providerDetails?.price || "RM 150",
        createdAt: new Date().toISOString(),
      }

      const existingBookings = JSON.parse(localStorage.getItem("bookings") || "[]")
      existingBookings.push(booking)
      localStorage.setItem("bookings", JSON.stringify(existingBookings))

      alert("Appointment booked successfully! You will receive a confirmation email shortly with all the details.")

      // Reset form
      setSelectedTime("")
      setSelectedProvider("")
      setSessionType("")
      setReason("")
      setSelectedDate(new Date())
      
    } catch (error) {
      console.error('Booking error:', error)
      alert(error instanceof Error ? error.message : 'Failed to book appointment. Please try again.')
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Book Counseling Session</h1>
          <p className="text-gray-600 mt-2">Schedule an appointment with our qualified mental health professionals.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Session Type</CardTitle>
                <CardDescription>Choose the type of session you need</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {sessionTypes.map((type) => (
                    <div
                      key={type.value}
                      onClick={() => setSessionType(type.value)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        sessionType === type.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900">{type.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">{type.duration}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Provider Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Provider</CardTitle>
                <CardDescription>Select a mental health professional</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProviders ? (
                  <div className="space-y-4">
                    <div className="animate-pulse">
                      <div className="flex items-start space-x-4">
                        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                    <div className="animate-pulse">
                      <div className="flex items-start space-x-4">
                        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {providers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No providers available at the moment.</p>
                        <p className="text-sm mt-2">Please try again later or contact support.</p>
                      </div>
                    ) : (
                      providers.map((provider) => (
                        <div
                          key={provider.id}
                          onClick={() => provider.available && setSelectedProvider(provider.name)}
                          className={`p-4 border rounded-lg transition-all ${
                            !provider.available
                              ? "opacity-50 cursor-not-allowed"
                              : selectedProvider === provider.name
                                ? "border-blue-500 bg-blue-50 cursor-pointer"
                                : "border-gray-200 hover:border-gray-300 cursor-pointer"
                          }`}
                        >
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={provider.image || "/placeholder.svg"} />
                          <AvatarFallback>
                            {provider.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                            <div className="flex items-center space-x-2">
                              {provider.available ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  Available
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-red-100 text-red-800">
                                  Unavailable
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{provider.specialty}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{provider.rating}</span>
                            </div>
                            <span>{provider.experience}</span>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{provider.location}</span>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-blue-600 mt-1">{provider.price}</p>
                        </div>
                      </div>
                    </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Date and Time Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Date & Time</CardTitle>
                <CardDescription>Select your preferred appointment slot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-base font-medium mb-3 block">Select Date</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date() || date.getDay() === 0}
                      className="rounded-md border"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium mb-3 block">Available Times</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          onClick={() => setSelectedTime(time)}
                          className="justify-start"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Help us prepare for your session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reason">Reason for Visit (Optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Briefly describe what you'd like to discuss or any specific concerns..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session Type:</span>
                    <span className="font-medium">
                      {sessionType ? sessionTypes.find((t) => t.value === sessionType)?.label : "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span className="font-medium">{selectedProvider || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {selectedDate ? selectedDate.toLocaleDateString() : "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{selectedTime || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session Mode:</span>
                    <div className="flex items-center space-x-1">
                      <Video className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Online</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>RM 150</span>
                  </div>
                </div>

                <Button 
                  onClick={handleBooking} 
                  className="w-full" 
                  size="lg"
                  disabled={isBooking || !selectedDate || !selectedTime || !selectedProvider || !sessionType}
                >
                  {isBooking ? "Booking..." : "Book Appointment"}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  You will receive a confirmation email with the video call link
                </p>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Important Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p>Sessions are conducted via secure video call</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p>You can reschedule up to 24 hours before your appointment</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p>All sessions are confidential and HIPAA compliant</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p>Payment is processed securely after confirmation</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
