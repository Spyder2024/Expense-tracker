"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on authentication pages
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full px-2 text-xs font-medium transition-colors ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-500 font-semibold"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
