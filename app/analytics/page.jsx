"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { getFromStorage, STORAGE_KEYS, generateStudyPlan } from "@/lib/localStorage"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import subjectsData from "@/data/subjects.json"

export default function AnalyticsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [progress, setProgress] = useState(null)
  const [testHistory, setTestHistory] = useState(null)
  const [studyPlan, setStudyPlan] = useState(null)
  const [timeAnalytics, setTimeAnalytics] = useState(null)

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

      // Calculate time analytics
      calculateTimeAnalytics(userProgress, userTestHistory)
    }
  }, [user, isLoading, router])

  const calculateTimeAnalytics = (progressData, historyData) => {
    if (!progressData?.subjects || !historyData?.tests) return

    const timeData = {
      totalStudyTime: 0,
      averageSessionTime: 0,
      studyStreak: 0,
      weeklyProgress: [],
      subjectTimeDistribution: [],
    }

    // Calculate total study time and session averages
    historyData.tests.forEach((test) => {
      timeData.totalStudyTime += test.totalTime || 0
    })

    timeData.averageSessionTime =
      historyData.tests.length > 0 ? Math.round(timeData.totalStudyTime / historyData.tests.length / 1000) : 0

    // Calculate weekly progress (last 7 days)
    const now = new Date()
    const weeklyData = {}

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      weeklyData[dateStr] = { date: dateStr, questions: 0, accuracy: 0, tests: 0 }
    }

    historyData.tests.forEach((test) => {
      const testDate = new Date(test.date).toISOString().split("T")[0]
      if (weeklyData[testDate]) {
        weeklyData[testDate].questions += test.questions || 0
        weeklyData[testDate].accuracy += test.score || 0
        weeklyData[testDate].tests += 1
      }
    })

    // Calculate average accuracy for each day
    Object.values(weeklyData).forEach((day) => {
      if (day.tests > 0) {
        day.accuracy = Math.round(day.accuracy / day.tests)
      }
    })

    timeData.weeklyProgress = Object.values(weeklyData)

    // Subject time distribution
    const subjectTimes = {}
    Object.entries(progressData.subjects).forEach(([subjectId, subject]) => {
      let totalTime = 0
      Object.values(subject).forEach((subtopic) => {
        if (subtopic.history) {
          subtopic.history.forEach((h) => {
            totalTime += h.timeTaken || 0
          })
        }
      })
      if (totalTime > 0) {
        const subjectData = subjectsData.find((s) => s.subjectId === subjectId)
        subjectTimes[subjectId] = {
          name: subjectData?.title || subjectId,
          time: Math.round(totalTime / 1000 / 60), // Convert to minutes
          color: subjectData?.color || "#8884d8",
        }
      }
    })

    timeData.subjectTimeDistribution = Object.values(subjectTimes)
    setTimeAnalytics(timeData)
  }

  const getPerformanceInsights = () => {
    if (!progress?.subjects || !testHistory?.tests) return []

    const insights = []

    // Performance trend analysis
    const recentTests = testHistory.tests.slice(0, 5)
    if (recentTests.length >= 3) {
      const avgScore = recentTests.reduce((sum, test) => sum + (test.score || 0), 0) / recentTests.length
      if (avgScore >= 80) {
        insights.push({
          type: "success",
          title: "Excellent Performance Trend",
          message: `Your average score in recent tests is ${Math.round(avgScore)}%. Keep up the great work!`,
          action: "Try harder difficulty levels",
        })
      } else if (avgScore < 60) {
        insights.push({
          type: "warning",
          title: "Performance Needs Attention",
          message: `Your recent average is ${Math.round(avgScore)}%. Consider reviewing fundamental concepts.`,
          action: "Focus on weak areas",
        })
      }
    }

    // Subject balance analysis
    const subjectCounts = {}
    Object.keys(progress.subjects).forEach((subjectId) => {
      let totalQuestions = 0
      Object.values(progress.subjects[subjectId]).forEach((subtopic) => {
        totalQuestions += subtopic.attempted || 0
      })
      subjectCounts[subjectId] = totalQuestions
    })

    const maxQuestions = Math.max(...Object.values(subjectCounts))
    const minQuestions = Math.min(...Object.values(subjectCounts))

    if (maxQuestions > minQuestions * 3) {
      const neglectedSubjects = Object.entries(subjectCounts)
        .filter(([_, count]) => count < maxQuestions / 2)
        .map(([subjectId]) => subjectsData.find((s) => s.subjectId === subjectId)?.title)
        .filter(Boolean)

      if (neglectedSubjects.length > 0) {
        insights.push({
          type: "info",
          title: "Subject Balance Recommendation",
          message: `Consider practicing more in: ${neglectedSubjects.join(", ")}`,
          action: "Balance your study schedule",
        })
      }
    }

    return insights
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  const insights = getPerformanceInsights()
  const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                ← Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-bold">Learning Analytics</h1>
                <p className="text-sm text-muted-foreground">Detailed insights into your learning progress</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="time">Time Analysis</TabsTrigger>
            <TabsTrigger value="recommendations">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Performance Insights */}
            {insights.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Performance Insights</h2>
                <div className="grid gap-4">
                  {insights.map((insight, index) => (
                    <Card
                      key={index}
                      className={`border-l-4 ${
                        insight.type === "success"
                          ? "border-l-primary"
                          : insight.type === "warning"
                            ? "border-l-yellow-500"
                            : "border-l-blue-500"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <CardDescription>{insight.message}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline">{insight.action}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Progress */}
            {timeAnalytics?.weeklyProgress && (
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Progress</CardTitle>
                  <CardDescription>Your learning activity over the past 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeAnalytics.weeklyProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => new Date(date).toLocaleDateString("en", { weekday: "short" })}
                      />
                      <YAxis />
                      <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString()} />
                      <Line type="monotone" dataKey="questions" stroke="hsl(var(--primary))" name="Questions" />
                      <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--chart-2))" name="Accuracy %" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Subject Performance Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance Radar</CardTitle>
                <CardDescription>Compare your performance across different subjects</CardDescription>
              </CardHeader>
              <CardContent>
                {progress?.subjects && Object.keys(progress.subjects).length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart
                      data={Object.entries(progress.subjects)
                        .map(([subjectId, subject]) => {
                          let totalAttempted = 0
                          let totalCorrect = 0
                          Object.values(subject).forEach((subtopic) => {
                            totalAttempted += subtopic.attempted || 0
                            totalCorrect += subtopic.correct || 0
                          })
                          const subjectData = subjectsData.find((s) => s.subjectId === subjectId)
                          return {
                            subject: subjectData?.title || subjectId,
                            accuracy: totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0,
                            questions: totalAttempted,
                          }
                        })
                        .filter((item) => item.questions > 0)}
                    >
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Accuracy %"
                        dataKey="accuracy"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    No performance data available yet. Start practicing to see your radar chart!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Difficulty Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Difficulty</CardTitle>
                <CardDescription>How well you perform on different difficulty levels</CardDescription>
              </CardHeader>
              <CardContent>
                {testHistory?.tests && testHistory.tests.length > 0 ? (
                  <div className="space-y-4">
                    {["easy", "medium", "hard"].map((difficulty) => {
                      const difficultyTests = testHistory.tests.filter((test) =>
                        test.results?.some((r) => r.difficulty === difficulty),
                      )
                      const avgScore =
                        difficultyTests.length > 0
                          ? Math.round(
                              difficultyTests.reduce((sum, test) => sum + (test.score || 0), 0) /
                                difficultyTests.length,
                            )
                          : 0

                      return (
                        <div key={difficulty} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="capitalize font-medium">{difficulty}</span>
                            <span className="text-sm text-muted-foreground">{avgScore}% avg</span>
                          </div>
                          <Progress value={avgScore} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No difficulty data available yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time" className="space-y-6">
            {/* Time Statistics */}
            {timeAnalytics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Study Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.round(timeAnalytics.totalStudyTime / 1000 / 60)}m</div>
                    <p className="text-xs text-muted-foreground">Minutes practiced</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Session</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{timeAnalytics.averageSessionTime}s</div>
                    <p className="text-xs text-muted-foreground">Per session</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{testHistory?.tests?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">Practice sessions</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Subject Time Distribution */}
            {timeAnalytics?.subjectTimeDistribution && timeAnalytics.subjectTimeDistribution.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Time Distribution by Subject</CardTitle>
                  <CardDescription>How you spend your study time across subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={timeAnalytics.subjectTimeDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="time"
                        label={({ name, value }) => `${name}: ${value}m`}
                      >
                        {timeAnalytics.subjectTimeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} minutes`, "Study Time"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            {/* AI-Inspired Study Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Personalized Study Plan</CardTitle>
                <CardDescription>AI-powered recommendations based on your learning patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Weak Areas Focus */}
                  {studyPlan?.weakAreas && studyPlan.weakAreas.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-red-600">Priority Areas (Focus Required)</h3>
                      {studyPlan.weakAreas.slice(0, 3).map((area, index) => (
                        <Card key={index} className="border-red-200 bg-red-50">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium capitalize">{area.subtopicId.replace("-", " ")}</p>
                                <p className="text-sm text-muted-foreground capitalize">{area.subjectId}</p>
                                <p className="text-xs text-red-600 mt-1">
                                  Current accuracy: {Math.round(area.accuracy * 100)}% • {area.attempted} questions
                                  attempted
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => router.push(`/practice/${area.subjectId}/${area.subtopicId}`)}
                              >
                                Practice Now
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Strengths to Maintain */}
                  {studyPlan?.strengths && studyPlan.strengths.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-primary">Strengths to Maintain</h3>
                      {studyPlan.strengths.slice(0, 3).map((area, index) => (
                        <Card key={index} className="border-primary/20 bg-primary/5">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium capitalize">{area.subtopicId.replace("-", " ")}</p>
                                <p className="text-sm text-muted-foreground capitalize">{area.subjectId}</p>
                                <p className="text-xs text-primary mt-1">
                                  Excellent! {Math.round(area.accuracy * 100)}% accuracy • {area.attempted} questions
                                </p>
                              </div>
                              <Badge variant="default">Strong</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Study Tips */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Smart Study Tips</h3>
                    <div className="grid gap-4">
                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="pt-4">
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">🧠</span>
                            <div>
                              <p className="font-medium">Spaced Repetition</p>
                              <p className="text-sm text-muted-foreground">
                                Review topics you struggled with after 1 day, then 3 days, then 1 week for better
                                retention.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-4">
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">⏰</span>
                            <div>
                              <p className="font-medium">Optimal Study Sessions</p>
                              <p className="text-sm text-muted-foreground">
                                Based on your data, aim for 15-20 minute focused sessions with 5-minute breaks.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-purple-200 bg-purple-50">
                        <CardContent className="pt-4">
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">🎯</span>
                            <div>
                              <p className="font-medium">Mixed Practice</p>
                              <p className="text-sm text-muted-foreground">
                                Alternate between subjects to improve long-term retention and prevent mental fatigue.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
