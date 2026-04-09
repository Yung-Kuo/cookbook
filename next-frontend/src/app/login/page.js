"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  clearStoredReturnPath,
  getPostLoginDestination,
  rememberReturnPathFromNextParam,
} from "@/utils/postLoginRedirect";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

function getRedirectUri() {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/login`;
}

function buildGoogleAuthUrl() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: "google",
    access_type: "online",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

function buildGitHubAuthUrl() {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    scope: "user:email",
    state: "github",
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

function LoginContent() {
  const { isAuthenticated, socialLogin, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (code && state) return;

    const next = searchParams.get("next");
    if (next) {
      rememberReturnPathFromNextParam(next);
    } else {
      clearStoredReturnPath();
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(getPostLoginDestination(searchParams));
      return;
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state || loading) return;

    const storageKey = `oauth_handled_${code}`;
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem(storageKey)
    ) {
      return;
    }

    if (handledRef.current) return;
    handledRef.current = true;

    if (typeof window !== "undefined") {
      sessionStorage.setItem(storageKey, "1");
    }

    socialLogin(state, code)
      .then(() => router.push(getPostLoginDestination(searchParams)))
      .catch((err) => {
        console.error("OAuth login failed:", err);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(storageKey);
        }
        handledRef.current = false;
      });
  }, [searchParams, loading, isAuthenticated, socialLogin, router]);

  const code = searchParams.get("code");
  if (code) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-800 text-xl text-neutral-400">
        Signing you in...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 bg-neutral-800 text-neutral-100">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold">Welcome to Cookbook</h1>
        <p className="text-neutral-400">Sign in to manage your personal recipe collection</p>
      </div>

      <div className="flex flex-col gap-4 w-72">
        <a
          href={buildGoogleAuthUrl()}
          className="flex items-center justify-center gap-3 rounded-lg bg-white px-6 py-3 text-sm font-medium text-neutral-800 transition-all hover:bg-neutral-200"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </a>

        <a
          href={buildGitHubAuthUrl()}
          className="flex items-center justify-center gap-3 rounded-lg bg-neutral-700 px-6 py-3 text-sm font-medium text-neutral-100 transition-all hover:bg-neutral-600"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Sign in with GitHub
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-neutral-800 text-xl text-neutral-400">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
