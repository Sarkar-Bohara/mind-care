"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Users, Activity, Calendar, MessageSquare, BookOpen, Clock } from "lucide-react"

// Simple chart component
function MetricsChart({
  data,
  title,
}: { data: Array<{ label: string; value: number; color: string }>; title: string }) {
  const maxValue = Math.max(...data.map((d) => d.value))

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">{title}</h4>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{item.label}</span>
            <div className="flex items-center space-x-3 flex-1 max-w-xs">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color,
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium w-12 text-right">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [user, setUser] = useState(null)
  const [timeRange, setTimeRange] = useState("7d")
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        if (data.success) {
          setAnalytics(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const userGrowthData = analytics ? [
    { label: "Patients", value: analytics.usersByRole.patients, color: "#3b82f6" },
    { label: "Psychiatrists", value: analytics.usersByRole.psychiatrists, color: "#8b5cf6" },
    { label: "Counselors", value: analytics.usersByRole.counselors, color: "#10b981" },
    { label: "Admins", value: analytics.usersByRole.admins, color: "#f59e0b" },
  ] : []

  const sessionData = analytics ? [
    { label: "Individual", value: analytics.sessionsByType.individual, color: "#10b981" },
    { label: "Group Therapy", value: analytics.sessionsByType.group_therapy, color: "#8b5cf6" },
    { label: "Family", value: analytics.sessionsByType.family, color: "#f59e0b" },
    { label: "Consultation", value: analytics.sessionsByType.consultation, color: "#ef4444" },
  ] : []

  const engagementData = analytics ? [
    { label: "Forum Posts", value: analytics.totalPosts, color: "#3b82f6" },
    { label: "Resources", value: analytics.totalResources, color: "#10b981" },
    { label: "Mood Entries", value: analytics.totalMoodEntries, color: "#f59e0b" },
    { label: "Messages", value: analytics.totalMessages, color: "#8b5cf6" },
  ] : []

  const recentActivity = [
    {
      id: 1,
      type: "user_registration",
      description: "New patient registered: Ahmad Rahman",
      timestamp: "2 minutes ago",
      icon: Users,
      color: "text-blue-500",
    },
    {
      id: 2,
      type: "session_completed",
      description: "Counseling session completed by Dr. Sarah",
      timestamp: "15 minutes ago",
      icon: Calendar,
      color: "text-green-500",
    },
    {
      id: 3,
      type: "forum_post",
      description: "New forum post in Anxiety category",
      timestamp: "32 minutes ago",
      icon: MessageSquare,
      color: "text-purple-500",
    },
    {
      id: 4,
      type: "resource_upload",
      description: "New resource uploaded: Mindfulness Guide",
      timestamp: "1 hour ago",
      icon: BookOpen,
      color: "text-orange-500",
    },
  ]

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Comprehensive platform metrics and insights.</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : analytics?.totalUsers || 0}</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+12%</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : analytics?.totalAppointments || 0}</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+8%</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Engagement</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+2.1%</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.3h</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 text-green-500" />
                <span className="text-green-500">-15%</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>Breakdown by user roles</CardDescription>
            </CardHeader>
            <CardContent>
              <MetricsChart data={userGrowthData} title="" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Types</CardTitle>
              <CardDescription>Distribution of session types</CardDescription>
            </CardHeader>
            <CardContent>
              <MetricsChart data={sessionData} title="" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Engagement</CardTitle>
              <CardDescription>User activity metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <MetricsChart data={engagementData} title="" />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Real-time Activity Feed</CardTitle>
            <CardDescription>Latest platform activities and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div
                    className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ${activity.color}`}
                  >
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.type.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>Server and application metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Server Uptime</span>
                  <span className="text-sm font-medium">99.9%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="text-sm font-medium">245ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Error Rate</span>
                  <span className="text-sm font-medium">0.02%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database Performance</span>
                  <span className="text-sm font-medium">Excellent</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Satisfaction</CardTitle>
              <CardDescription>Feedback and ratings overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overall Rating</span>
                  <span className="text-sm font-medium">4.8/5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Positive Feedback</span>
                  <span className="text-sm font-medium">94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Support Tickets</span>
                  <span className="text-sm font-medium">23 open</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Resolution Time</span>
                  <span className="text-sm font-medium">4.2h avg</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
