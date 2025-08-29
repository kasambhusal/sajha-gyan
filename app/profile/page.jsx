"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/localStorage"
import subjectsData from "@/data/subjects.json"

export default function ProfilePage() {
  const { user, isLoading, updateUser, logout } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [progress, setProgress] = useState(null)
  const [testHistory, setTestHistory] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
      return
    }

    if (user) {
      const userProfile = getFromStorage(STORAGE_KEYS.USER_PROFILE)
      const userProgress = getFromStorage(STORAGE_KEYS.USER_PROGRESS)
      const userTestHistory = getFromStorage(STORAGE_KEYS.TEST_HISTORY)

      setProfile(userProfile)
      setProgress(userProgress)
      setTestHistory(userTestHistory)
      setEditedName(userProfile?.name || "")
    }
  }, [user, isLoading, router])

  const handleSaveProfile = () => {
    if (!editedName.trim()) return

    const updatedProfile = { ...profile, name: editedName.trim() }
    saveToStorage(STORAGE_KEYS.USER_PROFILE, updatedProfile)
    setProfile(updatedProfile)
    updateUser(updatedProfile)
    setIsEditing(false)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const calculateOverallStats = () => {
    if (!progress?.subjects) return { totalQuestions: 0, correctAnswers: 0, accuracy: 0, totalTime: 0 }

    let totalQuestions = 0
    let correctAnswers = 0
    let totalTime = 0

    Object.values(progress.subjects).forEach((subject) => {
      Object.values(subject).forEach((subtopic) => {
        totalQuestions += subtopic.attempted || 0
        correctAnswers += subtopic.correct || 0
        if (subtopic.history) {
          subtopic.history.forEach((h) => {
            totalTime += h.timeTaken || 0
          })
        }
      })
    })

    return {
      totalQuestions,
      correctAnswers,
      accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
      totalTime: Math.round(totalTime / 1000 / 60), // Convert to minutes
    }
  }

  const getSubjectProgress = () => {
    if (!progress?.subjects) return []

    return subjectsData
      .map((subject) => {
        const subjectProgress = progress.subjects[subject.subjectId] || {}
        let totalAttempted = 0
        let totalCorrect = 0
        const totalSubtopics = subject.subtopics.length
        let completedSubtopics = 0

        Object.entries(subjectProgress).forEach(([subtopicId, subtopic]) => {
          totalAttempted += subtopic.attempted || 0
          totalCorrect += subtopic.correct || 0
          if (subtopic.attempted > 0) completedSubtopics++
        })

        return {
          ...subject,
          attempted: totalAttempted,
          correct: totalCorrect,
          accuracy: totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0,
          progress: Math.round((completedSubtopics / totalSubtopics) * 100),
        }
      })
      .filter((subject) => subject.attempted > 0)
  }

  const generateProgressReport = () => {
    const stats = calculateOverallStats()
    const subjectProgress = getSubjectProgress()
    const recentTests = testHistory?.tests?.slice(0, 5) || []

    const report = {
      studentInfo: {
        name: profile?.name,
        studentId: profile?.studentId,
        joinDate: profile?.joinDate,
        reportDate: new Date().toISOString(),
      },
      overallStats: stats,
      subjectBreakdown: subjectProgress,
      recentPerformance: recentTests,
      recommendations: progress ? generateRecommendations() : [],
    }

    // Create downloadable JSON
    const dataStr = JSON.stringify(report, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `${profile?.name}_Progress_Report_${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const generateRecommendations = () => {
    const recommendations = []
    const subjectProgress = getSubjectProgress()

    // Find subjects with low accuracy
    subjectProgress.forEach((subject) => {
      if (subject.accuracy < 70 && subject.attempted >= 5) {
        recommendations.push(`Focus more on ${subject.title} - current accuracy: ${subject.accuracy}%`)
      }
    })

    // Find subjects with high accuracy
    subjectProgress.forEach((subject) => {
      if (subject.accuracy >= 85 && subject.attempted >= 10) {
        recommendations.push(`Excellent work in ${subject.title}! Consider advanced topics.`)
      }
    })

    return recommendations
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user || !profile) {
    return null
  }

  const stats = calculateOverallStats()
  const subjectProgress = getSubjectProgress()

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
                <h1 className="text-xl font-bold">Profile</h1>
                <p className="text-sm text-muted-foreground">Manage your account and view progress</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Profile Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <img
                  src={profile.avatar || "/placeholder.svg"}
                  alt={profile.name}
                  className="w-full h-full rounded-full"
                />
              </div>
              <CardTitle>
                {isEditing ? (
                  <div className="space-y-2">
                    <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} className="text-center" />
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" onClick={handleSaveProfile}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>{profile.name}</span>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>Student ID: {profile.studentId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Member since</p>
                <p className="font-medium">{new Date(profile.joinDate).toLocaleDateString()}</p>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total Tests</span>
                  <Badge variant="outline">{testHistory?.tests?.length || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Questions Answered</span>
                  <Badge variant="outline">{stats.totalQuestions}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Overall Accuracy</span>
                  <Badge variant="default" className="bg-primary">
                    {stats.accuracy}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Study Time</span>
                  <Badge variant="outline">{stats.totalTime}m</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
              <CardDescription>Your progress across all subjects</CardDescription>
            </CardHeader>
            <CardContent>
              {subjectProgress.length > 0 ? (
                <div className="space-y-6">
                  {subjectProgress.map((subject) => (
                    <div key={subject.subjectId} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{subject.icon}</span>
                          <div>
                            <p className="font-medium">{subject.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {subject.attempted} questions • {subject.accuracy}% accuracy
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            subject.accuracy >= 80 ? "default" : subject.accuracy >= 60 ? "secondary" : "destructive"
                          }
                        >
                          {subject.accuracy}%
                        </Badge>
                      </div>
                      <Progress value={subject.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">Progress: {subject.progress}% of topics attempted</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No progress data yet. Start practicing to see your progress!</p>
                  <Button className="mt-4" onClick={() => router.push("/practice")}>
                    Start Learning
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>Manage your learning data and account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={generateProgressReport}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
              >
                <span className="text-2xl">📊</span>
                <span>Download Progress Report</span>
              </Button>
              <Button
                onClick={() => router.push("/history")}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <span className="text-2xl">📚</span>
                <span>View Test History</span>
              </Button>
              <Button
                onClick={() => router.push("/analytics")}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <span className="text-2xl">📈</span>
                <span>Detailed Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
