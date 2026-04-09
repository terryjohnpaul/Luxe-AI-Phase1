"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    // In production, this calls NextAuth's signIn("google")
    // For now, redirect to dashboard directly for development
    window.location.href = "/dashboard/command-center";
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-blue flex items-center justify-center">
              <Sparkles className="text-white" size={24} />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white">LUXE AI</h1>
              <p className="text-xs text-white/50">Marketing Intelligence Platform</p>
            </div>
          </div>
          <p className="text-white/60 text-sm">
            AI-powered marketing automation for luxury fashion
          </p>
        </div>

        {/* Sign In Card */}
        <div className="glass-card p-8">
          <h2 className="text-lg font-semibold text-center mb-6">
            Sign in to your account
          </h2>

          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-card-border hover:bg-surface transition-colors disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
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
            {isLoading ? "Signing in..." : "Continue with Google"}
          </button>

          <p className="text-xs text-muted text-center mt-6">
            By signing in, you agree to the terms of service.
            <br />
            Only authorized Ajio Luxe team members can access this platform.
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { label: "12 Modules", desc: "Complete platform" },
            { label: "500+ Ads", desc: "AI-managed units" },
            { label: "4hr Loop", desc: "Auto-optimization" },
          ].map((f) => (
            <div key={f.label} className="text-center">
              <p className="text-white font-semibold text-sm">{f.label}</p>
              <p className="text-white/40 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
