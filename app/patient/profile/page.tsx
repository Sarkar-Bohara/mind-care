"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Edit, Mail, Phone, Save, User, X, Lock, Download, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function PatientProfile() {
  const [user, setUser] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchPatientProfile();
    }
  }, []);

  const fetchPatientProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await fetch("/api/patients/profile", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatientData(data.patient);
        setEditData({
          name: data.patient.name,
          email: data.patient.email,
          phone: data.patient.phone || "",
          dateOfBirth: data.patient.dateOfBirth || "",
        });
      } else {
        console.error("Failed to fetch patient profile:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching patient profile:", error);
    }
  };

  const handleSave = async () => {
    if (!patientData) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required");
        return;
      }

      const response = await fetch("/api/patients/profile", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        const data = await response.json();
        setPatientData(data.patient);
        
        // Update current user data in localStorage
        const updatedUser = { ...user, name: data.patient.name, email: data.patient.email };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        setIsEditing(false);
        alert("Profile updated successfully!");
      } else {
        const errorData = await response.json();
        alert(`Failed to update profile: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An error occurred while updating your profile");
    }
  };

  const handleCancel = () => {
    setEditData({
      name: patientData?.name || "",
      email: patientData?.email || "",
      phone: patientData?.phone || "",
      dateOfBirth: patientData?.dateOfBirth || "",
    });
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert("Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("New password must be at least 6 characters long");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required");
        return;
      }

      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        alert("Password changed successfully!");
        setShowPasswordDialog(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const errorData = await response.json();
        alert(`Failed to change password: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert("An error occurred while changing your password");
    }
  };

  const handleDownloadData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required");
        return;
      }

      const response = await fetch("/api/patients/export-data", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patient-data-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert("Your data has been downloaded successfully!");
      } else {
        const errorData = await response.json();
        alert(`Failed to download data: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error downloading data:", error);
      alert("An error occurred while downloading your data");
    }
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data."
    );
    
    if (confirmed) {
      const doubleConfirmed = window.confirm(
        "This is your final warning. Deleting your account will permanently remove all your medical records, appointments, and personal data. Type 'DELETE' in the next prompt to confirm."
      );
      
      if (doubleConfirmed) {
        const deleteConfirmation = prompt("Please type 'DELETE' to confirm account deletion:");
        
        if (deleteConfirmation === 'DELETE') {
          performAccountDeletion();
        } else {
          alert("Account deletion cancelled. You must type 'DELETE' exactly to confirm.");
        }
      }
    }
  };

  const performAccountDeletion = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required");
        return;
      }

      const response = await fetch("/api/patients/delete-account", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        alert("Your account has been successfully deleted. You will now be logged out.");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/";
      } else {
        const errorData = await response.json();
        alert(`Failed to delete account: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("An error occurred while deleting your account");
    }
  };

  if (!patientData) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <p>Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">
            Manage your personal information and account settings.
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="text-lg">
                    {patientData.name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{patientData.name}</CardTitle>
                  <CardDescription className="text-lg">
                    @{patientData.username}
                  </CardDescription>
                  <Badge className="mt-2 bg-blue-100 text-blue-800">
                    Patient
                  </Badge>
                </div>
              </div>
              <div className="flex space-x-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Full Name</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-gray-900">{patientData.name}</p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="email"
                    className="flex items-center space-x-2"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Email Address</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editData.email}
                      onChange={(e) =>
                        setEditData({ ...editData, email: e.target.value })
                      }
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-gray-900">{patientData.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="phone"
                    className="flex items-center space-x-2"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Phone Number</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={editData.phone}
                      onChange={(e) =>
                        setEditData({ ...editData, phone: e.target.value })
                      }
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-gray-900">{patientData.phone}</p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="dateOfBirth"
                    className="flex items-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Date of Birth</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={editData.dateOfBirth}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-gray-900">
                      {patientData.dateOfBirth ? new Date(patientData.dateOfBirth).toLocaleDateString() : "Not provided"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details and registration information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Username
                </Label>
                <p className="text-sm mt-1 font-mono bg-gray-100 px-3 py-2 rounded">
                  {patientData.username}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Registration Date
                </Label>
                <p className="text-sm mt-1">
                  {patientData.registrationDate ? new Date(patientData.registrationDate).toLocaleDateString() : "Not available"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Account Type
                </Label>
                <p className="text-sm mt-1">Patient Account</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Account Status
                </Label>
                <Badge className="mt-1 bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>
              Manage your account security and privacy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                onClick={() => setShowPasswordDialog(true)}
                className="w-full sm:w-auto"
              >
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDownloadData}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Download My Data
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                className="w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>

            {/* Password Change Dialog */}
            {showPasswordDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-6">
                    <Button onClick={handleChangePassword} className="flex-1">
                      Change Password
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowPasswordDialog(false);
                        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
