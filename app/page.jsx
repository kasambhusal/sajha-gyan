"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFromStorage, initializeUserData, STORAGE_KEYS } from "@/lib/localStorage"

export default function HomePage() {
  const [studentId, setStudentId] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const existingProfile = getFromStorage(STORAGE_KEYS.USER_PROFILE)
    if (existingProfile) {
      router.push("/dashboard")
    }
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!studentId.trim() || !name.trim()) return

    setIsLoading(true)

    try {
      // Initialize user data
      initializeUserData(studentId.trim(), name.trim())

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-3xl font-bold text-primary-foreground">SG</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">SajhaGyan</h1>
            <p className="text-muted-foreground mt-2">Your Personalized Learning Partner</p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Welcome Back!</CardTitle>
            <CardDescription>Enter your details to start your learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="studentId" className="text-sm font-medium">
                  Student ID
                </label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="Enter your student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Start Learning"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-xl">📊</span>
            </div>
            <p className="text-sm text-muted-foreground">Track Progress</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-xl">🎯</span>
            </div>
            <p className="text-sm text-muted-foreground">Personalized Tests</p>
          </div>
        </div>
      </div>
    </div>
  )
}
