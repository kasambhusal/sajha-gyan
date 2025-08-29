export const STORAGE_KEYS = {
  USER_PROFILE: "sajhagyan_user_profile",
  USER_PROGRESS: "sajhagyan_user_progress",
  TEST_HISTORY: "sajhagyan_test_history",
  STUDY_PLAN: "sajhagyan_study_plan",
}

export const getFromStorage = (key) => {
  if (typeof window === "undefined") return null
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error("Error reading from localStorage:", error)
    return null
  }
}

export const saveToStorage = (key, data) => {
  if (typeof window === "undefined") return false
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error("Error saving to localStorage:", error)
    return false
  }
}

export const initializeUserData = (studentId, name) => {
  const userProfile = {
    studentId,
    name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`,
    joinDate: new Date().toISOString(),
    totalTests: 0,
    totalQuestions: 0,
    correctAnswers: 0,
  }

  const userProgress = {
    studentId,
    subjects: {},
    lastActivity: new Date().toISOString(),
  }

  const testHistory = {
    studentId,
    tests: [],
  }

  const studyPlan = {
    studentId,
    recommendations: [],
    weakAreas: [],
    strengths: [],
    nextGoals: [],
  }

  saveToStorage(STORAGE_KEYS.USER_PROFILE, userProfile)
  saveToStorage(STORAGE_KEYS.USER_PROGRESS, userProgress)
  saveToStorage(STORAGE_KEYS.TEST_HISTORY, testHistory)
  saveToStorage(STORAGE_KEYS.STUDY_PLAN, studyPlan)

  return { userProfile, userProgress, testHistory, studyPlan }
}

export const updateUserProgress = (subjectId, subtopicId, questionId, isCorrect, timeTaken) => {
  const progress = getFromStorage(STORAGE_KEYS.USER_PROGRESS) || { subjects: {} }
  const profile = getFromStorage(STORAGE_KEYS.USER_PROFILE) || {}

  if (!progress.subjects[subjectId]) {
    progress.subjects[subjectId] = {}
  }

  if (!progress.subjects[subjectId][subtopicId]) {
    progress.subjects[subjectId][subtopicId] = {
      attempted: 0,
      correct: 0,
      history: [],
      averageTime: 0,
      lastAttempt: null,
    }
  }

  const subtopic = progress.subjects[subjectId][subtopicId]
  subtopic.attempted += 1
  if (isCorrect) subtopic.correct += 1

  subtopic.history.push({
    questionId,
    result: isCorrect ? "correct" : "incorrect",
    timestamp: Date.now(),
    timeTaken,
  })

  subtopic.lastAttempt = new Date().toISOString()
  subtopic.averageTime = subtopic.history.reduce((sum, h) => sum + (h.timeTaken || 0), 0) / subtopic.history.length

  progress.lastActivity = new Date().toISOString()

  // Update profile stats
  profile.totalQuestions = (profile.totalQuestions || 0) + 1
  if (isCorrect) profile.correctAnswers = (profile.correctAnswers || 0) + 1

  saveToStorage(STORAGE_KEYS.USER_PROGRESS, progress)
  saveToStorage(STORAGE_KEYS.USER_PROFILE, profile)

  return progress
}

export const addTestResult = (testData) => {
  const history = getFromStorage(STORAGE_KEYS.TEST_HISTORY) || { tests: [] }
  const profile = getFromStorage(STORAGE_KEYS.USER_PROFILE) || {}

  history.tests.unshift({
    id: `test_${Date.now()}`,
    ...testData,
    date: new Date().toISOString(),
  })

  // Keep only last 50 tests
  if (history.tests.length > 50) {
    history.tests = history.tests.slice(0, 50)
  }

  profile.totalTests = (profile.totalTests || 0) + 1

  saveToStorage(STORAGE_KEYS.TEST_HISTORY, history)
  saveToStorage(STORAGE_KEYS.USER_PROFILE, profile)

  return history
}

export const getAttemptedQuestions = (subjectId, subtopicId = null) => {
  const progress = getFromStorage(STORAGE_KEYS.USER_PROGRESS) || { subjects: {} }
  const attemptedIds = new Set()

  if (subtopicId) {
    const subtopic = progress.subjects[subjectId]?.[subtopicId]
    if (subtopic?.history) {
      subtopic.history.forEach((h) => attemptedIds.add(h.questionId))
    }
  } else {
    const subject = progress.subjects[subjectId]
    if (subject) {
      Object.values(subject).forEach((subtopic) => {
        if (subtopic.history) {
          subtopic.history.forEach((h) => attemptedIds.add(h.questionId))
        }
      })
    }
  }

  return Array.from(attemptedIds)
}

export const generateStudyPlan = () => {
  const progress = getFromStorage(STORAGE_KEYS.USER_PROGRESS) || { subjects: {} }
  const plan = getFromStorage(STORAGE_KEYS.STUDY_PLAN) || { recommendations: [], weakAreas: [], strengths: [] }

  const weakAreas = []
  const strengths = []
  const recommendations = []

  Object.entries(progress.subjects).forEach(([subjectId, subject]) => {
    Object.entries(subject).forEach(([subtopicId, subtopic]) => {
      if (subtopic.attempted > 0) {
        const accuracy = subtopic.correct / subtopic.attempted
        const area = { subjectId, subtopicId, accuracy, attempted: subtopic.attempted }

        if (accuracy < 0.6 && subtopic.attempted >= 3) {
          weakAreas.push(area)
        } else if (accuracy >= 0.8 && subtopic.attempted >= 5) {
          strengths.push(area)
        }
      }
    })
  })

  // Generate recommendations
  weakAreas.forEach((area) => {
    recommendations.push({
      type: "improvement",
      subject: area.subjectId,
      subtopic: area.subtopicId,
      message: `Focus on ${area.subtopicId} - current accuracy: ${Math.round(area.accuracy * 100)}%`,
      priority: "high",
    })
  })

  plan.weakAreas = weakAreas
  plan.strengths = strengths
  plan.recommendations = recommendations
  plan.lastUpdated = new Date().toISOString()

  saveToStorage(STORAGE_KEYS.STUDY_PLAN, plan)
  return plan
}
