"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { Lock, Mail, User as UserIcon, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

function LoginFormContent() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const env = getSupabaseEnv();
    setIsConfigured(env.isConfigured);

    if (searchParams.get("error") === "auth_callback_failed") {
      setErrorMsg("Authentication callback failed or link expired. Please try logging in again.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    if (!isConfigured) {
      setErrorMsg("Supabase environment variables are missing. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your project environment variables.");
      setLoading(false);
      return;
    }

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setErrorMsg("Please enter your full name.");
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMsg("Password must be at least 6 characters long.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim(),
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setInfoMsg("Account registered successfully! Check your email for a confirmation link.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setErrorMsg("Incorrect email or password. Please check your credentials.");
          } else {
            setErrorMsg(error.message);
          }
        } else if (data.session) {
          router.push("/");
          router.refresh();
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm p-6 md:p-8 rounded-2xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-white dark:bg-[#1E1E1E]">
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#18181B]/5 dark:bg-[#F4F4F5]/10 border border-[#EAE8E3] dark:border-[#2D2D2D] flex items-center justify-center text-[#18181B] dark:text-[#F4F4F5]">
          <Lock className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#1A1A1A] dark:text-[#F4F4F5]">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-xs text-[#706E6B] dark:text-[#A1A1AA] mt-1 font-medium">
          Student Money Tracker • Secure Auth
        </p>
      </div>

      {!isConfigured && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            Supabase Not Connected
          </p>
          <p className="text-[11px] leading-relaxed">
            Add <code className="font-mono font-bold">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="font-mono font-bold">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel settings to enable authentication.
          </p>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex p-1 mb-6 rounded-xl bg-[#FAF9F6] dark:bg-[#121212] border border-[#EAE8E3]/80 dark:border-[#2D2D2D]/80">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setErrorMsg(null);
            setInfoMsg(null);
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === "login"
              ? "bg-white dark:bg-[#1E1E1E] text-[#1A1A1A] dark:text-[#F4F4F5] shadow-xs font-bold"
              : "text-[#706E6B] dark:text-[#A1A1AA] hover:text-[#1A1A1A]"
          }`}
        >
          Log In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setErrorMsg(null);
            setInfoMsg(null);
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === "signup"
              ? "bg-white dark:bg-[#1E1E1E] text-[#1A1A1A] dark:text-[#F4F4F5] shadow-xs font-bold"
              : "text-[#706E6B] dark:text-[#A1A1AA] hover:text-[#1A1A1A]"
          }`}
        >
          Sign Up
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-[#9E2A2B] dark:text-[#F87171] text-xs font-medium flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {infoMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-[#2E6F40]/10 border border-[#2E6F40]/30 text-[#2E6F40] dark:text-[#4ADE80] text-xs font-medium flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{infoMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#706E6B] dark:text-[#A1A1AA] mb-1">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-0 top-3 text-[#706E6B] dark:text-[#A1A1AA]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivers"
                className="w-full pl-7 pr-2 py-2.5 text-sm font-normal bg-transparent border-b border-[#EAE8E3] dark:border-[#2D2D2D] focus:border-[#18181B] dark:focus:border-[#F4F4F5] focus:outline-hidden text-[#1A1A1A] dark:text-[#F4F4F5]"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#706E6B] dark:text-[#A1A1AA] mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-0 top-3 text-[#706E6B] dark:text-[#A1A1AA]" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              className="w-full pl-7 pr-2 py-2.5 text-sm font-normal bg-transparent border-b border-[#EAE8E3] dark:border-[#2D2D2D] focus:border-[#18181B] dark:focus:border-[#F4F4F5] focus:outline-hidden text-[#1A1A1A] dark:text-[#F4F4F5]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#706E6B] dark:text-[#A1A1AA] mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-0 top-3 text-[#706E6B] dark:text-[#A1A1AA]" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-7 pr-2 py-2.5 text-sm font-normal bg-transparent border-b border-[#EAE8E3] dark:border-[#2D2D2D] focus:border-[#18181B] dark:focus:border-[#F4F4F5] focus:outline-hidden text-[#1A1A1A] dark:text-[#F4F4F5]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-[#18181B] hover:bg-[#27272A] dark:bg-[#F4F4F5] dark:hover:bg-[#E4E4E7] text-white dark:text-[#121212] transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{mode === "login" ? "Logging in..." : "Creating account..."}</span>
            </>
          ) : (
            <span>{mode === "login" ? "Log In" : "Sign Up"}</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] py-6 font-sans">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#18181B] dark:text-[#F4F4F5]" />
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
