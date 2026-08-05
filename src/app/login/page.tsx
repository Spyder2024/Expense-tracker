"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail, User as UserIcon, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setErrorMsg("Please enter your full name.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name.trim(),
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setInfoMsg("Account created! Check your inbox if email confirmation is enabled.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.session) {
          router.push("/");
          router.refresh();
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] py-6">
      <div className="w-full max-w-sm p-6 md:p-8 rounded-2xl border border-[#E5E4E0] dark:border-[#333330] bg-white dark:bg-[#252523]">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#2C3E35]/10 dark:bg-[#4A5D53]/20 border border-[#2C3E35]/20 dark:border-[#4A5D53]/30 flex items-center justify-center text-[#2C3E35] dark:text-[#8C7A6B]">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#2C2A29] dark:text-[#EAE9E5]">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-xs text-[#8C7A6B] dark:text-[#A09E98] mt-1 font-medium">
            Student Money Tracker • Old Money Minimalist
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 mb-6 rounded-xl bg-[#F9F8F6] dark:bg-[#1C1C1A] border border-[#E5E4E0]/80 dark:border-[#333330]/80">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === "login"
                ? "bg-white dark:bg-[#252523] text-[#2C2A29] dark:text-[#EAE9E5] shadow-xs font-bold"
                : "text-[#666461] dark:text-[#A09E98] hover:text-[#2C2A29]"
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
                ? "bg-white dark:bg-[#252523] text-[#2C2A29] dark:text-[#EAE9E5] shadow-xs font-bold"
                : "text-[#666461] dark:text-[#A09E98] hover:text-[#2C2A29]"
            }`}
          >
            Sign Up
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-[#8B4513] dark:text-[#C46D3B] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#556B2F]/10 border border-[#556B2F]/30 text-[#556B2F] dark:text-[#7A9A43] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C7A6B] dark:text-[#A09E98] mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-0 top-3 text-[#8C7A6B] dark:text-[#A09E98]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivers"
                  className="w-full pl-7 pr-2 py-2.5 text-sm bg-transparent border-b border-[#E5E4E0] dark:border-[#333330] focus:border-[#2C3E35] dark:focus:border-[#4A5D53] focus:outline-hidden text-[#2C2A29] dark:text-[#EAE9E5]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C7A6B] dark:text-[#A09E98] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-0 top-3 text-[#8C7A6B] dark:text-[#A09E98]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full pl-7 pr-2 py-2.5 text-sm bg-transparent border-b border-[#E5E4E0] dark:border-[#333330] focus:border-[#2C3E35] dark:focus:border-[#4A5D53] focus:outline-hidden text-[#2C2A29] dark:text-[#EAE9E5]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C7A6B] dark:text-[#A09E98] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-0 top-3 text-[#8C7A6B] dark:text-[#A09E98]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-7 pr-2 py-2.5 text-sm bg-transparent border-b border-[#E5E4E0] dark:border-[#333330] focus:border-[#2C3E35] dark:focus:border-[#4A5D53] focus:outline-hidden text-[#2C2A29] dark:text-[#EAE9E5]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-sm font-medium bg-[#2C3E35] hover:bg-[#1F2937] dark:bg-[#4A5D53] dark:hover:bg-[#3B4C43] text-[#F9F8F6] transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] mt-2"
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
    </div>
  );
}
