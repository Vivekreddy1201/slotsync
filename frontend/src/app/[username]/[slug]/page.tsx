"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchPublicEventType, fetchPublicSlots, createPublicBooking, fetchAvailabilities } from "@/lib/api";
import { Calendar as CalendarIcon, Clock, Globe, ArrowLeft, CheckCircle, Video, UserPlus } from "lucide-react";
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "Europe/London", "Europe/Paris",
  "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney"
];

export default function BookingPage() {
  const { username, slug } = useParams() as { username: string, slug: string };
  const [eventType, setEventType] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableDaysOfWeek, setAvailableDaysOfWeek] = useState<number[]>([]);

  // Step 1: Calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<{ start_time: string, end_time: string }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("UTC");
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");

  // Step 2: Form
  const [step, setStep] = useState<"calendar" | "form" | "success">("calendar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEventType();
  }, [slug]);

  const loadEventType = async () => {
    try {
      const data = await fetchPublicEventType(username, slug);
      setEventType(data);
      if (data.schedule_id) {
        try {
          const availInfo = await fetchAvailabilities(data.schedule_id);
          setAvailableDaysOfWeek(availInfo.map((a: any) => a.day_of_week));
        } catch (e) {
          // If public API lacks access, fallback silently
        }
      }
    } catch {
      setError("Event type not found or is inactive.");
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (date: Date) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const targetDate = format(date, "yyyy-MM-dd");
      const data = await fetchPublicSlots(username, slug, targetDate);

      const now = new Date();
      const validSlots = (data.slots || []).filter((s: { start_time: string, end_time: string }) => {
        const slotTime = new Date(s.start_time);
        return slotTime > now;
      });
      setSlots(validSlots);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    loadSlots(date);
  };

  const handleSlotSelect = (startTime: string) => {
    setSelectedSlot(startTime);
  };

  const handleContinue = () => {
    if (selectedSlot) setStep("form");
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      await createPublicBooking({
        event_type_id: eventType.id,
        booker_name: name,
        booker_email: email,
        start_time: selectedSlot
      });
      setStep("success");
    } catch (e: any) {
      alert(e.message || "Failed to book");
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = addDays(monthStart, -monthStart.getDay());
  const endDate = addDays(monthEnd, 6 - monthEnd.getDay());
  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  if (loading) return <div className="flex h-screen items-center justify-center dark:bg-zinc-950 dark:text-white">Loading...</div>;
  if (error || !eventType) return <div className="flex h-screen items-center justify-center dark:bg-zinc-950 dark:text-white">{error}</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950 font-sans">
      {step === "success" ? (
        <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#111]">
          <div className="p-8 md:p-12 text-center flex flex-col items-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">This meeting is scheduled</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">We sent an email with a calendar invitation to <span className="font-medium text-zinc-900 dark:text-zinc-200">{email}</span>.</p>
            <div className="w-full max-w-md border border-zinc-200 rounded-lg p-6 text-left dark:border-zinc-800">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-4">{eventType.title}</h3>
              <div className="flex items-center text-zinc-600 dark:text-zinc-400 mb-3 font-medium">
                <CalendarIcon className="mr-3 h-5 w-5" />
                <span>{format(parseISO(selectedSlot!), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center text-zinc-600 dark:text-zinc-400 mb-3 font-medium">
                <Clock className="mr-3 h-5 w-5" />
                <span>{format(parseISO(selectedSlot!), "h:mm a")}</span>
              </div>
              <div className="flex items-center text-zinc-600 dark:text-zinc-400 font-medium">
                <Globe className="mr-3 h-5 w-5" />
                <span>{timezone}</span>
              </div>
            </div>
            <div className="mt-8 border-t border-zinc-100 dark:border-zinc-800/50 pt-8 w-full max-w-md">
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className={cn(
          "flex flex-col md:flex-row overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all duration-300",
          selectedDate && step === "calendar" ? "max-w-[1020px]" : "max-w-[800px]",
          "w-full"
        )}>
          {/* Left Panel - Details */}
          <div className="w-full md:w-[320px] shrink-0 border-b md:border-b-0 md:border-r border-zinc-200 p-8 dark:border-zinc-800 flex flex-col">
            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center font-bold text-xl rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black">
                C
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm">{username}</p>
              <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white leading-tight">{eventType.title}</h1>
            </div>

            <div className="space-y-4 font-semibold text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center">
                <Clock className="mr-3 h-5 w-5 text-zinc-400" />
                {eventType.duration_minutes} min
              </div>
              <div className="flex items-center">
                <Video className="mr-3 h-5 w-5 text-zinc-400" />
                Web conferencing details provided upon confirmation.
              </div>
              {selectedSlot && step === "form" && (
                <div className="flex items-start text-zinc-900 dark:text-white text-[15px] font-bold">
                  <CalendarIcon className="mr-3 h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span>{format(parseISO(selectedSlot), "EEEE, MMMM d, yyyy")}</span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-semibold">
                      {format(parseISO(selectedSlot), "h:mm")} – {format(addMinutes(parseISO(selectedSlot), eventType.duration_minutes), "h:mma").toLowerCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {eventType.description && (
              <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {eventType.description}
              </p>
            )}
          </div>

          {/* Right Panel - Calendar or Form */}
          <div className="flex-1 p-8">
            {step === "calendar" ? (
              <div className="flex flex-col md:flex-row gap-8 h-full">
                {/* Calendar Column */}
                <div className="flex-1 min-w-[320px]">
                  <h2 className="mb-6 text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Select a Date & Time</h2>
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      onClick={() => setCurrentDate(addDays(currentDate, -30))}
                      className="p-1 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white transition"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {format(currentDate, "MMMM yyyy")}
                    </span>
                    <button
                      onClick={() => setCurrentDate(addDays(currentDate, 30))}
                      className="p-1 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white transition"
                    >
                      <ArrowLeft className="h-5 w-5 rotate-180" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 mt-6 uppercase tracking-wider">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-y-2 gap-x-1 justify-items-center">
                    {days.map((day, i) => {
                      const isCurrentMonth = isSameMonth(day, monthStart);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                      const jsDay = day.getDay();
                      const pythonDay = jsDay === 0 ? 6 : jsDay - 1;
                      // Fallback to true if availableDaysOfWeek is completely empty just in case API failed
                      const hasSchedule = availableDaysOfWeek.length === 0 || availableDaysOfWeek.includes(pythonDay);

                      const isDisabled = !isCurrentMonth || isPast || !hasSchedule;

                      return (
                        <button
                          key={i}
                          disabled={isDisabled}
                          onClick={() => handleDateSelect(day)}
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-lg text-[15px] transition-all",
                            isDisabled
                              ? "text-zinc-300 dark:text-zinc-500 cursor-not-allowed bg-transparent font-normal"
                              : isSelected
                                ? "bg-zinc-900 text-white dark:bg-white dark:text-black font-bold"
                                : "text-zinc-900 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-200 dark:bg-[#333] dark:hover:bg-zinc-700 font-semibold"
                          )}
                        >
                          {format(day, dateFormat)}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-8 flex items-center text-sm font-medium">
                    <Globe className="h-4 w-4 text-zinc-400 mr-2" />
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="bg-transparent border-none text-zinc-900 focus:ring-0 cursor-pointer font-semibold dark:text-zinc-200 outline-none max-w-[200px] truncate"
                    >
                      {TIMEZONES.map(tz => (
                        <option key={tz} value={tz} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-200 font-medium">
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Time Slots Column (Third Column) */}
                {selectedDate && (
                  <div className="w-[200px] flex flex-col pt-14 animate-in fade-in slide-in-from-right-4 duration-300 h-[480px]">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                        {format(selectedDate, "EEE d")}
                      </h3>
                      <div className="flex items-center rounded-full bg-zinc-100 p-[3px] dark:bg-[#1a1a1a]">
                        <button
                          onClick={() => setTimeFormat("12h")}
                          className={cn("px-2.5 py-1 text-xs font-semibold rounded-full transition-colors", timeFormat === "12h" ? "bg-white text-black shadow-sm dark:bg-[#333] dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200")}
                        >
                          12h
                        </button>
                        <button
                          onClick={() => setTimeFormat("24h")}
                          className={cn("px-2.5 py-1 text-xs font-semibold rounded-full transition-colors", timeFormat === "24h" ? "bg-white text-black shadow-sm dark:bg-[#333] dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200")}
                        >
                          24h
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
                      {slotsLoading ? (
                        <div className="text-sm font-medium text-zinc-500 text-center py-4">Loading times...</div>
                      ) : slots.length === 0 ? (
                        <div className="text-sm font-medium text-zinc-500 text-center py-4">No times available</div>
                      ) : (
                        slots.map((s, i) => (
                          <div key={i} className="flex gap-2">
                            <button
                              onClick={() => handleSlotSelect(s.start_time)}
                              className={cn(
                                "flex-1 rounded-md border py-3 text-center text-sm font-bold transition-all",
                                selectedSlot === s.start_time
                                  ? "border-zinc-900 bg-zinc-600 text-white w-1/2 dark:bg-zinc-700 dark:border-zinc-700"
                                  : "border-zinc-300 text-zinc-900 hover:border-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
                              )}
                            >
                              {timeFormat === "12h"
                                ? format(parseISO(s.start_time), "h:mma").toLowerCase()
                                : format(parseISO(s.start_time), "HH:mm")}
                            </button>
                            {selectedSlot === s.start_time && (
                              <button
                                onClick={handleContinue}
                                className="flex-1 rounded-md bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                              >
                                Next
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Form Column
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-[400px] w-full pt-4">
                <form onSubmit={handleBook} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="block text-[15px] font-bold text-zinc-900 dark:text-zinc-100">Your name *</label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-[15px] focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-[#111] dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[15px] font-bold text-zinc-900 dark:text-zinc-100">Email address *</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-[15px] focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-[#111] dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[15px] font-bold text-zinc-900 dark:text-zinc-100">Additional notes</label>
                    <textarea
                      rows={4}
                      placeholder="Please share anything that will help prepare for our meeting."
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-[15px] focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-[#111] dark:text-zinc-300 placeholder:text-zinc-500 resize-none"
                    />
                  </div>

                  <p className="pt-2 pb-2 text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">
                    By proceeding, you agree to SlotSync's <span className="text-zinc-900 dark:text-zinc-200">Terms</span> and <span className="text-zinc-900 dark:text-zinc-200">Privacy Policy</span>.
                  </p>

                  <div className="pt-2 flex justify-end items-center gap-6">
                    <button
                      type="button"
                      onClick={() => setStep("calendar")}
                      className="text-[15px] font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-full bg-zinc-900 px-5 py-2.5 text-[15px] font-bold text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    >
                      {submitting ? "Confirming..." : "Confirm"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
