"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

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

type NewEvent = {
  title: string;
  notes?: string;
  start: string;
  end?: string;
};

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
    const toDateTimeLocal = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm");
    const start = new Date(info.date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setHours(0, 0, 0, 0);

    setNewEvent({
      title: "",
      notes: "",
      start: toDateTimeLocal(start),
      end: toDateTimeLocal(end),
    });

    setOpen(true);
  };

  const handleSave = async () => {
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
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
    fetchEvent();
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Calendar</h1>

        <Button onClick={() => setOpen(true)}>+ Add Event</Button>
      </div>

      {/* Calendar */}
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        selectable
        editable
        headerToolbar={false}
        dateClick={handleDateClick}
        events={events}
      />

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Event Title"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({...newEvent, title: e.target.value})
              }
            />

            <Input
              placeholder="Notes"
              value={newEvent.notes}
              onChange={(e) =>
                setNewEvent({...newEvent, notes: e.target.value})
              }
            />

            <Label>Start</Label>
            <Input
              type="datetime-local"
              value={newEvent.start}
              onChange={(e) =>
                setNewEvent({...newEvent, start: e.target.value})
              }
            />

            <Label>End</Label>
            <Input
              type="datetime-local"
              value={newEvent.end}
              onChange={(e) => setNewEvent({...newEvent, end: e.target.value})}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="destructive">Cancel</Button>
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
