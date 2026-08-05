"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, LogOut, Mail, Shield, Loader2 } from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setProfile({
          name: user.user_metadata?.name || user.email?.split("@")[0] || "Student User",
          email: user.email || "",
        });
      }
      setLoading(false);
    }

    loadUser();
  }, [supabase]);

  async function handleSignOut() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#18181B] dark:text-[#F4F4F5]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 md:p-8 rounded-2xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-white dark:bg-[#1E1E1E]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#18181B]/5 dark:bg-[#F4F4F5]/10 border border-[#EAE8E3] dark:border-[#2D2D2D] flex items-center justify-center text-[#18181B] dark:text-[#F4F4F5] font-semibold text-xl">
            {profile?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[#1A1A1A] dark:text-[#F4F4F5]">
              {profile?.name}
            </h2>
            <p className="text-xs text-[#706E6B] dark:text-[#A1A1AA] flex items-center gap-1 mt-0.5 font-medium">
              <Mail className="w-3.5 h-3.5" />
              {profile?.email}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 rounded-2xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-white dark:bg-[#1E1E1E] space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#706E6B] dark:text-[#A1A1AA]">
          Account & Security
        </h3>

        <div className="flex items-center justify-between py-3 border-b border-[#EAE8E3]/80 dark:border-[#2D2D2D]/80 text-sm">
          <span className="flex items-center gap-2.5 text-[#1A1A1A] dark:text-[#F4F4F5] font-medium">
            <Shield className="w-4 h-4 text-[#706E6B]" />
            Session Status
          </span>
          <span className="text-xs font-semibold text-[#2E6F40] dark:text-[#4ADE80] uppercase tracking-wider">
            Authenticated
          </span>
        </div>

        <button
          onClick={handleSignOut}
          disabled={loggingOut}
          className="w-full mt-3 py-3 px-4 rounded-xl text-sm font-semibold border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-[#9E2A2B] dark:text-[#F87171] hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
        >
          {loggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
