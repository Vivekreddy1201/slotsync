"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchPublicUserEventTypes } from "@/lib/api";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PublicProfilePage() {
  const { username } = useParams() as { username: string };
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const events = await fetchPublicUserEventTypes(username);
        setEventTypes(events);
      } catch (err: any) {
        setError("User not found or no public events available.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [username]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center dark:bg-[#111] dark:text-white">Loading...</div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center dark:bg-[#111] dark:text-white">{error}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 pt-16 px-4 dark:bg-zinc-950 font-sans">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center font-bold text-3xl rounded-full bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-black">
          {username[0].toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{username}</h1>
        <p className="mt-2 text-[15px] text-zinc-500 dark:text-zinc-400">Welcome to my scheduling page. Please follow the instructions to add an event to my calendar.</p>
      </div>

      <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-xl shadow-sm dark:bg-[#111] dark:border-zinc-800 overflow-hidden">
        {eventTypes.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No active event types.</div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {eventTypes.map((event) => (
              <button
                key={event.id}
                onClick={() => router.push(`/${username}/${event.slug}`)}
                className="w-full flex items-start sm:items-center justify-between p-[24px] hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors text-left"
              >
                <div className="flex flex-col gap-2 pr-4">
                  <h3 className="text-[17px] font-bold text-zinc-900 dark:text-white leading-none">{event.title}</h3>
                  {event.description && (
                    <div 
                      className="text-[14px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-h-12 overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center text-zinc-500 dark:text-zinc-400 font-semibold text-sm">
                    <Clock className="h-4 w-4 mr-1.5" />
                    {event.duration_minutes}m
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
