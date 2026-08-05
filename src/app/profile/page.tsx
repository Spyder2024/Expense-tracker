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
        <Loader2 className="w-6 h-6 animate-spin text-[#2C3E35] dark:text-[#4A5D53]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 md:p-8 rounded-2xl border border-[#E5E4E0] dark:border-[#333330] bg-white dark:bg-[#252523]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#2C3E35]/10 dark:bg-[#4A5D53]/20 border border-[#2C3E35]/20 dark:border-[#4A5D53]/30 flex items-center justify-center text-[#2C3E35] dark:text-[#8C7A6B] font-serif font-bold text-xl">
            {profile?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-[#2C2A29] dark:text-[#EAE9E5]">
              {profile?.name}
            </h2>
            <p className="text-xs text-[#666461] dark:text-[#A09E98] flex items-center gap-1 mt-0.5 font-medium">
              <Mail className="w-3.5 h-3.5" />
              {profile?.email}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 rounded-2xl border border-[#E5E4E0] dark:border-[#333330] bg-white dark:bg-[#252523] space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#8C7A6B] dark:text-[#A09E98]">
          Account & Security
        </h3>

        <div className="flex items-center justify-between py-3 border-b border-[#E5E4E0]/80 dark:border-[#333330]/80 text-sm">
          <span className="flex items-center gap-2.5 text-[#2C2A29] dark:text-[#EAE9E5] font-medium">
            <Shield className="w-4 h-4 text-[#8C7A6B]" />
            Session Status
          </span>
          <span className="text-xs font-bold text-[#556B2F] dark:text-[#7A9A43] uppercase tracking-wider">
            Authenticated
          </span>
        </div>

        <button
          onClick={handleSignOut}
          disabled={loggingOut}
          className="w-full mt-3 py-3 px-4 rounded-xl text-sm font-medium border border-[#8B4513]/30 bg-[#8B4513]/5 dark:bg-[#C46D3B]/10 text-[#8B4513] dark:text-[#C46D3B] hover:bg-[#8B4513]/15 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
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
