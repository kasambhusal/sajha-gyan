"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/components/auth-provider"
import { getFromStorage, STORAGE_KEYS, getAttemptedQuestions } from "@/lib/localStorage"
import subjectsData from "@/data/subjects.json"

export default function SubjectPracticePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const subjectId = params.subject

  const [subject, setSubject] = useState(null)
  const [progress, setProgress] = useState(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
      return
    }

    // Find subject data
    const subjectData = subjectsData.find((s) => s.subjectId === subjectId)
    if (!subjectData) {
      router.push("/practice")
      return
    }

    setSubject(subjectData)

    // Get user progress
    const userProgress = getFromStorage(STORAGE_KEYS.USER_PROGRESS)
    setProgress(userProgress)
  }, [user, isLoading, router, subjectId])

  if (isLoading || !subject) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  const handleSubtopicSelect = (subtopicId) => {
    router.push(`/practice/${subjectId}/${subtopicId}`)
  }

  const handleFullSubjectTest = () => {
    router.push(`/practice/${subjectId}/test`)
  }

  const getSubtopicProgress = (subtopicId) => {
    const subtopicProgress = progress?.subjects?.[subjectId]?.[subtopicId]
    if (!subtopicProgress) return { attempted: 0, correct: 0, accuracy: 0 }

    const accuracy =
      subtopicProgress.attempted > 0 ? Math.round((subtopicProgress.correct / subtopicProgress.attempted) * 100) : 0

    return {
      attempted: subtopicProgress.attempted,
      correct: subtopicProgress.correct,
      accuracy,
    }
  }

  const getAvailableQuestions = (subtopicId) => {
    const subtopic = subject.subtopics.find((s) => s.subtopicId === subtopicId)
    const attemptedIds = getAttemptedQuestions(subjectId, subtopicId)
    return subtopic.questions.length - attemptedIds.length
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/practice")}>
                ← Back to Practice
              </Button>
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{subject.icon}</span>
                <div>
                  <h1 className="text-xl font-bold">{subject.title}</h1>
                  <p className="text-sm text-muted-foreground">Choose a topic to practice</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Full Subject Test */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">🎯</span>
              <span>Full {subject.title} Test</span>
            </CardTitle>
            <CardDescription>Take a comprehensive test covering all topics in {subject.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleFullSubjectTest} size="lg">
              Start Full Test
            </Button>
          </CardContent>
        </Card>

        {/* Subtopics */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Topics</h2>
            <p className="text-muted-foreground">Select a specific topic to practice</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subject.subtopics.map((subtopic) => {
              const subtopicProgress = getSubtopicProgress(subtopic.subtopicId)
              const availableQuestions = getAvailableQuestions(subtopic.subtopicId)

              return (
                <Card
                  key={subtopic.subtopicId}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleSubtopicSelect(subtopic.subtopicId)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{subtopic.title}</CardTitle>
                      <Badge
                        variant={
                          subtopic.difficulty === "easy"
                            ? "default"
                            : subtopic.difficulty === "medium"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {subtopic.difficulty}
                      </Badge>
                    </div>
                    <CardDescription>
                      {subtopic.questions.length} total questions • {availableQuestions} remaining
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {subtopicProgress.attempted > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{subtopicProgress.accuracy}% accuracy</span>
                          </div>
                          <Progress value={subtopicProgress.accuracy} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {subtopicProgress.correct}/{subtopicProgress.attempted} correct
                          </div>
                        </div>
                      )}

                      {availableQuestions === 0 ? (
                        <Badge variant="outline" className="w-full justify-center">
                          All questions completed!
                        </Badge>
                      ) : (
                        <div className="text-sm text-muted-foreground">Click to start practicing this topic</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
