"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Heart, Reply, Search, Plus, Users } from "lucide-react"

export default function CommunityPage() {
  const [user, setUser] = useState(null)
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "General" })
  const [showNewPost, setShowNewPost] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/community/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const formattedPosts = data.posts?.map((post: any) => ({
          id: post.post_id,
          author: post.is_anonymous ? 'Anonymous' : post.author_name,
          title: post.title,
          content: post.content,
          category: post.category,
          timestamp: new Date(post.created_at).toLocaleDateString(),
          likes: 0, // Default since we don't have likes table yet
          replies: 0, // Default since we don't have replies table yet
          liked: false
        })) || []
        setPosts(formattedPosts)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const categories = [
    "General",
    "Anxiety",
    "Depression",
    "Success Stories",
    "Parenting",
    "Work Stress",
    "Relationships",
  ]

  const handleSubmitPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert("Please fill in both title and content")
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          category: newPost.category,
          isAnonymous: false
        })
      })

      if (response.ok) {
        // Also save to localStorage for immediate display with pending status
        const post = {
          id: Date.now(),
          author: user?.name || "Anonymous",
          title: newPost.title,
          content: newPost.content,
          category: newPost.category,
          timestamp: "Just now",
          likes: 0,
          replies: 0,
          liked: false,
          status: "pending"
        }

        // Refresh posts from database
        await fetchPosts()
        setNewPost({ title: "", content: "", category: "General" })
        setShowNewPost(false)
        alert("Post submitted successfully!")
      } else {
        alert("Failed to submit post. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting post:", error)
      alert("Failed to submit post. Please try again.")
    }
  }

  const handleLike = (postId: number) => {
    // TODO: Implement like functionality with API
    const updatedPosts = posts.map((post) =>
      post.id === postId ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 } : post,
    )
    setPosts(updatedPosts)
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getCategoryColor = (category: string) => {
    const colors = {
      General: "bg-gray-100 text-gray-800",
      Anxiety: "bg-yellow-100 text-yellow-800",
      Depression: "bg-blue-100 text-blue-800",
      "Success Stories": "bg-green-100 text-green-800",
      Parenting: "bg-purple-100 text-purple-800",
      "Work Stress": "bg-red-100 text-red-800",
      Relationships: "bg-pink-100 text-pink-800",
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Community Forum</h1>
            <p className="text-gray-600 mt-2">Connect with others on their mental health journey.</p>
          </div>
          <Button onClick={() => setShowNewPost(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{posts.length}</div>
              <p className="text-xs text-muted-foreground">Community discussions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Posts</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Total contributions</p>
            </CardContent>
          </Card>
        </div>

        {/* New Post Form */}
        {showNewPost && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
              <CardDescription>Share your thoughts or ask for support from the community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="What would you like to discuss?"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Share your thoughts, experiences, or questions..."
                  rows={4}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSubmitPost}>Submit Post</Button>
                <Button variant="outline" onClick={() => setShowNewPost(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading posts...</div>
          ) : filteredPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Avatar>
                    <AvatarFallback>{post.author?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium">{post.author || 'Unknown User'}</span>
                      <Badge className={getCategoryColor(post.category)}>{post.category}</Badge>
                      <span className="text-sm text-gray-500">{post.timestamp}</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                    <p className="text-gray-700 mb-4">{post.content}</p>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id)}
                        className={post.liked ? "text-red-500" : ""}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${post.liked ? "fill-current" : ""}`} />
                        {post.likes}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Reply className="h-4 w-4 mr-1" />
                        {post.replies} Replies
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-600">Try adjusting your search or create a new post.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
