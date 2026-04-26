"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Clock, Link as LinkIcon, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

const navigation = [
  { name: "Event types", href: "/", icon: LinkIcon, matchExact: true },
  { name: "Bookings", href: "/bookings", icon: Calendar, matchExact: false },
  { name: "Availability", href: "/availability", icon: Clock, matchExact: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logoutState } = useAuth();

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111] shrink-0">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white pb-0.5 hover:opacity-80 transition-opacity">SlotSync</span>
        </Link>
        <button onClick={logoutState} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full w-56 flex-col border-r border-gray-200 bg-gray-50 px-4 py-6 dark:border-zinc-800 dark:bg-gradient-to-b dark:from-[#222222] dark:to-[#111111]">
        <div className="mb-8 flex items-center px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-900 text-white font-bold dark:bg-white dark:text-black">
            S
          </div>
          <span className="ml-3 text-lg font-bold text-gray-900 dark:text-white">SlotSync</span>
        </div>

        <nav className="flex-1 space-y-1 flex flex-col">
          <div className="flex-1 space-y-1">
            {navigation.map((item) => {
              let isActive = false;
              if (item.matchExact) {
                 isActive = pathname === item.href;
              } else {
                 isActive = pathname.startsWith(item.href) && item.href !== "#";
              }
              if (["Event types", "Bookings", "Availability"].includes(item.name)) {
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-colors mb-1.5",
                      isActive
                        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900/40 dark:hover:text-white"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3.5 h-[1.125rem] w-[1.125rem] flex-shrink-0 stroke-[2]",
                        isActive ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400 dark:group-hover:text-zinc-300"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              }
              return null;
            })}
          </div>
          <button
            onClick={logoutState}
            className="group flex w-full items-center rounded-xl px-3.5 py-2.5 text-[15px] font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900/40 dark:hover:text-white transition-colors mt-auto"
          >
            <LogOut className="mr-3.5 h-[1.125rem] w-[1.125rem] flex-shrink-0 stroke-[2] text-zinc-500 dark:text-zinc-400 dark:group-hover:text-zinc-300" />
            Logout
          </button>
        </nav>
      </div>

      {/* Mobile Bottom Tab Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111] pb-4">
        {navigation.map((item) => {
          let isActive = false;
          if (item.matchExact) {
             isActive = pathname === item.href;
          } else {
             isActive = pathname.startsWith(item.href) && item.href !== "#";
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center pt-3 pb-2 gap-1.5 relative"
            >
              <item.icon
                className={cn(
                  "h-5 w-5 stroke-[2]",
                  isActive ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-500"
                )}
                aria-hidden="true"
              />
              <span className={cn("text-[10px] font-medium leading-none", isActive ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-500")}>
                {item.name}
              </span>
              {isActive && <div className="absolute top-0 w-8 h-[2px] bg-zinc-900 dark:bg-white rounded-b-sm" />}
            </Link>
          );
        })}
      </div>
    </>
  );
}
