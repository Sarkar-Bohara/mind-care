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
import { useToast } from "@/components/ui/use-toast"
import { BookOpen, Upload, FileText, Video, Download, Eye, Plus, Edit, Trash2 } from "lucide-react"

export default function ResourcePortal() {
  const { toast } = useToast()
  const [user, setUser] = useState(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [resources, setResources] = useState([])
  // @ts-ignore
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    type: "Article",
    category: "General",
    content: "",
    url: "",
    file: null as File | null,
  })
  const [editingResource, setEditingResource] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Load resources from API or fallback to localStorage/mock data
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/counselor/resources", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Map database resources to ensure consistent ID field and avoid conflicts
        const dbResources = (data.resources || []).map((resource: any, index: number) => ({
          ...resource,
          id: resource.resource_id || resource.id,
          uploadDate: resource.created_at ? new Date(resource.created_at).toISOString().split('T')[0] : resource.uploadDate,
          author: resource.author_name || resource.author || 'Unknown Author',
          type: resource.type ? resource.type.charAt(0).toUpperCase() + resource.type.slice(1) : "Article",
          views: resource.views || 0,
          downloads: resource.downloads || 0,
          likes: resource.likes || 0,
          status: resource.is_published ? "Published" : "Draft"
        }))
        setResources(dbResources)
      } else {
        // Fallback to localStorage or mock data
        const savedResources = localStorage.getItem("counselorResources")
        if (savedResources) {
          setResources(JSON.parse(savedResources))
        } else {
          const defaultResources = [
            {
              id: 1,
              title: "Understanding Anxiety Disorders",
              description: "A comprehensive guide to recognizing and managing anxiety symptoms.",
              type: "Article",
              category: "Anxiety",
              author: "Counselor",
              uploadDate: "2024-01-10",
              views: 234,
              downloads: 45,
              status: "Published",
            },
            {
              id: 2,
              title: "Mindfulness Meditation Techniques",
              description: "Step-by-step guide to mindfulness practices for stress reduction.",
              type: "Video",
              category: "Mindfulness",
              author: "Counselor",
              uploadDate: "2024-01-08",
              views: 189,
              downloads: 67,
              status: "Published",
            },
          ]
          setResources(defaultResources)
          localStorage.setItem("counselorResources", JSON.stringify(defaultResources))
        }
      }
    } catch (error) {
      console.error("Error fetching resources:", error)
      // Fallback to localStorage or mock data
      const savedResources = localStorage.getItem("counselorResources")
      if (savedResources) {
        setResources(JSON.parse(savedResources))
      } else {
        const defaultResources = [
          {
            id: 1,
            title: "Understanding Anxiety Disorders",
            description: "A comprehensive guide to recognizing and managing anxiety symptoms.",
            type: "Article",
            category: "Anxiety",
            author: "Counselor",
            uploadDate: "2024-01-10",
            views: 234,
            downloads: 45,
            status: "Published",
          },
          {
            id: 2,
            title: "Mindfulness Meditation Techniques",
            description: "Step-by-step guide to mindfulness practices for stress reduction.",
            type: "Video",
            category: "Mindfulness",
            author: "Counselor",
            uploadDate: "2024-01-08",
            views: 189,
            downloads: 67,
            status: "Published",
          },
        ]
        setResources(defaultResources)
        localStorage.setItem("counselorResources", JSON.stringify(defaultResources))
      }
    }
  }

  const handleUpload = async () => {
    if (!newResource.title.trim() || !newResource.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const token = localStorage.getItem("token")
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('title', newResource.title)
      formData.append('description', newResource.description)
      formData.append('type', newResource.type)
      formData.append('category', newResource.category)
      formData.append('content', newResource.content)
      formData.append('url', newResource.url)
      
      // Add file if selected
      if (newResource.file) {
        formData.append('file', newResource.file)
      }
      
      const response = await fetch("/api/counselor/resources", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        // Map the new resource to ensure consistent ID field
        const newResource = {
          ...data.resource,
          id: data.resource.resource_id || data.resource.id,
          uploadDate: data.resource.created_at ? new Date(data.resource.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          author: data.resource.author_name || user?.name || 'Unknown Author'
        }
        setResources([newResource, ...resources])
        toast({
          title: "Success",
          description: "Resource uploaded successfully"
        })
      } else {
        // Fallback to localStorage
        const resource = {
          id: Date.now(),
          title: newResource.title,
          description: newResource.description,
          type: newResource.type,
          category: newResource.category,
          content: newResource.content,
          author: user?.name || "Counselor",
          uploadDate: new Date().toISOString().split("T")[0],
          views: 0,
          downloads: 0,
          status: "Published",
          fileName: newResource.file?.name || null,
        }
        
        const updatedResources = [resource, ...resources]
        setResources(updatedResources)
        localStorage.setItem("counselorResources", JSON.stringify(updatedResources))
        
        toast({
          title: "Resource saved locally",
          description: "Resource uploaded and saved locally"
        })
      }
      
      // Reset form
      // @ts-ignore
      setNewResource({
        title: "",
        description: "",
        type: "Article",
        category: "General",
        content: "",
        url: "",
        file: null,
      })
      setShowUploadForm(false)
      setEditingResource(null)
    } catch (error) {
      console.error("Error uploading resource:", error)
      toast({
        title: "Error",
        description: "Failed to upload resource",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (resourceId: number) => {
    if (!confirm("Are you sure you want to delete this resource?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      // Find the resource to get the correct database ID
      const resourceToDelete = resources.find((r: any) => r.id === resourceId)
      const dbResourceId = resourceToDelete?.resource_id || resourceId
      
      const response = await fetch(`/api/counselor/resources?resourceId=${dbResourceId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
      
      if (response.ok) {
        const updatedResources = resources.filter((r: any) => r.id !== resourceId)
        setResources(updatedResources)
        toast({
          title: "Success",
          description: "Resource deleted successfully"
        })
      } else {
        // Fallback to localStorage
        const updatedResources = resources.filter((r: any) => r.id !== resourceId)
        setResources(updatedResources)
        localStorage.setItem("counselorResources", JSON.stringify(updatedResources))
        toast({
          title: "Resource deleted locally",
          description: "Resource deleted and saved locally"
        })
      }
    } catch (error) {
      console.error("Error deleting resource:", error)
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (resource: any) => {
    setEditingResource(resource)
    setNewResource({
      title: resource.title,
      description: resource.description,
      type: resource.type,
      category: resource.category,
      content: resource.content,
      url: resource.url || "",
      file: null,
    })
    setShowUploadForm(true)
  }

  const handleUpdate = async () => {
    if (!editingResource || !newResource.title.trim() || !newResource.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/counselor/resources", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          resourceId: editingResource.resource_id || editingResource.id,
          title: newResource.title,
          description: newResource.description,
          type: newResource.type,
          category: newResource.category,
          content: newResource.content,
          fileUrl: newResource.url
        })
      })
      
      if (response.ok) {
        const updatedResources = resources.map((r: any) => 
          r.id === editingResource.id 
            ? {
                ...r,
                title: newResource.title,
                description: newResource.description,
                type: newResource.type,
                category: newResource.category,
                content: newResource.content,
                fileName: newResource.file?.name || r.fileName,
              }
            : r
        )
        
        setResources(updatedResources)
        toast({
          title: "Success",
          description: "Resource updated successfully"
        })
      } else {
        // Fallback to localStorage
        const updatedResources = resources.map((r: any) => 
          r.id === editingResource.id 
            ? {
                ...r,
                title: newResource.title,
                description: newResource.description,
                type: newResource.type,
                category: newResource.category,
                content: newResource.content,
                fileName: newResource.file?.name || r.fileName,
              }
            : r
        )
        
        setResources(updatedResources)
        localStorage.setItem("counselorResources", JSON.stringify(updatedResources))
        
        toast({
          title: "Resource updated locally",
          description: "Resource updated and saved locally"
        })
      }
      
      // Reset form
      // @ts-ignore
      setNewResource({
        title: "",
        description: "",
        type: "Article",
        category: "General",
        content: "",
        url: "",
        file: null,
      })
      setEditingResource(null)
      setShowUploadForm(false)
    } catch (error) {
      console.error("Error updating resource:", error)
      toast({
        title: "Error",
        description: "Failed to update resource",
        variant: "destructive"
      })
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Video":
        return <Video className="h-5 w-5" />
      case "Article":
        return <FileText className="h-5 w-5" />
      case "PDF":
        return <BookOpen className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Video":
        return "bg-red-100 text-red-800"
      case "Article":
        return "bg-blue-100 text-blue-800"
      case "PDF":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const categories = ["General", "Anxiety", "Depression", "Mindfulness", "Stress", "Relationships", "Parenting"]
  const resourceTypes = ["Article", "Video", "PDF", "Audio", "Worksheet"]

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resource Portal</h1>
            <p className="text-gray-600 mt-2">Create and manage educational content for the community.</p>
          </div>
          <Button onClick={() => setShowUploadForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Resource
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resources.length}</div>
              <p className="text-xs text-muted-foreground">Published content</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resources.reduce((sum: number, r: any) => sum + (r.views || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all resources</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
              <Download className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resources.reduce((sum: number, r: any) => sum + (r.downloads || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total downloads</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Upload className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  resources.filter((r: any) => {
                    const uploadDate = new Date(r.uploadDate)
                    const now = new Date()
                    return uploadDate.getMonth() === now.getMonth() && uploadDate.getFullYear() === now.getFullYear()
                  }).length
                }
              </div>
              <p className="text-xs text-muted-foreground">New uploads</p>
            </CardContent>
          </Card>
        </div>

        {/* Upload/Edit Form */}
        {showUploadForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingResource ? 'Edit Resource' : 'Upload New Resource'}</CardTitle>
              <CardDescription>
                {editingResource ? 'Update your educational content' : 'Share educational content with the community'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newResource.title}
                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                    placeholder="Resource title"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newResource.type}
                    onValueChange={(value) => setNewResource({ ...newResource, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newResource.category}
                  onValueChange={(value) => setNewResource({ ...newResource, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newResource.description}
                  onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                  placeholder="Brief description of the resource"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newResource.content}
                  onChange={(e) => setNewResource({ ...newResource, content: e.target.value })}
                  placeholder="Main content or article text"
                  rows={6}
                />
              </div>

              <div>
                <Label htmlFor="url">External URL (Optional)</Label>
                <Input
                  id="url"
                  type="url"
                  value={newResource.url}
                  onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                  placeholder="https://example.com/article"
                />
                <p className="text-sm text-gray-500 mt-1">Add an external link for patients to view the resource directly</p>
              </div>

              <div>
                <Label htmlFor="file">File Upload (Optional)</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setNewResource({ ...newResource, file: e.target.files?.[0] || null })}
                  accept=".pdf,.doc,.docx,.mp4,.mp3,.jpg,.png"
                />
                <p className="text-sm text-gray-500 mt-1">Upload a file OR provide an external URL above</p>
              </div>

              <div className="flex space-x-2">
                <Button onClick={editingResource ? handleUpdate : handleUpload}>
                  {editingResource ? 'Update Resource' : 'Upload Resource'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowUploadForm(false)
                  setEditingResource(null)
                  setNewResource({
                    title: "",
                    description: "",
                    type: "Article",
                    category: "General",
                    content: "",
                    url: "",
                    file: null,
                  })
                }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resources List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Resources</CardTitle>
            <CardDescription>Manage your published educational content</CardDescription>
          </CardHeader>
          <CardContent>
            {resources.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
                <p className="text-gray-600">Upload your first educational resource to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {resources.map((resource: any) => (
                  <div key={resource.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getTypeIcon(resource.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-lg">{resource.title}</h3>
                            <Badge className={getTypeColor(resource.type)}>{resource.type}</Badge>
                            <Badge variant="outline">{resource.category}</Badge>
                          </div>
                          <p className="text-gray-600 mb-2">{resource.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Uploaded: {resource.uploadDate}</span>
                            <span>•</span>
                            <span>{resource.views} views</span>
                            <span>•</span>
                            <span>{resource.downloads} downloads</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(resource)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(resource.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
