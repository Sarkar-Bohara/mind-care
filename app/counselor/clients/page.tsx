"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Users, Phone, Mail, Calendar, ArrowLeft, Plus, Video } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { makeCall, makeVideoCall } from "@/utils/callService"

export default function ClientsPage() {
  const [user, setUser] = useState(null)
  const [clients, setClients] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/patients?active=true", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setClients(data.patients || [])
      } else {
        // Fallback to mock data
        setClients([
          {
            user_id: 1,
            full_name: "Sarah Johnson",
            email: "sarah.johnson@email.com",
            phone: "+1 (555) 123-4567",
            date_of_birth: "1995-03-15",
            created_at: "2024-01-01",
            is_active: true
          },
          {
            user_id: 2,
            full_name: "Michael Chen",
            email: "michael.chen@email.com",
            phone: "+1 (555) 987-6543",
            date_of_birth: "1988-07-22",
            created_at: "2024-01-05",
            is_active: true
          },
          {
            user_id: 3,
            full_name: "Emily Rodriguez",
            email: "emily.rodriguez@email.com",
            phone: "+1 (555) 456-7890",
            date_of_birth: "1992-11-08",
            created_at: "2024-01-10",
            is_active: true
          }
        ])
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Error",
        description: "Failed to load client records",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Client Records</h1>
              <p className="text-gray-600 mt-2">Manage your client information and history.</p>
            </div>
          </div>
          <Button onClick={() => router.push('/counselor/schedule')}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Session
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-xs text-muted-foreground">Active clients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">New registrations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regular Clients</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.floor(clients.length * 0.7)}</div>
              <p className="text-xs text-muted-foreground">Ongoing treatment</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Client Directory</CardTitle>
            <CardDescription>Search and manage your client records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search clients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Client List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading clients...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No clients found</p>
                </div>
              ) : (
                filteredClients.map((client) => (
                  <div
                    key={client.user_id}
                    className="p-4 border rounded-lg hover:border-gray-300 transition-all cursor-pointer"
                    onClick={() => router.push(`/counselor/clients/${client.user_id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {client.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{client.full_name}</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{client.email}</span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Age: {calculateAge(client.date_of_birth)}</span>
                            <span>Client since: {new Date(client.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className="bg-green-100 text-green-800">
                          {client.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <div className="flex space-x-2">
                          {client.phone && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  makeVideoCall(client.full_name)
                                }}
                              >
                                <Video className="h-3 w-3 mr-1" />
                                Video
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  makeCall(client.full_name, client.phone)
                                }}
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                Call
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/counselor/schedule?client=${client.user_id}`)
                            }}
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Schedule
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}