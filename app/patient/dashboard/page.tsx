"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, Heart, MessageSquare, TrendingUp, Clock, Mail } from "lucide-react"
import Link from "next/link"

export default function PatientDashboard() {
  const [user, setUser] = useState(null)
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [dashboardData, setDashboardData] = useState({
    moodData: { currentWeek: 0, lastWeek: 0, trend: "stable" },
    sessionsThisMonth: 0,
    communityPosts: 0,
    progress: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      fetchDashboardData()
    } else {
      window.location.href = "/"
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Fetch appointments
       const appointmentsResponse = await fetch('/api/appointments', {
         headers: { 'Authorization': `Bearer ${token}` }
       })
       let appointmentsData = null
       if (appointmentsResponse.ok) {
         appointmentsData = await appointmentsResponse.json()
         const upcoming = appointmentsData.appointments
           ?.filter((apt: any) => new Date(apt.appointment_date) >= new Date())
           ?.slice(0, 2)
           ?.map((apt: any) => ({
             id: apt.appointment_id,
             type: apt.type,
             provider: apt.provider_name,
             date: apt.appointment_date,
             time: apt.appointment_time,
             status: apt.status
           })) || []
         setUpcomingAppointments(upcoming)
       }

      // Fetch mood data
      const moodResponse = await fetch('/api/mood?limit=14', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (moodResponse.ok) {
        const moodData = await moodResponse.json()
        const moodEntries = Array.isArray(moodData) ? moodData : (moodData.entries || [])
        const currentWeekEntries = moodEntries.slice(0, 7)
        const lastWeekEntries = moodEntries.slice(7, 14)
        
        const currentWeekAvg = currentWeekEntries.length > 0 
          ? currentWeekEntries.reduce((sum: number, entry: any) => sum + entry.mood_score, 0) / currentWeekEntries.length
          : 0
        const lastWeekAvg = lastWeekEntries.length > 0
          ? lastWeekEntries.reduce((sum: number, entry: any) => sum + entry.mood_score, 0) / lastWeekEntries.length
          : 0
        
        const trend = currentWeekAvg > lastWeekAvg ? "improving" : currentWeekAvg < lastWeekAvg ? "declining" : "stable"
        
        setDashboardData(prev => ({
          ...prev,
          moodData: {
            currentWeek: Number(currentWeekAvg.toFixed(1)),
            lastWeek: Number(lastWeekAvg.toFixed(1)),
            trend
          }
        }))
      }

      // Fetch community posts count
      const communityResponse = await fetch('/api/community/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (communityResponse.ok) {
        const postsData = await communityResponse.json()
        const posts = Array.isArray(postsData) ? postsData : (postsData.posts || [])
        const userPosts = posts.filter((post: any) => post.user_id === JSON.parse(localStorage.getItem('user') || '{}').id)
        setDashboardData(prev => ({
          ...prev,
          communityPosts: userPosts.length
        }))
      }

      // Calculate sessions this month and progress
        const thisMonth = new Date()
        thisMonth.setDate(1)
        const sessionsThisMonth = appointmentsData?.appointments?.filter((apt: any) => 
          apt.status === 'completed' && new Date(apt.appointment_date) >= thisMonth
        )?.length || 0
      
      setDashboardData(prev => ({
        ...prev,
        sessionsThisMonth,
        progress: Math.min(sessionsThisMonth * 20, 100), // Simple progress calculation
        recentActivity: [
          { text: "Completed mood tracking for today", time: "2 hours ago", type: "mood" },
          { text: "Posted in Community Forum", time: "1 day ago", type: "community" },
          { text: "Completed counseling session", time: "3 days ago", type: "session" }
        ]
      }))

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const quickActions = [
    {
      title: "My Appointments",
      description: "View appointment status",
      icon: Calendar,
      href: "/patient/appointments",
      color: "bg-blue-500",
    },
    {
      title: "Book Counseling",
      description: "Schedule your next session",
      icon: Calendar,
      href: "/patient/booking",
      color: "bg-green-500",
    },
    {
      title: "Track Mood",
      description: "Log your current mood",
      icon: Heart,
      href: "/patient/mood-tracker",
      color: "bg-red-500",
    },
    {
      title: "Messages",
      description: "Chat with psychiatrists",
      icon: Mail,
      href: "/patient/messages",
      color: "bg-orange-500",
    },
    {
      title: "Community",
      description: "Connect with others",
      icon: MessageSquare,
      href: "/patient/community",
      color: "bg-purple-500",
    },
  ]

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name || user?.username}!</h1>
          <p className="text-gray-600 mt-2">Here's your mental health overview for today.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mood Score</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.moodData.currentWeek}/10</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.moodData.trend === "improving" ? "+" : ""}
                {(dashboardData.moodData.currentWeek - dashboardData.moodData.lastWeek).toFixed(1)} from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions This Month</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.sessionsThisMonth}</div>
              <p className="text-xs text-muted-foreground">{dashboardData.sessionsThisMonth} sessions completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community Posts</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.communityPosts}</div>
              <p className="text-xs text-muted-foreground">Total posts shared</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.progress}%</div>
              <Progress value={dashboardData.progress} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to help manage your mental health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled sessions and consultations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{appointment.type}</h4>
                      <p className="text-sm text-gray-600">{appointment.provider}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>
                          {appointment.date} at {appointment.time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {appointment.status}
                    </span>
                    <Button size="sm">Join</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'mood' ? 'bg-blue-500' :
                    activity.type === 'community' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.text}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
