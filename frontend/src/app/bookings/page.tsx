"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { fetchBookings, cancelBooking } from "@/lib/api";
import { DeleteModal } from "@/components/DeleteModal";
import { Calendar, Clock, Video, User, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "canceled">("upcoming");
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchBookings();
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    setCancelTargetId(id);
  };

  const executeCancel = async () => {
    if (cancelTargetId === null) return;
    try {
      await cancelBooking(cancelTargetId);
      loadData();
    } catch {
      alert("Failed to cancel");
    } finally {
      setCancelTargetId(null);
    }
  };

  const tabs = [
    { id: "upcoming", label: "Upcoming" },
    { id: "past", label: "Past" },
    { id: "canceled", label: "Canceled" },
  ];

  const filteredBookings = bookings.filter((b) => {
    const isFuture = new Date(b.end_time) > new Date();
    if (activeTab === "upcoming") return b.status === "confirmed" && isFuture;
    if (activeTab === "past") return b.status === "confirmed" && !isFuture;
    if (activeTab === "canceled") return b.status === "cancelled";
    return false;
  });

  return (
    <AdminLayout>
      <div className="mb-8 pl-1 hidden md:block">
        <h1 className="text-[24px] font-bold text-zinc-900 dark:text-white tracking-tight">Bookings</h1>
        <p className="text-[15px] text-zinc-500 dark:text-zinc-400 mt-1">See upcoming and past events booked through your event type links.</p>
      </div>

      <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center bg-transparent border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl bg-zinc-50/50 dark:bg-[#1C1C1C]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-1.5 text-[14px] font-medium rounded-lg transition-all",
                activeTab === tab.id 
                  ? "bg-white text-zinc-900 shadow-sm border border-zinc-200 dark:bg-zinc-800 dark:text-white dark:border-zinc-700" 
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border-t border-dashed border-zinc-200 bg-white/50 dark:border-zinc-800/50 dark:bg-transparent overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="py-24 text-center text-zinc-500 font-medium">Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 px-4 text-center">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/50 mb-6 border border-zinc-200/50 dark:border-zinc-800">
              <Calendar className="h-8 w-8 text-zinc-700 dark:text-zinc-300" strokeWidth={1.75} />
            </div>
            <h2 className="text-[20px] font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">
              No {activeTab} bookings
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-[420px] text-[15px] leading-relaxed">
              You have no {activeTab} bookings. As soon as someone books a time with you it will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-4 mt-2">
            {filteredBookings.map((b) => (
              <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#111]">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-[15px] font-bold text-zinc-900 dark:text-white">
                    <div className={cn("h-2.5 w-2.5 rounded-full", activeTab === "canceled" ? "bg-red-500" : (activeTab === "past" ? "bg-zinc-400" : "bg-green-500"))}></div>
                    {format(parseISO(b.start_time), "EEEE, MMMM d, yyyy")}
                  </div>
                  <div className="flex flex-wrap items-center gap-5 text-[14px] text-zinc-600 dark:text-zinc-400 font-medium">
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded-md">
                      <Clock className="mr-1.5 h-4 w-4" />
                      {format(parseISO(b.start_time), "h:mm a")} - {format(parseISO(b.end_time), "h:mm a")}
                    </div>
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded-md">
                      <User className="mr-1.5 h-4 w-4" />
                      {b.booker_name}
                    </div>
                  </div>
                </div>
                {activeTab === "upcoming" && (
                  <div className="mt-5 sm:mt-0 flex gap-2">
                    <button
                      onClick={() => handleCancel(b.id)}
                      className="flex items-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-[14px] font-semibold text-zinc-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                    >
                      <XCircle className="mr-2 h-4 w-4 stroke-[2]" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {cancelTargetId !== null && (
        <DeleteModal
          title="Cancel this booking?"
          description="The user will be notified that this booking has been canceled. Your schedule will be freed up."
          submitText="Cancel booking"
          onCancel={() => setCancelTargetId(null)}
          onConfirm={executeCancel}
        />
      )}
    </AdminLayout>
  );
}
