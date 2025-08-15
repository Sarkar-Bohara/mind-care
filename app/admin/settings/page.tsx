"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Settings, Shield, Bell, Database, Users, Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function SystemSettings() {
  const [user, setUser] = useState(null)
  const [settings, setSettings] = useState({
    siteName: "MindCare Hub",
    siteDescription: "Comprehensive mental health support for Malaysia",
    maintenanceMode: false,
    userRegistration: true,
    emailNotifications: true,
    smsNotifications: false,
    dataRetention: "365",
    sessionTimeout: "30",
    maxFileSize: "10",
    allowedFileTypes: "pdf,doc,docx,jpg,png,mp4",
    backupFrequency: "daily",
    securityLevel: "high",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [backups, setBackups] = useState([])
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [systemStatus, setSystemStatus] = useState({
    database: { status: "online", color: "green" },
    emailService: { status: "active", color: "green" },
    fileStorage: { status: "available", color: "green" },
    backupService: { status: "running", color: "yellow" },
  })
  const { toast } = useToast()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    loadSettings()
    checkSystemStatus()
    loadBackups()
  }, [])

  const loadBackups = async () => {
    try {
      setLoadingBackups(true)
      const token = localStorage.getItem("token")
      
      if (!token) {
        return
      }
      
      const response = await fetch("/api/admin/backup", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups || [])
      }
    } catch (error) {
      console.error("Error loading backups:", error)
    } finally {
      setLoadingBackups(false)
    }
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      
      if (!token) {
        throw new Error("No authentication token found. Please log in again.")
      }
      
      const response = await fetch("/api/admin/settings", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.")
        }
        throw new Error(errorData.error || `Failed to load settings (${response.status})`)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load system settings. Using default values.",
        variant: "destructive",
      })
      
      // Set default settings if loading fails
      setSettings({
        siteName: "MindCare Hub",
        siteDescription: "Comprehensive mental health support for Malaysia",
        maintenanceMode: false,
        userRegistration: true,
        emailNotifications: true,
        smsNotifications: false,
        dataRetention: "365",
        sessionTimeout: "30",
        maxFileSize: "10",
        allowedFileTypes: "pdf,doc,docx,jpg,png,mp4",
        backupFrequency: "daily",
        securityLevel: "high",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkSystemStatus = async () => {
    // Simulate system status checks
    try {
      // In a real application, you would make actual health check API calls
      setSystemStatus({
        database: { status: "online", color: "green" },
        emailService: { status: "active", color: "green" },
        fileStorage: { status: "available", color: "green" },
        backupService: { status: "running", color: "yellow" },
      })
    } catch (error) {
      console.error("Error checking system status:", error)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem("token")
      
      if (!token) {
        throw new Error("No authentication token found. Please log in again.")
      }
      
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings saved successfully!",
        })
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.")
        }
        throw new Error(errorData.error || `Failed to save settings (${response.status})`)
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResetSettings = async () => {
    if (!confirm("Are you sure you want to reset all settings to default values?")) {
      return
    }

    try {
      setResetting(true)
      const token = localStorage.getItem("token")
      
      if (!token) {
        throw new Error("No authentication token found. Please log in again.")
      }
      
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        await loadSettings() // Reload settings from server
        toast({
          title: "Success",
          description: "Settings reset to default values successfully!",
        })
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.")
        }
        throw new Error(errorData.error || `Failed to reset settings (${response.status})`)
      }
    } catch (error) {
      console.error("Error resetting settings:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to reset settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setResetting(false)
    }
  }

  const handleCreateBackup = async () => {
    try {
      toast({
        title: "Backup Started",
        description: "Creating system backup... This may take a few minutes.",
      })
      
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found. Please log in again.")
      }
      
      const response = await fetch("/api/admin/backup", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: `Backup created successfully! File: ${data.filename}`,
        })
        loadBackups() // Refresh backup list
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.")
        }
        throw new Error(errorData.error || `Failed to create backup (${response.status})`)
      }
    } catch (error) {
      console.error("Error creating backup:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create backup. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRestoreBackup = async (filename) => {
    const confirmed = confirm(
      `Are you sure you want to restore from backup "${filename}"? This will overwrite all current data and cannot be undone.`
    )
    
    if (!confirmed) return
    
    try {
      toast({
        title: "Restore Started",
        description: "Restoring from backup... This may take a few minutes.",
      })
      
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found. Please log in again.")
      }
      
      const response = await fetch("/api/admin/backup", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename }),
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "System restored from backup successfully!",
        })
        // Reload settings after restore
        loadSettings()
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.")
        }
        throw new Error(errorData.error || `Failed to restore backup (${response.status})`)
      }
    } catch (error) {
      console.error("Error restoring backup:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to restore from backup. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadBackup = async (filename) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found. Please log in again.")
      }
      
      const response = await fetch(`/api/admin/backup/download?filename=${encodeURIComponent(filename)}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Success",
          description: "Backup file downloaded successfully!",
        })
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.")
        }
        throw new Error(errorData.error || `Failed to download backup (${response.status})`)
      }
    } catch (error) {
      console.error("Error downloading backup:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to download backup. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBackup = async (filename) => {
    const confirmed = confirm(
      `Are you sure you want to delete backup "${filename}"? This action cannot be undone.`
    )
    
    if (!confirmed) return
    
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found. Please log in again.")
      }
      
      const response = await fetch("/api/admin/backup", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename }),
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Backup deleted successfully!",
        })
        loadBackups() // Refresh backup list
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.")
        }
        throw new Error(errorData.error || `Failed to delete backup (${response.status})`)
      }
    } catch (error) {
      console.error("Error deleting backup:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete backup. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading system settings...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-2">Configure platform settings and preferences.</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleResetSettings}
              disabled={resetting || saving}
            >
              {resetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset to Default"
              )}
            </Button>
            <Button 
              onClick={handleSaveSettings}
              disabled={saving || resetting}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <CardTitle>General Settings</CardTitle>
            </div>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                <p className="text-sm text-gray-600">Temporarily disable access to the platform</p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <CardTitle>User Management</CardTitle>
            </div>
            <CardDescription>User registration and access controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="userRegistration">Allow User Registration</Label>
                <p className="text-sm text-gray-600">Enable new patient registrations</p>
              </div>
              <Switch
                id="userRegistration"
                checked={settings.userRegistration}
                onCheckedChange={(checked) => setSettings({ ...settings, userRegistration: checked })}
              />
            </div>
            <div>
              <Label htmlFor="dataRetention">Data Retention Period (days)</Label>
              <Select
                value={settings.dataRetention}
                onValueChange={(value) => setSettings({ ...settings, dataRetention: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="730">2 years</SelectItem>
                  <SelectItem value="1095">3 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security Settings</CardTitle>
            </div>
            <CardDescription>Platform security and privacy controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="securityLevel">Security Level</Label>
              <Select
                value={settings.securityLevel}
                onValueChange={(value) => setSettings({ ...settings, securityLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="maximum">Maximum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxFileSize">Max File Upload Size (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => setSettings({ ...settings, maxFileSize: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                <Input
                  id="allowedFileTypes"
                  value={settings.allowedFileTypes}
                  onChange={(e) => setSettings({ ...settings, allowedFileTypes: e.target.value })}
                  placeholder="pdf,doc,docx,jpg,png"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>Configure system notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-gray-600">Send email notifications to users</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <p className="text-sm text-gray-600">Send SMS notifications for urgent matters</p>
              </div>
              <Switch
                id="smsNotifications"
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <CardTitle>Backup & Recovery</CardTitle>
            </div>
            <CardDescription>Data backup and recovery settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <Select
                value={settings.backupFrequency}
                onValueChange={(value) => setSettings({ ...settings, backupFrequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={handleCreateBackup}
                disabled={saving || resetting}
              >
                <Database className="h-4 w-4 mr-2" />
                Create Backup Now
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Available Backups</h4>
              {loadingBackups ? (
                <p className="text-sm text-muted-foreground">Loading backups...</p>
              ) : backups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No backups available</p>
              ) : (
                <div className="space-y-2">
                  {backups.map((backup, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                       <div>
                         <p className="text-sm font-medium">{backup.filename}</p>
                         <p className="text-xs text-muted-foreground">
                           Created: {new Date(backup.created_at).toLocaleString()}
                         </p>
                         <p className="text-xs text-muted-foreground">
                           Size: {(backup.size / 1024 / 1024).toFixed(2)} MB
                         </p>
                       </div>
                       <div className="flex gap-2">
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => handleDownloadBackup(backup.filename)}
                         >
                           Download
                         </Button>
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => handleRestoreBackup(backup.filename)}
                         >
                           Restore
                         </Button>
                         <Button 
                           variant="destructive" 
                           size="sm"
                           onClick={() => handleDeleteBackup(backup.filename)}
                         >
                           Delete
                         </Button>
                       </div>
                     </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 bg-${systemStatus.database.color}-500 rounded-full`}></div>
                <div>
                  <p className="text-sm font-medium">Database</p>
                  <p className="text-xs text-gray-600 capitalize">{systemStatus.database.status}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 bg-${systemStatus.emailService.color}-500 rounded-full`}></div>
                <div>
                  <p className="text-sm font-medium">Email Service</p>
                  <p className="text-xs text-gray-600 capitalize">{systemStatus.emailService.status}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 bg-${systemStatus.fileStorage.color}-500 rounded-full`}></div>
                <div>
                  <p className="text-sm font-medium">File Storage</p>
                  <p className="text-xs text-gray-600 capitalize">{systemStatus.fileStorage.status}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 bg-${systemStatus.backupService.color}-500 rounded-full`}></div>
                <div>
                  <p className="text-sm font-medium">Backup Service</p>
                  <p className="text-xs text-gray-600 capitalize">{systemStatus.backupService.status}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
