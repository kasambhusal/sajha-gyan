"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import subjectsData from "@/data/subjects.json"

export default function PracticePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  const handleSubjectSelect = (subjectId) => {
    router.push(`/practice/${subjectId}`)
  }

  const handleRandomPractice = () => {
    router.push("/practice/random")
  }

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
                <h1 className="text-xl font-bold">Practice Center</h1>
                <p className="text-sm text-muted-foreground">Choose a subject to start practicing</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Random Practice Option */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">🎲</span>
              <span>Random Practice</span>
            </CardTitle>
            <CardDescription>Get questions from all subjects for a comprehensive practice session</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRandomPractice} size="lg">
              Start Random Practice
            </Button>
          </CardContent>
        </Card>

        {/* Subject Selection */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Choose a Subject</h2>
            <p className="text-muted-foreground">Select a subject to practice specific topics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjectsData.map((subject) => (
              <Card
                key={subject.subjectId}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleSubjectSelect(subject.subjectId)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <span className="text-3xl">{subject.icon}</span>
                    <span>{subject.title}</span>
                  </CardTitle>
                  <CardDescription>{subject.subtopics.length} topics available</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {subject.subtopics.slice(0, 3).map((subtopic) => (
                        <Badge key={subtopic.subtopicId} variant="secondary" className="text-xs">
                          {subtopic.title}
                        </Badge>
                      ))}
                      {subject.subtopics.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{subject.subtopics.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Questions:{" "}
                      {subject.subtopics.reduce((total, subtopic) => total + subtopic.questions.length, 0)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
