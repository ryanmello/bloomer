"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {DatesSetArg, EventClickArg} from "@fullcalendar/core";
import type {DateClickArg} from "@fullcalendar/interaction";
import {useRef, useState, useEffect} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {toast} from "sonner";
import {format} from "date-fns";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";

import {
  CalendarArrowUp,
  CalendarArrowDown,
  Calendar,
  CalendarPlus,
} from "lucide-react";

type NewEvent = {
  title: string;
  notes?: string;
  start: string;
  end?: string;
};

type Mode = "create" | "edit";

/**
 * https://fullcalendar.io/docs/react
 * https://fullcalendar.io/docs
 */
export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar | null>(null);

  const [events, setEvents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: "",
    notes: "",
    start: "",
    end: "",
  });
  const [title, setTitle] = useState("");
  const calendarApi = () => calendarRef.current?.getApi();
  const [mode, setMode] = useState<Mode>("create");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const toDateTimeLocal = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm");

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/calendar");
      const data: Event[] = await res.json();
      if (res.ok) {
        setEvents(data);
      }
    } catch (error) {
      console.error("Event load failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const handleDateClick = (info: DateClickArg) => {
    // github.com/date-fns/date-fns/blob/main/examples/typescript/example.ts
    const start = new Date(info.date);
    start.setHours(9, 0, 0, 0);

    const end = new Date(start);
    end.setHours(12, 0, 0, 0);

    setMode("create");
    setEditingEventId(null);

    setNewEvent({
      title: "",
      notes: "",
      start: toDateTimeLocal(start),
      end: toDateTimeLocal(end),
    });

    setOpen(true);
  };

  const handleEventClick = (info: EventClickArg) => {
    const eventData = info.event;

    setMode("edit");
    setEditingEventId(eventData.id);

    setNewEvent({
      title: eventData.title ?? "",
      // note is custom fields (extendedProps)
      notes: (eventData.extendedProps?.notes as string) ?? "",
      start: eventData.start ? toDateTimeLocal(eventData.start) : "",
      end: eventData.end ? toDateTimeLocal(eventData.end) : "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const url =
      mode === "create" ? "/api/calendar" : `/api/calendar/${editingEventId}`;
    const res = await fetch(url, {
      method: mode === "create" ? "POST" : "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...newEvent,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.message || "Something went wrong");
      return;
    }
    setEvents((prev) => [...prev, data]);
    setOpen(false);
    const msg = mode === "create" ? "Event Created" : "Event Updated";
    toast.success(msg);
    fetchEvent();
  };

  const handleDelete = async () => {
    if (!editingEventId) return;

    const confirmed = confirm("Delete this event?");
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/calendar/${editingEventId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to delete");
        return;
      }

      toast.success("Event deleted");
      setOpen(false);
      await fetchEvent();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete event");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDatesSet = (info: DatesSetArg) => {
    setTitle(info.view.title);
  };

  function goNext() {
    calendarApi()?.next();
  }

  function goPrev() {
    calendarApi()?.prev();
  }

  function goToday() {
    calendarApi()?.today();
  }

  function viewMonth() {
    calendarApi()?.changeView("dayGridMonth");
  }

  function viewWeek() {
    calendarApi()?.changeView("timeGridWeek");
  }

  function viewDay() {
    calendarApi()?.changeView("timeGridDay");
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Calendar</h1>

        <Button onClick={() => setOpen(true)}>
          <CalendarPlus />
          Event
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={goPrev}>
            <CalendarArrowUp />
          </Button>
          <Button variant="outline" onClick={goNext}>
            <CalendarArrowDown />
          </Button>
          <Button variant="outline" onClick={goToday}>
            <Calendar />
          </Button>
        </div>
        <h2 className="text-xl font-semibold">{title}</h2>

        {/* View Toggle */}
        <div>
          <Tabs className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger
                value=""
                className="flex-1 sm:flex-initial"
                onClick={viewMonth}>
                Month
              </TabsTrigger>
              <TabsTrigger
                value=""
                className="flex-1 sm:flex-initial"
                onClick={viewWeek}>
                Week
              </TabsTrigger>
              <TabsTrigger
                value=""
                className="flex-1 sm:flex-initial"
                onClick={viewDay}>
                Day
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/*https://fullcalendar.io/docs/css-customization*/}
      {/* match dark mode */}
      <style jsx global>{`
        .fc .fc-col-header-cell {
          color: #000000;
        }

        .fc .fc-col-header-cell.fc-day-sun {
          color: #ef4444;
        }
      `}</style>

      {/* Calendar */}
      <div className="rounded-xl border bg-card text-card-foreground p-4 shadow-sm">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          height="auto"
          timeZone="local"
          dayMaxEvents={3}
          eventMaxStack={3}
          selectable
          editable={false}
          headerToolbar={false}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          events={events}
          datesSet={handleDatesSet}
        />
      </div>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Add Event" : "Edit Event"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Event Title"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({...newEvent, title: e.target.value})
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Notes"
                value={newEvent.notes}
                onChange={(e) =>
                  setNewEvent({...newEvent, notes: e.target.value})
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="start">Start</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={newEvent.start}
                  onChange={(e) =>
                    setNewEvent({...newEvent, start: e.target.value})
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="end">End</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={newEvent.end}
                  onChange={(e) =>
                    setNewEvent({...newEvent, end: e.target.value})
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            {mode === "edit" && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}>
                Delete
              </Button>
            )}

            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button
              variant="default"
              type="submit"
              disabled={isLoading}
              onClick={handleSave}>
              {isLoading ? "Saving..." : "Save Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
