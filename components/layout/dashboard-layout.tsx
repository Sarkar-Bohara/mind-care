"use client";

import type React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  Heart,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "Patient" | "Psychiatrist" | "Counselor" | "Admin";
  avatar?: string;
  status: "Active" | "Pending" | "Suspended";
  joinDate: string;
  lastLogin: string;
  sessionsCount: number;
  verified: boolean;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: User;
}

export default function DashboardLayout({
  children,
  user,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    } else {
      const userData = localStorage.getItem("user");
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      } else {
        // Redirect to login if no user data
        window.location.href = "/";
      }
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const getNavigationItems = () => {
    if (!currentUser) return [];

    const baseItems = [
      {
        name: "Dashboard",
        href: `/${currentUser.role.toLowerCase()}/dashboard`,
        icon: BarChart3,
      },
    ];

    switch (currentUser.role.toLowerCase()) {
      case "patient":
        return [
          ...baseItems,
          {
            name: "My Appointments",
            href: "/patient/appointments",
            icon: Calendar,
          },
          { name: "Book Counseling", href: "/patient/booking", icon: Calendar },
          { name: "Mood Tracker", href: "/patient/mood-tracker", icon: Heart },
          {
            name: "Community",
            href: "/patient/community",
            icon: MessageSquare,
          },
          { name: "Resources", href: "/patient/resources", icon: BookOpen },
          { name: "My Profile", href: "/patient/profile", icon: Users },
        ];
      case "psychiatrist":
        return [
          ...baseItems,
          {
            name: "Appointments",
            href: "/psychiatrist/appointments",
            icon: Calendar,
          },
          {
            name: "Patient Progress",
            href: "/psychiatrist/progress",
            icon: BarChart3,
          },
          {
            name: "Telepsychiatry",
            href: "/psychiatrist/telepsychiatry",
            icon: Heart,
          },
        ];
      case "counselor":
        return [
          ...baseItems,
          {
            name: "Forum Moderation",
            href: "/counselor/moderation",
            icon: Shield,
          },
          {
            name: "Resource Portal",
            href: "/counselor/resources",
            icon: BookOpen,
          },
          { name: "Sessions", href: "/counselor/sessions", icon: Calendar },
        ];
      case "admin":
        return [
          ...baseItems,
          { name: "User Management", href: "/admin/users", icon: Users },
          { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
          { name: "System Settings", href: "/admin/settings", icon: Settings },
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">MindCare</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6">
          <div className="px-6 mb-6">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>
                  {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {currentUser.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {currentUser.role}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between bg-white border-b px-6 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center space-x-4 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>
                      {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/${currentUser.role.toLowerCase()}/profile`}>
                    <Users className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {currentUser.role.toLowerCase() === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
