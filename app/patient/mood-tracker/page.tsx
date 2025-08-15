"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Heart, TrendingUp, Calendar } from "lucide-react"

// Simple 2D Chart instead of 3D for better compatibility
function MoodChart({ moodHistory }: { moodHistory: Array<{ date: string; mood: number }> }) {
  return (
    <div className="h-64 flex items-end justify-between space-x-2 p-4">
      {moodHistory.map((entry, index) => (
        <div key={entry.date} className="flex flex-col items-center space-y-2">
          <div
            className={`rounded-t transition-all duration-300 ${
              entry.mood <= 3
                ? "bg-red-500"
                : entry.mood <= 5
                  ? "bg-orange-500"
                  : entry.mood <= 7
                    ? "bg-yellow-500"
                    : "bg-green-500"
            }`}
            style={{
              height: `${(entry.mood / 10) * 200}px`,
              width: "30px",
            }}
          ></div>
          <span className="text-xs text-gray-600">Day {index + 1}</span>
          <span className="text-xs font-medium">{entry.mood}</span>
        </div>
      ))}
    </div>
  )
}

export default function MoodTracker() {
  const [user, setUser] = useState(null)
  const [currentMood, setCurrentMood] = useState(5)
  const [moodNote, setMoodNote] = useState("")
  const [moodHistory, setMoodHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
      fetchMoodHistory()
    }
  }, [])

  const fetchMoodHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/mood', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const formattedHistory = data.entries?.map((entry: any) => ({
          date: entry.entry_date,
          mood: entry.mood_score,
          note: entry.notes
        })) || []
        setMoodHistory(formattedHistory)
      }
    } catch (error) {
      console.error('Failed to fetch mood history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMoodSubmit = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const today = new Date().toISOString().split('T')[0]
      
      const response = await fetch('/api/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          moodScore: currentMood,
          notes: moodNote,
          entryDate: today
        })
      })

      if (response.ok) {
        // Refresh mood history
        await fetchMoodHistory()
        setMoodNote("")
        alert("Mood logged successfully!")
      } else {
        alert("Failed to log mood. Please try again.")
      }
    } catch (error) {
      console.error('Failed to submit mood:', error)
      alert("Failed to log mood. Please try again.")
    }
  }

  const averageMood = moodHistory.length > 0 ? moodHistory.reduce((sum, entry) => sum + entry.mood, 0) / moodHistory.length : 0

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mood Tracker</h1>
          <p className="text-gray-600 mt-2">Track and visualize your emotional journey over time.</p>
        </div>

        {/* Mood Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Mood</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMood}/10</div>
              <p className="text-xs text-muted-foreground">Current selection</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Average</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageMood.toFixed(1)}/10</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tracking Streak</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">Days in a row</p>
            </CardContent>
          </Card>
        </div>

        {/* Mood Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Mood Visualization</CardTitle>
            <CardDescription>Your mood over the past week. Each bar represents a day.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg overflow-hidden">
              <MoodChart moodHistory={moodHistory} />
            </div>
            <div className="mt-4 flex justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span>Low (1-3)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span>Fair (4-5)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span>Good (6-7)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>Great (8-10)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mood Input */}
        <Card>
          <CardHeader>
            <CardTitle>Log Today's Mood</CardTitle>
            <CardDescription>Rate your current mood and add any notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium">How are you feeling today?</Label>
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Very Low</span>
                  <span className="text-sm text-gray-500">Excellent</span>
                </div>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((mood) => (
                    <button
                      key={mood}
                      onClick={() => setCurrentMood(mood)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        currentMood === mood
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-gray-300 hover:border-blue-300"
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="mood-note">Notes (Optional)</Label>
              <Textarea
                id="mood-note"
                placeholder="What's influencing your mood today? Any thoughts or feelings you'd like to record..."
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>

            <Button onClick={handleMoodSubmit} className="w-full">
              Log Mood
            </Button>
          </CardContent>
        </Card>

        {/* Mood History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Mood History</CardTitle>
            <CardDescription>Your mood entries from the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {moodHistory
                .slice(-7)
                .reverse()
                .map((entry, index) => (
                  <div key={entry.date} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          entry.mood <= 3
                            ? "bg-red-500"
                            : entry.mood <= 5
                              ? "bg-orange-500"
                              : entry.mood <= 7
                                ? "bg-yellow-500"
                                : "bg-green-500"
                        }`}
                      ></div>
                      <span className="font-medium">{entry.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">{entry.mood}</span>
                      <span className="text-gray-500">/10</span>
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
