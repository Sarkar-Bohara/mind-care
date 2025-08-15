"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function DemoCredentials() {
  const [showPasswords, setShowPasswords] = useState(false);

  const credentials = [
    {
      role: "Psychiatrist",
      accounts: [
        {
          username: "dr.sarah",
          password: "sarah123",
          name: "Dr. Sarah Ahmad",
        },
        {
          username: "dr.michael",
          password: "psych2024",
          name: "Dr. Michael Chen",
        },
      ],
      color: "bg-purple-100 text-purple-800",
    },
    {
      role: "Counselor",
      accounts: [
        {
          username: "counselor.fatimah",
          password: "fatimah123",
          name: "Fatimah Ibrahim",
        },
        {
          username: "counselor.lisa",
          password: "counsel2024",
          name: "Lisa Wong",
        },
      ],
      color: "bg-green-100 text-green-800",
    },
    {
      role: "Admin",
      accounts: [
        {
          username: "admin",
          password: "admin2024",
          name: "System Administrator",
        },
      ],
      color: "bg-red-100 text-red-800",
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Demo Login Credentials</CardTitle>
            <CardDescription>
              Use these pre-configured accounts to test different user roles.
              Patients can register their own accounts.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPasswords(!showPasswords)}
          >
            {showPasswords ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {showPasswords ? "Hide" : "Show"} Passwords
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          {credentials.map((roleGroup) => (
            <div key={roleGroup.role} className="space-y-3">
              <Badge className={roleGroup.color}>{roleGroup.role}</Badge>
              <div className="space-y-3">
                {roleGroup.accounts.map((account) => (
                  <div
                    key={account.username}
                    className="p-3 border rounded-lg bg-gray-50"
                  >
                    <h4 className="font-medium text-sm text-gray-900 mb-2">
                      {account.name}
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Username:</span>
                        <div className="flex items-center space-x-1">
                          <code className="bg-white px-2 py-1 rounded">
                            {account.username}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(account.username)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Password:</span>
                        <div className="flex items-center space-x-1">
                          <code className="bg-white px-2 py-1 rounded">
                            {showPasswords ? account.password : "••••••••"}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(account.password)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">For Patients:</h4>
          <p className="text-sm text-blue-800">
            Click the "Register" tab above to create a new patient account. Your
            username will be automatically generated from your email address
            (the part before @).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
