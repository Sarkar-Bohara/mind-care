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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle,
  Edit,
  Flag,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Post, User } from "../../../lib/types";
import { toast } from "@/hooks/use-toast";

export default function ModerationPage() {
  const [user, setUser] = useState<User>();
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData) as User);
    }

    fetchPendingPosts();
  }, []);

  const fetchPendingPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/counselor/moderation", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Transform API data to match frontend Post interface
        const transformedPosts = (data.posts || []).map((post: any) => ({
          id: post.post_id,
          author: post.author_name || post.author_username || 'Unknown User',
          title: post.title,
          content: post.content,
          timestamp: new Date(post.created_at).toLocaleDateString(),
          category: post.category,
          status: post.status,
          flagged: Math.random() > 0.8, // Random flagging for demo
          likes: 0,
          replies: 0
        }));
        setPendingPosts(transformedPosts);
      } else {
        // Fallback to localStorage
        const communityPosts: Post[] = JSON.parse(
          localStorage.getItem("communityPosts") || "[]"
        );
        const postsNeedingModeration = communityPosts
          .filter((post) => post.status === "pending")
          .map((post, index) => ({
            ...post,
            id: post.id || Date.now() + index, // Ensure unique IDs
            flagged: Math.random() > 0.8,
          }));
        setPendingPosts(postsNeedingModeration);
      }
    } catch (error) {
      console.error("Error fetching pending posts:", error);
      // Fallback to localStorage
      const communityPosts: Post[] = JSON.parse(
        localStorage.getItem("communityPosts") || "[]"
      );
      const postsNeedingModeration = communityPosts
        .filter((post) => post.status === "pending")
        .map((post, index) => ({
          ...post,
          id: post.id || Date.now() + index, // Ensure unique IDs
          flagged: Math.random() > 0.8,
        }));
      setPendingPosts(postsNeedingModeration);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId: number) => {
    try {
      setLoading(true);
      console.log('Approving post with ID:', postId);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/counselor/moderation", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          postId,
          action: "approve",
          reason: "Approved by counselor"
        })
      });
      
      if (response.ok) {
        // Remove from pending posts
        const updatedPosts = pendingPosts.filter((post) => post.id !== postId);
        setPendingPosts(updatedPosts);
        
        // Always update localStorage for consistency
        const communityPosts: Post[] = JSON.parse(
          localStorage.getItem("communityPosts") || "[]"
        );
        const updatedCommunityPosts = communityPosts.map((post) =>
          post.id === postId
            ? { ...post, status: "approved" as const, moderatedBy: user?.name }
            : post
        );
        localStorage.setItem(
          "communityPosts",
          JSON.stringify(updatedCommunityPosts)
        );
        
        toast({
          title: "Success",
          description: "Post approved successfully"
        });
      } else {
        console.log('API approve failed with status:', response.status);
        const errorData = await response.text();
        console.log('API error response:', errorData);
        // Fallback to localStorage - ensure persistence
        const updatedPosts = pendingPosts.filter((post) => post.id !== postId);
        setPendingPosts(updatedPosts);
        
        // Update localStorage to persist the change
        const communityPosts: Post[] = JSON.parse(
          localStorage.getItem("communityPosts") || "[]"
        );
        const updatedCommunityPosts = communityPosts.map((post) =>
          post.id === postId
            ? { ...post, status: "approved" as const, moderatedBy: user?.name }
            : post
        );
        localStorage.setItem(
          "communityPosts",
          JSON.stringify(updatedCommunityPosts)
        );
        
        // Also update the moderated posts list for persistence
        const moderatedPosts = JSON.parse(
          localStorage.getItem("moderatedPosts") || "[]"
        );
        const approvedPost = pendingPosts.find(p => p.id === postId);
        if (approvedPost) {
          moderatedPosts.push({ ...approvedPost, status: "approved", moderatedBy: user?.name });
          localStorage.setItem("moderatedPosts", JSON.stringify(moderatedPosts));
        }
        
        toast({
          title: "Post approved locally",
          description: "Post approved and saved locally"
        });
      }
    } catch (error) {
      console.error("Error approving post:", error);
      toast({
        title: "Error",
        description: "Failed to approve post",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (postId: number) => {
    try {
      setLoading(true);
      console.log('Rejecting post with ID:', postId);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/counselor/moderation", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          postId,
          action: "reject",
          reason: "Rejected by counselor"
        })
      });
      
      if (response.ok) {
        // Remove from pending posts
        const updatedPosts = pendingPosts.filter((post) => post.id !== postId);
        setPendingPosts(updatedPosts);
        
        // Always update localStorage for consistency
        const communityPosts: Post[] = JSON.parse(
          localStorage.getItem("communityPosts") || "[]"
        );
        const updatedCommunityPosts = communityPosts.map((post) =>
          post.id === postId
            ? { ...post, status: "rejected" as const, moderatedBy: user?.name }
            : post
        );
        localStorage.setItem(
          "communityPosts",
          JSON.stringify(updatedCommunityPosts)
        );
        
        toast({
          title: "Success",
          description: "Post rejected successfully"
        });
      } else {
        console.log('API reject failed with status:', response.status);
        const errorData = await response.text();
        console.log('API error response:', errorData);
        // Fallback to localStorage - ensure persistence
        const updatedPosts = pendingPosts.filter((post) => post.id !== postId);
        setPendingPosts(updatedPosts);
        
        // Update localStorage to persist the change
        const communityPosts: Post[] = JSON.parse(
          localStorage.getItem("communityPosts") || "[]"
        );
        const updatedCommunityPosts = communityPosts.map((post) =>
          post.id === postId
            ? { ...post, status: "rejected" as const, moderatedBy: user?.name }
            : post
        );
        localStorage.setItem(
          "communityPosts",
          JSON.stringify(updatedCommunityPosts)
        );
        
        // Also update the moderated posts list for persistence
        const moderatedPosts = JSON.parse(
          localStorage.getItem("moderatedPosts") || "[]"
        );
        const rejectedPost = pendingPosts.find(p => p.id === postId);
        if (rejectedPost) {
          moderatedPosts.push({ ...rejectedPost, status: "rejected", moderatedBy: user?.name });
          localStorage.setItem("moderatedPosts", JSON.stringify(moderatedPosts));
        }
        
        toast({
          title: "Post rejected locally",
          description: "Post rejected and saved locally"
        });
      }
    } catch (error) {
      console.error("Error rejecting post:", error);
      toast({
        title: "Error",
        description: "Failed to reject post",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post.id);
    setEditContent(post.content);
  };

  const handleSaveEdit = async (postId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/counselor/moderation", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          postId,
          content: editContent
        })
      });
      
      if (response.ok) {
        const updatedPendingPosts = pendingPosts.map((post) =>
          post.id === postId
            ? { ...post, content: editContent, edited: true }
            : post
        );
        setPendingPosts(updatedPendingPosts);
        setEditingPost(null);
        setEditContent("");
        toast({
          title: "Success",
          description: "Post updated successfully"
        });
      } else {
        // Fallback to localStorage
        const updatedPendingPosts = pendingPosts.map((post) =>
          post.id === postId
            ? { ...post, content: editContent, edited: true }
            : post
        );
        setPendingPosts(updatedPendingPosts);
        const communityPosts: Post[] = JSON.parse(
          localStorage.getItem("communityPosts") || "[]"
        );
        const updatedCommunityPosts = communityPosts.map((post) =>
          post.id === postId
            ? { ...post, content: editContent, edited: true, editedBy: user?.name }
            : post
        );
        localStorage.setItem(
          "communityPosts",
          JSON.stringify(updatedCommunityPosts)
        );
        setEditingPost(null);
        setEditContent("");
        toast({
          title: "Post updated locally",
          description: "Post updated and saved locally"
        });
      }
    } catch (error) {
      console.error("Error updating post:", error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      General: "bg-gray-100 text-gray-800",
      Anxiety: "bg-yellow-100 text-yellow-800",
      Depression: "bg-blue-100 text-blue-800",
      "Success Stories": "bg-green-100 text-green-800",
      Parenting: "bg-purple-100 text-purple-800",
      "Work Stress": "bg-red-100 text-red-800",
      Relationships: "bg-pink-100 text-pink-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    // @ts-ignore
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Forum Moderation</h1>
          <p className="text-gray-600 mt-2">
            Review and moderate community posts to ensure a safe environment.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Review
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPosts.length}</div>
              <p className="text-xs text-muted-foreground">
                Posts awaiting moderation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Approved Today
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Posts approved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Flagged Posts
              </CardTitle>
              <Flag className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Posts Pending Moderation</CardTitle>
            <CardDescription>
              Review posts before they appear in the community forum
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingPosts.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No posts pending review
                </h3>
                <p className="text-gray-600">
                  All community posts have been moderated.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* @ts-ignore */}
                {pendingPosts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {post.author?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{post.author || 'Unknown User'}</span>
                            <Badge className={getCategoryColor(post.category)}>
                              {post.category}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {post.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                      {post.flagged && (
                        <Badge variant="destructive" className="text-xs">
                          <Flag className="h-3 w-3 mr-1" />
                          Flagged
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg mb-3">{post.title}</h3>

                    {editingPost === post.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={4}
                          className="w-full"
                        />
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleSaveEdit(post.id)}
                            size="sm"
                          >
                            Save Changes
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingPost(null)}
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 mb-4">{post.content}</p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.likes || 0} likes</span>
                        <span>•</span>
                        <span>{post.replies || 0} replies</span>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(post)}
                          disabled={editingPost === post.id}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(post.id)}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(post.id)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Moderation Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Moderation Guidelines</CardTitle>
            <CardDescription>
              Key principles for reviewing community content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">
                  ✅ Approve posts that:
                </h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Share personal experiences constructively</li>
                  <li>• Ask for support or advice</li>
                  <li>• Provide helpful resources or tips</li>
                  <li>• Show empathy and understanding</li>
                  <li>• Follow community guidelines</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-700 mb-2">
                  ❌ Reject posts that:
                </h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Contain harmful or triggering content</li>
                  <li>• Include personal medical advice</li>
                  <li>• Violate privacy or confidentiality</li>
                  <li>• Contain spam or promotional content</li>
                  <li>• Use inappropriate language</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
