"use client";

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
import { Brain, Clock, Heart, Mail, Phone, Shield, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function HomePage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dateOfBirth: "",
  });

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data and token
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);

        // Redirect based on role
        const roleRoutes = {
          psychiatrist: "/psychiatrist/dashboard",
          counselor: "/counselor/dashboard",
          admin: "/admin/dashboard",
          patient: "/patient/dashboard",
        };

        router.push(roleRoutes[data.user.role as keyof typeof roleRoutes]);
      } else {
        alert(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (registerData.password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          `Registration successful! You can now login with your username: ${data.user.username}`
        );
        setAuthMode("login");
        setLoginData({ ...loginData, username: data.user.username });
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">MindCare Hub</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link
                href="#features"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Services
              </Link>
              <Link
                href="#about"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                About
              </Link>
              <Link
                href="#contact"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Your Mental Health
                <span className="text-blue-600"> Journey</span>
                <br />
                <span className="text-green-600">Starts Here</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Professional mental health support tailored for Malaysia.
                Connect with licensed professionals, track your progress, and
                access evidence-based resources for your wellbeing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    const loginCard = document.querySelector(".shadow-lg");
                    loginCard?.scrollIntoView({ behavior: "smooth" });
                    setAuthMode("register");
                  }}
                >
                  Start Your Journey
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    const featuresSection = document.querySelector("#features");
                    featuresSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Learn More
                </Button>
              </div>
            </div>

            {/* Login Card */}
            <Card className="w-full max-w-md mx-auto shadow-lg">
              <CardHeader>
                <div className="flex space-x-1 mb-4">
                  <Button
                    variant={authMode === "login" ? "default" : "outline"}
                    onClick={() => setAuthMode("login")}
                    className="flex-1"
                  >
                    Sign In
                  </Button>
                  <Button
                    variant={authMode === "register" ? "default" : "outline"}
                    onClick={() => setAuthMode("register")}
                    className="flex-1"
                  >
                    Register
                  </Button>
                </div>
                <CardTitle>
                  {authMode === "login" ? "Welcome Back" : "Join MindCare Hub"}
                </CardTitle>
                <CardDescription>
                  {authMode === "login"
                    ? "Access your personalized mental health dashboard"
                    : "Create your account to begin your mental health journey"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {authMode === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username or Email</Label>
                      <Input
                        id="username"
                        type="text"
                        value={loginData.username}
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
                            username: e.target.value,
                          })
                        }
                        placeholder="Enter your username or email"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
                            password: e.target.value,
                          })
                        }
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={registerData.name}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            email: e.target.value,
                          })
                        }
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={registerData.phone}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="+60123456789"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={registerData.dateOfBirth}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            dateOfBirth: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            password: e.target.value,
                          })
                        }
                        placeholder="Create a secure password (min 6 characters)"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Comprehensive Mental Health Services
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Evidence-based mental health care with personalized treatment
              plans and ongoing support
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <CardTitle>Telepsychiatry</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Connect with licensed psychiatrists for professional
                  consultations and medication management
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <CardTitle>Professional Counseling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Schedule sessions with certified counselors specializing in
                  various therapeutic approaches
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Brain className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <CardTitle>Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Monitor your mental health journey with interactive tools and
                  personalized insights
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <CardTitle>Secure Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Join moderated support groups and connect with others on
                  similar journeys
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              About MindCare Hub
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Addressing Malaysia's mental health needs with professional,
              accessible, and culturally-sensitive care
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">1M+</div>
              <p className="text-gray-600">
                Malaysians aged 15+ affected by depression
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                Licensed
              </div>
              <p className="text-gray-600">
                Professional psychiatrists and counselors
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                24/7
              </div>
              <p className="text-gray-600">
                Crisis support and emergency resources
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <h4 className="text-2xl font-bold text-gray-900 mb-4">
                  Our Mission
                </h4>
                <p className="text-gray-600 mb-6">
                  MindCare Hub is dedicated to providing accessible,
                  professional mental health services to all Malaysians. We
                  combine evidence-based treatments with culturally-sensitive
                  care to support individuals on their mental health journey.
                </p>
                <h4 className="text-2xl font-bold text-gray-900 mb-4">
                  Why Choose MindCare Hub?
                </h4>
                <ul className="text-gray-600 space-y-2">
                  <li>• Licensed mental health professionals</li>
                  <li>• Secure, HIPAA-compliant platform</li>
                  <li>• Culturally-sensitive care for Malaysian communities</li>
                  <li>• Flexible scheduling and teletherapy options</li>
                  <li>• Comprehensive progress tracking and resources</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h3>
            <p className="text-xl text-gray-600">
              We're here to support you. Reach out for more information or
              emergency assistance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Phone className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Emergency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">999</p>
                <p className="text-sm text-gray-600">24/7 Emergency Services</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Phone className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Crisis Hotline</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-blue-600">03-76272929</p>
                <p className="text-sm text-gray-600">
                  Mental Health Crisis Support
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Mail className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Email Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-green-600">
                  support@mindcarehub.my
                </p>
                <p className="text-sm text-gray-600">
                  General inquiries and support
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Business Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-purple-600">
                  Mon-Fri: 9AM-5PM
                </p>
                <p className="text-sm text-gray-600">Malaysia Time (GMT+8)</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Professional Services Inquiry</CardTitle>
                <CardDescription>
                  For healthcare professionals interested in joining our
                  platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact-name">Full Name</Label>
                      <Input id="contact-name" placeholder="Dr. Your Name" />
                    </div>
                    <div>
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contact-profession">Profession</Label>
                    <Input
                      id="contact-profession"
                      placeholder="Psychiatrist, Counselor, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-message">Message</Label>
                    <textarea
                      id="contact-message"
                      className="w-full p-3 border border-gray-300 rounded-md"
                      rows={4}
                      placeholder="Tell us about your interest in joining MindCare Hub..."
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Send Inquiry
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-6 w-6" />
                <span className="text-xl font-bold">MindCare Hub</span>
              </div>
              <p className="text-gray-400">
                Professional mental health support for Malaysia, providing
                accessible and culturally-sensitive care.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Telepsychiatry</li>
                <li>Professional Counseling</li>
                <li>Progress Tracking</li>
                <li>Community Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Mental Health Education</li>
                <li>Self-Help Tools</li>
                <li>Crisis Support</li>
                <li>Professional Directory</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Emergency Contacts</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Emergency: 999</li>
                <li>Crisis Hotline: 03-76272929</li>
                <li>Support: support@mindcarehub.com</li>
                <li>Business Hours: Mon-Fri 9AM-5PM</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2024 MindCare Hub. All rights reserved. | Privacy Policy |
              Terms of Service
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
