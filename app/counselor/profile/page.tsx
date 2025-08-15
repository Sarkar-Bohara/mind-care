"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { User, Briefcase, Save, Loader2 } from "lucide-react"

export default function CounselorProfile() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    specialization: "",
    license_number: "",
    years_experience: "",
    education: "",
    bio: "",
    counseling_approach: "",
    available_hours: ""
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setProfile({
        full_name: parsedUser.full_name || parsedUser.name || "",
        email: parsedUser.email || "",
        phone: parsedUser.phone || "",
        specialization: parsedUser.specialization || "",
        license_number: parsedUser.license_number || "",
        years_experience: parsedUser.years_experience || "",
        education: parsedUser.education || "",
        bio: parsedUser.bio || "",
        counseling_approach: parsedUser.counseling_approach || "",
        available_hours: parsedUser.available_hours || ""
      })
    }
    setLoading(false)
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      const updatedUser = { ...user, ...profile }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      alert("Profile updated successfully!")
    } catch (error) {
      alert("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">Manage your professional information</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <CardTitle>Personal Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5" />
              <CardTitle>Professional Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={profile.specialization}
                  onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                  placeholder="e.g., Family Counseling, Addiction Recovery"
                />
              </div>
              <div>
                <Label htmlFor="license_number">License Number</Label>
                <Input
                  id="license_number"
                  value={profile.license_number}
                  onChange={(e) => setProfile({ ...profile, license_number: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Input
                id="years_experience"
                type="number"
                value={profile.years_experience}
                onChange={(e) => setProfile({ ...profile, years_experience: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="education">Education & Qualifications</Label>
              <Textarea
                id="education"
                value={profile.education}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                placeholder="List your degrees, certifications, and qualifications"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="counseling_approach">Counseling Approach</Label>
              <Textarea
                id="counseling_approach"
                value={profile.counseling_approach}
                onChange={(e) => setProfile({ ...profile, counseling_approach: e.target.value })}
                placeholder="Describe your therapeutic approach and methods"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Brief description of your experience and background"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="available_hours">Available Hours</Label>
              <Input
                id="available_hours"
                value={profile.available_hours}
                onChange={(e) => setProfile({ ...profile, available_hours: e.target.value })}
                placeholder="e.g., Mon-Fri 9AM-5PM, Sat 9AM-1PM"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}