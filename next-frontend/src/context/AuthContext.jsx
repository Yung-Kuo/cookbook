"use client"

import { createContext, useCallback, useContext } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  socialLogin as apiSocialLogin,
  logout as apiLogout,
  fetchCurrentUser,
} from "@/api/auth"
import { queryKeys } from "@/lib/queryKeys"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const { data: user = null, isPending: loading } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: fetchCurrentUser,
    staleTime: 60 * 1000,
    retry: false,
  })

  const socialLogin = useCallback(
    async (provider, code) => {
      await apiSocialLogin(provider, code)
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    await apiLogout()
    queryClient.setQueryData(queryKeys.auth.me(), null)
  }, [queryClient])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    socialLogin,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
