"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { User } from "@/lib/types";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Clock,
  Edit,
  Shield,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function CounselorDashboard() {
  const [user, setUser] = useState<User>();
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [recentResources, setRecentResources] = useState<RecentResource[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData) as User);
    }
    fetchPendingPosts();
    fetchRecentResources();
  }, []);

  interface PendingPost {
    id: number;
    author: string;
    title: string;
    content: string;
    timestamp: string;
    category: string;
    flagged: boolean;
  }

  interface RecentResource {
    id: number;
    title: string;
    type: "Article" | "Video" | "Guide";
    views: number;
    likes: number;
    uploadDate: string;
  }

  // Fetch pending posts from API
  const fetchPendingPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/counselor/moderation", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Transform API data to match frontend interface
        const transformedPosts = (data.posts || []).map(
          (post: any, index: number) => ({
            id: post.post_id || post.id || Date.now() + index,
            author: post.author_name || post.author_username || "Anonymous",
            title: post.title || "Untitled",
            content: post.content || "",
            timestamp: post.created_at
              ? new Date(post.created_at).toLocaleString()
              : "Unknown",
            category: post.category || "General",
            flagged: post.status === 'flagged' || false,
          })
        );
        setPendingPosts(transformedPosts);
      } else {
        // Fallback to mock data if API fails
        setPendingPosts([
          {
            id: 1,
            author: "Anonymous User",
            title: "Struggling with anxiety at work",
            content:
              "I've been having panic attacks during meetings and I don't know how to cope...",
            timestamp: "2 hours ago",
            category: "Anxiety",
            flagged: false,
          },
          {
            id: 2,
            author: "Sarah M.",
            title: "Feeling overwhelmed as a new parent",
            content:
              "The sleepless nights and constant worry are taking a toll on my mental health...",
            timestamp: "4 hours ago",
            category: "Parenting",
            flagged: true,
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching pending posts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pending posts",
        variant: "destructive",
      });
    }
  };

  // Fetch recent resources from API
  const fetchRecentResources = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/counselor/resources", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Transform API data to match frontend interface
        const transformedResources = (data.resources || []).map(
          (resource: any, index: number) => ({
            id: resource.resource_id || resource.id || Date.now() + index,
            title: resource.title || "Untitled",
            type: resource.type ? resource.type.charAt(0).toUpperCase() + resource.type.slice(1) : "Article",
            views: resource.views || 0,
            likes: resource.likes || 0,
            downloads: resource.downloads || 0,
            uploadDate: resource.created_at
              ? new Date(resource.created_at).toLocaleDateString()
              : "Unknown",
            author: resource.author_name || "Unknown Author",
            category: resource.category || "General",
            description: resource.description || "",
            content: resource.content || "",
            status: "Published"
          })
        );
        setRecentResources(transformedResources);
      } else {
        // Fallback to mock data if API fails
        setRecentResources([
          {
            id: 1,
            title: "Managing Anxiety in the Workplace",
            type: "Article",
            views: 245,
            likes: 18,
            uploadDate: "2024-01-10",
          },
          {
            id: 2,
            title: "Mindfulness Meditation for Beginners",
            type: "Video",
            views: 189,
            likes: 24,
            uploadDate: "2024-01-08",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast({
        title: "Error",
        description: "Failed to fetch resources",
        variant: "destructive",
      });
    }
  };

  // Handle post approval
  const handleApprove = async (postId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const requestData = {
        postId,
        action: "approve",
        reason: "Approved by counselor",
      };
      console.log("Approving post with data:", requestData);

      const response = await fetch("/api/counselor/moderation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Post approved successfully",
        });
        fetchPendingPosts(); // Refresh the list
      } else {
        const errorData = await response.text();
        console.error("API Error Response:", response.status, errorData);
        throw new Error(
          `Failed to approve post: ${response.status} - ${errorData}`
        );
      }
    } catch (error) {
      console.error("Error approving post:", error);
      toast({
        title: "Error",
        description: "Failed to approve post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle post rejection
  const handleReject = async (postId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const requestData = {
        postId,
        action: "reject",
        reason: "Rejected by counselor",
      };
      console.log("Rejecting post with data:", requestData);

      const response = await fetch("/api/counselor/moderation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Post rejected successfully",
        });
        fetchPendingPosts(); // Refresh the list
      } else {
        const errorData = await response.text();
        console.error("API Error Response:", response.status, errorData);
        throw new Error(
          `Failed to reject post: ${response.status} - ${errorData}`
        );
      }
    } catch (error) {
      console.error("Error rejecting post:", error);
      toast({
        title: "Error",
        description: "Failed to reject post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle post editing
  const handleEdit = async (postId: number) => {
    const newContent = prompt("Enter new content for the post:");
    if (!newContent) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/counselor/moderation", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          postId,
          title: "Updated Post", // Add title as required by API
          content: newContent,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Post updated successfully",
        });
        fetchPendingPosts(); // Refresh the list
      } else {
        const errorData = await response.text();
        console.error("API Error Response:", response.status, errorData);
        throw new Error(
          `Failed to update post: ${response.status} - ${errorData}`
        );
      }
    } catch (error) {
      console.error("Error updating post:", error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle post deletion
  const handleDelete = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/counselor/moderation", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Post deleted successfully",
        });
        fetchPendingPosts(); // Refresh the list
      } else {
        const errorData = await response.text();
        console.error("API Error Response:", response.status, errorData);
        throw new Error(
          `Failed to delete post: ${response.status} - ${errorData}`
        );
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // @ts-ignore
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.name || "Counselor"}!
          </h1>
          <p className="text-gray-600 mt-2">
            Your counselor dashboard for community moderation and resource
            management.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Posts
              </CardTitle>
              <Shield className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                1 flagged for review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Sessions
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Resources Published
              </CardTitle>
              <BookOpen className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Community Engagement
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">Positive feedback</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Forum Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Forum Moderation Queue</CardTitle>
            <CardDescription>Posts awaiting approval or review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPosts.map((post) => (
                <div key={post.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {post.author?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {post.author || "Unknown User"}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {post.category}
                        </Badge>
                        {post.flagged && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {post.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {post.content}
                      </p>
                      <p className="text-xs text-gray-500">{post.timestamp}</p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(post.id)}
                        disabled={loading}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(post.id)}
                        disabled={loading}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(post.id)}
                        disabled={loading}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(post.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Educational Resources</CardTitle>
            <CardDescription>
              Your recently published content and its performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentResources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {resource.title}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <Badge variant="outline">{resource.type}</Badge>
                        <span>{resource.views} views</span>
                        <span>{resource.likes} likes</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {resource.uploadDate}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 bg-transparent"
                      onClick={() => {
                        toast({
                          title: "Analytics",
                          description: `Viewing analytics for: ${resource.title}`,
                        });
                      }}
                    >
                      View Analytics
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              window.location.href = "/counselor/moderation";
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Forum Moderation
                  </h3>
                  <p className="text-sm text-gray-600">
                    Review and moderate community posts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              window.location.href = "/counselor/resources";
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Resource Portal
                  </h3>
                  <p className="text-sm text-gray-600">
                    Manage educational content
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              window.location.href = "/counselor/sessions";
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Counseling Sessions
                  </h3>
                  <p className="text-sm text-gray-600">
                    Manage your client sessions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>
              Your counseling sessions for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Individual Counseling
                    </h4>
                    <p className="text-sm text-gray-600">
                      Client: Maria S. • Anxiety Management
                    </p>
                    <p className="text-xs text-gray-500">
                      Duration: 50 minutes
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">2:00 PM</p>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      toast({
                        title: "Session",
                        description: "Joining session with Maria S.",
                      });
                    }}
                  >
                    Join Session
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Group Therapy
                    </h4>
                    <p className="text-sm text-gray-600">
                      Support Group • Depression Recovery
                    </p>
                    <p className="text-xs text-gray-500">
                      Duration: 90 minutes
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">4:00 PM</p>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      toast({
                        title: "Group Session",
                        description:
                          "Joining Depression Recovery Support Group",
                      });
                    }}
                  >
                    Join Session
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
