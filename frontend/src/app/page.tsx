"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/AdminLayout";
import { fetchEventTypes, deleteEventType, createEventType } from "@/lib/api";
import { DeleteModal } from "@/components/DeleteModal";
import { Clock, Copy, Link as LinkIcon, MoreHorizontal, Plus, Trash, Edit2, Check, ExternalLink, Search } from "lucide-react";
import { cn } from "@/lib/utils";

import { useAuth } from "@/components/AuthProvider";

export default function EventTypesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [saving, setSaving] = useState(false);

  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const updateFormatState = () => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
  };

  const loadData = async () => {
    try {
      const eventsData = await fetchEventTypes();
      setEventTypes(eventsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false);
      }
    };

    if (showModal) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal]);

  const handleDelete = async (id: number) => {
    setDeleteTargetId(id);
  };

  const executeDelete = async () => {
    if (deleteTargetId === null) return;
    try {
      await deleteEventType(deleteTargetId);
      loadData();
    } catch (e) {
      alert("Failed to delete");
    } finally {
      setDeleteTargetId(null);
    }
  };

  const openNewForm = () => {
    setTitle("");
    setSlug("");
    setDescription("");
    setDuration(30);
    setIsBold(false);
    setIsItalic(false);
    setShowModal(true);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = "";
    }, 0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title,
      description,
      duration_minutes: duration,
      slug,
      // Minimal defaults for new events
    };
    try {
      const newEvent = await createEventType(payload);
      setShowModal(false);
      // Redirect to detailed page instead of doing it inline
      router.push(`/events/${newEvent.id}`);
    } catch (e: any) {
      alert(e.message || "Failed to create event type");
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (t: string) => {
    setTitle(t);
    setSlug(t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
  };

  const copyToClipboard = (id: number, slug: string) => {
    const url = `${window.location.origin}/${user?.username}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEventTypes = eventTypes.filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      {/* Mobile FAB (Extracted outside hidden header) */}
      <button
        onClick={openNewForm}
        className="md:hidden fixed bottom-24 flex shadow-[0_4px_14px_rgba(0,0,0,0.5)] right-6 h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black hover:scale-105 transition-transform z-40"
      >
        <Plus className="h-6 w-6 stroke-[2]" />
      </button>

      {/* Desktop Header */}
      <div className="hidden md:flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-900 dark:text-white tracking-tight">Event types</h1>
          <p className="text-[15px] text-zinc-500 dark:text-zinc-400 mt-1">Configure different events for people to book on your calendar.</p>
        </div>
        <div className="flex items-center gap-3 mt-1 md:mt-0">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full md:w-64 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-transparent dark:bg-zinc-900/80 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-500"
            />
          </div>
          <button
            onClick={openNewForm}
            className="hidden md:flex items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-[14px] font-semibold text-white hover:bg-zinc-800 transition whitespace-nowrap shadow-sm dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            <Plus className="mr-1.5 h-[18px] w-[18px]" strokeWidth={2.5} />
            New
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-zinc-500">Loading...</div>
      ) : eventTypes.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-[#111]">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">No event types yet</h3>
          <p className="mt-2 text-sm text-zinc-500">Get started by creating your first event type.</p>
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden border-y border-transparent md:border-zinc-200 md:bg-white md:shadow-sm md:rounded-xl md:dark:border-zinc-800 md:dark:bg-[#111]">
          {filteredEventTypes.map((event, index) => (
            <div
              key={event.id}
              className={cn(
                "group flex items-start sm:items-center justify-between p-[20px] hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer",
                index !== filteredEventTypes.length - 1 ? "border-b border-zinc-100 dark:border-zinc-800" : ""
              )}
              onClick={() => router.push(`/events/${event.id}`)}
            >
              <div className="flex flex-col gap-2 pr-4 flex-1">
                <div className="flex items-center flex-wrap gap-2 leading-none">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-none">{event.title}</h3>
                  <span className="text-[14px] text-zinc-500 leading-none mr-2">/{event.slug}</span>
                </div>
                {event.description && (
                  <div 
                    className="text-[15px] text-zinc-600 dark:text-zinc-400 mt-1 leading-tight line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: event.description }}
                  />
                )}
                <div className="mt-1 flex items-center">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1 text-[13px] font-medium text-zinc-600 dark:text-zinc-300">
                    <Clock className="h-[14px] w-[14px]" />
                    {event.duration_minutes}m
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className="hidden md:flex items-center rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm relative">
                  <a
                    href={`/${user?.username}/${event.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 transition rounded-l-md"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-[18px] w-[18px] stroke-[2px]" />
                  </a>
                  <div className="w-[1px] h-[34px] bg-zinc-200 dark:bg-zinc-800" />
                  <button
                    onClick={() => copyToClipboard(event.id, event.slug)}
                    className="p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 transition"
                    title="Copy link"
                  >
                    {copiedId === event.id ? <Check className="h-[18px] w-[18px] text-green-500 stroke-[2px]" /> : <LinkIcon className="h-[18px] w-[18px] stroke-[2px]" />}
                  </button>
                  <div className="w-[1px] h-[34px] bg-zinc-200 dark:bg-zinc-800" />
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === event.id ? null : event.id)}
                      className="p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 transition rounded-r-md"
                    >
                      <MoreHorizontal className="h-[18px] w-[18px] stroke-[2px]" />
                    </button>
                    
                    {/* Dropdown Menu (Shared) */}
                    {activeDropdown === event.id && (
                      <div className="relative z-50">
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActiveDropdown(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-36 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950 z-50 overflow-hidden">
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/events/${event.id}`); setActiveDropdown(null); }}
                              className="flex w-full items-center px-4 py-2.5 text-[15px] font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                            >
                              <Edit2 className="mr-2 h-4 w-4" /> Edit
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(event.id); setActiveDropdown(null); }}
                              className="flex w-full items-center px-4 py-2.5 text-[15px] font-medium text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-500/10 border-t border-zinc-100 dark:border-zinc-800"
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </button>
                          </div>
                        </>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Basic Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[540px] rounded-2xl bg-white shadow-2xl dark:bg-[#1C1C1C] border dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
            <form onSubmit={handleSave} className="overflow-y-auto flex-1 w-full flex flex-col scrollbar-with-arrows">
              <div className="px-6 pt-6 shrink-0">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Add a new event type</h2>
                <p className="text-[15px] text-zinc-500 dark:text-zinc-400 mt-2">Set up event types to offer different types of meetings.</p>
              </div>
              <div className="px-6 py-6 space-y-4">
                <div>
                <label className="mb-2 block text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => generateSlug(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-[15px] focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-[#111] dark:text-white dark:focus:border-zinc-600"
                  placeholder="Quick chat"
                />
              </div>
              <div>
                <label className="mb-2 block text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">URL</label>
                <div className="flex rounded-xl border border-zinc-300 dark:border-zinc-800 overflow-hidden focus-within:ring-1 focus-within:ring-zinc-900 dark:focus-within:border-zinc-600">
                  <span className="bg-zinc-50 px-4 py-3 text-[15px] text-zinc-500 dark:bg-[#111] border-r dark:border-zinc-800">
                    slotsync.com/{user?.username}/
                  </span>
                  <input
                    required
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 px-4 py-3 text-[15px] focus:outline-none dark:bg-[#111] dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">Description</label>
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
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => { setDescription(e.currentTarget.innerHTML); updateFormatState(); }}
                    onKeyUp={updateFormatState}
                    onMouseUp={updateFormatState}
                    className="w-full min-h-[48px] max-h-[200px] overflow-y-auto px-4 py-3 text-[15px] text-zinc-900 dark:text-white outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-500 scrollbar-with-arrows"
                    data-placeholder="A quick video meeting."
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">Duration</label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full rounded-xl border border-zinc-300 pl-4 pr-20 py-3 text-[15px] focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-[#111] dark:text-white dark:focus:border-zinc-600"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] text-zinc-500 dark:text-zinc-400 font-medium">
                    minutes
                  </span>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-transparent dark:border-zinc-800/50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-[15px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-zinc-900 px-6 py-2.5 text-[15px] font-semibold text-white shadow-sm hover:bg-zinc-800 transition dark:bg-white dark:text-black dark:hover:bg-zinc-200 disabled:opacity-50"
                >
                  {saving ? "..." : "Continue"}
                </button>
              </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTargetId !== null && (
        <DeleteModal
          title="Delete event type?"
          description="Anyone who you've shared this link with will no longer be able to book using it."
          submitText="Delete event type"
          onCancel={() => setDeleteTargetId(null)}
          onConfirm={executeDelete}
        />
      )}
    </AdminLayout>
  );
}
