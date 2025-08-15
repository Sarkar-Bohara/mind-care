"use client";

import DashboardLayout, { User } from "@/components/layout/dashboard-layout";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Edit,
  MoreHorizontal,
  Search,
  Shield,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";



export default function UserManagement() {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "Patient" as User['role'],
    status: "Pending" as User['status']
  });

  const [users, setUsers] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        ...parsedUser,
        role: parsedUser.role as User['role'],
        status: parsedUser.status as User['status'],
      });
    } else {
      setUser(undefined);
    }

    // Load users from API or localStorage
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
          localStorage.setItem('managedUsers', JSON.stringify(data.users));
        } else {
          // Fallback to localStorage if API fails
          const savedUsers = localStorage.getItem("managedUsers");
          if (savedUsers) {
            setUsers(JSON.parse(savedUsers));
          }
        }
      } catch (error) {
        console.error('Error loading users:', error);
        // Fallback to localStorage if API fails
        const savedUsers = localStorage.getItem("managedUsers");
        if (savedUsers) {
          setUsers(JSON.parse(savedUsers));
        }
      }
    };

    loadUsers();
  }, []);

  // Note: localStorage is updated only when users are successfully loaded from API or updated via API calls

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole =
        roleFilter === "all" ||
        user.role.toLowerCase() === roleFilter.toLowerCase();
      const matchesStatus =
        statusFilter === "all" ||
        user.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Patient":
        return "bg-blue-100 text-blue-800";
      case "Psychiatrist":
        return "bg-purple-100 text-purple-800";
      case "Counselor":
        return "bg-green-100 text-green-800";
      case "Admin":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleUserAction = async (action: string, userId: number) => {
    console.log(`${action} user with ID: ${userId}`);
    const userToEdit = users.find((u) => u.id === userId);

    if (action === "Edit" && userToEdit) {
      setEditingUser({
        ...userToEdit,
        role: userToEdit.role as User['role'],
        status: userToEdit.status as User['status']
      });
      setIsEditModalOpen(true);
    } else if (action === "Delete") {
      // TODO: Implement API call for user deletion
      setUsers(users.filter((u) => u.id !== userId));
      alert(`User with ID: ${userId} deleted successfully!`);
    } else if (action === "Approve" || action === "Suspend" || action === "Reactivate" || action.startsWith("Change Status to")) {
      // Handle status changes with API calls
      let newStatus: string;
      if (action === "Approve" || action === "Reactivate") {
        newStatus = "Active";
      } else if (action === "Suspend") {
        newStatus = "Suspended";
      } else {
        newStatus = action.replace("Change Status to ", "");
      }

      try {
        const response = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: userId,
            name: userToEdit?.name,
            email: userToEdit?.email,
            role: userToEdit?.role,
            status: newStatus,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Update local state with the response data
          const updatedUsers = users.map((u) => 
            u.id === userId 
              ? { ...u, ...data.user, verified: data.user.status === "Active" }
              : u
          );
          setUsers(updatedUsers);
          localStorage.setItem('managedUsers', JSON.stringify(updatedUsers));
          alert(`User status updated to ${newStatus} successfully!`);
        } else {
          alert(`Error: ${data.error || 'Failed to update user status'}`);
        }
      } catch (error) {
        console.error('Error updating user status:', error);
        alert('Failed to update user status. Please try again.');
      }
    } else if (action === "Reset Password") {
      alert(`Resetting password for user with ID: ${userId}!`);
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingUser.id,
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          status: editingUser.status,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state with the response data
        const updatedUsers = users.map((u) => 
          u.id === editingUser.id 
            ? { ...u, ...data.user, verified: data.user.status === "Active" }
            : u
        );
        setUsers(updatedUsers);
        localStorage.setItem('managedUsers', JSON.stringify(updatedUsers));
        alert("User updated successfully!");
        setIsEditModalOpen(false);
        setEditingUser(null);
      } else {
        alert(`Error: ${data.error || 'Failed to update user'}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateUsername = (name: string, email: string) => {
    // Generate username from name or email
    const baseName = name.toLowerCase().replace(/\s+/g, '.');
    const emailPrefix = email.split('@')[0].toLowerCase();
    return baseName || emailPrefix;
  };

  const handleAddUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    const tempPassword = generateTemporaryPassword();

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          tempPassword: tempPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add the new user to the local state
        const userToAdd = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          status: data.user.status,
          joinDate: data.user.joinDate,
          lastLogin: "Never",
          sessionsCount: 0,
          verified: data.user.status === "Active",
          username: data.user.username
        };

        const updatedUsers = [...users, userToAdd];
         setUsers(updatedUsers);
         localStorage.setItem('managedUsers', JSON.stringify(updatedUsers));
         setIsAddModalOpen(false);
         setNewUser({
           name: "",
           email: "",
           role: "patient" as User['role'],
           status: "Active" as User['status']
         });
        
        // Show login credentials to admin
        alert(`User created successfully!\n\nLogin Credentials:\nUsername: ${data.credentials.username}\nEmail: ${data.credentials.email}\nTemporary Password: ${data.credentials.tempPassword}\n\nPlease share these credentials with the user and ask them to change the password after first login.`);
      } else {
        alert(`Error: ${data.error || 'Failed to create user'}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user. Please try again.');
    }
  };

  const handleCancelAdd = () => {
    setIsAddModalOpen(false);
    setNewUser({
      name: "",
      email: "",
      role: "Patient" as User['role'],
      status: "Pending" as User['status']
    });
  };

  return (
    <DashboardLayout user={user as User}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Manage user accounts, roles, and permissions with ease.
            </p>
          </div>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Add New User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Users</CardTitle>
              <div className="p-2 bg-blue-200 rounded-full">
                <UserPlus className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{users.length}</div>
              <p className="text-xs text-blue-600 mt-1">
                Registered accounts
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                Active Users
              </CardTitle>
              <div className="p-2 bg-green-200 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {users.filter((u) => u.status === "Active").length}
              </div>
              <p className="text-xs text-green-600 mt-1">Currently active</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">
                Professionals
              </CardTitle>
              <div className="p-2 bg-purple-200 rounded-full">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {
                  users.filter(
                    (u) => u.role === "Psychiatrist" || u.role === "Counselor"
                  ).length
                }
              </div>
              <p className="text-xs text-purple-600 mt-1">
                Psychiatrists & Counselors
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">
                Pending Approval
              </CardTitle>
              <div className="p-2 bg-yellow-200 rounded-full">
                <XCircle className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-900">
                {users.filter((u) => u.status === "Pending").length}
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                Awaiting verification
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}

        {/* Edit User Modal */}
        {isEditModalOpen && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Edit User</CardTitle>
                <CardDescription>
                  Update the details for {editingUser.name}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editingUser.name || ""}
                    onChange={(e) =>
                      setEditingUser((prev) =>
                        prev ? { ...prev, name: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingUser.email || ""}
                    onChange={(e) =>
                      setEditingUser((prev) =>
                        prev ? { ...prev, email: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) =>
                      setEditingUser((prev) =>
                        prev ? { ...prev, role: value as User["role"] } : null
                      )
                    }
                  >
                    <SelectTrigger id="edit-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Patient">Patient</SelectItem>
                      <SelectItem value="Psychiatrist">Psychiatrist</SelectItem>
                      <SelectItem value="Counselor">Counselor</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingUser.status}
                    onValueChange={(value) =>
                      setEditingUser((prev) =>
                        prev
                          ? { ...prev, status: value as User["status"] }
                          : null
                      )
                    }
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveUser}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add User Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add New User</CardTitle>
                <CardDescription>
                  Create a new user account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="add-name">Full Name *</Label>
                  <Input
                    id="add-name"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="add-email">Email *</Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="add-role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) =>
                      setNewUser((prev) => ({ ...prev, role: value as User["role"] }))
                    }
                  >
                    <SelectTrigger id="add-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Patient">Patient</SelectItem>
                      <SelectItem value="Psychiatrist">Psychiatrist</SelectItem>
                      <SelectItem value="Counselor">Counselor</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="add-status">Status</Label>
                  <Select
                    value={newUser.status}
                    onValueChange={(value) =>
                      setNewUser((prev) => ({ ...prev, status: value as User["status"] }))
                    }
                  >
                    <SelectTrigger id="add-status">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCancelAdd}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser}>Add User</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle className="text-xl font-bold text-gray-800">User Directory</CardTitle>
            <CardDescription className="text-gray-600">
              Search and filter users by role and status
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-48 h-12 border-2 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
                    <SelectItem value="counselor">Counselor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 h-12 border-2 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* User Table */}
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-6 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-lg transition-all duration-300 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                >
                  <div className="flex items-center space-x-6 mb-4 lg:mb-0">
                    <Avatar className="h-16 w-16 ring-4 ring-gray-100">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-bold text-lg text-gray-900">
                          {user.name}
                        </h4>
                        {user.verified && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{user.email}</p>
                      <div className="flex items-center space-x-3">
                        <Badge className={`${getRoleColor(user.role)} px-3 py-1 text-sm font-medium`}>
                          {user.role}
                        </Badge>
                        <Badge className={`${getStatusColor(user.status)} px-3 py-1 text-sm font-medium`}>
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="grid grid-cols-3 gap-6 text-center lg:text-left">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-bold text-lg text-gray-900">{user.sessionsCount}</p>
                        <p className="text-xs text-gray-600 font-medium">Sessions</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-bold text-lg text-gray-900">{user.joinDate}</p>
                        <p className="text-xs text-gray-600 font-medium">Joined</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-bold text-lg text-gray-900">{user.lastLogin}</p>
                        <p className="text-xs text-gray-600 font-medium">Last Login</p>
                      </div>
                    </div>

                    <div className="flex justify-center lg:justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="lg" className="border-2 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleUserAction("Edit", user.id)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          {user.status === "Pending" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleUserAction("Approve", user.id)
                              }
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {user.status === "Active" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleUserAction("Suspend", user.id)
                              }
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {user.status === "Suspended" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleUserAction("Reactivate", user.id)
                              }
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              handleUserAction("Reset Password", user.id)
                            }
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUserAction("Delete", user.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No users found
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No users match your current search criteria. Try adjusting your filters or search terms.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
