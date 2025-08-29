"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { getFromStorage, STORAGE_KEYS } from "@/lib/localStorage"

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing user session
    const userProfile = getFromStorage(STORAGE_KEYS.USER_PROFILE)
    if (userProfile) {
      setUser(userProfile)
    }
    setIsLoading(false)
  }, [])

  const logout = () => {
    // Clear all localStorage data
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
    setUser(null)
  }

  const updateUser = (userData) => {
    setUser(userData)
  }

  return <AuthContext.Provider value={{ user, isLoading, logout, updateUser }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
