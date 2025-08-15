"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Activity, TrendingUp, AlertCircle, Calendar, MessageSquare, BookOpen, Shield } from "lucide-react"

// Replace the 3D Analytics with a simpler bar chart
function AnalyticsChart({ analyticsData }: { analyticsData: Array<{ value: number; label: string; color: string }> }) {
  return (
    <div className="h-64 flex items-end justify-center space-x-4 p-4">
      {analyticsData.map((data, index) => (
        <div key={data.label} className="flex flex-col items-center space-y-2">
          <div
            className="rounded-t transition-all duration-300"
            style={{
              height: `${(data.value / 100) * 200}px`,
              width: "40px",
              backgroundColor: data.color,
            }}
          ></div>
          <span className="text-xs text-center font-medium">{data.label}</span>
          <span className="text-xs text-gray-600">{data.value}%</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAppointments: 0,
    totalResources: 0,
    totalPosts: 0,
    usersByRole: { patients: 0, psychiatrists: 0, counselors: 0 }
  })
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
      
      // Fetch recent users
      const usersResponse = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setRecentUsers(usersData.users.slice(0, 5))
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyticsData = [
    { value: 85, label: "Users", color: "#3b82f6" },
    { value: 92, label: "Sessions", color: "#10b981" },
    { value: 78, label: "Resources", color: "#f59e0b" },
    { value: 95, label: "Satisfaction", color: "#8b5cf6" },
    { value: 88, label: "Engagement", color: "#ef4444" },
  ]

  const systemAlerts = [
    {
      id: 1,
      type: "warning",
      title: "High Server Load",
      message: "Server CPU usage is at 85%. Consider scaling resources.",
      timestamp: "5 minutes ago",
    },
    {
      id: 2,
      type: "info",
      title: "Scheduled Maintenance",
      message: "System maintenance scheduled for tonight at 2:00 AM.",
      timestamp: "2 hours ago",
    },
    {
      id: 3,
      type: "success",
      title: "Backup Completed",
      message: "Daily database backup completed successfully.",
      timestamp: "6 hours ago",
    },
  ]



  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "success":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      default:
        return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "warning":
        return "border-yellow-200 bg-yellow-50"
      case "success":
        return "border-green-200 bg-green-50"
      default:
        return "border-blue-200 bg-blue-50"
    }
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">System overview and management console for MindCare Hub.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Total registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAppointments || 0}</div>
              <p className="text-xs text-muted-foreground">Total appointments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalResources || 0}</div>
              <p className="text-xs text-muted-foreground">Available resources</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts || 0}</div>
              <p className="text-xs text-muted-foreground">Community posts</p>
            </CardContent>
          </Card>
        </div>

        {/* 3D Analytics Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle>3D Analytics Overview</CardTitle>
            <CardDescription>
              Interactive 3D visualization of platform metrics. Larger cubes indicate higher values.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Replace the Canvas component usage with: */}
            <div className="h-96 w-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg overflow-hidden">
              <AnalyticsChart analyticsData={analyticsData} />
            </div>
            <div className="mt-4 grid grid-cols-5 gap-4 text-center text-sm">
              {analyticsData.map((data, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: data.color }}></div>
                  <span className="font-medium">{data.label}</span>
                  <span className="text-gray-600">{data.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Recent system notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemAlerts.map((alert) => (
                  <div key={alert.id} className={`p-4 border rounded-lg ${getAlertColor(alert.type)}`}>
                    <div className="flex items-start space-x-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{alert.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent User Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent User Registrations</CardTitle>
              <CardDescription>Latest users who joined the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || 'U'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">Joined: {user.joinDate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status}</Badge>
                        <p className="text-xs text-gray-500 mt-1">{user.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">No recent users</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Statistics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forum Posts</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847</div>
              <p className="text-xs text-muted-foreground">156 pending moderation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resources</CardTitle>
              <BookOpen className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">342</div>
              <p className="text-xs text-muted-foreground">23 added this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professionals</CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.usersByRole?.psychiatrists || 0) + (stats.usersByRole?.counselors || 0)}</div>
              <p className="text-xs text-muted-foreground">{stats.usersByRole?.psychiatrists || 0} psychiatrists, {stats.usersByRole?.counselors || 0} counselors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Activity className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.3h</div>
              <p className="text-xs text-muted-foreground">Professional response time</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">User Management</h3>
                  <p className="text-sm text-gray-600">Manage user accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Analytics</h3>
                  <p className="text-sm text-gray-600">Detailed platform metrics</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">System Health</h3>
                  <p className="text-sm text-gray-600">Monitor system status</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Alerts & Logs</h3>
                  <p className="text-sm text-gray-600">System notifications</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
