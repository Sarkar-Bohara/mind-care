"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Download, FileText, BarChart3, TrendingUp, Users, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

export default function ReportsPage() {
  const [user, setUser] = useState(null)
  const [reportType, setReportType] = useState("")
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined })
  const [selectedClient, setSelectedClient] = useState("")
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
      fetchClients()
    }
  }, [])

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/counselor/clients", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients)
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const reportTypes = [
    { value: "session-summary", label: "Session Summary Report" },
    { value: "client-progress", label: "Client Progress Report" },
    { value: "monthly-overview", label: "Monthly Overview" },
    { value: "treatment-outcomes", label: "Treatment Outcomes" },
    { value: "attendance-report", label: "Attendance Report" }
  ]

  const [clients, setClients] = useState([])

  const generateReport = async () => {
    if (!reportType) {
      toast({
        title: "Error",
        description: "Please select a report type",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      const token = localStorage.getItem("token")
      const params = new URLSearchParams({
        type: reportType
      })
      
      if (dateRange.from) {
        params.append("from", dateRange.from.toISOString().split('T')[0])
      }
      
      if (dateRange.to) {
        params.append("to", dateRange.to.toISOString().split('T')[0])
      }
      
      if (selectedClient && selectedClient !== "all") {
        params.append("clientId", selectedClient)
      }
      
      const response = await fetch(`/api/counselor/reports?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setReportData(data.reportData)
        toast({
          title: "Success",
          description: "Report generated successfully"
        })
      } else {
        throw new Error("Failed to generate report")
      }
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    if (!reportData) return
    
    // Create a comprehensive text report
    let summarySection = ""
    
    if (reportData.totalSessions) {
      summarySection = `Total Sessions: ${reportData.totalSessions}
Completed: ${reportData.completedSessions}
Cancelled: ${reportData.cancelledSessions}
No Shows: ${reportData.noShowSessions || 0}
Average Duration: ${reportData.averageDuration}
Clients Seen: ${reportData.clientsSeen}`
    } else if (reportData.totalScheduled) {
      summarySection = `Total Scheduled: ${reportData.totalScheduled}
Total Attended: ${reportData.totalAttended}
Total Cancelled: ${reportData.totalCancelled}
Total No Shows: ${reportData.totalNoShows}
Attendance Rate: ${reportData.attendanceRate}`
    } else if (reportData.completedTreatment !== undefined) {
      summarySection = `Total Clients: ${reportData.totalClients}
Completed Treatment: ${reportData.completedTreatment}
Ongoing Treatment: ${reportData.ongoingTreatment}
Average Sessions per Client: ${reportData.averageSessionsPerClient}
Success Rate: ${reportData.successRate}`
    } else if (reportData.activeClients) {
      summarySection = `Total Clients: ${reportData.totalClients}
Active Clients: ${reportData.activeClients}
Improved Clients: ${reportData.improvedClients}
Stable Clients: ${reportData.stableClients}`
    } else if (reportData.totalRevenue) {
      summarySection = `Total Revenue: ${reportData.totalRevenue}
Total Hours: ${reportData.totalHours}
New Clients: ${reportData.newClients}
Retention Rate: ${reportData.retentionRate}`
    }
    
    const reportContent = `
${reportData.title}
${'='.repeat(reportData.title.length)}
Period: ${reportData.period}

SUMMARY:
${summarySection}

DETAILED BREAKDOWN:
${reportData.details.map(item => `• ${item.metric}: ${item.value} (${item.percentage}%)`).join('\n')}

${'='.repeat(50)}
Generated on: ${new Date().toLocaleString()}
Generated by: Mental Health Hub Reporting System
    `
    
    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded",
      description: "Report has been downloaded successfully"
    })
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
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-2">Generate comprehensive reports on your counseling practice.</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Report Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Report</CardTitle>
                <CardDescription>Configure your report parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Report Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !dateRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? format(dateRange.from, "MMM dd") : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !dateRange.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? format(dateRange.to, "MMM dd") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Client Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client (Optional)</label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="All clients" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={generateReport} 
                  className="w-full"
                  disabled={loading}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {loading ? "Generating..." : "Generate Report"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Report Results */}
          <div className="lg:col-span-2 space-y-6">
            {reportData ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{reportData.title}</CardTitle>
                        <CardDescription>{reportData.period}</CardDescription>
                      </div>
                      <Button onClick={downloadReport} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {reportData.totalSessions && (
                        <>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{reportData.totalSessions}</div>
                            <div className="text-sm text-gray-600">Total Sessions</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{reportData.completedSessions}</div>
                            <div className="text-sm text-gray-600">Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{reportData.cancelledSessions}</div>
                            <div className="text-sm text-gray-600">Cancelled</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{reportData.clientsSeen}</div>
                            <div className="text-sm text-gray-600">Clients Seen</div>
                          </div>
                        </>
                      )}
                      {reportData.totalClients && !reportData.totalScheduled && !reportData.completedTreatment && (
                        <>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{reportData.totalClients}</div>
                            <div className="text-sm text-gray-600">Total Clients</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{reportData.activeClients}</div>
                            <div className="text-sm text-gray-600">Active</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{reportData.improvedClients}</div>
                            <div className="text-sm text-gray-600">Improved</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{reportData.stableClients}</div>
                            <div className="text-sm text-gray-600">Stable</div>
                          </div>
                        </>
                      )}
                      {reportData.totalScheduled && (
                        <>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{reportData.totalScheduled}</div>
                            <div className="text-sm text-gray-600">Total Scheduled</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{reportData.totalAttended}</div>
                            <div className="text-sm text-gray-600">Attended</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{reportData.totalCancelled}</div>
                            <div className="text-sm text-gray-600">Cancelled</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{reportData.attendanceRate}</div>
                            <div className="text-sm text-gray-600">Attendance Rate</div>
                          </div>
                        </>
                      )}
                      {reportData.completedTreatment !== undefined && (
                        <>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{reportData.totalClients}</div>
                            <div className="text-sm text-gray-600">Total Clients</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{reportData.completedTreatment}</div>
                            <div className="text-sm text-gray-600">Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{reportData.ongoingTreatment}</div>
                            <div className="text-sm text-gray-600">Ongoing</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{reportData.successRate}</div>
                            <div className="text-sm text-gray-600">Success Rate</div>
                          </div>
                        </>
                      )}
                      {reportData.totalRevenue && (
                        <>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{reportData.totalRevenue}</div>
                            <div className="text-sm text-gray-600">Revenue</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{reportData.totalHours}</div>
                            <div className="text-sm text-gray-600">Hours</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{reportData.newClients}</div>
                            <div className="text-sm text-gray-600">New Clients</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{reportData.retentionRate}</div>
                            <div className="text-sm text-gray-600">Retention</div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">Detailed Breakdown</h4>
                      {reportData.details.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{item.metric}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold">{item.value}</span>
                            <Badge variant="secondary">{item.percentage}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Generated</h3>
                  <p className="text-gray-600 mb-4">Select report parameters and click "Generate Report" to view analytics.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}