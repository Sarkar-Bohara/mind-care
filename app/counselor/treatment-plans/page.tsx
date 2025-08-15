"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Edit, Plus, Target, Calendar, Users, ArrowLeft, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface TreatmentPlan {
  id: number
  clientId: number
  clientName: string
  title: string
  description: string
  goals: string[]
  interventions: string[]
  status: "active" | "completed" | "on-hold" | "draft"
  startDate: string
  endDate?: string
  progress: number
  lastUpdated: string
}

export default function TreatmentPlansPage() {
  const [user, setUser] = useState(null)
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Form state for creating/editing plans
  const [formData, setFormData] = useState({
    clientId: "",
    title: "",
    description: "",
    goals: [""],
    interventions: [""],
    startDate: "",
    endDate: ""
  })

  const mockClients = [
    { id: 1, name: "Sarah Johnson" },
    { id: 2, name: "Michael Chen" },
    { id: 3, name: "Emily Rodriguez" },
    { id: 4, name: "David Wilson" },
    { id: 5, name: "Lisa Anderson" }
  ]

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    loadTreatmentPlans()
  }, [])

  const loadTreatmentPlans = () => {
    // Mock data - in real app, fetch from API
    const mockPlans: TreatmentPlan[] = [
      {
        id: 1,
        clientId: 1,
        clientName: "Sarah Johnson",
        title: "Anxiety Management Program",
        description: "Comprehensive treatment plan for managing generalized anxiety disorder through CBT techniques and mindfulness practices.",
        goals: [
          "Reduce anxiety symptoms by 50% within 12 weeks",
          "Develop effective coping strategies",
          "Improve sleep quality and daily functioning"
        ],
        interventions: [
          "Cognitive Behavioral Therapy (CBT)",
          "Mindfulness meditation training",
          "Progressive muscle relaxation",
          "Exposure therapy for specific triggers"
        ],
        status: "active",
        startDate: "2024-01-15",
        endDate: "2024-04-15",
        progress: 65,
        lastUpdated: "2024-01-20"
      },
      {
        id: 2,
        clientId: 2,
        clientName: "Michael Chen",
        title: "Depression Recovery Plan",
        description: "Structured approach to address major depressive symptoms using evidence-based therapeutic interventions.",
        goals: [
          "Improve mood stability",
          "Increase social engagement",
          "Establish healthy daily routines"
        ],
        interventions: [
          "Interpersonal Therapy (IPT)",
          "Behavioral activation",
          "Social skills training",
          "Medication management coordination"
        ],
        status: "active",
        startDate: "2024-01-10",
        endDate: "2024-06-10",
        progress: 40,
        lastUpdated: "2024-01-18"
      },
      {
        id: 3,
        clientId: 3,
        clientName: "Emily Rodriguez",
        title: "Trauma Processing Therapy",
        description: "EMDR-based treatment plan for processing childhood trauma and reducing PTSD symptoms.",
        goals: [
          "Process traumatic memories safely",
          "Reduce PTSD symptom severity",
          "Improve emotional regulation"
        ],
        interventions: [
          "Eye Movement Desensitization and Reprocessing (EMDR)",
          "Trauma-focused CBT",
          "Grounding techniques",
          "Safety planning"
        ],
        status: "on-hold",
        startDate: "2024-01-05",
        progress: 25,
        lastUpdated: "2024-01-16"
      }
    ]
    setTreatmentPlans(mockPlans)
  }

  const filteredPlans = treatmentPlans.filter(plan => {
    const matchesSearch = plan.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || plan.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "on-hold":
        return "bg-yellow-100 text-yellow-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "on-hold":
        return <Clock className="h-4 w-4" />
      case "draft":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const resetForm = () => {
    setFormData({
      clientId: "",
      title: "",
      description: "",
      goals: [""],
      interventions: [""],
      startDate: "",
      endDate: ""
    })
  }

  const handleCreatePlan = () => {
    if (!formData.clientId || !formData.title || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const newPlan: TreatmentPlan = {
      id: treatmentPlans.length + 1,
      clientId: parseInt(formData.clientId),
      clientName: mockClients.find(c => c.id === parseInt(formData.clientId))?.name || "",
      title: formData.title,
      description: formData.description,
      goals: formData.goals.filter(g => g.trim() !== ""),
      interventions: formData.interventions.filter(i => i.trim() !== ""),
      status: "draft",
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      endDate: formData.endDate,
      progress: 0,
      lastUpdated: new Date().toISOString().split('T')[0]
    }

    setTreatmentPlans([...treatmentPlans, newPlan])
    setIsCreateDialogOpen(false)
    resetForm()
    
    toast({
      title: "Success",
      description: "Treatment plan created successfully"
    })
  }

  const addGoal = () => {
    setFormData(prev => ({ ...prev, goals: [...prev.goals, ""] }))
  }

  const addIntervention = () => {
    setFormData(prev => ({ ...prev, interventions: [...prev.interventions, ""] }))
  }

  const updateGoal = (index: number, value: string) => {
    const newGoals = [...formData.goals]
    newGoals[index] = value
    setFormData(prev => ({ ...prev, goals: newGoals }))
  }

  const updateIntervention = (index: number, value: string) => {
    const newInterventions = [...formData.interventions]
    newInterventions[index] = value
    setFormData(prev => ({ ...prev, interventions: newInterventions }))
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
              <h1 className="text-3xl font-bold text-gray-900">Treatment Plans</h1>
              <p className="text-gray-600 mt-2">Create and manage comprehensive treatment plans for your clients.</p>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Treatment Plan</DialogTitle>
                <DialogDescription>
                  Design a comprehensive treatment plan for your client
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select value={formData.clientId} onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockClients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Plan Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Anxiety Management Program"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the overall treatment approach and objectives..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Treatment Goals</Label>
                  {formData.goals.map((goal, index) => (
                    <Input
                      key={index}
                      value={goal}
                      onChange={(e) => updateGoal(index, e.target.value)}
                      placeholder={`Goal ${index + 1}`}
                    />
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addGoal}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Goal
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Interventions</Label>
                  {formData.interventions.map((intervention, index) => (
                    <Input
                      key={index}
                      value={intervention}
                      onChange={(e) => updateIntervention(index, e.target.value)}
                      placeholder={`Intervention ${index + 1}`}
                    />
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addIntervention}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Intervention
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Target End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePlan}>
                    Create Plan
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
              <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{treatmentPlans.filter(p => p.status === "active").length}</div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{treatmentPlans.filter(p => p.status === "completed").length}</div>
              <p className="text-xs text-muted-foreground">Successfully finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Hold</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{treatmentPlans.filter(p => p.status === "on-hold").length}</div>
              <p className="text-xs text-muted-foreground">Temporarily paused</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {treatmentPlans.length > 0 
                  ? Math.round(treatmentPlans.reduce((acc, plan) => acc + plan.progress, 0) / treatmentPlans.length)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Across all plans</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Treatment Plans</CardTitle>
            <CardDescription>Manage and track your clients' treatment plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search by client name or plan title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Treatment Plans List */}
            <div className="space-y-4">
              {filteredPlans.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No treatment plans found</p>
                </div>
              ) : (
                filteredPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-4 border rounded-lg hover:border-gray-300 transition-all cursor-pointer"
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {plan.clientName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                            <Badge className={getStatusColor(plan.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(plan.status)}
                                <span>{plan.status}</span>
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{plan.clientName}</p>
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{plan.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Started: {new Date(plan.startDate).toLocaleDateString()}</span>
                            {plan.endDate && <span>Target: {new Date(plan.endDate).toLocaleDateString()}</span>}
                            <span>Updated: {new Date(plan.lastUpdated).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-right">
                          <div className="text-sm font-medium">{plan.progress}% Complete</div>
                          <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all" 
                              style={{ width: `${plan.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/counselor/schedule?client=${plan.clientId}`)
                          }}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Schedule
                        </Button>
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