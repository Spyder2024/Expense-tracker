"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Navigation() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Debts",
      href: "/debts",
      icon: Wallet,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
    },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1E1E1E] border-t border-[#EAE8E3] dark:border-[#2D2D2D]">
        <div className="flex items-center justify-around h-16 px-4 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full px-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "text-[#18181B] dark:text-[#F4F4F5] font-semibold"
                    : "text-[#706E6B] dark:text-[#A1A1AA] hover:text-[#1A1A1A] dark:hover:text-[#F4F4F5]"
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-1 ${
                    isActive ? "stroke-[2.5px]" : "stroke-2"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop / Tablet Left Sidebar (>= 768px) */}
      <aside className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 z-40 bg-white dark:bg-[#1E1E1E] border-r border-[#EAE8E3] dark:border-[#2D2D2D] p-6 justify-between">
        <div className="space-y-8">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#18181B] dark:bg-[#F4F4F5] text-white dark:text-[#121212] flex items-center justify-center font-bold text-lg">
                M
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-[#1A1A1A] dark:text-[#F4F4F5] leading-none">
                  Money Tracker
                </h1>
                <span className="text-[10px] tracking-widest uppercase font-semibold text-[#706E6B] dark:text-[#A1A1AA]">
                  Business Minimalist
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#18181B] dark:bg-[#F4F4F5] text-white dark:text-[#121212] font-semibold shadow-xs"
                      : "text-[#706E6B] dark:text-[#A1A1AA] hover:bg-[#FAF9F6] dark:hover:bg-[#121212] hover:text-[#1A1A1A] dark:hover:text-[#F4F4F5]"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Theme Toggle */}
        <div className="pt-4 border-t border-[#EAE8E3] dark:border-[#2D2D2D] flex items-center justify-between">
          <span className="text-xs text-[#706E6B] dark:text-[#A1A1AA] font-medium">
            Appearance
          </span>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
