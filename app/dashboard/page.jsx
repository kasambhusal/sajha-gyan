"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { getFromStorage, STORAGE_KEYS, generateStudyPlan } from "@/lib/localStorage"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import subjectsData from "@/data/subjects.json"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [progress, setProgress] = useState(null)
  const [studyPlan, setStudyPlan] = useState(null)
  const [testHistory, setTestHistory] = useState(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
      return
    }

    if (user) {
      const userProgress = getFromStorage(STORAGE_KEYS.USER_PROGRESS)
      const userTestHistory = getFromStorage(STORAGE_KEYS.TEST_HISTORY)
      const plan = generateStudyPlan()

      setProgress(userProgress)
      setTestHistory(userTestHistory)
      setStudyPlan(plan)
    }
  }, [user])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  // Calculate overall stats
  const calculateStats = () => {
    if (!progress?.subjects) return { totalQuestions: 0, correctAnswers: 0, accuracy: 0, subjectsStarted: 0 }

    let totalQuestions = 0
    let correctAnswers = 0
    let subjectsStarted = 0

    Object.entries(progress.subjects).forEach(([subjectId, subject]) => {
      let hasActivity = false
      Object.values(subject).forEach((subtopic) => {
        if (subtopic.attempted > 0) {
          totalQuestions += subtopic.attempted
          correctAnswers += subtopic.correct
          hasActivity = true
        }
      })
      if (hasActivity) subjectsStarted++
    })

    return {
      totalQuestions,
      correctAnswers,
      accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
      subjectsStarted,
    }
  }

  const stats = calculateStats()

  // Prepare chart data
  const subjectPerformanceData = subjectsData
    .map((subject) => {
      const subjectProgress = progress?.subjects[subject.subjectId] || {}
      let totalAttempted = 0
      let totalCorrect = 0

      Object.values(subjectProgress).forEach((subtopic) => {
        totalAttempted += subtopic.attempted || 0
        totalCorrect += subtopic.correct || 0
      })

      return {
        name: subject.title,
        attempted: totalAttempted,
        correct: totalCorrect,
        accuracy: totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0,
      }
    })
    .filter((item) => item.attempted > 0)

  const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">SG</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">SajhaGyan</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user.name}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push("/practice")}>
                Start Practice
              </Button>
              <Button variant="outline" onClick={() => router.push("/analytics")}>
                Analytics
              </Button>
              <Button variant="outline" onClick={() => router.push("/profile")}>
                Profile
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuestions}</div>
              <p className="text-xs text-muted-foreground">Questions attempted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.accuracy}%</div>
              <p className="text-xs text-muted-foreground">Overall performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Subjects Started</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.subjectsStarted}</div>
              <p className="text-xs text-muted-foreground">Out of {subjectsData.length} subjects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tests Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testHistory?.tests?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Practice sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>Your accuracy across different subjects</CardDescription>
            </CardHeader>
            <CardContent>
              {subjectPerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No data available. Start practicing to see your performance!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Questions Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Questions by Subject</CardTitle>
              <CardDescription>Distribution of questions you've attempted</CardDescription>
            </CardHeader>
            <CardContent>
              {subjectPerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subjectPerformanceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="attempted"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {subjectPerformanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No data available. Start practicing to see your distribution!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Study Plan & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weak Areas */}
          <Card>
            <CardHeader>
              <CardTitle>Areas for Improvement</CardTitle>
              <CardDescription>Focus on these topics to boost your performance</CardDescription>
            </CardHeader>
            <CardContent>
              {studyPlan?.weakAreas?.length > 0 ? (
                <div className="space-y-3">
                  {studyPlan.weakAreas.slice(0, 5).map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{area.subtopicId.replace("-", " ")}</p>
                        <p className="text-sm text-muted-foreground capitalize">{area.subjectId}</p>
                      </div>
                      <Badge variant="destructive">{Math.round(area.accuracy * 100)}%</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Complete more practice sessions to get personalized recommendations!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle>Your Strengths</CardTitle>
              <CardDescription>Topics where you excel</CardDescription>
            </CardHeader>
            <CardContent>
              {studyPlan?.strengths?.length > 0 ? (
                <div className="space-y-3">
                  {studyPlan.strengths.slice(0, 5).map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{area.subtopicId.replace("-", " ")}</p>
                        <p className="text-sm text-muted-foreground capitalize">{area.subjectId}</p>
                      </div>
                      <Badge variant="default" className="bg-primary">
                        {Math.round(area.accuracy * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Keep practicing to discover your strengths!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump into your learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                onClick={() => router.push("/practice")}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <span className="text-2xl">🎯</span>
                <span>Start Practice</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/practice?mode=random")}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <span className="text-2xl">🎲</span>
                <span>Random Questions</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/analytics")}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <span className="text-2xl">📊</span>
                <span>View Analytics</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/history")}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <span className="text-2xl">📚</span>
                <span>Test History</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
