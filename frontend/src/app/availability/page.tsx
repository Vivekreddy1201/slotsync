"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/AdminLayout";
import { fetchSchedules, createSchedule, deleteSchedule, fetchAvailabilities, updateAvailabilities, setDefaultSchedule, updateSchedule, fetchEventTypes, updateEventType, fetchScheduleOverrides, updateScheduleOverrides } from "@/lib/api";
import { Globe, Save, Plus, Trash, MoreHorizontal, ArrowLeft, Copy, Edit2, Calendar, X } from "lucide-react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { DeleteModal } from "@/components/DeleteModal";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney"
];

function formatTime(time24: string) {
  if (!time24) return "";
  let [h, m] = time24.split(":");
  let hours = parseInt(h);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  return `${hours}:${m} ${ampm}`;
}

function formatAvailabilitySummary(availabilities: any[]) {
  if (!availabilities || availabilities.length === 0) return "No availability set";
  
  const groups: Record<string, number[]> = {};
  
  availabilities.forEach(av => {
    const start = formatTime(av.start_time.slice(0, 5));
    const end = formatTime(av.end_time.slice(0, 5));
    const key = `${start} - ${end}`;
    if (!groups[key]) groups[key] = [];
    
    // DB: 0=Mon, 6=Sun -> JS: 0=Sun, 1=Mon
    const calDay = av.day_of_week === 6 ? 0 : av.day_of_week + 1;
    groups[key].push(calDay);
  });

  const CAL_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const formatDays = (days: number[]) => {
    days.sort((a, b) => a - b);
    let parts = [];
    let rangeStart = days[0];
    let prev = days[0];

    for (let i = 1; i <= days.length; i++) {
       if (i < days.length && days[i] === prev + 1) {
          prev = days[i];
       } else {
          if (rangeStart === prev) {
             parts.push(CAL_DAYS[rangeStart]);
          } else {
             parts.push(`${CAL_DAYS[rangeStart]} - ${CAL_DAYS[prev]}`);
          }
          if (i < days.length) {
             rangeStart = days[i];
             prev = days[i];
          }
       }
    }
    return parts.join(", ");
  };

  const lines = Object.entries(groups).map(([timeStr, days]) => {
     return `${formatDays(days)}, ${timeStr}`;
  });

  return lines.join("\n");
}

function formatDynamicSummary(scheduleData: any[]) {
  const active = scheduleData.filter(d => d.enabled);
  if (active.length === 0) return "No availability set";
  const dummyAvails = active.map(d => ({
     day_of_week: d.day,
     start_time: d.start + ":00",
     end_time: d.end + ":00"
  }));
  return formatAvailabilitySummary(dummyAvails);
}

const generateTimeOptions = () => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hourStr = h.toString().padStart(2, "0");
      const minStr = m.toString().padStart(2, "0");
      const time24 = `${hourStr}:${minStr}`;
      
      let displayH = h % 12;
      if (displayH === 0) displayH = 12;
      const ampm = h < 12 ? "am" : "pm";
      const displayLabel = `${displayH}:${minStr}${ampm}`;
      options.push({ value: time24, label: displayLabel });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

const CustomTimeSelect = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && optionsRef.current[value]) {
       optionsRef.current[value]?.scrollIntoView({ block: "center" });
    }
  }, [open, value]);

  const selectedOption = TIME_OPTIONS.find(o => o.value === value);
  let displayLabel = value; 
  if (selectedOption) displayLabel = selectedOption.label;
  else if (value) {
     const [h, m] = value.split(":");
     const hh = parseInt(h);
     displayLabel = `${hh % 12 || 12}:${m}${hh < 12 ? 'am' : 'pm'}`;
  }

  return (
    <div className="relative" ref={containerRef}>
      <button 
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between min-w-[95px] rounded-lg border px-3 py-1.5 text-[14px] font-medium outline-none transition-colors",
          open 
            ? "border-zinc-900 bg-white dark:border-zinc-600 dark:bg-zinc-900 text-zinc-900 dark:text-white" 
            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
        )}
      >
        {displayLabel}
      </button>
      {open && (
        <div className="absolute top-[110%] left-0 min-w-[110px] max-h-[16rem] overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-[#1C1C1C] z-[100] p-1.5 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              ref={el => { optionsRef.current[opt.value] = el; }}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); 
                onChange(opt.value); 
                setOpen(false); 
              }}
              className={cn(
                "block w-full text-left px-3 py-2 text-[14px] rounded-md transition-colors",
                value === opt.value
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 font-medium"
                  : "text-zinc-700 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

function AvailabilityPageContent() {
  const searchParams = useSearchParams();
  const scheduleIdFromQuery = searchParams ? searchParams.get("scheduleId") : null;

  const [schedules, setSchedules] = useState<any[]>([]);
  const [scheduleSummaries, setScheduleSummaries] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Editor states
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [scheduleData, setScheduleData] = useState<{ day: number; enabled: boolean; start: string; end: string }[]>([]);
  const [editorLoading, setEditorLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // Date Overrides States
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [deleteScheduleId, setDeleteScheduleId] = useState<number | null>(null);
  const [overrideCurrentDate, setOverrideCurrentDate] = useState(new Date());
  const [overrideSelectedDates, setOverrideSelectedDates] = useState<Date[]>([]);
  const [overrideStart, setOverrideStart] = useState("09:00");
  const [overrideEnd, setOverrideEnd] = useState("17:00");
  const [overrideUnavailable, setOverrideUnavailable] = useState(false);
  const [overrides, setOverrides] = useState<any[]>([]);

  // Modal
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState("");

  // Bulk default update states
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [eventTypesToUpdate, setEventTypesToUpdate] = useState<any[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<number[]>([]);

  // Copy Dropdown States
  const [copyDropdownActive, setCopyDropdownActive] = useState<number | null>(null);
  const [copySelectedDays, setCopySelectedDays] = useState<number[]>([]);

  const toggleCopyDay = (dayIndex: number) => {
    if (copySelectedDays.includes(dayIndex)) {
      setCopySelectedDays(copySelectedDays.filter(d => d !== dayIndex));
    } else {
      setCopySelectedDays([...copySelectedDays, dayIndex]);
    }
  };

  const handleApplyCopy = (sourceDayIndex: number) => {
    const sourceEntry = scheduleData.find(e => e.day === sourceDayIndex);
    if (!sourceEntry) return;

    const newData = [...scheduleData];
    copySelectedDays.forEach(targetDayIndex => {
       if (targetDayIndex !== sourceDayIndex) {
         const targetEntryIndex = newData.findIndex(e => e.day === targetDayIndex);
         if (targetEntryIndex !== -1) {
            newData[targetEntryIndex] = {
               ...newData[targetEntryIndex],
               enabled: true,
               start: sourceEntry.start,
               end: sourceEntry.end
            };
         }
       }
    });
    setScheduleData(newData);
    setCopyDropdownActive(null);
  };

  const handleApplyDefaultAndBulkUpdate = async () => {
     if (!editingSchedule) return;
     try {
       await setDefaultSchedule(editingSchedule.id);
       
       for (const evtId of selectedEventTypes) {
          const evt = eventTypesToUpdate.find(e => e.id === evtId);
          if (evt) {
             await updateEventType(evtId, { ...evt, schedule_id: editingSchedule.id });
          }
       }
       
       setShowBulkUpdateModal(false);
       setEditingSchedule({...editingSchedule, is_default: true});
       loadSchedules();
     } catch (e) {
       alert("Error applying bulk update");
     }
  };

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await fetchSchedules();
      setSchedules(data);
      
      const events = await fetchEventTypes();
      setEventTypesToUpdate(events);
      
      const summaries: Record<number, string> = {};
      for (const sch of data) {
         try {
           const av = await fetchAvailabilities(sch.id);
           summaries[sch.id] = formatAvailabilitySummary(av);
         } catch {
           summaries[sch.id] = "Error loading times";
         }
      }
      setScheduleSummaries(summaries);

      if (scheduleIdFromQuery && !editingSchedule) {
         const targetId = Number(scheduleIdFromQuery);
         const targetSch = data.find((s: any) => s.id === targetId);
         if (targetSch) {
            openEditor(targetSch);
         }
      }
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  // Use click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown !== null) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeDropdown]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleName.trim()) return;
    try {
      const newSch = await createSchedule({ name: newScheduleName, timezone: "UTC" });
      
      const defaultAvail = [0, 1, 2, 3, 4].map(day => ({
        day_of_week: day,
        schedule_id: newSch.id,
        start_time: "09:00:00",
        end_time: "17:00:00"
      }));
      await updateAvailabilities(newSch.id, defaultAvail);
      
      setShowNewScheduleModal(false);
      setNewScheduleName("");
      await loadSchedules();
      openEditor(newSch);
    } catch (e) {
      alert("Error creating schedule");
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    setDeleteScheduleId(id);
  };

  const executeDeleteSchedule = async () => {
    if (deleteScheduleId === null) return;
    try {
      await deleteSchedule(deleteScheduleId);
      loadSchedules();
    } catch (e) {
      alert("Error deleting schedule");
    } finally {
      setDeleteScheduleId(null);
    }
  };

  const handleSetDefault = async (id: number) => {
      // Stubbed: This logic shifted to handleApplyDefaultAndBulkUpdate through the modal flow.
  };

  const handleDuplicate = async (schedule: any) => {
    try {
      const newSch = await createSchedule({ name: schedule.name + " (Copy)", timezone: schedule.timezone });
      const oldAv = await fetchAvailabilities(schedule.id);
      
      if (oldAv && oldAv.length > 0) {
         const payload = oldAv.map((a: any) => ({
           day_of_week: a.day_of_week,
           schedule_id: newSch.id,
           start_time: a.start_time,
           end_time: a.end_time
         }));
         await updateAvailabilities(newSch.id, payload);
      }
      
      loadSchedules();
    } catch (e) {
       alert("Failed to duplicate schedule");
    }
  };

  const openEditor = async (schedule: any) => {
    setEditingSchedule(schedule);
    setEditorLoading(true);
    try {
      const data = await fetchAvailabilities(schedule.id);
      const newSchedule = Array.from({ length: 7 }).map((_, i) => {
        const existing = data.find((d: any) => d.day_of_week === i);
        return {
          day: i,
          enabled: !!existing,
          start: existing ? existing.start_time.slice(0, 5) : "09:00",
          end: existing ? existing.end_time.slice(0, 5) : "17:00",
        };
      });
      setScheduleData(newSchedule);
      
      const ovData = await fetchScheduleOverrides(schedule.id);
      setOverrides(ovData);
    } catch (e) {
      console.error(e);
    } finally {
      setEditorLoading(false);
    }
  };

  const handleSaveEditor = async () => {
    if (!editingSchedule) return;
    setSaving(true);
    try {
      // 1. Update Core Metadata
      await updateSchedule(editingSchedule.id, {
        name: editingSchedule.name,
        timezone: editingSchedule.timezone,
        is_default: editingSchedule.is_default
      });

      // 2. Update Availability Payload
      const payload = scheduleData
        .filter((s) => s.enabled)
        .map((s) => ({
          day_of_week: s.day,
          schedule_id: editingSchedule.id,
          start_time: s.start + ":00",
          end_time: s.end + ":00",
        }));
        
      await updateAvailabilities(editingSchedule.id, payload);
      await updateScheduleOverrides(editingSchedule.id, overrides);
      
      alert("Saved successfully!");
      setEditingSchedule(null);
      loadSchedules(); // refresh summary
    } catch (e) {
      alert("Error saving");
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (index: number, field: string, value: any) => {
    const newData = [...scheduleData];
    (newData[index] as any)[field] = value;
    setScheduleData(newData);
  };

  if (editingSchedule) {
    const orderedDays = [6, 0, 1, 2, 3, 4, 5];

    return (
      <AdminLayout>
        <div className="pl-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center">
              <button 
                onClick={() => setEditingSchedule(null)}
                className="mr-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition"
              >
                <ArrowLeft className="h-[18px] w-[18px] stroke-[2]" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  {isRenaming ? (
                    <input
                      autoFocus
                      type="text"
                      className="text-[20px] font-bold text-zinc-900 dark:text-zinc-50 bg-transparent border-b-2 border-zinc-900 dark:border-white focus:outline-none w-full max-w-[200px]"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => {
                        setIsRenaming(false);
                        if (renameValue.trim()) setEditingSchedule({...editingSchedule, name: renameValue});
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setIsRenaming(false);
                          if (renameValue.trim()) setEditingSchedule({...editingSchedule, name: renameValue});
                        } else if (e.key === 'Escape') {
                          setIsRenaming(false);
                        }
                      }}
                    />
                  ) : (
                    <>
                      <h1 className="text-[20px] font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{editingSchedule.name}</h1>
                      <button 
                        onClick={() => {
                          setRenameValue(editingSchedule.name);
                          setIsRenaming(true);
                        }}
                        className="text-zinc-400 hover:text-zinc-600 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
                <p className="text-[14px] text-zinc-500 mt-0.5 font-medium whitespace-pre-line">
                  {formatDynamicSummary(scheduleData)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center cursor-pointer">
                <span className="mr-3 text-[14px] font-semibold text-zinc-700 dark:text-zinc-300">Set as default</span>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={editingSchedule.is_default || false} 
                    onChange={(e) => {
                       if (e.target.checked && !editingSchedule.is_default) {
                          if (eventTypesToUpdate.length === 0) {
                             handleApplyDefaultAndBulkUpdate();
                          } else {
                             setShowBulkUpdateModal(true);
                             setSelectedEventTypes(eventTypesToUpdate.map(ev => ev.id));
                          }
                       }
                    }} 
                  />
                  <div className={cn("block w-[38px] h-5 rounded-full transition", editingSchedule.is_default ? "bg-zinc-900 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-700")}></div>
                  <div className={cn("dot absolute top-[2px] bg-white dark:bg-black w-4 h-4 rounded-full transition", editingSchedule.is_default ? "left-[20px]" : "left-[2px]")}></div>
                </div>
              </label>
              <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
              <button
                onClick={() => {
                  handleDeleteSchedule(editingSchedule.id);
                  setEditingSchedule(null);
                }}
                className="flex items-center justify-center p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-500 dark:hover:bg-red-500/10 transition"
              >
                <Trash className="h-4 w-4" />
              </button>
              <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
              <button
                onClick={handleSaveEditor}
                disabled={saving}
                className="flex items-center justify-center rounded-full bg-zinc-900 dark:bg-white px-5 py-2 text-[14px] font-semibold text-white dark:text-black shadow-sm disabled:opacity-40 disabled:bg-zinc-300 disabled:text-zinc-600 transition"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="rounded-[20px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#111]">
            <div className="p-3 sm:p-4">
              {editorLoading ? (
                <div className="py-12 text-center text-[15px] font-medium text-zinc-500">Loading schedule...</div>
              ) : (
                orderedDays.map((dayIndex) => {
                  const i = scheduleData.findIndex(e => e.day === dayIndex);
                  if (i === -1) return null;
                  const entry = scheduleData[i];

                  return (
                    <div key={dayIndex} className="flex flex-col md:flex-row md:items-center py-4 px-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                      <div className="w-48 flex items-center mb-3 md:mb-0 shrink-0">
                        <label className="flex items-center cursor-pointer mr-4">
                          <div className="relative">
                            <input type="checkbox" className="sr-only" checked={entry.enabled} onChange={(e) => updateDay(i, "enabled", e.target.checked)} />
                            <div className={cn("block w-[42px] h-6 rounded-full transition-colors", entry.enabled ? "bg-zinc-900 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-800")}></div>
                            <div className={cn("dot absolute top-1 bg-white dark:bg-black w-4 h-4 rounded-full transition-transform", entry.enabled ? "left-[22px]" : "left-1")}></div>
                          </div>
                        </label>
                        <span className={cn("text-[15px]", entry.enabled ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400 font-medium")}>
                          {DAYS[entry.day]}
                        </span>
                      </div>
                      {entry.enabled ? (
                        <div className="flex items-center flex-wrap gap-3 flex-1">
                          <CustomTimeSelect
                            value={entry.start}
                            onChange={(val) => updateDay(i, "start", val)}
                          />
                          <span className="text-zinc-400">-</span>
                          <CustomTimeSelect
                            value={entry.end}
                            onChange={(val) => updateDay(i, "end", val)}
                          />
                          <button className="flex items-center justify-center w-8 h-8 rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition dark:hover:bg-zinc-800 dark:hover:text-white">
                            <Plus className="w-[18px] h-[18px]" />
                          </button>
                          
                          <div className="relative">
                            <button 
                              onClick={() => {
                                setCopyDropdownActive(copyDropdownActive === dayIndex ? null : dayIndex);
                                setCopySelectedDays([dayIndex]);
                              }}
                              className="flex items-center justify-center w-8 h-8 rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition dark:hover:bg-zinc-800 dark:hover:text-white"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            
                            {copyDropdownActive === dayIndex && (
                               <div className="absolute top-10 right-0 z-50 w-52 rounded-[16px] border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                                 <h4 className="text-[12px] font-bold tracking-wide text-zinc-500 uppercase mb-4 pl-1">Copy Times To</h4>
                                 
                                 <div className="space-y-3.5 mb-5 max-h-[250px] overflow-y-auto scrollbar-with-arrows">
                                   <label className="flex items-center cursor-pointer">
                                     <input 
                                       type="checkbox" 
                                       checked={copySelectedDays.length === 7}
                                       onChange={(e) => {
                                         if (e.target.checked) {
                                            setCopySelectedDays(orderedDays);
                                         } else {
                                            setCopySelectedDays([dayIndex]);
                                         }
                                       }}
                                       className="w-[18px] h-[18px] rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:checked:bg-white dark:checked:text-black transition" 
                                     />
                                     <span className="ml-3 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">Select all</span>
                                   </label>
                                   
                                   {orderedDays.map(dIndex => (
                                     <label key={dIndex} className={cn("flex items-center cursor-pointer", dIndex === dayIndex && "opacity-40 cursor-not-allowed")}>
                                       <input 
                                         type="checkbox" 
                                         disabled={dIndex === dayIndex}
                                         checked={copySelectedDays.includes(dIndex)}
                                         onChange={() => toggleCopyDay(dIndex)}
                                         className="w-[18px] h-[18px] rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:checked:bg-white dark:checked:text-black disabled:opacity-50 transition" 
                                       />
                                       <span className="ml-3 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">{DAYS[dIndex]}</span>
                                     </label>
                                   ))}
                                 </div>
                                 
                                 <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                   <button 
                                     onClick={() => setCopyDropdownActive(null)}
                                     className="text-[15px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
                                   >
                                     Cancel
                                   </button>
                                   <button 
                                     onClick={() => handleApplyCopy(dayIndex)}
                                     className="rounded-lg bg-zinc-800 px-5 py-2.5 text-[15px] font-semibold text-white shadow-sm hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition"
                                   >
                                     Apply
                                   </button>
                                 </div>
                               </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 text-[14px] font-medium text-zinc-400 dark:text-zinc-600">Unavailable</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-8 mb-8 border border-zinc-200 rounded-[20px] bg-white shadow-sm dark:border-zinc-800 dark:bg-[#111]">
            <div className="p-5 md:p-6 pb-4">
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-[16px] font-bold text-zinc-900 dark:text-white">Date overrides</h3>
              </div>
              <p className="text-[14px] text-zinc-500 font-medium mb-6">Add dates when your availability changes from your daily hours.</p>

              {overrides.length > 0 && (
                <div className="mb-6 space-y-2">
                  {overrides.map((ov, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/20">
                      <div className="flex items-center gap-3">
                         <Calendar className="h-5 w-5 text-zinc-400" />
                         <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                           {format(parseISO(ov.date), "MMMM d, yyyy")}
                         </span>
                      </div>
                      <div className="mt-3 sm:mt-0 flex items-center gap-5">
                         {ov.is_unavailable ? (
                           <div className="text-[14px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-md">Unavailable</div>
                         ) : (
                           <div className="text-[14px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-md">
                             {ov.start_time.slice(0,5)} - {ov.end_time.slice(0,5)}
                           </div>
                         )}
                         <button 
                           onClick={() => setOverrides(overrides.filter((_, i) => i !== idx))}
                           className="text-zinc-400 hover:text-red-500 transition-colors"
                         >
                           <Trash className="h-[18px] w-[18px]" />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => {
                  setOverrideSelectedDates([]);
                  setOverrideUnavailable(false);
                  setShowOverrideModal(true);
                }}
                className="flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-2.5 text-[14px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800/80 transition"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add an override
              </button>
            </div>
          </div>

          <div className="mt-8 mb-4">
             <h3 className="text-[16px] font-bold text-zinc-900 dark:text-white mb-3">Timezone</h3>
             <div className="relative max-w-sm">
               <Globe className="absolute left-3.5 top-3 h-[18px] w-[18px] text-zinc-500" />
               <select 
                 value={editingSchedule.timezone} 
                 onChange={(e) => setEditingSchedule({...editingSchedule, timezone: e.target.value})}
                 className="w-full appearance-none rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-[14px] font-medium text-zinc-700 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-[#111] dark:text-zinc-200"
               >
                 {TIMEZONES.map(tz => (
                   <option key={tz} value={tz}>{tz}</option>
                 ))}
               </select>
             </div>
          </div>
        </div>

        {showBulkUpdateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[85vh]">
              <div className="p-6 pb-4">
                <h2 className="text-[20px] font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Bulk update existing event types</h2>
                <p className="mt-1 text-[15px] text-zinc-500 font-medium">Update the schedules for the selected event types</p>

                <div className="mt-6 mb-2 ml-1">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedEventTypes.length === eventTypesToUpdate.length && eventTypesToUpdate.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedEventTypes(eventTypesToUpdate.map(ev => ev.id));
                        else setSelectedEventTypes([]);
                      }}
                      className="w-[18px] h-[18px] rounded border-zinc-300 text-blue-600 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:checked:bg-blue-600 transition"
                    />
                    <span className="ml-3.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">Select all</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2.5 px-6 pb-6 overflow-y-auto scrollbar-with-arrows flex-1">
                {eventTypesToUpdate.map((evt) => (
                  <div key={evt.id} className="flex items-center rounded-[12px] bg-zinc-50 dark:bg-zinc-800/40 p-[18px] border border-transparent dark:border-zinc-800 transition">
                    <label className="flex items-center flex-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedEventTypes.includes(evt.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedEventTypes([...selectedEventTypes, evt.id]);
                          else setSelectedEventTypes(selectedEventTypes.filter(id => id !== evt.id));
                        }}
                        className="w-[18px] h-[18px] rounded border-zinc-300 text-blue-600 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:checked:bg-blue-600 transition"
                      />
                      <span className="ml-3.5 text-[15px] text-zinc-700 dark:text-zinc-300 font-medium">{evt.title}</span>
                    </label>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-end gap-3 rounded-b-2xl bg-zinc-50/80 px-6 py-4 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
                <button 
                  onClick={() => setShowBulkUpdateModal(false)}
                  className="px-4 py-2 text-[15px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition"
                >
                  Close
                </button>
                <button 
                  onClick={handleApplyDefaultAndBulkUpdate}
                  className="rounded-xl bg-zinc-900 px-6 py-2.5 text-[15px] font-semibold text-white hover:bg-zinc-800 shadow-sm transition dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 border dark:border-zinc-800 flex overflow-hidden max-h-[85vh]">
             
             {/* Left Column: Calendar */}
             <div className="w-1/2 p-6 border-r border-zinc-100 dark:border-zinc-800 flex flex-col">
                <h2 className="text-xl font-bold dark:text-white mb-6">Select the dates you want to override</h2>
                <div className="flex-1 flex flex-col items-center">
                   
                   <div className="flex items-center justify-between w-full max-w-[280px] mb-4">
                     <button onClick={() => setOverrideCurrentDate(addDays(overrideCurrentDate, -30))} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                       <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                     </button>
                     <span className="font-semibold text-zinc-900 dark:text-white">
                        {format(overrideCurrentDate, "MMMM yyyy")}
                     </span>
                     <button onClick={() => setOverrideCurrentDate(addDays(overrideCurrentDate, 30))} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                       <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400 rotate-180" />
                     </button>
                   </div>

                   <div className="grid grid-cols-7 gap-1 w-full max-w-[280px]">
                     {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                       <div key={d} className="text-center text-[13px] font-semibold text-zinc-400 py-2">{d}</div>
                     ))}
                     
                     {Array.from({ length: startOfMonth(overrideCurrentDate).getDay() }).map((_, i) => (
                       <div key={`empty-${i}`} />
                     ))}

                     {eachDayOfInterval({ start: startOfMonth(overrideCurrentDate), end: endOfMonth(overrideCurrentDate) }).map((date, i) => {
                       const isSelected = overrideSelectedDates.some(d => isSameDay(d, date));
                       return (
                         <button
                           key={i}
                           onClick={() => {
                             if (isSelected) {
                               setOverrideSelectedDates(overrideSelectedDates.filter(d => !isSameDay(d, date)));
                             } else {
                               setOverrideSelectedDates([...overrideSelectedDates, date]);
                             }
                           }}
                           className={cn(
                             "w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-semibold transition-all",
                             isSelected 
                               ? "bg-zinc-900 text-white dark:bg-white dark:text-black" 
                               : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                           )}
                         >
                           {format(date, "d")}
                         </button>
                       );
                     })}
                   </div>

                </div>
             </div>

             {/* Right Column: Hours */}
             <div className="w-1/2 p-6 bg-zinc-50 dark:bg-black/20 flex flex-col relative">
                <button 
                  onClick={() => setShowOverrideModal(false)}
                  className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-[16px] font-semibold text-zinc-900 dark:text-white mb-6 mt-1">What hours are you available?</h3>

                <div className="flex-1 space-y-4">
                  {!overrideUnavailable ? (
                     <div className="flex items-center gap-3">
                        <input
                          type="time"
                          value={overrideStart}
                          onChange={(e) => setOverrideStart(e.target.value)}
                          className="rounded-lg border border-zinc-200 px-3 py-2 text-[14px] font-medium text-zinc-700 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 flex-1"
                        />
                        <span className="text-zinc-400">-</span>
                        <input
                          type="time"
                          value={overrideEnd}
                          onChange={(e) => setOverrideEnd(e.target.value)}
                          className="rounded-lg border border-zinc-200 px-3 py-2 text-[14px] font-medium text-zinc-700 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 flex-1"
                        />
                        <button className="flex items-center justify-center p-2 rounded-md text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900 transition dark:hover:bg-zinc-800 dark:hover:text-white">
                          <Trash className="w-4 h-4" />
                        </button>
                     </div>
                  ) : (
                    <div className="rounded-xl border border-zinc-200 bg-white/50 px-4 py-3 text-[14px] font-medium text-zinc-500 dark:border-zinc-800 dark:bg-black/50 text-center">
                       Marked as unavailable for the entire day.
                    </div>
                  )}

                  <div className="pt-2">
                    <button 
                       onClick={() => setOverrideUnavailable(!overrideUnavailable)}
                       className="text-[14px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
                    >
                      {overrideUnavailable ? "Available" : "Mark as unavailable"}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => {
                       const newPayload = overrideSelectedDates.map(date => ({
                          date: format(date, "yyyy-MM-dd"),
                          start_time: overrideUnavailable ? null : overrideStart + ":00",
                          end_time: overrideUnavailable ? null : overrideEnd + ":00",
                          is_unavailable: overrideUnavailable
                       }));
                       
                       // Filter out old overrides for these dates, then append new ones
                       const cleanOverrides = overrides.filter(ov => !newPayload.some(np => np.date === ov.date));
                       setOverrides([...cleanOverrides, ...newPayload]);
                       setShowOverrideModal(false);
                    }}
                    disabled={overrideSelectedDates.length === 0}
                    className="rounded-xl bg-zinc-900 px-6 py-2.5 text-[15px] font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50 transition dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    Add override
                  </button>
                </div>
             </div>

          </div>
        </div>
      )}
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="pl-1">
        {/* Mobile FAB (Extracted) */}
        <button
          onClick={() => setShowNewScheduleModal(true)}
          className="md:hidden fixed bottom-24 flex shadow-[0_4px_14px_rgba(0,0,0,0.5)] right-6 h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black hover:scale-105 transition-transform z-40"
        >
          <Plus className="h-6 w-6 stroke-[2]" />
        </button>

        {/* Desktop Header */}
        <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Availability</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Configure times when you are available for bookings.</p>
          </div>
          <button
            onClick={() => setShowNewScheduleModal(true)}
            className="hidden md:flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-[15px] font-medium text-white hover:bg-zinc-800 transition whitespace-nowrap shadow-sm shrink-0 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-500">Loading schedules...</div>
        ) : (
          <div className="flex flex-col overflow-hidden border-y border-transparent md:border-zinc-200 md:bg-white md:shadow-sm md:rounded-xl md:dark:border-zinc-800 md:dark:bg-[#111]">
            {schedules.length === 0 ? (
               <div className="py-12 text-center">
                 <p className="text-zinc-500">No schedules available.</p>
               </div>
            ) : (
              schedules.map((schedule, index) => (
                <div 
                  key={schedule.id}
                  className={cn(
                    "flex items-start justify-between p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition group",
                    index !== schedules.length - 1 ? "border-b border-zinc-100 dark:border-zinc-800" : ""
                  )}
                >
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => openEditor(schedule)}
                  >
                    <div className="flex items-center mb-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{schedule.name}</h3>
                      {schedule.is_default && (
                        <span className="ml-2.5 inline-flex items-center rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          Default
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 mb-1.5 whitespace-pre-line">
                      {scheduleSummaries[schedule.id] || "Loading..."}
                    </p>
                    
                    <div className="flex items-center text-sm text-zinc-500 dark:text-zinc-500 font-medium">
                      <Globe className="h-3.5 w-3.5 mr-1.5" />
                      {schedule.timezone}
                    </div>
                  </div>

                  <div className="relative shrink-0 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === schedule.id ? null : schedule.id);
                      }}
                      className="p-2 text-zinc-500 rounded-lg border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 transition shadow-sm"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {activeDropdown === schedule.id && (
                      <div className="absolute right-0 top-full mt-1.5 w-40 rounded-md border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950 z-50 overflow-hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(null);
                            openEditor(schedule);
                          }}
                          className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        >
                          <Edit2 className="mr-2 h-4 w-4 text-zinc-400" /> Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(null);
                            handleDuplicate(schedule);
                          }}
                          className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800"
                        >
                          <Copy className="mr-2 h-4 w-4 text-zinc-400" /> Duplicate
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(null);
                            handleDeleteSchedule(schedule.id);
                          }}
                          className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-500/10 border-t border-zinc-100 dark:border-zinc-800"
                        >
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showNewScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-zinc-900 border dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
               <h2 className="text-xl font-bold dark:text-white">Add a new schedule</h2>
            </div>
            <form onSubmit={handleCreateSchedule} className="p-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Name</label>
                <input
                  required
                  type="text"
                  value={newScheduleName}
                  onChange={(e) => setNewScheduleName(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2.5 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  placeholder="e.g. Weekend Hours"
                />
              </div>
              <div className="mt-8 flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewScheduleModal(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-900 px-6 py-2.5 text-[15px] font-semibold text-white shadow-sm hover:bg-zinc-800 transition dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteScheduleId !== null && (
        <DeleteModal
          title="Delete schedule?"
          description="Are you sure you want to delete this schedule? Event types using it will be affected."
          submitText="Delete schedule"
          onCancel={() => setDeleteScheduleId(null)}
          onConfirm={executeDeleteSchedule}
        />
      )}
    </AdminLayout>
  );
}

export default function AvailabilityPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AvailabilityPageContent />
    </Suspense>
  );
}
