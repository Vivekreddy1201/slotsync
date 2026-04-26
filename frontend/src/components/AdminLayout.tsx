"use client";

import { Sidebar } from "./Sidebar";
import { useAuth } from "./AuthProvider";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-[#111] dark:text-white">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin dark:border-zinc-800 dark:border-t-white"></div>
      </div>
    );
  }
  
  if (!user && !loading) {
    if (typeof window !== "undefined") {
       window.location.href = "/login";
    }
    return null;
  }

  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-white dark:bg-[#111]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-white md:bg-gray-50/50 pb-16 md:pb-0 dark:bg-[#111]">
        <div className="w-full h-full p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
