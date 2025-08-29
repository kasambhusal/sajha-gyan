"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { getFromStorage, STORAGE_KEYS } from "@/lib/localStorage"

export default function HistoryPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [testHistory, setTestHistory] = useState(null)
  const [filteredTests, setFilteredTests] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSubject, setFilterSubject] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [currentPage, setCurrentPage] = useState(1)
  const testsPerPage = 10

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
      return
    }

    if (user) {
      const userTestHistory = getFromStorage(STORAGE_KEYS.TEST_HISTORY)
      setTestHistory(userTestHistory)
      setFilteredTests(userTestHistory?.tests || [])
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (!testHistory?.tests) return

    let filtered = [...testHistory.tests]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (test) =>
          test.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          test.subtopic.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply subject filter
    if (filterSubject !== "all") {
      filtered = filtered.filter((test) => test.subject === filterSubject)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date) - new Date(a.date)
        case "score":
          return (b.score || 0) - (a.score || 0)
        case "questions":
          return (b.questions || 0) - (a.questions || 0)
        default:
          return 0
      }
    })

    setFilteredTests(filtered)
    setCurrentPage(1)
  }, [testHistory, searchTerm, filterSubject, sortBy])

  const getUniqueSubjects = () => {
    if (!testHistory?.tests) return []
    const subjects = [...new Set(testHistory.tests.map((test) => test.subject))]
    return subjects.filter((subject) => subject !== "mixed")
  }

  const formatDuration = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "bg-primary"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const handleTestDetails = (test) => {
    // For now, just show an alert with test details
    // In a real app, this could open a modal or navigate to a detailed view
    alert(
      `Test Details:\nSubject: ${test.subject}\nSubtopic: ${test.subtopic}\nScore: ${test.score}%\nQuestions: ${test.correct}/${test.questions}`,
    )
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  // Pagination
  const totalPages = Math.ceil(filteredTests.length / testsPerPage)
  const startIndex = (currentPage - 1) * testsPerPage
  const paginatedTests = filteredTests.slice(startIndex, startIndex + testsPerPage)

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
                <h1 className="text-xl font-bold">Test History</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredTests.length} test{filteredTests.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <Input
                  placeholder="Search by subject or topic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    <SelectItem value="mixed">Mixed Practice</SelectItem>
                    {getUniqueSubjects().map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date (Newest)</SelectItem>
                    <SelectItem value="score">Score (Highest)</SelectItem>
                    <SelectItem value="questions">Questions (Most)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Results</label>
                <div className="text-sm text-muted-foreground pt-2">
                  Showing {startIndex + 1}-{Math.min(startIndex + testsPerPage, filteredTests.length)} of{" "}
                  {filteredTests.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test History List */}
        {paginatedTests.length > 0 ? (
          <div className="space-y-4">
            {paginatedTests.map((test, index) => (
              <Card key={test.id || index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(test.score)}`}
                      >
                        {test.score}%
                      </div>
                      <div>
                        <h3 className="font-semibold capitalize">
                          {test.subject === "mixed" ? "Mixed Practice" : test.subject}
                          {test.subtopic !== "random" && test.subtopic !== test.subject && (
                            <span className="text-muted-foreground"> • {test.subtopic}</span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{new Date(test.date).toLocaleDateString()}</span>
                          <span>
                            {test.correct}/{test.questions} correct
                          </span>
                          <span>{formatDuration(test.totalTime)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={test.score >= 80 ? "default" : test.score >= 60 ? "secondary" : "destructive"}>
                        {test.score >= 80 ? "Excellent" : test.score >= 60 ? "Good" : "Needs Work"}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => handleTestDetails(test)}>
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-semibold mb-2">No Test History Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterSubject !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "Start taking practice tests to see your history here."}
              </p>
              <Button onClick={() => router.push("/practice")}>Start Practicing</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
