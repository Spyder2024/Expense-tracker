"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-white dark:bg-[#1E1E1E]" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2.5 rounded-xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-white dark:bg-[#1E1E1E] text-[#1A1A1A] dark:text-[#F4F4F5] hover:bg-[#FAF9F6] dark:hover:bg-[#121212] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
      aria-label="Toggle Theme"
      type="button"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-[#F4F4F5]" />
      ) : (
        <Moon className="w-4 h-4 text-[#18181B]" />
      )}
    </button>
  );
}
