"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { updateUserProgress, addTestResult, getAttemptedQuestions } from "@/lib/localStorage"
import subjectsData from "@/data/subjects.json"

export default function SubtopicTestPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { subject: subjectId, subtopic: subtopicId } = params

  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [writtenAnswer, setWrittenAnswer] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [testResults, setTestResults] = useState([])
  const [testCompleted, setTestCompleted] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [questionStartTime, setQuestionStartTime] = useState(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
      return
    }

    if (user) {
      initializeTest()
    }
  }, [user, isLoading, router, subjectId, subtopicId])

  const initializeTest = () => {
    // Find subject and subtopic
    const subject = subjectsData.find((s) => s.subjectId === subjectId)
    if (!subject) {
      router.push("/practice")
      return
    }

    const subtopic = subject.subtopics.find((st) => st.subtopicId === subtopicId)
    if (!subtopic) {
      router.push(`/practice/${subjectId}`)
      return
    }

    // Get attempted questions to filter out
    const attemptedIds = getAttemptedQuestions(subjectId, subtopicId)
    const availableQuestions = subtopic.questions.filter((q) => !attemptedIds.includes(q.id))

    if (availableQuestions.length === 0) {
      // No more questions available
      router.push(`/practice/${subjectId}`)
      return
    }

    // Shuffle and take up to 10 questions
    const shuffledQuestions = [...availableQuestions].sort(() => Math.random() - 0.5)
    const testQuestions = shuffledQuestions.slice(0, Math.min(10, shuffledQuestions.length))

    setQuestions(testQuestions)
    setStartTime(Date.now())
    setQuestionStartTime(Date.now())
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const handleAnswerSubmit = () => {
    if (!currentQuestion) return

    const timeTaken = Date.now() - questionStartTime
    let correct = false

    if (currentQuestion.type === "mcq") {
      const selectedIndex = Number.parseInt(selectedAnswer)
      correct = selectedIndex === currentQuestion.correctAnswer
    } else {
      // For written questions, we'll mark as correct for demo purposes
      // In a real app, this would need AI evaluation or manual grading
      correct = writtenAnswer.trim().length > 10 // Simple validation
    }

    setIsCorrect(correct)
    setShowFeedback(true)

    // Update progress
    updateUserProgress(subjectId, subtopicId, currentQuestion.id, correct, timeTaken)

    // Store result
    const result = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      type: currentQuestion.type,
      userAnswer: currentQuestion.type === "mcq" ? selectedAnswer : writtenAnswer,
      correctAnswer: currentQuestion.type === "mcq" ? currentQuestion.correctAnswer : currentQuestion.answerGuide,
      isCorrect: correct,
      timeTaken,
      explanation: currentQuestion.explanation || currentQuestion.answerGuide,
    }

    setTestResults([...testResults, result])
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer("")
      setWrittenAnswer("")
      setShowFeedback(false)
      setQuestionStartTime(Date.now())
    } else {
      // Test completed
      completeTest()
    }
  }

  const completeTest = () => {
    const totalTime = Date.now() - startTime
    const correctCount = testResults.filter((r) => r.isCorrect).length + (isCorrect ? 1 : 0)

    const testData = {
      subject: subjectId,
      subtopic: subtopicId,
      questions: testResults.length + 1,
      correct: correctCount,
      score: Math.round((correctCount / (testResults.length + 1)) * 100),
      totalTime,
      results: [
        ...testResults,
        {
          questionId: currentQuestion.id,
          question: currentQuestion.question,
          type: currentQuestion.type,
          userAnswer: currentQuestion.type === "mcq" ? selectedAnswer : writtenAnswer,
          correctAnswer: currentQuestion.type === "mcq" ? currentQuestion.correctAnswer : currentQuestion.answerGuide,
          isCorrect,
          timeTaken: Date.now() - questionStartTime,
          explanation: currentQuestion.explanation || currentQuestion.answerGuide,
        },
      ],
    }

    addTestResult(testData)
    setTestCompleted(true)
  }

  const handleReturnToDashboard = () => {
    router.push("/dashboard")
  }

  const handleRetrySubtopic = () => {
    router.push(`/practice/${subjectId}/${subtopicId}`)
  }

  if (isLoading || questions.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  if (testCompleted) {
    const finalResults = [
      ...testResults,
      {
        questionId: currentQuestion.id,
        isCorrect,
        timeTaken: Date.now() - questionStartTime,
      },
    ]
    const correctCount = finalResults.filter((r) => r.isCorrect).length
    const accuracy = Math.round((correctCount / finalResults.length) * 100)

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-primary-foreground">🎉</span>
            </div>
            <CardTitle className="text-2xl">Test Completed!</CardTitle>
            <CardDescription>Great job on completing the {subtopicId.replace("-", " ")} test</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {correctCount}/{finalResults.length}
                </div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.round((Date.now() - startTime) / 1000)}s</div>
                <div className="text-sm text-muted-foreground">Time</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Performance Feedback</h3>
              {accuracy >= 80 && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-primary font-medium">Excellent work! 🌟</p>
                  <p className="text-sm text-muted-foreground">You have a strong understanding of this topic.</p>
                </div>
              )}
              {accuracy >= 60 && accuracy < 80 && (
                <div className="p-4 bg-yellow-500/10 rounded-lg">
                  <p className="text-yellow-600 font-medium">Good progress! 📈</p>
                  <p className="text-sm text-muted-foreground">Keep practicing to improve your understanding.</p>
                </div>
              )}
              {accuracy < 60 && (
                <div className="p-4 bg-red-500/10 rounded-lg">
                  <p className="text-red-600 font-medium">Keep practicing! 💪</p>
                  <p className="text-sm text-muted-foreground">Review the concepts and try again.</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button onClick={handleReturnToDashboard} className="flex-1">
                Return to Dashboard
              </Button>
              <Button variant="outline" onClick={handleRetrySubtopic} className="flex-1 bg-transparent">
                Practice More
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push(`/practice/${subjectId}`)}>
                ← Back
              </Button>
              <div>
                <h1 className="text-xl font-bold capitalize">{subtopicId.replace("-", " ")} Practice</h1>
                <p className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>
            <Badge variant="outline">{Math.round(progress)}% Complete</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    currentQuestion.difficulty === "easy"
                      ? "default"
                      : currentQuestion.difficulty === "medium"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {currentQuestion.difficulty}
                </Badge>
                <Badge variant="outline">{currentQuestion.type === "mcq" ? "Multiple Choice" : "Written Answer"}</Badge>
              </div>
              <CardTitle className="text-lg leading-relaxed">{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent>
              {currentQuestion.type === "mcq" ? (
                <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              ) : (
                <div className="space-y-3">
                  <Label htmlFor="written-answer">Your Answer:</Label>
                  <Textarea
                    id="written-answer"
                    placeholder="Write your detailed answer here..."
                    value={writtenAnswer}
                    onChange={(e) => setWrittenAnswer(e.target.value)}
                    rows={6}
                  />
                  <p className="text-sm text-muted-foreground">
                    Provide a comprehensive answer with examples where applicable.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback Card */}
          {showFeedback && (
            <Card
              className={`mb-6 border-2 ${isCorrect ? "border-primary bg-primary/5" : "border-red-500 bg-red-500/5"}`}
            >
              <CardHeader>
                <CardTitle className={`flex items-center space-x-2 ${isCorrect ? "text-primary" : "text-red-600"}`}>
                  <span>{isCorrect ? "✅" : "❌"}</span>
                  <span>{isCorrect ? "Correct!" : "Incorrect"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentQuestion.type === "mcq" && !isCorrect && (
                    <div>
                      <p className="font-medium">Correct Answer:</p>
                      <p className="text-primary">{currentQuestion.options[currentQuestion.correctAnswer]}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">Explanation:</p>
                    <p className="text-muted-foreground">
                      {currentQuestion.explanation || currentQuestion.answerGuide}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center">
            {!showFeedback ? (
              <Button
                onClick={handleAnswerSubmit}
                disabled={currentQuestion.type === "mcq" ? !selectedAnswer : !writtenAnswer.trim()}
                size="lg"
              >
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNextQuestion} size="lg">
                {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Complete Test"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
