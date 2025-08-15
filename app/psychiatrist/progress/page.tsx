"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, TrendingDown, Minus, FileText, Users } from "lucide-react"

// Replace the 3D Progress Visualization with a simpler 2D chart
function ProgressChart({ patients }: { patients: Array<{ name: string; progress: number }> }) {
  return (
    <div className="h-64 flex items-end justify-center space-x-4 p-4">
      {patients.slice(0, 5).map((patient, index) => (
        <div key={patient.name} className="flex flex-col items-center space-y-2">
          <div
            className={`rounded-t transition-all duration-300 ${
              patient.progress >= 70 ? "bg-green-500" : patient.progress >= 40 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{
              height: `${(patient.progress / 100) * 200}px`,
              width: "40px",
            }}
          ></div>
          <span className="text-xs text-center font-medium">{patient.name.split(" ")[0]}</span>
          <span className="text-xs text-gray-600">{patient.progress}%</span>
        </div>
      ))}
    </div>
  )
}

export default function PatientProgress() {
  const [user, setUser] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [patients, setPatients] = useState([])
  const [selectedPatientData, setSelectedPatientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newNote, setNewNote] = useState('')
  const [treatmentGoal, setTreatmentGoal] = useState('')
  const [sessionFrequency, setSessionFrequency] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch('/api/patients/progress', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      } else {
        setError('Failed to fetch patient data')
      }
    } catch (err) {
      console.error('Error fetching patients:', err)
      setError('Failed to load patient data')
    } finally {
      setLoading(false)
    }
  }

  const fetchPatientDetails = async (patientId: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/patients/progress?patientId=${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedPatientData(data.patient)
      }
    } catch (err) {
      console.error('Error fetching patient details:', err)
    }
  }

  useEffect(() => {
    if (selectedPatient) {
      const patient = patients.find(p => p.name === selectedPatient)
      if (patient) {
        fetchPatientDetails(patient.id)
      }
    }
  }, [selectedPatient, patients])

  const handleSaveNote = async () => {
    if (!newNote.trim() || !selectedPatientData) return
    
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/patients/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: selectedPatientData.id,
          note: newNote
        })
      })

      if (response.ok) {
        setNewNote('')
        // Refresh patient data
        fetchPatientDetails(selectedPatientData.id)
      }
    } catch (err) {
      console.error('Error saving note:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTreatmentPlan = async () => {
    if (!treatmentGoal || !sessionFrequency || !selectedPatientData) return
    
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/patients/treatment-plan', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: selectedPatientData.id,
          treatmentGoal,
          sessionFrequency
        })
      })

      if (response.ok) {
        setTreatmentGoal('')
        setSessionFrequency('')
        // Refresh patient data
        fetchPatientDetails(selectedPatientData.id)
      }
    } catch (err) {
      console.error('Error updating treatment plan:', err)
    } finally {
      setSaving(false)
    }
  }

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "text-green-600 bg-green-100"
      case "declining":
        return "text-red-600 bg-red-100"
      default:
        return "text-yellow-600 bg-yellow-100"
    }
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Progress Tracking</h1>
          <p className="text-gray-600 mt-2">Monitor and analyze patient treatment outcomes and progress.</p>
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading patient data...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-500 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchPatients}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3D Progress Overview */}
        {!loading && !error && (
          <Card>
            <CardHeader>
              <CardTitle>Progress Overview</CardTitle>
              <CardDescription>
                Interactive visualization of patient progress based on real mood tracking data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg overflow-hidden">
                <ProgressChart patients={patients.slice(0, 5)} />
              </div>
              <div className="mt-4 flex justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span>Needs Attention (&lt;50%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span>Moderate Progress (50-70%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span>Good Progress (&gt;70%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Patient List */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

            <Card>
              <CardHeader>
                <CardTitle>Patient List</CardTitle>
                <CardDescription>{filteredPatients.length} patients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient.name)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedPatient === patient.name
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder-user.jpg" />
                            <AvatarFallback>
                              {patient.name
                                ? (() => {
                                    const nameParts = patient.name.split(" ");
                                    return nameParts.length > 1 
                                      ? nameParts[0][0] + nameParts[1][0]
                                      : nameParts[0][0];
                                  })()
                                : 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-sm">{patient.name}</h4>
                            <p className="text-xs text-gray-600">{patient.condition}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            {getTrendIcon(patient.trend)}
                            <span className="text-sm font-medium">{patient.progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Patient Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPatientData ? (
              <>
                {/* Patient Overview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src="/placeholder-user.jpg" />
                          <AvatarFallback>
                            {selectedPatientData.name
                              ? (() => {
                                  const nameParts = selectedPatientData.name.split(" ");
                                  return nameParts.length > 1 
                                    ? nameParts[0][0] + nameParts[1][0]
                                    : nameParts[0][0];
                                })()
                              : 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle>{selectedPatientData.name}</CardTitle>
                          <CardDescription>{selectedPatientData.condition}</CardDescription>
                        </div>
                      </div>
                      <Badge className={getTrendColor(selectedPatientData.trend)}>{selectedPatientData.trend}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Treatment Start</Label>
                          <p className="text-sm">{selectedPatientData.startDate}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Last Session</Label>
                          <p className="text-sm">{selectedPatientData.lastSession}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Next Appointment</Label>
                          <p className="text-sm">{selectedPatientData.nextAppointment}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Overall Progress</Label>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${selectedPatientData.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{selectedPatientData.progress}%</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Current Medications</Label>
                          <div className="space-y-1">
                            {(selectedPatientData.medications || []).length > 0 ? (
                              selectedPatientData.medications.map((med, index) => (
                                <Badge key={`med-${selectedPatientData.id}-${index}-${med}`} variant="outline" className="text-xs">
                                  {med}
                                </Badge>
                              ))
                            ) : (
                              <p className="text-xs text-gray-500">No medications recorded</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mood Tracking Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Mood Score Trend</CardTitle>
                    <CardDescription>Weekly mood scores over the past 7 weeks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-between space-x-2">
                      {(selectedPatientData.moodScores || []).map((score, index) => (
                        <div key={`mood-${selectedPatientData.id}-week-${index}`} className="flex flex-col items-center space-y-2">
                          <div
                            className="bg-blue-500 rounded-t"
                            style={{
                              height: `${(score / 10) * 200}px`,
                              width: "30px",
                            }}
                          ></div>
                          <span className="text-xs text-gray-600">W{index + 1}</span>
                          <span className="text-xs font-medium">{score}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Clinical Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Clinical Notes</CardTitle>
                    <CardDescription>Assessment and treatment notes history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Add New Note Section */}
                      <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <Label htmlFor="new-note" className="text-sm font-semibold text-blue-900">Add New Clinical Note</Label>
                        <Textarea
                          id="new-note"
                          placeholder="Enter clinical observations, treatment adjustments, patient feedback, or session notes..."
                          rows={4}
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="border-blue-300 focus:border-blue-500"
                        />
                        <Button 
                          onClick={handleSaveNote}
                          disabled={!newNote.trim() || saving}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {saving ? 'Saving...' : 'Save Note'}
                        </Button>
                      </div>

                      {/* Clinical Notes History */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Notes History</h4>
                        
                        {selectedPatientData.clinicalNotes && selectedPatientData.clinicalNotes.length > 0 ? (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {selectedPatientData.clinicalNotes.map((note, index) => (
                              <div key={`note-${selectedPatientData.id}-${index}-${note.created_at}`} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-900">
                                      {note.provider_name || 'Dr. Provider'}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {new Date(note.created_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{note.note_content}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <h4 className="text-sm font-medium text-gray-900 mb-1">No Clinical Notes</h4>
                            <p className="text-xs text-gray-500">No clinical notes have been recorded for this patient yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Treatment Plan Updates */}
                <Card>
                  <CardHeader>
                    <CardTitle>Treatment Plan Updates</CardTitle>
                    <CardDescription>Modify treatment approach and goals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="treatment-goal">Treatment Goal</Label>
                          <Select value={treatmentGoal} onValueChange={setTreatmentGoal}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select primary goal" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="symptom-reduction">Symptom Reduction</SelectItem>
                              <SelectItem value="mood-stabilization">Mood Stabilization</SelectItem>
                              <SelectItem value="coping-skills">Coping Skills Development</SelectItem>
                              <SelectItem value="medication-optimization">Medication Optimization</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="session-frequency">Session Frequency</Label>
                          <Select value={sessionFrequency} onValueChange={setSessionFrequency}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="as-needed">As Needed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button 
                        onClick={handleUpdateTreatmentPlan}
                        disabled={!treatmentGoal || !sessionFrequency || saving}
                      >
                        {saving ? 'Updating...' : 'Update Treatment Plan'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Patient</h3>
                    <p className="text-gray-600">Choose a patient from the list to view their progress details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        )}
      </div>
    </DashboardLayout>
  )
}
