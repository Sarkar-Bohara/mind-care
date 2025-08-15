"use client";
import DashboardLayout, { User } from "@/components/layout/dashboard-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

export default function AdminProfile() {
  const [user, setUser] = useState<User>({
    id: 0,
    name: "",
    email: "",
    role: "Admin",
    avatar: "/placeholder-user.jpg",
    status: "Active",
    joinDate: "",
    lastLogin: "",
    sessionsCount: 0,
    verified: false,
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        ...parsedUser,
        name: parsedUser.name || "",
        email: parsedUser.email || "",
        role: parsedUser.role as User['role'],
        status: parsedUser.status as User['status'],
      });
    }
  }, []);

  const handleProfileSave = () => {
    localStorage.setItem("user", JSON.stringify(user));
    alert("Profile updated successfully!");
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      alert("New passwords do not match.");
      return;
    }

    if (!currentPassword) {
      alert("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        alert(data.message || "Failed to change password. Please try again.");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">
              Manage your personal information and account settings.
            </p>
          </div>
          <Button onClick={handleProfileSave}>Save Profile</Button>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar} alt="User Avatar" />
                <AvatarFallback>
                  {user.name?.charAt(0)?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={user.name || ""}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ""}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={user.role} disabled />
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleChangePassword}>Change Password</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
