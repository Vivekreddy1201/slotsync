"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/AdminLayout";
import { fetchEventType, updateEventType, fetchSchedules, fetchAvailabilities, deleteEventType } from "@/lib/api";
import { DeleteModal } from "@/components/DeleteModal";
import { ArrowLeft, Save, Calendar, Clock, Globe, ExternalLink, Link as LinkIcon, Trash, Copy } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "basics", label: "Basics", icon: null },
  { id: "availability", label: "Availability", icon: Calendar },
  { id: "limits", label: "Limits", icon: Clock },
];

const BUFFER_OPTIONS = [
  { value: 0, label: "No buffer time" },
  { value: 5, label: "5 Minutes" },
  { value: 10, label: "10 Minutes" },
  { value: 15, label: "15 Minutes" },
  { value: 20, label: "20 Minutes" },
  { value: 30, label: "30 Minutes" },
  { value: 45, label: "45 Minutes" },
  { value: 60, label: "1 Hour" },
  { value: 90, label: "1.5 Hours" },
  { value: 120, label: "2 Hours" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatTime(time24: string) {
  if (!time24) return "";
  let [h, m] = time24.split(":");
  let hours = parseInt(h);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${m} ${ampm}`;
}

export default function EventTypeEditor() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params?.id);

  const [activeTab, setActiveTab] = useState("basics");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const updateFormatState = () => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
  };

  // Data states
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    if (editorRef.current && eventData && activeTab === "basics") {
      if (editorRef.current.innerHTML !== (eventData.description || "")) {
        editorRef.current.innerHTML = eventData.description || "";
      }
    }
  }, [eventData?.description, activeTab]);

  const handleCopyDescription = (e: React.MouseEvent) => {
    e.preventDefault();
    const textToCopy = editorRef.current?.innerText || eventData?.description || "";
    navigator.clipboard.writeText(textToCopy);
    alert("Description copied to clipboard!");
  };

  // Reference data
  const [schedules, setSchedules] = useState<any[]>([]);
  const [activeScheduleTimes, setActiveScheduleTimes] = useState<any[]>([]);
  const [scheduletLoading, setScheduleLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const loadAll = async () => {
      try {
        const [evt, schList] = await Promise.all([
          fetchEventType(eventId),
          fetchSchedules()
        ]);
        setEventData(evt);
        setSchedules(schList);

        if (evt.schedule_id) {
          loadScheduleTimes(evt.schedule_id);
        }
      } catch (e) {
        console.error("Failed to load event data", e);
        alert("Failed to load event type data.");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [eventId]);

  const loadScheduleTimes = async (scheduleId: number) => {
    setScheduleLoading(true);
    try {
      const times = await fetchAvailabilities(scheduleId);
      setActiveScheduleTimes(times || []);
    } catch (e) {
      console.error(e);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleDataChange = (field: string, value: any) => {
    setEventData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleScheduleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value ? Number(e.target.value) : null;
    handleDataChange("schedule_id", newId);
    if (newId) {
      loadScheduleTimes(newId);
    } else {
      setActiveScheduleTimes([]);
    }
  };

  const handleSave = async () => {
    if (!eventData) return;
    setSaving(true);
    try {
      // API payload
      const payload = {
        title: eventData.title,
        description: eventData.description,
        duration_minutes: eventData.duration_minutes,
        slug: eventData.slug,
        schedule_id: eventData.schedule_id || null,
        buffer_time_before: eventData.buffer_time_before || 0,
        buffer_time_after: eventData.buffer_time_after || 0,
      };

      await updateEventType(eventId, payload);
      alert("Event type saved successfully!");
    } catch (e) {
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    setShowDeleteModal(false);
    try {
      await deleteEventType(eventId);
      router.push("/");
    } catch (e) {
      alert("Failed to delete event type");
    }
  };

  const handleCopyLink = () => {
    if (!eventData) return;
    navigator.clipboard.writeText(`${window.location.origin}/${user?.username}/${eventData.slug}`);
    alert("Link copied to clipboard!");
  };

  const handleOpenLink = () => {
    if (!eventData) return;
    window.open(`/${user?.username}/${eventData.slug}`, "_blank");
  };

  if (loading || !eventData) {
    return (
      <AdminLayout>
        <div className="py-20 text-center text-zinc-500">Loading editor...</div>
      </AdminLayout>
    );
  }

  // Generate visual representation for Sunday through Saturday 
  // model uses 0=Mon, 6=Sun. We want to display starting Sunday (6), then 0-5.
  const displayDays = [6, 0, 1, 2, 3, 4, 5];

  return (
    <AdminLayout>
      <div className="pb-12 pl-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => router.push("/")}
              className="mr-4 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition"
              title="Back to Event Types"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 truncate">
              {eventData.title || "Untitled"}
            </h1>
          </div>
          <div className="flex items-center">
            <div className="flex items-center rounded-xl bg-zinc-900 dark:bg-[#1C1C1C] mr-3 border border-zinc-800 p-1">
              <button
                onClick={handleOpenLink}
                title="Preview public page"
                className="p-2 text-zinc-300 hover:text-white transition rounded-lg hover:bg-zinc-800"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
              <button
                onClick={handleCopyLink}
                title="Copy link"
                className="p-2 text-zinc-300 hover:text-white transition rounded-lg hover:bg-zinc-800"
              >
                <LinkIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                title="Delete event"
                className="p-2 text-red-400 hover:text-red-300 transition rounded-lg hover:bg-zinc-800 ml-1"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>

            <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 mr-4 hidden sm:block"></div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center rounded-xl bg-zinc-900 px-6 py-2.5 text-[15px] font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-300 transition"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 mb-8 overflow-x-auto">
          <nav className="flex space-x-6 px-2" aria-label="Tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                      : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-300 dark:hover:border-zinc-700"
                  )}
                >
                  {Icon && <Icon className={cn("mr-2 h-4 w-4", isActive ? "text-zinc-900 dark:text-white" : "text-zinc-400")} />}
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-[#111] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">

          {/* Basics Tab */}
          {activeTab === "basics" && (
            <div className="flex flex-col">
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <label className="mb-2 block text-[15px] font-bold text-zinc-900 dark:text-zinc-100">Title</label>
                  <input
                    type="text"
                    value={eventData.title}
                    onChange={(e) => handleDataChange("title", e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-[15px] focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-[#111] dark:text-white transition-shadow"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[15px] font-bold text-zinc-900 dark:text-zinc-100">Description</label>
                  <div className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 overflow-hidden focus-within:ring-1 focus-within:ring-zinc-900 dark:focus-within:border-zinc-600 bg-white dark:bg-[#111] transition-shadow">
                    <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-3 py-1.5 gap-1">
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold', false, undefined); updateFormatState(); }}
                        className={cn(
                          "flex items-center justify-center h-8 w-8 rounded font-serif font-bold text-lg transition-colors",
                          isBold
                            ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        )}
                        title="Bold"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic', false, undefined); updateFormatState(); }}
                        className={cn(
                          "flex items-center justify-center h-8 w-8 rounded font-serif italic text-lg transition-colors",
                          isItalic
                            ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        )}
                        title="Italic"
                      >
                        I
                      </button>
                      <div className="mx-1 my-1.5 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
                      <button
                        type="button"
                        onClick={handleCopyDescription}
                        className="flex items-center justify-center h-8 w-8 rounded text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => { handleDataChange("description", e.currentTarget.innerHTML); updateFormatState(); }}
                      onKeyUp={updateFormatState}
                      onMouseUp={updateFormatState}
                      className="w-full min-h-[100px] max-h-[300px] overflow-y-auto px-4 py-3 text-[15px] text-zinc-900 dark:text-white outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-500 scrollbar-with-arrows"
                      data-placeholder="A quick summary for your invitees..."
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[15px] font-bold text-zinc-900 dark:text-zinc-100">URL</label>
                  <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-800 overflow-hidden focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900 dark:focus-within:border-zinc-500 dark:focus-within:ring-zinc-500 transition-shadow">
                    <span className="pl-3 pr-0 py-2.5 text-[15px] text-zinc-500 font-medium bg-transparent flex items-center border-none">
                      slotsync.com/{user?.username}/
                    </span>
                    <input
                      type="text"
                      value={eventData.slug}
                      onChange={(e) => handleDataChange("slug", e.target.value)}
                      className="flex-1 pl-0 pr-3 py-2.5 text-[15px] font-medium focus:outline-none bg-transparent dark:text-zinc-200"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full border-t border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0a0a0a] py-6 sm:py-8 px-6 sm:px-8">
                <div>
                  <label className="mb-2 block text-[15px] font-bold text-zinc-900 dark:text-zinc-100">Duration</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={eventData.duration_minutes}
                      onChange={(e) => handleDataChange("duration_minutes", parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 pr-20 text-[15px] focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-[#111] dark:text-white transition-shadow"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <span className="text-zinc-500 text-[15px] font-medium">Minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Availability Tab */}
          {activeTab === "availability" && (
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-5">Availability</h2>

              <div className="mb-8">
                <div className="relative">
                  <select
                    value={eventData.schedule_id || ""}
                    onChange={handleScheduleChange}
                    className="w-full md:w-[400px] appearance-none rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
                  >
                    <option value="">Select a schedule</option>
                    {schedules.map(sch => (
                      <option key={sch.id} value={sch.id}>{sch.name} {sch.is_default ? " [Default]" : ""}</option>
                    ))}
                  </select>
                  {/* Custom arrow for select purely visual matching */}
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 md:hidden block">
                    <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {scheduletLoading ? (
                <div className="py-8 text-zinc-500 text-sm">Loading schedule times...</div>
              ) : eventData.schedule_id ? (
                <div className="w-full max-w-2xl text-sm border-t border-zinc-100 dark:border-zinc-800/50 pt-6">
                  {displayDays.map(dayIndex => {
                    const times = activeScheduleTimes.filter(t => t.day_of_week === dayIndex);
                    const dayName = dayIndex === 6 ? "Sunday" : DAYS[dayIndex];

                    return (
                      <div key={dayIndex} className="flex flex-col sm:flex-row py-3 group">
                        <div className="w-32 font-medium text-zinc-600 dark:text-zinc-400 mb-1 sm:mb-0">
                          {dayName}
                        </div>
                        <div className="flex-1">
                          {times.length === 0 ? (
                            <span className="text-zinc-400 dark:text-zinc-600">Unavailable</span>
                          ) : (
                            times.map((time, idx) => (
                              <div key={idx} className="flex items-center space-x-4 mb-2 last:mb-0 text-zinc-900 dark:text-zinc-200">
                                <span className="w-20">{formatTime(time.start_time)}</span>
                                <span className="text-zinc-400">-</span>
                                <span className="w-20">{formatTime(time.end_time)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="mt-8 border-t border-zinc-100 dark:border-zinc-800/50 pt-6 flex justify-start">
                    <button
                      onClick={() => router.push(`/availability?scheduleId=${eventData.schedule_id}`)}
                      className="text-sm font-semibold text-zinc-900 dark:text-white underline hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                      Edit availability
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-zinc-500 text-sm">No schedule assigned yet. Please select one above.</div>
              )}
            </div>
          )}

          {/* Limits Tab */}
          {activeTab === "limits" && (
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-5">Limits</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Before event
                  </label>
                  <select
                    value={eventData.buffer_time_before || 0}
                    onChange={(e) => handleDataChange("buffer_time_before", Number(e.target.value))}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
                  >
                    {BUFFER_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    After event
                  </label>
                  <select
                    value={eventData.buffer_time_after || 0}
                    onChange={(e) => handleDataChange("buffer_time_after", Number(e.target.value))}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
                  >
                    {BUFFER_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {showDeleteModal && (
        <DeleteModal
          title="Delete event type?"
          description="Anyone who you've shared this link with will no longer be able to book using it."
          submitText="Delete event type"
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={executeDelete}
        />
      )}
    </AdminLayout>
  );
}
