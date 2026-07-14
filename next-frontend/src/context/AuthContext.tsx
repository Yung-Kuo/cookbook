"use client"

import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  socialLogin as apiSocialLogin,
  logout as apiLogout,
  fetchCurrentUser,
} from "@/api/auth"
import { queryKeys } from "@/lib/queryKeys"
import type { AuthUser } from "@/types"

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  socialLogin: (provider: string, code: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const { data: user = null, isPending: loading } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: fetchCurrentUser,
    staleTime: 60 * 1000,
    retry: false,
  })

  const socialLogin = useCallback(
    async (provider: string, code: string) => {
      await apiSocialLogin(provider, code)
      queryClient.removeQueries({ queryKey: queryKeys.recipes.all() })
      queryClient.removeQueries({ queryKey: queryKeys.collections.all() })
      queryClient.removeQueries({ queryKey: queryKeys.pinned.all() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    await apiLogout()
    queryClient.removeQueries({ queryKey: queryKeys.recipes.all() })
    queryClient.removeQueries({ queryKey: queryKeys.collections.all() })
    queryClient.removeQueries({ queryKey: queryKeys.pinned.all() })
    queryClient.setQueryData(queryKeys.auth.me(), null)
  }, [queryClient])

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    socialLogin,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
