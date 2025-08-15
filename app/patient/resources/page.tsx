"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Video, FileText, Download, Search, Play, Eye, Heart } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function ResourcesPage() {
  const [user, setUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/resources", {
        headers: {
          "Content-Type": "application/json"
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Map database resources to match the expected format and ensure unique IDs
        const dbResources = (data.resources || []).map((resource: any) => ({
          id: resource.resource_id || resource.id, // Use resource_id from database
          title: resource.title,
          description: resource.description,
          type: resource.type === 'article' ? 'Article' : 
                resource.type === 'video' ? 'Video' :
                resource.type === 'guide' ? 'PDF Guide' :
                resource.type === 'audio' ? 'Audio' : 'Article',
          category: resource.category,
          duration: resource.type === 'article' ? '5 min read' : 
                   resource.type === 'video' ? '10 minutes' : 
                   resource.type === 'audio' ? '8 minutes' : '5 pages',
          author: resource.author_name || resource.author || 'Unknown Author',
          likes: resource.likes || 0,
          views: resource.views || 0,
          url: resource.url, // External URL field
          file_path: resource.file_path, // File path field
          downloadUrl: resource.url || resource.file_path || "#",
        }))
        
        // Combine with mock resources, ensuring no ID conflicts
        // Use a more robust approach to ensure unique IDs
        const adjustedMockResources = mockResources.map((resource, index) => ({
          ...resource,
          id: `mock_${resource.id}_${index}` // Use string IDs to avoid conflicts
        }))
        
        // Ensure database resources also have unique string IDs
        const uniqueDbResources = dbResources.map((resource, index) => ({
          ...resource,
          id: `db_${resource.id}_${index}` // Use string IDs with db prefix
        }))
        
        setResources([...uniqueDbResources, ...adjustedMockResources])
      } else {
        // Fallback to mock data if API fails
        setResources(mockResources)
      }
    } catch (error) {
      console.error("Error fetching resources:", error)
      // Fallback to mock data
      setResources(mockResources)
    } finally {
      setLoading(false)
    }
  }

  const handleResourceView = async (resourceId: string | number) => {
    try {
      const token = localStorage.getItem("token")
      console.log("Token from localStorage:", token ? "Found" : "Not found")
      
      if (!token) {
        alert("Please log in to view resources")
        return
      }
      
      // Extract original ID from string format if needed
      let originalId = resourceId
      if (typeof resourceId === 'string') {
        if (resourceId.startsWith('db_')) {
          originalId = parseInt(resourceId.split('_')[1])
        } else if (resourceId.startsWith('mock_')) {
          // For mock resources, we don't need to track views
          alert("Mock resources are not available for viewing")
          return
        }
      }
      
      console.log("Opening resource for viewing, ID:", originalId)
      
      // Find the resource to check if it has an external URL
      const resource = resources.find(r => r.id === resourceId)
      
      let viewUrl
      if (resource && resource.url && resource.url.trim() !== '') {
        // If resource has an external URL, open it directly
        viewUrl = resource.url
        console.log("Opening external URL:", viewUrl)
      } else if (resource && resource.file_path && resource.file_path.trim() !== '') {
        // Otherwise use the serve endpoint for uploaded files
        viewUrl = `/api/resources/serve?id=${originalId}`
        console.log("Opening via serve endpoint:", viewUrl)
      } else {
        alert("No valid URL or file path found for this resource")
        return
      }
      
      const newWindow = window.open(viewUrl, '_blank')
      
      if (!newWindow) {
        alert("Please allow popups to view resources")
        return
      }
      
      // Update the view count in the local state
      setResources(prevResources => 
        prevResources.map(resource => {
          if (resource.id === resourceId) {
            return {
              ...resource,
              views: (resource.views || 0) + 1
            }
          }
          return resource
        })
      )
      
      // Update view count in database for all resources
      try {
        await fetch("/api/resources/view", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ resourceId: originalId })
        })
      } catch (viewError) {
        console.error("Error updating view count:", viewError)
      }
      
    } catch (error) {
      console.error("Error opening resource:", error)
      alert("Failed to open resource. Please try again.")
    }
  }

  const handleResourceDownload = async (resourceId: string | number) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        alert("Please log in to download resources")
        return
      }

      // Extract original ID from string format if needed
      let originalId = resourceId
      if (typeof resourceId === 'string') {
        if (resourceId.startsWith('db_')) {
          originalId = parseInt(resourceId.split('_')[1])
        } else if (resourceId.startsWith('mock_')) {
          alert("Mock resources are not available for download")
          return
        }
      }

      const response = await fetch("/api/resources/download", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ resourceId: originalId })
      })

      if (response.ok) {
        // Get the filename from the Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition')
        let filename = 'resource.txt'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }

        // Create blob and download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        // Update download count in local state
        setResources(prevResources => 
          prevResources.map(resource => {
            if (resource.id === resourceId) {
              return {
                ...resource,
                downloads: (resource.downloads || 0) + 1
              }
            }
            return resource
          })
        )
        
        console.log(`Download completed: ${filename}`)
      } else {
        const data = await response.json()
        alert(`Download failed: ${data.error}`)
      }
    } catch (error) {
      console.error("Error downloading resource:", error)
      alert("Download failed. Please try again.")
    }
  }

  const handleResourceLike = async (resourceId: string | number) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        alert("Please log in to like resources")
        return
      }

      // Extract original ID from string format if needed
      let originalId = resourceId
      if (typeof resourceId === 'string') {
        if (resourceId.startsWith('db_')) {
          originalId = parseInt(resourceId.split('_')[1])
        } else if (resourceId.startsWith('mock_')) {
          alert("Mock resources cannot be liked")
          return
        }
      }

      console.log("Sending like request for resource ID:", originalId)
      
      const response = await fetch("/api/resources/like", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ resourceId: originalId })
      })
      
      console.log("Like response status:", response.status)

      const data = await response.json()
      console.log("Like response data:", data)
      
      if (data.success) {
        // Update the resource in the local state
        setResources(prevResources => 
          prevResources.map(resource => {
            if (resource.id === resourceId) {
              return {
                ...resource,
                likes: data.totalLikes,
                isLiked: data.isLiked
              }
            }
            return resource
          })
        )
        console.log("Like updated successfully")
      } else {
        console.error("Like error:", data)
        alert(`Like failed: ${data.error}`)
      }
    } catch (error) {
      console.error("Error liking resource:", error)
      alert("Like failed. Please try again.")
    }
  }

  const mockResources = [
    {
      id: 1,
      title: "Understanding Anxiety Disorders",
      description: "A comprehensive guide to recognizing and managing anxiety symptoms.",
      type: "Article",
      category: "Anxiety",
      duration: "10 min read",
      author: "Dr. Sarah Ahmad",
      likes: 45,
      views: 234,
      downloadUrl: "#",
    },
    {
      id: 2,
      title: "Mindfulness Meditation for Beginners",
      description: "Learn basic mindfulness techniques to reduce stress and improve mental clarity.",
      type: "Video",
      category: "Mindfulness",
      duration: "15 minutes",
      author: "Lisa Wong",
      likes: 67,
      views: 189,
      downloadUrl: "#",
    },
    {
      id: 3,
      title: "Coping with Depression: A Self-Help Guide",
      description: "Practical strategies and exercises for managing depression symptoms.",
      type: "PDF Guide",
      category: "Depression",
      duration: "25 pages",
      author: "Dr. Michael Chen",
      likes: 38,
      views: 156,
      downloadUrl: "#",
    },
    {
      id: 4,
      title: "Breathing Exercises for Panic Attacks",
      description: "Quick and effective breathing techniques to manage panic attacks.",
      type: "Audio",
      category: "Anxiety",
      duration: "8 minutes",
      author: "Fatimah Ibrahim",
      likes: 52,
      views: 198,
      downloadUrl: "#",
    },
    {
      id: 5,
      title: "Building Healthy Sleep Habits",
      description: "Evidence-based strategies for improving sleep quality and mental health.",
      type: "Article",
      category: "Wellness",
      duration: "12 min read",
      author: "Dr. Sarah Ahmad",
      likes: 29,
      views: 145,
      downloadUrl: "#",
    },
    {
      id: 6,
      title: "Workplace Stress Management",
      description: "Tools and techniques for managing stress in professional environments.",
      type: "Video",
      category: "Stress",
      duration: "20 minutes",
      author: "Lisa Wong",
      likes: 41,
      views: 167,
      downloadUrl: "#",
    },
  ]

  const categories = ["All", "Anxiety", "Depression", "Mindfulness", "Wellness", "Stress"]

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || resource.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Video":
        return <Video className="h-5 w-5" />
      case "Article":
        return <FileText className="h-5 w-5" />
      case "PDF Guide":
        return <BookOpen className="h-5 w-5" />
      case "Audio":
        return <Play className="h-5 w-5" />
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
      case "PDF Guide":
        return "bg-green-100 text-green-800"
      case "Audio":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Educational Resources</h1>
          <p className="text-gray-600 mt-2">Access helpful materials to support your mental health journey.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resources.length}</div>
              <p className="text-xs text-muted-foreground">Available materials</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Bookmarks</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Saved resources</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Eye className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Resources viewed</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex space-x-2 overflow-x-auto">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className="whitespace-nowrap"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(resource.type)}
                    <Badge className={getTypeColor(resource.type)}>{resource.type}</Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleResourceLike(resource.id)}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>By {resource.author}</span>
                    <span>{resource.duration}</span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{resource.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{resource.views}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      className="flex-1"
                      onClick={() => handleResourceView(resource.id)}
                    >
                      {resource.type === "Video" ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Watch
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleResourceDownload(resource.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
